const { dbSelect, dbUpdate, dbInsert } = require('../lib/db');
const { requireAuth } = require('../lib/auth');
const { llamarClaude } = require('../lib/ai');

const RUBRO_LABELS = {
  empresa_familiar: 'empresa familiar / PyME',
  estudio_contable: 'estudio contable',
  estudio_abogados: 'estudio de abogados (societario)',
  consultora_familiar: 'consultora de empresa familiar',
};

module.exports = async function handler(req, res) {
  const usuario = await requireAuth(req, res);
  if (!usuario) return;

  if (req.method === 'GET') {
    const prospectos = await dbSelect('prospectos', 'order=created_at.desc&limit=300');
    return res.status(200).json({ prospectos });
  }

  if (req.method === 'PATCH') {
    const { id, estado } = req.body || {};
    await dbUpdate('prospectos', `id=eq.${id}`, { estado });
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'POST') {
    if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'Falta ANTHROPIC_API_KEY' });
    const { zonas = [], rubros = [] } = req.body || {};
    if (!zonas.length || !rubros.length) {
      return res.status(400).json({ error: 'Elegí al menos una zona y un rubro' });
    }

    const rubrosTexto = rubros.map((r) => RUBRO_LABELS[r] || r).join(', ');
    const prompt = `Buscá en internet organizaciones reales en Argentina, en estas zonas: ${zonas.join(', ')}.
Rubros a buscar: ${rubrosTexto}.

Si el rubro es "empresa familiar / PyME", buscá empresas familiares o PyMEs con más
de una generación involucrada (posibles clientas directas de una psicóloga
especializada en conflictos societarios y familiares en la empresa).
Si el rubro es un estudio contable, de abogados societarios, o una consultora de
empresa familiar, buscalos como posibles DERIVADORES.

Devolvé SOLO un JSON válido (sin texto adicional, sin backticks):
{"resultados": [{"nombre": "...", "rubro": "empresa_familiar|estudio_contable|estudio_abogados|consultora_familiar", "zona": "...", "email": "... o null", "telefono": "... o null", "sitio_web": "... o null", "fuente": "de qué sitio salió"}]}

Máximo 20 resultados. No inventes datos: si no encontrás mail o teléfono, poné null.`;

    let parsed;
    try {
      const data = await llamarClaude({
        messages: [{ role: 'user', content: prompt }],
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        maxTokens: 4000,
      });
      const text = data.content?.filter((b) => b.type === 'text').map((b) => b.text).join('\n') || '{}';
      const match = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(match ? match[0] : text);
    } catch (err) {
      console.error(err);
      return res.status(502).json({ error: 'Error en la búsqueda' });
    }

    const resultados = (parsed.resultados || []).map((r) => ({
      nombre: r.nombre,
      rubro: r.rubro,
      zona: r.zona,
      email: r.email || null,
      telefono: r.telefono || null,
      sitio_web: r.sitio_web || null,
      fuente: r.fuente || 'búsqueda IA',
      estado: 'sin_contactar',
    }));

    if (resultados.length) await dbInsert('prospectos', resultados);
    return res.status(200).json({ ok: true, encontrados: resultados.length });
  }

  res.status(405).end();
};
