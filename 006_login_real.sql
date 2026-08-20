-- =========================================================
-- Migración 006 — Login real (Supabase Auth) + tabla de usuarios
--
-- Reemplaza la clave única del panel por un login de verdad
-- (mail + contraseña) usando Supabase Auth. Esta tabla guarda el rol
-- de cada usuario — hoy tiene una sola fila (Valentina), pero ya está
-- pensada para cuando se sumen más psicólogas/os al panel (ver la
-- tabla "profesionales" de la migración 003, con el mismo criterio).
-- =========================================================

create table if not exists usuarios (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid not null unique,   -- referencia al usuario real de Supabase Auth
  nombre text,
  rol text default 'administrador',   -- administrador | solo_lectura
  activo boolean default true,
  created_at timestamptz default now()
);

alter table usuarios enable row level security;

-- Cada usuario puede ver su propia fila (para saber su rol al entrar al panel).
create policy "usuarios pueden ver su propia fila"
  on usuarios for select
  using (auth.uid() = auth_user_id);

-- ---------------------------------------------------------
-- PASOS MANUALES (no se pueden hacer por SQL):
-- 1. En el dashboard de Supabase: Authentication → Users → Add user.
--    Cargá el mail y la contraseña de Valentina ahí (no acá en el SQL).
-- 2. Copiá el "User UID" que te muestra Supabase.
-- 3. Corré este INSERT reemplazando el UID:
--
--    insert into usuarios (auth_user_id, nombre, rol)
--    values ('PEGAR-EL-USER-UID-ACA', 'Valentina', 'administrador');
--
-- Si no se crea esta fila, el panel igual va a dejar entrar a cualquier
-- usuario válido de Supabase Auth (con rol "administrador" por defecto)
-- — esta tabla es solo para poder manejar roles distintos más adelante.
-- ---------------------------------------------------------
