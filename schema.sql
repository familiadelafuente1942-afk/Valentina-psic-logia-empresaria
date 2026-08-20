-- =========================================================
-- Valentina De la Fuente — Psicología Empresarial
-- Esquema inicial de Supabase (proyecto nuevo, marca única)
-- Ejecutar completo en el SQL Editor de Supabase.
-- =========================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------
-- LEADS / PIPELINE
-- ---------------------------------------------------------
create table if not exists leads (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  email text not null,
  telefono text,
  empresa text,
  situacion text,
  mensaje text,
  origen text default 'landing',            -- landing | whatsapp | manual | referido
  estado text default 'nuevo',              -- nuevo | contactado | primera_entrevista | en_proceso | cerrado | descartado
  notas text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_leads_estado on leads(estado);
create index if not exists idx_leads_created_at on leads(created_at desc);

-- ---------------------------------------------------------
-- EMAILS (registro de envíos vía Resend)
-- ---------------------------------------------------------
create table if not exists email_log (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references leads(id) on delete set null,
  destinatario text not null,
  asunto text,
  tipo text default 'transaccional',        -- transaccional | secuencia | newsletter
  estado text default 'enviado',            -- enviado | error | rebotado
  resend_id text,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- WHATSAPP (conversaciones + mensajes, WhatsApp Business Cloud API)
-- ---------------------------------------------------------
create table if not exists whatsapp_conversations (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references leads(id) on delete set null,
  telefono text not null unique,
  estado text default 'abierta',            -- abierta | pausada | derivada | cerrada
  ultimo_mensaje_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists whatsapp_messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid references whatsapp_conversations(id) on delete cascade,
  direccion text not null,                  -- entrante | saliente
  texto text,
  wa_message_id text,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- CONTENIDO (generador con IA + calendario editorial)
-- ---------------------------------------------------------
create table if not exists content_items (
  id uuid primary key default uuid_generate_v4(),
  canal text not null,                      -- instagram | linkedin | newsletter | blog
  tema text,
  copy text,
  estado text default 'borrador',           -- borrador | aprobado | programado | publicado
  programado_para date,
  generado_por_ia boolean default true,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- TURNOS / CONSULTAS
-- ---------------------------------------------------------
create table if not exists appointments (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references leads(id) on delete set null,
  tipo text default 'primera_entrevista',   -- primera_entrevista | sesion | seguimiento_directorio
  fecha timestamptz not null,
  estado text default 'confirmado',         -- confirmado | cancelado | realizado | no_show
  notas text,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- AGENTE DIARIO (log de corridas del cron)
-- ---------------------------------------------------------
create table if not exists agent_runs (
  id uuid primary key default uuid_generate_v4(),
  tipo text not null,                       -- resumen_diario | prospeccion | contenido
  resultado text,
  detalle jsonb,
  ok boolean default true,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- RLS: todo cerrado por defecto. Las API routes usan la
-- service role key desde el servidor, así que el browser
-- (anon key) no necesita ni debe poder leer/escribir directo.
-- ---------------------------------------------------------
alter table leads enable row level security;
alter table email_log enable row level security;
alter table whatsapp_conversations enable row level security;
alter table whatsapp_messages enable row level security;
alter table content_items enable row level security;
alter table appointments enable row level security;
alter table agent_runs enable row level security;

-- Sin policies para 'anon' ni 'authenticated' a propósito:
-- service_role bypassea RLS automáticamente. Si en el futuro
-- se agrega login de Supabase Auth para Valentina, ahí se suman
-- policies "auth.uid() = ..." en vez de dejar esto abierto.
