import { motion } from 'framer-motion'
import { SectionLabel, Card, Chip, PrimaryButton } from './ui'

export default function LabIntro({ eyebrow = 'Mission Brief', scenario, onBegin }) {
  return (
    <motion.div
      className="flex flex-col h-full overflow-y-auto pr-1"
      initial="hidden"
      animate="show"
      exit="hidden"
      variants={{ show: { transition: { staggerChildren: 0.08 } } }}
    >
      <SectionLabel className="mb-1">{eyebrow}</SectionLabel>
      <motion.h2
        variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
        className="text-[17px] text-neutral-200 mb-1"
      >
        {scenario.title}
      </motion.h2>
      <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="flex items-center gap-2 mb-4">
        {scenario.tag && <Chip tone="purple">{scenario.tag}</Chip>}
        {scenario.difficulty && <span className="text-[9px] font-mono text-neutral-700">{scenario.difficulty}</span>}
      </motion.div>

      <motion.p
        variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
        className="text-[13px] text-neutral-400 leading-relaxed mb-5 max-w-2xl"
      >
        {scenario.summary}
      </motion.p>

      {scenario.brief && (
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="grid sm:grid-cols-2 gap-3 mb-6 max-w-2xl">
          <Card className="p-3.5">
            <SectionLabel className="mb-2">Goals</SectionLabel>
            <ul className="space-y-1">
              {scenario.brief.goals.map((g, i) => (
                <li key={i} className="flex gap-2 text-[12px] leading-snug text-neutral-400">
                  <span style={{ color: '#6d5cfc' }}>›</span>
                  {g}
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-3.5">
            <SectionLabel className="mb-2">Constraints</SectionLabel>
            <ul className="space-y-1">
              {scenario.brief.constraints.map((c, i) => (
                <li key={i} className="flex gap-2 text-[12px] leading-snug text-neutral-400">
                  <span style={{ color: '#d4af37' }}>•</span>
                  {c}
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>
      )}

      <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="mt-auto pt-2">
        <PrimaryButton onClick={onBegin}>Begin</PrimaryButton>
      </motion.div>
    </motion.div>
  )
}
