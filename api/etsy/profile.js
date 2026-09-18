import { etsyApiFetch, getEtsyAccessToken } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const { shopUserId } = await getEtsyAccessToken();
    const profile = await etsyApiFetch(`/users/${shopUserId}`);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(profile);
  } catch (error) {
    res.status(502).json({
      error: error instanceof Error ? error.message : 'Etsy profile request failed',
    });
  }
}
