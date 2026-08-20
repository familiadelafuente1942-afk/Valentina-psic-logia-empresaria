const { dbSelect, storagePublicUrl } = require('../lib/db');

module.exports = async function handler(req, res) {
  const rows = await dbSelect('configuracion_sitio', 'order=updated_at.desc&limit=1');
  const config = rows?.[0] || null;

  res.status(200).json({
    color_acento: config?.color_acento || '#C97D63',
    color_secundario: config?.color_secundario || '#8FA086',
    color_fondo: config?.color_fondo || '#FBF7F2',
    nombre_marca: config?.nombre_marca || 'Valentina De la Fuente',
    titulo_hero: config?.titulo_hero || 'Cuando la mesa familiar y la mesa directiva son la misma mesa.',
    subtitulo_hero:
      config?.subtitulo_hero ||
      'Acompaño a socios, y a padres e hijos que trabajan juntos, a separar lo que es del vínculo de lo que es del negocio — para que la empresa pueda decidir, y la familia pueda seguir siendo familia.',
    cta_texto: config?.cta_texto || 'Iniciar una consulta',
    foto_url: storagePublicUrl('sitio', config?.foto_perfil_path),
    logo_url: storagePublicUrl('sitio', config?.logo_path),
  });
};
