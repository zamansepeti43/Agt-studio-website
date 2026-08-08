import { useState } from 'react';
import { DEFAULT_SITE_SETTINGS } from '../data/defaults';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { SiteSettings } from '../types/admin';

export default function SiteSettings() {
  const [settings, setSettings] = useLocalStorage<SiteSettings>('agt_settings', DEFAULT_SITE_SETTINGS);
  const [form, setForm] = useState<SiteSettings>(settings);
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const reset = () => {
    setForm(DEFAULT_SITE_SETTINGS);
    setSettings(DEFAULT_SITE_SETTINGS);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const field = (key: keyof SiteSettings) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header-row">
          <div>
            <h1>Site Ayarları</h1>
            <p>Genel site bilgilerini düzenleyin.</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={reset}>
              Sıfırla
            </button>
            <button className="admin-btn admin-btn-primary" onClick={save}>
              {saved ? '✓ Kaydedildi' : 'Kaydet'}
            </button>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <span className="admin-card-title">Genel Bilgiler</span>
        </div>
        <div className="admin-form">
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>Site Adı</label>
              <input {...field('siteName')} placeholder="AGT Studio" />
            </div>
            <div className="admin-form-group">
              <label>Slogan</label>
              <input {...field('tagline')} placeholder="Dijital Tasarım ve Yapay Zekâ Çözümleri" />
            </div>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <span className="admin-card-title">İletişim Bilgileri</span>
        </div>
        <div className="admin-form">
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>E-posta</label>
              <input {...field('email')} placeholder="agtstudyo@gmail.com" type="email" />
            </div>
            <div className="admin-form-group">
              <label>Telefon</label>
              <input {...field('phone')} placeholder="0534 376 73 08" />
            </div>
          </div>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>WhatsApp (uluslararası format)</label>
              <input {...field('whatsapp')} placeholder="905343767308" />
            </div>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <span className="admin-card-title">Sosyal Medya</span>
        </div>
        <div className="admin-form">
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>Instagram</label>
              <input {...field('instagram')} placeholder="@agtstudio.tr" />
            </div>
            <div className="admin-form-group">
              <label>TikTok</label>
              <input {...field('tiktok')} placeholder="@agtstudio.tr" />
            </div>
          </div>
        </div>
      </div>

      {saved && (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(63,185,80,0.12)',
            border: '1px solid rgba(63,185,80,0.25)',
            borderRadius: 10,
            color: '#3fb950',
            fontSize: 13,
          }}
        >
          ✓ Değişiklikler localStorage'a kaydedildi.
        </div>
      )}
    </>
  );
}
