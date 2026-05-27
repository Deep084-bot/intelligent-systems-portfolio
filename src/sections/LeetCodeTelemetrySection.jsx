import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Section, PageContainer, Stack } from '../layout';
import { SectionTitle } from '../primitives';
import { FadeIn, ScrollTrigger } from '../animations';
import useLeetCode from '../hooks/useLeetCode';
import { profileData } from '../data/profileData';

// Animated counter component
function AnimatedCounter({ value, duration = 1000 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime = null;
    let animationId = null;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setCount(Math.floor(value * progress));

      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [value, duration]);

  return <span>{count.toLocaleString()}</span>;
}

export const LeetCodeTelemetrySection = () => {
  const leetcodeProfile = profileData.codingProfiles.find((p) => p.id === 'leetcode');
  const { stats, loading, error } = useLeetCode(leetcodeProfile?.username);

  if (!leetcodeProfile) {
    return null;
  }

  const solved = stats?.solved || {};
  const contest = stats?.contest || {};
  const calendar = stats?.calendar || {};

  return (
    <Section id="leetcode" className="bg-neutral-900">
      <PageContainer>
        <Stack gap={12}>
          <FadeIn>
            <SectionTitle
              title="LeetCode Telemetry"
              subtitle="Real-time engineering metrics from competitive programming platform."
            />
          </FadeIn>

          <ScrollTrigger>
            <div className="w-full max-w-4xl mx-auto">
              {/* Loading state */}
              {loading && (
                <div className="text-center py-12">
                  <div className="inline-block">
                    <div className="w-8 h-8 border-2 border-neutral-700 border-t-primary-400 rounded-full animate-spin" />
                  </div>
                  <p className="text-neutral-500 text-sm mt-4 font-mono">
                    fetching telemetry data...
                  </p>
                </div>
              )}

              {/* Error state */}
              {error && (
                <div className="p-4 bg-error/10 border border-error/30 rounded-lg text-sm text-error font-mono">
                  ⚠ Failed to load LeetCode stats: {error}
                </div>
              )}

              {/* Telemetry dashboard */}
              {!loading && !error && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-neutral-950 border border-neutral-800 rounded-lg p-8 font-mono text-sm"
                >
                  {/* Header */}
                  <div className="border-b border-neutral-800/50 pb-4 mb-6">
                    <div className="text-accent-400 mb-2">[leetcode.engine]</div>
                    <div className="text-neutral-600 text-xs">
                      username: {leetcodeProfile.username}
                    </div>
                  </div>

                  {/* Solved stats */}
                  <div className="mb-8 space-y-2">
                    <div className="text-neutral-600 text-xs uppercase tracking-wide mb-3">
                      solved breakdown
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                      <div className="border-l-2 border-green-400/30 pl-4">
                        <div className="text-neutral-600 text-xs mb-1">easy.solve_rate</div>
                        <div className="text-green-400 text-lg">
                          <AnimatedCounter value={solved.easy || 0} />
                        </div>
                      </div>
                      <div className="border-l-2 border-amber-400/30 pl-4">
                        <div className="text-neutral-600 text-xs mb-1">medium.solve_rate</div>
                        <div className="text-amber-400 text-lg">
                          <AnimatedCounter value={solved.medium || 0} />
                        </div>
                      </div>
                      <div className="border-l-2 border-red-400/30 pl-4">
                        <div className="text-neutral-600 text-xs mb-1">hard.solve_rate</div>
                        <div className="text-red-400 text-lg">
                          <AnimatedCounter value={solved.hard || 0} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contest stats */}
                  {contest && (
                    <div className="mb-8 space-y-2 border-t border-neutral-800/30 pt-6">
                      <div className="text-neutral-600 text-xs uppercase tracking-wide mb-3">
                        contest profile
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                        <div className="border-l-2 border-cyan-400/30 pl-4">
                          <div className="text-neutral-600 text-xs mb-1">contest.rating</div>
                          <div className="text-cyan-400 text-lg">
                            <AnimatedCounter value={contest.contestRating || 0} />
                          </div>
                        </div>
                        <div className="border-l-2 border-primary-400/30 pl-4">
                          <div className="text-neutral-600 text-xs mb-1">global.rank</div>
                          <div className="text-primary-400 text-lg">
                            {contest.globalRanking ? (
                              <>
                                <AnimatedCounter value={contest.globalRanking} />
                              </>
                            ) : (
                              <span className="text-neutral-600">—</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Streak stats */}
                  {calendar && (
                    <div className="mb-8 space-y-2 border-t border-neutral-800/30 pt-6">
                      <div className="text-neutral-600 text-xs uppercase tracking-wide mb-3">
                        activity streak
                      </div>
                      <div className="border-l-2 border-accent-400/30 pl-4">
                        <div className="text-neutral-600 text-xs mb-1">active.streak</div>
                        <div className="text-accent-400 text-lg">
                          <AnimatedCounter value={calendar.activeYears || 0} /> years
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  <div className="border-t border-neutral-800/50 pt-4 mt-6">
                    <div className="text-neutral-600 text-xs">
                      → profile:{' '}
                      <a
                        href={leetcodeProfile.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent-400 hover:text-accent-300 transition"
                      >
                        {leetcodeProfile.url}
                      </a>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollTrigger>
        </Stack>
      </PageContainer>
    </Section>
  );
};

export default LeetCodeTelemetrySection;
