import authMiddleware from './scenarios/auth-middleware'
import reactDashboard from './scenarios/react-dashboard'
import databaseRepository from './scenarios/database-repository'

const comingSoon = [
  { id: 'graphql-resolver', title: 'GraphQL Resolver', tag: 'GraphQL', difficulty: 'N+1 + auth', comingSoon: true },
  { id: 'file-upload-service', title: 'File Upload Service', tag: 'Node.js', difficulty: 'Security + storage', comingSoon: true },
  { id: 'notification-worker', title: 'Notification Worker', tag: 'Queues', difficulty: 'Reliability', comingSoon: true },
  { id: 'api-pagination', title: 'API Pagination', tag: 'REST', difficulty: 'API design', comingSoon: true },
  { id: 'cache-invalidation', title: 'Cache Invalidation', tag: 'Redis', difficulty: 'Consistency', comingSoon: true },
]

export const SCENARIOS = [authMiddleware, reactDashboard, databaseRepository, ...comingSoon]

export const PLAYABLE = SCENARIOS.filter((s) => !s.comingSoon)
