import { getConfig } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { keystring } = getConfig();
    const sharedSecret = process.env.ETSY_SHARED_SECRET;

    if (!sharedSecret) {
      throw new Error('Missing ETSY_SHARED_SECRET server environment variable.');
    }

    const response = await fetch(
      'https://openapi.etsy.com/v3/application/openapi-ping',
      {
        headers: {
          'x-api-key': `${keystring}:${sharedSecret}`,
        },
      }
    );

    const body = await response.text();
    let data;
    try {
      data = JSON.parse(body);
    } catch {
      data = { raw: body.slice(0, 300) };
    }

    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({
      etsyStatus: response.status,
      apiKeyActive: response.ok,
      message: response.ok
        ? 'Etsy API key is active and recognized.'
        : 'Etsy API did not accept the configured key/secret.',
      details: response.ok ? undefined : data,
    });
  } catch (error) {
    res.status(500).json({
      apiKeyActive: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
