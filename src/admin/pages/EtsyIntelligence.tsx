import { useEffect, useMemo, useState } from 'react';

type Listing = {
  listing_id: number;
  title: string;
  state?: string;
  url?: string;
  price?: { amount?: number; divisor?: number; currency_code?: string };
  views?: number;
  num_favorers?: number;
  quantity?: number;
};

type ApiData = {
  listings?: { results?: Listing[]; count?: number };
  shop?: { transaction_sold_count?: number; review_count?: number; shop_name?: string; currency_code?: string };
};

function priceOf(l: Listing) {
  return l.price?.amount != null && l.price?.divisor ? l.price.amount / l.price.divisor : 0;
}

function signal(l: Listing) {
  const views = Number(l.views || 0);
  const favs = Number(l.num_favorers || 0);
  if (views >= 40 && favs >= 2) return { label: 'En güçlü aday', color: '#16a34a', text: 'Trafik ve ilgi var. Güven/demo tarafını güçlendirip satışa çevirmeliyiz.' };
  if (views >= 25 && favs >= 1) return { label: 'Dönüşüm fırsatı', color: '#ca8a04', text: 'İlgi oluşmuş. Kapak, demo, güven ve teklif optimizasyonu öncelikli.' };
  if (views >= 20 && favs === 0) return { label: 'İlgi zayıf', color: '#ea580c', text: 'Görüntülenme var ama favori yok. Başlık/kapak/ürün konumlandırmasını test et.' };
  if (views < 10) return { label: 'Trafik sorunu', color: '#dc2626', text: 'Önce görünürlük ve arama trafiğini artırmak gerekiyor.' };
  if (favs >= 1) return { label: 'İlgi var', color: '#2563eb', text: 'Favori alınmış. Teklif ve güven sinyalleriyle satın almaya taşı.' };
  return { label: 'İzle', color: '#64748b', text: 'Veri az. Şimdilik büyük değişiklik yapma.' };
}

