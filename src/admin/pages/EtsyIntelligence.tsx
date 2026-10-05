import { useEffect, useMemo, useState } from 'react';
import { analyzeEtsyStore } from '../intelligence/EtsyBrain';

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
  const brain = useMemo(() => analyzeEtsyStore(listings), [listings]);
  const metrics = useMemo(() => {
    const views = listings.reduce((s, l) => s + Number(l.views || 0), 0);
    const favs = listings.reduce((s, l) => s + Number(l.num_favorers || 0), 0);
    const avgViews = listings.length ? views / listings.length : 0;
    const highInterest = [...listings].sort((a,b) => (Number(b.num_favorers||0)*10 + Number(b.views||0)) - (Number(a.num_favorers||0)*10 + Number(a.views||0))).slice(0,5);
    const counts = {
      donusum: brain.decisions.filter(d => d.action === 'DÖNÜŞÜM').length,
      kapakSeo: brain.decisions.filter(d => d.action === 'KAPAK_SEO').length,
      seo: brain.decisions.filter(d => d.action === 'SEO').length,
      trafik: brain.decisions.filter(d => d.action === 'TRAFİK').length,
      veri: brain.decisions.filter(d => d.action === 'VERİ_TOPLA').length,
    };
    return { views, favs, avgViews, highInterest, counts };
  }, [listings, brain]);

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

        <div style={{marginTop:18,display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12}}>
          {[['🟢 Dönüşüm',metrics.counts.donusum],['🟠 Kapak / konum',metrics.counts.kapakSeo],['🔵 SEO',metrics.counts.seo],['🔴 Trafik',metrics.counts.trafik],['⚪ Veri topla',metrics.counts.veri]].map(([label,value])=><div key={String(label)} style={{background:'#0d1117',border:'1px solid #303846',borderRadius:12,padding:14}}><small style={{opacity:.65}}>{label}</small><div style={{fontSize:22,fontWeight:800,marginTop:5}}>{value}</div></div>)}
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
            {metrics.highInterest.map(l => {
              const d = brain.decisions.find(item => item.listingId === l.listing_id);
              const color = d?.action === 'DÖNÜŞÜM' ? '#16a34a' : d?.action === 'TRAFİK' ? '#dc2626' : d?.action === 'KAPAK_SEO' ? '#ea580c' : d?.action === 'SEO' ? '#2563eb' : '#64748b';
              return <div key={l.listing_id} style={{padding:'12px 0',borderBottom:'1px solid #202733'}}><div style={{fontWeight:750}}>{l.title}</div><div style={{display:'flex',gap:10,marginTop:5,fontSize:13,opacity:.8}}><span>👁 {l.views||0}</span><span>♡ {l.num_favorers||0}</span><span>{priceOf(l).toFixed(2)} {l.price?.currency_code||''}</span></div><div style={{marginTop:7,color,fontWeight:700}}>{d?.action || 'VERİ_TOPLA'}</div></div>;
            })}
          </div>
        </div>

        <div style={{marginTop:18,background:'#0d1117',border:'1px solid var(--admin-border,#303846)',borderRadius:16,padding:20}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}>
            <div><h2 style={{margin:0}}>🎯 Bugün yapılacaklar</h2><p style={{margin:'6px 0 0',opacity:.65,fontSize:13}}>AGT Etsy Brain; mağaza referanslarını, trafik, favori ve SEO sinyallerini birlikte değerlendirip en yüksek etkili ürünleri üste çıkarıyor. Amaç daha fazla ürün eklemek değil, mevcut ilgiyi satışa çevirmek.</p></div>
            <strong style={{fontSize:13,opacity:.7}}>{brain.decisions.filter(d => d.priority >= 88).length} öncelikli ürün</strong>
          </div>
          <div style={{display:'grid',gap:10,marginTop:14}}>
            {brain.topDecisions.map((d,i) => {
              const color = d.action === 'DÖNÜŞÜM' ? '#16a34a' : d.action === 'TRAFİK' ? '#dc2626' : d.action === 'KAPAK_SEO' ? '#ea580c' : d.action === 'SEO' ? '#2563eb' : '#64748b';
              return <div key={d.listingId} style={{display:'grid',gridTemplateColumns:'34px minmax(220px,1fr) auto',gap:12,alignItems:'center',padding:13,borderRadius:12,border:'1px solid #28303d',background:'#10151d'}}>
                <div style={{fontSize:20,fontWeight:800}}>{i+1}</div>
                <div><div style={{fontWeight:750}}>{d.title}</div><div style={{marginTop:4,fontSize:12,opacity:.65}}>👁 {d.metrics.views} · ♡ {d.metrics.favorites} · {d.metrics.favoriteRate.toFixed(1)}% · Güven %{d.confidence}</div></div>
                <div style={{textAlign:'right'}}><div style={{fontSize:11,fontWeight:800,color}}>{d.action}</div><div style={{fontWeight:700,marginTop:3}}>{d.recommendation}</div><div style={{fontSize:12,opacity:.62,maxWidth:420,marginTop:4}}>{d.reasons.join(' · ')}</div><button type="button" onClick={() => { window.location.href = '/admin/etsy?listing=' + encodeURIComponent(String(d.listingId)); }} style={{marginTop:8,fontSize:12,padding:'6px 10px'}}>✏️ Etsy Manager'da aç</button></div>
              </div>;
            })}
          </div>
        </div>

        <div style={{marginTop:18,background:'#0d1117',border:'1px solid var(--admin-border,#303846)',borderRadius:16,padding:20}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}><div><h2 style={{margin:0}}>📈 Ürün teşhis tablosu</h2><p style={{margin:'6px 0 0',opacity:.65,fontSize:13}}>Öncelik motoru: trafik → favori → ürün sayfası dönüşüm sinyali. Gerçek sipariş eşleşmesi, Etsy'nin işlem yetkisi açıldığında ayrıca eklenecek.</p></div><span style={{fontSize:12,opacity:.55}}>Etsy API verisi · sipariş eşleşmesi bekliyor</span></div>
          <div style={{overflowX:'auto',marginTop:14}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:14}}>
              <thead><tr>{['Ürün','Görüntülenme','Favori','Favori oranı','Fiyat','Sinyal','Aksiyon'].map(h=><th key={h} style={{textAlign:'left',padding:'10px 8px',borderBottom:'1px solid #303846'}}>{h}</th>)}</tr></thead>
              <tbody>{brain.decisions.map(d => {
                const listing = listings.find(l => l.listing_id === d.listingId);
                const color = d.action === 'DÖNÜŞÜM' ? '#16a34a' : d.action === 'TRAFİK' ? '#dc2626' : d.action === 'KAPAK_SEO' ? '#ea580c' : d.action === 'SEO' ? '#2563eb' : '#64748b';
                return <tr key={d.listingId}><td style={{padding:'12px 8px',minWidth:280,fontWeight:650}}>{d.title}</td><td style={{padding:'12px 8px'}}>{d.metrics.views}</td><td style={{padding:'12px 8px'}}>{d.metrics.favorites}</td><td style={{padding:'12px 8px'}}>{d.metrics.favoriteRate.toFixed(1)}%</td><td style={{padding:'12px 8px'}}>{d.metrics.price.toFixed(2)} {listing?.price?.currency_code || ''}</td><td style={{padding:'12px 8px',color,fontWeight:700}}>{d.action}</td><td style={{padding:'12px 8px',minWidth:360,opacity:.82}}>{d.recommendation}<div style={{marginTop:6,fontSize:12,opacity:.7}}>{d.reasons.join(' · ')}</div><a href={'/admin/etsy?listing=' + encodeURIComponent(String(d.listingId))} style={{display:'inline-block',marginTop:8,fontWeight:700}}>🤖 Etsy Manager'da aç</a></td></tr>;
              })}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
