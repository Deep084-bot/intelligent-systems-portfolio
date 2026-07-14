import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Github, Image as ImageIcon, ChevronRight } from 'lucide-react';
import { formatDate } from '../../utils';

function SectionBlock({ title, children, delay = 0 }) {
  return (
    <motion.div
      className="mb-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + delay * 0.05 }}
    >
      <h2 className="text-xl font-bold text-neutral-100 mb-6 border-b border-neutral-800/50 pb-3 font-mono">
        {title}
      </h2>
      {children}
    </motion.div>
  );
}

function ItemsList({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-neutral-400 text-sm">
          <span className="text-accent-400 mt-0.5 shrink-0">▸</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function MetricsGrid({ metrics }) {
  if (!metrics) return null;
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {Object.entries(metrics).map(([key, value]) => (
        <div key={key} className="bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-4">
          <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-mono mb-1">
            {key.replace(/([A-Z])/g, ' $1').trim()}
          </p>
          <p className="text-lg font-semibold text-neutral-200">{value}</p>
        </div>
      ))}
    </div>
  );
}

export function ProjectDetailView({ project, onClose = () => {} }) {
  const [showArchImage, setShowArchImage] = useState(false);

  const repoName = project.slug || project.id;
  const architectureUrl = project.architectureImage
    ? (project.architectureImage.startsWith('http')
        ? project.architectureImage
        : `https://raw.githubusercontent.com/Deep084-bot/${repoName}/main/${project.architectureImage.replace(/^\//, '')}`)
    : null;

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
          className="bg-neutral-900 min-h-screen"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 30, opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-neutral-900/95 backdrop-blur-sm border-b border-neutral-800/50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-2xl sm:text-3xl font-bold text-neutral-100 mb-2"
                >
                  {project.title}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-sm text-neutral-400"
                >
                  {project.shortDescription}
                </motion.p>
                {/* Meta row */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-3 mt-3 text-[11px] text-neutral-500 font-mono"
                >
                  {project.startDate && (
                    <span>
                      {formatDate(project.startDate)}
                      {project.endDate && ` — ${formatDate(project.endDate)}`}
                    </span>
                  )}
                  {project.language && (
                    <>
                      <span className="text-neutral-700">·</span>
                      <span>{project.language}</span>
                    </>
                  )}
                  {project.stars > 0 && (
                    <>
                      <span className="text-neutral-700">·</span>
                      <span>{project.stars} stars</span>
                    </>
                  )}
                </motion.div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="text-neutral-500 hover:text-neutral-300 transition-colors p-1 shrink-0"
              >
                <X size={24} />
              </motion.button>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            {/* Overview */}
            {project.overview && (project.overview.problem || project.overview.solution) && (
              <SectionBlock title="Overview" delay={0}>
                {project.overview.problem && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-neutral-300 mb-2 font-mono">Problem</h3>
                    <p className="text-sm text-neutral-400 leading-relaxed">{project.overview.problem}</p>
                  </div>
                )}
                {project.overview.solution && (
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-300 mb-2 font-mono">Solution</h3>
                    <p className="text-sm text-neutral-400 leading-relaxed">{project.overview.solution}</p>
                  </div>
                )}
              </SectionBlock>
            )}

            {/* Architecture */}
            {project.details?.architecture && (
              <SectionBlock title="Architecture" delay={1}>
                <p className="text-sm text-neutral-400 leading-relaxed">{project.details.architecture}</p>
                {architectureUrl && (
                  <button
                    onClick={() => setShowArchImage(!showArchImage)}
                    className="mt-4 flex items-center gap-2 text-xs text-accent-400 hover:text-accent-300 font-mono transition"
                  >
                    <ImageIcon size={14} />
                    {showArchImage ? 'Hide' : 'View'} Architecture Diagram
                  </button>
                )}
                {showArchImage && architectureUrl && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4"
                  >
                    <a
                      href={architectureUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={architectureUrl}
                        alt="Architecture diagram"
                        className="w-full rounded-lg border border-neutral-800 cursor-pointer hover:border-accent-400/30 transition"
                        loading="lazy"
                      />
                    </a>
                    <p className="text-[10px] text-neutral-600 mt-1 text-center font-mono">
                      Click to open full size
                    </p>
                  </motion.div>
                )}
              </SectionBlock>
            )}

            {/* Technical Challenges */}
            {project.details?.technicalChallenges?.length > 0 && (
              <SectionBlock title="Technical Challenges" delay={2}>
                <ItemsList items={project.details.technicalChallenges} />
              </SectionBlock>
            )}

            {/* Timeline */}
            {project.timeline?.length > 0 && (
              <SectionBlock title="Timeline" delay={3}>
                <div className="space-y-3">
                  {project.timeline.map((item, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-accent-400/60 mt-1.5" />
                        {i < project.timeline.length - 1 && (
                          <div className="w-px flex-1 bg-neutral-800 mt-1" />
                        )}
                      </div>
                      <div className="text-sm text-neutral-400 pb-3">{item}</div>
                    </div>
                  ))}
                </div>
              </SectionBlock>
            )}

            {/* Metrics */}
            {project.metrics && Object.keys(project.metrics).length > 0 && (
              <SectionBlock title="Metrics" delay={4}>
                <MetricsGrid metrics={project.metrics} />
              </SectionBlock>
            )}

            {/* Learnings */}
            {(project.details?.learnings || project.learning?.length > 0) && (
              <SectionBlock title="Learnings" delay={5}>
                {project.details?.learnings && (
                  <div className="mb-4">
                    <p className="text-sm text-neutral-400 leading-relaxed">{project.details.learnings}</p>
                  </div>
                )}
                {project.learning?.length > 0 && <ItemsList items={project.learning} />}
              </SectionBlock>
            )}

            {/* Future Work */}
            {(project.futureImprovements?.length > 0 || project.futureWork?.length > 0) && (
              <SectionBlock title="Future Work" delay={6}>
                {project.futureImprovements?.length > 0 && (
                  <div className="mb-4">
                    <ItemsList items={project.futureImprovements} />
                  </div>
                )}
                {project.futureWork?.length > 0 && <ItemsList items={project.futureWork} />}
              </SectionBlock>
            )}
          </div>

          {/* Action Links */}
          <div className="sticky bottom-0 bg-neutral-900/95 backdrop-blur-sm border-t border-neutral-800/50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex gap-3">
              {project.links?.github && (
                <a
                  href={project.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm rounded-lg border border-neutral-700 transition font-mono"
                >
                  <Github size={16} />
                  View Source
                </a>
              )}
              {project.links?.demo && (
                <a
                  href={project.links.demo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-accent-500/10 hover:bg-accent-500/20 text-accent-400 text-sm rounded-lg border border-accent-500/30 transition font-mono"
                >
                  <ExternalLink size={16} />
                  Live Demo
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
