const scenario = {
  id: 'rest-grpc',
  title: 'REST vs gRPC',
  tag: 'API Paradigms',
  difficulty: 'Architecture',
  summary: 'Pick the internal API paradigm for a logistics platform with strict latency, live streaming, and browser dashboards.',
  brief: {
    company: 'Loopline — real-time logistics platform',
    headline: '40 internal services · fleet telemetry streaming · 3ms budget between services',
    goals: [
      'Stream live fleet telemetry to a monitoring dashboard',
      'Cut internal service-to-service latency to sub-50ms p95',
      'Keep browser dashboards readable and debuggable',
      'Ship new services weekly without reworking contracts',
    ],
    limitations: [
      'Small platform team — one owner per six services',
      'Engineers are JSON + curl native; protobuf is new territory',
      'Observability tooling is HTTP-oriented today',
      'Legacy gateways assume HTTP/1.1 semantics',
    ],
  },
  constraints: [
    { label: 'Latency', weight: 'High', detail: 'Fleet telemetry and order routing demand a tight p95 between services.' },
    { label: 'Streaming', weight: 'High', detail: 'Telemetry arrives as a continuous stream, not a request/response burst.' },
    { label: 'Browser access', weight: 'High', detail: 'Dashboards and partners consume the same data from the browser.' },
    { label: 'Developer experience', weight: 'Medium', detail: 'A thin platform team cannot afford steep contract friction on every change.' },
    { label: 'Debugging', weight: 'Medium', detail: 'Incidents need to be reproducible from a single trace — wires must be inspectable.' },
    { label: 'Existing tooling', weight: 'Medium', detail: 'Current tracing and log pipelines already speak HTTP.' },
  ],
  metrics: {
    latency: { label: 'Latency', unit: 'ms', lowerIsBetter: true, value: 60 },
    bandwidth: { label: 'Bandwidth', unit: 'MB/s', lowerIsBetter: true, value: 100 },
    infraCost: { label: 'Infra Cost', unit: '$k/mo', lowerIsBetter: true, value: 40 },
    devComplexity: { label: 'Dev Complexity', unit: '', lowerIsBetter: true, value: 30 },
    maintainability: { label: 'Maintainability', unit: '', lowerIsBetter: false, value: 55 },
    scalability: { label: 'Scalability', unit: '', lowerIsBetter: false, value: 50 },
  },
  architecture: {
    base: {
      viewBox: '0 0 340 200',
      nodes: [
        { id: 'client', label: 'Clients', x: 10, y: 10, w: 70, h: 26 },
        { id: 'gateway', label: 'API Gateway', x: 130, y: 10, w: 90, h: 26 },
        { id: 'orders', label: 'Orders-Svc', x: 10, y: 120, w: 90, h: 26 },
        { id: 'fleet', label: 'Fleet-Svc', x: 120, y: 120, w: 90, h: 26 },
        { id: 'db', label: 'Warehouse DB', x: 240, y: 120, w: 90, h: 26 },
      ],
      links: [
        ['client', 'gateway'],
        ['gateway', 'orders'],
        ['gateway', 'fleet'],
        ['orders', 'db'],
        ['fleet', 'db'],
      ],
    },
  },
  decisions: [
    {
      question: 'Which API paradigm powers the internal service-to-service layer?',
      framing: 'The chosen paradigm shapes every future service. Judge it against Loopline’s latency, streaming, and team constraints — not in the abstract.',
      choices: [
        {
          id: 'rest',
          title: 'REST',
          subtitle: 'HTTP/1.1 · JSON · resource-oriented',
          summary: 'The default that everyone already knows.',
          advantages: [
            'Debuggable from a browser or curl — every call is inspectable',
            'Zero new tooling; fits the existing HTTP tracing pipeline',
            'Shallowest learning curve for a JSON-native team',
          ],
          disadvantages: [
            'Text overhead inflates bandwidth and latency',
            'No typed contracts — drift is caught at runtime',
            'Weak story for live streaming telemetry',
          ],
          recommendedFor: [
            'Browser-facing edges',
            'Teams optimizing for debuggability over raw speed',
            'Small services that change infrequently',
          ],
          deltas: { latency: 5, bandwidth: 8, infraCost: 3, devComplexity: -8, maintainability: 5, scalability: -4 },
          scoring: { context: 2, simplicity: 4, cost: 3, risk: 3, scalability: -2, future: -2 },
          architecture: { addNodes: [], addLinks: [], removeNodeIds: [], removeLinkPairs: [] },
          narrative:
            'REST keeps the shape you already have. Everyone can debug it, the observability stack stays untouched, and velocity stays high — but the streaming telemetry requirement is left unaddressed, and JSON overhead starts to matter at 40 services.',
        },
        {
          id: 'grpc',
          title: 'gRPC',
          subtitle: 'HTTP/2 · Protobuf · typed contracts',
          summary: 'Fast, typed, streaming — at the cost of a steeper operational curve.',
          advantages: [
            'Binary protobuf cuts latency and bandwidth dramatically',
            'First-class streaming over HTTP/2',
            'Typed contracts make breaking changes compile-time errors',
          ],
          disadvantages: [
            'Wire format is opaque — harder to debug with curl',
            'Protobuf codegen adds friction to the JSON-native team',
            'Browsers cannot call gRPC directly; needs a web layer',
          ],
          recommendedFor: [
            'Internal service-to-service traffic',
            'Streaming payloads and tight latency budgets',
            'Organizations that want contract safety at scale',
          ],
          deltas: { latency: -20, bandwidth: -15, infraCost: -2, devComplexity: 10, maintainability: 12, scalability: 8 },
          scoring: { context: 4, scalability: 4, future: 3, cost: 2, simplicity: -2, risk: 1 },
          architecture: {
            addNodes: [{ id: 'grpc-backbone', label: 'gRPC Backbone', x: 130, y: 66, w: 90, h: 26 }],
            addLinks: [['gateway', 'grpc-backbone'], ['grpc-backbone', 'orders'], ['grpc-backbone', 'fleet']],
            removeNodeIds: [],
            removeLinkPairs: [['gateway', 'orders'], ['gateway', 'fleet']],
          },
          narrative:
            'The gateway now hands traffic to a typed gRPC backbone. Latency and bandwidth drop hard, and contracts become explicit — but the browser dashboards cannot reach it directly, and the team has to climb the protobuf learning curve.',
        },
        {
          id: 'graphql',
          title: 'GraphQL',
          subtitle: 'Single endpoint · schema-driven · client-chosen fields',
          summary: 'A powerful aggregation layer that adds real server complexity.',
          advantages: [
            'Clients request exactly the fields they need — less overfetching',
            'One endpoint aggregates many services',
            'Schema gives clients a self-documenting contract',
          ],
          disadvantages: [
            'Server-side complexity grows fast with many types',
            'Caching and observability are harder on the edge',
            'Not designed for streaming or high-frequency telemetry',
          ],
          recommendedFor: [
            'BFF layers aggregating many services to one client',
            'Mobile and browser apps with complex data shapes',
            'Teams with strong schema governance',
          ],
          deltas: { latency: 2, bandwidth: -12, infraCost: 8, devComplexity: 12, maintainability: 2, scalability: -3 },
          scoring: { context: 2, scalability: -1, simplicity: -1, cost: 1, future: 1, risk: 1 },
          architecture: {
            addNodes: [{ id: 'bff', label: 'GraphQL BFF', x: 130, y: 66, w: 90, h: 26 }],
            addLinks: [['gateway', 'bff'], ['bff', 'orders'], ['bff', 'fleet']],
            removeNodeIds: [],
            removeLinkPairs: [['gateway', 'orders'], ['gateway', 'fleet']],
          },
          narrative:
            'A GraphQL BFF becomes the aggregation point. Clients overfetch less and the schema documents itself — but every new field is a resolver, observability gets murkier, and the streaming telemetry still has no clean home.',
        },
      ],
    },
    {
      question: 'Browser dashboards and partners need live data. How do you expose the edge?',
      framing: 'The internal layer is settled. Now decide how browsers reach it without undoing the work you just did.',
      choices: [
        {
          id: 'rest-edge',
          title: 'REST API Edge',
          subtitle: 'HTTP/JSON for browsers · internal stays as-is',
          summary: 'A translation layer that keeps the internal core clean.',
          advantages: [
            'Browsers and partners get the tooling they already know',
            'The internal architecture stays untouched behind the edge',
            'Simple to debug and cache at the edge',
          ],
          disadvantages: [
            'Two paradigms to maintain — one translation layer to own',
            'Every internal contract change touches the edge too',
            'Slight latency cost from the extra hop',
          ],
          recommendedFor: [
            'Browser-heavy products with partner-facing APIs',
            'Teams that want a clean internal/external boundary',
            'Places where debugability beats micro-optimization',
          ],
          deltas: { latency: 3, bandwidth: 4, infraCost: 2, devComplexity: 6, maintainability: 8, scalability: -2 },
          scoring: { context: 4, simplicity: 3, risk: 3, cost: 3, scalability: -1, future: 1 },
          architecture: {
            addNodes: [{ id: 'rest-edge', label: 'REST Edge', x: 10, y: 66, w: 90, h: 26 }],
            addLinks: [['gateway', 'rest-edge'], ['rest-edge', 'orders'], ['rest-edge', 'fleet']],
            removeNodeIds: [],
            removeLinkPairs: [['gateway', 'orders'], ['gateway', 'fleet']],
          },
          narrative:
            'A REST edge now fronts the browsers while the internal core keeps its chosen paradigm. Clean boundary, familiar external API — at the cost of owning a translation layer.',
        },
        {
          id: 'grpc-web',
          title: 'gRPC-Web Proxy',
          subtitle: 'One typed contract from browser to service',
          summary: 'End-to-end typing, but the browser tools are thinner.',
          advantages: [
            'A single contract spans internal and browser traffic',
            'No separate edge translation to maintain',
            'Stays fast and typed all the way to the browser',
          ],
          disadvantages: [
            'Protobuf tooling in the browser is still maturing',
            'Harder for external partners to consume',
            'Debugging a binary wire from DevTools is painful',
          ],
          recommendedFor: [
            'Internal-only dashboards with strong typed-contract culture',
            'Teams fully invested in the protobuf ecosystem',
            'Systems with few external consumers',
          ],
          deltas: { latency: -6, bandwidth: -8, infraCost: 3, devComplexity: 10, maintainability: 4, scalability: 2 },
          scoring: { context: 3, scalability: 2, simplicity: -2, cost: 2, risk: 1, future: 2 },
          architecture: {
            addNodes: [{ id: 'grpc-web', label: 'gRPC-Web Proxy', x: 130, y: 66, w: 100, h: 26 }],
            addLinks: [['gateway', 'grpc-web'], ['grpc-web', 'orders'], ['grpc-web', 'fleet']],
            removeNodeIds: [],
            removeLinkPairs: [['gateway', 'orders'], ['gateway', 'fleet']],
          },
          narrative:
            'The gRPC contract now extends to the browser through a gRPC-Web proxy. One language across the whole path — but the browser toolchain is thinner and partners find the binary wire hard to consume.',
        },
        {
          id: 'sse',
          title: 'Event Stream (SSE)',
          subtitle: 'Server-sent events · live one-way push',
          summary: 'Live updates for dashboards that must feel real-time.',
          advantages: [
            'Low-latency live push to browsers — no polling',
            'Simple, HTTP-native protocol',
            'Natural fit for the telemetry stream',
          ],
          disadvantages: [
            'Stateful connections complicate scaling and deploys',
            'Edge caching and debugging get harder',
            'Delivering telemetry AND request/response data blurs responsibilities',
          ],
          recommendedFor: [
            'Live monitoring dashboards',
            'Real-time telemetry feeds',
            'Teams with solid connection orchestration',
          ],
          deltas: { latency: -14, bandwidth: 6, infraCost: 6, devComplexity: 12, maintainability: 1, scalability: 8 },
          scoring: { context: 3, scalability: 4, simplicity: -3, cost: 1, risk: -1, future: 3 },
          architecture: {
            addNodes: [{ id: 'sse', label: 'Event Stream (SSE)', x: 60, y: 66, w: 100, h: 26 }],
            addLinks: [['gateway', 'sse'], ['sse', 'orders'], ['sse', 'fleet']],
            removeNodeIds: [],
            removeLinkPairs: [['gateway', 'orders'], ['gateway', 'fleet']],
          },
          narrative:
            'A live event stream now pushes telemetry to dashboards in near-real-time. The dashboards feel alive — but you are now running stateful connections, which changes how you scale, deploy, and debug.',
        },
      ],
    },
  ],
  review: {
    preferredChoiceIds: ['grpc', 'rest-edge'],
    preferredNarrative:
      'I would put gRPC on the internal backbone and a thin REST edge in front of browsers. The streaming telemetry and sub-50ms budget are exactly what gRPC’s HTTP/2 and binary encoding buy you, and typed contracts protect a small team from runtime drift across 40 services. I would not expose gRPC to the browser or to partners — the browser toolchain is not ready, and a REST edge gives external consumers a stable, cacheable, debuggable surface. That hybrid is a bit more to operate, but it is the split that respects both halves of Loopline’s constraints.',
    lessons: [
      'No paradigm is universally right — REST is a debugging and edge win, gRPC is a speed and contract win.',
      'The internal backbone and the external edge can — and often should — be different technologies.',
      'Streaming and strict latency budgets push toward gRPC; browser reach and partner APIs push back toward REST.',
    ],
  },
}

export default scenario
