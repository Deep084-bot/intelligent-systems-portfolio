import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronDown, Github } from 'lucide-react';
import {
  FadeIn,
  SlideIn,
} from '../animations';
import { Section, Flex, PageContainer, Stack } from '../layout';
import { Button } from '../primitives';
import profileData from '../data/profile.json';
import projectsData from '../data/projects.json';
import dsaStatsData from '../data/dsa-stats.json';

const HERO_ROLES = [
  'Backend Engineering Student',
  'AI Engineering Learner',
  'Systems-Focused Developer',
  'Problem Solver',
];

export const HeroSection = () => {
  const [roleIndex, setRoleIndex] = useState(0);
  const [photoError, setPhotoError] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setRoleIndex((prev) => (prev + 1) % HERO_ROLES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const scrollToNextSection = () => {
    const terminalSection = document.getElementById('terminal');
    if (terminalSection) {
      terminalSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const p = profileData;
  const dsa = dsaStatsData.dsa;
  const projects = projectsData.projects || [];
  const dsaCount = dsa?.totalSolved || 0;

  return (
    <Section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden bg-gradient-dark"
      padding={false}
    >
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(93,110,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(93,110,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] opacity-20" />

      {/* Soft background orbs */}
      <motion.div
        className="absolute top-20 right-10 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl"
        animate={{ y: [0, -30, 0], x: [0, 20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-20 left-10 w-96 h-96 bg-accent-500/15 rounded-full blur-3xl"
        animate={{ y: [0, 30, 0], x: [0, -20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Content */}
      <PageContainer className="relative z-10 py-20 min-h-screen flex items-center">
        <Stack gap={10} align="start" className="w-full max-w-4xl">
          {/* Profile Photo — Bottom-right floating */}
          <motion.div
            className="absolute bottom-16 right-4 sm:right-10 z-20"
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.7, ease: 'easeOut' }}
          >
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-neutral-600/60 bg-neutral-800/80 backdrop-blur-sm shadow-lg shadow-neutral-900/40">
                <img
                  src="/images/profile.png"
                  alt={p.name || 'Deep Mehta'}
                  onError={() => setPhotoError(true)}
                  className={`w-full h-full object-cover ${photoError ? 'hidden' : ''}`}
                  style={{ filter: 'grayscale(40%) contrast(105%)' }}
                />
                {photoError && (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-lg font-mono font-bold text-neutral-400">
                      {p.name?.split(' ').map(n => n[0]).join('') || 'DM'}
                    </span>
                  </div>
                )}
              </div>
              <div className="absolute -inset-0.5 rounded-xl border border-primary-500/10 pointer-events-none" />
            </div>
          </motion.div>

          {/* Heading */}
          <div className="space-y-5 sm:space-y-7">
            <SlideIn direction="down" delay={0.1} distance={50}>
              <h1 className="text-display leading-tight text-neutral-50">
                {p.name?.split(' ')[0] || 'Deep'}
                <span className="block text-gradient mt-1">{p.title || 'Engineer'}</span>
              </h1>
            </SlideIn>

            {/* Role Cycler */}
            <SlideIn direction="up" delay={0.2} distance={30}>
              <div className="flex items-center gap-3 text-lg sm:text-xl">
                <span className="text-accent-400 font-mono">→</span>
                <motion.div
                  key={roleIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="font-mono text-accent-300"
                >
                  {HERO_ROLES[roleIndex]}
                </motion.div>
              </div>
            </SlideIn>

            {/* Subtitle */}
            <FadeIn delay={0.3}>
              <p className="text-lg sm:text-xl text-neutral-300 leading-relaxed max-w-2xl">
                {p.shortHeadline || 'CS student focused on backend systems, distributed computing, and AI engineering.'}
              </p>
            </FadeIn>
          </div>

          {/* CTA Buttons */}
          <SlideIn direction="up" delay={0.4} distance={20}>
            <Flex gap={4} wrap>
              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  const contactSection = document.getElementById('contact');
                  if (contactSection) {
                    contactSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="group"
              >
                Get in Touch
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  window.open('https://github.com/Deep084-bot', '_blank', 'noopener');
                }}
              >
                <Github className="w-5 h-5" />
                GitHub
              </Button>
            </Flex>
          </SlideIn>

          {/* Stats Row */}
          <SlideIn direction="up" delay={0.5} distance={20}>
            <Flex gap={10} className="pt-5 border-t border-neutral-700/50">
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-primary-400">{projects.length}</p>
                <p className="text-neutral-500 text-sm tracking-wide">Projects Built</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-accent-400">{dsaCount}</p>
                <p className="text-neutral-500 text-sm tracking-wide">Problems Solved</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-neutral-400">{dsa?.stats?.currentStreak || '—'}d</p>
                <p className="text-neutral-500 text-sm tracking-wide">Current Streak</p>
              </div>
            </Flex>
          </SlideIn>
        </Stack>
      </PageContainer>

      {/* Scroll Indicator */}
      <motion.button
        onClick={scrollToNextSection}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 text-accent-400 hover:text-accent-300 transition-colors"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ChevronDown className="w-6 h-6" />
      </motion.button>
    </Section>
  );
};

export default HeroSection;
