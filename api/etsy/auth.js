import {
  ETSY_SCOPES,
  createPkcePair,
  getConfig,
  randomUrlSafe,
  setCookie,
} from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { keystring, redirectUri } = getConfig();
    const { verifier, challenge } = await createPkcePair();
    const state = randomUrlSafe(32);

    const session = Buffer.from(
      JSON.stringify({
        state,
        verifier,
        createdAt: Date.now(),
      })
    ).toString('base64url');

    setCookie(res, 'etsy_oauth', session, { maxAge: 600 });

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: keystring,
      redirect_uri: redirectUri,
      scope: ETSY_SCOPES.join(' '),
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    });

    res.writeHead(302, {
      Location: `https://www.etsy.com/oauth/connect?${params.toString()}`,
      'Cache-Control': 'no-store',
    });
    res.end();
  } catch (error) {
    res.status(500).json({
      error: 'OAuth initialization failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
