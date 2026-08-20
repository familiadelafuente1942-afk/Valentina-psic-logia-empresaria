const { dbSelect } = require('../lib/db');
const { requireAuth } = require('../lib/auth');

module.exports = async function handler(req, res) {
  const usuario = await requireAuth(req, res);
  if (!usuario) return;

  const [leads, prospectos] = await Promise.all([
    dbSelect('leads', 'select=id,nombre,email&email=not.is.null'),
    dbSelect('prospectos', 'select=id,nombre,email&email=not.is.null'),
  ]);

  const contactos = [
    ...leads.map((l) => ({ id: `lead:${l.id}`, nombre: l.nombre, email: l.email, tipo: 'lead' })),
    ...prospectos.map((p) => ({ id: `prospecto:${p.id}`, nombre: p.nombre, email: p.email, tipo: 'prospecto' })),
  ];

  res.status(200).json({ contactos });
};
