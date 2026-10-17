export const DIMENSIONS = [
  { id: 'consistency', label: 'Consistency' },
  { id: 'evolvability', label: 'Evolvability' },
  { id: 'clarity', label: 'Clarity' },
  { id: 'security', label: 'Security' },
  { id: 'performance', label: 'Performance' },
]

export const SCENARIOS = [
  {
    id: 'orders-api',
    title: 'Design an Orders API',
    tag: 'REST',
    difficulty: 'Intermediate',
    summary: 'Design the public HTTP API for an orders service. Each decision adds a rule to the contract you are building.',
    brief: {
      goals: ['A contract external partners can integrate against', 'Consistent, predictable conventions', 'Room to evolve without breaking clients'],
      constraints: ['Partners use many languages and HTTP clients', 'Order lists can grow huge', 'Some writes are retried by flaky clients'],
    },
    base: { role: 'API Designer', system: 'Orders service (public REST API)' },
    decisions: [
      {
        id: 'resource',
        question: 'How should clients address an order?',
        framing: 'This choice sets the whole shape of the API. Think nouns versus verbs, and how predictable the surface stays as it grows.',
        choices: [
          { id: 'rest', label: 'Resource-oriented', subtitle: 'GET /orders/{id}', summary: 'Nouns and HTTP verbs. One predictable pattern for everything.', dims: { clarity: 4, consistency: 4, evolvability: 2, performance: 1 }, contract: ['GET  /orders/{id}', 'GET  /orders?status=&limit=&cursor='], feedback: 'Resource-oriented routes read like the data they expose. Every new resource follows the same pattern, so partners learn the API once.' },
          { id: 'rpc', label: 'Query-parameter RPC', subtitle: 'GET /getOrder?id=', summary: 'Verb-in-the-path endpoints, one per action.', dims: { clarity: -3, consistency: -3, evolvability: -1 }, contract: ['GET  /getOrder?id=…'], feedback: 'Verb endpoints multiply fast and break the predictability partners rely on. It drifts away from HTTP semantics.' },
          { id: 'actions', label: 'Action endpoints', subtitle: 'POST /orders/{id}/approve', summary: 'Model every operation as an explicit action.', dims: { clarity: -1, consistency: -2, evolvability: 1 }, contract: ['POST /orders/{id}/approve'], feedback: 'Action endpoints are legitimate for genuine state transitions, but using them everywhere inflates the surface and blurs the resource model.' },
        ],
      },
      {
        id: 'pagination',
        question: 'How do you expose large order lists?',
        framing: 'Order history grows without bound. The pagination style decides how the API behaves at scale.',
        choices: [
          { id: 'cursor', label: 'Cursor pagination', subtitle: '?cursor=&limit=', summary: 'Opaque cursor into a stable ordering.', dims: { performance: 3, evolvability: 2, clarity: 1, consistency: 1 }, contract: ['Pagination: cursor-based (?cursor=&limit=)'], feedback: 'Cursors stay stable as data shifts and stay fast deep into large datasets.' },
          { id: 'offset', label: 'Offset pagination', subtitle: '?offset=&limit=', summary: 'Simple page numbers.', dims: { performance: -3, consistency: -1, clarity: 1 }, contract: ['Pagination: offset-based (?offset=&limit=)'], feedback: 'Offset paging is easy to call but drifts and slows down as offsets grow — rows shift under the client.' },
          { id: 'all', label: 'Return everything', subtitle: 'No pagination', summary: 'One huge response.', dims: { performance: -4, clarity: -2, consistency: -1 }, contract: ['Pagination: none'], feedback: 'Unbounded responses will fall over on a large account and create a performance cliff you did not plan for.' },
        ],
      },
      {
        id: 'versioning',
        question: 'How will you version the API?',
        framing: 'Partners integrate for years. You need a way to change the contract without breaking them.',
        choices: [
          { id: 'uri', label: 'URI versioning', subtitle: '/v1/orders', summary: 'Version in the path.', dims: { evolvability: 3, clarity: 2, consistency: 1 }, contract: ['Base path: /v1'], feedback: 'A version in the path is explicit and impossible to miss — the strongest signal for a public API.' },
          { id: 'header', label: 'Header versioning', subtitle: 'Accept: application/vnd.orders.v1', summary: 'Version negotiated in headers.', dims: { evolvability: 2, clarity: -1, consistency: 1 }, contract: ['Base path: / (version via Accept header)'], feedback: 'Header versioning is clean but invisible in logs and URLs, which surprises partners and tooling.' },
          { id: 'none', label: 'No versioning', subtitle: 'Just change it', summary: 'Additive changes only, in theory.', dims: { evolvability: -4, consistency: -1 }, contract: ['Base path: / (unversioned)'], feedback: 'Without a version, any breaking change is an outage for someone. Additive-only rarely survives contact with real requirements.' },
        ],
      },
      {
        id: 'errors',
        question: 'What do error responses look like?',
        framing: 'Error handling is where integrations are won or lost. Pick a shape partners can rely on.',
        choices: [
          { id: 'problem', label: 'Problem+JSON', subtitle: 'application/problem+json', summary: 'One documented error schema with stable codes.', dims: { clarity: 3, consistency: 3, evolvability: 1 }, contract: ['Errors: application/problem+json with stable codes'], feedback: 'A single error schema with stable machine-readable codes lets clients branch reliably and humans debug fast.' },
          { id: 'adhoc', label: 'Ad-hoc messages', subtitle: '{ "error": "..." }', summary: 'A message string per endpoint.', dims: { clarity: -1, consistency: -2 }, contract: ['Errors: ad-hoc JSON messages'], feedback: 'Free-text errors force clients to parse prose. They will break the moment you change a wording.' },
          { id: 'always200', label: 'Always 200', subtitle: 'Status in the body', summary: 'Return 200 and signal errors in the payload.', dims: { consistency: -4, clarity: -2, evolvability: -1 }, contract: ['Errors: HTTP 200 with error body'], feedback: 'Hiding errors behind 200 breaks caching, retries, monitoring and every HTTP client’s expectations.' },
        ],
      },
      {
        id: 'auth',
        question: 'How do partners authenticate?',
        framing: 'This is a security decision with real consequences if it is wrong.',
        choices: [
          { id: 'oauth', label: 'OAuth2 Bearer + scopes', subtitle: 'Authorization: Bearer', summary: 'Scoped tokens, standard flow.', dims: { security: 4, evolvability: 1, consistency: 1 }, contract: ['Auth: OAuth2 Bearer tokens with scopes'], feedback: 'Bearer tokens with scopes give least-privilege access and a standard, revocable credential.' },
          { id: 'apikey-header', label: 'API key in header', subtitle: 'X-API-Key', summary: 'Long-lived key per partner.', dims: { security: 1, consistency: 1 }, contract: ['Auth: API key in a request header'], feedback: 'A header key is acceptable for server-to-server use, but keys are coarse and long-lived.' },
          { id: 'apikey-query', label: 'API key in query string', subtitle: '?api_key=', summary: 'Key as a URL parameter.', dims: { security: -4, consistency: -1 }, contract: ['Auth: API key in the query string'], feedback: 'Keys in URLs leak into logs, proxies and browser history. This is a classic credential-exposure path.' },
        ],
      },
      {
        id: 'idempotency',
        question: 'How do you handle retried writes?',
        framing: 'Flaky clients retry. Without protection, a retry can create a duplicate order or double charge.',
        choices: [
          { id: 'idem', label: 'Idempotency-Key header', subtitle: 'Client-supplied key', summary: 'Server dedupes repeated writes.', dims: { consistency: 4, performance: 1 }, contract: ['Writes: Idempotency-Key header on POST'], feedback: 'A client-supplied idempotency key makes retries safe — the same request cannot create two orders.' },
          { id: 'clientid', label: 'Client-generated IDs', subtitle: 'PUT /orders/{clientId}', summary: 'The client chooses the identifier.', dims: { consistency: 2, evolvability: 1 }, contract: ['Writes: client-generated order IDs'], feedback: 'Client-generated IDs are naturally idempotent, but they leak internal identity decisions to clients.' },
          { id: 'none', label: 'No protection', subtitle: 'Trust the client', summary: 'Assume retries do not happen.', dims: { consistency: -4, performance: -1 }, contract: ['Writes: no idempotency protection'], feedback: 'Retries happen — mobile networks guarantee it. Without protection you will ship duplicate orders.' },
        ],
      },
    ],
    reference: {
      preferredIds: ['rest', 'cursor', 'uri', 'problem', 'oauth', 'idem'],
      narrative: 'I would build a resource-oriented, URI-versioned surface with cursor pagination, one documented error schema, OAuth2 scoped tokens, and idempotency keys on writes. Each choice protects the same thing: a contract partners can integrate once and trust for years. The tempting shortcuts — query-string keys, always-200 errors, unpaginated lists — all shift cost onto clients or onto security.',
      lessons: [
        'Predictability is the product: nouns, verbs and one error shape.',
        'Paginate for the dataset you will have, not the one you have today.',
        'Never put credentials in a URL.',
        'Make retries safe at the protocol level with idempotency keys.',
      ],
    },
  },
  {
    id: 'payments-api',
    title: 'Design a Payments API',
    tag: 'Fintech',
    difficulty: 'Advanced',
    summary: 'Design the core endpoints for a payments service where correctness and safety outweigh convenience.',
    brief: {
      goals: ['Never double-charge', 'Keep sensitive card data out of scope', 'Be precise about money'],
      constraints: ['Clients retry aggressively', 'Regulatory scope is expensive', 'Money must be exact to the cent'],
    },
    base: { role: 'Payments Engineer', system: 'Payments service (public REST API)' },
    decisions: [
      {
        id: 'money',
        question: 'How is a monetary amount represented?',
        framing: 'This is the single most common source of money bugs. Get it right.',
        choices: [
          { id: 'minor', label: 'Integer minor units', subtitle: 'amount: 1999, currency: "usd"', summary: 'Cents as integers with an explicit currency.', dims: { consistency: 4, clarity: 2 }, contract: ['Money: integer minor units + ISO currency code'], feedback: 'Integer minor units are exact. Floating point cannot represent 0.10, and money is not a place to round.' },
          { id: 'float', label: 'Floating point', subtitle: 'amount: 19.99', summary: 'A decimal float with currency.', dims: { consistency: -4, clarity: -1 }, contract: ['Money: floating-point amount'], feedback: 'Floats drift: 0.1 + 0.2 is not 0.3. Over thousands of transactions that is real money lost.' },
          { id: 'string', label: 'Decimal string', subtitle: 'amount: "19.99"', summary: 'A string the server parses exactly.', dims: { consistency: 2, clarity: 2 }, contract: ['Money: decimal string amount'], feedback: 'A decimal string avoids float error, but it pushes parsing and validation onto every client — integer minor units are harder to misuse.' },
        ],
      },
      {
        id: 'pci',
        question: 'How does the API handle card data?',
        framing: 'Handling raw card numbers pulls you into the full PCI scope. There is a well-worn way out.',
        choices: [
          { id: 'tokenize', label: 'Tokenize on the client', subtitle: 'client → PSP → token', summary: 'Card data never touches your servers.', dims: { security: 4, consistency: 2 }, contract: ['Card data: tokenized client-side; card tokens only'], feedback: 'Letting the payment provider hold the card keeps raw PANs off your servers and keeps you in the smallest possible compliance scope.' },
          { id: 'proxy', label: 'Proxy through your servers', subtitle: 'POST /cards', summary: 'Accept and forward card numbers.', dims: { security: -4, consistency: -1 }, contract: ['Card data: posted to your API'], feedback: 'Accepting card numbers drags the entire system into PCI-DSS scope — audits, encryption, network segmentation. Avoid it.' },
          { id: 'store', label: 'Store card numbers', subtitle: 'Save for later', summary: 'Keep PANs for future charges.', dims: { security: -4, consistency: -2 }, contract: ['Card data: stored by your service'], feedback: 'Storing PANs is the highest-risk option and the hardest to defend. Never do it if you can tokenize.' },
        ],
      },
      {
        id: 'idempotency',
        question: 'How do you prevent double charges on retry?',
        framing: 'Payment clients retry on timeout, and a timeout does not mean the charge failed.',
        choices: [
          { id: 'idem', label: 'Required Idempotency-Key', subtitle: 'Reject writes without one', summary: 'Dedupe every payment attempt.', dims: { consistency: 4, security: 1 }, contract: ['Writes: mandatory Idempotency-Key + stored result'], feedback: 'Making the key mandatory removes the foot-gun entirely: a retried charge returns the original result instead of charging twice.' },
          { id: 'optional', label: 'Optional Idempotency-Key', subtitle: 'Honor it if present', summary: 'Clients may opt in.', dims: { consistency: 1 }, contract: ['Writes: optional Idempotency-Key'], feedback: 'Optional keys help careful clients but leave careless ones exposed to exactly the failure you are trying to prevent.' },
          { id: 'none', label: 'No idempotency', subtitle: 'Each request charges', summary: 'Trust clients to not retry.', dims: { consistency: -4, security: -1 }, contract: ['Writes: no idempotency'], feedback: 'In payments this is not a trade-off — it is a guaranteed double-charge incident waiting on the first network blip.' },
        ],
      },
      {
        id: 'webhooks',
        question: 'How do you notify clients of payment events?',
        framing: 'Clients need to know when money moves. Events are how they find out.',
        choices: [
          { id: 'signed', label: 'Signed webhooks', subtitle: 'HMAC signature header', summary: 'Signed events with retries.', dims: { security: 3, consistency: 2, evolvability: 2 }, contract: ['Events: signed webhooks with HMAC + retries'], feedback: 'Signing lets clients verify the event really came from you, and retries plus an events endpoint cover missed deliveries.' },
          { id: 'poll', label: 'Polling only', subtitle: 'GET /payments?since=', summary: 'No push; clients poll.', dims: { performance: -1, consistency: 1, evolvability: 1 }, contract: ['Events: polling endpoint'], feedback: 'Polling works and is simple, but pushes latency and load onto every client and slows down their reconciliation.' },
          { id: 'unsigned', label: 'Unsigned webhooks', subtitle: 'Fire and forget', summary: 'Plain POSTs to client URLs.', dims: { security: -4, consistency: -1 }, contract: ['Events: unsigned webhooks'], feedback: 'Unsigned webhooks can be forged. Clients cannot tell your event from an attacker’s.' },
        ],
      },
      {
        id: 'ratelimit',
        question: 'What happens when a client floods the API?',
        framing: 'One misbehaving integration must not take down payments for everyone.',
        choices: [
          { id: 'limit', label: 'Rate limits + 429', subtitle: 'Retry-After header', summary: 'Per-client limits with backpressure.', dims: { consistency: 3, performance: 2, clarity: 1 }, contract: ['Limits: per-client rate limits, Retry-After on 429'], feedback: 'Rate limits with a Retry-After header give clients a clear, actionable signal and protect the platform.' },
          { id: 'none', label: 'No limits', subtitle: 'Accept everything', summary: 'Let it ride.', dims: { consistency: -3, performance: -2 }, contract: ['Limits: none'], feedback: 'Without limits, one runaway client degrades everyone — and payments degrade into an incident.' },
          { id: 'queue', label: 'Silently queue everything', subtitle: 'Absorb the flood', summary: 'No signal to the client.', dims: { consistency: 1, performance: -1, clarity: -2 }, contract: ['Limits: unbounded internal queueing'], feedback: 'Queueing without backpressure just moves the failure later and hides it from the client, who cannot adapt.' },
        ],
      },
    ],
    reference: {
      preferredIds: ['minor', 'tokenize', 'idem', 'signed', 'limit'],
      narrative: 'For payments I optimize for correctness and safety over convenience. Money is integer minor units with an explicit currency. Card data never touches my servers — it is tokenized by the provider, keeping me out of PCI scope. Every write requires an idempotency key, because a timeout does not mean a failure. Events are signed so clients can trust them, and rate limits with Retry-After protect the platform from any one integration. Each of these is a place where the convenient choice is the dangerous one.',
      lessons: [
        'Represent money as exact integers, never floats.',
        'Push sensitive data outside your boundary to shrink compliance scope.',
        'In payments, idempotency is mandatory, not optional.',
        'Backpressure (429 + Retry-After) is a feature for clients, not just protection for you.',
      ],
    },
  },
]
