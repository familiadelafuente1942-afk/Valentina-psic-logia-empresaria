const { dbInsert } = require('./db');
const { llamarClaude } = require('./ai');

const SYSTEM_PROMPT = `Sos el redactor de contenido de Valentina De la Fuente, psicóloga
argentina especializada en conflictos societarios y familiares dentro de la empresa
(padres/hijos, socios, sucesión, comunicación en el directorio).

Escribís en español rioplatense, con tono profesional pero cercano, sin golpes de efecto
ni jerga de "coach". Cada pieza tiene que dejar una idea clínica concreta y útil. Nunca
das diagnósticos ni consejos individuales sobre casos reales.

Devolvé ÚNICAMENTE un JSON válido, sin texto adicional ni backticks:
{"tema": "...", "copy": "..."}`;

async function generarYGuardarContenido(canal = 'instagram', tema) {
  const userPrompt = tema
    ? `Canal: ${canal}. Escribí una pieza de contenido sobre: ${tema}`
    : `Canal: ${canal}. Elegí vos un tema relevante para empresas familiares argentinas y escribí la pieza.`;

  const data = await llamarClaude({
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
    maxTokens: 1000,
  });
  const text = data.content?.find((b) => b.type === 'text')?.text || '{}';
  const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());

  const [item] = await dbInsert('content_items', [
    { canal, tema: parsed.tema, copy: parsed.copy, estado: 'borrador', generado_por_ia: true },
  ]);
  return item;
}

module.exports = { generarYGuardarContenido, SYSTEM_PROMPT };
