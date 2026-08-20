const { dbSelect } = require('../lib/db');
const { requireAuth } = require('../lib/auth');

module.exports = async function handler(req, res) {
  const usuario = await requireAuth(req, res);
  if (!usuario) return;

  const log = await dbSelect('email_log', 'order=created_at.desc&limit=100');
  const enviados = log.filter((l) => l.estado === 'enviado').length;
  const errores = log.filter((l) => l.estado === 'error').length;

  res.status(200).json({
    log,
    stats: { enviados, errores, tasa_apertura: 0, tasa_click: 0 },
  });
};
