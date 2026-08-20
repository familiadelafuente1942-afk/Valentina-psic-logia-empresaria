// Corre la búsqueda de prospección con una configuración por defecto.
// Desactivado por default: para activarlo, sumar un cron en vercel.json
// apuntando acá (mismo patrón que agente-diario.js).

const { dbInsert } = require('../lib/db');
const { llamarClaude } = require('../lib/ai');

const ZONAS_DEFAULT = ['GBA Sur', 'CABA'];
const RUBROS_DEFAULT = ['empresa_familiar', 'estudio_contable', 'estudio_abogados'];

module.exports = async function handler(req, res) {
  const auth = req.headers.authorization;
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) return res.status(401).json({ error: 'unauthorized' });

  const prompt = `Buscá en internet organizaciones reales en Argentina, zonas: ${ZONAS_DEFAULT.join(', ')}.
Rubros: empresa familiar/PyME, estudio contable, estudio de abogados societario.
Devolvé SOLO un JSON: {"resultados": [{"nombre","rubro","zona","email","telefono","sitio_web","fuente"}]}
Máximo 15 resultados. No inventes datos.`;

  try {
    const data = await llamarClaude({
      messages: [{ role: 'user', content: prompt }],
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      maxTokens: 4000,
    });
    const text = data.content?.filter((b) => b.type === 'text').map((b) => b.text).join('\n') || '{}';
    const match = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : text);
    const resultados = (parsed.resultados || []).map((r) => ({ ...r, estado: 'sin_contactar', fuente: r.fuente || 'cron' }));
    if (resultados.length) await dbInsert('prospectos', resultados);
    res.status(200).json({ ok: true, encontrados: resultados.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'error en cron de prospección' });
  }
};
