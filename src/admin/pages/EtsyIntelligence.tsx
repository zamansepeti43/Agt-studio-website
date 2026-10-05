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
  const [completedTasks, setCompletedTasks] = useState<Record<number, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('agt-etsy-brain-tasks') || '{}'); } catch { return {}; }
  });

  const toggleTask = (listingId: number) => {
    setCompletedTasks(prev => {
      const next = { ...prev, [listingId]: !prev[listingId] };
      localStorage.setItem('agt-etsy-brain-tasks', JSON.stringify(next));
      return next;
    });
  };

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
  const dailyPriorities = useMemo(() => brain.decisions.filter(d => d.stage === 'ÖNCE YAP' && !completedTasks[d.listingId]).slice(0, 3), [brain, completedTasks]);
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
            <h2 style={{marginTop:0}}>🚨 Brain teşhisi</h2>
            <p style={{margin:'6px 0 14px',opacity:.62,fontSize:13}}>Sabit yorum yerine mevcut ilanların kendi mağaza referansına göre öncelik üretiyoruz.</p>
            <div style={{display:'grid',gap:12}}>
              {[
                {key:'donusum',label:'Dönüşüm fırsatı',count:metrics.counts.donusum,bg:'#162417',text:'Trafik ve favori sinyali alan ürünlerde kapak, demo, fayda ve güven mesajını test et.'},
                {key:'kapakSeo',label:'Kapak / konumlandırma',count:metrics.counts.kapakSeo,bg:'#261f10',text:'Trafik var fakat favori yoksa ilk görsel, başlık ve ürünün kime ne kazandırdığına odaklan.'},
                {key:'trafik',label:'Trafik problemi',count:metrics.counts.trafik,bg:'#261515',text:'Görüntülenmesi mağaza medyanının belirgin altında olan ürünlerde arama niyeti, başlık, etiket, kategori ve dış trafik testini öne al.'},
                {key:'seo',label:'SEO fırsatı',count:metrics.counts.seo,bg:'#101b2b',text:'Başlık, etiket veya açıklama sinyali zayıf ürünleri optimize et ve değişiklik sonrası yeniden ölç.'},
              ].filter(x => x.count > 0).map(item => <div key={item.key} style={{padding:14,borderRadius:12,background:item.bg}}><strong>{item.label} · {item.count} ürün</strong><p style={{margin:'6px 0 0',opacity:.78}}>{item.text}</p></div>)}
              {brain.decisions.every(d => d.priority < 88) && <div style={{padding:14,borderRadius:12,background:'#101b14'}}><strong>✅ Acil Brain görevi yok</strong><p style={{margin:'6px 0 0',opacity:.78}}>Öncelik 88+ seviyesinde bir ürün bulunmuyor. Yeni değişiklik yapmak yerine veri toplamaya devam et.</p></div>}
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
            <div><h2 style={{margin:0}}>🎯 Bugün yapılacak 3 iş</h2><p style={{margin:'6px 0 0',opacity:.65,fontSize:13}}>Brain yalnızca tamamlanmamış en yüksek etkili 3 ürünü bugünün çalışma sırasına alır. Bir iş tamamlandığında sıradaki ürün otomatik olarak öne çıkar.</p></div>
            <strong style={{fontSize:13,opacity:.7}}>{dailyPriorities.length ? 'Öncelik sırası' : 'Bugünün kuyruğu tamamlandı'}</strong>
          </div>
          <div style={{display:'grid',gap:10,marginTop:14}}>
            {dailyPriorities.map((d,i) => {
              const color = d.action === 'DÖNÜŞÜM' ? '#16a34a' : d.action === 'TRAFİK' ? '#dc2626' : d.action === 'KAPAK_SEO' ? '#ea580c' : '#2563eb';
              const task = d.action === 'TRAFİK'
                ? 'Arama niyetini, başlık ve etiketleri düzelt; ardından ücretsiz Pinterest testi yap.'
                : d.action === 'DÖNÜŞÜM'
                  ? 'Kapak + demo + fayda/güven mesajını iyileştir; fiyatı hemen düşürme.'
                  : d.action === 'KAPAK_SEO'
                    ? 'Kapak ve başlığı yeniden konumlandır; ürünün faydasını ilk görselde netleştir.'
                    : 'Başlık, etiket ve açıklamanın ilk bölümünü SEO için optimize et.';
              return <div key={d.listingId} style={{display:'grid',gridTemplateColumns:'38px minmax(220px,1fr) auto',gap:12,alignItems:'center',padding:14,borderRadius:12,border:'1px solid #28303d',background:'#10151d'}}>
                <div style={{fontSize:20,fontWeight:800}}>{i+1}</div>
                <div><div style={{fontWeight:800}}>{d.title}</div><div style={{fontSize:12,marginTop:5,opacity:.7}}>👁 {d.metrics.views} · ♡ {d.metrics.favorites} · {d.action} · Güven %{d.confidence}</div><div style={{fontSize:13,marginTop:6,color}}>{task}</div></div>
                <a href={d.action === 'TRAFİK' ? '/admin/pinterest' : '/admin/etsy?listing=' + encodeURIComponent(String(d.listingId))} style={{padding:'7px 10px',borderRadius:8,textDecoration:'none',border:'1px solid #4b5563',fontWeight:700,fontSize:12}}>{d.action === 'TRAFİK' ? '📌 Pinterest' : '🤖 Uygula'}</a>
              </div>;
            })}
            {dailyPriorities.length === 0 && <div style={{padding:14,borderRadius:12,background:'#101b14'}}><strong>✅ Bugün acil ürün yok</strong><p style={{margin:'6px 0 0',opacity:.75}}>Yeni değişiklik yapmak yerine veri toplamaya devam et.</p></div>}
          </div>
        </div>

        <div style={{marginTop:18,background:'#0d1117',border:'1px solid var(--admin-border,#303846)',borderRadius:16,padding:20}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}>
            <div><h2 style={{margin:0}}>🎯 Brain detayları</h2><p style={{margin:'6px 0 0',opacity:.65,fontSize:13}}>AGT Etsy Brain; mağaza referanslarını, trafik, favori ve SEO sinyallerini birlikte değerlendirip en yüksek etkili ürünleri üste çıkarıyor. Amaç daha fazla ürün eklemek değil, mevcut ilgiyi satışa çevirmek.</p></div>
            <strong style={{fontSize:13,opacity:.7}}>{brain.decisions.filter(d => d.priority >= 88).length} öncelikli ürün</strong>
          </div>
          <div style={{display:'grid',gap:10,marginTop:14}}>
            {brain.topDecisions.map((d,i) => {
              const color = d.action === 'DÖNÜŞÜM' ? '#16a34a' : d.action === 'TRAFİK' ? '#dc2626' : d.action === 'KAPAK_SEO' ? '#ea580c' : d.action === 'SEO' ? '#2563eb' : '#64748b';
              return <div key={d.listingId} style={{display:'grid',gridTemplateColumns:'34px minmax(220px,1fr) auto',gap:12,alignItems:'center',padding:13,borderRadius:12,border:'1px solid #28303d',background:'#10151d'}}>
                <div style={{fontSize:20,fontWeight:800}}>{i+1}</div>
                <div><div style={{fontWeight:750}}>{d.title}</div><div style={{marginTop:4,fontSize:12,opacity:.65}}>👁 {d.metrics.views} · ♡ {d.metrics.favorites} · {d.metrics.favoriteRate.toFixed(1)}% · Örneklem {d.sample.toLowerCase()} · Güven %{d.confidence}</div></div>
                <div style={{textAlign:'right'}}><div style={{fontSize:11,fontWeight:800,color}}>{d.action}</div><div style={{fontWeight:700,marginTop:3}}>{d.recommendation}</div><div style={{fontSize:12,opacity:.62,maxWidth:420,marginTop:4}}>{d.reasons.join(' · ')}</div><button type="button" onClick={() => { window.location.href = '/admin/etsy?listing=' + encodeURIComponent(String(d.listingId)); }} style={{marginTop:8,fontSize:12,padding:'6px 10px'}}>✏️ Etsy Manager'da aç</button></div>
              </div>;
            })}
          </div>
        </div>

        <div style={{marginTop:18,background:'#0d1117',border:'1px solid #303846',borderRadius:16,padding:20}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}>
            <div><h2 style={{margin:0}}>⚡ Aksiyon Merkezi</h2><p style={{margin:'6px 0 0',opacity:.65,fontSize:13}}>Brain kararlarını yapılacak gerçek görevlere çeviriyoruz. Tamamlandı işaretleri bu tarayıcıda saklanır.</p></div>
            <strong style={{fontSize:13,opacity:.7}}>{dailyPriorities.filter(d => !completedTasks[d.listingId]).length} açık görev</strong>
          </div>
          <div style={{display:'grid',gap:10,marginTop:14}}>
            {dailyPriorities.map(d => {
              const done = !!completedTasks[d.listingId];
              const isTraffic = d.action === 'TRAFİK';
              const isConversion = d.action === 'DÖNÜŞÜM';
              const task = isTraffic
                ? 'Başlık + etiket arama niyetini düzelt ve Pinterest/dış trafik testi planla.'
                : isConversion
                  ? 'Kapak, demo görselleri, fayda ve güven mesajını iyileştir; fiyatı hemen düşürme.'
                  : 'Başlık, etiket ve açıklamanın ilk bölümünü SEO için optimize et.';
              const href = isTraffic ? '/admin/pinterest' : '/admin/etsy?listing=' + encodeURIComponent(String(d.listingId));
              return <div key={d.listingId} style={{display:'grid',gridTemplateColumns:'auto 1fr auto',gap:12,alignItems:'center',padding:14,borderRadius:12,border:'1px solid #28303d',background:done?'#101b14':'#10151d',opacity:done?.7:1}}>
                <button type="button" onClick={() => toggleTask(d.listingId)} aria-label={done ? 'Görevi geri aç' : 'Görevi tamamla'} style={{width:34,height:34,borderRadius:9,fontSize:17}}>{done?'✓':'○'}</button>
                <div>
                  <div style={{fontWeight:800,textDecoration:done?'line-through':'none'}}>{d.title}</div>
                  <div style={{fontSize:11,fontWeight:800,marginTop:4,color:d.action === 'DÖNÜŞÜM'?'#22c55e':d.action === 'TRAFİK'?'#ef4444':'#3b82f6'}}>{d.action} · Öncelik {d.priority} · Güven %{d.confidence}</div>
                  <div style={{fontSize:13,opacity:.72,marginTop:5}}>{task}</div>
                </div>
                <a href={href} style={{padding:'7px 10px',borderRadius:8,textDecoration:'none',border:'1px solid #4b5563',fontWeight:700,fontSize:12}}>{isTraffic?'📌 Pinterest':'🤖 Etsy’de aç'}</a>
              </div>;
            })}
          </div>
        </div>

        <div style={{marginTop:18,background:'#0d1117',border:'1px solid var(--admin-border,#303846)',borderRadius:16,padding:20}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}><div><h2 style={{margin:0}}>📈 Ürün teşhis tablosu</h2><p style={{margin:'6px 0 0',opacity:.65,fontSize:13}}>Öncelik motoru: trafik → favori → ürün sayfası dönüşüm sinyali. Bu tablo gerçek satışları ürün bazında eşleştirmez; satış sayısı yalnızca mağaza toplamıdır.</p></div><span style={{fontSize:12,opacity:.55}}>Görüntülenme = ilan görüntülenmesi, ziyaret (visit) değil · Brain: Önce Yap → Sonra Yap → Dokunma</span></div>
          <div style={{overflowX:'auto',marginTop:14}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:14}}>
              <thead><tr>{['Ürün','Görüntülenme','Favori','Favori oranı','Örneklem','Fiyat','Sinyal','Aksiyon'].map(h=><th key={h} style={{textAlign:'left',padding:'10px 8px',borderBottom:'1px solid #303846'}}>{h}</th>)}</tr></thead>
              <tbody>{brain.decisions.map(d => {
                const listing = listings.find(l => l.listing_id === d.listingId);
                const color = d.action === 'DÖNÜŞÜM' ? '#16a34a' : d.action === 'TRAFİK' ? '#dc2626' : d.action === 'KAPAK_SEO' ? '#ea580c' : d.action === 'SEO' ? '#2563eb' : '#64748b';
                return <tr key={d.listingId}><td style={{padding:'12px 8px',minWidth:280,fontWeight:650}}>{d.title}</td><td style={{padding:'12px 8px'}}>{d.metrics.views}</td><td style={{padding:'12px 8px'}}>{d.metrics.favorites}</td><td style={{padding:'12px 8px'}}>{d.metrics.favoriteRate.toFixed(1)}%</td><td style={{padding:'12px 8px',fontWeight:700}}>{d.sample}</td><td style={{padding:'12px 8px'}}>{d.metrics.price.toFixed(2)} {listing?.price?.currency_code || ''}</td><td style={{padding:'12px 8px',color,fontWeight:700}}>{d.action}<div style={{fontSize:11,marginTop:4,opacity:.7}}>{d.stage}</div></td><td style={{padding:'12px 8px',minWidth:360,opacity:.82}}>{d.recommendation}<div style={{marginTop:6,fontSize:12,opacity:.7}}>{d.reasons.join(' · ')}</div><a href={'/admin/etsy?listing=' + encodeURIComponent(String(d.listingId))} style={{display:'inline-block',marginTop:8,fontWeight:700}}>🤖 Etsy Manager'da aç</a></td></tr>;
              })}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
