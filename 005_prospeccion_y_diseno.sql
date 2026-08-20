-- =========================================================
-- Migración 005 — Prospección + ajustes de Diseño
-- Alinea el Centro de Operaciones de Valentina con la misma
-- estructura que V+V Construcciones.
-- =========================================================

-- ---------------------------------------------------------
-- PROSPECCIÓN: empresas familiares/PyMEs (clientes potenciales)
-- y derivadores (abogados societarios, contadores, consultoras).
-- ---------------------------------------------------------
create table if not exists prospectos (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  rubro text,                               -- empresa_familiar | estudio_contable | estudio_abogados | consultora_familiar | otro
  zona text,
  email text,
  telefono text,
  sitio_web text,
  fuente text,                              -- de dónde salió (búsqueda IA, manual, referido)
  estado text default 'sin_contactar',      -- sin_contactar | contactado | respondido | descartado
  created_at timestamptz default now()
);

create index if not exists idx_prospectos_estado on prospectos(estado);
create index if not exists idx_prospectos_zona on prospectos(zona);

alter table prospectos enable row level security;

-- ---------------------------------------------------------
-- DISEÑO: sumamos logo (además de la foto) y color de fondo,
-- para calzar con el panel de Diseño de V+V.
-- ---------------------------------------------------------
alter table configuracion_sitio add column if not exists logo_path text;
alter table configuracion_sitio add column if not exists color_fondo text default '#FBF7F2';

-- ---------------------------------------------------------
-- MAILS MASIVOS: registro de campañas (para "Historial y métricas")
-- ---------------------------------------------------------
create table if not exists campanas_mail (
  id uuid primary key default uuid_generate_v4(),
  asunto text not null,
  cuerpo text,
  destinatarios_count int default 0,
  enviados_count int default 0,
  errores_count int default 0,
  created_at timestamptz default now()
);

alter table campanas_mail enable row level security;

-- email_log ya existía (migración 001); le sumamos referencia opcional
-- a la campaña para poder agrupar el historial.
alter table email_log add column if not exists campana_id uuid references campanas_mail(id) on delete set null;
