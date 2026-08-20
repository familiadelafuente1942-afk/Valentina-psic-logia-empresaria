// Verifica la sesión del panel contra Supabase Auth de verdad (login con
// mail/contraseña), en vez de una clave única compartida. El navegador manda
// el access_token en el header Authorization: Bearer <token>; acá lo validamos
// contra Supabase y devolvemos el usuario si es válido.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

function getBearerToken(req) {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}

async function getUserFromToken(token) {
  if (!token) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// Devuelve el usuario autenticado, o null (y ya respondió 401) si no hay sesión válida.
async function requireAuth(req, res) {
  const token = getBearerToken(req);
  const user = await getUserFromToken(token);
  if (!user) {
    res.status(401).json({ error: 'unauthorized' });
    return null;
  }
  return user;
}

module.exports = { requireAuth, getBearerToken, getUserFromToken };

