export const DIMENSIONS = [
  { id: 'fit', label: 'Best-Fit Matching' },
  { id: 'modeling', label: 'Data Modeling' },
  { id: 'performance', label: 'Performance Awareness' },
  { id: 'search', label: 'Search Understanding' },
  { id: 'consistency', label: 'Consistency' },
]

const ENGINES = [
  { id: 'postgres', label: 'PostgreSQL', blurb: 'Relational · ACID transactions' },
  { id: 'mongo', label: 'MongoDB', blurb: 'Document · flexible schema' },
  { id: 'redis', label: 'Redis', blurb: 'In-memory · key-value' },
  { id: 'cassandra', label: 'Cassandra', blurb: 'Wide-column · high write' },
  { id: 'elasticsearch', label: 'Elasticsearch', blurb: 'Inverted index · search' },
  { id: 's3', label: 'S3', blurb: 'Object store · blobs' },
]

export const SCENARIOS = [
  {
    id: 'storefront',
    title: 'Storage for a storefront',
    tag: 'e-commerce',
    difficulty: 'Intermediate',
    summary: 'A growing storefront has five very different data needs. Pick the storage engine that actually fits each one.',
    brief: {
      goals: ['Match each data need to the right engine', 'Respect schema, consistency and access patterns', 'Avoid forcing one database to do every job'],
      constraints: ['The team owns five engines, not one', 'Ledger correctness is non-negotiable', 'Some workloads are write-heavy, some read-heavy'],
    },
    engines: ENGINES,
    workloads: [
      { id: 'telemetry', label: 'Purchase-event stream', description: 'Millions of append-only events per day, read as time-range scans.', best: 'cassandra', acceptable: ['postgres'], dims: ['performance'] },
      { id: 'catalog', label: 'Product catalog', description: 'Nested, constantly evolving attributes per product; no fixed schema.', best: 'mongo', acceptable: ['postgres'], dims: ['modeling'] },
      { id: 'sessions', label: 'Cart & session state', description: 'Sub-millisecond lookups keyed by token, evicted by TTL.', best: 'redis', acceptable: ['mongo'], dims: ['performance'] },
      { id: 'ledger', label: 'Payments ledger', description: 'Double-entry writes that must never be lost or reordered.', best: 'postgres', acceptable: [], dims: ['consistency'] },
      { id: 'search', label: 'Catalog search', description: 'Relevance-ranked keyword search over names and reviews.', best: 'elasticsearch', acceptable: [], dims: ['search'] },
    ],
    reference: {
      narrative: 'Each workload has a shape, and the shape picks the tool. The event stream is append-heavy with range reads, so a wide-column store like Cassandra fits and scales writes horizontally; the catalog’s nested, shifting attributes are a document problem; sessions want an in-memory key-value store with TTL; the ledger demands ACID transactions, which is exactly what a relational engine guarantees; and relevance-ranked keyword search is an inverted-index problem, not something you bend SQL into. Using one database for all five is how teams end up maintaining a search engine inside Postgres.',
      lessons: [
        'Pick storage from the access pattern and consistency need, not popularity.',
        'Flexible schema → document; exact money → relational; hot transient → in-memory.',
        'Range scans on append-heavy data love wide-column stores.',
        'Relevance search belongs to a search engine.',
      ],
    },
  },
  {
    id: 'analytics',
    title: 'Storage for an events platform',
    tag: 'data',
    difficulty: 'Advanced',
    summary: 'A product-analytics platform ingests, stores and serves several distinct datasets. Choose engines by access pattern.',
    brief: {
      goals: ['Separate hot, warm and archival data correctly', 'Serve sub-second dashboard queries', 'Keep raw events durable and cheap'],
      constraints: ['Billions of events per month', 'Dashboards need pre-aggregated fast reads', 'Raw events are rarely re-read but must be retained'],
    },
    engines: ENGINES,
    workloads: [
      { id: 'raw', label: 'Raw event archive', description: 'Cheap, durable retention of billions of immutable event blobs.', best: 's3', acceptable: ['cassandra'], dims: ['performance'] },
      { id: 'counters', label: 'Live counters', description: 'Real-time increments read thousands of times per second.', best: 'redis', acceptable: ['cassandra'], dims: ['performance'] },
      { id: 'agg', label: 'Pre-aggregated metrics', description: 'Grouped rollups queried with filters and joins by the dashboard.', best: 'postgres', acceptable: ['elasticsearch'], dims: ['consistency'] },
      { id: 'logs', label: 'Log explorer', description: 'Full-text search across application logs with facets.', best: 'elasticsearch', acceptable: [], dims: ['search'] },
      { id: 'profiles', label: 'User profiles', description: 'Sparse, per-user attributes that change shape often.', best: 'mongo', acceptable: ['postgres'], dims: ['modeling'] },
    ],
    reference: {
      narrative: 'Data gets cheaper and slower as it cools. Raw events are immutable blobs that are rarely re-read, so object storage is the durable, low-cost home. Live counters are a hot path that wants memory. Pre-aggregated dashboard metrics are relational, filtered and joined, so a relational engine serves them well. The log explorer is full-text search with facets — an inverted-index job. And sparse, evolving user profiles are a document shape. The mistake to avoid is storing raw events in the same relational database that serves dashboards; then retention cost and query load fight each other forever.',
      lessons: [
        'Match storage to temperature: hot in memory, warm relational, cold in object storage.',
        'Immutable blobs belong in object storage, not a row store.',
        'Search and analytics are different query shapes and different engines.',
      ],
    },
  },
]
