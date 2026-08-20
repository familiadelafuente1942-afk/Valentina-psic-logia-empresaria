const { dbSelect, storageSignedUrl } = require('./db');

async function getPerfilParaMail() {
  const rows = await dbSelect('profesionales', 'activo=eq.true&order=created_at.asc&limit=1');
  const perfil = rows?.[0] || null;
  const cv_url = perfil?.cv_storage_path ? await storageSignedUrl('perfil', perfil.cv_storage_path) : null;
  return { perfil, cv_url };
}

function firma(perfil, cv_url) {
  const nombre = perfil?.nombre || 'Valentina De la Fuente';
  const titulo = perfil?.titulo || 'Psicóloga';
  return `
    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #E6DFD5;font-family:sans-serif;">
      <p style="margin:0;font-size:14px;color:#241F26;"><strong>${nombre}</strong></p>
      <p style="margin:2px 0 0;font-size:13px;color:#5B5560;">${titulo}</p>
      ${cv_url ? `<p style="margin:10px 0 0;"><a href="${cv_url}" style="font-size:13px;color:#C97D63;">Ver CV completo</a></p>` : ''}
    </div>
  `;
}

function templateConfirmacion({ nombre }, perfil, cv_url) {
  return `
    <div style="font-family:sans-serif;max-width:480px;">
      <p>Hola ${nombre},</p>
      <p>Recibí tu mensaje y lo voy a leer con atención. Te respondo dentro de las próximas 48hs hábiles.</p>
      ${perfil?.bio ? `<p style="color:#5B5560;font-size:14px;">${perfil.bio}</p>` : ''}
      ${firma(perfil, cv_url)}
    </div>
  `;
}

function templatePresentacion({ nombre, situacion }, perfil, cv_url) {
  const especialidad = (perfil?.especialidades || []).length
    ? `Trabajo especialmente en: ${perfil.especialidades.join(', ')}.`
    : '';
  return `
    <div style="font-family:sans-serif;max-width:480px;">
      <p>Hola ${nombre},</p>
      <p>Te escribo en relación a tu consulta${situacion ? ` sobre "${situacion}"` : ''}.</p>
      ${perfil?.bio ? `<p style="color:#5B5560;font-size:14px;">${perfil.bio}</p>` : ''}
      ${especialidad ? `<p style="color:#5B5560;font-size:14px;">${especialidad}</p>` : ''}
      <p>Te dejo mi CV para que tengas más contexto sobre mi formación, y quedo atenta para coordinar una primera conversación.</p>
      ${firma(perfil, cv_url)}
    </div>
  `;
}

module.exports = { getPerfilParaMail, templateConfirmacion, templatePresentacion };
