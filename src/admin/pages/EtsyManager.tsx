import { useEffect, useMemo, useState } from 'react';
import { analyzeEtsyStore } from '../intelligence/EtsyBrain';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

type EtsyStatus = { connected: boolean; shopUserId?: number | null; scope?: string | null; connectedAt?: string | null; updatedAt?: string | null; error?: string; };
type EtsyShop = {
  shop_id?: number; user_id?: number; shop_name?: string; title?: string; announcement?: string | null;
  sale_message?: string | null; digital_sale_message?: string | null; currency_code?: string;
  transaction_sold_count?: number; review_count?: number; review_average?: number;
  url?: string; listing_active_count?: number; digital_listing_count?: number; is_vacation?: boolean;
  accepts_custom_requests?: boolean; languages?: string[]; icon_url_fullxfull?: string | null;
  image_url_760x100?: string | null; policy_welcome?: string | null; policy_payment?: string | null;
  policy_shipping?: string | null; policy_refunds?: string | null; policy_privacy?: string | null;
};
type EtsyProfile = { user_id?: number; primary_email?: string; first_name?: string; last_name?: string; image_url_75x75?: string; };
type EtsyListing = { listing_id: number; title: string; state: string; section_id?: number | null; shop_section_id?: number | null; taxonomy_id?: number | null; price?: { amount?: number; divisor?: number; currency_code?: string }; quantity?: number; url?: string; views?: number; num_favorers?: number; tags?: string[]; description?: string; };
type EtsySection = { shop_section_id: number; title: string; rank?: number; active_listing_count?: number; };
type ListingOptimization = {
  listing_id: number;
  current: { title: string; tags: string[]; description: string };
  proposed: { title: string; tags: string[]; description: string };
  reasons: string[];
};

const fieldStyle = { width: '100%', boxSizing: 'border-box' as const, padding: '11px 12px', borderRadius: 10, border: '1px solid var(--admin-border, #e5e7eb)', background: '#0d1117', color: 'inherit' };
const labelStyle = { display: 'block', fontWeight: 700, marginBottom: 7, fontSize: 13, color: '#f0f3f6' };

function normalize(value: string) {
  return value.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i');
}

function suggestSectionId(listing: EtsyListing, sections: EtsySection[]) {
  const text = normalize(listing.title);
  const rules = [
    { keys: ['etsy product idea finder', 'product radar', 'product research', 'etsy product', 'etsy seller', 'customer support', 'etsy tools', 'etsy profit'], labels: ['etsy satıcı araçları', 'etsy seller tools'] },
    { keys: ['windows apk', 'no-code android', 'android builder', 'android app', 'android', 'apk'], labels: ['android geliştirici araçları', 'android developer tools'] },
    { keys: ['api finder', 'ai api', 'prompt generator', 'ai prompt', 'developer', 'app builder', 'ai tool'], labels: ['yapay zeka ve geliştirici araçları', 'ai & developer tools'] },
    { keys: ['barber management', 'barbershop', 'beautyos', 'business management', 'business pro', 'pressure washing', 'job tracker'], labels: ['işletme yönetimi', 'business management'] },
    { keys: ['bakery pricing', 'pricing calculator', 'profit calculator', 'calculator'], labels: ['iş araçları', 'business tools'] },
    { keys: ['travel planner', 'moving planner', 'planner', 'planning', 'organizer', 'checklist'], labels: ['planlayıcılar / verimlilik', 'planners / productivity'] },
    { keys: ['subscription tracker', 'habit tracker', 'life tracker', 'budget tracker', 'personal tracker'], labels: ['hayat verimliliği', 'life productivity'] },
  ];
  let best: { id: number; score: number } | null = null;
  for (const rule of rules) {
    if (!rule.keys.some((key) => text.includes(normalize(key)))) continue;
    for (const section of sections) {
      const sectionText = normalize(section.title);
      const score = rule.labels.some((label) => sectionText.includes(normalize(label))) ? 10 : 0;
      if (score > 0 && (!best || score > best.score)) best = { id: section.shop_section_id, score };
    }
  }
  return best?.id ?? null;
}

