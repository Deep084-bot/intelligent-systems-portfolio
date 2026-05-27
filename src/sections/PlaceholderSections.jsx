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
      <div className="w-full">
        {/* Section header at normal width */}
        <PageContainer>
          <FadeIn>
            <SectionTitle
              title="AI Assistant"
              subtitle="Ask me about my projects, skills, and learning journey."
            />
          </FadeIn>
        </PageContainer>

        {/* Assistant card at wider width */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-12">
          <FadeIn>
            <ChatAssistant />
          </FadeIn>
        </div>
      </div>
    </Section>
  );
};

export default {
  DSADashboardSection,
  AIAssistantSection,
};
