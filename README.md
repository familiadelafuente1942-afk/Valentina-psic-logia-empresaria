# Valentina De la Fuente — Psicología Empresarial

Misma arquitectura que el Centro de Operaciones de V+V Construcciones:
un index.html (todo el sitio) + funciones sueltas en /api, sin paso
de build, deployado directo desde GitHub a Vercel. Repo y base de datos
propios, sin relación con V+V ni con VIP Deco.

## Estructura

- index.html          -> todo el sitio: landing pública + login + Centro de Operaciones
- api/*.js             -> una función por acción (Vercel Serverless Functions)
- lib/*.js              -> código compartido entre funciones (no se despliega como endpoint)
- supabase/schema.sql + migrations/*.sql  -> base de datos
- vercel.json          -> rutas del panel + cron del agente diario

No hay npm run build, no hay JSX que compilar de antemano: index.html
usa React vía CDN con Babel standalone (el navegador transpila el JSX al
cargar la página), igual que ya conocés. Para editar cualquier pantalla,
se edita directo index.html desde GitHub web. Para editar la lógica de
una acción puntual, se edita el archivo correspondiente en /api.

## 1. Supabase (proyecto nuevo)

1. Creá un proyecto nuevo en supabase.com (no reuses el de V+V).
2. SQL Editor -> pegá supabase/schema.sql -> Run.
3. Pegá también, en orden, cada uno de estos -> Run en cada uno:
   - supabase/migrations/002_guia_biblioteca_gastos.sql
   - supabase/migrations/003_perfil_profesional.sql
   - supabase/migrations/004_configuracion_sitio.sql
   - supabase/migrations/005_prospeccion_y_diseno.sql
   - supabase/migrations/006_login_real.sql
   - supabase/migrations/007_acceso_directo_navegador.sql
4. Storage -> New bucket -> creá TRES buckets:
   - biblioteca (privado) - PDFs de estudio
   - perfil (privado) - CV
   - sitio (PUBLICO) - logo y foto de portada
5. Authentication -> Users -> Add user. Cargá el mail y la contraseña
   que va a usar Valentina para entrar al panel (esto reemplaza a la
   vieja clave única). Copiá el "User UID" que te muestra.
6. Volvé a SQL Editor y corré (reemplazando el UID que copiaste):
   ```sql
   insert into usuarios (auth_user_id, nombre, rol)
   values ('PEGAR-EL-USER-UID-ACA', 'Valentina', 'administrador');
   ```
7. Project Settings -> API copiá:
   - Project URL -> SUPABASE_URL
   - anon public key -> SUPABASE_ANON_KEY (esta SÍ es pública, se pega directo en index.html también — ver paso 2)
   - service_role key -> SUPABASE_SERVICE_ROLE_KEY (nunca se expone al browser: solo la usan las funciones de /api)

## 2. GitHub + Vercel (tu flujo habitual)

1. Antes de subir nada, abrí `index.html` y completá estas dos líneas
   cerca del principio (buscá `SUPA_URL`):
   ```js
   const SUPA_URL = "https://tu-proyecto.supabase.co";
   const SUPA_ANON_KEY = "tu-anon-public-key";
   ```
   Son las mismas que copiaste en el paso 1.7. La anon key es pública
   a propósito — no es un secreto, está protegida por las políticas de
   Supabase (RLS), así que no pasa nada por dejarla visible en el archivo.
2. Creá un repo nuevo en GitHub y subí esta carpeta entera vía la web UI.
3. En Vercel: Add New -> Project -> importá ese repo. Vercel detecta
   /api/*.js como funciones automáticamente - no hay que configurar
   ningún framework ni build command.
4. Settings -> Environment Variables -> cargá todas las de .env.example
   (dejando vacío lo de WhatsApp por ahora).
5. Deploy. Con la URL final, volvé a Environment Variables y completá
   SITE_URL, y redeployá (la necesita el agente diario).

## 3. El Centro de Operaciones

Es la MISMA app, la MISMA URL — no hay una dirección separada para el
panel. Arriba de todo hay dos pestañas fijas: **"Valentina De la Fuente"**
(el sitio público) y **"Centro de Operaciones"** (el panel). Tocás una y
cambia la vista ahí mismo, sin recargar nada — igual que en V+V.

Al tocar "Centro de Operaciones" te pide el mail y la contraseña que le
creaste a Valentina en Supabase (paso 1.5) — login real, con recuperación
de clave incluida ("¿Olvidaste tu contraseña?"). Adentro, las mismas 10
pestañas de siempre: CEO, Comercial, Marketing, Prospección, Mails,
WhatsApp IA, Asistente IA, Biblioteca, Gastos, Diseño.

La mayoría de las pestañas (CEO, Comercial, Marketing, Prospección,
Mails, WhatsApp IA, Biblioteca, Gastos) leen y escriben **directo contra
Supabase** desde el navegador — sin pasar por ninguna función propia,
igual que hace V+V. Las funciones de `/api` quedaron solo para lo que
necesita una clave secreta:

- `generar-contenido.js` (IA — Marketing)
- `prospectos.js` (POST — búsqueda con IA en Prospección)
- `asistente.js` (la Guía)
- `biblioteca.js` (subir/procesar/borrar PDFs)
- `enviar-campana.js`, `leads.js` (POST) (mandar mails, necesitan Resend)
- `operaciones.js` (Diseño — guarda logo/foto/colores/perfil)
- `notificar-lead.js` (mail de confirmación cuando llega un lead nuevo)
- `webhook-whatsapp.js`, `webhook-resend.js`, `agente-diario.js`, `cron-prospeccion.js`

El formulario de contacto de la landing también guarda el lead **directo**
en Supabase (con la anon key, que es pública a propósito) y solo llama a
`notificar-lead.js` después, para mandar el mail de confirmación.

## 4. Subida de archivos (PDFs, foto, logo, CV)

Como no hay ningún framework parseando multipart/form-data, los
archivos se mandan como JSON con el contenido en base64 (fileToBase64
en el frontend). Esto trae el mismo límite de siempre: ~4MB por archivo
por el tamaño máximo de body de las funciones de Vercel - para libros
largos en la Biblioteca, conviene subir capítulo por capítulo.

## 5. Agente diario y prospección programada

agente-diario.js corre solo todos los días a las 08:00 ART (cron en
vercel.json). Hace un resumen de leads/turnos y deja un borrador de
contenido nuevo. cron-prospeccion.js existe con la misma lógica para
prospección automática, pero no está en el cron por defecto - si querés
que corra sola (por ejemplo, una vez por semana), se agrega una entrada
más en vercel.json.

## 6. Qué está listo y qué falta

Listo: landing dinámica, Centro de Operaciones completo (10
pestañas), login real con Supabase Auth (mail/contraseña + recuperación
de clave), leads + mail de confirmación/presentación con CV, generador
de contenido, prospección con IA, Guía con bibliografía/gastos/negocio,
gastos, campañas de mail, y personalización completa (Diseño).

Pendiente:
- WhatsApp: cargar WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID,
  WHATSAPP_VERIFY_TOKEN de Meta Business. El webhook (webhook-whatsapp.js)
  ya está armado, solo falta completar el guardado de mensajes y la
  respuesta automática del agente.
- Dominio de mail propio para Resend.
- Apertura/click reales en Mails (hoy en 0%, necesita el webhook de
  Resend conectado - webhook-resend.js ya está de base).
- Matrícula profesional en el pie de página (se carga desde Diseño).

## 7. Diseño visual

Tinta #241F26 (solo texto, nunca como fondo grande), papel #FBF7F2, coral cálido #C97D63
(acento — botones y detalles), salvia
#8FA086 (secundario) - todos editables desde Diseño. El motivo visual
recurrente son dos círculos superpuestos (Familia / Empresa) y una línea
separadora que retoma la notación de genograma, coherente con el campo
de trabajo de Valentina.
