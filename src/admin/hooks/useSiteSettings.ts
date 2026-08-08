import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { SiteSettings } from '../types/admin';

export function useSiteSettings() {
  const [data, setData] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: settings, error: err } = await supabase
        .from('site_settings')
        .select('*')
        .single();

      if (err) throw err;

      // snake_case → camelCase compat
      setData({
        id: settings.id,
        site_name: settings.site_name,
        tagline: settings.tagline,
        phone: settings.phone,
        email: settings.email,
        instagram: settings.instagram,
        tiktok: settings.tiktok,
        whatsapp: settings.whatsapp,
        siteName: settings.site_name,
      } as SiteSettings);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Veriler yüklenemedi';
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const update = async (updates: Partial<SiteSettings>) => {
    try {
      // camelCase → snake_case
      const dbUpdates: any = {};
      if ('site_name' in updates) dbUpdates.site_name = updates.site_name;
      if ('siteName' in updates) dbUpdates.site_name = updates.siteName;
      if ('tagline' in updates) dbUpdates.tagline = updates.tagline;
      if ('phone' in updates) dbUpdates.phone = updates.phone;
      if ('email' in updates) dbUpdates.email = updates.email;
      if ('instagram' in updates) dbUpdates.instagram = updates.instagram;
      if ('tiktok' in updates) dbUpdates.tiktok = updates.tiktok;
      if ('whatsapp' in updates) dbUpdates.whatsapp = updates.whatsapp;

      const { data: updated, error: err } = await supabase
        .from('site_settings')
        .update(dbUpdates)
        .select()
        .single();

      if (err) throw err;

      const result = {
        id: updated.id,
        site_name: updated.site_name,
        tagline: updated.tagline,
        phone: updated.phone,
        email: updated.email,
        instagram: updated.instagram,
        tiktok: updated.tiktok,
        whatsapp: updated.whatsapp,
        siteName: updated.site_name,
      } as SiteSettings;

      setData(result);
      return result;
    } catch (e) {
      throw e instanceof Error ? e : new Error('Ayarlar güncellenemedi');
    }
  };

  return { data, loading, error, fetchData, update };
}
