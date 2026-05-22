/**
 * ProjectDetailView Component
 * Premium engineering-focused project showcase
 * Displays as a detailed case study with sections
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Github, Copy, Check } from 'lucide-react';
import { ContentFormatter } from '../../utils/content';

export function ProjectDetailView({ project, onClose = () => {} }) {
  const [copied, setCopied] = useState(false);
  const status = ContentFormatter.formatStatus(project.status);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sections = [
    {
      id: 'overview',
      title: 'Overview',
      content: project.overview,
    },
    {
      id: 'architecture',
      title: 'Architecture Thinking',
      content: { description: project.details?.architecture },
    },
    {
      id: 'challenges',
      title: 'Technical Challenges',
      content: { items: project.details?.technicalChallenges },
    },
    {
      id: 'scalability',
      title: 'Scalability & Performance',
      content: { description: project.details?.scalability },
    },
    {
      id: 'performance-metrics',
      title: 'Performance Metrics',
      content: project.performance,
    },
    {
      id: 'learnings',
      title: 'Learnings',
      content: { description: project.details?.learnings },
    },
    {
      id: 'future',
      title: 'Future Improvements',
      content: { items: project.futureImprovements },
    },
  ];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-dark-primary min-h-screen relative"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-gradient-to-b from-dark-primary via-dark-primary to-transparent border-b border-dark-secondary/50">
            <div className="max-w-4xl mx-auto px-6 py-8 flex items-start justify-between">
              <div className="flex-1">
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className={`
                    inline-block px-3 py-1 text-sm font-medium rounded-full mb-4
                    ${status.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-300' : 
                      status.color === 'blue' ? 'bg-blue-500/10 text-blue-300' : 
                      'bg-slate-500/10 text-slate-300'}
                  `}
                >
                  {status.label}
                </motion.span>
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-5xl font-bold text-text-primary mb-2"
                >
                  {project.title}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl text-text-secondary"
                >
                  {project.shortDescription}
                </motion.p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                <X size={28} />
              </motion.button>
            </div>

            {/* Meta Info */}
            <div className="max-w-4xl mx-auto px-6 pb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {project.startDate && (
                <div>
                  <p className="text-sm text-text-secondary">Duration</p>
                  <p className="text-text-primary font-medium">
                    {ContentFormatter.formatDate(project.startDate)}
                    {project.endDate && ` - ${ContentFormatter.formatDate(project.endDate)}`}
                  </p>
                </div>
              )}
              {project.tech && (
                <div>
                  <p className="text-sm text-text-secondary">Tech Stack</p>
                  <p className="text-text-primary font-medium">{project.tech.slice(0, 2).join(', ')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Content Sections */}
          <div className="max-w-4xl mx-auto px-6 py-12">
            {sections.map((section, idx) => (
              <motion.div
                key={section.id}
                className="mb-12"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.05 }}
              >
                <h2 className="text-3xl font-bold text-text-primary mb-6 border-b border-dark-secondary/50 pb-4">
                  {section.title}
                </h2>

                {section.content?.problem && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-accent-green mb-3">Problem</h3>
                    <p className="text-text-secondary leading-relaxed">{section.content.problem}</p>
                  </div>
                )}

                {section.content?.solution && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-accent-green mb-3">Solution</h3>
                    <p className="text-text-secondary leading-relaxed">{section.content.solution}</p>
                  </div>
                )}

                {section.content?.description && (
                  <p className="text-text-secondary leading-relaxed mb-6">
                    {section.content.description}
                  </p>
                )}

                {section.content?.items && (
                  <ul className="space-y-3">
                    {section.content.items.map((item, i) => (
                      <motion.li
                        key={i}
                        className="flex gap-3 text-text-secondary"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.1 }}
                      >
                        <span className="text-accent-green mt-1">▸</span>
                        <span>{item}</span>
                      </motion.li>
                    ))}
                  </ul>
                )}

                {section.content && typeof section.content === 'object' && 
                 !section.content.problem && !section.content.solution && 
                 !section.content.description && !section.content.items && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(section.content).map(([key, value]) => (
                      <div key={key} className="bg-dark-secondary rounded-lg p-4">
                        <p className="text-sm text-text-secondary mb-1 capitalize">
                          {key.replace(/([A-Z])/g, ' $1')}
                        </p>
                        <p className="text-lg font-semibold text-text-primary">{value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Action Links */}
          <div className="sticky bottom-0 bg-gradient-to-t from-dark-primary via-dark-primary to-transparent border-t border-dark-secondary/50">
            <div className="max-w-4xl mx-auto px-6 py-8 flex gap-4 flex-wrap">
              {project.links?.github && (
                <a
                  href={project.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 bg-accent-green/10 border border-accent-green/50 text-accent-green rounded-lg hover:bg-accent-green/20 transition-colors"
                >
                  <Github size={20} />
                  View Source
                </a>
              )}
              {project.links?.demo && (
                <a
                  href={project.links.demo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 bg-accent-purple/10 border border-accent-purple/50 text-accent-purple rounded-lg hover:bg-accent-purple/20 transition-colors"
                >
                  <ExternalLink size={20} />
                  View Demo
                </a>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ProjectDetailView;
