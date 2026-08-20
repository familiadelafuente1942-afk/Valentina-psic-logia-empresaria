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
    para_quien_titulo: config?.para_quien_titulo || 'Empresas donde el organigrama y el árbol familiar se superponen.',
    para_quien_texto:
      config?.para_quien_texto ||
      'Trabajo con directorios, sociedades entre hermanos o primos, fundadores que empiezan a delegar y segundas o terceras generaciones que entran a la empresa con una historia previa al primer día de trabajo. No reemplazo al asesoramiento legal o contable de la sociedad: trabajo en paralelo, sobre lo que esos procesos no pueden resolver por sí solos.',
    area1_titulo: config?.area1_titulo || 'Conflictos societarios',
    area1_texto: config?.area1_texto || 'Cuando la relación entre socios empieza a filtrarse en las decisiones del negocio, y las reuniones de directorio se parecen cada vez más a una discusión familiar.',
    area2_titulo: config?.area2_titulo || 'Padres, hijos y sucesión',
    area2_texto: config?.area2_texto || 'El pasaje de mando entre generaciones no es solo un tema patrimonial: reactiva roles, jerarquías y heridas que vienen de mucho antes de la empresa.',
    area3_titulo: config?.area3_titulo || 'Comunicación en el directorio',
    area3_texto: config?.area3_texto || 'Espacios de trabajo donde lo que no se dice en la mesa familiar tampoco se dice en la mesa directiva, y las decisiones se vuelven más lentas y más costosas.',
    area4_titulo: config?.area4_titulo || 'Socios no familiares',
    area4_texto: config?.area4_texto || 'Acompañamiento para quienes se suman a una empresa de familia desde afuera y necesitan entender —y a veces mediar— una dinámica que no es solo profesional.',
    sobre_mi_texto1:
      config?.sobre_mi_texto1 ||
      'Licenciada en Psicología (Universidad Favaloro), especializada en la intersección entre los vínculos familiares y la vida de la empresa. Mi formación clínica se apoya en herramientas de la psicología vincular y sistémica, aplicadas al contexto específico de la empresa familiar argentina.',
    sobre_mi_texto2:
      config?.sobre_mi_texto2 ||
      'Trabajo bajo secreto profesional, con sesiones individuales, vinculares (entre socios o entre miembros de la familia) y procesos de acompañamiento sostenidos con el directorio.',
    foto_url: storagePublicUrl('sitio', config?.foto_perfil_path),
    logo_url: storagePublicUrl('sitio', config?.logo_path),
  });
};
