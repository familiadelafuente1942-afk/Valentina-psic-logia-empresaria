const { enviarMail } = require('../lib/mail');
const { getPerfilParaMail, templateConfirmacion } = require('../lib/mailTemplate');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!process.env.RESEND_API_KEY) return res.status(200).json({ ok: true, aviso: 'RESEND_API_KEY no configurada, no se mandó mail' });

  const { nombre, email } = req.body || {};
  if (!nombre || !email) return res.status(400).json({ error: 'Faltan datos' });

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

  res.status(200).json({ ok: true });
};
