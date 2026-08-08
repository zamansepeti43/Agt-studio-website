import { useState } from 'react';
import { useJobs } from '../hooks/useJobs';
import type { Job } from '../types/admin';

const EMPTY: Omit<Job, 'id' | 'created_at' | 'updated_at'> = {
  title: '', category: '', description: '', price: null, price_type: 'quote', active: true, order: 0,
};

export default function JobsManager() {
  const { data: jobs, loading, error, create, update, remove: deleteJob, toggleActive } = useJobs();
  const [modal, setModal] = useState<{ open: boolean; editing: Job | null }>({
    open: false, editing: null,
  });
  const [form, setForm] = useState<Omit<Job, 'id' | 'created_at' | 'updated_at'>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const openAdd = () => {
    setForm(EMPTY);
    setModal({ open: true, editing: null });
    setSaveError('');
  };

  const openEdit = (j: Job) => {
    setForm({
      title: j.title,
      category: j.category,
      description: j.description,
      price: j.price,
      price_type: j.price_type,
      active: j.active,
      order: j.order,
    });
    setModal({ open: true, editing: j });
    setSaveError('');
  };

  const closeModal = () => setModal({ open: false, editing: null });

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
    if (!confirm('Bu işi silmek istediğinizden emin misiniz?')) return;
    deleteJob(id).catch((e) => {
      alert(e instanceof Error ? e.message : 'Silme başarısız');
    });
  };

  const toggle = (id: string) => {
    toggleActive(id).catch((e) => {
      alert(e instanceof Error ? e.message : 'Durum değiştirme başarısız');
    });
  };

  return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header-row">
          <div>
            <h1>İş Listesi</h1>
            <p>Sunduğunuz işleri ve fiyatlarını yönetin.</p>
          </div>
          <button className="admin-btn admin-btn-primary" onClick={openAdd} disabled={loading || saving}>
            + İş Ekle
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: 'rgba(248,81,73,0.12)',
            border: '1px solid rgba(248,81,73,0.25)',
            borderRadius: '12px',
            padding: '12px 16px',
            color: '#f85149',
            fontSize: '13px',
            marginBottom: '20px',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#8b949e' }}>
          İşler yükleniyor...
        </div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>İş Adı</th>
                <th>Kategori</th>
                <th>Açıklama</th>
                <th>Fiyat</th>
                <th>Fiyat Tipi</th>
                <th>Durum</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="admin-empty">
                      <div className="admin-empty-icon">💼</div>
                      Henüz iş eklenmemiş.
                    </div>
                  </td>
                </tr>
              ) : (
                jobs.map((j) => (
                  <tr key={j.id}>
                    <td style={{ fontWeight: 600 }}>{j.title}</td>
                    <td>
                      <span className="admin-badge admin-badge-category">{j.category}</span>
                    </td>
                    <td style={{ color: '#8b949e', maxWidth: 260 }}>{j.description}</td>
                    <td style={{ color: '#d4af37' }}>
                      {j.price_type === 'fixed' && j.price != null ? `₺${j.price.toLocaleString('tr-TR')}` : '—'}
                    </td>
                    <td>
                      <span
                        className="admin-badge"
                        style={
                          j.price_type === 'fixed'
                            ? { background: 'rgba(88,166,255,0.12)', color: '#58a6ff' }
                            : { background: 'rgba(212,175,55,0.12)', color: '#d4af37' }
                        }
                      >
                        {j.price_type === 'fixed' ? 'Sabit Fiyat' : 'Teklif Alınız'}
                      </span>
                    </td>
                    <td>
                      <label className="admin-toggle">
                        <input type="checkbox" checked={j.active} onChange={() => toggle(j.id)} />
                        <span className="admin-toggle-slider" />
                      </label>
                    </td>
                    <td>
                      <div className="admin-btn-actions">
                        <button className="admin-btn-icon" onClick={() => openEdit(j)} title="Düzenle">✏️</button>
                        <button className="admin-btn-icon danger" onClick={() => remove(j.id)} title="Sil">🗑️</button>
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
              <h2>{modal.editing ? 'İşi Düzenle' : 'Yeni İş Ekle'}</h2>
              <button className="admin-btn-icon" onClick={closeModal}>✕</button>
            </div>

            {saveError && (
              <div
                style={{
                  background: 'rgba(248,81,73,0.12)',
                  border: '1px solid rgba(248,81,73,0.25)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  color: '#f85149',
                  fontSize: '12px',
                  margin: '0 0 12px 0',
                }}
              >
                {saveError}
              </div>
            )}

            <div className="admin-form">
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>İş Adı *</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Örn: Logo Tasarımı"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Kategori</label>
                  <input
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="Örn: Tasarım"
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label>Açıklama</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="İş açıklaması..."
                />
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Fiyat Tipi</label>
                  <select
                    value={form.price_type}
                    onChange={(e) =>
                      setForm({ ...form, price_type: e.target.value as 'fixed' | 'quote', price: null })
                    }
                  >
                    <option value="quote">Teklif Alınız</option>
                    <option value="fixed">Sabit Fiyat</option>
                  </select>
                </div>

                {form.price_type === 'fixed' && (
                  <div className="admin-form-group">
                    <label>Fiyat (₺)</label>
                    <input
                      type="number"
                      min={0}
                      value={form.price ?? ''}
                      onChange={(e) =>
                        setForm({ ...form, price: e.target.value ? Number(e.target.value) : null })
                      }
                      placeholder="0"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-secondary" onClick={closeModal} disabled={saving}>
                İptal
              </button>
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
