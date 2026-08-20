const { dbSelect, dbInsert } = require('../lib/db');
const { generarYGuardarContenido } = require('../lib/contenido');

module.exports = async function handler(req, res) {
  const auth = req.headers.authorization;
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) return res.status(401).json({ error: 'unauthorized' });

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const hoy = new Date().toISOString().slice(0, 10);
  const manana = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [nuevosLeads, turnosHoy] = await Promise.all([
    dbSelect('leads', `select=id,nombre,situacion,estado&created_at=gte.${since}`),
    dbSelect('appointments', `select=id,tipo,fecha&fecha=gte.${hoy}&fecha=lte.${manana}`),
  ]);

  await dbInsert('agent_runs', [
    {
      tipo: 'resumen_diario',
      resultado: `${nuevosLeads.length} lead(s) nuevo(s), ${turnosHoy.length} turno(s) próximo(s)`,
      detalle: { nuevosLeads, turnosHoy },
      ok: true,
    },
  ]);

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      await generarYGuardarContenido('instagram');
    } catch (err) {
      console.error('Error generando contenido diario:', err);
    }
  }

  res.status(200).json({ ok: true, nuevosLeads: nuevosLeads.length, turnosHoy: turnosHoy.length });
};

