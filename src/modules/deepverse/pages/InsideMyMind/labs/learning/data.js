export const OUTCOMES = [
  { id: 'practical', label: 'Practical Skill' },
  { id: 'depth', label: 'Depth' },
  { id: 'retention', label: 'Retention' },
  { id: 'breadth', label: 'Breadth' },
]

export const CHANNELS = [
  { id: 'build', label: 'Building projects', blurb: 'Writing real code you have to ship', w: { practical: 3.0, depth: 1.5, retention: 1.0, breadth: 0.5 } },
  { id: 'read', label: 'Reading docs & books', blurb: 'Studying how things work', w: { depth: 2.0, breadth: 2.6, practical: 0.5, retention: 0.5 } },
  { id: 'review', label: 'Reviewing others’ code', blurb: 'Reading code you did not write', w: { practical: 2.0, breadth: 2.0, depth: 1.0, retention: 0.8 } },
  { id: 'debug', label: 'Debugging real issues', blurb: 'Chasing failures to root cause', w: { practical: 2.6, depth: 1.3, retention: 0.7, breadth: 0.6 } },
  { id: 'spaced', label: 'Spaced review of fundamentals', blurb: 'Revisiting basics on a schedule', w: { retention: 3.2, depth: 1.2, practical: 0.3, breadth: 0.3 } },
  { id: 'teach', label: 'Writing & teaching', blurb: 'Explaining what you learned', w: { depth: 2.1, retention: 2.3, breadth: 1.0, practical: 0.4 } },
]

export const SCENARIOS = [
  {
    id: 'new-stack',
    title: 'Ramp on a new stack',
    tag: 'Growth',
    difficulty: 'Intermediate',
    summary: 'You have 20 hours a week and one quarter to become effective in a stack you have never used. Decide how to spend the hours.',
    brief: {
      goals: ['Become genuinely productive, not just familiar', 'Retain what you learn under pressure', 'Cover enough breadth to move around the codebase'],
      constraints: ['Time is fixed at 20 hours a week', 'Passive reading feels productive but fades', 'You will be judged on shipping'],
    },
    hours: 20,
    targets: { practical: 72, breadth: 58, retention: 52 },
  },
  {
    id: 'fundamentals',
    title: 'Deepen your fundamentals',
    tag: 'Mastery',
    difficulty: 'Advanced',
    summary: 'You already ship, but your understanding is shallow in places. Spend 16 hours a week turning familiarity into deep, durable knowledge.',
    brief: {
      goals: ['Understand systems down to first principles', 'Make knowledge durable, not exam-crammed', 'Stay able to apply it in practice'],
      constraints: ['16 hours a week, sustained', 'You will be tempted to just build', 'Retention decays without effort'],
    },
    hours: 16,
    targets: { depth: 76, retention: 72, practical: 50 },
  },
]

export function simulate(hoursById, H) {
  const raw = {}
  OUTCOMES.forEach((o) => {
    let sum = 0
    CHANNELS.forEach((c) => {
      const h = hoursById[c.id] || 0
      if (h > 0) sum += (c.w[o.id] || 0) * Math.sqrt(h)
    })
    raw[o.id] = sum
  })
  const scores = {}
  OUTCOMES.forEach((o) => {
    const sumSq = CHANNELS.reduce((s, c) => s + (c.w[o.id] || 0) ** 2, 0)
    const maxRaw = Math.sqrt(H * sumSq)
    scores[o.id] = maxRaw > 0 ? Math.max(0, Math.min(100, Math.round((raw[o.id] / maxRaw) * 100))) : 0
  })
  return scores
}
