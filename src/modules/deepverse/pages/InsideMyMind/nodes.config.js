const C = 0.5
const S = 0.5
function spread(x, y) {
  const sx = C + (x - C) * 1.35
  const sy = S + (y - S) * 1.35
  return [Math.round(sx * 1000) / 1000, Math.round(sy * 1000) / 1000]
}

export const MODULES = [
  { id: 'debugging', label: 'Debugging', icon: '🔍', x: spread(0.5, 0.25)[0], y: spread(0.5, 0.25)[1] },
  { id: 'architecture', label: 'Architecture', icon: '🏛', x: spread(0.75, 0.35)[0], y: spread(0.75, 0.35)[1] },
  { id: 'problem-solving', label: 'Problem Solving', icon: '🧩', x: spread(0.6, 0.45)[0], y: spread(0.6, 0.45)[1] },
  { id: 'performance', label: 'Performance', icon: '⚡', x: spread(0.85, 0.5)[0], y: spread(0.85, 0.5)[1] },
  { id: 'databases', label: 'Databases', icon: '🗄', x: spread(0.7, 0.6)[0], y: spread(0.7, 0.6)[1] },
  { id: 'ai', label: 'AI', icon: '🤖', x: spread(0.4, 0.3)[0], y: spread(0.4, 0.3)[1] },
  { id: 'machine-learning', label: 'Machine Learning', icon: '🧠', x: spread(0.25, 0.4)[0], y: spread(0.25, 0.4)[1] },
  { id: 'tradeoffs', label: 'Tradeoffs', icon: '⚖', x: spread(0.35, 0.55)[0], y: spread(0.35, 0.55)[1] },
  { id: 'distributed-systems', label: 'Distributed Systems', icon: '🌐', x: spread(0.55, 0.65)[0], y: spread(0.55, 0.65)[1] },
  { id: 'learning', label: 'Learning', icon: '📖', x: spread(0.2, 0.6)[0], y: spread(0.2, 0.6)[1] },
  { id: 'product-thinking', label: 'Product Thinking', icon: '🎯', x: spread(0.15, 0.5)[0], y: spread(0.15, 0.5)[1] },
  { id: 'api-design', label: 'API Design', icon: '⇋', x: spread(0.45, 0.7)[0], y: spread(0.45, 0.7)[1] },
  { id: 'scalability', label: 'Scalability', icon: '📈', x: spread(0.65, 0.75)[0], y: spread(0.65, 0.75)[1] },
  { id: 'systems-thinking', label: 'Systems Thinking', icon: '∞', x: spread(0.3, 0.7)[0], y: spread(0.3, 0.7)[1] },
]

export const CONNECTIONS = [
  ['debugging', 'problem-solving'],
  ['debugging', 'performance'],
  ['architecture', 'problem-solving'],
  ['architecture', 'distributed-systems'],
  ['architecture', 'scalability'],
  ['architecture', 'tradeoffs'],
  ['problem-solving', 'product-thinking'],
  ['problem-solving', 'systems-thinking'],
  ['performance', 'scalability'],
  ['performance', 'databases'],
  ['databases', 'distributed-systems'],
  ['databases', 'api-design'],
  ['ai', 'machine-learning'],
  ['ai', 'problem-solving'],
  ['machine-learning', 'learning'],
  ['tradeoffs', 'api-design'],
  ['tradeoffs', 'product-thinking'],
  ['distributed-systems', 'scalability'],
  ['distributed-systems', 'systems-thinking'],
  ['learning', 'systems-thinking'],
  ['api-design', 'scalability'],
  ['product-thinking', 'systems-thinking'],
]

export function getConnectedIds(id) {
  const set = new Set()
  for (const [a, b] of CONNECTIONS) {
    if (a === id) set.add(b)
    if (b === id) set.add(a)
  }
  return set
}

