import crypto from 'node:crypto';

const ETSY_OAUTH_TOKEN_URL = 'https://api.etsy.com/v3/public/oauth/token';
const ETSY_API_BASE_URL = 'https://api.etsy.com/v3/application';

export const ETSY_SCOPES = ['listings_r', 'listings_w', 'shops_r', 'shops_w', 'profile_r', 'profile_w', 'email_r'];

export function getConfig() {
  const keystring = process.env.ETSY_KEYSTRING;
  const redirectUri =
    process.env.ETSY_REDIRECT_URI ||
    'https://agt-studio.vercel.app/api/etsy/callback';
  const sharedSecret = process.env.ETSY_SHARED_SECRET;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!keystring || !sharedSecret || !supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Etsy/Supabase server environment variables. Required: ETSY_KEYSTRING, ETSY_SHARED_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  return { keystring, sharedSecret, redirectUri, supabaseUrl, serviceRoleKey };
}

function base64UrlEncode(bytes) {
  return Buffer.from(bytes)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

export function randomUrlSafe(bytes = 32) {
  return base64UrlEncode(crypto.randomBytes(bytes));
}

export async function createPkcePair() {
  const verifier = randomUrlSafe(48);
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(verifier)
  );
  return { verifier, challenge: base64UrlEncode(Buffer.from(digest)) };
}

export function parseCookies(cookieHeader = '') {
  const cookies = {};
  for (const part of cookieHeader.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    cookies[key] = decodeURIComponent(value);
  }
  return cookies;
}

export function setCookie(res, name, value, options = {}) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
  ];

  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  if (options.expires) parts.push(`Expires=${options.expires.toUTCString()}`);

  res.setHeader('Set-Cookie', parts.join('; '));
}

export function clearCookie(res, name) {
  setCookie(res, name, '', { maxAge: 0 });
}

export async function exchangeAuthorizationCode({
  code,
  verifier,
  keystring,
  redirectUri,
}) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: keystring,
    redirect_uri: redirectUri,
    code,
    code_verifier: verifier,
  });

  const response = await fetch(ETSY_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    throw new Error(
      `Etsy OAuth token exchange failed (${response.status}): ${data.error_description || data.error || text}`
    );
  }

  return data;
}

export async function upsertToken({
  supabaseUrl,
  serviceRoleKey,
  shopUserId,
  tokenData,
}) {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/etsy_oauth_tokens?on_conflict=shop_user_id`,
    {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify({
        shop_user_id: shopUserId,
        refresh_token: tokenData.refresh_token,
        scope: tokenData.scope || ETSY_SCOPES.join(' '),
        token_type: tokenData.token_type || 'Bearer',
        expires_in: tokenData.expires_in || 3600,
        updated_at: new Date().toISOString(),
      }),
    }
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Supabase token storage failed (${response.status}): ${message}`);
  }
}

export async function getStoredToken({
  supabaseUrl,
  serviceRoleKey,
}) {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/etsy_oauth_tokens?select=shop_user_id,scope,created_at,updated_at&order=updated_at.desc&limit=1`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    }
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Supabase token lookup failed (${response.status}): ${message}`);
  }

  const rows = await response.json();
  return rows[0] || null;
}


export async function refreshAccessToken({ keystring, refreshToken }) {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: keystring,
    refresh_token: refreshToken,
  });
  const response = await fetch(ETSY_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!response.ok || !data.access_token) {
    throw new Error(`Etsy token refresh failed (${response.status}): ${data.error_description || data.error || text}`);
  }
  return data;
}

export async function getLatestStoredToken({ supabaseUrl, serviceRoleKey }) {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/etsy_oauth_tokens?select=shop_user_id,refresh_token,scope,token_type,expires_in,created_at,updated_at&order=updated_at.desc&limit=1`,
    { headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` } }
  );
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Supabase token lookup failed (${response.status}): ${message}`);
  }
  const rows = await response.json();
  return rows[0] || null;
}

export async function getEtsyAccessToken() {
  const { keystring, supabaseUrl, serviceRoleKey } = getConfig();
  const stored = await getLatestStoredToken({ supabaseUrl, serviceRoleKey });
  if (!stored?.refresh_token || !stored?.shop_user_id) {
    throw new Error('Etsy mağaza bağlantısı bulunamadı.');
  }
  const tokenData = await refreshAccessToken({ keystring, refreshToken: stored.refresh_token });
  await upsertToken({
    supabaseUrl,
    serviceRoleKey,
    shopUserId: Number(stored.shop_user_id),
    tokenData: { ...tokenData, scope: tokenData.scope || stored.scope },
  });
  return {
    accessToken: tokenData.access_token,
    shopUserId: Number(stored.shop_user_id),
    scope: tokenData.scope || stored.scope,
  };
}

export async function requireAdminRequest(req) {
  const authorization = req.headers.authorization || '';
  if (!authorization.startsWith('Bearer ')) {
    throw new Error('Unauthorized');
  }

  const accessToken = authorization.slice('Bearer '.length).trim();
  if (!accessToken) throw new Error('Unauthorized');

  const { supabaseUrl, serviceRoleKey } = getConfig();

  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!userResponse.ok) throw new Error('Unauthorized');

  const user = await userResponse.json();
  if (!user?.id) throw new Error('Unauthorized');

  const adminResponse = await fetch(
    `${supabaseUrl}/rest/v1/admin_users?select=id&id=eq.${encodeURIComponent(user.id)}&limit=1`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    }
  );

  if (!adminResponse.ok) throw new Error('Admin yetkisi doğrulanamadı.');

  const admins = await adminResponse.json();
  if (!Array.isArray(admins) || admins.length === 0) {
    throw new Error('Forbidden');
  }

  return user;
}

export async function etsyApiFetch(path, options = {}) {
  const { keystring, sharedSecret } = getConfig();
  const { accessToken } = await getEtsyAccessToken();
  const response = await fetch(`${ETSY_API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.headers || {}),
      'x-api-key': `${keystring}:${sharedSecret}`,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!response.ok) {
    throw new Error(`Etsy API request failed (${response.status}): ${data.error || data.message || text}`);
  }
  return data;
}
