import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Award, Zap, Target, Server, Brain, ExternalLink, X, Image } from 'lucide-react';
import { Section, PageContainer } from '../layout';
import { SectionTitle } from '../primitives';
import { FadeIn, ScrollTrigger } from '../animations';
import { profileData } from '../data/profileData';

const iconMap = {
  target: Target,
  zap: Zap,
  brain: Brain,
  server: Server,
  award: Award,
};

function CertificateModal({ cert, onClose }) {
  if (!cert) return null;
  const imgPath = `/images/certificates/${cert.id}.png`;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-neutral-950/90 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative max-w-3xl w-full bg-neutral-900 border border-neutral-700 rounded-xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-700">
          <div>
            <h3 className="text-base font-semibold text-neutral-50">{cert.title}</h3>
            <p className="text-xs text-neutral-400 font-mono">{cert.issuer}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 flex items-center justify-center bg-neutral-950/50 min-h-[200px]">
          <img
            src={imgPath}
            alt={cert.title}
            loading="lazy"
            className="max-w-full max-h-[65vh] rounded-lg object-contain"
            onError={(e) => {
              e.target.style.display = 'none';
              const fallback = e.target.parentElement.querySelector('.cert-fallback');
              if (fallback) fallback.classList.remove('hidden');
            }}
          />
          <div className="cert-fallback hidden flex-col items-center justify-center gap-3 text-neutral-500 py-16">
            <Image className="w-12 h-12" />
            <p className="text-sm font-mono">Certificate preview not available</p>
            {(cert.credentialUrl && cert.credentialUrl !== '#') ? (
              <a
                href={cert.credentialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-xs text-accent-400 border border-neutral-700 transition"
              >
                <ExternalLink className="w-4 h-4" />
                View on {cert.issuer}
              </a>
            ) : (
              <p className="text-xs text-neutral-600">No external link available</p>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export const EducationAchievementsSection = () => {
  const { education, achievements, certifications, codingProfiles } = profileData;
  const [selectedCert, setSelectedCert] = useState(null);

  const totalSolved = 741;
  const contestRating = 1679;
  const streak = 45;
  const totalPlatforms = codingProfiles.length;

  return (
    <Section id="education" className="bg-neutral-900">
      <PageContainer>
        <div className="space-y-16">
          <FadeIn>
            <SectionTitle
              title="Education & Achievements"
              subtitle="Academic foundation and professional milestones in engineering and problem-solving."
            />
          </FadeIn>

          {/* Two-Column Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10">
            {/* LEFT COLUMN — Education + Achievements — 3/5 */}
            <div className="lg:col-span-3 space-y-10">
              {/* Education */}
              <ScrollTrigger>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="w-5 h-5 text-accent-400" />
                    <h3 className="text-lg font-bold text-neutral-50">Education</h3>
                  </div>
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
                          <div className="text-right flex-shrink-0 ml-4">
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
                  <div className="flex items-center gap-2 mb-4">
                    <Award className="w-5 h-5 text-accent-400" />
                    <h3 className="text-lg font-bold text-neutral-50">Achievements</h3>
                  </div>
                  <div className="space-y-3">
                    {achievements.map((achievement) => {
                      const Icon = iconMap[achievement.icon] || Award;
                      return (
                        <motion.div
                          key={achievement.id}
                          initial={{ opacity: 0, y: 16 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          whileHover={{ y: -2 }}
                          className="bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-5 hover:border-primary-500/30 transition group"
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
                      );
                    })}
                  </div>
                </div>
              </ScrollTrigger>
            </div>

            {/* RIGHT COLUMN — Certifications + Profiles + Stats — 2/5 */}
            <div className="lg:col-span-2 space-y-8">
              {/* Quick Stats Dashboard Panel */}
              <ScrollTrigger>
                <div className="bg-neutral-950/50 border border-neutral-800 rounded-lg p-5 font-mono text-sm">
                  <div className="text-accent-400 mb-3 text-xs uppercase tracking-wider">Quick Stats</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-3">
                      <p className="text-[10px] text-neutral-500 uppercase tracking-wide">Problems Solved</p>
                      <p className="text-lg font-bold text-primary-400 mt-1">{totalSolved}</p>
                    </div>
                    <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-3">
                      <p className="text-[10px] text-neutral-500 uppercase tracking-wide">Contest Rating</p>
                      <p className="text-lg font-bold text-cyan-400 mt-1">{contestRating}</p>
                    </div>
                    <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-3">
                      <p className="text-[10px] text-neutral-500 uppercase tracking-wide">Day Streak</p>
                      <p className="text-lg font-bold text-accent-400 mt-1">{streak}<span className="text-xs text-neutral-500">d</span></p>
                    </div>
                    <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-3">
                      <p className="text-[10px] text-neutral-500 uppercase tracking-wide">Platforms</p>
                      <p className="text-lg font-bold text-neutral-300 mt-1">{totalPlatforms}</p>
                    </div>
                  </div>
                </div>
              </ScrollTrigger>

              {/* Certifications */}
              {certifications.length > 0 && (
                <ScrollTrigger>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Award className="w-4 h-4 text-accent-400" />
                      <h3 className="text-base font-bold text-neutral-50">Certifications</h3>
                    </div>
                    <div className="space-y-2">
                      {certifications.map((cert, idx) => (
                        <motion.button
                          key={cert.id}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05, duration: 0.3 }}
                          viewport={{ once: true }}
                          onClick={() => setSelectedCert(cert)}
                          className="w-full text-left flex items-start gap-3 p-4 bg-neutral-800/30 border border-neutral-700/30 rounded-lg hover:border-neutral-600/50 hover:bg-neutral-800/50 transition group"
                        >
                          <Award className="w-5 h-5 text-accent-400 flex-shrink-0 mt-0.5 group-hover:text-accent-300 transition" />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-neutral-50 group-hover:text-accent-300 transition">{cert.title}</h4>
                            <p className="text-xs text-neutral-500">{cert.issuer}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-neutral-500 font-mono">{cert.date}</span>
                            {cert.credentialUrl && cert.credentialUrl !== '#' && (
                              <span className="p-1 hover:bg-neutral-700/50 rounded transition" title="View credential">
                                <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
                              </span>
                            )}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </ScrollTrigger>
              )}

              {/* Coding Profiles */}
              <ScrollTrigger>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Brain className="w-4 h-4 text-accent-400" />
                    <h3 className="text-base font-bold text-neutral-50">Coding Profiles</h3>
                  </div>
                  <div className="space-y-2">
                    {codingProfiles.map((profile) => (
                      <motion.a
                        key={profile.id}
                        href={profile.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ y: -1 }}
                        className="block p-4 bg-neutral-800/50 border border-neutral-700/50 rounded-lg hover:bg-neutral-800/70 hover:border-neutral-600/50 transition"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-accent-400/50" />
                            <h4 className="text-sm font-semibold text-neutral-50">{profile.platform}</h4>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
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
                  </div>
                </div>
              </ScrollTrigger>
            </div>
          </div>
        </div>
      </PageContainer>

      {/* Certificate Modal */}
      {selectedCert && (
        <CertificateModal cert={selectedCert} onClose={() => setSelectedCert(null)} />
      )}
    </Section>
  );
};

export default EducationAchievementsSection;
