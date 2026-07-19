import { useState, useEffect, useCallback } from 'react';
import { getProjects } from '../../services/projects';

export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadProjects = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await getProjects();

        if (cancelled) return;

        const sorted = [...data].sort((a, b) =>
          (a.priority || 999) - (b.priority || 999)
        );

        setProjects(sorted);
        setFeatured(sorted.filter(p => p.featured));
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load projects:', err);
          setError(err.message);
          setProjects([]);
          setFeatured([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProjects();

    return () => { cancelled = true; };
  }, []);

  const byTag = useCallback((tag) =>
    projects.filter(p => p.tags?.includes(tag)),
    [projects],
  );

  const byId = useCallback((id) =>
    projects.find(p => p.id === id) || null,
    [projects],
  );

  return {
    projects,
    featured,
    loading,
    error,
    isEmpty: projects.length === 0,
    byTag,
    byId,
  };
}

export default useProjects;
