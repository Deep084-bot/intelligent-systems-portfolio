const scenario = {
  id: 'auth-retry',
  title: 'Auth Retry Storm',
  tag: 'Production Incident',
  difficulty: 'Incident debugging',
  summary: 'A timeout storm hits the API. Every signal says the system is healthy — except latency.',
  framing: {
    role: 'Senior Backend Engineer',
    system: 'API Gateway → Auth Service → 4 downstream services',
    headline: '500k req/min · p99 1.2s ↑ · users timing out',
  },
  evidence: {
    situation:
      'Latency spiked 20 minutes ago. CPU normal. Memory normal. Database healthy. Users are reporting timeouts and the 5xx rate is climbing.',
    logs: [
      'gateway  | upstream timeout after 10.0s (auth-svc)',
      'gateway  | 5xx rate 4.2% and rising',
      'auth-svc | request queue depth 8,400',
    ],
    metrics: {
      'Requests/min': '500,000',
      'p99 latency': '1.2s ↑',
      CPU: 'normal',
      Memory: 'normal',
      Database: 'healthy',
    },
    architecture: {
      viewBox: '0 0 320 160',
      nodes: [
        { id: 'clients', label: 'Clients', x: 10, y: 10, w: 80, h: 28 },
        { id: 'gw', label: 'API Gateway', x: 120, y: 10, w: 100, h: 28 },
        { id: 'auth', label: 'Auth', x: 120, y: 66, w: 80, h: 28 },
        { id: 'user', label: 'User-Svc', x: 20, y: 122, w: 90, h: 28 },
        { id: 'orders', label: 'Orders', x: 115, y: 122, w: 90, h: 28 },
        { id: 'pay', label: 'Payments', x: 210, y: 122, w: 90, h: 28 },
      ],
      links: [
        ['clients', 'gw'],
        ['gw', 'auth'],
        ['auth', 'user'],
        ['auth', 'orders'],
        ['auth', 'pay'],
      ],
    },
    extra: [
      {
        id: 'auth-logs',
        label: 'Auth Service Logs',
        type: 'logs',
        lines: [
          'auth-svc | user-svc retry attempt #12 (no backoff cap)',
          'auth-svc | user-svc retry attempt #13 (no backoff cap)',
          'auth-svc | thread pool saturated, rejecting work',
        ],
      },
      {
        id: 'auth-config',
        label: 'Auth Config',
        type: 'logs',
        lines: [
          'retry.count = 30',
          'retry.backoff = fixed 200ms',
          'circuit_breaker = disabled',
        ],
      },
    ],
  },
  nodes: {
    start: {
      prompt: 'What do you investigate first?',
      choices: [
        {
          id: 'scale',
          label: 'Increase replicas',
          scoring: { prioritization: -3, evidence: -2, risk: -1 },
          outcome: '+20 replicas deployed. Latency unchanged. The 5xx rate keeps climbing.',
          effect: { replicas: '+20', latency: 'unchanged' },
          next: 'start',
        },
        {
          id: 'trace',
          label: 'Look at tracing',
          scoring: { prioritization: 3, evidence: 3, risk: 1 },
          outcome: 'Auth service is retrying endlessly against user-svc. That is the storm.',
          unlockEvidence: ['auth-logs'],
          next: 'root-cause',
        },
        {
          id: 'rollback',
          label: 'Rollback deployment',
          scoring: { prioritization: -1, evidence: -2, risk: 2 },
          outcome: 'No deployment in the last 24h. Nothing to roll back.',
          next: 'start',
        },
        {
          id: 'cache',
          label: 'Check cache',
          scoring: { evidence: 1, incremental: 1 },
          outcome: 'Cache hit ratio is normal. Not cache-related.',
          next: 'start',
        },
      ],
    },
    'root-cause': {
      prompt: 'The auth service is retrying endlessly. What do you check next?',
      choices: [
        {
          id: 'config',
          label: 'Inspect auth retry config',
          scoring: { evidence: 3, prioritization: 2 },
          outcome: 'retry.count = 30, fixed 200ms, circuit breaker disabled. No cap, no backoff.',
          unlockEvidence: ['auth-config'],
          next: 'fix',
        },
        {
          id: 'user-health',
          label: 'Check user-svc health',
          scoring: { evidence: 1 },
          outcome: 'user-svc is healthy. The retries are the problem, not user-svc.',
          next: 'fix',
        },
        {
          id: 'scale-auth',
          label: 'Scale auth instances',
          scoring: { prioritization: -2, risk: -1 },
          outcome: 'More instances, same retries — the storm continues.',
          next: 'fix',
        },
      ],
    },
    fix: {
      prompt: 'The retry storm is the root cause. What is the right fix?',
      choices: [
        {
          id: 'circuit',
          label: 'Add circuit breaker + bounded retries',
          scoring: { tradeoffs: 3, risk: 3, prioritization: 2 },
          outcome: 'Retries stop cascading. Latency returns to baseline.',
          next: 'verify',
        },
        {
          id: 'config-fix',
          label: 'Deploy bounded retry config now',
          scoring: { prioritization: 2, incremental: 2 },
          outcome: 'Retries capped at 3 with exponential backoff. Recovery begins.',
          next: 'verify',
        },
        {
          id: 'kill-switch',
          label: 'Kill auth traffic',
          scoring: { risk: -2, tradeoffs: -2 },
          outcome: 'Latency drops — but nobody can log in. Trading one outage for another.',
          next: 'verify',
        },
      ],
    },
    verify: {
      prompt: 'The incident is resolving. How do you confirm it is truly resolved?',
      choices: [
        {
          id: 'latency-check',
          label: 'Watch p99 return to baseline',
          scoring: { evidence: 2, incremental: 2 },
          outcome: 'p99 back to 180ms. 5xx at 0.1%. Resolved.',
          next: 'conclusion',
        },
        {
          id: 'deep-check',
          label: 'Verify retries stopped and latency is normal',
          scoring: { evidence: 3, risk: 1 },
          outcome: 'Retries stopped, p99 at baseline, queue drained. Resolved cleanly.',
          next: 'conclusion',
        },
      ],
    },
  },
  end: {
    recommendedApproach:
      'I would start with tracing, not scaling. When CPU, memory, and the database all look healthy, the bottleneck is almost never capacity — it is a dependency behaving badly. Tracing shows the full request path in one screen, so you find the retry storm instead of guessing. Scaling treats the symptom; the fix is capping retries and adding a circuit breaker so one service can never take the rest of the system down with it.',
    lessons: [
      'Healthy CPU, memory, and database is a strong signal the problem is a dependency, not capacity.',
      'Check tracing before scaling — scaling a storm just spreads it.',
      'Retries without a cap and a circuit breaker are how one slow service becomes an outage.',
    ],
  },
}

export default scenario
