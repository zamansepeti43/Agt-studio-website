const PINTEREST_API = 'https://api.pinterest.com/v5';

export const PINTEREST_SCOPES = [
  'boards:read',
  'boards:write',
  'pins:read',
  'pins:write',
  'user_accounts:read',
];

function config() {
  const appId = process.env.PINTEREST_APP_ID || '1612529';
  const appSecret = process.env.PINTEREST_APP_SECRET;
  const redirectUri =
    process.env.PINTEREST_REDIRECT_URI ||
    'https://agt-studio.vercel.app/api/pinterest/callback';
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!appId || !appSecret || !supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Pinterest/Supabase server environment variables. Required: PINTEREST_APP_ID, PINTEREST_APP_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  return { appId, appSecret, redirectUri, supabaseUrl, serviceRoleKey };
}

function supabaseHeaders(serviceRoleKey) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
  };
}

export function getPinterestConfig() {
  return config();
}

export function buildOAuthUrl(state) {
  const { appId, redirectUri } = config();
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: PINTEREST_SCOPES.join(','),
    state,
  });
  return `https://www.pinterest.com/oauth/?${params.toString()}`;
}

export async function exchangeCode(code) {
  const { appId, appSecret, redirectUri } = config();
  const basic = Buffer.from(`${appId}:${appSecret}`).toString('base64');
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  });

  const response = await fetch(`${PINTEREST_API}/oauth/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }

  if (!response.ok || !data.access_token) {
    throw new Error(
      `Pinterest OAuth token exchange failed (${response.status}): ${data.message || data.error || text}`
    );
  }

  return data;
}

export async function pinterestFetch(path, options = {}) {
  const { supabaseUrl, serviceRoleKey } = config();
  const token = await getValidToken();

  const response = await fetch(`${PINTEREST_API}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
      Authorization: `Bearer ${token.access_token}`,
    },
  });

  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }

  if (!response.ok) {
    throw new Error(
      `Pinterest API request failed (${response.status}): ${data.message || data.error || text}`
    );
  }

  return data;
}

async function getTokenRow() {
  const { supabaseUrl, serviceRoleKey } = config();
  const response = await fetch(
    `${supabaseUrl}/rest/v1/pinterest_oauth_tokens?select=*&order=updated_at.desc&limit=1`,
    { headers: supabaseHeaders(serviceRoleKey) }
  );
  if (!response.ok) {
    throw new Error(`Pinterest token lookup failed (${response.status}): ${await response.text()}`);
  }
  const rows = await response.json();
  return rows[0] || null;
}

async function saveToken(data, existing = {}) {
  const { supabaseUrl, serviceRoleKey } = config();
  const payload = {
    pinterest_user_id: data.pinterest_user_id || existing.pinterest_user_id || null,
    access_token: data.access_token || existing.access_token,
    refresh_token: data.refresh_token || existing.refresh_token || null,
    token_type: data.token_type || existing.token_type || 'bearer',
    scope: data.scope || existing.scope || null,
    expires_at: data.expires_in
      ? new Date(Date.now() + Number(data.expires_in) * 1000).toISOString()
      : existing.expires_at || null,
    updated_at: new Date().toISOString(),
  };

  let url = `${supabaseUrl}/rest/v1/pinterest_oauth_tokens`;
  let headers = {
    ...supabaseHeaders(serviceRoleKey),
    Prefer: 'return=minimal',
  };

  if (existing.id) {
    url += `?id=eq.${encodeURIComponent(existing.id)}`;
    headers = { ...headers, Prefer: 'return=minimal' };
    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Pinterest token save failed (${response.status}): ${await response.text()}`);
    }
    return;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Pinterest token save failed (${response.status}): ${await response.text()}`);
  }
}

export async function storeOAuthToken(tokenData) {
  let pinterestUserId = null;
  try {
    const account = await fetch(`${PINTEREST_API}/user_account`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (account.ok) {
      const data = await account.json();
      pinterestUserId = data.id || data.username || null;
    }
  } catch {
    // The token itself is still valid even if profile lookup is temporarily unavailable.
  }

  await saveToken({ ...tokenData, pinterest_user_id: pinterestUserId });
  return pinterestUserId;
}

async function getValidToken() {
  const row = await getTokenRow();
  if (!row?.access_token) {
    throw new Error('Pinterest OAuth bağlantısı bulunamadı.');
  }

  const expiresAt = row.expires_at ? new Date(row.expires_at).getTime() : 0;
  const refreshNeeded = expiresAt && expiresAt - Date.now() < 7 * 24 * 60 * 60 * 1000;

  if (!refreshNeeded || !row.refresh_token) return row;

  const { appId, appSecret } = config();
  const basic = Buffer.from(`${appId}:${appSecret}`).toString('base64');
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: row.refresh_token,
  });

  const response = await fetch(`${PINTEREST_API}/oauth/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }

  if (!response.ok || !data.access_token) {
    throw new Error(
      `Pinterest token refresh failed (${response.status}): ${data.message || data.error || text}`
    );
  }

  await saveToken(data, row);
  return { ...row, ...data };
}

export async function supabaseRest(path, options = {}) {
  const { supabaseUrl, serviceRoleKey } = config();
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...options,
    headers: {
      ...supabaseHeaders(serviceRoleKey),
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!response.ok) {
    throw new Error(`Supabase request failed (${response.status}): ${text}`);
  }

  return data;
}
