import { useEffect, useState } from 'react';

type EtsyStatus = { connected: boolean; shopUserId?: number | null; scope?: string | null; connectedAt?: string | null; updatedAt?: string | null; error?: string; };
type EtsyShop = { shop_id?: number; user_id?: number; shop_name?: string; title?: string; currency_code?: string; transaction_sold_count?: number; review_count?: number; review_average?: number; };
type EtsyListing = { listing_id: number; title: string; state: string; price?: { amount?: number; divisor?: number; currency_code?: string }; quantity?: number; url?: string; };

export default function EtsyManager() {
  const [status, setStatus] = useState<EtsyStatus | null>(null);
  const [shop, setShop] = useState<EtsyShop | null>(null);
  const [listings, setListings] = useState<EtsyListing[]>([]);
  const [listingCount, setListingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setDataLoading(true); setError('');
    try {
      const results = await Promise.all([fetch('/api/etsy/shop', { cache: 'no-store' }), fetch('/api/etsy/listings?state=active&limit=50&offset=0', { cache: 'no-store' })]);
      const shopData = await results[0].json(); const listingsData = await results[1].json();
      if (!results[0].ok) throw new Error(shopData.error || 'Mağaza bilgisi alınamadı.');
      if (!results[1].ok) throw new Error(listingsData.error || 'İlanlar alınamadı.');
      setShop(shopData); setListings(listingsData.listings?.results || []); setListingCount(Number(listingsData.listings?.count || 0));
    } catch (err) { setError(err instanceof Error ? err.message : 'Etsy verileri alınamadı.'); }
    finally { setDataLoading(false); }
  };

  const loadStatus = async () => {
    try { const res = await fetch('/api/etsy/status', { cache: 'no-store' }); const data = await res.json(); setStatus(data); if (data.connected) await loadData(); }
    catch { setStatus({ connected: false, error: 'Durum alınamadı.' }); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadStatus(); }, []);

  if (loading) return <div className="admin-page"><h1>Etsy Yönetimi</h1><p>Bağlantı kontrol ediliyor...</p></div>;

  return (
    <div className="admin-page">
      <div className="admin-page-header"><div><h1>Etsy Yönetimi</h1><p>AGT Studio Etsy mağazanı buradan yönetmek için temel panel.</p></div>{status?.connected && <button type="button" onClick={loadData} disabled={dataLoading}>{dataLoading ? 'Yükleniyor...' : '↻ Yenile'}</button>}</div>
      <div style={{ maxWidth: 1100 }}>
        <div style={{ background: 'var(--admin-card-bg, #fff)', border: '1px solid var(--admin-border, #e5e7eb)', borderRadius: 16, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}><div><h2 style={{ margin: 0 }}>Etsy Bağlantısı</h2><p style={{ marginTop: 8 }}>{status?.connected ? 'Etsy mağazan AGT Studio’ya bağlı ve API erişimi aktif.' : 'Henüz Etsy mağazası bağlanmadı.'}</p></div><div style={{ fontWeight: 700 }}>{status?.connected ? '🟢 Bağlı' : '⚪ Bağlı değil'}</div></div>
          {status?.error && <p style={{ color: '#b91c1c' }}>{status.error}</p>}{error && <p style={{ color: '#b91c1c' }}>{error}</p>}
          {!status?.connected && <button type="button" onClick={() => { window.location.href = '/api/etsy/auth'; }}>Etsy Mağazasını Bağla</button>}
          {status?.connected && <div style={{ marginTop: 20, fontSize: 14 }}><div><strong>Shop User ID:</strong> {status.shopUserId}</div><div style={{ marginTop: 6 }}><strong>Yetkiler:</strong> {status.scope}</div></div>}
        </div>
        {status?.connected && <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginTop: 18 }}>
            <div><small>Mağaza</small><h3>{shop?.shop_name || '—'}</h3></div>
            <div><small>Aktif İlan</small><h3>{listingCount}</h3></div>
            <div><small>Satış</small><h3>{shop?.transaction_sold_count ?? '—'}</h3></div>
            <div><small>Değerlendirme</small><h3>{shop?.review_count != null ? String(shop.review_count) + ' (' + Number(shop.review_average || 0).toFixed(1) + ')' : '—'}</h3></div>
          </div>
          <div style={{ marginTop: 20, background: 'var(--admin-card-bg, #fff)', border: '1px solid var(--admin-border, #e5e7eb)', borderRadius: 16, padding: 24 }}>
            <h2 style={{ marginTop: 0 }}>Aktif İlanlar</h2>
            {dataLoading && <p>İlanlar Etsy’den getiriliyor...</p>}
            {!dataLoading && listings.length === 0 && <p>Aktif ilan bulunamadı.</p>}
            {!dataLoading && listings.map((listing) => { const p = listing.price?.amount != null && listing.price?.divisor ? listing.price.amount / listing.price.divisor : null; return <div key={listing.listing_id} style={{ display: 'flex', justifyContent: 'space-between', gap: 14, padding: 14, borderBottom: '1px solid var(--admin-border, #e5e7eb)' }}><div><strong>{listing.title}</strong><div style={{ fontSize: 13, opacity: .7 }}>ID: {listing.listing_id} · Stok: {listing.quantity ?? '—'}</div></div><strong>{p != null ? p.toFixed(2) + ' ' + (listing.price?.currency_code || '') : '—'}</strong></div>; })}
          </div>
        </>}
      </div>
    </div>
  );
}