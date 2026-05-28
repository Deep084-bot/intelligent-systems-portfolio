import { useState, useEffect } from 'react';

export function useLeetCode(username, retryCount = 0) {
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

        // Use environment variable (defaults to relative path for dev proxy and production)
        const apiBase = import.meta.env.VITE_API_BASE_URL || '/';
        const response = await fetch(`${apiBase}api/leetcode/${username}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch LeetCode stats`);
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('[useLeetCode] Error:', err.message);
        setError(err.message || 'Failed to fetch LeetCode stats');
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [username, retryCount]);

  return { stats, loading, error };
}

export default useLeetCode;

