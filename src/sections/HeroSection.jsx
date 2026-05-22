import { motion } from 'framer-motion';
import { ArrowRight, ChevronDown } from 'lucide-react';
import {
  FadeIn,
  SlideIn,
  FloatingAnimation,
  TypewriterAnimation,
} from '../animations';
import { Section, Flex, PageContainer, Center, Stack } from '../layout';
import { Button } from '../primitives';

const HERO_ROLES = [
  'Backend Engineer',
  'AI Engineer',
  'Systems Architect',
  'Problem Solver',
];

export const HeroSection = () => {
  const scrollToNextSection = () => {
    const terminalSection = document.getElementById('terminal');
    if (terminalSection) {
      terminalSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden bg-gradient-dark"
      padding={false}
    >
      {/* Background Grid Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(93,110,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(93,110,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] opacity-20" />

      {/* Animated Background Gradient Orbs */}
      <motion.div
        className="absolute top-20 right-10 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl"
        animate={{
          y: [0, -30, 0],
          x: [0, 20, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute bottom-20 left-10 w-96 h-96 bg-accent-500/15 rounded-full blur-3xl"
        animate={{
          y: [0, 30, 0],
          x: [0, -20, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Content */}
      <PageContainer className="relative z-10 py-20 min-h-screen flex items-center">
        <Stack gap={8} align="start" className="w-full max-w-4xl">
          {/* Main Heading */}
          <div className="space-y-4 sm:space-y-6">
            <SlideIn direction="down" delay={0.1} distance={50}>
              <h1 className="text-display leading-tight text-neutral-50">
                Intelligent
                <span className="block text-gradient">Systems</span>
                <span className="block text-neutral-400">Builder</span>
              </h1>
            </SlideIn>

            {/* Role Cycler */}
            <SlideIn direction="up" delay={0.2} distance={30}>
              <div className="flex items-center gap-3 text-lg sm:text-xl">
                <span className="text-accent-400">→</span>
                <motion.div
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="font-mono text-accent-300"
                >
                  CS Student | Backend | AI/ML | Distributed Systems
                </motion.div>
              </div>
            </SlideIn>
          </div>

          {/* Subtitle */}
          <FadeIn delay={0.3}>
            <p className="text-xl sm:text-2xl text-neutral-300 leading-relaxed max-w-2xl">
              I design and build scalable backend systems, AI-driven applications, and distributed infrastructure. Focused on solving complex problems with clean, efficient code.
            </p>
          </FadeIn>

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
                  window.open('https://github.com', '_blank');
                }}
              >
                View on GitHub
              </Button>
            </Flex>
          </SlideIn>

          {/* Stats Row */}
          <SlideIn direction="up" delay={0.5} distance={20}>
            <Flex gap={8} className="pt-4 border-t border-neutral-700/50">
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-primary-400">10+</p>
                <p className="text-neutral-400 text-sm">Projects Built</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-accent-400">500+</p>
                <p className="text-neutral-400 text-sm">DSA Problems</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-success">100%</p>
                <p className="text-neutral-400 text-sm">Learning Commitment</p>
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
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <ChevronDown className="w-6 h-6" />
      </motion.button>

      {/* Decorative Code Block */}
      <motion.div
        className="absolute bottom-12 right-4 sm:right-8 max-w-xs"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 0.6, x: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
      >
        <div className="bg-neutral-800/40 backdrop-blur-sm border border-neutral-700/50 rounded-lg p-3 font-mono text-xs text-neutral-400">
          <div className="text-primary-400">const</div>
          <div>
            <span className="text-accent-300">developer</span>
            <span className="text-neutral-500"> = </span>
            <span>&#123;</span>
          </div>
          <div className="pl-4">name: <span className="text-success">'Deep'</span>,</div>
          <div className="pl-4">focus: <span className="text-success">'Systems'</span></div>
          <div>&#125;</div>
        </div>
      </motion.div>
    </Section>
  );
};

export default HeroSection;
