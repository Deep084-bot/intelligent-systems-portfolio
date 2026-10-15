# QA & Regression Scripts

Regression checks live as standalone `*-qa.mjs` scripts at the repository root
and are run manually with Node. There is no `npm test` runner.

## Prerequisites

- Node 18+ (developed on Node 26).
- `npm install` — pulls `puppeteer-core` (browser suites) as a declared
  devDependency. `esbuild` (used to bundle the logic suites) is not a declared
  dependency; it is available transitively through Vite and provides the
  `./node_modules/.bin/esbuild` binary used below.
- The browser suites additionally need a running dev server and Google Chrome.

## Pure-logic suites

These import application modules directly. Because the app uses extensionless
relative imports, a suite must be bundled with esbuild before running:

```sh
./node_modules/.bin/esbuild pet-v11-qa.mjs --bundle --platform=node --format=esm \
  --outfile=/tmp/pet-v11-qa.bundle.mjs && node /tmp/pet-v11-qa.bundle.mjs
```

| Script | Covers | Checks | Needs bundling |
| --- | --- | --- | --- |
| `pet-v11-qa.mjs` | DeepPet behaviour/logic | 104 | yes |
| `music-v12-qa.mjs` | Music Lab engine/queue | 132 | yes |
| `brain-decision-logic.test.mjs` | Brain OS decision logic | 27 | yes |
| `cosmos-qa.mjs` | Cosmos helpers | 71 | no — plain `node cosmos-qa.mjs` |
| `memory-store.test.mjs` | Assistant memory store/schema/status + durability/retention | 82 | no — plain `node memory-store.test.mjs` |
| `p2-memory.test.mjs` | Memory retrieval/assembly, anon-vs-owner isolation + chat integration | 62 | no — plain `node p2-memory.test.mjs` |
| `p3-memory.test.mjs` | Explicit memory commands + owner-gated API + chat wiring | 78 | no — plain `node p3-memory.test.mjs` |
| `p4-conversations.test.mjs` | Persisted conversations, rolling summaries, owner-gated continuity | 59 | no — plain `node p4-conversations.test.mjs` |
| `p5-behavior.test.mjs` | Scope enforcement, Java-default DSA, behavior/recall/injection directives, markdown sanitization | 55 | no — plain `node p5-behavior.test.mjs` |

`memory-store.test.mjs` exercises `server/memory/schema.js`,
`server/memory/store.js`, and the read-only `GET /api/memory/status` route. It
runs against the in-memory cache backend and needs no server, network, or
database:

```sh
node memory-store.test.mjs
```

`p2-memory.test.mjs` covers `server/memory/assemble.js`, the prompt builder/budget,
conversation-history de-duplication (`src/hooks/history.js`), and an end-to-end
`POST /api/ai/chat` run with a mocked provider (a local HTTP endpoint wired via
`GROQ_ENDPOINT`) and a controlled in-memory memory store. No API keys or live
provider required:

```sh
node p2-memory.test.mjs
```

`p3-memory.test.mjs` covers the explicit memory commands: the deterministic
parser (`server/memory/commands.js`), the internal service
(`server/memory/service.js` — remember/update/forget/inspect/wipe, idempotency,
supersession, ambiguity, and no-false-success on storage failure), the
owner-gated HTTP surface (`server/routes/memory.js`), and chat wiring in
`server/routes/ai.js` that refuses owner memory for public traffic without
calling the provider. Owner endpoints are exercised with a test-only middleware
that injects a verified owner identity; there is no authentication in the app, so
public traffic is always refused (403). No API keys or live provider required:

```sh
node p3-memory.test.mjs
```

`p4-conversations.test.mjs` covers persisted conversation continuity
(`server/memory/conversation.js`), rolling summaries
(`server/memory/summarize.js`), context budgeting, and the owner-gated chat
integration (conversations are read/persisted only for a verified owner). It uses
the same mocked provider + in-memory cache harness, so no API keys required:

```sh
node p4-conversations.test.mjs
```

`p5-behavior.test.mjs` covers the assistant behavior layer: deterministic scope
classification and refusal with NO provider call (`server/prompt/scope.js`),
Java-default DSA language intent (with explicit overrides and provided-code
preservation), the always-on behavior/recall/injection directives in the system
prompt, budget-safe prompt building (`server/prompt/builder.js`,
`server/prompt/budget.js`), and markdown/syntax-highlight sanitization
(`src/components/ai/markdownSchema.js` — highlight classes survive, scripts are
stripped). No API keys required:

```sh
node p5-behavior.test.mjs
```

### Owner memory is disabled by default

Because the app has no authentication, owner memory inspection/mutation is gated
off by default (`server/memory/access.js`). Enabling the HTTP surface requires
BOTH `MEMORY_OWNER_ENABLED=true` AND a trusted upstream middleware that attaches
a verified owner identity to the request (`req.memoryOwner`). A client-supplied
`userId` is never accepted as identity, and public chat commands are always
answered with a deterministic refusal that never reads or writes memory.

## Browser suites (DeepPet)

Client-side visual/interaction checks using `puppeteer-core` driving real
Chrome. Start the dev server first (default `http://localhost:5173`, configured
in `vite.config.js`):

```sh
npm run dev
```

Then run, from the repo root:

```sh
node deeppet-orbit-qa.mjs
node deeppet-expressions-qa.mjs
node deeppet-interactions-qa.mjs
```

### Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `DEEPPET_QA_BASE_URL` | `http://localhost:5173` | App under test. Set if the dev server falls back to another port. |
| `DEEPPET_QA_CHROME` | `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` | Chrome executable. |
| `DEEPPET_QA_SHOTS` | a temp dir | Screenshot output for the expressions suite (kept out of the repo). |

### What they cover

- **`deeppet-orbit-qa.mjs`** (11 checks) — the orbiting motes stay inside the SVG
  viewBox and hug the pet in every context: embedded (440px), floating (135px),
  Hub preview (64px) and reduced-motion. Guards the regression where the motes
  were transformed about the SVG origin instead of the pet centre and got
  clipped off-frame.
- **`deeppet-expressions-qa.mjs`** (10 checks) — all six expressions apply to the
  world pet, every pair is visibly distinct at 64/150/440px (≥1.5% of pixels
  differ), and cycling them raises no runtime errors.
- **`deeppet-interactions-qa.mjs`** (5 checks) — the particle canvas mounts in
  both the world centrepiece and the floating companion, a reaction button
  drives the world expression, the poke control exists, and clicking the
  floating pet navigates to its world.

## Notes

- With no AI provider configured, `GET /api/ai/status` returns 500 by design
  (the offline-brain probe); the browser logs it as a resource error. The
  expressions suite filters this expected error out.
- Screenshots and esbuild bundles are written to temp paths and are never
  committed.
