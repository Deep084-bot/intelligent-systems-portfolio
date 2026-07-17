import { useState, useEffect, useCallback } from 'react';
import { getNotesTree } from '../services/github';

export function useEngineeringNotes() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getNotesTree();
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refetch: load };
}

export default useEngineeringNotes;
