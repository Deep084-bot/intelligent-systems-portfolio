import memoryLeak from './memory-leak'
import databaseSlowdown from './database-slowdown'
import apiTimeout from './api-timeout'

const comingSoon = [
  { id: 'db-connection-leak', title: 'Connection Leak', tag: 'Production Incident', difficulty: 'Incident debugging', comingSoon: true },
  { id: 'deadlock', title: 'Database Deadlock', tag: 'Database', difficulty: 'Concurrency', comingSoon: true },
  { id: 'queue-backlog', title: 'Queue Backlog', tag: 'Async', difficulty: 'Throughput', comingSoon: true },
  { id: 'dns-failure', title: 'DNS Resolution Failure', tag: 'Infrastructure', difficulty: 'Networking', comingSoon: true },
]

export const SCENARIOS = [memoryLeak, databaseSlowdown, apiTimeout, ...comingSoon]

export const PLAYABLE = SCENARIOS.filter((s) => !s.comingSoon)
