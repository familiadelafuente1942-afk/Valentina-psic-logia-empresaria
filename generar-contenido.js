const { dbSelect } = require('../lib/db');
const { requireAuth } = require('../lib/auth');
const { generarYGuardarContenido } = require('../lib/contenido');

module.exports = async function handler(req, res) {
  const usuario = await requireAuth(req, res);
  if (!usuario) return;

  if (req.method === 'GET') {
    const items = await dbSelect('content_items', 'order=created_at.desc&limit=50');
    return res.status(200).json({ items });
  }

  if (req.method === 'POST') {
    const { canal = 'instagram', tema } = req.body || {};
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'Falta configurar ANTHROPIC_API_KEY' });
    }
    try {
      const item = await generarYGuardarContenido(canal, tema);
      return res.status(200).json({ ok: true, item });
    } catch (err) {
      console.error(err);
      return res.status(502).json({ error: 'Error generando contenido' });
    }
  }

  res.status(405).end();
};

