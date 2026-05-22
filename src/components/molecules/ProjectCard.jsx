/**
 * ProjectCard Component
 * Displays a project summary card with dynamic data
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ContentFormatter } from '../../utils/content';
import { ExternalLink, Github, ArrowRight } from 'lucide-react';

export function ProjectCard({ 
  project, 
  onClick = () => {}, 
  className = '' 
}) {
  const status = ContentFormatter.formatStatus(project.status);
  const formattedTags = ContentFormatter.formatTags(project.tags);

  return (
    <motion.div
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      className={`group relative bg-dark-secondary border border-dark-secondary/50 rounded-xl p-6 cursor-pointer transition-all hover:border-accent-green/30 hover:shadow-lg hover:shadow-accent-green/10 ${className}`}
      onClick={onClick}
    >
      {/* Status Badge */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <span className={`
          px-3 py-1 text-sm font-medium rounded-full
          ${status.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-300' : 
            status.color === 'blue' ? 'bg-blue-500/10 text-blue-300' : 
            'bg-slate-500/10 text-slate-300'}
        `}>
          {status.label}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-2xl font-bold text-text-primary mb-2 group-hover:text-accent-green transition-colors">
        {project.title}
      </h3>

      {/* Description */}
      <p className="text-text-secondary mb-4 line-clamp-2">
        {project.shortDescription}
      </p>

      {/* Tech Stack */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {project.tech.slice(0, 4).map((tech, idx) => (
            <span 
              key={idx}
              className="px-2 py-1 text-xs font-medium bg-accent-purple/10 text-accent-purple rounded"
            >
              {tech}
            </span>
          ))}
          {project.tech.length > 4 && (
            <span className="px-2 py-1 text-xs text-text-secondary">
              +{project.tech.length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="mb-4 flex flex-wrap gap-1">
        {formattedTags.slice(0, 3).map((tag, idx) => (
          <span 
            key={idx}
            className="text-xs px-2 py-1 rounded-full bg-dark-primary/50 text-text-secondary"
          >
            #{tag.name}
          </span>
        ))}
      </div>

      {/* Links */}
      <div className="flex gap-3 mb-4">
        {project.links?.github && (
          <a
            href={project.links.github}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-text-secondary hover:text-accent-green transition-colors"
            title="View on GitHub"
          >
            <Github size={18} />
          </a>
        )}
        {project.links?.demo && (
          <a
            href={project.links.demo}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-text-secondary hover:text-accent-green transition-colors"
            title="View Demo"
          >
            <ExternalLink size={18} />
          </a>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-text-secondary border-t border-dark-primary pt-4">
        <span>{project.startDate && ContentFormatter.formatDate(project.startDate)}</span>
        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
      </div>
    </motion.div>
  );
}

export default ProjectCard;
