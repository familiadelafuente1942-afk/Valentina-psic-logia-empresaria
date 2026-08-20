const { dbInsert } = require('../lib/db');
const { requireAuth } = require('../lib/auth');
const { llamarClaude } = require('../lib/ai');
const { TOOLS, runTool } = require('../lib/guiaTools');

const SYSTEM_PROMPT = `Sos la Guía, la asistente personal de Valentina De la Fuente,
psicóloga especializada en empresas familiares (Buenos Aires, Argentina).

Tu trabajo es ayudarla con tres cosas, y solo esas tres:
1. Preguntas de estudio: consultás su biblioteca personal con buscar_bibliografia,
   y respondés basándote en esos fragmentos, citando de qué documento salió cada
   idea. Si la biblioteca no tiene nada relevante, decilo con claridad en vez de
   inventar contenido teórico.
2. Gastos del estudio: usás consultar_gastos.
3. Estado del negocio: leads y turnos, con consultar_negocio.

Nunca dictaminás diagnósticos clínicos sobre pacientes reales. Hablás en español
rioplatense, directo y cálido, sin relleno.`;

module.exports = async function handler(req, res) {
  const usuario = await requireAuth(req, res);
  if (!usuario) return;
  if (req.method !== 'POST') return res.status(405).end();
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'Falta ANTHROPIC_API_KEY' });

  const { pregunta, historial = [] } = req.body || {};
  if (!pregunta) return res.status(400).json({ error: 'Falta la pregunta' });

  let messages = [...historial, { role: 'user', content: pregunta }];
  const fuentesUsadas = [];

  for (let i = 0; i < 4; i++) {
    const data = await llamarClaude({ system: SYSTEM_PROMPT, tools: TOOLS, messages, maxTokens: 1500 });

    if (data.stop_reason !== 'tool_use') {
      const texto = data.content?.find((b) => b.type === 'text')?.text || '';
      await dbInsert('guia_consultas', [{ pregunta, respuesta: texto, fuentes: fuentesUsadas }]);
      return res.status(200).json({
        respuesta: texto,
        historial: [...messages, { role: 'assistant', content: data.content }],
        fuentes: fuentesUsadas,
      });
    }

    messages = [...messages, { role: 'assistant', content: data.content }];
    const toolUses = data.content.filter((b) => b.type === 'tool_use');
    const toolResults = [];
    for (const tu of toolUses) {
      fuentesUsadas.push({ herramienta: tu.name, input: tu.input });
      const result = await runTool(tu.name, tu.input);
      toolResults.push({ type: 'tool_result', tool_use_id: tu.id, content: JSON.stringify(result) });
    }
    messages = [...messages, { role: 'user', content: toolResults }];
  }

  res.status(500).json({ error: 'La Guía no pudo resolver la consulta' });
};
