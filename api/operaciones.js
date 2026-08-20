const { dbSelect, dbInsert, dbUpdate, storageUpload, storagePublicUrl, storageSignedUrl } = require('../lib/db');
const { requireAuth } = require('../lib/auth');

async function getConfig() {
  const rows = await dbSelect('configuracion_sitio', 'order=updated_at.desc&limit=1');
  return rows?.[0] || null;
}
async function getPerfil() {
  const rows = await dbSelect('profesionales', 'activo=eq.true&order=created_at.asc&limit=1');
  return rows?.[0] || null;
}

module.exports = async function handler(req, res) {
  const usuario = await requireAuth(req, res);
  if (!usuario) return;

  try {
    if (req.method === 'GET') {
      const [config, perfil] = await Promise.all([getConfig(), getPerfil()]);
      return res.status(200).json({
        config,
        perfil,
        foto_url: storagePublicUrl('sitio', config?.foto_perfil_path),
        logo_url: storagePublicUrl('sitio', config?.logo_path),
        cv_url: perfil?.cv_storage_path ? await storageSignedUrl('perfil', perfil.cv_storage_path) : null,
      });
    }

    if (req.method === 'POST') {
      // Body: { config: {...}, perfil: {...}, foto: {dataBase64, contentType}, logo: {...}, cv: {...} }
      const { config: cfgIn = {}, perfil: perfilIn = {}, foto, logo, cv } = req.body || {};
      const avisos = [];

      // --- Config del sitio (colores, textos, foto, logo) ---
      let config = await getConfig();
      const cfgPayload = { ...cfgIn, updated_at: new Date().toISOString() };
      if (config) {
        [config] = await dbUpdate('configuracion_sitio', `id=eq.${config.id}`, cfgPayload);
      } else {
        [config] = await dbInsert('configuracion_sitio', [cfgPayload]);
      }

      if (foto?.dataBase64) {
        const ext = foto.contentType === 'image/png' ? 'png' : 'jpg';
        const path = `${config.id}-foto.${ext}`;
        await storageUpload('sitio', path, Buffer.from(foto.dataBase64, 'base64'), foto.contentType);
        [config] = await dbUpdate('configuracion_sitio', `id=eq.${config.id}`, { foto_perfil_path: path });
      }
      if (logo?.dataBase64) {
        const ext = logo.contentType === 'image/png' ? 'png' : 'jpg';
        const path = `${config.id}-logo.${ext}`;
        await storageUpload('sitio', path, Buffer.from(logo.dataBase64, 'base64'), logo.contentType);
        [config] = await dbUpdate('configuracion_sitio', `id=eq.${config.id}`, { logo_path: path });
      }

      // --- Perfil profesional (CV) — en su propio try/catch, para que si
      // falla (ej. todavía no cargó el nombre) no se pierda lo de arriba. ---
      let perfil = await getPerfil();
      try {
        const perfilPayload = {
          ...perfilIn,
          nombre: perfilIn.nombre || perfil?.nombre || 'Valentina De la Fuente',
          especialidades: typeof perfilIn.especialidades === 'string'
            ? perfilIn.especialidades.split(',').map((s) => s.trim()).filter(Boolean)
            : perfilIn.especialidades,
          updated_at: new Date().toISOString(),
        };
        if (perfil) {
          [perfil] = await dbUpdate('profesionales', `id=eq.${perfil.id}`, perfilPayload);
        } else {
          [perfil] = await dbInsert('profesionales', [perfilPayload]);
        }

        if (cv?.dataBase64 && perfil) {
          const path = `${perfil.id}.pdf`;
          await storageUpload('perfil', path, Buffer.from(cv.dataBase64, 'base64'), 'application/pdf');
          await dbUpdate('profesionales', `id=eq.${perfil.id}`, { cv_storage_path: path });
        }
      } catch (perfilErr) {
        console.error('Error guardando perfil (no bloqueante):', perfilErr);
        avisos.push(`No se pudo guardar el perfil profesional: ${perfilErr.message || perfilErr}`);
      }

      return res.status(200).json({ ok: true, avisos });
    }

    res.status(405).end();
  } catch (err) {
    console.error('Error en /api/operaciones:', err);
    res.status(500).json({ error: String(err.message || err) });
  }
};