function sectionReason(listing: EtsyListing) {
  const text = normalize(listing.title);
  if (text.includes('etsy product idea finder') || text.includes('product radar') || text.includes('product research') || text.includes('etsy product') || text.includes('etsy seller') || text.includes('customer support') || text.includes('etsy profit')) return 'Etsy Satıcı Araçları';
  if (text.includes('windows apk') || text.includes('no-code android') || text.includes('android builder') || text.includes('android app') || text.includes('android') || text.includes('apk')) return 'Android Geliştirici Araçları';
  if (text.includes('api finder') || text.includes('ai api') || text.includes('prompt generator') || text.includes('ai prompt') || text.includes('developer')) return 'Yapay Zeka ve Geliştirici Araçları';
  if (text.includes('barber') || text.includes('beautyos') || text.includes('business management') || text.includes('business pro') || text.includes('pressure washing')) return 'İşletme Yönetimi';
  if (text.includes('bakery pricing') || text.includes('pricing calculator') || text.includes('profit calculator')) return 'İş Araçları';
  if (text.includes('travel planner') || text.includes('moving planner') || text.includes('planner') || text.includes('checklist')) return 'Planlayıcılar / Verimlilik';
  if (text.includes('subscription tracker') || text.includes('habit tracker') || text.includes('life tracker')) return 'Hayat Verimliliği';
  return 'Elle kontrol edilmeli';
}