export default function EtsyIntelligence() {
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/etsy/listings?state=active&limit=50&offset=0', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Etsy verileri alınamadı.');
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Etsy verileri alınamadı.');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const listings = data?.listings?.results || [];
  const metrics = useMemo(() => {
    const views = listings.reduce((s, l) => s + Number(l.views || 0), 0);
    const favs = listings.reduce((s, l) => s + Number(l.num_favorers || 0), 0);
    const withViews = listings.filter(l => Number(l.views || 0) > 0);
    const avgViews = listings.length ? views / listings.length : 0;
    const highInterest = [...listings].sort((a,b) => (Number(b.num_favorers||0)*10 + Number(b.views||0)) - (Number(a.num_favorers||0)*10 + Number(a.views||0))).slice(0,5);
    const traffic = [...listings].sort((a,b) => Number(b.views||0)-Number(a.views||0)).slice(0,5);
    return { views, favs, avgViews, withViews, highInterest, traffic };
  }, [listings]);

  if (loading) return <div className="admin-page"><h1>Etsy Intelligence</h1><p>📊 Etsy verileri analiz ediliyor...</p></div>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div><h1>🧠 AGT Etsy Intelligence</h1><p>Mağazanın hangi ürünlerinde trafik, ilgi ve dönüşüm problemi olduğunu tek ekranda gör.</p></div>
        <button type="button" onClick={load}>↻ Yenile</button>
      </div>
      {error && <div style={{padding:16,borderRadius:12,background:'#3b1111',color:'#fecaca',marginBottom:16}}>{error}</div>}

      <div style={{maxWidth:1200}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:14}}>
          {[
            ['Aktif ilan', listings.length],
            ['Toplam görüntülenme', metrics.views],
            ['Ürün favorileri', metrics.favs],
            ['Ort. görüntülenme / ilan', metrics.avgViews.toFixed(1)],
            ['Mağaza satışları', data?.shop?.transaction_sold_count ?? '—'],
          ].map(([label,value]) => <div key={String(label)} style={{background:'#0d1117',border:'1px solid var(--admin-border,#303846)',borderRadius:14,padding:18}}><small style={{opacity:.65}}>{label}</small><div style={{fontSize:26,fontWeight:800,marginTop:6}}>{value}</div></div>)}
        </div>

        <div style={{marginTop:18,display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:18}}>
          <div style={{background:'#0d1117',border:'1px solid var(--admin-border,#303846)',borderRadius:16,padding:20}}>
            <h2 style={{marginTop:0}}>🚨 Şu an neyi düzeltmeliyiz?</h2>
            <div style={{display:'grid',gap:12}}>
              <div style={{padding:14,borderRadius:12,background:'#261515'}}><strong>1. Yüksek trafik + düşük satış</strong><p style={{margin:'6px 0 0',opacity:.78}}>Bu sinyal ürün sayfasında dönüşüm (conversion — satışa dönüşme) problemi olabileceğini gösterir. Kapak, demo ekranları, güven ve teklif üzerinde çalış.</p></div>
              <div style={{padding:14,borderRadius:12,background:'#261f10'}}><strong>2. Favori alan ürünler</strong><p style={{margin:'6px 0 0',opacity:.78}}>Favori, ürünün ilgi çektiğini gösterir. Bu ürünlerde fiyatı tekrar tekrar düşürmek yerine güven ve teklif testleri daha mantıklı.</p></div>
              <div style={{padding:14,borderRadius:12,background:'#101b2b'}}><strong>3. Düşük görüntülenme</strong><p style={{margin:'6px 0 0',opacity:.78}}>Burada sorun büyük ihtimalle trafik/SEO (arama optimizasyonu). Başlık, etiket, kategori ve dış trafik testleri öncelikli.</p></div>
            </div>
          </div>
          <div style={{background:'#0d1117',border:'1px solid var(--admin-border,#303846)',borderRadius:16,padding:20}}>
            <h2 style={{marginTop:0}}>🏆 Öncelikli ürünler</h2>
            {metrics.highInterest.map(l => { const s=signal(l); return <div key={l.listing_id} style={{padding:'12px 0',borderBottom:'1px solid #202733'}}><div style={{fontWeight:750}}>{l.title}</div><div style={{display:'flex',gap:10,marginTop:5,fontSize:13,opacity:.8}}><span>👁 {l.views||0}</span><span>♡ {l.num_favorers||0}</span><span>{priceOf(l).toFixed(2)} {l.price?.currency_code||''}</span></div><div style={{marginTop:7,color:s.color,fontWeight:700}}>{s.label}</div></div>; })}
          </div>
        </div>

        <div style={{marginTop:18,background:'#0d1117',border:'1px solid var(--admin-border,#303846)',borderRadius:16,padding:20}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}><div><h2 style={{margin:0}}>📈 Ürün teşhis tablosu</h2><p style={{margin:'6px 0 0',opacity:.65,fontSize:13}}>Görüntülenme ve favori sinyaline göre otomatik önceliklendirme.</p></div><span style={{fontSize:12,opacity:.55}}>Etsy API verisi</span></div>
          <div style={{overflowX:'auto',marginTop:14}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:14}}>
              <thead><tr>{['Ürün','Görüntülenme','Favori','Fiyat','Sinyal','Aksiyon'].map(h=><th key={h} style={{textAlign:'left',padding:'10px 8px',borderBottom:'1px solid #303846'}}>{h}</th>)}</tr></thead>
              <tbody>{[...listings].sort((a,b)=>Number(b.views||0)-Number(a.views||0)).map(l=>{const s=signal(l);return <tr key={l.listing_id}><td style={{padding:'12px 8px',minWidth:280,fontWeight:650}}>{l.title}</td><td style={{padding:'12px 8px'}}>{l.views||0}</td><td style={{padding:'12px 8px'}}>{l.num_favorers||0}</td><td style={{padding:'12px 8px'}}>{priceOf(l).toFixed(2)} {l.price?.currency_code||''}</td><td style={{padding:'12px 8px',color:s.color,fontWeight:700}}>{s.label}</td><td style={{padding:'12px 8px',minWidth:320,opacity:.82}}>{s.text}</td></tr>})}</tbody>
            </table>
          </div>
        </div>

        <div style={{marginTop:18,padding:16,borderRadius:14,background:'#111827',border:'1px solid #374151',fontSize:13,opacity:.9}}>
          <strong>⚠️ Veri sınırı:</strong> Buradaki görüntülenme/favori değerleri Etsy listing API'sinden gelen ürün verileridir. Bunları Etsy'nin “Visits / Ziyaretler” metriği gibi göstermiyoruz. Etsy Shop Stats'taki arama terimleri, trafik kaynakları ve gerçek conversion rate için ayrıca yetkili Etsy Stats verisi gerekir; ekran kazıma (scraping) kullanmıyoruz.
        </div>
      </div>
    </div>
  );
}
