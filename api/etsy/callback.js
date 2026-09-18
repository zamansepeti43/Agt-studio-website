import {
  clearCookie,
  exchangeAuthorizationCode,
  getConfig,
  parseCookies,
  upsertToken,
} from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const cookies = parseCookies(req.headers.cookie);
  const rawSession = cookies.etsy_oauth;

  try {
    if (!rawSession) {
      throw new Error('OAuth session cookie is missing or expired.');
    }

    const session = JSON.parse(
      Buffer.from(decodeURIComponent(rawSession), 'base64url').toString('utf8')
    );

    if (!session.state || !session.verifier || !session.createdAt) {
      throw new Error('OAuth session is invalid.');
    }

    if (Date.now() - Number(session.createdAt) > 10 * 60 * 1000) {
      throw new Error('OAuth session expired. Please start again.');
    }

    if (req.query.error) {
      throw new Error(
        String(req.query.error_description || req.query.error)
      );
    }

    const code = String(req.query.code || '');
    const state = String(req.query.state || '');

    if (!code) throw new Error('Etsy did not return an authorization code.');
    if (!state || state !== session.state) {
      throw new Error('OAuth state validation failed.');
    }

    const { keystring, redirectUri, supabaseUrl, serviceRoleKey } = getConfig();

    const tokenData = await exchangeAuthorizationCode({
      code,
      verifier: session.verifier,
      keystring,
      redirectUri,
    });

    if (!tokenData.access_token || !tokenData.refresh_token) {
      throw new Error('Etsy returned an incomplete OAuth token response.');
    }

    const shopUserId = Number(String(tokenData.access_token).split('.')[0]);
    if (!Number.isSafeInteger(shopUserId) || shopUserId <= 0) {
      throw new Error('Could not determine the Etsy user ID from the token.');
    }

    await upsertToken({
      supabaseUrl,
      serviceRoleKey,
      shopUserId,
      tokenData,
    });

    clearCookie(res, 'etsy_oauth');

    res.writeHead(302, {
      Location: 'https://agt-studio.vercel.app/admin?etsy=connected',
      'Cache-Control': 'no-store',
    });
    res.end();
  } catch (error) {
    clearCookie(res, 'etsy_oauth');
    res.status(400).send(
      `<html><body style="font-family:system-ui;padding:32px"><h1>Etsy bağlantısı tamamlanamadı</h1><p>${String(
        error instanceof Error ? error.message : 'Unknown error'
      ).replace(/</g, '&lt;')}</p><p><a href="/api/etsy/auth">Tekrar dene</a></p></body></html>`
    );
  }
}