export default function EtsyManager() {
  const [searchParams] = useSearchParams();
  const selectedListingId = Number(searchParams.get('listing') || 0);
  const [status, setStatus] = useState<EtsyStatus | null>(null);
  const [shop, setShop] = useState<EtsyShop | null>(null);
  const [profile, setProfile] = useState<EtsyProfile | null>(null);
  const [listings, setListings] = useState<EtsyListing[]>([]);
  const [sections, setSections] = useState<EtsySection[]>([]);
  const [sectionAssignments, setSectionAssignments] = useState<Record<number, number>>({});
  const [listingCount, setListingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [applyingSections, setApplyingSections] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [form, setForm] = useState({ title: '', announcement: '', sale_message: '', digital_sale_message: '' });
  const [optimization, setOptimization] = useState<ListingOptimization | null>(null);
  const [optimizationLoading, setOptimizationLoading] = useState(false);
  const [optimizationApplying, setOptimizationApplying] = useState(false);
  const [optimizationMessage, setOptimizationMessage] = useState('');
  const [listingFilter, setListingFilter] = useState('all');
  const [listingSort, setListingSort] = useState('views');
  const [listingSearch, setListingSearch] = useState('');
  const brain = useMemo(() => analyzeEtsyStore(listings), [listings]);
  const selectedBrainDecision = useMemo(
    () => brain.decisions.find((d) => d.listingId === selectedListingId) || null,
    [brain, selectedListingId]
  );

  const loadData = async () => {
    setDataLoading(true); setError('');
    try {
      const results = await Promise.all([
        fetch('/api/etsy/shop', { cache: 'no-store' }),
        fetch('/api/etsy/profile', { cache: 'no-store' }),
        fetch('/api/etsy/listings?state=active&limit=50&offset=0', { cache: 'no-store' }),
      ]);
      const shopData = await results[0].json(); const profileData = await results[1].json(); const listingsData = await results[2].json();
      if (!results[0].ok) throw new Error(shopData.error || 'Mağaza bilgisi alınamadı.');
      if (!results[1].ok) throw new Error(profileData.error || 'Profil bilgisi alınamadı.');
      if (!results[2].ok) throw new Error(listingsData.error || 'İlanlar alınamadı.');
      const loadedListings = listingsData.listings?.results || [];
      const loadedSections = Array.isArray(listingsData.sections) ? listingsData.sections : [];
      setShop(shopData); setProfile(profileData); setListings(loadedListings); setSections(loadedSections); setListingCount(Number(listingsData.listings?.count || 0));
      const initialAssignments: Record<number, number> = {};
      for (const listing of loadedListings) {
        const current = Number(listing.shop_section_id ?? listing.section_id ?? 0);
        const suggested = suggestSectionId(listing, loadedSections);
        if (suggested) initialAssignments[listing.listing_id] = suggested;
        else if (current) initialAssignments[listing.listing_id] = current;
      }
      setSectionAssignments(initialAssignments);
      setForm({
        title: shopData.title || '',
        announcement: shopData.announcement || '',
        sale_message: shopData.sale_message || '',
        digital_sale_message: shopData.digital_sale_message || '',
      });
    } catch (err) { setError(err instanceof Error ? err.message : 'Etsy verileri alınamadı.'); }
    finally { setDataLoading(false); }
  };

  const loadStatus = async () => {
    try { const res = await fetch('/api/etsy/status', { cache: 'no-store' }); const data = await res.json(); setStatus(data); if (data.connected) await loadData(); }
    catch { setStatus({ connected: false, error: 'Durum alınamadı.' }); }
    finally { setLoading(false); }
  };
  const loadOptimization = async (listingId: number) => {
    if (!listingId) return;
    setOptimizationLoading(true); setOptimizationMessage(''); setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Yönetici oturumu bulunamadı.');
      const res = await fetch('/api/etsy/listings?listing_id=' + encodeURIComponent(String(listingId)), { headers: { Authorization: 'Bearer ' + session.access_token }, cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'SEO önerisi alınamadı.');
      setOptimization(data);
    } catch (err) { setOptimization(null); setError(err instanceof Error ? err.message : 'SEO önerisi alınamadı.'); }
    finally { setOptimizationLoading(false); }
  };

  const applyOptimization = async () => {
    if (!optimization) return;
    setOptimizationApplying(true); setOptimizationMessage(''); setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Yönetici oturumu bulunamadı.');
      const res = await fetch('/api/etsy/listings?listing_id=' + encodeURIComponent(String(optimization.listing_id)), { method:'POST', headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token}, body:JSON.stringify({action:'apply',proposed:optimization.proposed}) });
      const data=await res.json();
      if (!res.ok) throw new Error(data.error || 'SEO önerisi Etsy’ye uygulanamadı.');
      setOptimization(data.recommendation); setOptimizationMessage('✅ Onaylandı ve Etsy’ye uygulandı.'); await loadData();
    } catch(err) { setError(err instanceof Error ? err.message : 'SEO önerisi Etsy’ye uygulanamadı.'); }
    finally { setOptimizationApplying(false); }
  };
  useEffect(() => { loadStatus(); }, []);

  useEffect(() => {
    if (selectedListingId && listings.length) {
      const exists = listings.some((listing) => listing.listing_id === selectedListingId);
      if (exists) loadOptimization(selectedListingId);
    }
    if (!selectedListingId || !listings.length) return;
    const exists = listings.some((listing) => listing.listing_id === selectedListingId);
    if (!exists) return;
    const el = document.getElementById(`etsy-listing-${selectedListingId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [selectedListingId, listings]);

  const applyPremiumSetup = async () => {
    setSaving(true); setError(''); setSaved('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Yönetici oturumu bulunamadı. Lütfen tekrar giriş yapın.');
      const res = await fetch('/api/etsy/premium-setup', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Premium mağaza kurulumu başarısız.');
      setSaved('Premium Etsy mağaza kurulumu tamamlandı. Başlık, duyuru, satın alma mesajları ve uygun mağaza bölümleri uygulandı.');
      await loadData();
      setTimeout(() => setSaved(''), 5000);
    } catch (err) { setError(err instanceof Error ? err.message : 'Premium mağaza kurulumu başarısız.'); }
    finally { setSaving(false); }
  };

  const applyTargetedSeoOptimization = async () => {
    setSaving(true); setError(''); setSaved('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Yönetici oturumu bulunamadı. Lütfen tekrar giriş yapın.');
      const res = await fetch('/api/etsy/seo-title-setup', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'SEO optimizasyonu uygulanamadı.');
      setSaved(data.message || 'Hedeflenen Etsy SEO değişiklikleri uygulandı.');
      await loadData();
      setTimeout(() => setSaved(''), 6000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'SEO optimizasyonu uygulanamadı.');
    } finally { setSaving(false); }
  };

  const applySectionAssignments = async () => {
    const changes = listings
      .map((listing) => {
        const currentSection = Number(listing.shop_section_id ?? listing.section_id ?? 0);
        const sectionId = Number(sectionAssignments[listing.listing_id] || 0);
        return {
          listing_id: listing.listing_id,
          section_id: sectionId || undefined,
          changed: sectionId && sectionId !== currentSection,
        };
      })
      .filter((item) => item.changed && item.section_id)
      .map(({ changed, ...item }) => item);

    if (!changes.length) {
      setSaved('Uygulanacak mağaza bölümü değişikliği yok.');
      setTimeout(() => setSaved(''), 3500);
      return;
    }

    setApplyingSections(true); setError(''); setSaved('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Yönetici oturumu bulunamadı. Lütfen tekrar giriş yapın.');
      const res = await fetch('/api/etsy/listings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ assignments: changes }),
      });
      const data = await res.json();
      if (!res.ok && res.status !== 207) throw new Error(data.error || 'Mağaza bölümü değişiklikleri uygulanamadı.');
      if (data.failed) {
        const details = Array.isArray(data.results)
          ? data.results.filter((item: { ok?: boolean }) => !item.ok).map((item: { listing_id?: number; error?: string }) => `#${item.listing_id || '?'}: ${item.error || 'Bilinmeyen Etsy hatası'}`).join(' | ')
          : '';
        throw new Error(`${data.updated} ürün güncellendi, ${data.failed} ürün güncellenemedi.${details ? ' Detay: ' + details : ''}`);
      }
      setSaved(`Onaylandı ve Etsy'ye uygulandı: ${data.updated} ürün.`);
      await loadData();
      setTimeout(() => setSaved(''), 6000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mağaza bölümü değişiklikleri uygulanamadı.');
    } finally { setApplyingSections(false); }
  };

  const saveShop = async () => {
    setSaving(true); setError(''); setSaved('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Yönetici oturumu bulunamadı. Lütfen tekrar giriş yapın.');
      const res = await fetch('/api/etsy/shop', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Mağaza güncellenemedi.');
      setShop(data); setSaved('Etsy mağazası güncellendi.'); setTimeout(() => setSaved(''), 3500);
    } catch (err) { setError(err instanceof Error ? err.message : 'Mağaza güncellenemedi.'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="admin-page"><h1>Etsy Yönetimi</h1><p>Bağlantı kontrol ediliyor...</p></div>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div><h1>Etsy Yönetimi</h1><p>AGT Studio Etsy mağazanı buradan yönet.</p></div>
        {status?.connected && <button type="button" onClick={loadData} disabled={dataLoading}>{dataLoading ? 'Yükleniyor...' : '↻ Yenile'}</button>}
      </div>
      <div className="etsy-command-center" style={{ maxWidth: 1280 }}>
        {status?.connected && <div className="etsy-command-nav">
          <a href="#etsy-overview">📊 Özet</a><a href="#etsy-seo">🤖 SEO</a><a href="#etsy-shop">🏪 Mağaza</a><a href="#etsy-sections">📁 Bölümler</a><a href="#etsy-brain">🧠 Brain</a><a href="#etsy-listings">🛍️ Ürünler</a>
        </div>}
        <div id="etsy-overview" style={{ background: '#0d1117', border: '1px solid var(--admin-border, #e5e7eb)', borderRadius: 16, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div><h2 style={{ margin: 0 }}>Etsy Bağlantısı</h2><p style={{ marginTop: 8 }}>{status?.connected ? 'Etsy mağazan AGT Studio’ya bağlı ve API erişimi aktif.' : 'Henüz Etsy mağazası bağlanmadı.'}</p></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <div style={{ fontWeight: 700 }}>{status?.connected ? '🟢 Bağlı' : '⚪ Bağlı değil'}</div>
              {status?.connected && <button type="button" onClick={() => { window.location.href = '/api/etsy/auth'; }}>🔄 Etsy Yetkilerini Güncelle</button>}
            </div>
          </div>
          {status?.error && <p style={{ color: '#b91c1c' }}>{status.error}</p>}{error && <p style={{ color: '#b91c1c' }}>{error}</p>}{saved && <p style={{ color: '#15803d', fontWeight: 700 }}>{saved}</p>}
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

          {selectedListingId > 0 && optimization && !optimizationLoading && (
            <div id="etsy-seo" style={{ marginTop: 20, background: '#0d1117', border: '2px solid #f59e0b', borderRadius: 16, padding: 24 }}>
              <h2 style={{ marginTop: 0 }}>🤖 Seçili Ürün SEO Optimizasyonu</h2>
              {optimizationLoading && <p>🔎 Analiz ediliyor...</p>}
              <p style={{ fontSize:13, opacity:.72 }}>Mevcut veriyi analiz ettik. Aşağıdaki öneri Etsy’ye ancak sen onaylarsan uygulanır.</p>
              {selectedBrainDecision && (
                <div style={{marginBottom:14,padding:12,borderRadius:10,background:'#111827',border:'1px solid #374151'}}>
                  <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
                    <strong>🧠 Brain:</strong>
                    <span>{selectedBrainDecision.action}</span>
                    <span>Öncelik {selectedBrainDecision.priority}</span>
                    <span>Güven %{selectedBrainDecision.confidence}</span>
                    <span>Örneklem {selectedBrainDecision.sample.toLowerCase()}</span>
                  </div>
                  <div style={{marginTop:7,fontSize:13}}><strong>Sonraki adım:</strong> {selectedBrainDecision.nextStep}</div>
                </div>
              )}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div style={{padding:14,background:'#151b23',borderRadius:12}}><h3>Mevcut</h3><b>Başlık</b><p>{optimization.current.title}</p><b>Etiketler</b><p>{optimization.current.tags.join(' · ')}</p><b>Açıklama</b><div style={{whiteSpace:'pre-wrap',maxHeight:180,overflow:'auto',fontSize:12}}>{optimization.current.description || 'Boş'}</div></div>
                <div style={{padding:14,background:'#102117',borderRadius:12}}><h3>Önerilen</h3><b>Başlık</b><p>{optimization.proposed.title}</p><b>Etiketler</b><p>{optimization.proposed.tags.join(' · ')}</p><b>Açıklama</b><div style={{whiteSpace:'pre-wrap',maxHeight:180,overflow:'auto',fontSize:12}}>{optimization.proposed.description}</div></div>
              </div>
              <div style={{marginTop:14}}><b>🎯 Neden?</b><ul>{optimization.reasons.map(r=><li key={r}>{r}</li>)}</ul></div>
              {optimizationMessage && <p style={{color:'#22c55e',fontWeight:700}}>{optimizationMessage}</p>}
              <button type="button" onClick={applyOptimization} disabled={optimizationApplying}>{optimizationApplying?'Etsy’ye uygulanıyor...':'🚀 Onayla ve Etsy’ye Uygula'}</button>
            </div>
          )}
          <div id="etsy-profile" style={{ marginTop: 20, background: '#0d1117', border: '1px solid var(--admin-border, #e5e7eb)', borderRadius: 16, padding: 24 }}>
            <h2 style={{ marginTop: 0 }}>👤 Etsy Profili</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              {profile?.image_url_75x75 && <img src={profile.image_url_75x75} alt="" width="75" height="75" style={{ borderRadius: '50%', objectFit: 'cover' }} />}
              <div><strong>{[profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || '—'}</strong><div style={{ opacity: .7, marginTop: 4 }}>{profile?.primary_email || '—'}</div></div>
            </div>
            <p style={{ marginBottom: 0, marginTop: 12, fontSize: 13, opacity: .7 }}>Profil verileri Etsy API üzerinden okunuyor. Bu panelde güvenli olarak mağaza alanlarını düzenleyebiliyoruz.</p>
          </div>

          <div id="etsy-shop" style={{ marginTop: 20, background: '#0d1117', border: '1px solid var(--admin-border, #e5e7eb)', borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h2 style={{ marginTop: 0, marginBottom: 0 }}>🏪 Mağaza Ana Sayfası</h2>
              <button type="button" onClick={applyPremiumSetup} disabled={saving}>✨ Premium Mağaza Kurulumunu Uygula</button>
            </div>
            <p style={{ marginTop: 10, fontSize: 13, opacity: .75 }}>Bu işlem AGT Studio için hazırlanmış premium başlık, duyuru, dijital teslimat mesajları ve uygun mağaza bölümlerini gerçek Etsy mağazana uygular.</p>
            <div style={{ display: 'grid', gap: 16 }}>
              <div><label style={labelStyle}>Mağaza başlığı</label><input style={fieldStyle} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              <div><label style={labelStyle}>Mağaza duyurusu</label><textarea style={{ ...fieldStyle, minHeight: 110, resize: 'vertical' }} value={form.announcement} onChange={e => setForm({ ...form, announcement: e.target.value })} /></div>
              <div><label style={labelStyle}>Satın alma mesajı</label><textarea style={{ ...fieldStyle, minHeight: 90, resize: 'vertical' }} value={form.sale_message} onChange={e => setForm({ ...form, sale_message: e.target.value })} /></div>
              <div><label style={labelStyle}>Dijital ürün satın alma mesajı</label><textarea style={{ ...fieldStyle, minHeight: 90, resize: 'vertical' }} value={form.digital_sale_message} onChange={e => setForm({ ...form, digital_sale_message: e.target.value })} /></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button type="button" onClick={saveShop} disabled={saving}>{saving ? 'Etsy’ye kaydediliyor...' : '💾 Etsy’ye Kaydet'}</button></div>
            </div>
            <p style={{ marginBottom: 0, marginTop: 14, fontSize: 12, opacity: .65 }}>Kaydet butonu gerçek Etsy API'sine PUT gönderir; mevcut alanları değiştirmeden yalnızca bu dört alanı günceller.</p>
          </div>

          <div id="etsy-sections" style={{ marginTop: 20, background: '#0d1117', border: '1px solid var(--admin-border, #e5e7eb)', borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div><h2 style={{ marginTop: 0, marginBottom: 4 }}>📁 Ürünleri Mağaza Bölümlerine Dağıt</h2><p style={{ margin: 0, fontSize: 13, opacity: .75 }}>Senin için ürünleri başlıklarına göre ben sınıflandırıyorum. Sen sadece son dağılımı onaylıyorsun. Etsy kategorilerine kesinlikle dokunulmuyor.</p></div>
              <button type="button" onClick={applySectionAssignments} disabled={applyingSections || !sections.length}>{applyingSections ? 'Etsy’ye uygulanıyor...' : '✅ Bölüm Dağılımını Onayla ve Etsy’ye Uygula'}</button>
            </div>
            {!sections.length && <p style={{ marginTop: 18 }}>Etsy mağaza bölümü bulunamadı.</p>}
            {sections.length > 0 && <div style={{ marginTop: 18 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>{sections.map((section) => <span key={section.shop_section_id} style={{ padding: '6px 10px', borderRadius: 999, background: '#151b23', border: '1px solid #303846', fontSize: 12 }}>📁 {section.title} · {section.active_listing_count ?? 0} ilan</span>)}</div>
              {listings.map((listing) => {
                const suggestedSection = suggestSectionId(listing, sections);
                const currentSectionId = Number(listing.shop_section_id ?? listing.section_id ?? 0);
                const currentSectionName = sections.find((s) => s.shop_section_id === currentSectionId)?.title || 'Bölüm yok';
                const suggestedSectionName = sections.find((s) => s.shop_section_id === Number(suggestedSection))?.title || 'Elle kontrol edilmeli';
                return <div key={listing.listing_id} style={{ padding: '14px 0', borderBottom: '1px solid var(--admin-border, #e5e7eb)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 1.35fr) minmax(220px, 1fr) minmax(220px, 1fr)', gap: 12, alignItems: 'center' }}>
                    <div><strong>{listing.title}</strong><div style={{ fontSize: 12, opacity: .6 }}>ID: {listing.listing_id}</div></div>
                    <div><small style={{ opacity: .65 }}>📁 Mevcut mağaza bölümü</small><div style={{ marginTop: 4 }}>{currentSectionName}</div></div>
                    <div><small style={{ opacity: .65 }}>🎯 Önerilen mağaza bölümü</small><div style={{ marginTop: 4 }}>{suggestedSectionName}</div><small style={{ opacity: .55 }}>Neden: {sectionReason(listing)}</small></div>
                  </div>
                  <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 10, background: '#151b23', border: '1px solid #303846' }}><small style={{ opacity: .65 }}>🤖 Benim atadığım mağaza bölümü</small><div style={{ marginTop: 4, fontWeight: 800 }}>{suggestedSectionName}</div><small style={{ opacity: .55 }}>Onayladığında sadece bu mağaza bölümü Etsy'ye uygulanır.</small></div>
                </div>;
              })}
            </div>}
          </div>
          <div id="etsy-brain" style={{ marginTop: 20, background: '#0d1117', border: '1px solid #303846', borderRadius: 16, padding: 24 }}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}>
              <div><h2 style={{margin:0}}>🧠 Etsy Brain — Uygulanabilir Kararlar</h2><p style={{margin:'7px 0 0',fontSize:13,opacity:.7}}>Brain (karar motoru) mağazanın kendi referanslarını kullanır; öneri üretir, değişikliği sen onaylarsın.</p></div>
              <div style={{fontSize:12,opacity:.65}}>Medyan görüntülenme: {brain.benchmarks.medianViews.toFixed(1)} · Ort. favori oranı: {brain.benchmarks.avgFavoriteRate.toFixed(1)}%</div>
            </div>
            <div style={{display:'grid',gap:10,marginTop:14}}>
              {brain.topDecisions.map((d,i) => {
                const color = d.action === 'DÖNÜŞÜM' ? '#22c55e' : d.action === 'TRAFİK' ? '#ef4444' : d.action === 'KAPAK_SEO' ? '#f97316' : d.action === 'SEO' ? '#3b82f6' : '#94a3b8';
                return <div key={d.listingId} style={{display:'grid',gridTemplateColumns:'28px minmax(220px,1fr) minmax(220px,1.2fr) auto',gap:12,alignItems:'center',padding:13,border:'1px solid #28303d',borderRadius:12,background:'#10151d'}}>
                  <strong>{i+1}</strong>
                  <div><strong>{d.title}</strong><div style={{fontSize:12,opacity:.6,marginTop:4}}>👁 {d.metrics.views} · ♡ {d.metrics.favorites} · İlgi %{d.metrics.favoriteRate.toFixed(1)} · Güven %{d.confidence}</div></div>
                  <div><div style={{color,fontSize:11,fontWeight:800}}>{d.action}</div><div style={{fontWeight:700,marginTop:3}}>{d.recommendation}</div><div style={{fontSize:11,opacity:.55,marginTop:4}}>{d.reasons.join(' · ')}</div></div>
                  <a href={`/admin/etsy?listing=${d.listingId}#etsy-seo`} style={{padding:'7px 10px',borderRadius:8,textDecoration:'none',border:'1px solid #4b5563',fontWeight:700,fontSize:12}}>🤖 İncele / Uygula</a>
                </div>;
              })}
            </div>
          </div>
          <div id="etsy-listings" style={{ marginTop: 20, background: '#0d1117', border: '1px solid var(--admin-border, #e5e7eb)', borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h2 style={{ marginTop: 0, marginBottom: 0 }}>Aktif İlanlar</h2>
              <button type="button" onClick={applyTargetedSeoOptimization} disabled={saving}>🎯 2 Ürünün SEO'sunu Uygula</button>
            </div>
            <p style={{ marginTop: 10, fontSize: 13, opacity: .75 }}>18 aktif ürünü performans, ilgi, fiyat ve SEO sinyalleriyle tek ekranda yönet. “Optimize Et” yalnızca öneriyi açar; Etsy’ye gerçek değişiklik yapmak için ayrıca onay gerekir.</p>
            {!dataLoading && listings.length > 0 && <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:14}}>
              <span style={{padding:'7px 10px',borderRadius:999,background:'#151b23',border:'1px solid #303846'}}>📦 {listings.length} ürün</span>
              <span style={{padding:'7px 10px',borderRadius:999,background:'#151b23',border:'1px solid #303846'}}>👁 {listings.reduce((n,l)=>n+Number(l.views||0),0)} görüntülenme</span>
              <span style={{padding:'7px 10px',borderRadius:999,background:'#151b23',border:'1px solid #303846'}}>♡ {listings.reduce((n,l)=>n+Number(l.num_favorers||0),0)} favori</span>
            </div>}
            {!dataLoading && listings.length > 0 && (() => {
              const filtered = listings.filter((l) => {
                const q = normalize(listingSearch);
                const title = normalize(l.title || '');
                if (q && !title.includes(q) && !String(l.listing_id).includes(q)) return false;
                const views = Number(l.views || 0), favs = Number(l.num_favorers || 0);
                if (listingFilter === 'traffic' && views < 25) return false;
                if (listingFilter === 'favorite' && favs < 1) return false;
                if (listingFilter === 'conversion' && !(views >= 25 && favs >= 1)) return false;
                if (listingFilter === 'attention' && !(views < 10)) return false;
                return true;
              }).sort((a,b) => {
                const av=Number(a.views||0), bv=Number(b.views||0), af=Number(a.num_favorers||0), bf=Number(b.num_favorers||0);
                if (listingSort === 'favorites') return bf-af;
                if (listingSort === 'price') return (Number(b.price?.amount||0)/(Number(b.price?.divisor)||1))-(Number(a.price?.amount||0)/(Number(a.price?.divisor)||1));
                return bv-av;
              });
              return <div style={{marginTop:18,padding:14,borderRadius:12,background:'#111820',border:'1px solid #303846'}}>
                <div style={{display:'grid',gridTemplateColumns:'minmax(220px,1fr) 180px 180px',gap:10}}>
                  <input aria-label="Ürün ara" placeholder="🔎 Ürün ara..." value={listingSearch} onChange={e=>setListingSearch(e.target.value)} style={fieldStyle}/>
                  <select value={listingFilter} onChange={e=>setListingFilter(e.target.value)} style={fieldStyle}>
                    <option value="all">Tümü</option><option value="traffic">🔥 Trafik 25+</option><option value="favorite">♡ Favorisi var</option><option value="conversion">🎯 Dönüşüm fırsatı</option><option value="attention">🔴 0-9 görüntülenme</option>
                  </select>
                  <select value={listingSort} onChange={e=>setListingSort(e.target.value)} style={fieldStyle}>
                    <option value="views">Görüntülenme ↓</option><option value="favorites">Favori ↓</option><option value="price">Fiyat ↓</option>
                  </select>
                </div>
                <div style={{marginTop:10,fontSize:12,opacity:.65}}>{filtered.length} ürün gösteriliyor</div>
              </div>;
            })()}
            {dataLoading && <p>İlanlar Etsy’den getiriliyor...</p>}
            {!dataLoading && listings.length === 0 && <p>Aktif ilan bulunamadı.</p>}
            {!dataLoading ? (() => { const filteredIds = new Set(listings.filter((l) => { const q=normalize(listingSearch); const title=normalize(l.title||''); if(q && !title.includes(q) && !String(l.listing_id).includes(q)) return false; const v=Number(l.views||0), f=Number(l.num_favorers||0); if(listingFilter==='traffic'&&v<25)return false; if(listingFilter==='favorite'&&f<1)return false; if(listingFilter==='conversion'&&!(v>=25&&f>=1))return false; if(listingFilter==='attention'&&v>=10)return false; return true; }).map(l=>l.listing_id)); return listings.filter(l=>filteredIds.has(l.listing_id)).map((listing) => {
  const p = listing.price?.amount != null && listing.price?.divisor ? listing.price.amount / listing.price.divisor : null;
  const views = Number(listing.views || 0);
  const favs = Number(listing.num_favorers || 0);
  const engagement = views > 0 ? (favs / views) * 100 : 0;
  const seoScore = (listing.title?.length >= 35 ? 1 : 0) + ((listing.tags?.length || 0) >= 10 ? 1 : 0) + ((listing.description?.length || 0) >= 800 ? 1 : 0);
  const seoLabel = seoScore >= 3 ? '🟢 Güçlü' : seoScore === 2 ? '🟡 İyileştir' : '🔴 Zayıf';
  const action = views >= 50 && favs >= 2 ? 'DÖNÜŞÜM' : views >= 25 && favs >= 1 ? 'TEKLİF' : views >= 20 && favs === 0 ? 'KAPAK / SEO' : views < 10 ? 'TRAFİK' : favs >= 1 ? 'DÖNÜŞÜM' : 'VERİ';
  const sectionId = Number(listing.shop_section_id ?? listing.section_id ?? 0);
  const sectionName = sections.find((s) => s.shop_section_id === sectionId)?.title || 'Bölüm yok';
  return <div id={`etsy-listing-${listing.listing_id}`} key={listing.listing_id} style={{ padding: 16, borderBottom: '1px solid var(--admin-border, #e5e7eb)', outline: selectedListingId === listing.listing_id ? '2px solid #f59e0b' : 'none', borderRadius: selectedListingId === listing.listing_id ? 12 : 0, background: selectedListingId === listing.listing_id ? '#211a0d' : 'transparent' }}>
    <div style={{ display:'grid', gridTemplateColumns:'minmax(280px,2fr) repeat(5,minmax(90px,1fr)) minmax(210px,1.4fr)', gap:12, alignItems:'center' }}>
      <div><strong>{listing.title}</strong><div style={{ fontSize: 12, opacity: .6, marginTop: 5 }}>ID: {listing.listing_id} · Stok: {listing.quantity ?? '—'} · {sectionName}</div></div>
      <div><small style={{opacity:.6}}>👁 Görüntülenme</small><div style={{fontWeight:800,marginTop:3}}>{views}</div></div>
      <div><small style={{opacity:.6}}>♡ Favori</small><div style={{fontWeight:800,marginTop:3}}>{favs}</div></div>
      <div><small style={{opacity:.6}}>📈 İlgi</small><div style={{fontWeight:800,marginTop:3}}>{engagement.toFixed(1)}%</div></div>
      <div><small style={{opacity:.6}}>💰 Fiyat</small><div style={{fontWeight:800,marginTop:3}}>{p != null ? p.toFixed(2) + ' ' + (listing.price?.currency_code || '') : '—'}</div></div>
      <div><small style={{opacity:.6}}>🔎 SEO</small><div style={{fontWeight:800,marginTop:3}}>{seoLabel}</div></div>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end',flexWrap:'wrap'}}>
        <span style={{padding:'5px 8px',borderRadius:999,background:'#151b23',border:'1px solid #303846',fontSize:11,fontWeight:700}}>{action}</span>
        <a href={`/admin/etsy?listing=${listing.listing_id}#etsy-seo`} style={{padding:'7px 10px',borderRadius:8,textDecoration:'none',border:'1px solid #4b5563',fontWeight:700,fontSize:12}}>🤖 Optimize Et</a>
        {listing.url && <a href={listing.url} target="_blank" rel="noreferrer" style={{padding:'7px 10px',borderRadius:8,textDecoration:'none',border:'1px solid #4b5563',fontWeight:700,fontSize:12}}>↗ Etsy</a>}
      </div>
    </div>
  </div>;
})})() : null}
          </div>
        </>}
      </div>
    </div>
  );
}
