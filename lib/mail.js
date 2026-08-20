async function enviarMail({ to, subject, html, from, replyTo }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: from || process.env.RESEND_FROM,
      reply_to: replyTo || undefined,
      to,
      subject,
      html,
    }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, id: data?.id || null };
}

module.exports = { enviarMail };
