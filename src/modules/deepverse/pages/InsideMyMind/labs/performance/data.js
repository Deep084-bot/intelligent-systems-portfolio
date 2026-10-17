export const DIMENSIONS = [
  { id: 'latency', label: 'Latency' },
  { id: 'cost', label: 'Cost Efficiency' },
  { id: 'simplicity', label: 'Simplicity' },
  { id: 'scalability', label: 'Scalability' },
  { id: 'resilience', label: 'Resilience' },
]

export const SCENARIOS = [
  {
    id: 'checkout-p95',
    title: 'Checkout API at 1.4s',
    tag: 'e-commerce',
    difficulty: 'Intermediate',
    summary: 'Checkout p95 is 1.4s and customers are abandoning carts. Apply optimizations within a cost and complexity budget.',
    brief: {
      goals: ['Bring p95 latency under 200ms', 'Stay inside the $90/mo infra budget', 'Do not blow up operational complexity'],
      constraints: ['Postgres primary is already at 90% CPU', 'Peak traffic handles 3k req/s', 'One small platform team maintains this'],
    },
    target: 200,
    budget: { cost: 90, complexity: 45 },
    baseline: { latency: 1400, cpu: 92, cost: 35, complexity: 20 },
    moves: [
      { id: 'db-index', label: 'Add composite index', description: 'Index the (user_id, status) access path used on every checkout read.', deltas: { latency: -430, cpu: -22, cost: 0, complexity: 5 }, dims: { latency: 12, cost: 6, simplicity: -3, scalability: 4, resilience: 4 } },
      { id: 'redis-cache', label: 'Redis read-through cache', description: 'Cache cart and product reads with a 60s TTL.', deltas: { latency: -520, cpu: -30, cost: 25, complexity: 9 }, dims: { latency: 16, cost: -4, simplicity: -8, scalability: 10, resilience: 8 } },
      { id: 'pagination', label: 'Paginate order history', description: 'Stop returning unbounded order lists to the client.', deltas: { latency: -160, cpu: -8, cost: 0, complexity: 4 }, dims: { latency: 6, cost: 5, simplicity: -2, scalability: 6, resilience: 2 } },
      { id: 'async-logging', label: 'Async, sampled logging', description: 'Move writes to a background queue and sample verbose logs.', deltas: { latency: -140, cpu: -14, cost: 4, complexity: 3 }, dims: { latency: 5, cost: 4, simplicity: 2, scalability: 3, resilience: 1 } },
      { id: 'conn-pool', label: 'Tune connection pool', description: 'Right-size the pool to the database’s concurrency ceiling.', deltas: { latency: -120, cpu: 10, cost: 0, complexity: 3 }, dims: { latency: 4, cost: 6, simplicity: 1, scalability: 3, resilience: 3 } },
      { id: 'cdn-static', label: 'Serve assets from CDN', description: 'Offload static and image traffic from the API tier.', deltas: { latency: -70, cpu: -6, cost: 12, complexity: 2 }, dims: { latency: 3, cost: -2, simplicity: 1, scalability: 4, resilience: 2 } },
      { id: 'denormalize', label: 'Denormalize totals table', description: 'Precompute cart totals to avoid joins on the hot path.', deltas: { latency: -360, cpu: -12, cost: 3, complexity: 18 }, dims: { latency: 10, cost: 3, simplicity: -14, scalability: 5, resilience: -6 } },
      { id: 'sync-downstream', label: 'Synchronous webhook per order', description: 'Call the fulfilment webhook inline before responding.', deltas: { latency: 260, cpu: 8, cost: 2, complexity: 6 }, dims: { latency: -14, cost: 1, simplicity: -6, scalability: -8, resilience: -10 } },
      { id: 'vertical', label: 'Resize the database up', description: 'Throw a bigger instance at the primary.', deltas: { latency: -300, cpu: -35, cost: 40, complexity: 1 }, dims: { latency: 8, cost: -12, simplicity: -2, scalability: -4, resilience: 2 } },
    ],
    reference: {
      narrative: 'I would add the composite index and tune the connection pool first — they are nearly free wins that attack the 90% CPU directly. A short-TTL Redis cache absorbs the read burst for the steepest latency drop, pagination and async logging remove avoidable work, and a CDN keeps static load off the API. I would avoid denormalization and the synchronous webhook: one buys latency at a real consistency and complexity cost, the other adds latency on the hottest path. Vertical resizing is a band-aid that hides the problem and blows the budget.',
      lessons: [
        'Cheapest wins first: indexes and query shape usually dominate.',
        'A cache is the single biggest latency lever — but it adds a consistency surface.',
        'Watch for moves that “help” latency while quietly raising cost or complexity.',
        'Adding a synchronous dependency to the hot path makes things worse, not better.',
      ],
    },
  },
  {
    id: 'feed-latency',
    title: 'Feed API cold-start spikes',
    tag: 'social',
    difficulty: 'Advanced',
    summary: 'The feed API is fine at steady state but p95 explodes after deploys and cache flushes. Optimize without masking the cause.',
    brief: {
      goals: ['Keep p95 under 250ms even after a cold cache', 'Reduce database load during spikes', 'Keep the read path simple to reason about'],
      constraints: ['Read-heavy: 40:1 reads to writes', 'Fan-out reads hit 5 services', 'Cache misses stampede the origin'],
    },
    target: 250,
    budget: { cost: 70, complexity: 40 },
    baseline: { latency: 900, cpu: 78, cost: 30, complexity: 18 },
    moves: [
      { id: 'request-coalescing', label: 'Request coalescing', description: 'Deduplicate concurrent cache misses for the same key.', deltas: { latency: -300, cpu: -18, cost: 0, complexity: 6 }, dims: { latency: 12, cost: 8, simplicity: 1, scalability: 8, resilience: 9 } },
      { id: 'stale-while-revalidate', label: 'Stale-while-revalidate', description: 'Serve slightly stale data while refreshing in the background.', deltas: { latency: -420, cpu: -10, cost: 0, complexity: 7 }, dims: { latency: 15, cost: 6, simplicity: -3, scalability: 7, resilience: 5 } },
      { id: 'warm-cache', label: 'Warm cache before deploy', description: 'Pre-populate hot keys before shifting traffic.', deltas: { latency: -260, cpu: -8, cost: 5, complexity: 5 }, dims: { latency: 9, cost: 3, simplicity: -2, scalability: 4, resilience: 6 } },
      { id: 'read-replica', label: 'Add read replicas', description: 'Spread read traffic across replicas.', deltas: { latency: -180, cpu: -30, cost: 22, complexity: 6 }, dims: { latency: 6, cost: -4, simplicity: -3, scalability: 9, resilience: 6 } },
      { id: 'bigger-cache', label: 'Grow the cache tier', description: 'Fit more of the working set in memory.', deltas: { latency: -200, cpu: -12, cost: 34, complexity: 2 }, dims: { latency: 7, cost: -12, simplicity: 1, scalability: 3, resilience: 2 } },
      { id: 'long-ttl', label: 'Raise TTL to 10 minutes', description: 'Fewer refreshes, staler data.', deltas: { latency: -150, cpu: -6, cost: 0, complexity: 1 }, dims: { latency: 5, cost: 5, simplicity: 2, scalability: 2, resilience: -8 } },
      { id: 'sync-fanout', label: 'Serialize the fan-out calls', description: 'Await each downstream service in order.', deltas: { latency: 220, cpu: 6, cost: 0, complexity: 3 }, dims: { latency: -10, cost: 2, simplicity: 2, scalability: -7, resilience: -6 } },
    ],
    reference: {
      narrative: 'The spike is a stampede, so I would fix the stampede: request coalescing plus stale-while-revalidate removes the thundering herd and lets a cold cache degrade gracefully instead of cascading. Warming the cache before deploys plus read replicas spreads origin load. I would resist simply growing the cache tier — it buys time but not the fix — and raising the TTL trades correctness for a metric. Serializing the fan-out would make the tail worse.',
      lessons: [
        'A cold-start spike is usually a stampede, not raw capacity.',
        'Serving stale data briefly is often better than a slow or failed request.',
        'Buying more cache is a delaying tactic; coalescing removes the cause.',
      ],
    },
  },
]
