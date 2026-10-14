const scenario = {
  id: 'redis-memcached',
  title: 'Redis vs Memcached',
  tag: 'Caching Layer',
  difficulty: 'Cache selection',
  summary: 'Choose the caching engine for a high-read marketplace — sessions, catalog JSON, and ranked product lists all compete for memory.',
  brief: {
    company: 'Cortex — online marketplace',
    headline: '20M catalog items · 15k sessions/s peak · 300ms page SLA',
    goals: [
      'Hold product pages under 200ms at peak',
      'Sessions survive deploy restarts without kicking users out',
      'Keep cache hit ratio at or above 95%',
      'Cut hot-path load on the product database',
    ],
    limitations: [
      'Small SRE team — every new system must be operable',
      'In-memory spend is already high; budgets are watched',
      'Several pages need ranked and aggregated data, not just JSON',
      'Multi-AZ availability is a hard requirement',
    ],
  },
  constraints: [
    { label: 'Sessions', weight: 'High', detail: 'Need TTL and atomic updates; losing them logs users out mid-session.' },
    { label: 'Rich data', weight: 'High', detail: 'Ranked product lists and aggregates — not just plain key/value.' },
    { label: 'Failover', weight: 'High', detail: 'Cache loss at peak must not take the marketplace down.' },
    { label: 'Memory cost', weight: 'Medium', detail: 'Infra budget is real; per-key overhead adds up at 20M items.' },
    { label: 'Simplicity', weight: 'Medium', detail: 'A small SRE team must be able to run it under load.' },
    { label: 'Durability tolerance', weight: 'Low', detail: 'The cache can be rebuilt from the DB — but sessions cannot wait for a rebuild.' },
  ],
  metrics: {
    latency: { label: 'Cache Latency', unit: 'μs', lowerIsBetter: true, value: 300 },
    throughput: { label: 'Throughput', unit: 'k ops/s', lowerIsBetter: false, value: 200 },
    memoryEfficiency: { label: 'Mem Efficiency', unit: '', lowerIsBetter: false, value: 55 },
    durability: { label: 'Durability', unit: '', lowerIsBetter: false, value: 20 },
    infraCost: { label: 'Infra Cost', unit: '$k/mo', lowerIsBetter: true, value: 12 },
    opsComplexity: { label: 'Ops Complexity', unit: '', lowerIsBetter: true, value: 20 },
  },
  architecture: {
    base: {
      viewBox: '0 0 340 200',
      nodes: [
        { id: 'client', label: 'Clients', x: 10, y: 10, w: 70, h: 26 },
        { id: 'edge', label: 'API Edge', x: 130, y: 10, w: 90, h: 26 },
        { id: 'cache', label: 'Cache Layer', x: 120, y: 120, w: 100, h: 26 },
        { id: 'db', label: 'Product DB', x: 10, y: 120, w: 90, h: 26 },
      ],
      links: [
        ['client', 'edge'],
        ['edge', 'cache'],
        ['edge', 'db'],
        ['cache', 'db'],
      ],
    },
  },
  decisions: [
    {
      question: 'Which cache engine anchors the hot path?',
      framing: 'Cortex needs fast reads, survivable sessions, and ranked data — under an SRE budget that hates complexity.',
      choices: [
        {
          id: 'redis',
          title: 'Redis',
          subtitle: 'In-memory data structures · persistence · replication',
          summary: 'More than a cache — a data structure server with failover.',
          advantages: [
            'Native hashes, sorted sets, and lists for ranked catalog data',
            'Persistence and replication make sessions survivable',
            'Atomic operations keep session updates race-free',
          ],
          disadvantages: [
            'Heavier per-key memory overhead than Memcached',
            'Single-threaded core — high raw-throughput ceilings are lower',
            'More moving parts to operate than a pure cache',
          ],
          recommendedFor: [
            'Systems needing data structures, not just key/value',
            'Session stores that must survive restarts',
            'Places where failover matters more than peak raw ops',
          ],
          deltas: { latency: -50, throughput: 40, memoryEfficiency: -8, durability: 45, infraCost: 4, opsComplexity: 6 },
          scoring: { context: 3, scalability: 2, future: 4, simplicity: 1, risk: 3, cost: -1 },
          architecture: {
            addNodes: [{ id: 'replica', label: 'Replica', x: 250, y: 120, w: 80, h: 26 }],
            addLinks: [['cache', 'replica']],
            removeNodeIds: [],
            removeLinkPairs: [],
            labelOverrides: { cache: 'Redis' },
          },
          narrative:
            'Redis anchors the hot path with rich data structures and a replica for failover. Sessions become survivable and ranked lists become native — but per-key overhead is higher, and the single-threaded core sets a ceiling on raw throughput.',
        },
        {
          id: 'memcached',
          title: 'Memcached',
          subtitle: 'Pure key/value · multi-threaded · LRU',
          summary: 'Blazing fast, brutally simple, and disposable by design.',
          advantages: [
            'Multi-threaded — the highest raw throughput of the three',
            'Minimal per-key overhead for the same memory spend',
            'Dead simple to operate — it just stores bytes',
          ],
          disadvantages: [
            'No data structures — ranked lists are on the application',
            'No persistence, no replication — sessions die on restart',
            'LRU eviction is the only eviction policy',
          ],
          recommendedFor: [
            'Pure key/value hot paths with huge throughput needs',
            'Caches that are safe to rebuild instantly from the DB',
            'Teams that want the absolute simplest cache to run',
          ],
          deltas: { latency: -80, throughput: 90, memoryEfficiency: 8, durability: -5, infraCost: -2, opsComplexity: -3 },
          scoring: { context: 2, scalability: 2, simplicity: 4, cost: 2, risk: -2, future: -2 },
          architecture: {
            addNodes: [{ id: 'pool', label: 'Multi-node', x: 250, y: 120, w: 80, h: 26 }],
            addLinks: [['cache', 'pool']],
            removeNodeIds: [],
            removeLinkPairs: [],
            labelOverrides: { cache: 'Memcached Pool' },
          },
          narrative:
            'A multi-node Memcached pool delivers the rawest throughput and cheapest memory. But it is a pure key/value store — ranked catalog data moves to the application, and losing a node mid-session logs users out.',
        },
        {
          id: 'dual',
          title: 'Dual-tier Cache',
          subtitle: 'Memcached for hot KV · Redis for rich data',
          summary: 'The best of both — if you can operate two systems.',
          advantages: [
            'Hot key/value at Memcached speed, rich data in Redis',
            'Each engine does what it is best at',
            'Graceful degradation — Redis still covers sessions',
          ],
          disadvantages: [
            'Two systems to operate, tune, and monitor',
            'Cache coherence across tiers is a real problem',
            'Higher infra cost and operational surface',
          ],
          recommendedFor: [
            'Workloads that genuinely split hot-KV and rich-data',
            'Large teams with dedicated caching expertise',
            'Scale levels where the extra ops cost is affordable',
          ],
          deltas: { latency: -90, throughput: 80, memoryEfficiency: -2, durability: 40, infraCost: 8, opsComplexity: 12 },
          scoring: { context: 4, scalability: 3, simplicity: -3, cost: -2, risk: -2, future: 2 },
          architecture: {
            addNodes: [{ id: 'hot', label: 'Memcached (hot)', x: 250, y: 120, w: 100, h: 26 }],
            addLinks: [['cache', 'hot']],
            removeNodeIds: [],
            removeLinkPairs: [],
            labelOverrides: { cache: 'Dual-tier Cache' },
          },
          narrative:
            'A dual-tier cache splits the work: Memcached serves hot key/value at peak speed while Redis handles sessions and ranked data. It maximizes raw performance — but now two systems must stay coherent and both must be operated.',
        },
      ],
    },
    {
      question: 'Sessions and ranked product lists both need memory. How do you serve them?',
      framing: 'The engine is settled. Now decide how sessions and ranked lists actually live inside it.',
      choices: [
        {
          id: 'native-structures',
          title: 'Native Structures',
          subtitle: 'Hashes for sessions · sorted sets for rankings',
          summary: 'Let the engine do the thinking.',
          advantages: [
            'Atomic session updates and O(log n) rank queries built in',
            'Rankings recompute in-cache without a round trip to the app',
            'TTL applies at the field level for granular control',
          ],
          disadvantages: [
            'Binds you to engine-specific semantics',
            'More memory consumed by structure overhead',
            'App code gets more complex than a plain get/set',
          ],
          recommendedFor: [
            'Data that is naturally structured — sessions, scores, lists',
            'Systems that already run Redis and own its semantics',
            'Places where atomicity inside the cache beats app-side logic',
          ],
          deltas: { latency: -30, throughput: -10, memoryEfficiency: -5, durability: 0, infraCost: 2, opsComplexity: 4 },
          scoring: { context: 4, simplicity: -1, risk: 2, future: 4, cost: 1, scalability: 1 },
          architecture: {
            addNodes: [{ id: 'struct', label: 'Hashes + Sorted Sets', x: 10, y: 66, w: 120, h: 26 }],
            addLinks: [['edge', 'struct'], ['struct', 'cache']],
            removeNodeIds: [],
            removeLinkPairs: [],
          },
          narrative:
            'Sessions become hashes and rankings become sorted sets, served atomically from the cache. The engine does the heavy lifting — but you now depend on its semantics and pay structure overhead for the privilege.',
        },
        {
          id: 'serialize',
          title: 'Serialized KV',
          subtitle: 'Everything is a string · app does the parsing',
          summary: 'Engine-agnostic, maximally simple, low overhead.',
          advantages: [
            'Works identically on any cache engine',
            'Lowest possible memory overhead per entry',
            'Keeps the cache layer dumb and boring',
          ],
          disadvantages: [
            'Every update is read-modify-write — race-prone',
            'Ranked lists must be recomputed and stored whole',
            'Loses granular TTL and atomicity',
          ],
          recommendedFor: [
            'Mostly-read payloads that rarely mutate in place',
            'Teams that want the cache to stay an interchangeable layer',
            'Key/value workloads with simple shapes',
          ],
          deltas: { latency: 5, throughput: 10, memoryEfficiency: 4, infraCost: -1, opsComplexity: 2 },
          scoring: { context: 2, simplicity: 4, cost: 3, risk: 2, future: -2, scalability: 0 },
          architecture: {
            addNodes: [{ id: 'kv', label: 'Serialized KV', x: 10, y: 66, w: 110, h: 26 }],
            addLinks: [['edge', 'kv'], ['kv', 'cache']],
            removeNodeIds: [],
            removeLinkPairs: [],
          },
          narrative:
            'Everything is serialized into plain keys. The cache stays interchangeable and memory-efficient — but sessions become read-modify-write races and ranked lists get recomputed and stored wholesale.',
        },
        {
          id: 'write-through',
          title: 'Write-Through Rebuild',
          subtitle: 'Cache as projection · rebuilt from DB events',
          summary: 'Treat the cache as a disposable projection, refreshed from the source.',
          advantages: [
            'Cache content is always explainable — it is a projection',
            'Survives eviction and restarts by rebuilding from events',
            'Ranked lists rebuild consistently from one source of truth',
          ],
          disadvantages: [
            'Event consumers and rebuild jobs add real complexity',
            'Stale windows between the DB change and the rebuild',
            'Initial warm-up of 20M items is a project in itself',
          ],
          recommendedFor: [
            'Systems with a clean event stream from the source of truth',
            'Cache contents that can be derived, not authored',
            'Teams comfortable operating consumers and rebuild jobs',
          ],
          deltas: { latency: 0, throughput: -5, durability: 15, infraCost: 3, opsComplexity: 8 },
          scoring: { context: 3, simplicity: -2, risk: 3, future: 2, cost: 1, scalability: 2 },
          architecture: {
            addNodes: [{ id: 'wt', label: 'Write-Through Rebuild', x: 10, y: 66, w: 120, h: 26 }],
            addLinks: [['edge', 'wt'], ['wt', 'cache']],
            removeNodeIds: [],
            removeLinkPairs: [],
          },
          narrative:
            'The cache becomes a projection rebuilt from database events. Every entry is explainable and recoverable — at the cost of consumers, rebuild jobs, and a warm-up project for 20M items.',
        },
      ],
    },
  ],
  review: {
    preferredChoiceIds: ['redis', 'native-structures'],
    preferredNarrative:
      'I would run Redis for both sessions and ranked catalog data, using native hashes and sorted sets. Cortex’s real constraints are session survivability and ranked lists — and raw Memcached speed does not help with either. Sessions stored as hashes with TTL survive restarts and update atomically; sorted sets make rankings an in-cache operation instead of an application rebuild. I would skip the dual-tier design: two systems, coherence bugs, and double the ops cost do not buy Cortex anything it actually needs at this scale. The memory overhead of Redis is the price I would pay — and it is a fair price for not logging users out when a node dies.',
    lessons: [
      'Choose a cache for the shape of your data and your failover needs, not for the biggest benchmark number.',
      'Raw throughput rarely matters when the bottleneck is session correctness or ranked-list complexity.',
      'A dual-tier cache only pays off when the extra operations cost is genuinely affordable.',
    ],
  },
}

export default scenario
