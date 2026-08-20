-- =========================================================
-- Migración 007 — Acceso directo desde el navegador (como V+V)
--
-- Hasta ahora, el panel llamaba a funciones propias (/api/*.js) para
-- leer y guardar datos, y esas funciones usaban la service_role key.
-- Para que la app funcione en un solo archivo con las mismas llamadas
-- directas a Supabase que usa V+V (vía la anon key + el login del
-- usuario), hace falta abrir permisos por fila (RLS) a los usuarios
-- ya autenticados.
--
-- Regla simple, igual que V+V: cualquier usuario logueado (con sesión
-- válida de Supabase Auth) puede leer y escribir en las tablas
-- operativas del panel. El público anónimo solo puede CREAR un lead
-- desde el formulario de la landing — nada más.
-- =========================================================

-- ---------------------------------------------------------
-- Público (sin login): solo puede crear su propia consulta.
-- ---------------------------------------------------------
create policy "publico_puede_crear_lead"
  on leads for insert
  to anon
  with check (true);

-- ---------------------------------------------------------
-- Usuarios logueados: acceso completo a las tablas operativas
-- del Centro de Operaciones (mismo criterio que V+V).
-- ---------------------------------------------------------
create policy "autenticados_leads" on leads for all to authenticated using (true) with check (true);
create policy "autenticados_email_log" on email_log for all to authenticated using (true) with check (true);
create policy "autenticados_appointments" on appointments for all to authenticated using (true) with check (true);
create policy "autenticados_agent_runs" on agent_runs for all to authenticated using (true) with check (true);
create policy "autenticados_content_items" on content_items for all to authenticated using (true) with check (true);
create policy "autenticados_documentos" on documentos for all to authenticated using (true) with check (true);
create policy "autenticados_documento_fragmentos" on documento_fragmentos for all to authenticated using (true) with check (true);
create policy "autenticados_gastos" on gastos for all to authenticated using (true) with check (true);
create policy "autenticados_guia_consultas" on guia_consultas for all to authenticated using (true) with check (true);
create policy "autenticados_profesionales" on profesionales for all to authenticated using (true) with check (true);
create policy "autenticados_configuracion_sitio" on configuracion_sitio for all to authenticated using (true) with check (true);
create policy "autenticados_prospectos" on prospectos for all to authenticated using (true) with check (true);
create policy "autenticados_campanas_mail" on campanas_mail for all to authenticated using (true) with check (true);
create policy "autenticados_whatsapp_conversations" on whatsapp_conversations for all to authenticated using (true) with check (true);
create policy "autenticados_whatsapp_messages" on whatsapp_messages for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------
-- El público también necesita leer la configuración del sitio
-- (colores, foto, textos) para que la landing se pinte sola,
-- y leer el perfil activo (bio para mostrar quién es Valentina).
-- ---------------------------------------------------------
create policy "publico_lee_configuracion" on configuracion_sitio for select to anon using (true);
create policy "publico_lee_perfil_activo" on profesionales for select to anon using (activo = true);
