import { etsyApiFetch, getEtsyAccessToken, requireAdminRequest } from './_lib.js';

const ALLOWED_FIELDS = [
  'title',
  'announcement',
  'sale_message',
  'digital_sale_message',
];

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'PUT') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    if (req.method === 'PUT') {
      await requireAdminRequest(req);
      const { shopUserId } = await getEtsyAccessToken();
      const current = await etsyApiFetch(`/users/${shopUserId}/shops`);
      const shopId = Number(current?.shop_id);

      if (!shopId) throw new Error('Etsy shop ID bulunamadı.');

      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
      body = body && typeof body === 'object' ? body : {};

      const form = new URLSearchParams();
      for (const field of ALLOWED_FIELDS) {
        if (Object.prototype.hasOwnProperty.call(body, field)) {
          const value = body[field];
          if (value !== null && value !== undefined) form.set(field, String(value));
        }
      }

      if (!form.toString()) {
        res.status(400).json({ error: 'Güncellenecek alan bulunamadı.' });
        return;
      }

      const updated = await etsyApiFetch(`/shops/${shopId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
      });

      res.setHeader('Cache-Control', 'no-store');
      res.status(200).json(updated);
      return;
    }

    const { shopUserId } = await getEtsyAccessToken();
    const shop = await etsyApiFetch(`/users/${shopUserId}/shops`);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(shop);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Etsy shop request failed';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 502;
    res.status(status).json({ error: message });
  }
}
