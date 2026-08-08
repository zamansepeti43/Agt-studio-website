import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Job } from '../types/admin';

export function useJobs() {
  const [data, setData] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: jobs, error: err } = await supabase
        .from('jobs')
        .select('*')
        .order('order', { ascending: true });

      if (err) throw err;
      setData((jobs || []) as Job[]);
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

  const create = async (job: Omit<Job, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: newJob, error: err } = await supabase
        .from('jobs')
        .insert([{ ...job }])
        .select()
        .single();

      if (err) throw err;
      setData((prev) => [...prev, newJob as Job]);
      return newJob;
    } catch (e) {
      throw e instanceof Error ? e : new Error('İş eklenemedi');
    }
  };

  const update = async (id: string, updates: Partial<Job>) => {
    try {
      const { data: updated, error: err } = await supabase
        .from('jobs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (err) throw err;
      setData((prev) => prev.map((j) => (j.id === id ? (updated as Job) : j)));
      return updated;
    } catch (e) {
      throw e instanceof Error ? e : new Error('İş güncellenemedi');
    }
  };

  const remove = async (id: string) => {
    try {
      const { error: err } = await supabase.from('jobs').delete().eq('id', id);
      if (err) throw err;
      setData((prev) => prev.filter((j) => j.id !== id));
    } catch (e) {
      throw e instanceof Error ? e : new Error('İş silinemedi');
    }
  };

  const toggleActive = async (id: string) => {
    const item = data.find((j) => j.id === id);
    if (!item) return;
    return update(id, { active: !item.active });
  };

  return { data, loading, error, fetchData, create, update, remove, toggleActive };
}
