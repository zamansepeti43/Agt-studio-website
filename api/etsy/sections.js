import { etsyApiFetch, getEtsyAccessToken, requireAdminRequest } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { shopUserId } = await getEtsyAccessToken();
    const shop = await etsyApiFetch(`/users/${shopUserId}/shops`);
    if (!shop?.shop_id) throw new Error('Etsy shop ID alınamadı.');

    const sections = await etsyApiFetch(`/shops/${shop.shop_id}/sections`);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({
      shopId: Number(shop.shop_id),
      sections: sections?.results || [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Etsy shop sections request failed';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 502;
    res.status(status).json({ error: message });
  }
}
