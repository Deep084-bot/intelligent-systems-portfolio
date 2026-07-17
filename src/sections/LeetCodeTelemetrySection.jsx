import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Section, PageContainer } from '../layout';
import { SectionTitle } from '../primitives';
import { FadeIn, ScrollTrigger } from '../animations';
import useLeetCode from '../hooks/useLeetCode';
import EngineeringHandbookPreview from '../components/sections/EngineeringHandbookPreview';
import { profileData } from '../data/profileData';

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

export const LeetCodeTelemetrySection = ({ onViewHandbook }) => {
  const [retryCount, setRetryCount] = useState(0);
  const leetcodeProfile = profileData.codingProfiles.find((p) => p.id === 'leetcode');
  const { stats, loading, error } = useLeetCode(leetcodeProfile?.username, retryCount);

  if (!leetcodeProfile) {
    return null;
  }

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const solved = stats?.solved || {};
  const contest = stats?.contest || {};
  const calendar = stats?.calendar || {};
  return (
    <Section id="leetcode" className="bg-neutral-900">
      <PageContainer>
        <div className="space-y-12">
          <FadeIn>
            <SectionTitle
              title="LeetCode Telemetry"
              subtitle="Real-time engineering metrics from competitive programming platform."
            />
          </FadeIn>

          <ScrollTrigger>
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
              <div className="max-w-xl mx-auto p-6 bg-neutral-950 border border-neutral-800 rounded-lg font-mono text-sm">
                <div className="mb-4">
                  <div className="text-accent-400 mb-2">[leetcode.telemetry]</div>
                  <div className="text-neutral-600 text-xs">
                    username: {leetcodeProfile.username}
                  </div>
                </div>
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded text-red-400/80 mb-4">
                  <div className="text-xs mb-2">⚠ Telemetry service unavailable</div>
                  <div className="text-xs text-red-400/60">{error}</div>
                </div>
                <button
                  onClick={handleRetry}
                  disabled={loading}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-accent-400 text-xs rounded font-mono border border-neutral-700 transition"
                >
                  {loading ? 'retrying...' : 'retry'}
                </button>
              </div>
            )}

            {/* Telemetry Dashboard */}
            {!loading && !error && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
                {/* LEFT — Main Terminal Panel — 3/5 */}
                <div className="lg:col-span-3">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-neutral-950 border border-neutral-800 rounded-lg p-6 font-mono text-sm h-full"
                  >
                    <div className="border-b border-neutral-800/50 pb-4 mb-6">
                      <div className="text-accent-400 mb-2">[leetcode.telemetry]</div>
                      <div className="text-neutral-600 text-xs">
                        username: {leetcodeProfile.username}
                      </div>
                    </div>

                    <div className="mb-6 space-y-2">
                      <div className="text-neutral-600 text-xs uppercase tracking-wide mb-3">
                        problems solved
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="border-l-2 border-green-400/30 pl-3">
                          <div className="text-neutral-600 text-xs mb-1">easy</div>
                          <div className="text-green-400 text-lg">
                            <AnimatedCounter value={solved.easy || 0} />
                          </div>
                        </div>
                        <div className="border-l-2 border-amber-400/30 pl-3">
                          <div className="text-neutral-600 text-xs mb-1">medium</div>
                          <div className="text-amber-400 text-lg">
                            <AnimatedCounter value={solved.medium || 0} />
                          </div>
                        </div>
                        <div className="border-l-2 border-red-400/30 pl-3">
                          <div className="text-neutral-600 text-xs mb-1">hard</div>
                          <div className="text-red-400 text-lg">
                            <AnimatedCounter value={solved.hard || 0} />
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 text-neutral-600 text-xs">
                        total: <span className="text-neutral-400"><AnimatedCounter value={solved.total || 0} /></span>
                      </div>
                    </div>

                    {(contest.rating > 0 || contest.globalRank > 0) && (
                      <div className="mb-6 space-y-2 border-t border-neutral-800/30 pt-5">
                        <div className="text-neutral-600 text-xs uppercase tracking-wide mb-3">
                          contest profile
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          {contest.rating > 0 && (
                            <div className="border-l-2 border-cyan-400/30 pl-3">
                              <div className="text-neutral-600 text-xs mb-1">rating</div>
                              <div className="text-cyan-400 text-lg">
                                <AnimatedCounter value={contest.rating} />
                              </div>
                            </div>
                          )}
                          {contest.globalRank > 0 && (
                            <div className="border-l-2 border-primary-400/30 pl-3">
                              <div className="text-neutral-600 text-xs mb-1">global rank</div>
                              <div className="text-primary-400 text-lg">
                                <AnimatedCounter value={contest.globalRank} />
                              </div>
                            </div>
                          )}
                        </div>
                        {contest.contests > 0 && (
                          <div className="mt-2 text-neutral-600 text-xs">
                            contests: <span className="text-neutral-400">{contest.contests}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {calendar.streak > 0 && (
                      <div className="mb-4 space-y-2 border-t border-neutral-800/30 pt-5">
                        <div className="text-neutral-600 text-xs uppercase tracking-wide mb-3">
                          activity
                        </div>
                        <div className="border-l-2 border-accent-400/30 pl-3">
                          <div className="text-neutral-600 text-xs mb-1">current streak</div>
                          <div className="text-accent-400 text-lg">
                            <AnimatedCounter value={calendar.streak} /> days
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="border-t border-neutral-800/50 pt-4 mt-4">
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
                </div>

                {/* RIGHT — Engineering Handbook Preview — 2/5 */}
                <div className="lg:col-span-2">
                  <EngineeringHandbookPreview onViewHandbook={onViewHandbook} />
                </div>
              </div>
            )}
          </ScrollTrigger>
        </div>
      </PageContainer>
    </Section>
  );
};

export default LeetCodeTelemetrySection;
