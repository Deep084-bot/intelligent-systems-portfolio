import { useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Github, BookOpen } from 'lucide-react';
import { Section, PageContainer, Stack, Grid } from '../layout';
import { SectionTitle, Card } from '../primitives';
import { FadeIn, StaggerContainer, StaggerItem } from '../animations';
import { useProjects } from '../hooks/content/useProjects';

function ImageWithFallback({ src, alt, title }) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  if (failed) return <PlaceholderBlock title={title} />;

  const candidates = [src, src.startsWith('/') ? src.slice(1) : '/' + src, src.replace(/\\/g, '/')];
  const current = candidates[attempt] || src;

  return (
    <motion.img
      src={current}
      alt={alt}
      onError={() => {
        if (attempt < candidates.length - 1) {
          setAttempt(attempt + 1);
        } else {
          setFailed(true);
        }
      }}
      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
    />
  );
}

function PlaceholderBlock({ title }) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-700 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto rounded-lg bg-primary-500/20 border border-primary-500/30 flex items-center justify-center mb-2">
          <BookOpen className="w-6 h-6 text-primary-400" />
        </div>
        <p className="text-xs text-neutral-500 font-mono">{title}</p>
      </div>
    </div>
  );
}

const ProjectCard = ({ project, index }) => {
  const tech = (project.tech || project.tags || []);

  return (
    <StaggerItem direction="up" className="h-full">
      <Card className="group h-full flex flex-col hover:border-accent-500/50 overflow-hidden transition-all duration-300">
        {/* Image Placeholder */}
        <div className="relative h-40 sm:h-48 overflow-hidden rounded-lg mb-4 bg-neutral-700 flex items-center justify-center">
          {project.image ? (
            <ImageWithFallback src={project.image} alt={project.title} title={project.title} />
          ) : (
            <PlaceholderBlock title={project.title} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent opacity-40" />
        </div>

        {/* Content */}
        <Stack gap={3} className="flex-1">
          <h3 className="text-lg sm:text-xl font-bold text-neutral-50 group-hover:text-accent-400 transition-colors">
            {project.title}
          </h3>

          <p className="text-sm sm:text-base text-neutral-400 line-clamp-2">
            {project.shortDescription || project.description || ''}
          </p>

          {/* Architecture */}
          {project.details?.architecture && (
            <div className="py-2 px-3 bg-neutral-700/50 rounded border border-neutral-700 text-xs text-neutral-300">
              <span className="text-accent-400">arch:</span> {project.details.architecture}
            </div>
          )}

          {/* Technical Challenges */}
          {project.details?.technicalChallenges?.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-neutral-500 font-mono">Challenges:</p>
              <ul className="space-y-1">
                {project.details.technicalChallenges.slice(0, 2).map((challenge, i) => (
                  <li key={i} className="text-xs text-neutral-400">→ {challenge}</li>
                ))}
              </ul>
            </div>
          )}

          {/* What I Learned */}
          {project.details?.learnings && (
            <div className="py-2 px-3 bg-accent-500/10 border border-accent-500/30 rounded text-xs text-accent-300">
              learned: {project.details.learnings}
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2 pt-2">
            {tech.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs bg-primary-500/20 text-primary-300 rounded border border-primary-500/30 font-mono"
              >
                {tag}
              </span>
            ))}
          </div>
        </Stack>

        {/* Links */}
        <div className="flex gap-3 pt-4 border-t border-neutral-700 mt-auto">
          {project.links?.github && (
            <motion.a
              href={project.links.github}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1 }}
              className="flex items-center gap-2 text-sm text-neutral-400 hover:text-primary-400 transition-colors"
            >
              <Github size={16} />
              Code
            </motion.a>
          )}
          {project.links?.blog && (
            <motion.a
              href={project.links.blog}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1 }}
              className="flex items-center gap-2 text-sm text-neutral-400 hover:text-accent-400 transition-colors ml-auto"
            >
              <span>Blog</span>
              <BookOpen size={16} />
            </motion.a>
          )}
        </div>
      </Card>
    </StaggerItem>
  );
};

export const ProjectsSection = () => {
  const { projects, loading, error } = useProjects();

  return (
    <Section id="projects" className="bg-neutral-900">
      <PageContainer>
        <Stack gap={12}>
          <FadeIn>
            <SectionTitle
              title="Projects"
              subtitle="Backend systems and applications I've built — real architecture, real challenges, real learning."
            />
          </FadeIn>

          {loading && (
            <p className="text-neutral-400 text-center font-mono text-sm py-12">
              Loading projects...
            </p>
          )}

          {error && (
            <p className="text-red-400 text-center font-mono text-sm py-12">
              Failed to load projects: {error}
            </p>
          )}

          {!loading && !error && (
            <StaggerContainer staggerDelay={0.1}>
              <Grid cols={3} gap={6}>
                {projects.map((project, index) => (
                  <ProjectCard key={project.id || index} project={project} index={index} />
                ))}
              </Grid>
            </StaggerContainer>
          )}
        </Stack>
      </PageContainer>
    </Section>
  );
};

export default ProjectsSection;
