import { useEffect, useState } from 'react';

type EtsyStatus = {
  connected: boolean;
  shopUserId?: number | null;
  scope?: string | null;
  connectedAt?: string | null;
  updatedAt?: string | null;
  error?: string;
};

export default function EtsyManager() {
  const [status, setStatus] = useState<EtsyStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStatus = async () => {
    try {
      const res = await fetch('/api/etsy/status', { cache: 'no-store' });
      setStatus(await res.json());
    } catch {
      setStatus({ connected: false, error: 'Durum alınamadı.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  if (loading) {
    return <div className="admin-page"><h1>Etsy Yönetimi</h1><p>Bağlantı kontrol ediliyor...</p></div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Etsy Yönetimi</h1>
          <p>AGT Studio Etsy mağaza bağlantısı</p>
        </div>
      </div>

      <div style={{ maxWidth: 760, background: 'var(--admin-card-bg, #fff)', border: '1px solid var(--admin-border, #e5e7eb)', borderRadius: 16, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0 }}>Etsy OAuth Bağlantısı</h2>
            <p style={{ marginTop: 8 }}>
              {status?.connected
                ? 'Etsy mağazan AGT Studio’ya bağlı.'
                : 'Henüz Etsy mağazası bağlanmadı.'}
            </p>
          </div>
          <div style={{ fontWeight: 700 }}>
            {status?.connected ? '🟢 Bağlı' : '⚪ Bağlı değil'}
          </div>
        </div>

        {status?.error && (
          <p style={{ marginTop: 16, color: '#b91c1c' }}>{status.error}</p>
        )}

        {!status?.connected && (
          <button
            type="button"
            onClick={() => { window.location.href = '/api/etsy/auth'; }}
            style={{ marginTop: 20, padding: '12px 18px', border: 0, borderRadius: 10, cursor: 'pointer', fontWeight: 700 }}
          >
            Etsy Mağazasını Bağla
          </button>
        )}

        {status?.connected && (
          <div style={{ marginTop: 20, fontSize: 14 }}>
            <div><strong>Shop User ID:</strong> {status.shopUserId}</div>
            <div style={{ marginTop: 6 }}><strong>Yetkiler:</strong> {status.scope}</div>
          </div>
        )}
      </div>
    </div>
  );
}
