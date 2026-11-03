import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';

type Shop = {
  shop_id?: number;
  shop_name?: string;
  title?: string;
  url?: string;
  currency_code?: string;
  transaction_sold_count?: number;
  review_count?: number;
  review_average?: number;
  listing_active_count?: number;
  digital_listing_count?: number;
  is_vacation?: boolean;
};

type Listing = {
  listing_id: number;
  title: string;
  state?: string;
  url?: string;
  views?: number;
  num_favorers?: number;
  quantity?: number;
  price?: { amount?: number; divisor?: number; currency_code?: string };
};

type SalesData = { available: boolean; reason?: string; message?: string; units_sold?: number; gross_revenue?: number; currency?: string; listing_sales?: Array<{ listing_id: number; title: string; orders: number; units: number; gross_revenue: number; currency?: string | null; last_sale_timestamp?: number | null }>; measurement_note?: string; truncated?: boolean; transaction_count_returned?: number; transaction_count_reported?: number | null };

type DashboardData = {
  shop: Shop;
  listings: { count?: number; results?: Listing[] };
};

const panel: React.CSSProperties = {
  background: '#0d1117',
  border: '1px solid #303846',
  borderRadius: 14,
  padding: 18,
};

function money(listing: Listing) {
  const amount = listing.price?.amount;
  const divisor = listing.price?.divisor || 1;
  if (amount == null) return '—';
  return (amount / divisor).toFixed(2) + ' ' + (listing.price?.currency_code || '');
}

function metric(label: string, value: string | number, note?: string) {
  return (
    <div key={label} style={panel}>
      <div style={{ fontSize: 12, opacity: .65 }}>{label}</div>
      <div style={{ fontSize: 27, fontWeight: 850, marginTop: 7 }}>{value}</div>
      {note && <div style={{ fontSize: 11, opacity: .55, marginTop: 5 }}>{note}</div>}
    </div>
  );
}

