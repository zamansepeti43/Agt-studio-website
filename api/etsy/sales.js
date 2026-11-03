import { etsyApiFetch, getEtsyAccessToken, requireAdminRequest } from './_lib.js';

function money(value) {
  if (!value || value.amount == null) return 0;
  return Number(value.amount) / Number(value.divisor || 1);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    await requireAdminRequest(req);
    const { shopUserId, scope } = await getEtsyAccessToken();
    const grantedScopes = String(scope || '').split(/\\s+/).filter(Boolean);
    if (!grantedScopes.includes('transactions_r')) {
      res.setHeader('Cache-Control', 'no-store');
      res.status(200).json({
        available: false,
        reason: 'transactions_scope_required',
        message: 'Ürün bazında gerçek satış verisi için Etsy bağlantısına transactions_r (satışları okuma) izni eklenmeli. Etsy bağlantısını yeniden yetkilendir.',
      });
      return;
    }

    const shop = await etsyApiFetch('/users/' + shopUserId + '/shops');
    const shopId = Number(shop?.shop_id);
    if (!shopId) throw new Error('Etsy mağaza kimliği bulunamadı.');

    const transactions = [];
    const pageSize = 100;
    const maxPages = 10;
    let reportedCount = null;
    for (let page = 0; page < maxPages; page += 1) {
      const payload = await etsyApiFetch('/shops/' + shopId + '/transactions?limit=' + pageSize + '&offset=' + (page * pageSize));
      const rows = Array.isArray(payload?.results) ? payload.results : [];
      if (reportedCount == null && Number.isFinite(Number(payload?.count))) reportedCount = Number(payload.count);
      transactions.push(...rows);
      if (rows.length < pageSize || (reportedCount != null && transactions.length >= reportedCount)) break;
    }

    const byListing = new Map();
    let grossTotal = 0;
    let unitsTotal = 0;
    for (const transaction of transactions) {
      const listingId = Number(transaction.listing_id || 0);
      const quantity = Math.max(0, Number(transaction.quantity || 0));
      const unitPrice = money(transaction.price);
      const gross = unitPrice * quantity;
      grossTotal += gross;
      unitsTotal += quantity;
      if (!listingId) continue;
      const current = byListing.get(listingId) || {
        listing_id: listingId,
        title: transaction.title || 'Etsy ilanı',
        orders: 0,
        units: 0,
        gross_revenue: 0,
        currency: transaction.price?.currency_code || shop.currency_code || null,
        last_sale_timestamp: null,
      };
      current.orders += 1;
      current.units += quantity;
      current.gross_revenue += gross;
      const timestamp = Number(transaction.paid_timestamp || transaction.create_timestamp || transaction.created_timestamp || 0);
      current.last_sale_timestamp = Math.max(current.last_sale_timestamp || 0, timestamp) || null;
      byListing.set(listingId, current);
    }

    const listingSales = [...byListing.values()]
      .map((item) => ({ ...item, gross_revenue: Number(item.gross_revenue.toFixed(2)) }))
      .sort((a, b) => b.gross_revenue - a.gross_revenue || b.units - a.units);

    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({
      available: true,
      source: 'Etsy Open API transactions',
      transaction_count_returned: transactions.length,
      transaction_count_reported: reportedCount,
      truncated: reportedCount != null && transactions.length < reportedCount,
      units_sold: unitsTotal,
      gross_revenue: Number(grossTotal.toFixed(2)),
      currency: shop.currency_code || null,
      listing_sales: listingSales,
      measurement_note: 'İlan bazında satış ve brüt satır tutarı Etsy işlem kayıtlarından hesaplanır. Bu tutar Etsy ücretleri, vergiler, iadeler ve ödeme kesintileri sonrası net kazanç değildir.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Etsy satış verileri alınamadı.';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 502;
    res.status(status).json({ error: message });
  }
}
