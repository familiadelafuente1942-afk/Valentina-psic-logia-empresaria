// Pendiente: activar cuando estén WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID
// y WHATSAPP_VERIFY_TOKEN. Meta llama con GET para verificar el webhook,
// y con POST cuando llega un mensaje real.

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).end();
  }

  if (req.method === 'POST') {
    // TODO: cuando estén las credenciales, guardar el mensaje entrante en
    // whatsapp_conversations / whatsapp_messages y disparar la respuesta
    // del agente (mismo patrón que asistente.js).
    console.log('Mensaje de WhatsApp recibido (procesamiento pendiente):', JSON.stringify(req.body));
    return res.status(200).json({ ok: true });
  }

  res.status(405).end();
};
