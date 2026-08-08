import { useState } from 'react';
import { useServices } from '../hooks/useServices';
import type { Service } from '../types/admin';

type ServiceForm = Omit<Service, 'id' | 'created_at' | 'updated_at'>;

const EMPTY: ServiceForm = {
  title: '',
  description: '',
  icon: '🎨',
  category: 'Tasarım',
  price: null,
  price_type: 'fixed',
  active: true,
  order: 0,
};

export default function ServicesManager() {
  const {
    data: services,
    loading,
    error,
    create,
    update,
    remove: deleteService,
    toggleActive,
  } = useServices();

  const [modal, setModal] = useState<{
    open: boolean;
    editing: Service | null;
  }>({
    open: false,
    editing: null,
  });

  const [form, setForm] = useState<ServiceForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const openAdd = () => {
    setForm({ ...EMPTY });
    setModal({
      open: true,
      editing: null,
    });
    setSaveError('');
  };

  const openEdit = (service: Service) => {
    setForm({
      title: service.title,
      description: service.description,
      icon: service.icon,
      category: service.category,
      price: service.price,
      price_type: service.price_type,
      active: service.active,
      order: service.order,
    });

    setModal({
      open: true,
      editing: service,
    });

    setSaveError('');
  };

  const closeModal = () => {
    if (saving) return;

    setModal({
      open: false,
      editing: null,
    });

    setSaveError('');
  };

  const save = async () => {
    if (!form.title.trim()) {
      setSaveError('Hizmet adı zorunludur.');
      return;
    }

    setSaving(true);
    setSaveError('');

    try {
      if (modal.editing) {
        await update(modal.editing.id, form);
      } else {
        await create(form);
      }

      setModal({
        open: false,
        editing: null,
      });
    } catch (e) {
      setSaveError(
        e instanceof Error ? e.message : 'Kayıt sırasında hata oluştu.'
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = (id: string) => {
    if (
      !confirm(
        'Bu hizmeti silmek istediğinizden emin misiniz?'
      )
    ) {
      return;
    }

    deleteService(id).catch((e) => {
      alert(
        e instanceof Error
          ? e.message
          : 'Hizmet silinemedi.'
      );
    });
  };

  const toggle = (id: string) => {
    toggleActive(id).catch((e) => {
      alert(
        e instanceof Error
          ? e.message
          : 'Hizmet durumu değiştirilemedi.'
      );
    });
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1>Hizmet Yönetimi</h1>

          <p
            style={{
              color: '#8b949e',
              marginTop: '6px',
            }}
          >
            Sitede gösterilen hizmetleri yönetin.
          </p>
        </div>

        <button
          className="admin-btn admin-btn-primary"
          onClick={openAdd}
          disabled={loading || saving}
        >
          + Hizmet Ekle
        </button>
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
        <div
          style={{
            padding: '40px',
            textAlign: 'center',
            color: '#8b949e',
          }}
        >
          Hizmetler yükleniyor...
        </div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>İkon</th>
                <th>Hizmet Adı</th>
                <th>Açıklama</th>
                <th>Durum</th>
                <th>İşlemler</th>
              </tr>
            </thead>

            <tbody>
              {services.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="admin-empty">
                      <div className="admin-empty-icon">
                        🎨
                      </div>

                      Henüz hizmet eklenmemiş.
                    </div>
                  </td>
                </tr>
              ) : (
                services.map((service) => (
                  <tr key={service.id}>
                    <td style={{ fontSize: 22 }}>
                      {service.icon}
                    </td>

                    <td style={{ fontWeight: 600 }}>
                      {service.title}
                    </td>

                    <td
                      style={{
                        color: '#8b949e',
                        maxWidth: 320,
                      }}
                    >
                      {service.description}
                    </td>

                    <td>
                      <label className="admin-toggle">
                        <input
                          type="checkbox"
                          checked={service.active}
                          onChange={() =>
                            toggle(service.id)
                          }
                        />

                        <span className="admin-toggle-slider" />
                      </label>
                    </td>

                    <td>
                      <div className="admin-btn-actions">
                        <button
                          className="admin-btn-icon"
                          onClick={() =>
                            openEdit(service)
                          }
                          title="Düzenle"
                        >
                          ✏️
                        </button>

                        <button
                          className="admin-btn-icon danger"
                          onClick={() =>
                            remove(service.id)
                          }
                          title="Sil"
                        >
                          🗑️
                        </button>
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
        <div
          className="admin-modal-overlay"
          onClick={closeModal}
        >
          <div
            className="admin-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="admin-modal-header">
              <h2>
                {modal.editing
                  ? 'Hizmeti Düzenle'
                  : 'Yeni Hizmet Ekle'}
              </h2>

              <button
                className="admin-btn-icon"
                onClick={closeModal}
                disabled={saving}
              >
                ✕
              </button>
            </div>

            {saveError && (
              <div
                style={{
                  background:
                    'rgba(248,81,73,0.12)',
                  border:
                    '1px solid rgba(248,81,73,0.25)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  color: '#f85149',
                  fontSize: '12px',
                  marginBottom: '12px',
                }}
              >
                ⚠️ {saveError}
              </div>
            )}

            <div className="admin-form">
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>İkon (emoji)</label>

                  <input
                    value={form.icon}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        icon: event.target.value,
                      })
                    }
                    placeholder="🎨"
                  />
                </div>

                <div className="admin-form-group">
                  <label>Hizmet Adı *</label>

                  <input
                    value={form.title}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        title: event.target.value,
                      })
                    }
                    placeholder="Örn: Logo Tasarımı"
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label>Açıklama</label>

                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      description:
                        event.target.value,
                    })
                  }
                  placeholder="Hizmet açıklaması..."
                  rows={4}
                />
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Kategori</label>

                  <input
                    value={form.category}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        category:
                          event.target.value,
                      })
                    }
                    placeholder="Tasarım"
                  />
                </div>

                <div className="admin-form-group">
                  <label>Sıra</label>

                  <input
                    type="number"
                    value={form.order}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        order:
                          Number(event.target.value) ||
                          0,
                      })
                    }
                  />
                </div>
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Fiyat</label>

                  <input
                    type="number"
                    value={form.price ?? ''}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        price:
                          event.target.value === ''
                            ? null
                            : Number(
                                event.target.value
                              ),
                      })
                    }
                    placeholder="Teklif alınız için boş bırakın"
                  />
                </div>

                <div className="admin-form-group">
                  <label>Fiyat Tipi</label>

                  <select
                    value={form.price_type}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        price_type:
                          event.target
                            .value as Service['price_type'],
                      })
                    }
                  >
                    <option value="fixed">
                      Sabit Fiyat
                    </option>

                    <option value="quote">
                      Teklif Alınız
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button
                className="admin-btn admin-btn-secondary"
                onClick={closeModal}
                disabled={saving}
              >
                İptal
              </button>

              <button
                className="admin-btn admin-btn-primary"
                onClick={save}
                disabled={saving}
              >
                {saving
                  ? 'Kaydediliyor...'
                  : modal.editing
                  ? 'Güncelle'
                  : 'Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}