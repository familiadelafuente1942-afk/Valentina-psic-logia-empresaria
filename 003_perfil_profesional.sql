-- =========================================================
-- Migración 003 — Perfil profesional (CV + bio para los mails)
--
-- Ojo: se modela como tabla "profesionales" (no "perfil" singular) a
-- propósito, pensando en la idea de Sebastián de que esto crezca a una
-- empresa con más psicólogos trabajando de forma remota (adicciones +
-- conflictos societarios/familiares en la empresa). Por ahora va a tener
-- una sola fila (Valentina), pero el modelo ya soporta sumar más filas
-- el día que se sumen otros profesionales — no hace falta migrar de nuevo.
-- =========================================================

create table if not exists profesionales (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  titulo text,                              -- ej: "Lic. en Psicología (UF)"
  matricula text,
  email_contacto text,
  bio text,                                 -- texto corto para usar en mails/landing
  especialidades text[] default '{}',       -- ej: {'conflictos societarios','adicciones'}
  cv_storage_path text,                     -- ruta dentro del bucket 'perfil'
  activo boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table profesionales enable row level security;
-- Sin policies, igual criterio que el resto: todo pasa por API routes
-- del servidor con la service role key.

-- ---------------------------------------------------------
-- STORAGE: bucket privado para los CV. Crear desde el dashboard:
-- Storage → New bucket → nombre exacto "perfil" → Public: NO.
-- ---------------------------------------------------------