export const MODULE_DETAILS = {
  debugging: {
    title: 'Debugging',
    subtitle: 'Production Incident Simulator',
    description: 'Step into real-world production incidents. Investigate logs, metrics, and architecture to find root causes under time pressure.',
    future: [
      'Root Cause Analysis',
      'Log Investigation',
      'Metrics Explorer',
      'Incident Commander',
    ],
  },
  architecture: {
    title: 'Architecture',
    subtitle: 'System Design Challenge',
    description: 'Design large-scale systems from scratch. Make architectural tradeoffs and see how your decisions hold up under real constraints.',
    future: [
      'Design YouTube',
      'Design Netflix',
      'Design Uber',
      'Design Instagram',
    ],
  },
  'problem-solving': {
    title: 'Problem Solving',
    subtitle: 'Engineering Decision Lab',
    description: 'Work through ambiguous engineering problems. Every branch tests your ability to reason under uncertainty.',
    future: [
      'Production Outage',
      'API Design Problem',
      'Data Pipeline Failure',
      'Migration Strategy',
    ],
  },
  performance: {
    title: 'Performance',
    subtitle: 'Latency Optimization Lab',
    description: 'Identify bottlenecks and optimize slow systems. Every optimization choice affects latency, cost, and complexity.',
    future: [
      'Slow API Debug',
      'Database Query Tuning',
      'Caching Strategy',
      'Load Testing',
    ],
  },
  databases: {
    title: 'Databases',
    subtitle: 'Data Architecture Lab',
    description: 'Choose the right storage for the right job. Compare SQL, NoSQL, in-memory, search, and streaming engines.',
    future: [
      'Storage Selection',
      'Query Optimization',
      'Migration Planning',
      'Replication Strategy',
    ],
  },
  ai: {
    title: 'AI',
    subtitle: 'Machine Learning Decisions',
    description: 'Explore real ML engineering decisions — from model selection to deployment strategies, data pipelines, and monitoring.',
    future: [
      'Model Selection',
      'Data Pipeline Design',
      'ML Infrastructure',
      'AI in Production',
    ],
  },
  'machine-learning': {
    title: 'Machine Learning',
    subtitle: 'ML Engineering Lab',
    description: 'Practical ML engineering challenges covering training pipelines, feature engineering, serving infrastructure, and monitoring.',
    future: [
      'Feature Store Design',
      'Training Pipeline',
      'Model Serving',
      'ML Monitoring',
    ],
  },
  tradeoffs: {
    title: 'Tradeoffs',
    subtitle: 'Engineering Tradeoff Engine',
    description: 'Compare engineering decisions side by side. No single right answer — only tradeoffs that depend on context.',
    future: [
      'REST vs gRPC',
      'SQL vs NoSQL',
      'Redis vs Memcached',
      'Polling vs WebSockets',
    ],
  },
  'distributed-systems': {
    title: 'Distributed Systems',
    subtitle: 'Distributed Architecture Lab',
    description: 'Navigate the complexities of distributed systems — consistency, partitioning, replication, failure modes, and consensus.',
    future: [
      'Consistency Models',
      'Partitioning Strategies',
      'Consensus Algorithms',
      'Failure Modes',
    ],
  },
  learning: {
    title: 'Learning',
    subtitle: 'Engineering Journey',
    description: 'Explore the path that shaped an engineer — from first principles to production systems, failures, and breakthroughs.',
    future: [
      'Timeline Explorer',
      'Project Retrospectives',
      'Mistakes & Lessons',
      'Reading List',
    ],
  },
  'product-thinking': {
    title: 'Product Thinking',
    subtitle: 'Product-Engineering Decisions',
    description: 'Bridge engineering and product. Understand how technical decisions impact user experience, business goals, and team velocity.',
    future: [
      'Feature Prioritization',
      'Technical Debt Strategy',
      'Build vs Buy',
      'Engineering Metrics',
    ],
  },
  'api-design': {
    title: 'API Design',
    subtitle: 'API Architecture Lab',
    description: 'Design APIs that scale — from RESTful conventions to GraphQL, gRPC, versioning strategies, and documentation.',
    future: [
      'REST API Design',
      'GraphQL Schema',
      'API Versioning',
      'Documentation Strategy',
    ],
  },
  scalability: {
    title: 'Scalability',
    subtitle: 'Scaling Engineering Lab',
    description: 'Scale systems from zero to millions of users. Make decisions about infrastructure, architecture, and operational complexity.',
    future: [
      'Horizontal Scaling',
      'Database Sharding',
      'Caching Layers',
      'Global Distribution',
    ],
  },
  'systems-thinking': {
    title: 'Systems Thinking',
    subtitle: 'Systems Design Philosophy',
    description: 'A collection of mental models, principles, and heuristics that guide engineering decisions across any domain.',
    future: [
      'Mental Models',
      'Engineering Principles',
      'Decision Heuristics',
      'System Dynamics',
    ],
  },
}
