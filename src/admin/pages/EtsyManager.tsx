import { useEffect, useState } from 'react';
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
type EtsyListing = { listing_id: number; title: string; state: string; section_id?: number | null; shop_section_id?: number | null; taxonomy_id?: number | null; price?: { amount?: number; divisor?: number; currency_code?: string }; quantity?: number; url?: string; };
type EtsySection = { shop_section_id: number; title: string; rank?: number; active_listing_count?: number; };
type EtsyTaxonomy = { id: number; name: string; level?: number; parent_id?: number | null; path: string; };

const fieldStyle = { width: '100%', boxSizing: 'border-box' as const, padding: '11px 12px', borderRadius: 10, border: '1px solid var(--admin-border, #e5e7eb)', background: '#0d1117', color: 'inherit' };
const labelStyle = { display: 'block', fontWeight: 700, marginBottom: 7, fontSize: 13, color: '#f0f3f6' };

function normalize(value: string) {
  return value.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i');
}

function suggestSectionId(listing: EtsyListing, sections: EtsySection[]) {
  const text = normalize(listing.title);
  const candidates = [
    { keys: ['etsy seller', 'etsy satıcı', 'customer support', 'etsy tools'], labels: ['etsy', 'seller'] },
    { keys: ['api finder', 'ai api', 'developer', 'android', 'apk', 'no-code'], labels: ['ai', 'developer', 'android', 'apk'] },
    { keys: ['bakery', 'bakery pricing', 'barber', 'barbershop', 'beauty', 'pressure washing', 'job tracker'], labels: ['business', 'bakery', 'beauty', 'management'] },
    { keys: ['planner', 'planning', 'travel planner', 'moving', 'organizer'], labels: ['planner', 'planning', 'productivity', 'travel'] },
  ];
  let best: { id: number; score: number } | null = null;
  for (const candidate of candidates) {
    if (!candidate.keys.some((key) => text.includes(normalize(key)))) continue;
    for (const section of sections) {
      const sectionText = normalize(section.title);
      const score = candidate.labels.reduce((sum, label) => sectionText.includes(normalize(label)) ? sum + 1 : sum, 0);
      if (score >= 2 && (!best || score > best.score)) best = { id: section.shop_section_id, score };
    }
  }
  return best?.id ?? null;
}

function suggestTaxonomyId(listing: EtsyListing, taxonomy: EtsyTaxonomy[]) {
  const text = normalize(listing.title);
  const rules: Array<{ keys: string[]; labels: string[] }> = [
    { keys: ['travel planner', 'moving planner', 'planner'], labels: ['planner templates', 'planner template'] },
    { keys: ['social media', 'content calendar'], labels: ['social media templates'] },
    { keys: ['prompt generator', 'prompt pack', 'ai prompt'], labels: ['templates'] },
    { keys: ['bakery pricing', 'pricing calculator', 'profit calculator', 'calculator'], labels: ['business templates', 'templates'] },
    { keys: ['pressure washing', 'job tracker', 'business tool', 'business pro'], labels: ['business templates', 'templates'] },
    { keys: ['etsy seller', 'etsy customer support', 'etsy profit', 'etsy product research'], labels: ['business templates', 'templates'] },
    { keys: ['api finder', 'android', 'apk', 'windows apk', 'app builder', 'software'], labels: ['website templates', 'templates'] },
    { keys: ['subscription tracker', 'tracker'], labels: ['planner templates', 'templates'] },
  ];

  let best: { id: number; score: number } | null = null;
  for (const rule of rules) {
    if (!rule.keys.some((key) => text.includes(normalize(key)))) continue;
    for (const node of taxonomy) {
      const path = normalize(node.path);
      const leaf = normalize(node.name);
      // Prefer a specific leaf over broad parent nodes such as "Paper & Party Supplies".
      let score = 0;
      for (const label of rule.labels) {
        const target = normalize(label);
        if (leaf === target) score += 12;
        else if (leaf.includes(target)) score += 7;
        else if (path.includes(target)) score += 2;
      }
      if (node.level >= 3) score += 2;
      if (score > 0 && (!best || score > best.score)) best = { id: node.id, score };
    }
  }
  return best?.id ?? null;
}

