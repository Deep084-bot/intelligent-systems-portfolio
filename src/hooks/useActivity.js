import { useState, useEffect, useCallback } from 'react';
import { fetchActivity } from '../services/activity';

export function useActivity() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchActivity();
      setActivities(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch activity');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { activities, loading, error, refetch: load };
}

export default useActivity;
