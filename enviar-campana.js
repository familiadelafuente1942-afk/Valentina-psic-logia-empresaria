const { dbInsert, dbUpdate } = require('../lib/db');
const { requireAuth } = require('../lib/auth');
const { enviarMail } = require('../lib/mail');
const { getPerfilParaMail } = require('../lib/mailTemplate');

module.exports = async function handler(req, res) {
  const usuario = await requireAuth(req, res);
  if (!usuario) return;
  if (req.method !== 'POST') return res.status(405).end();
  if (!process.env.RESEND_API_KEY) return res.status(500).json({ error: 'Falta RESEND_API_KEY' });

  const { remitente, responder_a, asunto, cuerpo, incluir_cta, adjuntar_cv, destinatarios } = req.body || {};
  if (!asunto || !cuerpo || !destinatarios?.length) {
    return res.status(400).json({ error: 'Faltan datos del envío' });
  }
  if (destinatarios.length > 200) {
    return res.status(400).json({ error: 'Máximo 200 destinatarios por envío' });
  }

  const { cv_url } = adjuntar_cv ? await getPerfilParaMail() : { cv_url: null };

  const [campana] = await dbInsert('campanas_mail', [
    { asunto, cuerpo, destinatarios_count: destinatarios.length },
  ]);

  let enviados = 0;
  let errores = 0;

  for (const d of destinatarios) {
    const nombre = d.nombre || '';
    let html = `<div style="font-family:sans-serif;max-width:480px;">${cuerpo
      .replaceAll('{{nombre}}', nombre)
      .split('\n')
      .join('<br/>')}`;
    if (incluir_cta) {
      html += `<p style="margin-top:16px;"><a href="${process.env.SITE_URL || '#'}" style="color:#C97D63;">Ver más</a></p>`;
    }
    if (cv_url) html += `<p style="margin-top:8px;"><a href="${cv_url}" style="color:#C97D63;">Ver CV</a></p>`;
    html += `</div>`;

    const result = await enviarMail({ to: d.email, subject: asunto, html, from: remitente, replyTo: responder_a });
    await dbInsert('email_log', [
      {
        destinatario: d.email,
        asunto,
        tipo: 'campana',
        estado: result.ok ? 'enviado' : 'error',
        resend_id: result.id,
        campana_id: campana?.id,
      },
    ]);
    result.ok ? enviados++ : errores++;
  }

  await dbUpdate('campanas_mail', `id=eq.${campana?.id}`, { enviados_count: enviados, errores_count: errores });

  res.status(200).json({ ok: true, enviados, errores });
};
