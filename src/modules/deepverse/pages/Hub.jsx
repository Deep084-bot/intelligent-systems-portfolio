import { motion } from 'framer-motion'
import ExperienceCard from '../components/hub/ExperienceCard'

const EXPERIENCES = [
  {
    id: 'cosmos',
    icon: '🌌',
    title: 'Cosmos',
    description:
      'A journey through the universe — from human scale to the edge of the observable cosmos.',
  },
  {
    id: 'vision-arena',
    icon: '👁',
    title: 'Vision Arena',
    description:
      'Computer vision experiments powered by real-time hand tracking.',
  },
  {
    id: 'music-lab',
    icon: '🎸',
    title: 'Music Lab',
    description:
      'Play an air guitar using nothing but your webcam.',
  },
  {
    id: 'inside-my-mind',
    icon: '🧠',
    title: 'Inside My Mind',
    description:
      'Engineering decisions through branching scenarios.',
  },
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

export default function Hub({ navigate }) {
  const handleCardClick = (id) => {
    if (id === 'vision-arena') {
      navigate('/deepverse/vision-arena')
    }
  }

  const handleBack = () => {
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      <header className="relative z-10 pt-16 pb-8 px-6">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-300 transition-colors mb-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 rounded px-2 py-1 -ml-2"
          >
            <span aria-hidden="true">←</span>
            <span>Back to Home</span>
          </button>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-neutral-50 tracking-tight"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-400">
              DeepVerse
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-3 text-base sm:text-lg text-neutral-500 max-w-lg"
          >
            A laboratory of curiosities.
          </motion.p>
        </div>
      </header>

      <main className="flex-1 px-6 pb-16">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6"
          >
            {EXPERIENCES.map((exp) => (
              <motion.div key={exp.id} variants={itemVariants}>
                <ExperienceCard
                  id={exp.id}
                  icon={exp.icon}
                  title={exp.title}
                  description={exp.description}
                  onClick={handleCardClick}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </main>
    </div>
  )
}
