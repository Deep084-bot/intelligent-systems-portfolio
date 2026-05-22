import { motion } from 'framer-motion';
import { ExternalLink, Github } from 'lucide-react';
import { Section, PageContainer, Stack, Grid } from '../layout';
import { SectionTitle, Card } from '../primitives';
import { FadeIn, StaggerContainer, StaggerItem } from '../animations';

// Mock project data - this will eventually load from JSON/API
const MOCK_PROJECTS = [
  {
    id: 1,
    title: 'AI Content Generation Engine',
    description:
      'Scalable backend system for AI-powered content generation using Gemini API and vector embeddings for context retrieval.',
    tags: ['Node.js', 'Gemini API', 'Vector DB', 'RAG'],
    architecture: 'Microservices with queue-based processing',
    keyFeatures: [
      'Real-time content streaming',
      'Context-aware generation',
      'Rate limiting & caching',
    ],
    impact: 'Processes 10k+ requests/day with 99.9% uptime',
    links: {
      github: 'https://github.com',
      live: 'https://example.com',
    },
    image: 'https://images.unsplash.com/photo-1677442d019cecf8e6c9f2c1e87b0eb4550437c1?w=600&h=400&fit=crop',
  },
  {
    id: 2,
    title: 'Real-time Collaboration Platform',
    description:
      'WebSocket-based real-time chat and data synchronization system with conflict resolution and offline support.',
    tags: ['React', 'WebSockets', 'Express', 'Redis'],
    architecture:
      'Event-driven with Redis pub/sub messaging',
    keyFeatures: [
      'Real-time sync across clients',
      'Offline-first architecture',
      'Message encryption',
    ],
    impact: 'Sub-100ms latency for 1000+ concurrent users',
    links: {
      github: 'https://github.com',
      live: 'https://example.com',
    },
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop',
  },
  {
    id: 3,
    title: 'Distributed Task Queue System',
    description:
      'High-performance job queue for background processing with retry logic, scheduling, and monitoring capabilities.',
    tags: ['Node.js', 'Redis', 'Bull', 'Docker'],
    architecture: 'Producer-consumer pattern with Redis backend',
    keyFeatures: [
      'Fault tolerance',
      'Automated retries',
      'Real-time monitoring',
    ],
    impact: 'Handles 100k+ jobs/day across distributed workers',
    links: {
      github: 'https://github.com',
      live: 'https://example.com',
    },
    image: 'https://images.unsplash.com/photo-1633356122544-f134ef2944f5?w=600&h=400&fit=crop',
  },
];

const ProjectCard = ({ project, index }) => {
  return (
    <StaggerItem
      direction="up"
      className="h-full"
    >
      <Card
        className="group h-full flex flex-col hover:border-accent-500/50 overflow-hidden transition-all duration-300"
      >
        {/* Image Container */}
        <div className="relative h-40 sm:h-48 overflow-hidden rounded-lg mb-4 bg-neutral-700">
          <motion.img
            src={project.image}
            alt={project.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent opacity-40" />
        </div>

        {/* Content */}
        <Stack gap={3} className="flex-1">
          {/* Title */}
          <h3 className="text-lg sm:text-xl font-bold text-neutral-50 group-hover:text-accent-400 transition-colors">
            {project.title}
          </h3>

          {/* Description */}
          <p className="text-sm sm:text-base text-neutral-400 line-clamp-2">
            {project.description}
          </p>

          {/* Architecture */}
          <div className="py-2 px-3 bg-neutral-700/50 rounded border border-neutral-700 text-xs text-neutral-300">
            <span className="text-accent-400">arch:</span> {project.architecture}
          </div>

          {/* Key Features */}
          <div className="space-y-1">
            <p className="text-xs text-neutral-500 font-mono">Features:</p>
            <ul className="space-y-1">
              {project.keyFeatures.slice(0, 2).map((feature, i) => (
                <li key={i} className="text-xs text-neutral-400">
                  ✓ {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Impact */}
          <div className="py-2 px-3 bg-success/10 border border-success/30 rounded text-xs text-success">
            📊 {project.impact}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 pt-2">
            {project.tags.map((tag) => (
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
          {project.links.live && (
            <motion.a
              href={project.links.live}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1 }}
              className="flex items-center gap-2 text-sm text-neutral-400 hover:text-accent-400 transition-colors ml-auto"
            >
              <span>Live</span>
              <ExternalLink size={16} />
            </motion.a>
          )}
        </div>
      </Card>
    </StaggerItem>
  );
};

export const ProjectsSection = () => {
  return (
    <Section id="projects" className="bg-neutral-900">
      <PageContainer>
        <Stack gap={12}>
          <FadeIn>
            <SectionTitle
              title="Featured Projects"
              subtitle="Engineering-focused systems and applications showcasing system design thinking"
            />
          </FadeIn>

          {/* Projects Grid */}
          <StaggerContainer staggerDelay={0.1}>
            <Grid cols={3} gap={6}>
              {MOCK_PROJECTS.map((project, index) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  index={index}
                />
              ))}
            </Grid>
          </StaggerContainer>

          {/* View All CTA */}
          <FadeIn delay={0.4}>
            <div className="text-center pt-4">
              <a
                href="#"
                className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-neutral-600 rounded-lg text-neutral-300 hover:text-neutral-100 transition-all font-medium"
              >
                View All Projects
                <ExternalLink size={16} />
              </a>
            </div>
          </FadeIn>
        </Stack>
      </PageContainer>
    </Section>
  );
};

export default ProjectsSection;
