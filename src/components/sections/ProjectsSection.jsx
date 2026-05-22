/**
 * ProjectsSection Component
 * Dynamically renders featured projects from JSON
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProjects } from '../../hooks/content';
import ProjectCard from '../molecules/ProjectCard';
import ProjectDetailView from '../organisms/ProjectDetailView';

export function ProjectsSection({ className = '' }) {
  const { featured, loading, error } = useProjects();
  const [selectedProject, setSelectedProject] = useState(null);

  if (loading) {
    return (
      <section className={`py-20 ${className}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <p className="text-text-secondary">Loading projects...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={`py-20 ${className}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center text-red-400">
            <p>Error loading projects: {error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`py-20 ${className}`}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">
            Featured Projects
          </h2>
          <p className="text-xl text-text-secondary max-w-3xl">
            Engineering-focused projects showcasing backend systems, distributed computing, and AI integration.
          </p>
        </motion.div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((project, idx) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <ProjectCard
                project={project}
                onClick={() => setSelectedProject(project)}
              />
            </motion.div>
          ))}
        </div>

        {featured.length === 0 && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-text-secondary">No featured projects yet. Check back soon!</p>
          </motion.div>
        )}
      </div>

      {/* Project Detail Modal */}
      {selectedProject && (
        <ProjectDetailView
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </section>
  );
}

export default ProjectsSection;
