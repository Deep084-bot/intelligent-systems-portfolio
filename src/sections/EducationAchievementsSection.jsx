import { motion } from 'framer-motion';
import { BookOpen, Award, Zap, Target, Server, Brain, ExternalLink, Calendar } from 'lucide-react';
import { Section, PageContainer, Stack, Grid } from '../layout';
import { SectionTitle } from '../primitives';
import { FadeIn, ScrollTrigger, StaggerContainer, StaggerItem } from '../animations';
import { profileData } from '../data/profileData';

const iconMap = {
  target: Target,
  zap: Zap,
  brain: Brain,
  server: Server,
  award: Award,
};

export const EducationAchievementsSection = () => {
  const { education, achievements, certifications, codingProfiles } = profileData;

  return (
    <Section id="education" className="bg-neutral-900">
      <PageContainer>
        <Stack gap={16}>
          <FadeIn>
            <SectionTitle
              title="Education & Achievements"
              subtitle="Academic foundation and professional milestones in engineering and problem-solving."
            />
          </FadeIn>

          {/* Education */}
          <ScrollTrigger>
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-neutral-50">Education</h3>
              <div className="space-y-4">
                {education.map((edu, idx) => (
                  <motion.div
                    key={edu.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    viewport={{ once: true }}
                    className="bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-6 hover:border-neutral-600/50 transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-base font-semibold text-neutral-50">{edu.degree}</h4>
                        <p className="text-sm text-accent-400">{edu.school}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono text-neutral-400">
                          {edu.startYear}–{edu.endYear}
                        </p>
                        <p className="text-xs text-neutral-500">CGPA: {edu.cgpa}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-mono text-neutral-500 uppercase mb-2">Coursework</p>
                        <div className="flex flex-wrap gap-2">
                          {edu.coursework.slice(0, 5).map((course) => (
                            <span
                              key={course}
                              className="text-xs px-2 py-1 bg-neutral-700/50 border border-neutral-600/50 rounded text-neutral-300"
                            >
                              {course}
                            </span>
                          ))}
                          {edu.coursework.length > 5 && (
                            <span className="text-xs px-2 py-1 text-neutral-500">
                              +{edu.coursework.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-mono text-neutral-500 uppercase mb-2">Highlights</p>
                        <ul className="space-y-1">
                          {edu.highlights.map((highlight) => (
                            <li key={highlight} className="text-xs text-neutral-400 flex gap-2">
                              <span className="text-accent-400">→</span>
                              <span>{highlight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </ScrollTrigger>

          {/* Achievements */}
          <ScrollTrigger>
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-neutral-50">Achievements</h3>
              <StaggerContainer staggerDelay={0.1}>
                <Grid cols={2} gap={4} responsive>
                  {achievements.map((achievement) => {
                    const Icon = iconMap[achievement.icon] || Award;
                    return (
                      <StaggerItem key={achievement.id}>
                        <motion.div
                          className="bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-5 hover:border-primary-500/30 transition group"
                          whileHover={{ y: -2 }}
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                              <Icon className="w-5 h-5 text-primary-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-neutral-50 group-hover:text-primary-300 transition">
                                {achievement.title}
                              </h4>
                              <p className="text-xs text-neutral-500 font-mono">{achievement.category}</p>
                            </div>
                          </div>
                          <p className="text-xs text-neutral-400 mb-3 leading-relaxed">
                            {achievement.description}
                          </p>
                          {achievement.stats && (
                            <div className="text-xs font-mono text-neutral-500 space-y-1 mb-2">
                              <div className="flex justify-between">
                                <span>Easy:</span>
                                <span className="text-green-400">{achievement.stats.easy}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Medium:</span>
                                <span className="text-amber-400">{achievement.stats.medium}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Hard:</span>
                                <span className="text-red-400">{achievement.stats.hard}</span>
                              </div>
                            </div>
                          )}
                          {achievement.tech && (
                            <div className="flex flex-wrap gap-1 pt-2 border-t border-neutral-700/30">
                              {achievement.tech.map((t) => (
                                <span
                                  key={t}
                                  className="text-[10px] px-1.5 py-0.5 bg-neutral-700/50 text-neutral-300 rounded"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      </StaggerItem>
                    );
                  })}
                </Grid>
              </StaggerContainer>
            </div>
          </ScrollTrigger>

          {/* Certifications */}
          <ScrollTrigger>
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-neutral-50">Certifications</h3>
              <div className="space-y-3">
                {certifications.map((cert) => (
                  <motion.div
                    key={cert.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-3 p-4 bg-neutral-800/30 border border-neutral-700/30 rounded-lg hover:border-neutral-600/50 transition"
                  >
                    <Award className="w-5 h-5 text-accent-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-neutral-50">{cert.title}</h4>
                      <p className="text-xs text-neutral-500">{cert.issuer}</p>
                      <p className="text-xs text-neutral-400 mt-1">{cert.description}</p>
                    </div>
                    <span className="text-xs text-neutral-500 font-mono flex-shrink-0">{cert.date}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </ScrollTrigger>

          {/* Coding Profiles */}
          <ScrollTrigger>
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-neutral-50">Coding Profiles</h3>
              <Grid cols={2} gap={4} responsive>
                {codingProfiles.map((profile) => (
                  <motion.a
                    key={profile.id}
                    href={profile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ y: -2, borderColor: '#29b6f6' }}
                    className="block p-4 bg-neutral-800/50 border border-neutral-700/50 rounded-lg hover:bg-neutral-800/70 transition"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-semibold text-neutral-50">{profile.platform}</h4>
                      <ExternalLink className="w-4 h-4 text-neutral-500" />
                    </div>
                    <p className="text-xs text-accent-400 font-mono mb-2">{profile.username}</p>
                    {profile.stats && (
                      <div className="text-[11px] text-neutral-400 space-y-0.5 pt-2 border-t border-neutral-700/30">
                        <div className="flex justify-between">
                          <span>Solved:</span>
                          <span className="text-primary-400">{profile.stats.solved}</span>
                        </div>
                        {profile.stats.rating && (
                          <div className="flex justify-between">
                            <span>Rating:</span>
                            <span className="text-primary-400">{profile.stats.rating}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.a>
                ))}
              </Grid>
            </div>
          </ScrollTrigger>
        </Stack>
      </PageContainer>
    </Section>
  );
};

export default EducationAchievementsSection;
