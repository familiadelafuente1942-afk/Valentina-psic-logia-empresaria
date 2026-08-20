const { dbSelect, dbUpdate } = require('../lib/db');
const { requireAuth } = require('../lib/auth');
const { enviarMail } = require('../lib/mail');
const { getPerfilParaMail, templatePresentacion } = require('../lib/mailTemplate');

module.exports = async function handler(req, res) {
  const usuario = await requireAuth(req, res);
  if (!usuario) return;

  if (req.method === 'GET') {
    const leads = await dbSelect('leads', 'order=created_at.desc');
    return res.status(200).json({ leads });
  }

  if (req.method === 'PATCH') {
    const { id, estado } = req.body || {};
    await dbUpdate('leads', `id=eq.${id}`, { estado, updated_at: new Date().toISOString() });
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'POST') {
    // Enviar presentación (bio + CV) a un lead puntual.
    const { id } = req.body || {};
    const [lead] = await dbSelect('leads', `id=eq.${id}`);
    if (!lead) return res.status(404).json({ error: 'Lead no encontrado' });

    const { perfil, cv_url } = await getPerfilParaMail();
    const result = await enviarMail({
      to: lead.email,
      subject: 'Sobre tu consulta',
      html: templatePresentacion(lead, perfil, cv_url),
    });
    return res.status(result.ok ? 200 : 502).json(result);
  }

  res.status(405).end();
};
