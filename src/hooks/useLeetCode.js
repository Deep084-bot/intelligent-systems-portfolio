import { useState, useEffect, useRef } from 'react';

const CACHE_TTL = 60 * 60 * 1000;

function getCacheKey(username) {
  return `leetcode-stats-${username}`;
}

function getCached(username) {
  try {
    const raw = sessionStorage.getItem(getCacheKey(username));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setCached(username, data) {
  try {
    sessionStorage.setItem(
      getCacheKey(username),
      JSON.stringify({ data, ts: Date.now() })
    );
  } catch {}
}

export function useLeetCode(username, retryCount = 0) {
  const [stats, setStats] = useState(() => {
    if (!username) return null;
    const cached = getCached(username);
    return cached ? cached.data : null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasCache = useRef(!!getCached(username));

  useEffect(() => {
    if (!username) {
      setLoading(false);
      setError('No username provided');
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      const cached = getCached(username);
      hasCache.current = !!cached;

      if (cached && Date.now() - cached.ts < CACHE_TTL) {
        if (!cancelled) {
          setStats(cached.data);
          setLoading(false);
          setError(null);
        }
        return;
      }

      if (cached) {
        if (!cancelled) setStats(cached.data);
      } else {
        if (!cancelled) setLoading(true);
      }

      const apiBase = import.meta.env.VITE_API_BASE_URL || '/';
      try {
        const response = await fetch(`${apiBase}api/leetcode/${username}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `HTTP ${response.status}: Failed to fetch LeetCode stats`
          );
        }
        const data = await response.json();

        if (!cancelled) {
          const { stale, error: respError, ...cleanData } = data;
          setStats(cleanData);
          setError(null);
          setLoading(false);
          if (!stale) {
            setCached(username, cleanData);
          }
        }
      } catch (err) {
        if (!cancelled) {
          if (hasCache.current) {
            setLoading(false);
          } else {
            setError(err.message || 'Failed to fetch LeetCode stats');
            setStats(null);
            setLoading(false);
          }
        }
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [username, retryCount]);

  return { stats, loading, error };
}

export default useLeetCode;
