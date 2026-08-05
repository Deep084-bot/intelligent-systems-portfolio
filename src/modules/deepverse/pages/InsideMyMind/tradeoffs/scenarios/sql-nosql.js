const scenario = {
  id: 'sql-nosql',
  title: 'SQL vs NoSQL',
  tag: 'Data Architecture',
  difficulty: 'Storage selection',
  summary: 'Choose the primary store for a messaging startup racing to scale — and decide how flexible the schema can afford to be.',
  brief: {
    company: 'Waveline — messaging platform startup',
    headline: '2M MAU · 8k writes/s peak · 2.4B messages stored · 6 backend engineers',
    goals: [
      'Sub-second message delivery across devices',
      'Multi-device sync with no gaps or duplicates',
      'Ship new message types every week',
      'Keep infra cost roughly flat as usage grows',
    ],
    limitations: [
      'Six-person backend team, no dedicated DBAs',
      'Current schema churns on nearly every sprint',
      'Reads already outnumber writes 10:1',
      'Product roadmap is reactive — requirements shift weekly',
    ],
  },
  constraints: [
    { label: 'Consistency', weight: 'High', detail: 'Message ordering per conversation must be unambiguous — users notice reordering instantly.' },
    { label: 'Joins', weight: 'Medium', detail: 'Threads, read receipts, and conversation metadata reference each other heavily.' },
    { label: 'Transactions', weight: 'Medium', detail: 'A few flows — move conversation, mark read — genuinely want atomicity.' },
    { label: 'Write scaling', weight: 'High', detail: 'Peaks of 8k writes/s today, and the growth curve is steep.' },
    { label: 'Schema evolution', weight: 'High', detail: 'New message types ship weekly; the shape of data is a moving target.' },
    { label: 'Operability', weight: 'High', detail: 'A tiny team cannot afford an exotic database they barely understand.' },
  ],
  metrics: {
    latency: { label: 'Write Latency', unit: 'ms', lowerIsBetter: true, value: 40 },
    readThroughput: { label: 'Read Throughput', unit: 'k/s', lowerIsBetter: false, value: 50 },
    writeThroughput: { label: 'Write Throughput', unit: 'k/s', lowerIsBetter: false, value: 8 },
    infraCost: { label: 'Infra Cost', unit: '$k/mo', lowerIsBetter: true, value: 20 },
    devComplexity: { label: 'Dev Complexity', unit: '', lowerIsBetter: true, value: 25 },
    maintainability: { label: 'Maintainability', unit: '', lowerIsBetter: false, value: 60 },
  },
  architecture: {
    base: {
      viewBox: '0 0 340 200',
      nodes: [
        { id: 'client', label: 'Clients', x: 10, y: 10, w: 70, h: 26 },
        { id: 'api', label: 'API Layer', x: 130, y: 10, w: 90, h: 26 },
        { id: 'db', label: 'Primary DB', x: 120, y: 120, w: 100, h: 26 },
      ],
      links: [
        ['client', 'api'],
        ['api', 'db'],
      ],
    },
  },
  decisions: [
    {
      question: 'Which database anchors conversations and message history?',
      framing: 'Waveline is scaling fast but staffed small. Weigh consistency and joins against write throughput and schema freedom.',
      choices: [
        {
          id: 'postgres',
          title: 'PostgreSQL',
          subtitle: 'Relational · ACID · JSONB built in',
          summary: 'The safe, mature choice that scales up to a point.',
          advantages: [
            'ACID transactions and real joins for threads and receipts',
            'Read replicas extend read scaling without new technology',
            'JSONB gives a flexibility valve without abandoning SQL',
          ],
          disadvantages: [
            'Horizontal write scaling is manual — sharding is on you',
            'A single primary write path caps write growth',
            'Schema changes on hot tables can lock writes',
          ],
          recommendedFor: [
            'Consistency-critical systems with complex relationships',
            'Small teams that value safety and mature tooling',
            'Workloads whose writes fit one primary for now',
          ],
          deltas: { latency: -5, readThroughput: 10, writeThroughput: -1, infraCost: 5, devComplexity: 2, maintainability: 10 },
          scoring: { context: 3, risk: 4, simplicity: 3, future: -1, scalability: -1, cost: 2 },
          architecture: {
            addNodes: [{ id: 'rep', label: 'Read Replicas', x: 10, y: 120, w: 100, h: 26 }],
            addLinks: [['db', 'rep']],
            removeNodeIds: [],
            removeLinkPairs: [],
            labelOverrides: { db: 'PostgreSQL Cluster' },
          },
          narrative:
            'PostgreSQL anchors the system with real transactions and joins, and read replicas absorb the 10:1 read pattern. Write growth now rests on one primary — manageable at this stage, but a future bottleneck.',
        },
        {
          id: 'mongo',
          title: 'MongoDB',
          subtitle: 'Document · sharded by default · schemaless',
          summary: 'Built for rapid iteration and horizontal write growth.',
          advantages: [
            'Documents match the rapid shape churn of new message types',
            'Horizontal sharding is built in, not bolted on',
            'Scales write throughput with far less custom work',
          ],
          disadvantages: [
            'Joins and cross-document transactions are the app’s problem now',
            'Consistency defaults are weaker — ordering needs discipline',
            'Referential integrity is entirely on the application',
          ],
          recommendedFor: [
            'Fast-iterating teams with document-shaped data',
            'Write-heavy workloads that outgrow one primary quickly',
            'Systems where schema freedom outweighs join ergonomics',
          ],
          deltas: { latency: 0, readThroughput: 6, writeThroughput: 6, infraCost: 6, devComplexity: 8, maintainability: 2 },
          scoring: { context: 2, scalability: 3, future: 2, simplicity: 1, risk: -2, cost: 1 },
          architecture: {
            addNodes: [{ id: 'shards', label: 'Sharded', x: 250, y: 120, w: 80, h: 26 }],
            addLinks: [['db', 'shards']],
            removeNodeIds: [],
            removeLinkPairs: [],
            labelOverrides: { db: 'MongoDB Cluster' },
          },
          narrative:
            'MongoDB shards from day one, absorbing write growth and shape churn. The cost lands on the application: thread joins and read-receipt consistency become hand-built, and ordering guarantees need careful discipline.',
        },
        {
          id: 'cassandra',
          title: 'Cassandra',
          subtitle: 'Wide-column · linear scale · multi-region',
          summary: 'Write throughput at industrial scale — for a price.',
          advantages: [
            'Linear write scaling across nodes and regions',
            'No single point of failure; self-healing rings',
            'Tuned for the huge write volumes messaging can hit',
          ],
          disadvantages: [
            'Query-driven data model — model around access patterns first',
            'No joins, no cross-partition transactions',
            'The steepest learning curve of the three',
          ],
          recommendedFor: [
            'Massive write throughput and multi-region presence',
            'Time-series-like or partitionable access patterns',
            'Teams with the operational expertise to run it',
          ],
          deltas: { latency: 4, readThroughput: 8, writeThroughput: 14, infraCost: 8, devComplexity: 14, maintainability: -5 },
          scoring: { context: 1, scalability: 4, future: 3, simplicity: -2, risk: -1, cost: 2 },
          architecture: {
            addNodes: [{ id: 'ring', label: 'Ring', x: 250, y: 120, w: 80, h: 26 }],
            addLinks: [['db', 'ring']],
            removeNodeIds: [],
            removeLinkPairs: [],
            labelOverrides: { db: 'Cassandra Ring' },
          },
          narrative:
            'Cassandra gives Waveline linear write scaling and multi-region durability — the capacity story is solved. But threads, receipts, and every cross-partition query now have to be modeled into the schema up front, which is a heavy ask for six engineers.',
        },
      ],
    },
    {
      question: 'New message types ship weekly. How do you keep the schema flexible without breaking production?',
      framing: 'Whichever engine you chose, weekly shape churn is the real constraint. Pick the evolution strategy your team can actually sustain.',
      choices: [
        {
          id: 'strict-migrations',
          title: 'Additive Migrations',
          subtitle: 'Reviewable DDL · versioned schema',
          summary: 'Slow, safe, and boring — which is a feature.',
          advantages: [
            'Every schema change is reviewed and reversible',
            'Mature tooling and a clear audit trail',
            'Type safety and referential integrity stay intact',
          ],
          disadvantages: [
            'Every new message type waits on a migration cycle',
            'DDL on hot tables risks locks and downtime',
            'Slower to react when the product changes direction',
          ],
          recommendedFor: [
            'Regulated or consistency-critical domains',
            'Small teams that want guardrails over speed',
            'Systems where a wrong column costs more than a slow week',
          ],
          deltas: { latency: 0, infraCost: 1, devComplexity: 4, maintainability: 10 },
          scoring: { context: 3, risk: 4, simplicity: 3, future: 0, scalability: -1, cost: 2 },
          architecture: {
            addNodes: [{ id: 'mig', label: 'Migration Pipeline', x: 10, y: 66, w: 110, h: 26 }],
            addLinks: [['api', 'mig'], ['mig', 'db']],
            removeNodeIds: [],
            removeLinkPairs: [],
          },
          narrative:
            'A migration pipeline sits in front of the store. Every shape change is a reviewed, versioned step — safe and auditable, but each new message type now carries migration overhead, and hot-table DDL is a real risk during weekly churn.',
        },
        {
          id: 'jsonb',
          title: 'Polymorphic JSONB',
          subtitle: 'Structured core · flexible payload',
          summary: 'Keep the ACID core, park the churn in JSON.',
          advantages: [
            'Ship new message types with zero DDL',
            'Keeps transactions and joins for the stable core',
            'Index the fields that matter, ignore the rest',
          ],
          disadvantages: [
            'Validation moves to the application layer',
            'Nested-field indexes are weaker than relational ones',
            'Bad payloads can slip in and fail at read time',
          ],
          recommendedFor: [
            'Rapid product iteration with polymorphic payloads',
            'Teams that already chose SQL and want a flexibility valve',
            'Systems where the core relations are stable',
          ],
          deltas: { latency: 0, infraCost: 0, devComplexity: 6, maintainability: 6 },
          scoring: { context: 4, simplicity: 2, risk: 3, future: 3, scalability: 0, cost: 2 },
          architecture: {
            addNodes: [{ id: 'jsonb', label: 'JSONB Payloads', x: 10, y: 66, w: 110, h: 26 }],
            addLinks: [['api', 'jsonb'], ['jsonb', 'db']],
            removeNodeIds: [],
            removeLinkPairs: [],
          },
          narrative:
            'A JSONB payload layer absorbs the churn while the relational core stays stable. New message types ship without migrations — the price is that validation now lives in the app, and a bad payload fails at read time, not write time.',
        },
        {
          id: 'schemaless',
          title: 'Schemaless Documents',
          subtitle: 'No migrations · shape defined at runtime',
          summary: 'Total freedom — and total responsibility.',
          advantages: [
            'Maximum flexibility — nothing blocks a shape change',
            'Zero migration overhead or DDL risk',
            'Fits a product that genuinely does not know its shape',
          ],
          disadvantages: [
            'No referential integrity — drift goes unchecked',
            'Every read must handle arbitrary shapes',
            'Hard to reason about what data actually exists',
          ],
          recommendedFor: [
            'Early-stage exploration where shape is truly unknowable',
            'Prototypes that will be thrown away',
            'Isolated subsystems, not the core message store',
          ],
          deltas: { latency: 2, infraCost: 2, devComplexity: 10, maintainability: -4 },
          scoring: { context: 1, simplicity: 1, risk: -3, future: 1, scalability: 1, cost: 1 },
          architecture: {
            addNodes: [{ id: 'schemaless', label: 'Schema Registry', x: 10, y: 66, w: 110, h: 26 }],
            addLinks: [['api', 'schemaless'], ['schemaless', 'db']],
            removeNodeIds: [],
            removeLinkPairs: [],
          },
          narrative:
            'The store becomes fully schemaless with a lightweight schema registry. Nothing blocks a shape change anymore — but integrity checks vanish, reads must tolerate arbitrary shapes, and six engineers now carry the reasoning burden alone.',
        },
      ],
    },
  ],
  review: {
    preferredChoiceIds: ['postgres', 'jsonb'],
    preferredNarrative:
      'I would start with PostgreSQL, not MongoDB or Cassandra. Waveline is six engineers with no DBAs; consistency, joins for threads and receipts, and mature operational tooling matter more right now than the write-scale headroom the others offer. The weekly shape churn gets handled by JSONB — the relational core stays stable while polymorphic message payloads iterate freely. I would add read replicas immediately for the 10:1 read ratio, and I would deliberately re-evaluate when a single primary write path starts saturating: that is the trigger to add sharding or reach for a distributed store, not before. Cassandra’s write scaling is real, but its query-driven model would slow this tiny team to a crawl before they ever hit the scale it solves.',
    lessons: [
      'For a small, fast-moving team, operability and consistency usually beat raw write headroom.',
      'JSONB is a real answer to schema churn — you do not have to choose between SQL and flexibility.',
      'The right time to change databases is when your current one provably stops, not when a conference talk scares you.',
    ],
  },
}

export default scenario
