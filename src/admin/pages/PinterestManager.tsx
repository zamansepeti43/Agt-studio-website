import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

type QueueItem = {
  id: string;
  etsy_listing_id: number;
  etsy_title?: string | null;
  etsy_url?: string | null;
  source_image_url?: string | null;
  generated_image_url?: string | null;
  pin_title?: string | null;
  board_name?: string | null;
  board_id?: string | null;
  status: 'pending' | 'ready' | 'published' | 'completed' | 'error' | 'skipped';
  image_index: number;
  image_count: number;
  scheduled_at?: string | null;
  approval_status: 'pending' | 'approved' | 'rejected';
  pin_id?: string | null;
  last_error?: string | null;
  published_at?: string | null;
  created_at: string;
  updated_at?: string;
};

type PinterestResponse = {
  ok: boolean;
  pinterestConnected: boolean;
  etsyListings: number;
  queue: QueueItem[];
  next?: QueueItem | null;
  latestPublished?: QueueItem | null;
  nextPublishAt?: string;
  cadence?: string;
  error?: string;
  pendingApproval?: QueueItem[];
  completed?: QueueItem[];
};

const tabs = [
  { id: 'queue', label: '📋 Yayın Kuyruğu' },
  { id: 'next', label: '🎯 Sıradaki Pin' },
  { id: 'settings', label: '⚙️ Ayarlar' },
] as const;

type TabId = typeof tabs[number]['id'];

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Istanbul',
  }).format(new Date(value));
}

function statusLabel(status: QueueItem['status']) {
  const map: Record<QueueItem['status'], string> = {
    pending: 'Bekliyor',
    ready: 'Sırada',
    published: 'Yayınlandı',
    error: 'Hata',
    skipped: 'Atlandı',
    completed: 'Ürün tamamlandı',
  };
  return map[status];
}

