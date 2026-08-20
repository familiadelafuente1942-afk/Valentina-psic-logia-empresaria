const { dbInsert } = require('../lib/db');
const { enviarMail } = require('../lib/mail');
const { getPerfilParaMail, templateConfirmacion } = require('../lib/mailTemplate');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { nombre, email, telefono, empresa, situacion, mensaje } = req.body || {};
  if (!nombre || !email) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  let lead;
  try {
    [lead] = await dbInsert('leads', [{ nombre, email, telefono, empresa, situacion, mensaje }]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'No se pudo guardar la consulta' });
  }

  if (process.env.RESEND_API_KEY) {
    try {
      const { perfil, cv_url } = await getPerfilParaMail();
      await enviarMail({
        to: email,
        subject: 'Recibí tu consulta',
        html: templateConfirmacion({ nombre }, perfil, cv_url),
      });
    } catch (err) {
      console.error('Error mail confirmación:', err);
    }
  }

  res.status(200).json({ ok: true, lead_id: lead.id });
};
