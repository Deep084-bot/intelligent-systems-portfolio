export const DIMENSIONS = [
  { id: 'capacity', label: 'Capacity' },
  { id: 'availability', label: 'Availability' },
  { id: 'cost', label: 'Cost Efficiency' },
  { id: 'resilience', label: 'Resilience' },
  { id: 'simplicity', label: 'Operational Simplicity' },
]

export const SCENARIOS = [
  {
    id: 'photo-app',
    title: 'Scale a photo app to 400k users',
    tag: 'consumer',
    difficulty: 'Intermediate',
    summary: 'A single server powers a photo-sharing app at 15k users. Grow capacity to 400k while holding 99.9% availability inside a cost budget.',
    brief: {
      goals: ['Serve 400,000 users at peak', 'Hold ≥ 99.9% availability', 'Keep p95 under 300ms', 'Stay under $260/mo'],
      constraints: ['One origin server today', 'Uploads are bursty and heavy', 'A single failure must not take the app down'],
    },
    maxLoad: 400000,
    budget: { cost: 260, complexity: 40 },
    target: { availability: 99.9, latency: 300 },
    baseline: { capacity: 15000, latency: 120, cost: 40, complexity: 10, availability: 99.0 },
    moves: [
      { id: 'vertical', label: 'Resize the server up', description: 'A bigger box buys headroom but keeps a single point of failure.', adds: { capacity: 15000, cost: 30, complexity: 1 }, dims: { capacity: 4, cost: -6, resilience: -6, simplicity: -1, availability: -2 } },
      { id: 'load-balancer', label: 'Load balancer + 3 replicas', description: 'Horizontal scale and remove the single point of failure.', adds: { capacity: 60000, cost: 45, complexity: 4 }, dims: { capacity: 10, availability: 10, resilience: 9, cost: -4, simplicity: 1 } },
      { id: 'read-replicas', label: 'Read replicas', description: 'Offload the read-heavy feed to replicas.', adds: { capacity: 40000, cost: 40, complexity: 4 }, dims: { capacity: 8, availability: 5, resilience: 6, cost: -2, simplicity: 1 } },
      { id: 'cache', label: 'Shared Redis cache', description: 'Absorb hot reads in front of the database.', adds: { capacity: 90000, cost: 35, complexity: 6 }, dims: { capacity: 12, availability: 4, resilience: 4, cost: 3, simplicity: -3 } },
      { id: 'cdn', label: 'CDN for photos', description: 'Serve and cache media at the edge.', adds: { capacity: 50000, cost: 30, complexity: 3 }, dims: { capacity: 8, availability: 4, resilience: 4, cost: 4, simplicity: -1 } },
      { id: 'sharding', label: 'Shard the database', description: 'Split data across nodes for near-unlimited capacity — at real operational cost.', adds: { capacity: 150000, cost: 70, complexity: 16 }, dims: { capacity: 16, availability: 6, resilience: -4, cost: -10, simplicity: -14 } },
      { id: 'queue', label: 'Async upload queue', description: 'Decouple heavy uploads from the request path.', adds: { capacity: 25000, cost: 20, complexity: 5 }, dims: { capacity: 5, availability: 6, resilience: 8, cost: 2, simplicity: -2 } },
      { id: 'autoscale', label: 'Autoscaling group', description: 'Match capacity to live traffic.', adds: { capacity: 30000, cost: 15, complexity: 3 }, dims: { capacity: 6, availability: 3, resilience: 5, cost: 8, simplicity: -1 } },
      { id: 'single-db-tune', label: 'Tune the single database', description: 'Indexes and buffers on the one origin — deepens the single point of failure.', adds: { capacity: 20000, cost: 5, complexity: 2 }, dims: { capacity: 5, cost: 5, resilience: -8, availability: -6, simplicity: 0 } },
    ],
    reference: {
      narrative: 'I would build out horizontally: a load-balanced replica set removes the single point of failure and adds the base capacity, a CDN serves photos cheaply at the edge, a shared cache absorbs hot reads, and an autoscaling group matches traffic. Sharding is the last resort — it offers the most capacity but is the most operationally expensive thing you can do, and it does not help availability. I would avoid leaning harder on a single database: it is the exact failure mode the app cannot afford.',
      lessons: [
        'Availability is an architecture choice, not a bigger server.',
        'The cheapest capacity usually lives at the edge and in cache.',
        'Sharding is powerful and expensive — reach for it last.',
        'Cost and complexity are the hidden budgets in every scaling plan.',
      ],
    },
  },
  {
    id: 'ticketing',
    title: 'Survive a ticket-sale stampede',
    tag: 'commerce',
    difficulty: 'Advanced',
    summary: 'A concert on-sale drives 300k people to a ticketing app in 60 seconds. Keep it alive and fast without overspending all year.',
    brief: {
      goals: ['Absorb 300,000 users in one minute', 'Never oversell inventory', 'Hold p95 under 200ms', 'Keep standing cost under $180/mo'],
      constraints: ['Traffic is spiky, not steady', 'Inventory must stay exactly correct', 'Overspending on capacity wastes the whole budget'],
    },
    maxLoad: 300000,
    budget: { cost: 180, complexity: 36 },
    target: { availability: 99.9, latency: 200 },
    baseline: { capacity: 8000, latency: 90, cost: 30, complexity: 8, availability: 99.2 },
    moves: [
      { id: 'queue-waiting-room', label: 'Virtual waiting room', description: 'Queue arrivals and admit them at a controlled rate.', adds: { capacity: 120000, cost: 25, complexity: 6 }, dims: { capacity: 14, availability: 10, resilience: 9, cost: 6, simplicity: -4 } },
      { id: 'autoscale', label: 'Aggressive autoscaling', description: 'Ramp up for the spike, then scale back down.', adds: { capacity: 90000, cost: 20, complexity: 3 }, dims: { capacity: 8, availability: 4, resilience: 6, cost: 10, simplicity: -1 } },
      { id: 'lb', label: 'Load-balanced web tier', description: 'Spread HTTP load across stateless instances.', adds: { capacity: 50000, cost: 35, complexity: 4 }, dims: { capacity: 9, availability: 8, resilience: 8, cost: -2, simplicity: 1 } },
      { id: 'cache-inventory-read', label: 'Cache inventory reads', description: 'Serve stock counts from cache — must invalidate carefully.', adds: { capacity: 60000, cost: 25, complexity: 7 }, dims: { capacity: 9, availability: 3, resilience: -2, cost: 4, simplicity: -5 } },
      { id: 'reserve-atomic', label: 'Atomic reservation in the DB', description: 'A single transaction decrements stock — correct but serialized.', adds: { capacity: 15000, cost: 10, complexity: 3 }, dims: { capacity: 4, availability: 4, resilience: 5, cost: 3, simplicity: 1 } },
      { id: 'shard', label: 'Shard inventory by event', description: 'Partition hot events across databases.', adds: { capacity: 110000, cost: 60, complexity: 15 }, dims: { capacity: 15, availability: 5, resilience: -3, cost: -10, simplicity: -13 } },
      { id: 'static-queue-page', label: 'Static, CDN-served queue page', description: 'Keep the wait page alive even if the app tier struggles.', adds: { capacity: 30000, cost: 12, complexity: 2 }, dims: { capacity: 6, availability: 8, resilience: 7, cost: 6, simplicity: 0 } },
      { id: 'always-max', label: 'Pre-provision for peak all year', description: 'Run peak capacity permanently — simple, but wasteful.', adds: { capacity: 300000, cost: 150, complexity: 1 }, dims: { capacity: 18, availability: 6, resilience: 5, cost: -18, simplicity: 4 } },
    ],
    reference: {
      narrative: 'A ticket stampede is a queueing problem first: a virtual waiting room plus a CDN-served queue page keeps everyone alive while you admit traffic at a rate the core can survive. Aggressive autoscaling and a load-balanced web tier add capacity exactly when it is needed, and an atomic reservation keeps inventory exact. I would not cache inventory reads without extreme care, and I would never pre-provision peak capacity for the whole year — autoscaling exists precisely so a 60-second spike does not become a 12-month bill.',
      lessons: [
        'Spiky traffic calls for queueing and elasticity, not permanent capacity.',
        'Correctness rules (inventory) constrain which caching is allowed.',
        'A cheap static page can keep users alive when the core is saturated.',
      ],
    },
  },
]