export default function EtsyPerformance() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  const [sales, setSales] = useState<SalesData | null>(null);
  const [salesError, setSalesError] = useState('');
  const [salesLoading, setSalesLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [shopResponse, listingResponse] = await Promise.all([
        fetch('/api/etsy/shop', { cache: 'no-store' }),
        fetch('/api/etsy/listings?state=active&limit=100&offset=0', { cache: 'no-store' }),
      ]);
      const [shop, listingPayload] = await Promise.all([
        shopResponse.json(),
        listingResponse.json(),
      ]);
      if (!shopResponse.ok) throw new Error(shop.error || 'Etsy mağaza verisi alınamadı.');
      if (!listingResponse.ok) throw new Error(listingPayload.error || 'Etsy ilan verileri alınamadı.');
      setData({ shop, listings: listingPayload.listings || {} });
      setLastUpdated(new Date().toLocaleString('tr-TR'));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Etsy verileri alınamadı.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSales = useCallback(async () => {
    setSalesLoading(true);
    setSalesError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Yönetici oturumu bulunamadı. Lütfen yeniden giriş yap.');
      const response = await fetch('/api/etsy/sales', {
        headers: { Authorization: 'Bearer ' + session.access_token },
        cache: 'no-store',
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Etsy satış verileri alınamadı.');
      setSales(payload);
    } catch (cause) {
      setSalesError(cause instanceof Error ? cause.message : 'Etsy satış verileri alınamadı.');
    } finally {
      setSalesLoading(false);
    }
  }, []);

  useEffect(() => { void load(); void loadSales(); }, [load, loadSales]);

  const listings = data?.listings.results || [];
  const totals = useMemo(() => {
    const views = listings.reduce((sum, item) => sum + Number(item.views || 0), 0);
    const favorites = listings.reduce((sum, item) => sum + Number(item.num_favorers || 0), 0);
    const favoriteRate = views > 0 ? (favorites / views) * 100 : 0;
    return { views, favorites, favoriteRate };
  }, [listings]);

  const ranked = useMemo(
    () => [...listings].sort((a, b) =>
      (Number(b.views || 0) * 1 + Number(b.num_favorers || 0) * 10) -
      (Number(a.views || 0) * 1 + Number(a.num_favorers || 0) * 10)
    ),
    [listings],
  );

  const report = useMemo(() => {
    if (!data) return null;
    return {
      report_type: 'AGT Studio Etsy performance snapshot',
      generated_at: new Date().toISOString(),
      shop: {
        name: data.shop.shop_name || data.shop.title || 'AGTStudioCo',
        shop_url: data.shop.url || null,
        currency: data.shop.currency_code || null,
        lifetime_sales: data.shop.transaction_sold_count ?? null,
        review_count: data.shop.review_count ?? null,
        review_average: data.shop.review_average ?? null,
        active_listing_count: data.shop.listing_active_count ?? listings.length,
      },
      available_listing_metrics: {
        active_listings_returned: listings.length,
        listing_views_sum: totals.views,
        listing_favorites_sum: totals.favorites,
        favorites_per_100_listing_views: Number(totals.favoriteRate.toFixed(2)),
        measurement_note: 'Etsy API listing views and favorites are cumulative listing-level counters, not shop visits or a selected date range.',
      },
      unavailable_via_current_etsy_api: [
        'Shop visits',
        'Traffic sources',
        'Shop conversion rate (requires visits)',
        'Daily or date-range trend history',
        'Sales and revenue attributed to each listing',
      ],
      listings: ranked.map((item) => ({
        listing_id: item.listing_id,
        title: item.title,
        state: item.state || 'active',
        views: Number(item.views || 0),
        favorites: Number(item.num_favorers || 0),
        price: money(item),
        quantity: item.quantity ?? null,
        url: item.url || null,
      })),
    };
  }, [data, listings, ranked, totals]);

  const copyReport = async () => {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setError('Rapor panoya kopyalanamadı. Tarayıcı izinlerini kontrol et.');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header" style={{ alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div>
          <h1>📈 Etsy Performans Merkezi</h1>
          <p>AGTStudioCo mağazasının Etsy API üzerinden alınabilen gerçek performans verileri.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => void load()} disabled={loading}>↻ Yenile</button>
          <button type="button" onClick={() => void copyReport()} disabled={!report || loading}>▣ {copied ? 'Rapor kopyalandı' : 'ChatGPT raporunu kopyala'}</button>
        </div>
      </div>

      {error && <div role="alert" style={{ ...panel, borderColor: '#8b3434', color: '#fecaca', marginBottom: 16 }}>{error}</div>}
      {loading && <div style={panel}>Etsy mağaza ve ilan verileri yükleniyor...</div>}
      {!loading && !error && data && (
        <>
          <div style={{ ...panel, marginBottom: 16, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <strong style={{ fontSize: 18 }}>{data.shop.shop_name || data.shop.title || 'AGTStudioCo'}</strong>
              <div style={{ fontSize: 12, opacity: .6, marginTop: 5 }}>Son veri alımı: {lastUpdated} · {data.shop.is_vacation ? 'Mağaza tatilde' : 'Mağaza açık görünüyor'}</div>
            </div>
            {data.shop.url && <a href={data.shop.url} target="_blank" rel="noreferrer">Etsy mağazasını aç ↗</a>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12 }}>
            {metric('Mağaza toplam satış', data.shop.transaction_sold_count ?? '—', 'Mağaza ömrü boyunca')}
            {metric('Aktif ilan', data.shop.listing_active_count ?? listings.length)}
            {metric('İlan görüntülenmeleri', totals.views, 'Dönen aktif ilanların toplamı')}
            {metric('İlan favorileri', totals.favorites, 'Dönen aktif ilanların toplamı')}
            {metric('Yorum sayısı', data.shop.review_count ?? '—')}
            {metric('Ortalama yorum puanı', data.shop.review_average != null ? Number(data.shop.review_average).toFixed(2) + ' / 5' : '—')}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12, marginTop: 14 }}>
            <div style={panel}>
              <h2 style={{ marginTop: 0, fontSize: 17 }}>Ziyaret ve dönüşüm</h2>
              <div style={{ fontSize: 13, lineHeight: 1.7, opacity: .8 }}>Shop visits (mağaza ziyaretleri), traffic sources (trafik kaynakları) ve shop conversion rate (mağaza dönüşüm oranı) mevcut Etsy API bağlantısında sunulmuyor. Bu nedenle tahmin veya uydurma değer gösterilmiyor.</div>
              <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: '#241d10', color: '#f4d28b', fontSize: 12 }}>Bu üç veriyi Etsy Seller → Stats ekranından ayrıca almak gerekiyor.</div>
            </div>
            <div style={panel}>
              <h2 style={{ marginTop: 0, fontSize: 17 }}>Veri kapsamı</h2>
              <div style={{ fontSize: 13, lineHeight: 1.8, opacity: .8 }}>
                • Görüntülenme ve favoriler aktif ilanların birikimli sayaçlarıdır.<br />
                • Son 7 / 30 gün filtresi değildir.<br />
                • Mağaza satış toplamı yaşam boyu toplamdır.<br />
                • Satışları tek tek ilanlara bağlayan veri bu raporda yoktur.
              </div>
            </div>
          </div>

          <div style={{ ...panel, marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18 }}>Ürün performansı</h2>
                <p style={{ margin: '5px 0 0', fontSize: 12, opacity: .6 }}>Görüntülenme ve favori sinyaline göre sıralanır. Favori / görüntülenme oranı satış dönüşüm oranı değildir.</p>
              </div>
              <strong>{listings.length} ilan</strong>
            </div>
            <div style={{ overflowX: 'auto', marginTop: 14 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720, fontSize: 13 }}>
                <thead><tr>{['Ürün', 'Görüntülenme', 'Favori', 'Favori / görüntülenme', 'Fiyat', 'Stok', 'Bağlantı'].map((heading) => <th key={heading} style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #303846' }}>{heading}</th>)}</tr></thead>
                <tbody>
                  {ranked.map((item) => {
                    const views = Number(item.views || 0);
                    const favorites = Number(item.num_favorers || 0);
                    return <tr key={item.listing_id}>
                      <td style={{ padding: 10, borderBottom: '1px solid #202733', minWidth: 220, fontWeight: 650 }}>{item.title}<div style={{ fontSize: 10, opacity: .5 }}>ID: {item.listing_id}</div></td>
                      <td style={{ padding: 10, borderBottom: '1px solid #202733' }}>{views}</td>
                      <td style={{ padding: 10, borderBottom: '1px solid #202733' }}>{favorites}</td>
                      <td style={{ padding: 10, borderBottom: '1px solid #202733' }}>{views ? ((favorites / views) * 100).toFixed(2) + '%' : '—'}</td>
                      <td style={{ padding: 10, borderBottom: '1px solid #202733' }}>{money(item)}</td>
                      <td style={{ padding: 10, borderBottom: '1px solid #202733' }}>{item.quantity ?? '—'}</td>
                      <td style={{ padding: 10, borderBottom: '1px solid #202733' }}>{item.url ? <a href={item.url} target="_blank" rel="noreferrer">Etsy ↗</a> : '—'}</td>
                    </tr>;
                  })}
                  {ranked.length === 0 && <tr><td colSpan={7} style={{ padding: 16, opacity: .65 }}>Aktif ilan verisi bulunamadı.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ ...panel, marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div><h2 style={{ margin: 0, fontSize: 18 }}>Gerçek satış ve ürün bazında gelir</h2><p style={{ margin: '5px 0 0', fontSize: 12, opacity: .65 }}>Etsy işlem kayıtlarından gelir; ilan sayaçlarından tahmin edilmez.</p></div>
              <button type="button" onClick={() => void loadSales()} disabled={salesLoading}>↻ Satış verisini yenile</button>
            </div>
            {salesLoading && <p>İşlem kayıtları alınıyor...</p>}
            {salesError && <div role="alert" style={{ marginTop: 12, color: '#fecaca' }}>{salesError}</div>}
            {sales && !sales.available && <div style={{ marginTop: 12, padding: 14, borderRadius: 10, background: '#241d10', color: '#f4d28b' }}>
              <strong>Ek Etsy izni gerekiyor</strong><p style={{ marginBottom: 8 }}>{sales.message}</p><a href="/api/etsy/auth">Etsy bağlantısını yeniden yetkilendir ↗</a><p style={{ fontSize: 11, marginBottom: 0 }}>Yetkilendirme sırasında satış verilerini okuma iznini (transactions_r) onayla. Bu işlemden sonra sayfayı yenile.</p>
            </div>}
            {sales?.available && <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginTop: 14 }}>
                {metric('İşlem kaydı', sales.transaction_count_reported ?? sales.transaction_count_returned ?? 0)}
                {metric('Satılan adet', sales.units_sold ?? 0)}
                {metric('Brüt satış tutarı', Number(sales.gross_revenue || 0).toFixed(2) + ' ' + (sales.currency || ''))}
                {metric('Satış yapılan ilan', sales.listing_sales?.length ?? 0)}
              </div>
              {sales.truncated && <p style={{ color: '#f4d28b', fontSize: 12 }}>Kayıt sayısı güvenli sayfalama sınırını aştı; tüm işlemler alınamadı.</p>}
              <div style={{ overflowX: 'auto', marginTop: 14 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 650, fontSize: 13 }}>
                  <thead><tr>{['Ürün', 'Sipariş satırı', 'Adet', 'Brüt tutar', 'Son satış'].map((heading) => <th key={heading} style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #303846' }}>{heading}</th>)}</tr></thead>
                  <tbody>{(sales.listing_sales || []).map((item) => <tr key={item.listing_id}>
                    <td style={{ padding: 10, borderBottom: '1px solid #202733' }}>{item.title}<div style={{ fontSize: 10, opacity: .5 }}>ID: {item.listing_id}</div></td>
                    <td style={{ padding: 10, borderBottom: '1px solid #202733' }}>{item.orders}</td>
                    <td style={{ padding: 10, borderBottom: '1px solid #202733' }}>{item.units}</td>
                    <td style={{ padding: 10, borderBottom: '1px solid #202733' }}>{item.gross_revenue.toFixed(2)} {item.currency || sales.currency || ''}</td>
                    <td style={{ padding: 10, borderBottom: '1px solid #202733' }}>{item.last_sale_timestamp ? new Date(item.last_sale_timestamp * 1000).toLocaleDateString('tr-TR') : '—'}</td>
                  </tr>)}
                  {(sales.listing_sales || []).length === 0 && <tr><td colSpan={5} style={{ padding: 14, opacity: .65 }}>Henüz işlem kaydı dönmedi.</td></tr>}</tbody>
                </table>
              </div>
              <p style={{ marginBottom: 0, fontSize: 11, opacity: .55 }}>{sales.measurement_note}</p>
            </>}
          </div>
          <div style={{ marginTop: 12, fontSize: 11, opacity: .5 }}>Rapor, Etsy'nin mevcut API bağlantısından alınan verileri gösterir. ChatGPT'ye aktarmak için üstteki rapor kopyalama düğmesini kullan.</div>
        </>
      )}
    </div>
  );
}
