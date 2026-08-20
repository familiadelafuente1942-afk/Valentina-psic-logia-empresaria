-- =========================================================
-- Migración 002 — Guía personal de Valentina
-- (biblioteca de estudio, gastos, historial de consultas)
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de schema.sql.
-- =========================================================

-- ---------------------------------------------------------
-- BIBLIOTECA DE ESTUDIO (bibliografía, tests, apuntes en PDF)
-- ---------------------------------------------------------
create table if not exists documentos (
  id uuid primary key default uuid_generate_v4(),
  titulo text not null,
  categoria text default 'bibliografia',    -- bibliografia | test | apunte | otro
  storage_path text,                        -- ruta dentro del bucket 'biblioteca'
  paginas int,
  estado text default 'procesando',         -- procesando | listo | error
  error_detalle text,
  created_at timestamptz default now()
);

create table if not exists documento_fragmentos (
  id uuid primary key default uuid_generate_v4(),
  documento_id uuid references documentos(id) on delete cascade,
  orden int not null,
  contenido text not null,
  created_at timestamptz default now()
);

-- Búsqueda de texto completo en español, para que la Guía encuentre
-- los fragmentos relevantes de la bibliografía ante cada pregunta.
create index if not exists idx_fragmentos_fts
  on documento_fragmentos using gin (to_tsvector('spanish', contenido));

create index if not exists idx_fragmentos_documento
  on documento_fragmentos(documento_id);

-- ---------------------------------------------------------
-- GASTOS del estudio/consultorio
-- ---------------------------------------------------------
create table if not exists gastos (
  id uuid primary key default uuid_generate_v4(),
  fecha date not null default current_date,
  categoria text default 'otro',            -- consultorio | insumos | marketing | impuestos | formacion | otro
  descripcion text,
  monto numeric not null,
  created_at timestamptz default now()
);

create index if not exists idx_gastos_fecha on gastos(fecha desc);

-- ---------------------------------------------------------
-- HISTORIAL de consultas a la Guía (para que quede memoria de lo preguntado)
-- ---------------------------------------------------------
create table if not exists guia_consultas (
  id uuid primary key default uuid_generate_v4(),
  pregunta text not null,
  respuesta text,
  fuentes jsonb,                            -- documentos/herramientas usadas para responder
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- Búsqueda ranqueada de fragmentos, usada por la Guía (buscar_bibliografia).
-- Solo trae fragmentos de documentos ya procesados ('listo').
-- ---------------------------------------------------------
create or replace function buscar_fragmentos(termino text)
returns table (titulo text, contenido text, rank real)
language sql stable
as $$
  select d.titulo, f.contenido,
         ts_rank(to_tsvector('spanish', f.contenido), plainto_tsquery('spanish', termino)) as rank
  from documento_fragmentos f
  join documentos d on d.id = f.documento_id
  where d.estado = 'listo'
    and to_tsvector('spanish', f.contenido) @@ plainto_tsquery('spanish', termino)
  order by rank desc
  limit 6;
$$;

alter table documentos enable row level security;
alter table documento_fragmentos enable row level security;
alter table gastos enable row level security;
alter table guia_consultas enable row level security;
-- Sin policies para anon/authenticated a propósito, igual que en schema.sql:
-- todo el acceso pasa por API routes del servidor con la service role key.

-- ---------------------------------------------------------
-- STORAGE: bucket privado para los PDFs originales de la biblioteca.
-- Esto hay que crearlo desde Storage → New bucket en el dashboard
-- (nombre exacto: biblioteca, Public: NO). No se puede crear por SQL.
-- ---------------------------------------------------------
