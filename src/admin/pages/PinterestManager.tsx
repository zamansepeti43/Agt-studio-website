import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

type Item = {
  id: string;
  etsy_listing_id: number;
  etsy_title: string;
  etsy_url: string;
  generated_image_url?: string | null;
  pin_title?: string | null;
  pin_description?: string | null;
  board_name?: string | null;
  status: string;
  last_error?: string | null;
};

export default function PinterestManager() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const authHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Yönetici oturumu bulunamadı.');
    return { Authorization: `Bearer ${session.access_token}` };
  };

  const loadQueue = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/pinterest/queue', {
        headers: await authHeaders(),
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Pinterest kuyruğu alınamadı.');
      setItems(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kuyruk alınamadı.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadQueue(); }, []);

  const syncNow = async () => {
    setSyncing(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch('/api/pinterest/sync-now', {
        method: 'POST',
        headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Pinterest senkronizasyonu başarısız.');
      setMessage(data.message || `Kuyruk hazırlandı: ${data.queued || 0} ürün.`);
      await loadQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Senkronizasyon başarısız.');
    } finally {
      setSyncing(false);
    }
  };

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setMessage('Panoya kopyalandı.');
      setTimeout(() => setMessage(''), 1800);
    } catch {
      setError('Kopyalama başarısız. Metni manuel kopyalayabilirsin.');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>📌 Pinterest Yönetimi</h1>
          <p>Etsy ürünlerini ücretsiz Pinterest yayın kuyruğuna hazırla.</p>
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <button type="button" onClick={loadQueue} disabled={loading}>↻ Yenile</button>
          <button type="button" onClick={syncNow} disabled={syncing}>
            {syncing ? 'Hazırlanıyor...' : '⚡ Etsy → Pinterest Hazırla'}
          </button>
        </div>
      </div>

      <div style={{ maxWidth:1100 }}>
        <div style={{ background:'#0d1117', border:'1px solid var(--admin-border, #e5e7eb)', borderRadius:16, padding:22 }}>
          <h2 style={{ marginTop:0 }}>Ücretsiz yayın sistemi</h2>
          <p style={{ lineHeight:1.6, opacity:.82, marginBottom:0 }}>
            Bu ekran Etsy ürününü, görselini, başlığını, açıklamasını, bağlantısını ve pano bilgisini hazırlar.
            Pinterest API onayı gelene kadar Pin'i Pinterest'in kendi ücretsiz zamanlayıcısından yayınlayabilirsin.
          </p>
        </div>

        {message && <p style={{ color:'#15803d', fontWeight:700 }}>{message}</p>}
        {error && <p style={{ color:'#b91c1c', fontWeight:700 }}>{error}</p>}

        {loading ? <p>Kuyruk yükleniyor...</p> : items.length === 0 ? (
          <div style={{ marginTop:18, padding:24, background:'#0d1117', border:'1px solid var(--admin-border, #e5e7eb)', borderRadius:16 }}>
            <strong>Henüz kuyruk yok.</strong>
            <p style={{ opacity:.75 }}>“Etsy → Pinterest Hazırla” düğmesine bas.</p>
          </div>
        ) : (
          <div style={{ display:'grid', gap:16, marginTop:18 }}>
            {items.map(item => (
              <div key={item.id} style={{ background:'#0d1117', border:'1px solid var(--admin-border, #e5e7eb)', borderRadius:16, padding:18 }}>
                <div style={{ display:'grid', gridTemplateColumns:'minmax(180px,240px) 1fr', gap:18, alignItems:'start' }}>
                  <div>
                    {item.generated_image_url ? (
                      <img src={item.generated_image_url} alt={item.etsy_title} style={{ width:'100%', aspectRatio:'2/3', objectFit:'cover', borderRadius:12, display:'block' }} />
                    ) : <div style={{ padding:30, textAlign:'center', background:'#161b22', borderRadius:12 }}>Görsel yok</div>}
                  </div>
                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', gap:10, alignItems:'start' }}>
                      <div>
                        <h3 style={{ marginTop:0, marginBottom:6 }}>{item.pin_title || item.etsy_title}</h3>
                        <div style={{ fontSize:13, opacity:.7 }}>Pano: {item.board_name || 'Eşleşmedi'} · Durum: {item.status}</div>
                      </div>
                    </div>
                    <p style={{ lineHeight:1.5 }}>{item.pin_description || '—'}</p>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:14 }}>
                      {item.generated_image_url && <a href={item.generated_image_url} target="_blank" rel="noreferrer"><button type="button">🖼️ Görseli Aç</button></a>}
                      <button type="button" onClick={() => copy(item.pin_title || item.etsy_title)}>Başlığı Kopyala</button>
                      <button type="button" onClick={() => copy(item.pin_description || item.etsy_title)}>Açıklamayı Kopyala</button>
                      <button type="button" onClick={() => copy(item.etsy_url)}>🔗 Etsy Linkini Kopyala</button>
                      <a href="https://www.pinterest.com/pin-builder/" target="_blank" rel="noreferrer"><button type="button">📌 Pinterest'te Oluştur</button></a>
                    </div>
                    {item.last_error && <p style={{ color:'#b91c1c', fontSize:13 }}>{item.last_error}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
