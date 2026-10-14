const scenario = {
  id: 'traffic-spike',
  title: 'Overnight Traffic Spike',
  tag: 'Scaling Crisis',
  difficulty: 'Scaling under load',
  summary: 'A viral post pushes traffic to 20x. PostgreSQL connections are exhausted and the site is slowing down.',
  framing: {
    role: 'Senior Backend Engineer',
    system: 'Web App → API → PostgreSQL',
    headline: '2:00 AM · traffic 20x · DB connections exhausted',
  },
  evidence: {
    situation:
      'A link on a major forum went viral. Traffic jumped from 10k to 200k req/min in under an hour. PostgreSQL is rejecting connections and the API latency is climbing.',
    logs: [
      'api | ERROR connection refused: too many connections',
      'pg  | FATAL sorry, too many clients already',
      'api | 5xx rate 8% and rising',
    ],
    metrics: {
      Traffic: '200k req/min ↑',
      'DB connections': 'exhausted',
      CPU: 'high',
      Errors: '5xx 8%',
      Latency: 'climbing',
    },
    architecture: {
      viewBox: '0 0 320 160',
      nodes: [
        { id: 'clients', label: 'Clients', x: 10, y: 60, w: 80, h: 28 },
        { id: 'cdn', label: 'CDN', x: 110, y: 60, w: 80, h: 28 },
        { id: 'api', label: 'API', x: 210, y: 60, w: 80, h: 28 },
        { id: 'cache', label: 'Redis', x: 110, y: 122, w: 80, h: 28 },
        { id: 'db', label: 'PostgreSQL', x: 220, y: 122, w: 80, h: 28 },
      ],
      links: [
        ['clients', 'cdn'],
        ['cdn', 'api'],
        ['api', 'cache'],
        ['api', 'db'],
      ],
    },
    extra: [
      {
        id: 'slow-queries',
        label: 'Query Analysis',
        type: 'logs',
        lines: [
          'SELECT … FROM orders WHERE status = $1  — 1.8s avg (no index)',
          'SELECT … FROM users ORDER BY last_login DESC — 900ms avg (seq scan)',
        ],
      },
    ],
  },
  nodes: {
    start: {
      prompt: 'Connections are exhausted. What do you do first?',
      choices: [
        {
          id: 'pool',
          label: 'Tune pool + raise max_connections',
          scoring: { prioritization: 2, tradeoffs: 2 },
          outcome: 'Pool bounded, max_connections raised. Error rate drops to 1%.',
          next: 'still-slow',
        },
        {
          id: 'scale-db',
          label: 'Scale to a bigger DB instance',
          scoring: { tradeoffs: -1, risk: 1 },
          outcome: 'Takes 15 minutes of careful failover. Higher monthly cost.',
          next: 'still-slow',
        },
        {
          id: 'cache',
          label: 'Add a read cache in front of the DB',
          scoring: { prioritization: 3, tradeoffs: 3, evidence: 1 },
          outcome: 'Cache hit 60%. DB load halves.',
          next: 'still-slow',
        },
      ],
    },
    'still-slow': {
      prompt: 'Errors are down but latency is still high. What next?',
      choices: [
        {
          id: 'indexes',
          label: 'Check for slow queries',
          scoring: { evidence: 3, incremental: 2 },
          outcome: 'Found two unindexed queries hammering the DB. Indexes cut them to 20ms.',
          unlockEvidence: ['slow-queries'],
          next: 'verify',
        },
        {
          id: 'scale-api',
          label: 'Add API replicas',
          scoring: { prioritization: 1, risk: 1 },
          outcome: 'API is CPU-bound now — replicas help a little.',
          next: 'verify',
        },
        {
          id: 'cache-writes',
          label: 'Buffer writes in cache too',
          scoring: { risk: -2, tradeoffs: -1 },
          outcome: 'Buffering writes risks losing data. Latency unchanged.',
          next: 'verify',
        },
      ],
    },
    verify: {
      prompt: 'The site is responding again. Final check?',
      choices: [
        {
          id: 'capacity',
          label: 'Watch the pattern hold through peak',
          scoring: { evidence: 2, incremental: 1 },
          outcome: 'Steady through peak. Degrades gracefully under load.',
          next: 'conclusion',
        },
        {
          id: 'clean',
          label: 'Verify queries, cache, and latency together',
          scoring: { evidence: 3, risk: 1 },
          outcome: 'All queries indexed, cache hit 68%, p99 stable.',
          next: 'conclusion',
        },
      ],
    },
  },
  end: {
    recommendedApproach:
      'First, protect the database — connection exhaustion is a cascade risk that takes down everything downstream. Bound the pool and raise max_connections to buy time, but the real fix is reducing DB pressure: cache reads and index the hot queries. Capacity is a symptom; query cost is the cause. And in the long run, build for graceful degradation so a spike slows the site instead of killing it.',
    lessons: [
      'Connection exhaustion cascades — protect the dependency first.',
      'A cache and good indexes beat a bigger database.',
      'Design for graceful degradation; spikes will happen.',
    ],
  },
}

export default scenario
