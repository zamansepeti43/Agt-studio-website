import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export type ProjectRequest = {
  id: string;
  name: string;
  company: string | null;
  phone: string;
  email: string | null;
  service: string;
  budget: string | null;
  message: string;
  status: 'new' | 'contacted' | 'quoted' | 'won' | 'lost';
  created_at: string;
};

export function useProjectRequests() {
  const [data, setData] = useState<ProjectRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: requests, error: err } = await supabase
        .from('project_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (err) throw err;
      setData((requests || []) as ProjectRequest[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Talepler yüklenemedi');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const updateStatus = async (id: string, status: ProjectRequest['status']) => {
    const { data: updated, error: err } = await supabase
      .from('project_requests')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (err) throw err;
    setData((prev) => prev.map((item) => item.id === id ? updated as ProjectRequest : item));
  };

  return { data, loading, error, fetchData, updateStatus };
}
