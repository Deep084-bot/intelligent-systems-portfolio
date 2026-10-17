export const DIMENSIONS = [
  { id: 'leverage', label: 'Leverage' },
  { id: 'precision', label: 'Precision' },
  { id: 'recall', label: 'Recall' },
  { id: 'systemic', label: 'Systems View' },
]

export const LEVEL_LABELS = {
  param: 'Parameters',
  structure: 'Structure',
  feedback: 'Feedback & delays',
  rules: 'Rules & incentives',
  goal: 'Goals',
}

export const SCENARIOS = [
  {
    id: 'unreliable-service',
    title: 'A service that keeps falling over',
    tag: 'Operations',
    difficulty: 'Advanced',
    summary: 'The same service has breached its SLO four times this quarter. Everyone keeps adding alerts. Select the interventions you would make — the ones that actually change the system, not just its symptoms.',
    brief: {
      goals: ['Stop the recurring outages at the source', 'Change how the team makes decisions', 'Avoid interventions that only mask the problem'],
      constraints: ['You cannot watch dashboards 24/7', 'The same failure keeps returning', 'Culture and process are in scope'],
    },
    interventions: [
      { id: 'servers', label: 'Add more servers', level: 'param', leverage: 1, high: false, note: 'A parameter tweak. It buys headroom today and changes nothing about why overload happens.' },
      { id: 'alerts', label: 'Add more monitoring alerts', level: 'param', leverage: 1, high: false, note: 'More alerts detect the failure faster — they do not prevent it. Alert fatigue is the usual end state.' },
      { id: 'queue', label: 'Add a queue to absorb traffic spikes', level: 'structure', leverage: 3, high: false, note: 'A structural buffer. Genuinely useful, but it absorbs spikes rather than stopping them.' },
      { id: 'oncallpay', label: 'Increase on-call compensation', level: 'param', leverage: 1, high: false, note: 'A number. It may help retention, but it does not make the system more reliable.' },
      { id: 'postmortem', label: 'Run blameless postmortems on every incident', level: 'feedback', leverage: 4, high: false, note: 'A feedback loop. Valuable — it surfaces causes over time — but the changes still have to be made downstream.' },
      { id: 'rollout', label: 'Require progressive rollout with automatic rollback for every change', level: 'rules', leverage: 5, high: true, note: 'A rule change. It constrains how changes reach production, removing a whole class of outage before it happens.' },
      { id: 'errorbudget', label: 'Make reliability a first-class goal with an error budget that gates feature work', level: 'goal', leverage: 6, high: true, note: 'A goal change. When reliability becomes a shared objective that can stop feature work, the whole system reorients around it.' },
    ],
  },
  {
    id: 'slow-team',
    title: 'A team that keeps getting slower',
    tag: 'Organisation',
    difficulty: 'Intermediate',
    summary: 'A previously fast team ships less each quarter. The instinct is to push harder. Choose the interventions that change the underlying system.',
    brief: {
      goals: ['Recover delivery speed sustainably', 'Fix the causes, not the symptoms', 'Change incentives so the right behavior is the easy behavior'],
      constraints: ['People are already working hard', 'Pushing harder has been tried', 'Ownership is ambiguous'],
    },
    interventions: [
      { id: 'overtime', label: 'Ask for more overtime', level: 'param', leverage: 1, high: false, note: 'Pushing the same variable harder. In a system near its limits, more pressure produces less output and more burnout.' },
      { id: 'standups', label: 'Add daily standups and status reports', level: 'param', leverage: 1, high: false, note: 'More coordination overhead for an already-stretched team — this often makes the slowdown worse.' },
      { id: 'hire', label: 'Hire more engineers', level: 'structure', leverage: 3, high: false, note: 'Adding people is a structural change, but with unclear ownership it can add coordination cost before it adds capacity.' },
      { id: 'doc', label: 'Write a process document', level: 'param', leverage: 1, high: false, note: 'A document changes nothing unless it changes behavior or incentives.' },
      { id: 'ownership', label: 'Give every service a single accountable owner', level: 'rules', leverage: 5, high: true, note: 'A rule change. Clear ownership removes the diffusion of responsibility that lets small problems accumulate.' },
      { id: 'debtbudget', label: 'Reserve a fixed share of every sprint for paying down debt', level: 'rules', leverage: 5, high: true, note: 'A rule that changes the default. Debt gets repaid continuously instead of only in emergencies.' },
      { id: 'scope', label: 'Redefine the goal: shrink scope to match capacity instead of stretching capacity to match scope', level: 'goal', leverage: 6, high: true, note: 'A goal change. Redefining what “done” means removes the treadmill the team is on.' },
    ],
  },
]

export function evaluateSystem(scenario, selected) {
  const selItems = scenario.interventions.filter((i) => selected.includes(i.id))
  const high = scenario.interventions.filter((i) => i.high)
  const correct = selItems.filter((i) => i.high)
  const precision = selItems.length ? correct.length / selItems.length : 0
  const recall = high.length ? correct.length / high.length : 1
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0
  const avgLev = selItems.length ? selItems.reduce((s, i) => s + i.leverage, 0) / selItems.length : 0
  const hasGoal = selItems.some((i) => i.level === 'goal')
  const hasRules = selItems.some((i) => i.level === 'rules')
  const systemic = hasGoal ? 100 : hasRules ? 70 : selItems.length ? 35 : 0
  const dims = {
    leverage: Math.round((avgLev / 6) * 100),
    precision: Math.round(precision * 100),
    recall: Math.round(recall * 100),
    systemic,
  }
  return { selItems, precision, recall, f1, dims, metGoal: f1 >= 0.6 && hasGoal }
}
