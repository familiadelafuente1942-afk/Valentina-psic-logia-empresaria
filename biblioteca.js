const { dbSelect, dbInsert, dbUpdate, dbDelete, storageUpload, storageDelete } = require('../lib/db');
const { requireAuth } = require('../lib/auth');

function chunkText(text, targetSize = 1400, overlap = 150) {
  const clean = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (!clean) return [];
  const paragraphs = clean.split(/\n\s*\n/);
  const chunks = [];
  let current = '';
  for (const p of paragraphs) {
    if ((current + '\n\n' + p).length > targetSize && current) {
      chunks.push(current.trim());
      current = current.slice(-overlap) + '\n\n' + p;
    } else {
      current = current ? current + '\n\n' + p : p;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.flatMap((c) => {
    if (c.length <= targetSize * 1.5) return [c];
    const parts = [];
    for (let i = 0; i < c.length; i += targetSize) parts.push(c.slice(i, i + targetSize));
    return parts;
  });
}

module.exports = async function handler(req, res) {
  const usuario = await requireAuth(req, res);
  if (!usuario) return;

  if (req.method === 'GET') {
    const documentos = await dbSelect('documentos', 'order=created_at.desc');
    return res.status(200).json({ documentos });
  }

  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    const [doc] = await dbSelect('documentos', `id=eq.${id}`);
    if (doc?.storage_path) await storageDelete('biblioteca', doc.storage_path);
    await dbDelete('documentos', `id=eq.${id}`);
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'POST') {
    // Body: { titulo, categoria, filename, contentType, dataBase64 }
    const { titulo, categoria = 'bibliografia', filename, dataBase64 } = req.body || {};
    if (!dataBase64) return res.status(400).json({ error: 'Falta el archivo' });

    const [doc] = await dbInsert('documentos', [
      { titulo: titulo || filename || 'Sin título', categoria, estado: 'procesando' },
    ]);

    try {
      const bytes = Buffer.from(dataBase64, 'base64');
      const storagePath = `${doc.id}.pdf`;
      await storageUpload('biblioteca', storagePath, bytes, 'application/pdf');

      const pdfParse = require('pdf-parse');
      const parsed = await pdfParse(bytes);
      const chunks = chunkText(parsed.text);
      if (!chunks.length) throw new Error('No se pudo extraer texto del PDF (¿es un escaneo sin OCR?)');

      await dbInsert(
        'documento_fragmentos',
        chunks.map((contenido, orden) => ({ documento_id: doc.id, orden, contenido }))
      );

      await dbUpdate('documentos', `id=eq.${doc.id}`, {
        estado: 'listo',
        storage_path: storagePath,
        paginas: parsed.numpages,
      });

      return res.status(200).json({ ok: true, documento_id: doc.id, fragmentos: chunks.length });
    } catch (err) {
      console.error(err);
      await dbUpdate('documentos', `id=eq.${doc.id}`, { estado: 'error', error_detalle: String(err.message || err) });
      return res.status(500).json({ error: 'No se pudo procesar el PDF' });
    }
  }

  res.status(405).end();
};
