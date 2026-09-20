export default function PinterestManager() {
  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>📌 Pinterest Yönetimi</h1>
          <p>Etsy ürünlerini Pinterest için düzenli yayın akışına hazırla.</p>
        </div>
        <a href="/api/pinterest/connect">
          <button type="button">🔗 Pinterest'e Bağlan</button>
        </a>
      </div>

      <div style={{ maxWidth: 1100, display: 'grid', gap: 18 }}>
        <div style={{ background: '#0d1117', border: '1px solid var(--admin-border, #e5e7eb)', borderRadius: 16, padding: 24 }}>
          <h2 style={{ marginTop: 0 }}>🚀 Pinterest otomasyonu</h2>
          <p style={{ lineHeight: 1.7, opacity: .82 }}>
            Pinterest OAuth onay ekranına resmi bağlantı üzerinden gideceksin. Pinterest hesabında izin verdiğinde AGT Studio bağlantıyı tamamlayacak.
          </p>
          <p style={{ lineHeight: 1.7, opacity: .82 }}>
            Şifre veya Pinterest oturum bilgisi AGT Studio'ya verilmez.
          </p>
          <a href="/api/pinterest/connect">
            <button type="button">🔗 Pinterest'e Bağlan ve İzin Ver</button>
          </a>
        </div>

        <div style={{ background: '#0d1117', border: '1px solid var(--admin-border, #e5e7eb)', borderRadius: 16, padding: 24 }}>
          <h2 style={{ marginTop: 0 }}>📅 Ücretsiz yedek yayın yolu</h2>
          <p style={{ lineHeight: 1.7, opacity: .82 }}>
            API erişimi hazır olana kadar Pinterest'in kendi Pin oluşturma/zamanlama ekranını kullanabilirsin.
          </p>
          <a href="https://www.pinterest.com/pin-builder/" target="_blank" rel="noreferrer">
            <button type="button">📌 Pinterest'te Pin Oluştur</button>
          </a>
        </div>
      </div>
    </div>
  );
}
