import { useState } from 'react';
import { usePackages } from '../hooks/usePackages';
import type { Package } from '../types/admin';

// Local form keeps features as string[] for UI; package_items managed separately via hook
type PackageForm = {
  title: string;
  description: string;
  price: number | null;
  price_text: string;
  featured: boolean;
  active: boolean;
  order: number;
  features: string[];
};

const EMPTY: PackageForm = {
  title: '', description: '', price: null, price_text: 'Teklif alınız', featured: false, active: true, order: 0, features: [''],
};

export default function PackagesManager() {
  const { data: packages, loading, error, create, update, remove: deletePackage, toggleActive } = usePackages();
  const [modal, setModal] = useState<{ open: boolean; editing: Package | null }>({
    open: false, editing: null,
  });
  const [form, setForm] = useState<PackageForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const openAdd = () => {
    setForm({ ...EMPTY });
    setModal({ open: true, editing: null });
    setSaveError('');
  };

  const openEdit = (p: Package) => {
    setForm({
      title: p.title,
      description: p.description,
      price: p.price,
      price_text: p.price_text,
      featured: p.featured,
      active: p.active,
      order: p.order,
      features: p.features && p.features.length > 0 ? [...p.features] : [''],
    });
    setModal({ open: true, editing: p });
    setSaveError('');
  };

  const closeModal = () => setModal({ open: false, editing: null });

  const save = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    setSaveError('');
    const cleanFeatures = form.features.filter((f) => f.trim());
    const pkg = { title: form.title, description: form.description, price: form.price, price_text: form.price_text, featured: form.featured, active: form.active, order: form.order, features: cleanFeatures };

    try {
      if (modal.editing) {
        await update(modal.editing.id, pkg);
      } else {
        await create(pkg);
      }
      closeModal();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const remove = (id: string) => {
    if (!confirm('Bu paketi silmek istediğinizden emin misiniz?')) return;
    deletePackage(id).catch((e) => alert(e instanceof Error ? e.message : 'Silme başarısız'));
  };

  const toggle = (id: string) =>
    toggleActive(id).catch((e) => alert(e instanceof Error ? e.message : 'Durum değiştirme başarısız'));

  const setFeature = (idx: number, val: string) =>
    setForm((f) => ({
      ...f,
      features: f.features.map((item, i) => (i === idx ? val : item)),
    }));

  const addFeature = () => setForm((f) => ({ ...f, features: [...f.features, ''] }));

  const removeFeature = (idx: number) =>
    setForm((f) => ({ ...f, features: f.features.filter((_, i) => i !== idx) }));

  return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header-row">
          <div>
            <h1>Paket Yönetimi</h1>
            <p>Fiyatlandırma paketlerinizi yönetin.</p>
          </div>
          <button className="admin-btn admin-btn-primary" onClick={openAdd} disabled={loading || saving}>
            + Paket Ekle
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(248,81,73,0.12)', border: '1px solid rgba(248,81,73,0.25)', borderRadius: '12px', padding: '12px 16px', color: '#f85149', fontSize: '13px', marginBottom: '20px' }}>
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#8b949e' }}>Paketler yükleniyor...</div>
      ) : (
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Paket Adı</th>
              <th>Açıklama</th>
              <th>İçerikler</th>
              <th>Fiyat</th>
              <th>Durum</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {packages.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="admin-empty">
                    <div className="admin-empty-icon">📦</div>
                    Henüz paket eklenmemiş.
                  </div>
                </td>
              </tr>
            ) : (
              packages.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.title}</td>
                  <td style={{ color: '#8b949e', maxWidth: 200 }}>{p.description}</td>
                  <td style={{ color: '#8b949e', fontSize: 12 }}>
                    {(p.features ?? []).slice(0, 3).map((f, i) => (
                      <div key={i}>✔ {f}</div>
                    ))}
                    {(p.features ?? []).length > 3 && (
                      <div style={{ color: '#555' }}>+{(p.features ?? []).length - 3} daha</div>
                    )}
                  </td>
                  <td style={{ color: '#d4af37', fontWeight: 600 }}>{p.price_text}</td>
                  <td>
                    <label className="admin-toggle">
                      <input type="checkbox" checked={p.active} onChange={() => toggle(p.id)} />
                      <span className="admin-toggle-slider" />
                    </label>
                  </td>
                  <td>
                    <div className="admin-btn-actions">
                      <button className="admin-btn-icon" onClick={() => openEdit(p)} title="Düzenle">✏️</button>
                      <button className="admin-btn-icon danger" onClick={() => remove(p.id)} title="Sil">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      )}

      {modal.open && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{modal.editing ? 'Paketi Düzenle' : 'Yeni Paket Ekle'}</h2>
              <button className="admin-btn-icon" onClick={closeModal}>✕</button>
            </div>

            <div className="admin-form">
              <div className="admin-form-group">
                <label>Paket Adı *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Örn: Başlangıç Paketi"
                />
              </div>

              <div className="admin-form-group">
                <label>Açıklama</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Paket açıklaması..."
                  style={{ minHeight: 60 }}
                />
              </div>

              <div className="admin-form-group">
                <label>Fiyat Metni</label>
                <input
                  value={form.price_text}
                  onChange={(e) => setForm({ ...form, price_text: e.target.value })}
                  placeholder="Örn: Teklif alınız veya ₺1.500"
                />
              </div>

              <div className="admin-form-group">
                <label>Fiyat (sayı, opsiyonel)</label>
                <input
                  type="number"
                  value={form.price ?? ''}
                  onChange={(e) => setForm({ ...form, price: e.target.value === '' ? null : Number(e.target.value) })}
                  placeholder="Boş bırakılabilir"
                />
              </div>

              <div className="admin-form-group">
                <label>İçerik Maddeleri</label>
                <div className="admin-feature-list">
                  {form.features.map((f, idx) => (
                    <div key={idx} className="admin-feature-item">
                      <input
                        value={f}
                        onChange={(e) => setFeature(idx, e.target.value)}
                        placeholder={`Madde ${idx + 1}`}
                      />
                      <button
                        className="admin-btn-icon danger"
                        onClick={() => removeFeature(idx)}
                        disabled={form.features.length <= 1}
                        title="Kaldır"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    className="admin-btn admin-btn-secondary admin-btn-sm"
                    onClick={addFeature}
                    style={{ alignSelf: 'flex-start', marginTop: 4 }}
                  >
                    + Madde Ekle
                  </button>
                </div>
              </div>
            </div>

              {saveError && (
                <div style={{ background: 'rgba(248,81,73,0.12)', border: '1px solid rgba(248,81,73,0.25)', borderRadius: '8px', padding: '10px 12px', color: '#f85149', fontSize: '12px', marginBottom: '12px' }}>
                  {saveError}
                </div>
              )}

              <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-secondary" onClick={closeModal} disabled={saving}>İptal</button>
              <button className="admin-btn admin-btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Kaydediliyor...' : modal.editing ? 'Güncelle' : 'Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
