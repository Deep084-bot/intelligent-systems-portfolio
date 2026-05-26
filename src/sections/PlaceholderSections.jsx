import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Target, ExternalLink, Calendar, Clock } from 'lucide-react';
import { Section, PageContainer, Stack, Grid, Flex } from '../layout';
import { SectionTitle, StatCard } from '../primitives';
import { FadeIn, ScrollTrigger } from '../animations';
import dsaStatsData from '../data/dsa-stats.json';
import achievementsData from '../data/achievements.json';
import profileData from '../data/profile.json';

const DSA = dsaStatsData.dsa || {};
const ACHIEVEMENTS = achievementsData.achievements || [];
const PROFILE = profileData;

export const DSADashboardSection = () => {
  const categories = DSA.byCategory || [];
  const platforms = DSA.platforms || [];

  const stats = [
    { label: 'Problems Solved', value: String(DSA.totalSolved || 0), icon: Target, trend: `${DSA.byDifficulty?.easy || 0}E · ${DSA.byDifficulty?.medium || 0}M · ${DSA.byDifficulty?.hard || 0}H` },
    { label: 'Current Streak', value: `${DSA.stats?.currentStreak || 0}d`, icon: TrendingUp, trend: `Best: ${DSA.stats?.bestStreak || 0}d` },
    { label: 'Accuracy', value: DSA.stats?.averageAccuracy || '—', icon: BarChart3, trend: 'Average across submissions' },
    { label: 'Total Time', value: DSA.stats?.totalTime || '—', icon: BarChart3, trend: 'Consistent practice' },
  ];

  return (
    <Section id="dsa" className="bg-gradient-dark">
      <PageContainer>
        <Stack gap={12}>
          <FadeIn>
            <SectionTitle
              title="DSA & Problem Solving"
              subtitle={`${DSA.totalSolved || 0} problems solved across ${platforms.map(p => p.name).join(', ').replace(/, ([^,]+)$/, ', and $1')} — built through consistent practice.`}
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
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-neutral-50">Topics Covered</h3>
                <span className="text-xs text-neutral-500">{categories.length} categories</span>
              </div>
              <Stack gap={4}>
                {categories.map((cat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    viewport={{ once: true }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-neutral-300">{cat.name}</span>
                      <span className="text-xs text-neutral-500 font-mono">{cat.count} problems</span>
                    </div>
                    <div className="h-2 bg-neutral-700 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary-500 rounded-full"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${Math.min(100, Math.round((cat.count / (categories[0]?.count || 100)) * 100))}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        viewport={{ once: true }}
                      />
                    </div>
                  </motion.div>
                ))}
              </Stack>
            </div>
          </ScrollTrigger>

          {/* Profile Links */}
          <ScrollTrigger>
            <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-neutral-300 mb-4">Profiles</h3>
              <div className="flex flex-wrap gap-3">
                {platforms.map((p, i) => (
                  <motion.a
                    key={i}
                    href={p.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-2 px-4 py-2 bg-neutral-700 border border-neutral-600 hover:border-accent-500/50 rounded-lg text-sm text-neutral-300 hover:text-accent-300 transition-all"
                  >
                    {p.name}
                    {p.solved > 0 && <span className="text-xs text-neutral-500">({p.solved})</span>}
                    {p.rating > 0 && <span className="text-xs text-neutral-500">Rating: {p.rating}</span>}
                    <ExternalLink size={14} />
                  </motion.a>
                ))}
              </div>
            </div>
          </ScrollTrigger>
        </Stack>
      </PageContainer>
    </Section>
  );
};

import ChatAssistant from '../components/ai/ChatAssistant';
import { useBlogs } from '../hooks/content/useBlogs';

export const AIAssistantSection = () => {
  return (
    <Section id="ai-assistant" className="bg-neutral-900">
      <PageContainer>
        <Stack gap={12}>
          <FadeIn>
            <SectionTitle
              title="AI Assistant"
              subtitle="Ask me about my projects, skills, and learning journey."
            />
          </FadeIn>

          <FadeIn>
            <ChatAssistant />
          </FadeIn>
        </Stack>
      </PageContainer>
    </Section>
  );
};

export const EngineeringNotesSection = () => {
  const { blogs, loading } = useBlogs();
  const notes = blogs.length > 0 ? blogs : [];

  return (
    <Section id="notes" className="bg-neutral-900">
      <PageContainer>
        <Stack gap={12}>
          <FadeIn>
            <SectionTitle
              title="Engineering Journal"
              subtitle="Notes, observations, and lessons learned while building systems and exploring new concepts."
            />
          </FadeIn>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-neutral-500 text-sm">Loading notes...</p>
            </div>
          ) : (
            <Grid cols={3} gap={6}>
              {notes.length === 0 ? (
                <div className="col-span-3 text-center py-12">
                  <p className="text-neutral-500 text-sm">No notes published yet.</p>
                </div>
              ) : (
                notes.map((note, i) => (
                  <ScrollTrigger key={note.slug || i} delay={i * 0.1} variant="fadeUp">
                    <motion.div
                      className="bg-neutral-800 border border-neutral-700 rounded-lg p-6 hover:border-primary-500/50 transition-all group h-full flex flex-col"
                      whileHover={{ y: -4 }}
                    >
                      <div className="space-y-4 flex-1 flex flex-col">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            {note.tags?.slice(0, 1).map((tag, ti) => (
                              <span key={ti} className="text-xs px-2 py-1 bg-primary-500/20 text-primary-300 rounded">
                                {tag}
                              </span>
                            ))}
                            <span className="text-xs text-neutral-600 font-mono ml-auto">learning-log</span>
                          </div>
                          <h3 className="text-lg font-semibold text-neutral-50 group-hover:text-primary-400 transition-colors mb-2">
                            {note.title}
                          </h3>
                          <p className="text-sm text-neutral-400 leading-relaxed">
                            {note.excerpt}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 pt-4 border-t border-neutral-700 text-xs text-neutral-500 mt-auto">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {note.date || ''}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {note.readingTime || '—'} min
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  </ScrollTrigger>
                ))
              )}
            </Grid>
          )}

          <FadeIn delay={0.4}>
            <div className="text-center py-8 px-6 bg-accent-500/10 border border-accent-500/30 rounded-lg">
              <p className="text-accent-300 font-medium mb-2">Learning in Public</p>
              <p className="text-neutral-400 text-sm">
                These are real engineering notes from my learning journey — exploring backend systems, AI, and distributed concepts as I build.
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
              title="GitHub"
              subtitle="Source code for projects and experiments."
            />
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="text-center py-12 px-6 bg-neutral-800/50 border border-neutral-700 rounded-lg">
              <p className="text-neutral-400 mb-4">My projects are hosted on GitHub.</p>
              <a
                href="https://github.com/Deep084-bot"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-700 hover:bg-neutral-600 border border-neutral-600 rounded-lg text-neutral-200 hover:text-white transition-all font-medium"
              >
                github.com/Deep084-bot
                <ExternalLink size={16} />
              </a>
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
