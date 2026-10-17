export const DIMENSIONS = [
  { id: 'impact', label: 'Value Captured' },
  { id: 'strategy', label: 'Strategic Fit' },
  { id: 'efficiency', label: 'Efficiency' },
  { id: 'confidence', label: 'Confidence' },
  { id: 'balance', label: 'Portfolio Balance' },
]

export const SCENARIOS = [
  {
    id: 'q3-planning',
    title: 'Plan a quarter',
    tag: 'Roadmap',
    difficulty: 'Intermediate',
    summary: 'You have 10 person-weeks and a backlog shouting for all of it. Fund the set that returns the most value — and do not skip the non-negotiables.',
    brief: {
      goals: ['Maximize value delivered for the effort spent', 'Fund the compliance work, whatever it costs', 'Ship at least one quick win'],
      constraints: ['Capacity is 10 person-weeks for the quarter', 'Confidence matters — big uncertain bets can sink you', 'A portfolio of only one kind of work is fragile'],
    },
    capacity: 10,
    requirements: [
      { id: 'audit', label: 'Fund the audit log (compliance)', type: 'item' },
      { id: 'quickwin', label: 'Ship at least one quick win', type: 'tag', tag: 'quickwin' },
    ],
    items: [
      { id: 'darkmode', title: 'Dark mode', reach: 5000, impact: 0.5, confidence: 1.0, effort: 1, tag: 'quickwin', note: 'High reach, tiny effort — a classic quick win.' },
      { id: 'sso', title: 'SSO login', reach: 8000, impact: 1.0, confidence: 0.8, effort: 4, tag: 'platform', note: 'Large enterprise reach, real effort, solid confidence.' },
      { id: 'push', title: 'Mobile push notifications', reach: 6000, impact: 1.0, confidence: 0.7, effort: 3, tag: 'retention', note: 'Strong retention lever, moderate confidence.' },
      { id: 'csv', title: 'Bulk CSV import', reach: 3000, impact: 1.0, confidence: 0.9, effort: 2, tag: 'growth', note: 'Unblocks a growth segment cheaply.' },
      { id: 'audit', title: 'Audit log for compliance', reach: 2000, impact: 2.0, confidence: 0.9, effort: 3, tag: 'reliability', note: 'Low reach, high impact — and non-negotiable this quarter.' },
      { id: 'filters', title: 'Saved filters', reach: 2500, impact: 0.5, confidence: 0.9, effort: 1, tag: 'quickwin', note: 'Cheap, confident, modest impact.' },
      { id: 'ai', title: 'AI summary feature', reach: 4000, impact: 1.0, confidence: 0.4, effort: 5, tag: 'ai', note: 'Exciting but uncertain — confidence is low.' },
      { id: 'billing', title: 'Rewrite the billing engine', reach: 1000, impact: 3.0, confidence: 0.5, effort: 8, tag: 'platform', note: 'Huge impact, huge effort, uncertain — it would consume the quarter.' },
    ],
  },
  {
    id: 'mvp',
    title: 'Scope an MVP',
    tag: 'Startup',
    difficulty: 'Advanced',
    summary: 'You have 6 person-weeks to find product-market fit. Value here is learning fast, not polishing — choose carefully.',
    brief: {
      goals: ['Learn the most, fastest', 'Deliver something users can actually use', 'Avoid one big bet eating the whole runway'],
      constraints: ['Capacity is 6 person-weeks', 'You must ship something demoable', 'Uncertainty is high across the board'],
    },
    capacity: 6,
    requirements: [
      { id: 'quickwin', label: 'Ship a usable core, not only infrastructure', type: 'tag', tag: 'quickwin' },
      { id: 'growth', label: 'Fund at least one growth experiment', type: 'tag', tag: 'growth' },
    ],
    items: [
      { id: 'signup', title: 'Frictionless signup', reach: 9000, impact: 1.0, confidence: 0.9, effort: 2, tag: 'growth', note: 'Every funnel begins at signup.' },
      { id: 'onboard', title: 'Guided onboarding checklist', reach: 7000, impact: 1.0, confidence: 0.8, effort: 2, tag: 'quickwin', note: 'Activation is a product, not an afterthought.' },
      { id: 'paywall', title: 'Paywall & checkout', reach: 3000, impact: 3.0, confidence: 0.7, effort: 3, tag: 'monetization', note: 'High impact — revenue has to happen someday.' },
      { id: 'dash', title: 'Analytics dashboard', reach: 4000, impact: 1.0, confidence: 0.6, effort: 4, tag: 'platform', note: 'Useful, but large and speculative this early.' },
      { id: 'invite', title: 'Invite-a-friend loop', reach: 5000, impact: 0.8, confidence: 0.5, effort: 2, tag: 'growth', note: 'Viral loops are powerful but rarely land first try.' },
      { id: 'polish', title: 'Animation & polish pass', reach: 2000, impact: 0.5, confidence: 0.9, effort: 3, tag: 'design', note: 'Feels good, moves no metric.' },
      { id: 'perf', title: 'Make the app feel instant', reach: 6000, impact: 1.0, confidence: 0.8, effort: 2, tag: 'quickwin', note: 'Speed is retention you can feel immediately.' },
    ],
  },
]

export function rice(item) {
  return (item.reach * item.impact * item.confidence) / item.effort
}

export function optimalValue(items, capacity) {
  let best = 0
  const n = items.length
  for (let mask = 0; mask < (1 << n); mask++) {
    let eff = 0
    let val = 0
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) { eff += items[i].effort; val += rice(items[i]) }
    }
    if (eff <= capacity && val > best) best = val
  }
  return best
}

export function evaluateSelection(scenario, selectedIds) {
  const sel = scenario.items.filter((i) => selectedIds.includes(i.id))
  const used = sel.reduce((s, i) => s + i.effort, 0)
  const value = sel.reduce((s, i) => s + rice(i), 0)
  const optV = optimalValue(scenario.items, scenario.capacity)
  const valueRatio = optV > 0 ? value / optV : 0

  const reqResults = scenario.requirements.map((r) => {
    const met = r.type === 'item'
      ? selectedIds.includes(r.id)
      : sel.some((i) => i.tag === r.tag)
    return { ...r, met }
  })

  const tags = new Set(sel.map((i) => i.tag))
  const balance = Math.max(0, Math.min(100, Math.round((tags.size / 3) * 100)))
  const avgConf = sel.length ? sel.reduce((s, i) => s + i.confidence, 0) / sel.length : 0

  const dims = {
    impact: Math.round(Math.max(0, Math.min(100, valueRatio * 100))),
    strategy: reqResults.every((r) => r.met) ? 100 : Math.round((reqResults.filter((r) => r.met).length / reqResults.length) * 60),
    efficiency: Math.round(Math.max(0, Math.min(100, valueRatio * 100))),
    confidence: Math.round(avgConf * 100),
    balance,
  }
  const metGoal = valueRatio >= 0.85 && reqResults.every((r) => r.met)
  return { sel, used, value, optV, valueRatio, reqResults, dims, metGoal }
}