export default function EtsyManager() {
  const [status, setStatus] = useState<EtsyStatus | null>(null);
  const [shop, setShop] = useState<EtsyShop | null>(null);
  const [profile, setProfile] = useState<EtsyProfile | null>(null);
  const [listings, setListings] = useState<EtsyListing[]>([]);
  const [sections, setSections] = useState<EtsySection[]>([]);
  const [taxonomy, setTaxonomy] = useState<EtsyTaxonomy[]>([]);
  const [taxonomyAssignments, setTaxonomyAssignments] = useState<Record<number, number>>({});
  const [sectionAssignments, setSectionAssignments] = useState<Record<number, number>>({});
  const [listingCount, setListingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [applyingSections, setApplyingSections] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [form, setForm] = useState({ title: '', announcement: '', sale_message: '', digital_sale_message: '' });

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
      const loadedTaxonomy = Array.isArray(listingsData.taxonomy) ? listingsData.taxonomy : [];
      setShop(shopData); setProfile(profileData); setListings(loadedListings); setSections(loadedSections); setTaxonomy(loadedTaxonomy); setListingCount(Number(listingsData.listings?.count || 0));
      const initialAssignments: Record<number, number> = {};
      const initialTaxonomyAssignments: Record<number, number> = {};
      for (const listing of loadedListings) {
        const current = Number(listing.shop_section_id ?? listing.section_id ?? 0);
        const suggested = suggestSectionId(listing, loadedSections);
        const taxonomyId = Number(listing.taxonomy_id || 0);
        if (current) initialAssignments[listing.listing_id] = current;
        else if (suggested) initialAssignments[listing.listing_id] = suggested;
        if (taxonomyId) initialTaxonomyAssignments[listing.listing_id] = taxonomyId;
      }
      setSectionAssignments(initialAssignments);
      setTaxonomyAssignments(initialTaxonomyAssignments);
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
  useEffect(() => { loadStatus(); }, []);

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
        const currentTaxonomy = Number(listing.taxonomy_id || 0);
        const sectionId = Number(sectionAssignments[listing.listing_id] || 0);
        const taxonomyId = Number(taxonomyAssignments[listing.listing_id] || 0);
        return {
          listing_id: listing.listing_id,
          section_id: sectionId || undefined,
          taxonomy_id: taxonomyId || undefined,
          changed: (sectionId && sectionId !== currentSection) || (taxonomyId && taxonomyId !== currentTaxonomy),
        };
      })
      .filter((item) => item.changed && (item.section_id || item.taxonomy_id))
      .map(({ changed, ...item }) => item);

    if (!changes.length) {
      setSaved('Onaylanacak kategori değişikliği yok.');
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
      if (!res.ok && res.status !== 207) throw new Error(data.error || 'Kategori değişiklikleri uygulanamadı.');
      if (data.failed) throw new Error(`${data.updated} ürün güncellendi, ${data.failed} ürün güncellenemedi.`);
      setSaved(`Onaylandı ve Etsy'ye uygulandı: ${data.updated} ürün.`);
      await loadData();
      setTimeout(() => setSaved(''), 6000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kategori değişiklikleri uygulanamadı.');
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
      <div style={{ maxWidth: 1100 }}>
        <div style={{ background: '#0d1117', border: '1px solid var(--admin-border, #e5e7eb)', borderRadius: 16, padding: 24 }}>
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

          <div style={{ marginTop: 20, background: '#0d1117', border: '1px solid var(--admin-border, #e5e7eb)', borderRadius: 16, padding: 24 }}>
            <h2 style={{ marginTop: 0 }}>👤 Etsy Profili</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              {profile?.image_url_75x75 && <img src={profile.image_url_75x75} alt="" width="75" height="75" style={{ borderRadius: '50%', objectFit: 'cover' }} />}
              <div><strong>{[profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || '—'}</strong><div style={{ opacity: .7, marginTop: 4 }}>{profile?.primary_email || '—'}</div></div>
            </div>
            <p style={{ marginBottom: 0, marginTop: 12, fontSize: 13, opacity: .7 }}>Profil verileri Etsy API üzerinden okunuyor. Bu panelde güvenli olarak mağaza alanlarını düzenleyebiliyoruz.</p>
          </div>

          <div style={{ marginTop: 20, background: '#0d1117', border: '1px solid var(--admin-border, #e5e7eb)', borderRadius: 16, padding: 24 }}>
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

          <div style={{ marginTop: 20, background: '#0d1117', border: '1px solid var(--admin-border, #e5e7eb)', borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ marginTop: 0, marginBottom: 4 }}>🗂️ Etsy Kategori + Mağaza Bölümü Yerleşimi</h2>
                <p style={{ margin: 0, fontSize: 13, opacity: .75 }}>Mevcut kategori Etsy API'sinden gelir. AGT Studio artık ürün başlığına göre yalnızca spesifik ve güçlü taxonomy (kategori) eşleşmelerini önerir; seçim yapılmadan Etsy'ye yazmaz.</p>
              </div>
              <button type="button" onClick={applySectionAssignments} disabled={applyingSections || (!sections.length && !taxonomy.length)}>{applyingSections ? 'Etsy’ye uygulanıyor...' : '✅ Seçimleri Onayla ve Etsy’ye Uygula'}</button>
            </div>

            {!sections.length && !taxonomy.length && <p style={{ marginTop: 18 }}>Etsy kategori/bölüm verisi bulunamadı.</p>}
            {(sections.length > 0 || taxonomy.length > 0) && <div style={{ marginTop: 18 }}>
              {sections.length > 0 && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                {sections.map((section) => <span key={section.shop_section_id} style={{ padding: '6px 10px', borderRadius: 999, background: '#151b23', border: '1px solid #303846', fontSize: 12 }}>📁 {section.title} · {section.active_listing_count ?? 0} ilan</span>)}
              </div>}
              {listings.map((listing) => {
                const suggestedSection = suggestSectionId(listing, sections);
                const suggestedTaxonomy = suggestTaxonomyId(listing, taxonomy);
                const selectedSection = sectionAssignments[listing.listing_id] ?? suggestedSection ?? '';
                const selectedTaxonomy = taxonomyAssignments[listing.listing_id] ?? (Number(listing.taxonomy_id || 0) || '');
                const currentSectionId = Number(listing.shop_section_id ?? listing.section_id ?? 0);
                const currentSectionName = sections.find((s) => s.shop_section_id === currentSectionId)?.title || 'Bölüm yok';
                const currentTaxonomyName = taxonomy.find((t) => t.id === Number(listing.taxonomy_id))?.path || 'Kategori atanmış değil';
                const suggestedTaxonomyName = taxonomy.find((t) => t.id === Number(suggestedTaxonomy))?.path || 'Güvenilir öneri bulunamadı';
                const suggestedSectionName = sections.find((s) => s.shop_section_id === Number(suggestedSection))?.title || 'Eşleşme yok';
                return <div key={listing.listing_id} style={{ padding: '14px 0', borderBottom: '1px solid var(--admin-border, #e5e7eb)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 1.35fr) minmax(220px, 1fr) minmax(220px, 1fr)', gap: 12, alignItems: 'center' }}>
                    <div><strong>{listing.title}</strong><div style={{ fontSize: 12, opacity: .6 }}>ID: {listing.listing_id}</div></div>
                    <div><small style={{ opacity: .65 }}>Mevcut Etsy kategorisi</small><div style={{ marginTop: 4 }}>{currentTaxonomyName}</div><small style={{ opacity: .55 }}>Öneri: {suggestedTaxonomyName}</small></div>
                    <div><small style={{ opacity: .65 }}>Mevcut mağaza bölümü</small><div style={{ marginTop: 4 }}>{currentSectionName}</div><small style={{ opacity: .55 }}>Öneri: {suggestedSectionName}</small></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 1fr) minmax(240px, 1fr)', gap: 12, marginTop: 10 }}>
                    <div>
                      <small style={{ opacity: .65 }}>Marketplace kategorisi seç</small>
                      <select value={selectedTaxonomy} onChange={(e) => setTaxonomyAssignments((prev) => ({ ...prev, [listing.listing_id]: Number(e.target.value) }))} style={{ ...fieldStyle, marginTop: 4 }}>
                        <option value="">Kategori seç</option>
                        {taxonomy.map((node) => <option key={node.id} value={node.id}>{node.path}</option>)}
                      </select>
                    </div>
                    <div>
                      <small style={{ opacity: .65 }}>Mağaza bölümü seç</small>
                      <select value={selectedSection} onChange={(e) => setSectionAssignments((prev) => ({ ...prev, [listing.listing_id]: Number(e.target.value) }))} style={{ ...fieldStyle, marginTop: 4 }}>
                        <option value="">Bölüm seç</option>
                        {sections.map((section) => <option key={section.shop_section_id} value={section.shop_section_id}>{section.title}</option>)}
                      </select>
                    </div>
                  </div>
                </div>;
              })}
            </div>}
          </div>

          <div style={{ marginTop: 20, background: '#0d1117', border: '1px solid var(--admin-border, #e5e7eb)', borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h2 style={{ marginTop: 0, marginBottom: 0 }}>Aktif İlanlar</h2>
              <button type="button" onClick={applyTargetedSeoOptimization} disabled={saving}>🎯 2 Ürünün SEO'sunu Uygula</button>
            </div>
            <p style={{ marginTop: 10, fontSize: 13, opacity: .75 }}>Sıfır görüntülenmede kalan Bakery Pricing Calculator ve Etsy Seller Customer Support Tool için hazırlanan başlık, 13 etiket ve açıklama girişini Etsy'ye uygular. Fiyat ve görseller değiştirilmez; diğer ilanlara dokunulmaz.</p>
            {dataLoading && <p>İlanlar Etsy’den getiriliyor...</p>}
            {!dataLoading && listings.length === 0 && <p>Aktif ilan bulunamadı.</p>}
            {!dataLoading && listings.map((listing) => { const p = listing.price?.amount != null && listing.price?.divisor ? listing.price.amount / listing.price.divisor : null; return <div key={listing.listing_id} style={{ display: 'flex', justifyContent: 'space-between', gap: 14, padding: 14, borderBottom: '1px solid var(--admin-border, #e5e7eb)' }}><div><strong>{listing.title}</strong><div style={{ fontSize: 13, opacity: .7 }}>ID: {listing.listing_id} · Stok: {listing.quantity ?? '—'}</div></div><strong>{p != null ? p.toFixed(2) + ' ' + (listing.price?.currency_code || '') : '—'}</strong></div>; })}
          </div>
        </>}
      </div>
    </div>
  );
}
