/**
 * Hook: useProjects
 * Dynamically loads and caches projects from JSON
 */

import { useState, useEffect } from 'react';
import projectsData from '../../data/projects.json';
import { ContentValidator } from '../../utils/content/contentValidator';

export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);

        // Validate each project
        const validProjects = projectsData.projects.filter(project => {
          const validation = ContentValidator.validateProject(project);
          if (!validation.valid) {
            ContentValidator.logErrors(`Project: ${project.id}`, validation);
          }
          return validation.valid;
        });

        // Sort by priority
        const sorted = validProjects.sort((a, b) => {
          return (a.priority || 999) - (b.priority || 999);
        });

        setProjects(sorted);

        // Extract featured projects
        const featuredProjects = sorted.filter(p => p.featured);
        setFeatured(featuredProjects);

        setError(null);
      } catch (err) {
        console.error('Failed to load projects:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  return {
    projects,
    featured,
    loading,
    error,
    isEmpty: projects.length === 0,
    byTag: (tag) => projects.filter(p => p.tags.includes(tag)),
    byId: (id) => projects.find(p => p.id === id),
  };
}

export default useProjects;
