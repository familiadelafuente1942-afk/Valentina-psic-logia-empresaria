const { dbSelect } = require('../lib/db');
const { requireAuth } = require('../lib/auth');

module.exports = async function handler(req, res) {
  const usuario = await requireAuth(req, res);
  if (!usuario) return;
  try {
    const conversaciones = await dbSelect('whatsapp_conversations', 'order=ultimo_mensaje_at.desc');
    res.status(200).json({ conversaciones });
  } catch {
    res.status(200).json({ conversaciones: [] });
  }
};
