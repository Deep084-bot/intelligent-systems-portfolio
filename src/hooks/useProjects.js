import { useState, useEffect, useCallback } from 'react';
import { fetchProjects } from '../services/projects';
import projectsData from '../data/projects.json';

const LOCAL_PROJECTS = projectsData.projects || [];

export function useProjects() {
  const [projects, setProjects] = useState(LOCAL_PROJECTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const merged = await fetchProjects(LOCAL_PROJECTS);
      setProjects(merged);
    } catch (err) {
      setError(err.message || 'Failed to sync projects');
      setProjects(LOCAL_PROJECTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { projects, loading, error, refetch: load };
}

export default useProjects;
