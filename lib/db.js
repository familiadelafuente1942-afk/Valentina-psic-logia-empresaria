// Helper mínimo para hablar con Supabase por REST (PostgREST) y Storage,
// sin depender del paquete @supabase/supabase-js. Todas las funciones de
// /api importan esto. Usa siempre la SERVICE_ROLE_KEY (nunca exponer
// este archivo ni sus variables al browser).

const URL_BASE = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function headers(extra = {}) {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

// --- Tablas (PostgREST) -------------------------------------------------

async function dbSelect(table, query = '') {
  const res = await fetch(`${URL_BASE}/rest/v1/${table}?${query}`, { headers: headers() });
  if (!res.ok) throw new Error(`dbSelect ${table}: ${await res.text()}`);
  return res.json();
}

async function dbInsert(table, rows) {
  const res = await fetch(`${URL_BASE}/rest/v1/${table}`, {
    method: 'POST',
    headers: headers({ Prefer: 'return=representation' }),
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`dbInsert ${table}: ${await res.text()}`);
  return res.json();
}

async function dbUpdate(table, matchQuery, patch) {
  const res = await fetch(`${URL_BASE}/rest/v1/${table}?${matchQuery}`, {
    method: 'PATCH',
    headers: headers({ Prefer: 'return=representation' }),
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`dbUpdate ${table}: ${await res.text()}`);
  return res.json();
}

async function dbDelete(table, matchQuery) {
  const res = await fetch(`${URL_BASE}/rest/v1/${table}?${matchQuery}`, {
    method: 'DELETE',
    headers: headers(),
  });
  if (!res.ok) throw new Error(`dbDelete ${table}: ${await res.text()}`);
}

async function dbRpc(fn, args) {
  const res = await fetch(`${URL_BASE}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`dbRpc ${fn}: ${await res.text()}`);
  return res.json();
}

// --- Storage --------------------------------------------------------------

async function storageUpload(bucket, path, buffer, contentType) {
  const res = await fetch(`${URL_BASE}/storage/v1/object/${bucket}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': contentType,
      'x-upsert': 'true',
    },
    body: buffer,
  });
  if (!res.ok) throw new Error(`storageUpload ${bucket}/${path}: ${await res.text()}`);
  return res.json();
}

function storagePublicUrl(bucket, path) {
  if (!path) return null;
  return `${URL_BASE}/storage/v1/object/public/${bucket}/${path}`;
}

async function storageSignedUrl(bucket, path, expiresIn = 60 * 60 * 24 * 30) {
  if (!path) return null;
  const res = await fetch(`${URL_BASE}/storage/v1/object/sign/${bucket}/${path}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ expiresIn }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.signedURL ? `${URL_BASE}/storage/v1${data.signedURL}` : null;
}

async function storageDelete(bucket, path) {
  if (!path) return;
  await fetch(`${URL_BASE}/storage/v1/object/${bucket}/${path}`, {
    method: 'DELETE',
    headers: headers(),
  });
}

module.exports = {
  dbSelect,
  dbInsert,
  dbUpdate,
  dbDelete,
  dbRpc,
  storageUpload,
  storagePublicUrl,
  storageSignedUrl,
  storageDelete,
};
