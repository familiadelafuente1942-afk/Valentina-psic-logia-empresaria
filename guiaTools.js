const { dbSelect, dbRpc } = require('./db');

const TOOLS = [
  {
    name: 'buscar_bibliografia',
    description:
      'Busca en la biblioteca de estudio de Valentina (bibliografía, tests, apuntes que ella subió en PDF) fragmentos de texto relevantes. Devolvé los resultados con el nombre del documento de origen.',
    input_schema: {
      type: 'object',
      properties: { consulta: { type: 'string', description: 'Términos de búsqueda, en español' } },
      required: ['consulta'],
    },
  },
  {
    name: 'consultar_gastos',
    description: 'Consulta los gastos del estudio: total del mes actual, o últimos gastos cargados.',
    input_schema: {
      type: 'object',
      properties: { modo: { type: 'string', enum: ['total_mes_actual', 'ultimos'] } },
      required: ['modo'],
    },
  },
  {
    name: 'consultar_negocio',
    description: 'Consulta leads/consultas recibidas y su estado, o próximos turnos.',
    input_schema: {
      type: 'object',
      properties: { area: { type: 'string', enum: ['leads', 'turnos'] } },
      required: ['area'],
    },
  },
];

async function runTool(name, input) {
  if (name === 'buscar_bibliografia') {
    const data = await dbRpc('buscar_fragmentos', { termino: input.consulta });
    if (!data?.length) return { encontrado: false, mensaje: 'No se encontraron fragmentos relevantes.' };
    return { encontrado: true, resultados: data.map((r) => ({ documento: r.titulo, fragmento: r.contenido })) };
  }

  if (name === 'consultar_gastos') {
    if (input.modo === 'total_mes_actual') {
      const inicio = new Date();
      inicio.setDate(1);
      const rows = await dbSelect('gastos', `select=monto&fecha=gte.${inicio.toISOString().slice(0, 10)}`);
      const total = rows.reduce((acc, g) => acc + Number(g.monto), 0);
      return { total_mes_actual: total, cantidad_gastos: rows.length };
    }
    const rows = await dbSelect('gastos', 'order=fecha.desc&limit=10');
    return { ultimos_gastos: rows };
  }

  if (name === 'consultar_negocio') {
    if (input.area === 'leads') {
      const rows = await dbSelect('leads', 'select=nombre,situacion,estado,created_at&order=created_at.desc&limit=15');
      return { leads_recientes: rows };
    }
    const rows = await dbSelect(
      'appointments',
      `select=tipo,fecha,estado&fecha=gte.${new Date().toISOString()}&order=fecha.asc&limit=15`
    );
    return { proximos_turnos: rows };
  }

  return { error: 'herramienta desconocida' };
}

module.exports = { TOOLS, runTool };
