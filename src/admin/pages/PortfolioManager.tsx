import { useState, useRef } from 'react';
import { usePortfolio } from '../hooks/usePortfolio';
import { supabase } from '../../lib/supabase';
import type { PortfolioItem } from '../types/admin';

const BUCKET = 'portfolio';

const CATEGORIES = ['Logo', 'Menü', 'Kartvizit', 'Sosyal Medya', 'Web', 'Yapay Zeka', 'Diğer'];

const EMPTY: Omit<PortfolioItem, 'id' | 'created_at' | 'updated_at'> = {
  title: '', category: 'Logo', description: '', image_url: null, active: true, order: 0,
};

export default function PortfolioManager() {
  const { data: items, loading, error, create, update, remove: deleteItem, toggleActive } = usePortfolio();
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [modal, setModal] = useState<{ open: boolean; editing: PortfolioItem | null }>({
    open: false, editing: null,
  });
  const [form, setForm] = useState<Omit<PortfolioItem, 'id' | 'created_at' | 'updated_at'>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openAdd = (category = 'Logo') => {
    setForm({ ...EMPTY, category });
    setModal({ open: true, editing: null });
    setSaveError('');
    setUploadError('');
  };

  const openEdit = (item: PortfolioItem) => {
    setForm({ title: item.title, category: item.category, description: item.description, image_url: item.image_url, active: item.active, order: item.order });
    setModal({ open: true, editing: item });
    setSaveError('');
    setUploadError('');
  };

  const closeModal = () => {
    if (saving || uploading) return;
    setModal({ open: false, editing: null });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setUploadError('Sadece JPG, PNG veya WebP dosyası yüklenebilir.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Dosya boyutu 5MB'ı aşamaz.");
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      const ext = file.name.split('.').pop();
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(filename, file, { upsert: false });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filename);
      setForm((f) => ({ ...f, image_url: urlData.publicUrl }));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Yükleme başarısız');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const save = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    setSaveError('');
    try {
      if (modal.editing) {
        await update(modal.editing.id, form);
      } else {
        await create(form);
      }
      closeModal();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const remove = (id: string) => {
    if (!confirm('Bu portföy öğesini silmek istediğinizden emin misiniz?')) return;
    deleteItem(id).catch((e) => alert(e instanceof Error ? e.message : 'Silme başarısız'));
  };

  const toggle = (id: string) =>
    toggleActive(id).catch((e) => alert(e instanceof Error ? e.message : 'Durum değiştirme başarısız'));

  // Items whose category doesn't match known list → "Diğer"
  const normalize = (cat: string) => (CATEGORIES.includes(cat) ? cat : 'Diğer');
  const itemsForCat = (cat: string) => items.filter((i) => normalize(i.category) === cat);

  return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header-row">
          <div>
            <h1>Portföy Yönetimi</h1>
            <p>Kategorilere göre portföy çalışmalarını yönetin.</p>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(248,81,73,0.12)', border: '1px solid rgba(248,81,73,0.25)', borderRadius: '12px', padding: '12px 16px', color: '#f85149', fontSize: '13px', marginBottom: '20px' }}>
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#8b949e' }}>Portföy öğeleri yükleniyor...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {CATEGORIES.map((cat) => {
            const catItems = itemsForCat(cat);
            const isOpen = openCat === cat;

            return (
              <div key={cat} className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Accordion header */}
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => setOpenCat(isOpen ? null : cat)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 13, color: isOpen ? '#d4af37' : '#e6edf3', fontWeight: 600 }}>{cat}</span>
                    <span style={{ background: 'rgba(212,175,55,0.12)', color: '#d4af37', borderRadius: 20, padding: '1px 8px', fontSize: 11 }}>
                      {catItems.length}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                      className="admin-btn admin-btn-primary"
                      style={{ fontSize: 12, padding: '4px 12px' }}
                      onClick={(e) => { e.stopPropagation(); openAdd(cat); }}
                      disabled={saving}
                    >
                      + Ekle
                    </button>
                    <span style={{ color: '#555', fontSize: 11 }}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Accordion body */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '0 0 4px' }}>
                    {catItems.length === 0 ? (
                      <div className="admin-empty" style={{ padding: '28px 20px' }}>
                        <div className="admin-empty-icon">🖼️</div>
                        Bu kategoride henüz çalışma yok.
                      </div>
                    ) : (
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Görsel</th>
                            <th>Başlık</th>
                            <th>Açıklama</th>
                            <th>Durum</th>
                            <th>İşlemler</th>
                          </tr>
                        </thead>
                        <tbody>
                          {catItems.map((item) => (
                            <tr key={item.id}>
                              <td>
                                {item.image_url ? (
                                  <img src={item.image_url} alt={item.title} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)' }} />
                                ) : (
                                  <div style={{ width: 48, height: 48, borderRadius: 6, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🖼️</div>
                                )}
                              </td>
                              <td style={{ fontWeight: 600 }}>{item.title}</td>
                              <td style={{ color: '#8b949e', maxWidth: 260 }}>{item.description}</td>
                              <td>
                                <label className="admin-toggle">
                                  <input type="checkbox" checked={item.active} onChange={() => toggle(item.id)} />
                                  <span className="admin-toggle-slider" />
                                </label>
                              </td>
                              <td>
                                <div className="admin-btn-actions">
                                  <button className="admin-btn-icon" onClick={() => openEdit(item)} title="Düzenle">✏️</button>
                                  <button className="admin-btn-icon danger" onClick={() => remove(item.id)} title="Sil">🗑️</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modal.open && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{modal.editing ? 'Öğeyi Düzenle' : 'Yeni Portföy Öğesi'}</h2>
              <button className="admin-btn-icon" onClick={closeModal} disabled={saving}>✕</button>
            </div>

            {saveError && (
              <div style={{ background: 'rgba(248,81,73,0.12)', border: '1px solid rgba(248,81,73,0.25)', borderRadius: '8px', padding: '10px 12px', color: '#f85149', fontSize: '12px', marginBottom: '12px' }}>
                {saveError}
              </div>
            )}

            <div className="admin-form">
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Başlık *</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Örn: AGT Logo Tasarımı"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Kategori</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="admin-form-group">
                <label>Açıklama</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Portföy öğesi açıklaması..."
                />
              </div>

              <div className="admin-form-group">
                <label>Görsel</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {form.image_url && (
                    <div style={{ position: 'relative', width: '100%', maxWidth: 200 }}>
                      <img
                        src={form.image_url}
                        alt="önizleme"
                        style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, image_url: null }))}
                        disabled={uploading || saving}
                        style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer', padding: '2px 6px', fontSize: 12 }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileSelect}
                    disabled={uploading || saving}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || saving}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    {uploading ? 'Yükleniyor...' : form.image_url ? '📸 Görseli Değiştir' : '📸 Görsel Yükle'}
                  </button>
                  {uploadError && <div style={{ color: '#f85149', fontSize: 12 }}>⚠️ {uploadError}</div>}
                  <div style={{ color: '#555', fontSize: 11 }}>JPG, PNG veya WebP · Maks 5MB</div>
                </div>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-secondary" onClick={closeModal} disabled={saving}>İptal</button>
              <button className="admin-btn admin-btn-primary" onClick={save} disabled={saving || uploading}>
                {saving ? 'Kaydediliyor...' : modal.editing ? 'Güncelle' : 'Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
