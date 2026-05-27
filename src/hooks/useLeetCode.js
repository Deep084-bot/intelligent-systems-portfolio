import { useState, useEffect } from 'react';
import { getAllStats } from '../services/leetcode';

export function useLeetCode(username) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!username) {
      setLoading(false);
      setError('No username provided');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAllStats(username);
        setStats(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch LeetCode stats');
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [username]);

  return { stats, loading, error };
}

export default useLeetCode;
