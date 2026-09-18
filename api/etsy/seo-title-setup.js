import { etsyApiFetch, getEtsyAccessToken, requireAdminRequest } from './_lib.js';

const SEO_PRICES = {
  4574820715: 399,
  4577542450: 199,
  4574138529: 249,
  4573839919: 199,
  4573718071: 179,
  4575285227: 149,
  4574114283: 249,
  4576154195: 199,
  4576139109: 149,
  4576174491: 129,
  4576184560: 149,
};

const SEO_TITLES = {
  4574820715: 'Barbershop Management Software | Appointment, Crm & Inventory | Windows App',
  4577542450: 'Etsy Product Idea Finder | Product Radar Android App | 259,200 Concepts',
  4574138529: 'Pressure Washing Business Spreadsheet | Pricing Calculator | Job Tracker & Profit Dashboard',
  4573839919: 'Etsy Profit Calculator | Excel Fee Calculator | Pricing & Profit Tracker',
  4573718071: 'Etsy Product Research Tool | Digital Product Ideas | Competitor Analysis Spreadsheet',
  4575285227: 'Etsy Seller Customer Support Tool | Ai Reply Prompts | Buyer Response Templates | Excel',
  4574114283: 'Bakery Pricing Calculator | Recipe Cost Spreadsheet | Profit Calculator | Order Tracker',
  4576154195: 'AI API Finder Pro | 26+ Providers | Live Updates | Android App',
  4576139109: 'No-Code Android APK Builder | ZIP to APK App Maker | Digital Download',
  4576174491: 'AI API Finder Basic | Android App for 26+ Providers | Digital Download',
  4576184560: 'Windows APK Builder | ZIP to Android App | Digital Download',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    await requireAdminRequest(req);
    const { shopUserId } = await getEtsyAccessToken();
    const shop = await etsyApiFetch(`/users/${shopUserId}/shops`);
    const shopId = Number(shop?.shop_id);
    if (!shopId) throw new Error('Etsy shop ID bulunamadı.');

    const live = await etsyApiFetch(`/shops/${shopId}/listings?state=active&limit=100&offset=0`);
    const changed = [];
    const skipped = [];

    for (const listing of live?.results || []) {
      const newTitle = SEO_TITLES[Number(listing.listing_id)];
      if (!newTitle) {
        skipped.push({ listing_id: listing.listing_id, reason: 'Bu ilan için SEO başlığı tanımlı değil.' });
        continue;
      }
      const newPrice = SEO_PRICES[Number(listing.listing_id)];
      const titleChanged = String(listing.title) !== newTitle;
      const currentPrice = Number(listing.price?.amount) / Number(listing.price?.divisor || 100);
      const priceChanged = Number.isFinite(newPrice) && Math.abs(currentPrice - newPrice) > 0.001;

      if (!titleChanged && !priceChanged) {
        skipped.push({ listing_id: listing.listing_id, reason: 'Başlık ve fiyat zaten güncel.' });
        continue;
      }

      const payload = {};
      if (titleChanged) payload.title = newTitle;
      if (priceChanged) payload.price = String(newPrice);

      await etsyApiFetch(`/shops/${shopId}/listings/${listing.listing_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(payload).toString(),
      });

      changed.push({
        listing_id: Number(listing.listing_id),
        old_title: listing.title,
        new_title: titleChanged ? newTitle : listing.title,
        old_price: Number.isFinite(currentPrice) ? currentPrice : null,
        new_price: priceChanged ? newPrice : currentPrice,
      });
    }

    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({
      ok: true,
      changed,
      skipped,
      message: `${changed.length} Etsy ilanı başlık/fiyat güncellemesi uygulandı.`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Etsy SEO title setup failed';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 502;
    res.status(status).json({ error: message });
  }
}
