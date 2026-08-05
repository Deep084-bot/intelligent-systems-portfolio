import restGrpc from './rest-grpc'
import sqlNosql from './sql-nosql'
import redisMemcached from './redis-memcached'

const comingSoon = [
  { id: 'polling-websockets', title: 'Polling vs WebSockets', tag: 'Realtime', difficulty: 'Realtime patterns', comingSoon: true },
  { id: 'monolith-microservices', title: 'Monolith vs Microservices', tag: 'Architecture', difficulty: 'Service boundaries', comingSoon: true },
  { id: 'kafka-rabbitmq', title: 'Kafka vs RabbitMQ', tag: 'Message Brokers', difficulty: 'Streaming', comingSoon: true },
  { id: 'sync-async', title: 'Synchronous vs Async', tag: 'API Patterns', difficulty: 'Request handling', comingSoon: true },
]

export const SCENARIOS = [restGrpc, sqlNosql, redisMemcached, ...comingSoon]

export const PLAYABLE = SCENARIOS.filter((s) => !s.comingSoon)
