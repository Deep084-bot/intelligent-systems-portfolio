const scenario = {
  id: 'postgres-migration',
  title: 'Zero-Downtime Migration',
  tag: 'Infrastructure',
  difficulty: 'High-risk infra change',
  summary: 'Move a 2TB Postgres 12 cluster to Postgres 16 with 50M users online — zero downtime.',
  framing: {
    role: 'Senior Platform Engineer',
    system: 'Postgres 12 → Postgres 16 · 2TB · 50M users online',
    headline: 'Zero downtime · writes constant · 72h window',
  },
  evidence: {
    situation:
      'The team needs Postgres 16 for better query plans and faster vacuum. 2TB of data, 50M users online with constant writes. Zero downtime is non-negotiable.',
    logs: [
      'pg12 | current WAL lsn 4E/2A9F8C00',
      'pg16 | logical replication status: initializing',
      'dba  | 2TB estimated dump time: 3h 10m',
    ],
    metrics: {
      Data: '2TB',
      'Writes/min': 'constant',
      'Replication lag': '0ms',
      Window: 'zero downtime',
    },
    architecture: {
      viewBox: '0 0 320 160',
      nodes: [
        { id: 'app', label: 'App', x: 10, y: 66, w: 80, h: 28 },
        { id: 'p12', label: 'Primary (12)', x: 120, y: 66, w: 90, h: 28 },
        { id: 'p16', label: 'Replica (16)', x: 220, y: 66, w: 90, h: 28 },
        { id: 'repl', label: 'logical replication', x: 120, y: 122, w: 190, h: 22 },
      ],
      links: [
        ['app', 'p12'],
        ['p12', 'p16'],
      ],
    },
    extra: [
      {
        id: 'lag-check',
        label: 'Replication Lag',
        type: 'logs',
        lines: [
          'wal receiver | lag 42ms',
          'wal receiver | lag 8ms',
        ],
      },
    ],
  },
  nodes: {
    start: {
      prompt: 'You need zero downtime. What strategy?',
      choices: [
        {
          id: 'logical',
          label: 'Logical replication to a Postgres 16 cluster',
          scoring: { tradeoffs: 3, risk: 3 },
          outcome: 'The new cluster stays in sync. Cutover is seconds.',
          next: 'cutover',
        },
        {
          id: 'downtime',
          label: 'Schedule a maintenance window',
          scoring: { risk: -3, tradeoffs: -2 },
          outcome: 'Simple, but 40 minutes of downtime. Users notice. It violates the constraint.',
          next: 'conclusion',
        },
        {
          id: 'dump',
          label: 'Live pg_dump + restore',
          scoring: { risk: -2, evidence: -2 },
          outcome: 'The dump takes 3 hours — the data drifts while it runs. The restore would be stale.',
          next: 'start',
        },
      ],
    },
    cutover: {
      prompt: 'Replication is nearly caught up. At cutover, what matters?',
      choices: [
        {
          id: 'wait-lag',
          label: 'Wait for lag to reach zero',
          scoring: { risk: 3, evidence: 2 },
          outcome: 'Lag hit 0ms. Cutover clean, zero data loss.',
          next: 'verify',
        },
        {
          id: 'force',
          label: 'Cut over now regardless of lag',
          scoring: { risk: -3, evidence: -3 },
          outcome: '2,400 writes lost. Users see missing data.',
          next: 'verify',
        },
        {
          id: 'checks',
          label: 'Run integrity checks before cutover',
          scoring: { evidence: 3, risk: 2 },
          outcome: 'Checks pass, lag 0ms. Cutover clean and verified.',
          next: 'verify',
        },
      ],
    },
    verify: {
      prompt: 'Migration is complete. Final step?',
      choices: [
        {
          id: 'rollback',
          label: 'Keep the old cluster warm for 72h',
          scoring: { risk: 3, tradeoffs: 1 },
          outcome: 'Safety net ready. New cluster stable.',
          next: 'conclusion',
        },
        {
          id: 'perf',
          label: 'Verify query plan parity',
          scoring: { evidence: 2, incremental: 2 },
          outcome: 'Plans match or are better. No regressions.',
          next: 'conclusion',
        },
      ],
    },
  },
  end: {
    recommendedApproach:
      'Logical replication is the only zero-downtime option at this scale — dump/restore drifts on a live 2TB database. The cutover is where migrations fail, so never force it on lag: wait for lag to hit zero and run integrity checks first. Keep the old cluster warm for rollback for at least 72 hours. The expensive part is not moving the data, it is verifying the move.',
    lessons: [
      'At 2TB with live writes, dump/restore is not an option.',
      'Never force cutover on replication lag.',
      'The old cluster stays warm as insurance — rollback is a feature.',
    ],
  },
}

export default scenario
