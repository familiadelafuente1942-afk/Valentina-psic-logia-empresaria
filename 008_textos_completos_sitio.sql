-- =========================================================
-- Migración 008 — Todos los textos del sitio, editables
--
-- Hasta ahora solo eran editables el título/subtítulo de arriba.
-- Se suman los textos de "Para quién", las 4 áreas de trabajo y
-- "Sobre mí", con el contenido actual como valor por defecto (así
-- no se pierde nada de lo que ya está publicado).
-- =========================================================

alter table configuracion_sitio add column if not exists para_quien_titulo text
  default 'Empresas donde el organigrama y el árbol familiar se superponen.';
alter table configuracion_sitio add column if not exists para_quien_texto text
  default 'Trabajo con directorios, sociedades entre hermanos o primos, fundadores que empiezan a delegar y segundas o terceras generaciones que entran a la empresa con una historia previa al primer día de trabajo. No reemplazo al asesoramiento legal o contable de la sociedad: trabajo en paralelo, sobre lo que esos procesos no pueden resolver por sí solos.';

alter table configuracion_sitio add column if not exists area1_titulo text default 'Conflictos societarios';
alter table configuracion_sitio add column if not exists area1_texto text
  default 'Cuando la relación entre socios empieza a filtrarse en las decisiones del negocio, y las reuniones de directorio se parecen cada vez más a una discusión familiar.';

alter table configuracion_sitio add column if not exists area2_titulo text default 'Padres, hijos y sucesión';
alter table configuracion_sitio add column if not exists area2_texto text
  default 'El pasaje de mando entre generaciones no es solo un tema patrimonial: reactiva roles, jerarquías y heridas que vienen de mucho antes de la empresa.';

alter table configuracion_sitio add column if not exists area3_titulo text default 'Comunicación en el directorio';
alter table configuracion_sitio add column if not exists area3_texto text
  default 'Espacios de trabajo donde lo que no se dice en la mesa familiar tampoco se dice en la mesa directiva, y las decisiones se vuelven más lentas y más costosas.';

alter table configuracion_sitio add column if not exists area4_titulo text default 'Socios no familiares';
alter table configuracion_sitio add column if not exists area4_texto text
  default 'Acompañamiento para quienes se suman a una empresa de familia desde afuera y necesitan entender —y a veces mediar— una dinámica que no es solo profesional.';

alter table configuracion_sitio add column if not exists sobre_mi_texto1 text
  default 'Licenciada en Psicología (Universidad Favaloro), especializada en la intersección entre los vínculos familiares y la vida de la empresa. Mi formación clínica se apoya en herramientas de la psicología vincular y sistémica, aplicadas al contexto específico de la empresa familiar argentina.';
alter table configuracion_sitio add column if not exists sobre_mi_texto2 text
  default 'Trabajo bajo secreto profesional, con sesiones individuales, vinculares (entre socios o entre miembros de la familia) y procesos de acompañamiento sostenidos con el directorio.';
