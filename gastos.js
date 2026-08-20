const { dbSelect, dbInsert, dbDelete } = require('../lib/db');
const { requireAuth } = require('../lib/auth');

module.exports = async function handler(req, res) {
  const usuario = await requireAuth(req, res);
  if (!usuario) return;

  if (req.method === 'GET') {
    const gastos = await dbSelect('gastos', 'order=fecha.desc&limit=200');
    return res.status(200).json({ gastos });
  }

  if (req.method === 'POST') {
    const { fecha, categoria, descripcion, monto } = req.body || {};
    if (!monto) return res.status(400).json({ error: 'Falta el monto' });
    const [gasto] = await dbInsert('gastos', [
      { fecha: fecha || new Date().toISOString().slice(0, 10), categoria, descripcion, monto },
    ]);
    return res.status(200).json({ ok: true, gasto });
  }

  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    await dbDelete('gastos', `id=eq.${id}`);
    return res.status(200).json({ ok: true });
  }

  res.status(405).end();
};
