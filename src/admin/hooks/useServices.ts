import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Service } from '../types/admin';

export function useServices() {
  const [data, setData] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: services, error: err } = await supabase
        .from('services')
        .select('*')
        .order('order', { ascending: true });

      if (err) throw err;
      setData((services || []) as Service[]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Veriler yüklenemedi';
      setError(msg);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const create = async (service: Omit<Service, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: newService, error: err } = await supabase
        .from('services')
        .insert([{ ...service }])
        .select()
        .single();

      if (err) throw err;
      setData((prev) => [...prev, newService as Service]);
      return newService;
    } catch (e) {
      throw e instanceof Error ? e : new Error('Hizmet eklenemedi');
    }
  };

  const update = async (id: string, updates: Partial<Service>) => {
    try {
      const { data: updated, error: err } = await supabase
        .from('services')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (err) throw err;
      setData((prev) => prev.map((s) => (s.id === id ? (updated as Service) : s)));
      return updated;
    } catch (e) {
      throw e instanceof Error ? e : new Error('Hizmet güncellenemedi');
    }
  };

  const remove = async (id: string) => {
    try {
      const { error: err } = await supabase.from('services').delete().eq('id', id);
      if (err) throw err;
      setData((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      throw e instanceof Error ? e : new Error('Hizmet silinemedi');
    }
  };

  const toggleActive = async (id: string) => {
    const item = data.find((s) => s.id === id);
    if (!item) return;
    return update(id, { active: !item.active });
  };

  return { data, loading, error, fetchData, create, update, remove, toggleActive };
}
