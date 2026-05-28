import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronDown, Github, FileText } from 'lucide-react';
import {
  FadeIn,
  SlideIn,
} from '../animations';
import { Section, Flex } from '../layout';
import { Button } from '../primitives';
import profileData from '../data/profile.json';
import projectsData from '../data/projects.json';
import skillsData from '../data/skills.json';
import { profileData as profileDataModule } from '../data/profileData';

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
  const projects = projectsData.projects || [];
  const skills = skillsData.skills || [];
  const { codingProfiles } = profileDataModule;

  const profileImage = (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3, duration: 0.7, ease: 'easeOut' }}
    >
      <div className="relative">
        <div className="w-52 sm:w-56 lg:w-72 h-52 sm:h-56 lg:h-72 rounded-xl overflow-hidden border border-neutral-600/60 bg-neutral-800/80 shadow-lg shadow-neutral-900/40">
          <img
            src="/images/profile.png"
            alt={p.name || 'Deep Mehta'}
            onError={() => setPhotoError(true)}
            className={`w-full h-full object-contain ${photoError ? 'hidden' : ''}`}
            style={{ filter: 'grayscale(40%) contrast(105%)' }}
          />
          {photoError && (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-4xl font-mono font-bold text-neutral-400">
                {p.name?.split(' ').map(n => n[0]).join('') || 'DM'}
              </span>
            </div>
          )}
        </div>
        <div className="absolute -inset-0.5 rounded-xl border border-primary-500/10 pointer-events-none" />
      </div>
    </motion.div>
  );

  return (
    <Section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden bg-gradient-dark"
      padding={false}
    >
      <div className="absolute inset-0 bg-[linear-gradient(rgba(93,110,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(93,110,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] opacity-20" />

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

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-12 sm:py-16 lg:py-20 min-h-screen flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16 w-full items-center">
          {/* Left Column — Text Content — 3/5 width */}
          <div className="lg:col-span-3 space-y-6 lg:space-y-8">
            <SlideIn direction="down" delay={0.1} distance={50}>
              <h1 className="text-display leading-tight text-neutral-50">
                {p.name?.split(' ')[0] || 'Deep'}
                <span className="block text-gradient mt-1">{p.title || 'Engineer'}</span>
              </h1>
            </SlideIn>

            <SlideIn direction="up" delay={0.2} distance={30}>
              <div className="flex items-center gap-3 text-lg sm:text-xl">
                <span className="text-accent-400 font-mono">→</span>
                <motion.span
                  key={roleIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="font-mono text-accent-300"
                >
                  {HERO_ROLES[roleIndex]}
                </motion.span>
              </div>
            </SlideIn>

            {/* Mobile profile image — between role and description, hidden on desktop */}
            <div className="flex justify-center lg:hidden">
              {profileImage}
            </div>

            <FadeIn delay={0.3}>
              <p className="text-sm sm:text-base text-accent-400 font-mono mb-2 tracking-wide">
                Backend Engineering • Distributed Systems • AI Applications
              </p>
              <p className="text-lg sm:text-xl text-neutral-300 leading-relaxed max-w-2xl">
                {p.shortHeadline || 'CS student focused on backend systems, distributed computing, and AI engineering.'}
              </p>
            </FadeIn>

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
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = '/assets/resume.pdf';
                    link.download = 'Deep-Mehta-Resume.pdf';
                    link.click();
                  }}
                >
                  <FileText className="w-5 h-5" />
                  Resume
                </Button>
              </Flex>
            </SlideIn>

            <SlideIn direction="up" delay={0.5} distance={20}>
              <Flex gap={10} className="pt-5 border-t border-neutral-700/50">
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-primary-400">{projects.length}</p>
                  <p className="text-neutral-500 text-sm tracking-wide">Projects Built</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-accent-400">{skills.reduce((sum, cat) => sum + (cat.skills?.length || 0), 0)}</p>
                  <p className="text-neutral-500 text-sm tracking-wide">Technologies</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-neutral-400">{codingProfiles.length}</p>
                  <p className="text-neutral-500 text-sm tracking-wide">Coding Platforms</p>
                </div>
              </Flex>
            </SlideIn>
          </div>

          {/* Right Column — Profile Image — 2/5 width (desktop only) */}
          <div className="lg:col-span-2 justify-center lg:justify-end hidden lg:flex">
            {profileImage}
          </div>
        </div>
      </div>

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
