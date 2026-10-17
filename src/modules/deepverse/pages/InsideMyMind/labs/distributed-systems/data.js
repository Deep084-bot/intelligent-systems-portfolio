export const N = 3
export const MAJORITY = Math.floor(N / 2) + 1

export const DIMENSIONS = [
  { id: 'consistency', label: 'Consistency' },
  { id: 'availability', label: 'Availability' },
  { id: 'partition', label: 'Partition Tolerance' },
  { id: 'durability', label: 'Durability' },
  { id: 'simplicity', label: 'Operational Simplicity' },
]

export const GUARANTEES = [
  { id: 'durability', label: 'No acknowledged write is ever lost' },
  { id: 'strongReads', label: 'Reads are strongly consistent' },
  { id: 'partitionAvailable', label: 'Stays available through a network partition' },
  { id: 'leaderLoss', label: 'Survives the loss of any single node' },
  { id: 'noConflicts', label: 'Never has to resolve write conflicts' },
]

export const TOPOLOGIES = [
  { id: 'sync', label: 'Single-leader, synchronous', blurb: 'One leader; writes ack only after replicas confirm.' },
  { id: 'async', label: 'Single-leader, asynchronous', blurb: 'One leader; replicas catch up in the background.' },
  { id: 'multi', label: 'Multi-leader', blurb: 'Every region accepts writes; conflicts must be resolved.' },
  { id: 'quorum', label: 'Leaderless, quorum reads/writes', blurb: 'Clients read and write to a quorum of replicas.' },
]

export function evaluate(id, W, R) {
  const intersect = R + W > N
  const quorumOk = W <= MAJORITY && R <= MAJORITY
  switch (id) {
    case 'sync':
      return {
        durability: true, strongReads: true, partitionAvailable: false, leaderLoss: true, noConflicts: true,
        notes: {
          durability: 'The write is acknowledged only once replicas have it.',
          strongReads: 'Reads served by the leader see the latest ack.',
          partitionAvailable: 'A leader cut off from the majority stops accepting writes.',
          leaderLoss: 'An election promotes a new leader.',
          noConflicts: 'There is only ever one writer.',
        },
      }
    case 'async':
      return {
        durability: false, strongReads: false, partitionAvailable: false, leaderLoss: true, noConflicts: true,
        notes: {
          durability: 'A leader crash can lose writes that were acked but not replicated.',
          strongReads: 'Followers lag, so reads can be stale.',
          partitionAvailable: 'The minority side cannot accept writes.',
          leaderLoss: 'Failover works, but recently acked writes may vanish.',
          noConflicts: 'Still a single writer.',
        },
      }
    case 'multi':
      return {
        durability: true, strongReads: false, partitionAvailable: true, leaderLoss: true, noConflicts: false,
        notes: {
          durability: 'Each region persists its own accepted writes.',
          strongReads: 'Regions converge eventually, not immediately.',
          partitionAvailable: 'Every region keeps accepting writes on its own.',
          leaderLoss: 'No leader to lose — every region writes.',
          noConflicts: 'Concurrent writes to the same key must be reconciled.',
        },
      }
    case 'quorum':
    default:
      return {
        durability: W >= MAJORITY, strongReads: intersect, partitionAvailable: quorumOk, leaderLoss: true, noConflicts: true,
        notes: {
          durability: W >= MAJORITY ? `W=${W} ≥ majority, so an ack is durable.` : `W=${W} < majority — an ack can be lost.`,
          strongReads: intersect ? `R+W=${R + W} > N, so read and write sets overlap.` : `R+W=${R + W} ≤ N — reads can miss the latest write.`,
          partitionAvailable: quorumOk ? 'The majority side can still form both quorums.' : 'A quorum larger than the majority side blocks operations.',
          leaderLoss: 'Any node can be replaced without a leader election.',
          noConflicts: 'Last-write-wins keeps a single value per key.',
        },
      }
  }
}

export function topoDims(id, W, R) {
  const intersect = R + W > N
  const base = {
    sync: { consistency: 92, availability: 38, partition: 30, durability: 95, simplicity: 72 },
    async: { consistency: 45, availability: 55, partition: 35, durability: 50, simplicity: 80 },
    multi: { consistency: 45, availability: 92, partition: 95, durability: 76, simplicity: 35 },
    quorum: { consistency: 55, availability: 78, partition: 86, durability: 58, simplicity: 30 },
  }[id] || {}
  if (id === 'quorum') {
    base.consistency = Math.max(0, Math.min(100, base.consistency + (intersect ? 35 : -15)))
    base.durability = Math.max(0, Math.min(100, base.durability + (W >= MAJORITY ? 24 : -20)))
    base.availability = Math.max(0, Math.min(100, base.availability + (W <= MAJORITY ? 8 : -25)))
  }
  return base
}

export const SCENARIOS = [
  {
    id: 'ledger',
    title: 'A bank ledger across regions',
    tag: 'finance',
    difficulty: 'Advanced',
    summary: 'Money must never be wrong. Choose a replication strategy that holds correctness before convenience.',
    brief: {
      goals: ['Never lose a confirmed transaction', 'Reads must see the latest committed balance', 'Survive any single node failure'],
      constraints: ['Correctness beats availability', 'Regulators dislike unexplained discrepancies', 'A slow-but-correct system is acceptable'],
    },
    required: ['durability', 'strongReads', 'leaderLoss'],
    preferred: ['sync', 'quorum'],
    reference: {
      narrative: 'For money I would take synchronous single-leader replication, or a leaderless quorum with R+W>N and W≥majority. Both make an acknowledged write durable and make reads see the latest commit. The trade is availability: when a partition splits the leader from the majority, writes stop — and that is the correct behavior for a ledger. Multi-leader is out: conflicting writes to the same account are exactly what a ledger must never allow.',
      lessons: [
        'When correctness is non-negotiable, accept lower availability.',
        'R + W > N gives strong reads in a leaderless design.',
        'Multi-leader trades consistency for availability and demands conflict handling.',
        'A synchronous write is durable precisely because it waits.',
      ],
    },
  },
  {
    id: 'social-feed',
    title: 'A global social feed',
    tag: 'consumer',
    difficulty: 'Intermediate',
    summary: 'A feed must stay up worldwide through network splits. Choose replication that favors availability.',
    brief: {
      goals: ['Keep accepting posts during a partition', 'Never lose an accepted post', 'Tolerate losing any single node'],
      constraints: ['Users accept eventual consistency', 'Downtime is worse than a slightly stale feed', 'Regions write independently'],
    },
    required: ['partitionAvailable', 'durability', 'leaderLoss'],
    preferred: ['multi', 'quorum'],
    reference: {
      narrative: 'A feed can trade strictness for uptime. Multi-leader replication lets every region keep accepting posts through a partition, and a conflict strategy (like last-write-wins per post) is fine when posts are independent. A leaderless quorum tuned for availability also works. A single-leader design is the wrong shape here: the moment the leader is cut off, writes stop — and for a feed, downtime is the worse failure.',
      lessons: [
        'Availability-first systems accept eventual consistency.',
        'Multi-leader exists to keep every region writable.',
        'Conflicts are cheap when the data is independent (posts, not balances).',
        'Choose the failure you can live with, then design for it.',
      ],
    },
  },
]
