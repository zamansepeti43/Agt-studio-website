import { etsyApiFetch, getEtsyAccessToken, requireAdminRequest } from './_lib.js';

const SEO_TITLES = {
  4574820715: 'Barbershop Management Software | Appointment, Crm & Inventory | Windows App',
  4577542450: 'Etsy Product Idea Finder | Digital Product Research Tool | Etsy Seller Tool',
  4574138529: 'Pressure Washing Business Spreadsheet | Pricing Calculator | Job Tracker & Profit Dashboard',
  4573839919: 'Etsy Profit Calculator | Etsy Fee Calculator | Pricing Spreadsheet | Profit Tracker',
  4573718071: 'Etsy Product Research Tool | Digital Product Ideas | Competitor Analysis Spreadsheet',
  4575285227: 'Etsy Seller Customer Support Tool | Ai Reply Prompts | Buyer Response Templates | Excel',
  4574114283: 'Bakery Pricing Calculator | Recipe Cost Spreadsheet | Profit Calculator | Order Tracker',
  4576154195: 'Ai Api Finder Pro | Free Ai Apis | Ai Developer Tool | Android App',
  4576139109: 'Android Apk Builder | Zip to Apk | Html to Apk | No Code App Maker',
  4576174491: 'Ai Api Finder | Free Ai Apis | Ai Developer Tool | Android App',
  4576184560: 'Android Apk Builder | Zip to Apk | Html to Apk | Windows Software',
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
      if (String(listing.title) === newTitle) {
        skipped.push({ listing_id: listing.listing_id, reason: 'Başlık zaten güncel.' });
        continue;
      }

      await etsyApiFetch(`/shops/${shopId}/listings/${listing.listing_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ title: newTitle }).toString(),
      });

      changed.push({ listing_id: Number(listing.listing_id), old_title: listing.title, new_title: newTitle });
    }

    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({
      ok: true,
      changed,
      skipped,
      message: `${changed.length} Etsy ilan başlığı güncellendi.`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Etsy SEO title setup failed';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 502;
    res.status(status).json({ error: message });
  }
}
