import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Target } from 'lucide-react';
import { Section, PageContainer, Stack, Grid, Flex } from '../layout';
import { SectionTitle, StatCard, ProgressBar } from '../primitives';
import { FadeIn, ScrollTrigger } from '../animations';

export const DSADashboardSection = () => {
  const stats = [
    { label: 'Problems Solved', value: '450+', icon: Target, trend: '+45 this month' },
    { label: 'Easy', value: '180', icon: BarChart3, trend: '42% complete' },
    { label: 'Medium', value: '200', icon: BarChart3, trend: '50% complete' },
    { label: 'Hard', value: '70', icon: BarChart3, trend: '25% complete' },
  ];

  const categories = [
    { name: 'Arrays & Strings', progress: 88, count: '42/50' },
    { name: 'Trees & Graphs', progress: 76, count: '38/50' },
    { name: 'Dynamic Programming', progress: 65, count: '26/40' },
    { name: 'Linked Lists', progress: 92, count: '23/25' },
  ];

  return (
    <Section id="dsa" className="bg-gradient-dark">
      <PageContainer>
        <Stack gap={12}>
          <FadeIn>
            <SectionTitle
              title="DSA & Problem Solving"
              subtitle="Consistent practice and progression through algorithmic challenges"
            />
          </FadeIn>

          {/* Stats Grid */}
          <Grid cols={4} gap={4}>
            {stats.map((stat, i) => (
              <ScrollTrigger key={i} delay={i * 0.1}>
                <StatCard {...stat} />
              </ScrollTrigger>
            ))}
          </Grid>

          {/* Category Breakdown */}
          <ScrollTrigger>
            <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6 md:p-8">
              <h3 className="text-lg font-bold text-neutral-50 mb-6">Category Progress</h3>
              <Stack gap={6}>
                {categories.map((category, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <ProgressBar
                      label={`${category.name} · ${category.count}`}
                      value={category.progress}
                      max={100}
                    />
                  </motion.div>
                ))}
              </Stack>
            </div>
          </ScrollTrigger>

          {/* Placeholder Message */}
          <FadeIn delay={0.4}>
            <div className="text-center py-8 px-6 bg-neutral-800/50 border border-neutral-700 rounded-lg">
              <p className="text-neutral-400">
                Full DSA analytics, leetcode integration, and problem-solving insights coming in PHASE 2
              </p>
            </div>
          </FadeIn>
        </Stack>
      </PageContainer>
    </Section>
  );
};

import AIConsole from '../components/ai/AIConsole';

export const AIAssistantSection = () => {
  return (
    <Section id="ai-assistant" className="bg-neutral-900">
      <PageContainer>
        <Stack gap={12}>
          <FadeIn>
            <SectionTitle
              title="AI Assistant"
              subtitle="Chat-based assistant to learn about my projects, skills, and experience"
            />
          </FadeIn>

          <FadeIn>
            <AIConsole />
          </FadeIn>

        </Stack>
      </PageContainer>
    </Section>
  );
};

export const EngineeringNotesSection = () => {
  const mockNotes = [
    {
      title: 'Understanding Consistent Hashing',
      category: 'Systems Design',
      date: 'May 2024',
      excerpt: 'Deep dive into how consistent hashing enables horizontal scaling in distributed systems...',
      readTime: '8 min',
    },
    {
      title: 'LLM Prompt Engineering Patterns',
      category: 'AI/ML',
      date: 'April 2024',
      excerpt: 'Effective patterns for crafting prompts that yield reliable, high-quality responses from large language models...',
      readTime: '12 min',
    },
    {
      title: 'Building Resilient APIs',
      category: 'Backend',
      date: 'March 2024',
      excerpt: 'Best practices for designing APIs that gracefully handle failures and edge cases...',
      readTime: '10 min',
    },
  ];

  return (
    <Section id="notes" className="bg-neutral-900">
      <PageContainer>
        <Stack gap={12}>
          <FadeIn>
            <SectionTitle
              title="Engineering Journal"
              subtitle="Technical notes, insights, and learnings from building systems"
            />
          </FadeIn>

          {/* Notes Grid */}
          <Grid cols={3} gap={6}>
            {mockNotes.map((note, i) => (
              <ScrollTrigger key={i} delay={i * 0.1} variant="fadeUp">
                <motion.div
                  className="bg-neutral-800 border border-neutral-700 rounded-lg p-6 hover:border-primary-500/50 transition-all cursor-pointer group"
                  whileHover={{ y: -4 }}
                >
                  <div className="space-y-4 h-full flex flex-col">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-1 bg-primary-500/20 text-primary-300 rounded">
                          {note.category}
                        </span>
                        <span className="text-xs text-neutral-500">{note.date}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-neutral-50 group-hover:text-primary-400 transition-colors mb-2">
                        {note.title}
                      </h3>
                      <p className="text-sm text-neutral-400">{note.excerpt}</p>
                    </div>
                    <div className="pt-4 border-t border-neutral-700 text-xs text-neutral-500">
                      {note.readTime} read
                    </div>
                  </div>
                </motion.div>
              </ScrollTrigger>
            ))}
          </Grid>

          {/* Placeholder Message */}
          <FadeIn delay={0.4}>
            <div className="text-center py-8 px-6 bg-accent-500/10 border border-accent-500/30 rounded-lg">
              <p className="text-accent-300 font-medium mb-2">Markdown-Based Engineering Journal</p>
              <p className="text-neutral-400 text-sm">
                Full blog support with markdown rendering, syntax highlighting, and dynamic content loading
              </p>
            </div>
          </FadeIn>
        </Stack>
      </PageContainer>
    </Section>
  );
};

export const GitHubIntelligenceSection = () => {
  return (
    <Section id="github" className="bg-gradient-dark">
      <PageContainer>
        <Stack gap={12}>
          <FadeIn>
            <SectionTitle
              title="GitHub Intelligence"
              subtitle="Repository insights, contribution patterns, and coding statistics"
            />
          </FadeIn>

          {/* Placeholder Stats Grid */}
          <Grid cols={4} gap={4}>
            {[
              { label: 'Public Repos', value: '12' },
              { label: 'Total Stars', value: '245' },
              { label: 'Contributions', value: '1.2k' },
              { label: 'Streak', value: '89 days' },
            ].map((stat, i) => (
              <ScrollTrigger key={i} delay={i * 0.1} variant="scaleUp">
                <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6 text-center">
                  <p className="text-3xl font-bold text-primary-400 mb-2">{stat.value}</p>
                  <p className="text-sm text-neutral-400">{stat.label}</p>
                </div>
              </ScrollTrigger>
            ))}
          </Grid>

          {/* Placeholder Message */}
          <FadeIn delay={0.4}>
            <div className="text-center py-8 px-6 bg-neutral-800/50 border border-neutral-700 rounded-lg">
              <p className="text-neutral-400">
                Real-time GitHub API integration showing repositories, contributions, and coding statistics coming in PHASE 2
              </p>
            </div>
          </FadeIn>
        </Stack>
      </PageContainer>
    </Section>
  );
};

export default {
  DSADashboardSection,
  AIAssistantSection,
  EngineeringNotesSection,
  GitHubIntelligenceSection,
};
