---
title: Designing Distributed Systems - A Case Study
slug: distributed-systems-case-study
date: 2024-05-10
author: Deep Mehta
featured: false
readingTime: 15
audience: education
educational: true
tags:
  - Distributed Systems
  - Architecture
  - Case Study
  - Consensus
excerpt: Deep dive into CAP theorem, consensus algorithms, and designing systems that survive failures. Lessons from building a distributed cache.
---

_Note: This case study is an educational write-up. Design examples are used to explain trade-offs; they are illustrative rather than claims of large-scale production deployment._

# Designing Distributed Systems: A Case Study

This is a technical deep-dive into the principles and practices of building systems that span multiple machines, with real examples from my distributed cache project.

## The Fundamental Problem

When you have multiple machines, you face three core challenges:

1. **Consistency**: All nodes agree on the state
2. **Availability**: System responds to requests
3. **Partition Tolerance**: System works when network is broken

**The CAP theorem says you can only pick two.**

This forces you to make hard trade-offs:

```
┌─────────────────────────────────────┐
│          CA Systems                 │
│  (Consistent + Available)           │
│  - Single region (no partitions)    │
│  - Traditional databases            │
│  - Example: PostgreSQL in LAN       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│          AP Systems                 │
│  (Available + Partition Tolerant)   │
│  - Multi-region                     │
│  - Eventual consistency             │
│  - Example: Distributed Cache       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│          CP Systems                 │
│  (Consistent + Partition Tolerant)  │
│  - Blocks requests during partition │
│  - Example: Raft consensus          │
└─────────────────────────────────────┘
```

## Consistency Models Explained

### Strong Consistency
All reads return the latest write:

```
Client writes: set(key, value=10)
Client reads:  get(key) → returns 10 immediately
```

Problem: Requires all nodes to acknowledge, slow.

### Eventual Consistency
Reads eventually return latest write:

```
Node A writes: set(key, value=10)
Node B reads:  get(key) → might return 5 (stale)
[After replication]
Node B reads:  get(key) → returns 10 (consistent)
```

Problem: Reads can return stale data.

### Causal Consistency
Causally related operations are ordered:

```
User posts comment: "Great post!"
User reads own comment: sees it immediately
Other users: might not see it yet
```

## Consensus Algorithms

How do distributed nodes agree on state? Answer: consensus algorithms.

### Raft Consensus (Simplified)

Raft elects a leader who coordinates writes:

```javascript
// Simplified Raft pseudocode
class RaftNode {
  constructor(id) {
    this.id = id;
    this.role = 'follower'; // follower, candidate, or leader
    this.term = 0;
    this.log = []; // sequence of commands
    this.commitIndex = 0;
  }

  handleHeartbeat(leaderTerm) {
    if (leaderTerm > this.term) {
      this.term = leaderTerm;
      this.role = 'follower';
      // Reset election timeout
      this.resetElectionTimeout();
    }
  }

  onElectionTimeout() {
    // No heartbeat from leader, start election
    this.term++;
    this.role = 'candidate';
    this.votedFor = this.id;
    
    // Ask other nodes for votes
    this.broadcast('RequestVote', { term: this.term });
  }

  handleAppendEntries(term, leaderId, entries) {
    if (term >= this.term) {
      this.term = term;
      this.role = 'follower';
      // Append entries to log
      this.log.push(...entries);
    }
  }
}
```

**Key properties:**
- One leader per term
- Log replication from leader to followers
- Safety: committed entries never rolled back
- Liveness: eventually makes progress

### Paxos vs Raft

| Property | Paxos | Raft |
|----------|-------|------|
| Complexity | Hard to understand | Easier |
| Performance | Similar | Similar |
| Implementation | Rare in practice | Common |
| Understandability | Worse | Better |

Raft won in practice because developers could actually implement it correctly.

## My Distributed Cache Implementation

Here's how I applied these principles to build a consistent distributed cache:

### Architecture

```
┌─────────────────┐
│   Client        │
│  (Requests)     │
└────────┬────────┘
         │
┌────────┴────────┐
│ Consistent Hash │ ← Routes request to responsible node
└────────┬────────┘
         │
    ┌────┴────┬────────┬────────┐
    │          │        │        │
  Node-1    Node-2   Node-3   Node-4
 (Leader)  (Replicas for key)
```

Each data key is replicated across 3 nodes:
- Node with min hash: primary
- Next 2 nodes: replicas

### Write Path (Strong Consistency within replicas)

```javascript
// Client writes: cache.set('user:123', userData)

// 1. Route to primary node
const hash = consistentHash('user:123');
const primaryNode = ring.get(hash);

// 2. Primary writes locally and replicates
await primaryNode.write('user:123', userData);

// 3. Primary sends to replicas
const replicas = ring.getNext(hash, 2);
const promises = replicas.map(n => 
  n.replicate('user:123', userData)
);
await Promise.all(promises);

// 4. Client ack only after quorum confirms
return { success: true };
```

### Read Path (Eventual Consistency)

```javascript
// Client reads: cache.get('user:123')

const hash = consistentHash('user:123');
const primaryNode = ring.get(hash);

// Read from any replica (fastest response)
const replicas = ring.getNext(hash, 3);
const response = await Promise.race(
  replicas.map(n => n.read('user:123'))
);

return response; // Might be stale, but fast!
```

This design:
- **Availability**: Always responds (replicas available)
- **Partition Tolerance**: Works across network splits
- **Consistency**: Strong within replica set (AP overall)

## Handling Failures

What happens when Node-2 dies?

```
Before:
  Node-1 (Primary) 
    │
    ├─ Node-2 (Replica) ← DIES!
    └─ Node-3 (Replica)

After detection (5s timeout):
  Node-1 (Primary)
    │
    ├─ Node-4 (New replica)
    └─ Node-3 (Replica)
```

Process:
1. Heartbeat from Node-2 fails
2. Primary marks Node-2 as dead
3. Primary picks next node in ring (Node-4)
4. Replicates data to Node-4
5. Other nodes get informed of new topology

**Downtime: 5-10 seconds** (acceptable for cache)

## Lessons Learned

1. **Consistency is hard**: Don't implement Raft yourself in production
2. **Use existing tools**: Etcd, Consul, or CockroachDB for consensus
3. **Test failure modes**: Chaos engineering is critical
4. **Monitor replication lag**: Know your consistency guarantees
5. **CAP is a real choice**: Understand your trade-offs

## Further Reading

- "Designing Data-Intensive Applications" - Martin Kleppmann
- Raft consensus paper: https://raft.github.io/
- Google's Spanner paper on distributed transactions

Distributed systems is one of the hardest areas of backend engineering. Master it, and you can build anything.