export default function PinterestManager() {
  const [tab, setTab] = useState<TabId>('queue');
  const [data, setData] = useState<PinterestResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadQueue = async () => {
    setRefreshing(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Yönetici oturumu bulunamadı. Lütfen tekrar giriş yapın.');

      const res = await fetch('/api/pinterest/sync', {
        method: 'GET',
        cache: 'no-store',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Pinterest kuyruğu alınamadı.');
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pinterest verileri alınamadı.');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const queue = data?.queue || [];
  const ready = queue.filter((item) => item.status === 'ready' && item.approval_status === 'approved');
  const published = queue.filter((item) => item.status === 'published' || item.status === 'completed');
  const pendingApproval = data?.pendingApproval || queue.filter((item) => item.approval_status === 'pending');
  const completed = data?.completed || queue.filter((item) => item.status === 'completed');
  const next = data?.next || ready[0] || null;

  const nextIndex = next ? queue.findIndex((item) => item.id === next.id) + 1 : 0;

  if (loading) {
    return <div className="admin-page"><h1>📌 Pinterest Yönetimi</h1><p>Pinterest yayın kuyruğu hazırlanıyor...</p></div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>📌 Pinterest Yönetimi</h1>
          <p>Etsy ilanlarının görsellerini ürün başına günde 1 kez, saatlik aralıklarla Pinterest'e planla.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" onClick={loadQueue} disabled={refreshing}>
            {refreshing ? 'Yenileniyor...' : '↻ Kuyruğu Yenile'}
          </button>
          <a href="/api/pinterest/connect">
            <button type="button">🔗 Pinterest'e Bağlan</button>
          </a>
        </div>
      </div>

      {error && <div style={{ marginBottom: 18, padding: 14, borderRadius: 12, border: '1px solid #7f1d1d', background: '#2b1010', color: '#fecaca' }}>{error}</div>}

      <div style={{ maxWidth: 1150 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 18 }}>
          <div style={{ background: '#0d1117', border: '1px solid var(--admin-border, #e5e7eb)', borderRadius: 14, padding: 18 }}>
            <small>Etsy ilanı</small><h2 style={{ margin: '6px 0 0' }}>{data?.etsyListings ?? 0}</h2>
          </div>
          <div style={{ background: '#0d1117', border: '1px solid var(--admin-border, #e5e7eb)', borderRadius: 14, padding: 18 }}>
            <small>Yayın kuyruğu</small><h2 style={{ margin: '6px 0 0' }}>{ready.length}</h2>
          </div>
          <div style={{ background: '#0d1117', border: '1px solid var(--admin-border, #e5e7eb)', borderRadius: 14, padding: 18 }}>
            <small>Yayınlanan görsel</small><h2 style={{ margin: '6px 0 0' }}>{published.length}</h2>
          </div>
          <div style={{ background: pendingApproval.length ? '#2a2110' : '#0d1117', border: '1px solid var(--admin-border, #e5e7eb)', borderRadius: 14, padding: 18 }}>
            <small>Onay bekleyen ürün</small><h2 style={{ margin: '6px 0 0' }}>{new Set(pendingApproval.map((item) => item.etsy_listing_id)).size}</h2>
          </div>
          <div style={{ background: '#0d1117', border: '1px solid var(--admin-border, #e5e7eb)', borderRadius: 14, padding: 18 }}>
            <small>Pinterest bağlantısı</small><h2 style={{ margin: '6px 0 0', fontSize: 18 }}>{data?.pinterestConnected ? '🟢 Aktif' : '🟠 Bekliyor'}</h2>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16, paddingBottom: 4 }}>
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              style={{
                whiteSpace: 'nowrap',
                border: '1px solid var(--admin-border, #e5e7eb)',
                background: tab === item.id ? '#1f2937' : '#0d1117',
                fontWeight: tab === item.id ? 800 : 600,
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {pendingApproval.length > 0 && (
          <div style={{ marginBottom: 16, padding: 18, background: '#2a2110', border: '1px solid #8a6a1f', borderRadius: 16 }}>
            <h2 style={{ marginTop: 0 }}>🔔 Onay bekliyor</h2>
            <p>Yeni Etsy ürünü algılandı. Onaylarsan o ürünün görselleri sırayla yayınlanmaya başlayacak.</p>
            {Array.from(new Map(pendingApproval.map((item) => [item.etsy_listing_id, item])).values()).map((item) => (
              <div key={item.etsy_listing_id} style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', padding: 10, borderTop: '1px solid #5b471a' }}>
                <div><strong>{item.etsy_title}</strong><div style={{ fontSize: 12, opacity: .7 }}>{item.image_count} görsel · İlk yayın {formatDate(item.scheduled_at)}</div></div>
                <button type="button" onClick={async () => {
                  try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session?.access_token) throw new Error('Yönetici oturumu bulunamadı.');
                    const ids = pendingApproval.filter((x) => x.etsy_listing_id === item.etsy_listing_id).map((x) => x.id);
                    const res = await fetch('/api/pinterest/sync', {
                      method: 'POST',
                      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'approve', ids }),
                    });
                    const json = await res.json();
                    if (!res.ok) throw new Error(json.error || 'Onay başarısız.');
                    await loadQueue();
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Onay başarısız.');
                  }
                }}>✅ Ürünü Onayla</button>
              </div>
            ))}
          </div>
        )}

        {tab === 'queue' && (
          <div style={{ background: '#0d1117', border: '1px solid var(--admin-border, #e5e7eb)', borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ margin: 0 }}>📋 Etsy → Pinterest sırası</h2>
                <p style={{ marginBottom: 0, opacity: .72 }}>Yeni ilan geldiğinde kuyruğun sonuna eklenir. Her gün yalnızca bir sonraki ilan yayınlanır.</p>
              </div>
              <strong>Sonraki: {nextIndex ? `#${nextIndex}` : '—'}</strong>
            </div>

            <div style={{ marginTop: 18, display: 'grid', gap: 10 }}>
              {queue.length === 0 && <p>Henüz kuyruk oluşturulmadı. Yenile butonuyla Etsy ilanlarını sıraya al.</p>}
              {queue.map((item, index) => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '70px 1fr auto', gap: 14, alignItems: 'center', padding: 12, border: '1px solid var(--admin-border, #e5e7eb)', borderRadius: 12 }}>
                  <div style={{ width: 70, height: 70, borderRadius: 10, overflow: 'hidden', background: '#151922' }}>
                    {(item.generated_image_url || item.source_image_url) && (
                      <img src={item.generated_image_url || item.source_image_url || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 800 }}>#{index + 1} · {item.etsy_title || 'Etsy ürünü'}</div>
                    <div style={{ fontSize: 12, opacity: .65, marginTop: 4 }}>Görsel {item.image_index + 1}/{item.image_count} · Pano: {item.board_name || 'Pano eşleşmesi bekliyor'}</div>
                    <div style={{ fontSize: 12, opacity: .65, marginTop: 3 }}>Plan: {formatDate(item.scheduled_at)} · Onay: {item.approval_status === 'approved' ? '✅' : '🔔 Bekliyor'}</div>
                    {item.published_at && <div style={{ fontSize: 12, opacity: .65, marginTop: 3 }}>Yayın: {formatDate(item.published_at)}</div>}
                    {item.last_error && <div style={{ fontSize: 12, color: '#fca5a5', marginTop: 3 }}>{item.last_error}</div>}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap' }}>{statusLabel(item.status)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'next' && (
          <div style={{ background: '#0d1117', border: '1px solid var(--admin-border, #e5e7eb)', borderRadius: 16, padding: 24 }}>
            <h2 style={{ marginTop: 0 }}>🎯 Sıradaki Pin</h2>
            {next ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 420px) 1fr', gap: 24, alignItems: 'start' }}>
                <div style={{ borderRadius: 14, overflow: 'hidden', background: '#151922' }}>
                  <img src={next.generated_image_url || next.source_image_url || ''} alt="" style={{ width: '100%', display: 'block' }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, opacity: .6 }}>Etsy ilan #{next.etsy_listing_id}</div>
                  <h2 style={{ marginTop: 8 }}>{next.etsy_title}</h2>
                  <p><strong>Pano:</strong> {next.board_name || 'Pano eşleşmesi bekliyor'}</p>
                  <p><strong>Durum:</strong> {statusLabel(next.status)}</p>
                  <p><strong>Yayın:</strong> Her aktif ürün için günde 1 görsel; ürünler 1 saat arayla.</p>
                  <p><strong>Sonraki yayın:</strong> {data?.nextPublishAt ? formatDate(data.nextPublishAt) : '—'}</p>
                  <p><strong>Görsel:</strong> {(next.image_index || 0) + 1}/{next.image_count}</p>
                  {next.etsy_url && <a href={next.etsy_url} target="_blank" rel="noreferrer"><button type="button">🛍️ Etsy ilanını aç</button></a>}
                </div>
              </div>
            ) : (
              <p>Kuyrukta yayınlanmayı bekleyen ilan yok.</p>
            )}
          </div>
        )}

        {tab === 'settings' && (
          <div style={{ background: '#0d1117', border: '1px solid var(--admin-border, #e5e7eb)', borderRadius: 16, padding: 24 }}>
            <h2 style={{ marginTop: 0 }}>⚙️ Pinterest yayın sistemi</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ padding: 16, borderRadius: 12, border: '1px solid var(--admin-border, #e5e7eb)' }}>
                <strong>Günlük limit</strong>
                <p style={{ marginBottom: 0, opacity: .72 }}>Her aktif Etsy ürünü günde 1 görsel yayınlar. Ürünler 1 saat arayla ilerler; 13 ürün varsa günde 13 Pin oluşur.</p>
              </div>
              <div style={{ padding: 16, borderRadius: 12, border: '1px solid var(--admin-border, #e5e7eb)' }}>
                <strong>Sıralama</strong>
                <p style={{ marginBottom: 0, opacity: .72 }}>Bir ürünün 8 görseli varsa 8 yayın gününde görsel serisi tamamlanır. Yeni ürün için telefona/onay merkezine onay isteği düşer.</p>
              </div>
              <div style={{ padding: 16, borderRadius: 12, border: '1px solid var(--admin-border, #e5e7eb)' }}>
                <strong>Görsel</strong>
                <p style={{ marginBottom: 0, opacity: .72 }}>Her Etsy ilanının ilk görseli alınır ve AGT Studio Pinterest kartına dönüştürülür; Pin bağlantısı doğrudan Etsy ilanına gider.</p>
              </div>
              <div style={{ padding: 16, borderRadius: 12, border: '1px solid var(--admin-border, #e5e7eb)' }}>
                <strong>Zamanlama</strong>
                <p style={{ marginBottom: 0, opacity: .72 }}>Başlangıç zamanımız Türkiye saatiyle 19:00. Pinterest'teki gerçek hesap verileri oluştukça zamanlamayı kendi Analytics verimize göre değiştirebiliriz.</p>
              </div>
              {!data?.pinterestConnected && (
                <a href="/api/pinterest/connect"><button type="button">🔗 Pinterest OAuth bağlantısını tamamla</button></a>
              )}
            </div>
          </div>
        )}

        <p style={{ marginTop: 14, fontSize: 12, opacity: .6 }}>
          Pinterest'in dağıtımı yalnızca yayın saatine bağlı değildir; arama, kaydetme ve etkileşim sinyalleri Pinlerin dağıtımını zaman içinde etkiler.
        </p>
      </div>
    </div>
  );
}
