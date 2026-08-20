-- =========================================================
-- Migración 004 — Configuración del sitio (Panel de Operaciones)
-- Permite personalizar colores, foto de portada y textos del inicio
-- sin tocar código. Una sola fila (singleton).
-- =========================================================

create table if not exists configuracion_sitio (
  id uuid primary key default uuid_generate_v4(),
  color_acento text default '#C97D63',
  color_secundario text default '#8FA086',
  foto_perfil_path text,                    -- ruta dentro del bucket público 'sitio'
  nombre_marca text default 'Valentina De la Fuente',
  titulo_hero text default 'Cuando la mesa familiar y la mesa directiva son la misma mesa.',
  subtitulo_hero text default 'Acompaño a socios, y a padres e hijos que trabajan juntos, a separar lo que es del vínculo de lo que es del negocio — para que la empresa pueda decidir, y la familia pueda seguir siendo familia.',
  cta_texto text default 'Iniciar una consulta',
  updated_at timestamptz default now()
);

alter table configuracion_sitio enable row level security;
-- Sin policies: la landing la lee con la service role key en el servidor
-- (server component), nunca desde el browser con la anon key.

-- ---------------------------------------------------------
-- STORAGE: bucket PÚBLICO para la foto de portada (a diferencia de
-- 'biblioteca' y 'perfil', que son privados). Es una foto pensada para
-- mostrarse en el sitio público, así que no hace falta URL firmada.
-- Crear desde el dashboard: Storage → New bucket → nombre exacto "sitio"
-- → Public: SÍ.
-- ---------------------------------------------------------
