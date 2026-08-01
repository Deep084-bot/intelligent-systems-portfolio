import authRetry from './auth-retry'
import trafficSpike from './traffic-spike'
import postgresMigration from './postgres-migration'

const comingSoon = [
  { id: 'api-versioning', title: 'Payments API Versioning', tag: 'API Design', difficulty: 'API design', comingSoon: true },
  { id: 'cache-invalidation', title: 'Cache Invalidation', tag: 'Cache Failure', difficulty: 'Debugging', comingSoon: true },
  { id: 'pipeline-failure', title: 'Data Pipeline Failure', tag: 'Pipeline', difficulty: 'Debugging', comingSoon: true },
  { id: 'queue-backlog', title: 'Message Queue Backlog', tag: 'Queue', difficulty: 'Scaling', comingSoon: true },
  { id: 'auth-outage', title: 'Authentication Outage', tag: 'Incident', difficulty: 'Incident response', comingSoon: true },
]

export const SCENARIOS = [authRetry, trafficSpike, postgresMigration, ...comingSoon]

export const PLAYABLE = SCENARIOS.filter((s) => !s.comingSoon)
