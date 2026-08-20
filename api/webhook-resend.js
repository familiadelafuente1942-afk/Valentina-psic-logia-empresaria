// Pendiente: configurar este webhook en el dashboard de Resend para que
// el historial de Mails muestre apertura/click reales en vez de 0%.
// Por ahora solo loguea el evento.

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  console.log('Evento de Resend:', JSON.stringify(req.body));
  res.status(200).json({ ok: true });
};
