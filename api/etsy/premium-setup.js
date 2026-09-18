import { etsyApiFetch, getEtsyAccessToken, requireAdminRequest } from './_lib.js';

const PREMIUM_SHOP = {
  title: 'Premium Digital Tools & Creative Resources',
  announcement: 'Welcome to AGTStudioCo — practical digital tools, software and templates designed to help creators, entrepreneurs and small businesses work smarter. Instant digital access. New products added regularly.',
  sale_message: 'Thank you for choosing AGTStudioCo. Your digital product is delivered through Etsy after purchase. If you need help with your order, please contact us through Etsy messages.',
  digital_sale_message: 'Thank you for your purchase. Your digital files are available through your Etsy order. Please download and save your files after purchase. If you need installation or product support, message AGTStudioCo through Etsy.',
};

const SECTION_RULES = [
  { title: 'Business Tools', match: ['barberos', 'pressure washing', 'business'] },
  { title: 'Research & Planning', match: ['product idea finder', 'product radar'] },
  { title: 'AI & Developer Tools', match: ['ai api finder'] },
  { title: 'App Development Tools', match: ['apk builder'] },
];

function findSection(title) {
  const t = String(title || '').toLowerCase();
  return SECTION_RULES.find(rule => rule.match.some(term => t.includes(term)))?.title || null;
}

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

    const form = new URLSearchParams(PREMIUM_SHOP);
    const updatedShop = await etsyApiFetch(`/shops/${shopId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });

    const existingSections = await etsyApiFetch(`/shops/${shopId}/sections`);
    const sectionMap = new Map(
      (existingSections?.results || []).map(section => [String(section.title).toLowerCase(), Number(section.shop_section_id)])
    );

    const createdSections = [];
    for (const rule of SECTION_RULES) {
      const key = rule.title.toLowerCase();
      if (sectionMap.has(key)) continue;
      const section = await etsyApiFetch(`/shops/${shopId}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ title: rule.title }).toString(),
      });
      const id = Number(section?.shop_section_id);
      if (id) {
        sectionMap.set(key, id);
        createdSections.push(rule.title);
      }
    }

    const listings = await etsyApiFetch(`/shops/${shopId}/listings?state=active&limit=100&offset=0`);
    const assigned = [];
    for (const listing of listings?.results || []) {
      const sectionTitle = findSection(listing.title);
      if (!sectionTitle) continue;
      const sectionId = sectionMap.get(sectionTitle.toLowerCase());
      if (!sectionId || Number(listing.shop_section_id) === sectionId) continue;

      // Etsy Open API v3 updateListing is PATCH and is scoped to the shop.
      await etsyApiFetch(`/shops/${shopId}/listings/${listing.listing_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ shop_section_id: String(sectionId) }).toString(),
      });
      assigned.push({ listing_id: listing.listing_id, section: sectionTitle });
    }

    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({
      ok: true,
      shop: updatedShop,
      sectionsCreated: createdSections,
      listingsAssigned: assigned,
      message: 'Premium mağaza kurulumu tamamlandı.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Premium Etsy setup failed';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 502;
    res.status(status).json({ error: message });
  }
}
