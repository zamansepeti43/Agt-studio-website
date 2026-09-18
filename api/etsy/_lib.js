import crypto from 'node:crypto';

const ETSY_OAUTH_TOKEN_URL = 'https://api.etsy.com/v3/public/oauth/token';

export const ETSY_SCOPES = ['listings_r', 'listings_w', 'shops_r', 'shops_w'];

export function getConfig() {
  const keystring = process.env.ETSY_KEYSTRING;
  const redirectUri =
    process.env.ETSY_REDIRECT_URI ||
    'https://agt-studio.vercel.app/api/etsy/callback';
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!keystring || !supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Etsy/Supabase server environment variables. Required: ETSY_KEYSTRING, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  return { keystring, redirectUri, supabaseUrl, serviceRoleKey };
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
