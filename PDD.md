# Product Design Document: Deep Mehta — Engineering Portfolio

---

## 1. Project Overview

### What is this portfolio?
A single-page, dark-themed engineering portfolio website for Deep Mehta, a BTech Computer Science student at IIIT Vadodara. It showcases projects, skills, education, DSA metrics, and engineering notes through an interactive terminal interface and an AI-powered chat assistant.

### What problem does it solve?
Traditional portfolio templates are static and fail to communicate engineering depth. This portfolio differentiates by making exploration interactive — visitors can explore the developer's profile via a functioning terminal, ask an AI assistant contextual questions, and view live LeetCode telemetry data. It positions a student engineer as systems-oriented and backend-focused rather than presenting a generic resume.

### Target audience
- Technical recruiters and engineering managers
- Hiring teams evaluating backend/systems aptitude
- Peers and collaborators in the engineering community

### Design philosophy
- **Backend-first**: The site's USP is the backend/AI infrastructure, not visual flair
- **Systems thinking**: Every feature (terminal, AI, telemetry, routing) mirrors real system design patterns
- **Authenticity over hype**: All data is grounded in real projects, real metrics, no fabrication
- **Minimal dependencies**: Lean stack — no Next.js, no TypeScript, no CSS-in-JS, no database
- **Content-driven**: JSON and Markdown files power all content; no CMS, no database

---

## 2. Complete Folder Architecture

```
/
├── api/                        # Vercel serverless entry point
│   └── index.js                # Re-exports Express app from server/ for Vercel deployment
├── dist/                       # Production build output (gitignored)
│   ├── assets/
│   ├── index.html
│   ├── favicon.svg
│   ├── og-image.svg
│   ├── robots.txt
│   └── sitemap.xml
├── public/                     # Static assets served directly (no Vite hash)
│   ├── assets/
│   │   └── resume.pdf          # Downloadable resume
│   ├── images/
│   │   ├── profile.png         # Profile photo
│   │   ├── certificates/       # 6 certificate images (multiple naming conventions)
│   │   └── projects/           # 4 project preview images
│   ├── favicon.svg             # Terminal-style ">_" icon
│   ├── og-image.svg            # OpenGraph 1200×630 preview
│   ├── robots.txt
│   └── sitemap.xml
├── scripts/                    # Build-time validation scripts
│   ├── validate-content.js     # Node (CJS) content validator
│   └── validate-content.cjs    # Duplicate CJS wrapper
├── server/                     # Express backend (runs on port 4000)
│   ├── index.js                # Express app entry, CORS, middleware, routing
│   ├── aiClient.js             # High-level AI client with provider fallback
│   ├── cache.js                # Generic in-memory TTL cache
│   ├── routes/
│   │   ├── ai.js               # POST /chat, GET /status, GET /test
│   │   ├── leetcode.js         # GET /:username (cached LeetCode proxy)
│   │   └── contact.js          # POST /send (form submission + logging)
│   ├── aiProviders/
│   │   ├── index.js            # Provider factory (default: groq, fallback: gemini)
│   │   ├── groq.js             # Groq SDK wrapper with circuit breaker, retry, queue
│   │   └── gemini.js           # Gemini REST API wrapper (node-fetch)
│   ├── prompt/
│   │   └── builder.js          # System prompt assembly (identity + context)
│   ├── retrieval/
│   │   ├── index.js            # Retrieval orchestrator (load → chunk → score → assemble)
│   │   ├── chunker.js          # Splits data into self-contained chunks with categories/keywords
│   │   └── scorer.js           # Keyword overlap scorer (no embeddings)
│   ├── classifiers/
│   │   └── index.js            # Regex-based question category detector
│   ├── context/
│   │   └── loader.js           # Loads server/data/*.json with validation
│   ├── services/
│   │   └── leetcodeService.js  # LeetCode API client (alfa-leetcode-api.onrender.com)
│   ├── middleware/
│   │   └── rateLimit.js        # Per-IP rate limiter (4 AI req / 60s window)
│   ├── utils/
│   │   └── geminiClient.js     # @google/generative-ai SDK wrapper with retry logic
│   ├── data/                   # BACKEND-ONLY data files (used by retrieval pipeline)
│   │   ├── profile.json
│   │   ├── projects.json
│   │   ├── skills.json
│   │   ├── dsa.json
│   │   └── blogs.json
│   ├── logs/
│   │   ├── prompt_log.jsonl    # AI prompt logging
│   │   └── contact_messages.jsonl  # Contact form submissions
│   ├── scripts/                # Test/verification scripts
│   │   ├── verify-phase-3.mjs
│   │   ├── test-gemini.mjs
│   │   ├── test-gemini-rest.mjs
│   │   ├── groq-integration-test.mjs
│   │   └── ... (10 total scripts)
│   ├── .env                    # Gitignored — API keys and config
│   └── .env.example            # Template for environment variables
├── src/                        # React frontend
│   ├── main.jsx                # Entry point, scroll restoration disabled
│   ├── App.jsx                 # Root component — sections in order
│   ├── styles/
│   │   └── globals.css         # Tailwind directives, utility classes, print/reduced-motion
│   ├── constants/
│   │   └── index.js            # Colors, breakpoints, animations, terminal config, commands, skills
│   ├── animations/
│   │   └── index.jsx           # 15 Framer Motion animation wrappers
│   ├── primitives/             # Re-exports from components/primitives
│   ├── layout/                 # Re-exports from components/layout
│   ├── components/
│   │   ├── primitives/
│   │   │   ├── index.jsx       # 15 UI primitives (Button, Card, Input, SectionTitle, etc.)
│   │   │   └── LoadingScreen.jsx  # Boot-sequence loading animation
│   │   ├── layout/
│   │   │   └── index.jsx       # Navbar, LayoutContainer, Section, Grid, Flex, Stack, etc.
│   │   ├── ai/
│   │   │   └── ChatAssistant.jsx  # AI chat UI component
│   │   ├── molecules/
│   │   │   ├── index.js        # Barrel export
│   │   │   ├── MarkdownRenderer.jsx  # Markdown renderer with code highlighting
│   │   │   └── ProjectCard.jsx      # PROJECT CARD (UNUSED — uses different styling system)
│   │   ├── organisms/
│   │   │   ├── index.js        # Barrel export
│   │   │   └── ProjectDetailView.jsx  # PROJECT DETAIL MODAL (UNUSED — uses different styling)
│   │   └── sections/
│   │       ├── index.js        # Barrel export
│   │       ├── ProjectsSection.jsx  # PROJECTS SECTION (UNUSED — uses content hooks)
│   │       └── BlogSection.jsx      # BLOG SECTION (UNUSED — uses content hooks)
│   ├── sections/               # ACTUAL page sections used in App.jsx
│   │   ├── HeroSection.jsx
│   │   ├── TerminalSection.jsx (1324 lines — largest file)
│   │   ├── EducationAchievementsSection.jsx
│   │   ├── LeetCodeTelemetrySection.jsx
│   │   ├── ProjectsSection.jsx
│   │   ├── ContactSection.jsx
│   │   ├── FooterSection.jsx
│   │   └── PlaceholderSections.jsx (AIAssistantSection wrapper)
│   ├── hooks/
│   │   ├── index.js            # 12 general-purpose React hooks
│   │   ├── useAI.js            # AI chat hook (send, reset, retry, typing animation)
│   │   ├── useLeetCode.js      # LeetCode data fetching hook
│   │   └── content/            # Content management hooks (largely unused)
│   │       ├── index.js
│   │       ├── useBlogs.js     # Loads blogs via import.meta.glob
│   │       ├── useProfile.js   # Loads profile/skills/achievements from JSON
│   │       ├── useProjects.js  # Validates and loads projects from JSON
│   │       └── useTerminalCommands.js  # Builds command executors with context
│   ├── api/
│   │   └── ai.js               # Chat API client (fetch wrapper with timeout, abort, error parsing)
│   ├── context/
│   │   └── portfolioContext.js  # Centralized context builder (unused by App.jsx)
│   ├── utils/
│   │   ├── index.js            # Utility functions (cn, debounce, parseCommand, etc.)
│   │   └── content/            # Content utilities
│   │       ├── index.js
│   │       ├── contentFormatter.js  # Formatting helpers (dates, slugs, tags, metrics)
│   │       ├── contentLoader.js     # In-memory cached JSON/markdown loader
│   │       ├── contentValidator.js  # Schema validation for projects, blogs, skills, DSA
│   │       └── parseFrontmatter.js  # Custom YAML frontmatter parser
│   ├── data/                   # FRONTEND data files
│   │   ├── profile.json        # Profile data
│   │   ├── projects.json       # 4 projects
│   │   ├── skills.json         # 5 skill categories
│   │   ├── achievements.json   # 6 achievements
│   │   ├── terminal-commands.json  # 44 terminal commands
│   │   ├── profileData.js      # Education, achievements, certifications, coding profiles
│   │   └── context/            # ALTERNATIVE data files (duplicated)
│   │       ├── masterProfile.json
│   │       ├── profile.json
│   │       ├── projects.json
│   │       └── skills.json
│   └── content/
│       ├── blog/
│       │   ├── scalable-backend-systems.md       # Featured blog post
│       │   └── distributed-systems-case-study.md # Non-featured blog post
│       └── engineering-notes/    # Empty directory
├── index.html                  # HTML entry, SEO meta, OG/Twitter tags, Google Fonts
├── vite.config.js              # Vite config with React plugin and /api → :4000 proxy
├── tailwind.config.js          # Full Tailwind config with custom colors, shadows, fonts
├── postcss.config.js           # Tailwind + autoprefixer
├── vercel.json                 # Vercel deployment config (rewrites for SPA + API)
├── package.json                # Frontend dependencies
├── ARCHITECTURE.md             # Phase 3 AI architecture document
├── AI-ASSISTANT-READY.md       # AI assistant deployment checklist
├── README.md                   # Project documentation
└── PDD.md                      # THIS DOCUMENT
```

**Duplicate/unused file clusters detected:**
- `src/data/context/` — duplicated subset of `src/data/`, used only by `src/context/portfolioContext.js` which is itself unused by App.jsx
- `src/components/molecules/ProjectCard.jsx` — uses non-existent `bg-dark-secondary` classes, not imported
- `src/components/molecules/MarkdownRenderer.jsx` — not imported
- `src/components/organisms/ProjectDetailView.jsx` — not imported
- `src/components/sections/ProjectsSection.jsx` and `BlogSection.jsx` — not imported
- `src/hooks/content/useTerminalCommands.js` — not used by TerminalSection (which has its own inline implementation)
- `src/context/portfolioContext.js` — exported but never imported in App.jsx

---

## 3. Technology Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **React** | ^18.2.0 | UI framework — component model, hooks, state |
| **Vite** | ^4.4.5 | Build tool — fast HMR, ESM-native, simple config |
| **Tailwind CSS** | ^3.3.0 | Utility-first CSS — design system via config, no separate CSS files |
| **Framer Motion** | ^10.16.4 | Declarative animations — entrance, scroll, hover, layout animations |
| **Lucide React** | ^0.263.1 | Icon library — tree-shakeable, consistent style |
| **Zustand** | ^4.4.0 | State management — DECLARED but NOT used anywhere in the codebase |
| **clsx** | ^2.0.0 | Conditional class merging — used in `cn()` utility |
| **react-markdown** | ^8.0.7 | Markdown rendering — used by ChatAssistant and MarkdownRenderer |
| **remark-gfm** | ^3.0.1 | GitHub Flavored Markdown plugin |
| **rehype-highlight** | ^6.0.0 | Code syntax highlighting |
| **rehype-sanitize** | ^5.0.1 | HTML sanitization for markdown output |
| **gray-matter** | ^4.0.3 | Frontmatter parsing — DECLARED but parseFrontmatter.js is custom |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **Express** | ^4.18.2 | HTTP server — routing, middleware, JSON parsing |
| **cors** | ^2.8.5 | Cross-origin requests for Vite dev proxy |
| **dotenv** | ^16.3.1 | Environment variable loading |
| **groq-sdk** | ^1.2.0 | Groq API client (Llama 3.1 models) |
| **@google/generative-ai** | ^0.24.1 | Gemini API SDK |
| **node-fetch** | ^3.3.2 | Server-side fetch (for Gemini provider) |

### External Services
| Service | Purpose |
|---|---|
| **Formspree** | Contact form submission handling (POST to formspree.io) |
| **alfa-leetcode-api** | LeetCode data proxy (onrender.com) |
| **Groq API** | Primary AI provider (Llama 3.1 8B) |
| **Google Generative AI API** | Secondary AI provider (Gemini 2.0/2.5 Flash) |
| **Google Fonts** | Inter (sans) and JetBrains Mono (monospace) |

### Deployment
| Tool | Purpose |
|---|---|
| **Vercel** | Frontend hosting + serverless API via `api/index.js` |

**Notable absences:**
- No TypeScript
- No testing framework (Jest, Vitest, etc.)
- No database
- No ORM
- No package manager lockfile in root (package-lock.json exists, but no yarn.lock or pnpm-lock)

---

## 4. Routing

### Frontend
This is a **single-page application with NO client-side router**. All navigation is done via:
- **Hash-based anchor scrolling**: `#hero`, `#terminal`, `#education`, `#leetcode`, `#projects`, `#ai-assistant`, `#contact`
- `Navbar` buttons use `document.querySelector(href).scrollIntoView({ behavior: 'smooth' })`
- No React Router, no URL path routing, no history management

### Backend API Routes

| Method | Path | Purpose | File |
|---|---|---|---|
| POST | `/api/ai/chat` | AI chat request | `server/routes/ai.js:39` |
| GET | `/api/ai/status` | AI service health check | `server/routes/ai.js:176` |
| GET | `/api/ai/test` | Provider connectivity test | `server/routes/ai.js:185` |
| POST | `/api/contact/send` | Contact form submission | `server/routes/contact.js:19` |
| GET | `/api/leetcode/health` | LeetCode service health | `server/routes/leetcode.js:13` |
| GET | `/api/leetcode/:username` | LeetCode stats proxy | `server/routes/leetcode.js:25` |

### Vercel Rewrites (vercel.json)
- `/api/(.*)` → `/api` (serverless function)
- `/(.*)` → `/index.html` (SPA fallback)

---

## 5. Component Architecture

### 5.1 Component Hierarchy

```
App.jsx
├── LayoutContainer
│   ├── Navbar
│   ├── LoadingScreen (conditional, overlaid on first load)
│   ├── HeroSection
│   ├── TerminalSection
│   ├── EducationAchievementsSection
│   │   ├── CertificateModal (internal)
│   ├── LeetCodeTelemetrySection
│   │   ├── AnimatedCounter (internal)
│   │   ├── StatusBlock (internal)
│   ├── ProjectsSection (sections/ProjectsSection.jsx)
│   │   ├── ProjectCard (inline, with ImageWithFallback)
│   ├── AIAssistantSection (PlaceholderSections.jsx)
│   │   ├── ChatAssistant
│   │   │   ├── CopyButton (inline)
│   │   │   ├── CodeBlock (inline)
│   ├── ContactSection
│   ├── FooterSection
```

### 5.2 Primitives (`src/components/primitives/index.jsx`)
15 reusable UI components:
- **Button** — 5 variants (primary, secondary, accent, outline, ghost, danger) × 5 sizes
- **Card** — Base card with optional hover-lift
- **Badge** — 6 color variants × 3 sizes, pill-shaped
- **Tag** — 4 variants × 3 sizes, rounded-rect
- **Input** — With label, error state
- **Textarea** — With label, error state
- **SectionTitle** — Title + subtitle with alignment
- **Divider** — Horizontal rule
- **GlassPanel** — Glassmorphism container
- **TerminalBlock** — Terminal-styled code block
- **CodeBlock** — Syntax highlighted code
- **StatCard** — Icon + label + value card
- **ProgressBar** — Animated progress bar
- **Skeleton** — Loading placeholder
- **Spinner** — Loading spinner
- **Tooltip** — Hover tooltip
- **Collapsible** — Accordion
- **EmptyState** — Icon + title + description + action

### 5.3 Layout Components (`src/components/layout/index.jsx`)
- **Navbar** — Fixed top nav with 7 items, mobile hamburger menu
- **LayoutContainer** — Wraps app, applies padding-top for navbar height
- **Section** — Section wrapper with optional container, padding
- **PageContainer** — Max-width centered container
- **Grid** — Responsive grid (1-4 columns)
- **Flex** — Flexbox wrapper with direction/justify/align/gap
- **Stack** — Vertical flex wrapper
- **Center** — Centered flex container
- **MaxWidthContainer** — Container with configurable max-width
- **Spacer** — Vertical spacing
- **Box** — Generic wrapper (configurable `as` prop)

### 5.4 Data Flow
Data flows in three patterns:

1. **Direct JSON import**: Most sections import JSON files directly:
   `import profileData from '../data/profile.json'`
   This happens at module scope (not React lifecycle), so it's effectively static.

2. **Custom hooks with state**: `useAI`, `useLeetCode` use `useState`/`useEffect` for async data.

3. **props drilling**: `ChatAssistant` receives nothing; it uses `useAI()` internally.
   `LeetCodeTelemetrySection` passes nothing; it uses `useLeetCode()` internally.

There is **no React Context used in App.jsx**. The `portfolioContext.js` file exists but is never imported by the main app.

---

## 6. Features

### 6.1 Loading Screen
- **Purpose**: Animated boot sequence that overlays content while React tree initializes
- **Implementation**: 5-phase boot sequence in `LoadingScreen.jsx` (runtime kernel → project registry → backend services → telemetry streams → boot complete). Each phase is 300ms. After completion, dispatches `app:loaded` event. Uses `opacity-0` transition for fade-out.
- **Files**: `src/components/primitives/LoadingScreen.jsx`, `src/App.jsx:31-35`
- **State**: Controlled by `showLoader` state in `App.jsx`, passed `onFinish` callback
- **Limitations**: No loading progress from actual backend — all phases are timed, not event-driven

### 6.2 Hero Section
- **Purpose**: Full-screen introduction with name, rotating role titles, stats, CTAs
- **Implementation**: 4 rotating roles (Backend Engineering Student, AI Engineering Learner, Systems-Focused Developer, Problem Solver) cycling every 3s. Grid layout (3/5 text, 2/5 profile image on desktop). 3 CTA buttons (Get in Touch → scrolls to contact, GitHub → external link, Resume → downloads PDF). Framer Motion entrance animations and floating ambient blobs.
- **Files**: `src/sections/HeroSection.jsx`
- **Data Sources**: `src/data/profile.json`, `src/data/projects.json`, `src/data/skills.json`, `src/data/profileData.js`
- **Limitations**: Profile photo uses `object-contain` with grayscale filter. No lazy loading for profile image.

### 6.3 Interactive Terminal
See Section 7 (Terminal System) for full details.

### 6.4 Education & Achievements Section
- **Purpose**: Two-column dashboard (3/5 + 2/5 grid) showing education, achievements, certifications, coding profiles, and quick stats
- **Implementation**: Left column has education card + achievements list. Right column has Quick Stats grid (problems solved, contest rating, streak, platforms), certification cards with clickable modal preview, and coding profile links. Certificate modal uses dark backdrop with lazy-loaded images and fallback states.
- **Files**: `src/sections/EducationAchievementsSection.jsx`
- **Data Sources**: `src/data/profileData.js` (education, achievements, certifications, codingProfiles)
- **State**: `selectedCert` state for modal; `iconMap` for dynamic icon mapping
- **Limitations**: DSA stats (741 solved, 1679 rating, 45 streak) are hardcoded as local constants, not fetched from API

### 6.5 LeetCode Telemetry
- **Purpose**: Live LeetCode metrics dashboard with animated counters and engineering status signals
- **Implementation**: Calls backend `/api/leetcode/:username` via `useLeetCode` hook. Backend proxies to `alfa-leetcode-api.onrender.com`. Three-column layout with solved breakdown (easy/medium/hard with animated counters), contest profile (rating, global rank), activity (streak). Right panel shows engineering status signals (Active, Backend Engineering, Distributed Systems, etc.).
- **Files**: `src/sections/LeetCodeTelemetrySection.jsx`, `src/hooks/useLeetCode.js`, `src/services/leetcode.js` (unused — hook goes through backend proxy), `server/routes/leetcode.js`, `server/services/leetcodeService.js`
- **Data Sources**: LeetCode username from `src/data/profileData.js` (`Deep04_Mehta`)
- **State**: `retryCount` for manual retry, `loading`, `error` from hook
- **Cache**: 30-minute TTL on backend
- **Limitations**: When API fails, falls back to hardcoded values (streak: 45). Only fetches on mount. No polling/websocket. `src/services/leetcode.js` (direct client-side API calls) is unused — the proxy approach is used instead.

### 6.6 Projects Section
- **Purpose**: Grid of 4 project cards with architecture descriptions, tech tags, GitHub links
- **Implementation**: `StaggerContainer` + `StaggerItem` for entrance animations. Each card shows image (with fallback), title, description, architecture block, challenges, learnings, tags, and GitHub/blog links. Image uses `ImageWithFallback` component with retry logic.
- **Files**: `src/sections/ProjectsSection.jsx`
- **Data Sources**: `src/data/projects.json` (4 projects)
- **Limitations**: Images use static paths (`/images/projects/*.png`). No filtering, no search, no detail modal (despite `ProjectDetailView.jsx` existing as dead code).

### 6.7 AI Assistant
See Section 8 (AI Assistant) for full details.

### 6.8 Contact Section
- **Purpose**: Contact form + social/coding profile links
- **Implementation**: Two-column layout. Left side has email CTA, social links (GitHub, LinkedIn, LeetCode), coding profiles (CodeChef, Codeforces, GeeksforGeeks), quick facts. Right side has contact form (name, email, message) that POSTs to Formspree (`https://formspree.io/f/mzdgwyow`). Shows success/error states. Form data hardcoded to 2000 char limit.
- **Files**: `src/sections/ContactSection.jsx`
- **Data Sources**: `src/data/profile.json` (contact info)
- **State**: `formData`, `isSubmitting`, `status`, `errorMessage`
- **Limitations**: No Formspree fallback. No captcha. Rate-limited only by backend (3 per IP per minute via `server/routes/contact.js`), but Formspree handles its own limiting. Backend `/api/contact/send` route exists but frontend doesn't use it (goes directly to Formspree).

### 6.9 Footer
- **Purpose**: Tech stack attribution, copyright, social links
- **Implementation**: Simple footer with tech stack description, copyright year, inline social icons, competitive programming links
- **Files**: `src/sections/FooterSection.jsx`

### 6.10 Theme
- **Purpose**: Dark theme design system
- **Implementation**: **Static dark theme — no light mode, no toggle.** All colors defined in `tailwind.config.js` (primary blue #5d6eff, accent cyan #29b6f6, neutral grays). Background is `neutral-900` (#171717) or darker. CSS classes in `globals.css` define gradient text, glass effects, and utility classes. Scrollbar is custom-styled dark.
- **Files**: `tailwind.config.js`, `src/styles/globals.css`
- **Limitations**: No theme toggle. No light mode. No `prefers-color-scheme` media query for auto-dark.

### 6.11 Animations
- **Purpose**: Entrance, scroll, hover, and interactive animations
- **Implementation**: 15 reusable animation components in `src/animations/index.jsx` using Framer Motion: FadeIn, SlideIn (4 directions), ScaleIn, StaggerContainer/Item, HoverScale, FloatingAnimation, PulseAnimation, CountUp, TypewriterAnimation, RotateAnimation, GradientShift, ScrollTrigger, Shimmer, PathAnimation, BlurIn, TapAnimation. Additional CSS animations in `globals.css` (float, pulse-subtle, glow) and Tailwind config.
- **Files**: `src/animations/index.jsx`, `tailwind.config.js` (keyframes), `src/styles/globals.css`
- **Limitations**: `CountUp` animation in `animations/index.jsx` uses incorrect Framer Motion API (`motion.div` with `values` prop — this is not valid v10 API and won't work). The `LeetCodeTelemetrySection` implements its own `AnimatedCounter` using `requestAnimationFrame` instead.

### 6.12 Command System
See Section 7 (Terminal System) for full details.

### 6.13 Resume
- **Purpose**: Downloadable PDF resume
- **Implementation**: Static `public/assets/resume.pdf` downloaded via dynamically created `<a>` tag with download attribute in the Hero CTA button
- **Limitations**: No preview. No version management. Path is hardcoded. Terminal command `resume` returns "coming soon" message.

### 6.14 GitHub Integration
- **Purpose**: Links to GitHub profile and project repos
- **Implementation**: Static external links throughout (Navbar "Get in Touch" dropdown not implemented; Navbar has hidden CTA button). Projects section has per-project GitHub links. Footer/Social sections link to `https://github.com/Deep084-bot`.
- **Limitations**: No API integration (the GitHub Project Analyzer project is a separate app, not part of this portfolio). No repo stats, no contribution graph, no activity feed.

### 6.15 SEO
- **Purpose**: Search engine optimization and social preview
- **Implementation**: Full meta tags, OpenGraph, Twitter Card in `index.html`. `sitemap.xml` (single URL). `robots.txt`. Terminal-style SVG favicon. OG image is SVG.
- **Limitations**: Sitemap has only one URL. No blog/article URLs since there's no routing. No structured data (JSON-LD).

### 6.16 Blog/Engineering Notes
- **Purpose**: Technical blog content
- **Implementation**: Two markdown files in `src/content/blog/` with YAML frontmatter. Processed via `useBlogs` hook using Vite's `import.meta.glob`. Custom `parseFrontmatter.js` parses frontmatter. ContentFormatter generates excerpts and reading time. `ContentValidator` validates schema. `BlogSection.jsx` component exists but is **NOT imported** anywhere in the app.
- **Files**: `src/content/blog/*.md`, `src/hooks/content/useBlogs.js`, `src/components/sections/BlogSection.jsx`, `src/utils/content/*.js`
- **Limitations**: Blog content is **not rendered anywhere on the site**. The BlogSection component is dead code. Blog content is only used as context for the AI assistant.

---

## 7. Terminal System

### 7.1 Overview
The Interactive Terminal is the marquee feature — a fully functional command-line interface rendered in the browser. It occupies approximately 60% of the code in `TerminalSection.jsx` (1324 lines).

### 7.2 Architecture
The terminal is a **single React component** (`TerminalSection.jsx`) with no separate command engine. Everything is inline:
- **Command parsing**: `parseCommand()` utility from `src/utils/index.js` splits input into command + args
- **Command execution**: `getCommandOutput()` is a 500+ line `switch` statement
- **Display state**: `history` array holds `{ type: 'input'|'output', content: string }` objects
- **UI state**: `bootPhase`, `bootIndex`, `input`, `isLoading`, `cwd` (current working directory)

### 7.3 Boot Sequence
Before accepting commands, the terminal plays a boot sequence:
```
Last login: [timestamp] on ttys000
Welcome back, Deep.
Loading portfolio kernel...
Initializing module system...
Mounting project filesystems...
Starting backend services...
AI subsystem online.
Session restored. Ready.
Type "help" for available commands.
```
This triggers on the `app:loaded` window event (dispatched by LoadingScreen).

### 7.4 Available Commands

**Profile & Info:**
- `whoami` — Full profile info (name, title, location, bio, roles, interests, strengths)
- `skills` — Skills by category
- `projects` — Top 5 featured projects
- `achievements` — All achievements
- `dsa` — DSA stats (redirects to LeetCode section)
- `contact` — Contact info
- `resume` — "Coming soon" message

**Learning:**
- `roadmap` — Learning roadmap with 6 areas
- `currently_reading` — Books/resources
- `focus` — Current engineering focus
- `stack` — Backend, DevOps, AI stacks
- `status` — System status with random metrics

**Filesystem (virtual):**
- `ls` — List directory contents
- `cd` — Change directory (supports `/projects`, `/notes`, `..`)
- `pwd` — Print working directory
- `cat` — Display files (about.txt, skills.txt, README.md, markdown files in projects/notes/)
- `tree` — Directory structure
- `history` — Command history

**System:**
- `help` — Full command list
- `clear` — Clear terminal
- `clear cache` — Fake cache cleanup (no side effects)
- `deploy` — Fake CI/CD deployment
- `logs` — Mock server logs
- `api health` — Mock service health
- `docker ps` — Mock running containers
- `top` — Mock process monitor
- `npm` — Mock dev server status
- `repo_status` — Mock git status
- `ping [target]` — Mock ping (backend, google)
- `ai status` — Mock AI service status
- `grep bugs` — Mock bug search

**Social:**
- `github` — Opens GitHub profile
- `open [target]` — Opens links (github, linkedin, leetcode, codechef, codeforces, gfg, email, portfolio)

**Easter Eggs:**
- `coffee` — Coffee status (random cups/brew method)
- `sudo hire-deep` — Hiring authorization
- `matrix` — Matrix reference
- `vibecheck` — Developer vibe check
- `neofetch` — ASCII art system info
- `easteregg` — Random funny message
- `commit` — Random git message
- `motivation` — Random engineering quote
- `cls`, `gh`, `ll` — Aliases

**Aliases supported:** `cls` (clear), `gh` (github), `ll` (ls), `la` (ls), `..` (cd ..), `...` (cd ../..), `home` (cd /)

### 7.5 Autocomplete
**Does not exist.** The terminal has no tab-completion, no autocomplete dropdown, no input suggestions.

### 7.6 Fuzzy Matching
When a command is not found, the terminal uses **Levenshtein distance** (threshold 3) to suggest similar commands:
```
Command not found: skils. Did you mean 'skills'?
```

### 7.7 Command History
The `history` variable stores all inputs and outputs. Arrow key navigation through history is **not implemented** (no `keydown` listener for up/down arrows).

### 7.8 Virtual Filesystem
A nested object structure (`FILESYSTEM`) represents a virtual filesystem:
```
/
├── about.txt
├── skills.txt
├── projects/
│   ├── portfolio-ai.md
│   ├── github-analyzer.md
│   ├── sums.md
│   └── academic-system.md
├── notes/
│   ├── retrieval-pipeline.md
│   ├── groq-debugging.md
│   ├── backend-learning.md
│   └── scaling-notes.md
└── README.md
```

### 7.9 Quick Command Buttons
Below the terminal are 8 quick-command buttons: `whoami`, `skills`, `projects`, `dsa`, `neofetch`, `vibecheck`, `stack`, `help`. These set the input value (user presses Enter to execute).

### 7.10 Computation Panel
Right side panel (desktop only, `md:hidden` on mobile) shows simulated computation logs with randomized messages about tokens, embeddings, inference latency, etc. Status footer shows Inference (ACTIVE), Vector DB (CONNECTED), Latency (34ms). This is **purely cosmetic** — no actual computation is happening.

### 7.11 How to Add New Commands
1. Add entry to `TERMINAL_COMMANDS` in `src/constants/index.js` OR add YAML entry in `terminal-commands.json`
2. Add the name to `commandNames` array in `useMemo` in `TerminalSection.jsx:295-303`
3. Add a `case 'newcommand':` block in the `getCommandOutput` switch statement
4. Optionally add to `multiWordCommands` object if command has spaces
5. Optionally add to quick command buttons grid

### 7.12 Limitations
- No tab autocomplete
- No arrow key history navigation
- No command piping or chaining
- All outputs are mock/simulated, not real system commands
- Filesystem is entirely static (can't create files/directories)
- No persistent state across page reloads
- No command arguments for most commands
- Computation panel is purely cosmetic

---

## 8. AI Assistant

### 8.1 Architecture
```
ChatAssistant.jsx  →  useAI hook  →  api/ai.js  →  POST /api/ai/chat
                                                      │
server/routes/ai.js  →  classifiers/index.js  →  retrieval/index.js  →  prompt/builder.js
                                                      │
                                              aiProviders/index.js  →  groq.js | gemini.js
```

### 8.2 Frontend Component (ChatAssistant.jsx)
- **State**: `messages` (array of `{role, text}`), `loading`, `error`, `input`, `hasBackend`
- **Backend check**: On mount, fetches `/api/ai/status` with 3s timeout to determine if backend is online (shows WiFi icon)
- **Empty state**: Shows 6 suggested prompts (e.g., "Summarize your projects and architecture")
- **Message rendering**: User messages styled blue, assistant messages use `ReactMarkdown` with GFM and syntax highlighting. Error messages styled red.
- **Typing effect**: The `useAI` hook streams the response character-by-character (5 chars per 40ms interval) for a typing simulation
- **Retry**: Shows retry button when last message is an error
- **Reset**: Button to clear conversation
- **Copy**: Inline copy button on code blocks
- **Thinking indicator**: Three bouncing dots during loading

### 8.3 useAI Hook
- **Messages**: Array of `{role, text}` objects, kept in both state and ref (for synchronization)
- **send()**: Debounced (500ms), guarded against concurrent sends, trims history to last 6 turns
- **Abort support**: Uses `AbortController` with 30s timeout
- **Typing animation**: `typeNextChunk` function writes 5 chars at 40-60ms intervals
- **Error handling**: Categorizes errors — timeout, unavailable (502/503), rate limit (429), generic
- **reset()**: Aborts in-flight, clears messages, resets state
- **retry()**: Finds last user message, truncates history, re-sends

### 8.4 API Client (`src/api/ai.js`)
- 30s timeout with `AbortController`
- Handles parent signal wiring (for component-level abort)
- Robust response parsing (tries `answer`, `message`, `text`, `data` fields)
- Error parsing with structured error objects (status, retryAfter, unavailable, requestId)

### 8.5 Backend Route (`server/routes/ai.js`)
- **POST /chat**: Main endpoint
- Flow: validate input → get provider → detect category → retrieve context → build prompt → call provider → return response
- 60s request timeout (extended for debugging)
- Extensive JSON logging (full request/response cycle logged)
- **GET /status**: Returns `{ok, uptime, providerConfigured}`
- **GET /test**: Full provider connectivity test (DNS lookup, TCP connect, SDK call, raw fetch fallback)

### 8.6 Question Classifier (`server/classifiers/index.js`)
- **Type**: Regex-based keyword scoring
- **Categories**: projects, backend, databases, devops, dsa, learning, ai, system-design, general
- **Precedence**: dsa > backend > projects > system-design > ai > databases > devops > learning > general
- **Purpose**: Routes question to the most relevant context chunks

### 8.7 Retrieval Pipeline (`server/retrieval/`)
1. **Loader** (`context/loader.js`): Loads 5 JSON files from `server/data/`, caches in memory
2. **Chunker** (`retrieval/chunker.js`): Creates self-contained chunks from profile, projects, skills, DSA, blogs. Each chunk has `{id, category[], content, keywords[], source, weight}`
3. **Scorer** (`retrieval/scorer.js`): Keyword overlap scoring (no embeddings, no vector DB). Scores by exact match (2pts) and substring match (1pt) with weight boost
4. **Assembler** (`retrieval/index.js`): Filters by category, ranks top 10, deduplicates, assembles context within 3500 char limit

### 8.8 Prompt Builder (`server/prompt/builder.js`)
- Generates system prompt with **identity section** (~600 chars) + retrieved context
- Identity is hardcoded (name, college IIIT Vadodara, CGPA 8.88, focus areas)
- Anti-hedging instructions: forbids "I work with...", "Based on the provided context...", etc.
- Prompts to answer directly in first person
- Context is appended after 3500 char max

### 8.9 AI Providers

**Groq (default provider):**
- Model: `llama-3.1-8b-instant` (configurable via `GROQ_MODEL`)
- Circuit breaker: Opens after 3 failures in 60s, stays open for 20s
- Retry: 1 retry with exponential backoff (200ms base → max 5s)
- Queue: Serializes requests to prevent overlapping
- Timeout: 10s per attempt
- Mock mode: Returns mock response when no API key
- Endpoint: `https://api.groq.com/openai/v1/chat/completions`

**Gemini (fallback provider):**
- Model: `gemini-2.0-flash` (configurable via `GEMINI_MODEL`)
- REST API via `node-fetch`
- No circuit breaker
- API key passed as URL query parameter
- Timeout: 30s

### 8.10 Context Builder (Portfolio Context — Frontend)
`src/context/portfolioContext.js` builds a comprehensive system prompt string used by various features. Includes:
- Critical response rules (forbidden phrases, preferred descriptors)
- Personal identity (name, institution, CGPA)
- Engineering focus & philosophy
- Verified technical stack (languages, backend, databases, frontend, tools)
- Real achievements & metrics
- Project portfolio (4 projects)
- Communication guidelines

Note: This file is **not used by App.jsx** but contains the canonical system prompt that duplicates what the backend builds.

### 8.11 Limitations
- **No real-time streaming**: Response is fully buffered then typed character-by-character (simulated streaming)
- **Context window**: Limited to ~3500 chars of context + ~600 chars identity
- **No conversation memory beyond 6 turns**
- **No user authentication/rate limiting per user** (only per-IP)
- **Mock mode when no API key**: Returns `[MOCK GROQ:model] question...`
- **No tool use/function calling**: Model can only generate text
- **Temperature forced to 0.05**: Very low creativity, factual only
- **Max 512 output tokens**: Short responses
- **No image/vision support**: Text-only
- **Single model per request**: No ensembling/routing between providers
- **No feedback mechanism**: No thumbs up/down on responses

---

## 9. State Management

### 9.1 Approach
The app uses **React local state only**. No global state management is used.

### 9.2 State Locations

| Component | State | Type |
|---|---|---|
| `App.jsx` | `showLoader` | `useState` |
| `HeroSection` | `roleIndex`, `photoError` | `useState` |
| `TerminalSection` | `bootPhase`, `bootIndex`, `bootLines`, `history`, `input`, `isLoading`, `cwd`, `obsLogs`, `serviceHealth`, `compLines` | `useState` + `useRef` |
| `EducationAchievementsSection` | `selectedCert` | `useState` |
| `ContactSection` | `formData`, `isSubmitting`, `status`, `errorMessage` | `useState` |
| `ChatAssistant` | `input`, `hasBackend`, `pending`, `showThinking` | `useState` + `useRef` |
| `LoadingScreen` | `phaseIndex`, `leaving` | `useState` |

### 9.3 Custom Hooks with State
| Hook | State | Purpose |
|---|---|---|
| `useAI` | `messages`, `loading`, `error` | AI chat state with refs for sync |
| `useLeetCode` | `stats`, `loading`, `error` | LeetCode data fetching |
| `useBlogs` | `blogs`, `featured`, `loading`, `error` | Blog loading (unused) |
| `useProfile` | `profile`, `skills`, `achievements`, `dsaStats`, `loading` | Profile data (unused) |
| `useProjects` | `projects`, `featured`, `loading`, `error` | Project loading (unused) |

### 9.4 Data Flow Pattern
1. **Static data**: JSON files imported directly as module-scope constants
2. **Async data**: Custom hooks with `useState` + `useEffect` for API calls
3. **UI state**: Local `useState` per component
4. **No Context API**: `portfolioContext.js` exists but is unused in rendering
5. **No Zustand**: Declared as dependency but never imported anywhere

---

## 10. Styling System

### 10.1 Tailwind CSS
- Utility-first framework with custom config
- Color tokens: primary (blue), accent (cyan), neutral (grays), semantic (success/warning/error), terminal
- Font families: Inter (sans), JetBrains Mono (monospace)
- Spacing: 4px base unit (xs through 4xl)
- Shadows: Premium glow shadows, layered elevation (xs through 2xl)
- Breakpoints: xs (320), sm (640), md (768), lg (1024), xl (1280), 2xl (1536)
- Plugin: `@tailwindcss/typography` (for prose classes in markdown)

### 10.2 Animations
- **Framer Motion**: Used for all entrance, scroll, and interactive animations
- **CSS keyframes**: fadeIn, slideUp/Down/Left/Right, pulseSubtle, glow (defined in tailwind.config.js)
- **Additional CSS animations**: float, pulse-subtle, glow (defined in globals.css)
- **Reduced motion**: Media query `prefers-reduced-motion: reduce` strips all animations

### 10.3 Responsive Strategy
- **Mobile-first**: All styles default to mobile, then override at larger breakpoints
- **Nav/terminal**: Desktop shows full navbar + computation panel; mobile shows hamburger menu + vertical terminal
- **Grid layouts**: Most sections use `grid-cols-1 lg:grid-cols-5` or similar patterns
- **Hidden elements**: Computation panel is `hidden md:flex`; profile image swaps position on mobile
- **No autofocus**: Terminal input and AI input deliberately do NOT autofocus to prevent mobile keyboard jump

### 10.4 Theme System
- **Static dark theme only**: All colors are hardcoded to dark palette
- No `prefers-color-scheme` support
- No CSS custom properties for theming
- Global background: `bg-neutral-900`
- Text: `text-neutral-100`
- Navbar: `bg-neutral-900/95 backdrop-blur-lg`

---

## 11. Assets

### 11.1 Images
- **Location**: `public/images/`
- `profile.png`: Profile photo, loaded in Hero with `object-contain` and grayscale filter
- `projects/`: 4 project card images (`github-analyzer.png`, `portfolio-website.png`, `school-api.png`, `sums.png`)
- `certificates/`: 6 certificate images (multiple naming conventions — some `id.png`, some human-readable)
- Loading: `loading="lazy"` on certificate modal images. No lazy loading on profile or project images.

### 11.2 SVGs
- `public/favicon.svg`: Terminal prompt icon (`>_`)
- `public/og-image.svg`: OpenGraph preview (1200×630)

### 11.3 Icons
- All icons from **Lucide React** library (tree-shakeable SVGs)
- No custom SVG components

### 11.4 Markdown
- `src/content/blog/`: 2 markdown files with YAML frontmatter
- Frontmatter fields: title, slug, date, author, featured, readingTime, audience, educational, tags, excerpt
- Custom frontmatter parser in `src/utils/content/parseFrontmatter.js`

### 11.5 PDFs
- `public/assets/resume.pdf`: Downloadable resume (Hero CTA button)

### 11.6 Image Management
- No build-time image optimization
- No responsive image sets (no `srcSet`, no `sizes`)
- No CDN or image transformation pipeline
- Project images are PNG format
- Certificate images have mixed naming conventions (some UUID-based, some descriptive)

---

## 12. Existing Content

### 12.1 Projects (4 total)

**1. Portfolio Website** [Featured] [Priority 1]
- Tech: React, Vite, Tailwind CSS, Node.js, Express, Gemini API
- Links: GitHub, Blog
- ID: `portfolio-website`
- Status: Complete

**2. SUMS - Smart University Management System** [Featured] [Priority 2]
- Tech: Node.js, Express.js, PostgreSQL, SQL
- Links: GitHub, Blog
- ID: `sums`
- Status: Complete

**3. GitHub Project Analyzer** [Not Featured] [Priority 3]
- Tech: Node.js, Express.js, Axios, Chart.js
- Links: GitHub, Blog
- ID: `github-analyzer`
- Status: Complete

**4. School Management API** [Not Featured] [Priority 4]
- Tech: Node.js, Express.js, MySQL, Postman
- Links: GitHub, Blog
- ID: `school-api`
- Status: Complete

### 12.2 Skills (5 categories)

| Category | Skills |
|---|---|
| Backend & APIs | Node.js, Express.js, REST APIs, CRUD Architecture, Middleware Systems, Authentication Basics |
| Databases | PostgreSQL, MongoDB, MySQL, Schema Design Fundamentals, SQL Querying, Relational Modeling |
| Frontend | React, Tailwind CSS, Vite, Responsive UI, Component Architecture |
| Engineering Foundations | Data Structures, Algorithms, OOP, DBMS, Operating Systems, Computer Networks |
| Currently Exploring | System Design, Docker, DevOps Fundamentals, Distributed Systems Concepts, AI Engineering Workflows, Redis |

### 12.3 Experience
No traditional work experience listed. The closest equivalents:
- **AI Engineering Learner** (continuous)
- **Backend Engineering Student** (continuous)
- **Joint Secretary, Encore Music Club** (2023-2024) — leadership role

### 12.4 Achievements (6 total)
1. **SUMS Project** (Project) — Designed university management system
2. **AI-Integrated Engineering Portfolio** (Project) — Built dynamic portfolio with AI assistant
3. **GitHub Project Analyzer** (Project) — Repository analytics dashboard
4. **School Management API** (Project) — REST APIs with geolocation
5. **700+ DSA Problems Solved** (Problem-Solving) — Across LeetCode, CodeChef, GeeksforGeeks
6. **DAIICT HackOut Finalist (2025)** (Hackathon) — University hackathon finalist

### 12.5 Resume
- File: `public/assets/resume.pdf`
- Method: Download via dynamically created anchor tag
- Terminal command `resume` returns "coming soon"

### 12.6 Links

**Social/Professional:**
- GitHub: `github.com/Deep084-bot`
- LinkedIn: `linkedin.com/in/deepmehta`
- Email: `dpmehta1211@gmail.com`

**Coding Profiles:**
- LeetCode: `Deep04_Mehta`
- CodeChef: `deep04_mehta`
- Codeforces: `dpmehta1211`
- GeeksforGeeks: `deep084`

**Education:**
- Institution: IIIT Vadodara (Indian Institute of Information Technology, Vadodara)
- Degree: BTech Computer Science & Engineering
- CGPA: 8.88
- Duration: 2022-2026

**Certifications (3):**
1. Intro to Machine Learning — Kaggle (2024)
2. Python — Kaggle (2024)
3. Decode Java with DSA — Physics Wallah (2023)

---

## 13. Current UX

### User Journey

1. **Page Load**: User visits `deepmehta.dev`. Browser loads `index.html` with SEO meta tags, OpenGraph preview, Google Fonts. Vite-built React app renders.

2. **Loading Screen**: User sees a full-screen boot-sequence animation showing 5 phases (runtime kernel → project registry → backend services → telemetry streams → boot complete). Each phase takes 300ms with a progress bar. After ~2.5s, screen fades out.

3. **Hero Section**: User sees full-screen hero with name, rotating role titles (cycling every 3s), descriptive tagline, 3 CTA buttons (Get in Touch, GitHub, Resume), stats (4 projects, 16 technologies, 4 platforms). Profile photo visible. Background has subtle grid pattern and animated glowing blobs. Down-arrow button hints scroll.

4. **Scrolling**: User scrolls (or clicks nav). Smooth scrolling is enabled. Navbar stays fixed with 7 anchor links and "Get in Touch" CTA.

5. **Terminal Section**: User sees interactive terminal. Boot sequence replays if the app just loaded. User can type commands or click quick-buttons. Results appear in terminal history. Right-side panel (desktop) shows simulated computation logs. Commands like `whoami`, `skills`, `projects` output portfolio data. `help` lists all commands.

6. **Education & Achievements Section**: Two-column dashboard. Left shows education card with CGPA, coursework, highlights. Achievements listed with icons. Right shows Quick Stats (741 problems, 1679 rating, 45-day streak, 4 platforms), certification cards (clickable for modal preview with lazy-loaded images), and coding profile links.

7. **LeetCode Telemetry Section**: Real-time LeetCode metrics. Shows solved breakdown with animated counters (easy/medium/hard), contest profile with rating/rank, streak tracking. Right panel shows engineering status signals. Retry button if fetch fails. Loading spinner during fetch.

8. **Projects Section**: Grid of 4 project cards with staggered entrance animations. Each shows image (with fallback), architecture description, tech challenges, learnings, tech tags, and GitHub/blog links.

9. **AI Assistant Section**: Chat interface with header (status indicator, reset button), messages area with markdown rendering, suggested prompts (6 initial), and input field. Backend status check on mount. Typing animation on responses. Error/retry handling.

10. **Contact Section**: Two-column layout. Left shows email, social links (GitHub, LinkedIn, LeetCode), coding profiles (CodeChef, Codeforces, GFG), quick facts. Right has contact form (name, email, message) that submits to Formspree. Success/error feedback.

11. **Footer**: Tech stack attribution, social icon links, coding profile links, copyright.

---

## 14. Current Strengths

1. **Interactive terminal as differentiator**: Most portfolios are static — this one has a functional command-line interface that invites exploration.

2. **AI assistant grounded in real portfolio data**: The AI doesn't hallucinate — it retrieves actual project/skill/achievement data from structured JSON files. The retrieval pipeline (classifier → chunker → scorer → assembler) is thoughtful architecture for a portfolio-scale knowledge base.

3. **Backend-first positioning**: The entire site positions Deep as a backend/systems engineer rather than a generalist. The terminal, AI integration, and LeetCode telemetry all reinforce this brand.

4. **LeetCode telemetry as engineering signal**: Live problem-solving metrics with animated counters communicate consistency and DSA proficiency better than any resume bullet point.

5. **Lean tech stack**: No Next.js, no TypeScript, no database, no complex state management. Easy to understand, build, and deploy.

6. **Content-driven architecture**: All content in JSON/Markdown files. Adding/changing projects, skills, or achievements requires no code changes.

7. **Dark theme execution**: The visual design is cohesive — dark grays, blue/cyan accents, monospace terminal styling, consistent spacing and typography.

8. **Extensive error handling**: The AI pipeline has circuit breakers, retry logic, fallback providers, timeout handling, and comprehensive logging.

9. **SEO fundamentals**: Full OpenGraph, Twitter Card, meta tags, sitemap, robots.txt.

10. **Accessibility consideration**: Reduced-motion media query, backdrop elements use `pointer-events-none`, semantic HTML sections.

---

## 15. Weaknesses

1. **Massive duplicated/unused code**: There are ~2,000 lines of dead code — `src/components/molecules/`, `src/components/organisms/`, `src/components/sections/`, `src/data/context/`, `src/context/portfolioContext.js` (partially), `src/services/leetcode.js`. The `BlogSection` component exists but blogs are completely invisible on the site. This increases cognitive load for any new developer.

2. **Three data layers with no single source of truth**: Content exists in `src/data/`, `src/data/context/`, and `server/data/` — all with overlapping but not identical schemas. Adding a new project requires updating 3+ files consistently.

3. **Terminal is a 1324-line monolithic component**: The entire terminal logic (parsing, execution, filesystem, rendering, boot sequence, computation panel) is in a single file with no separation of concerns. No way to unit test commands. Adding a command requires editing a switch statement in a 500+ line function.

4. **No client-side routing**: All sections are stacked vertically on a single page. There's no way to deep-link to a specific section (the hash anchors work but don't persist in browser history in a meaningful way). No blog post URLs.

5. **Blog content is invisible**: Two detailed engineering blog posts exist in `src/content/blog/` but are never rendered anywhere. The `BlogSection` component with full markdown rendering exists as dead code. The only consumer is the AI assistant's context retrieval.

6. **Zustand dependency is unused**: `zustand` is listed in `package.json` dependencies but never imported anywhere. Adds unnecessary bundle weight.

7. **No image optimization**: All images are full-resolution PNGs. No `srcSet`, no WebP, no lazy loading for most images. Certificate images have mixed naming conventions.

8. **No testing**: Zero test files. No testing framework configured. The `scripts/validate-content.js` script only validates JSON schema at build time.

9. **Hardcoded DSA stats in Education section**: The LeetCode stats (741 solved, 1679 rating, 45 streak) are hardcoded in `EducationAchievementsSection.jsx` as local constants, duplicating what the LeetCode telemetry API provides.

10. **Contact form bypasses backend**: The contact form submits directly to Formspree, ignoring the existing `/api/contact/send` endpoint that has validation, rate limiting, and logging.

11. **gray-matter dependency is unused**: Listed in `package.json` but the custom `parseFrontmatter.js` is used instead.

12. **CountUp animation uses invalid Framer Motion API**: The `CountUp` component in `src/animations/index.jsx` uses a `values` prop on `motion.div` which is not valid Framer Motion v10 API. It will silently fail.

---

## 16. Missing Features

Only features that naturally fit the current architecture:

### 16.1 Blog Section Rendering
- **Why it belongs**: Two blog posts already exist; a full `BlogSection` component already exists as dead code. The architecture already supports markdown rendering, frontmatter parsing, and content hooks.
- **Implementation complexity**: Low — wire up the existing `BlogSection` into App.jsx, add a hash nav link.
- **Engineering effort**: 30 minutes

### 16.2 Terminal Autocomplete (Tab)
- **Why it belongs**: Terminal is the flagship feature. Tab autocomplete is expected in any command-line interface.
- **Implementation complexity**: Medium — add a `keydown` listener for Tab key, filter command names by current input prefix, display suggestions.
- **Engineering effort**: 2-3 hours

### 16.3 Terminal Arrow Key History Navigation
- **Why it belongs**: Arrow up/down for command history is universal terminal behavior.
- **Implementation complexity**: Low — track `historyIndex` ref, intercept arrow keys to populate input.
- **Engineering effort**: 1 hour

### 16.4 Single Data Source
- **Why it belongs**: Triple data duplication (`src/data/`, `src/data/context/`, `server/data/`) is the single biggest maintenance burden.
- **Implementation complexity**: Medium — consolidate frontend JSON files, have the server read from a shared location or embed its own copy. Remove `src/data/context/` entirely.
- **Engineering effort**: 3-4 hours

### 16.5 Remove Dead Code
- **Why it belongs**: ~2000 lines of unused components, hooks, services, and data files create confusion for any new developer.
- **Implementation complexity**: Low — identify and delete: `src/components/molecules/`, `src/components/organisms/`, `src/components/sections/`, `src/data/context/`, `src/context/portfolioContext.js`, `src/services/leetcode.js`.
- **Engineering effort**: 1-2 hours

### 16.6 Contact Form → Backend Integration
- **Why it belongs**: Backend has a `/api/contact/send` endpoint with validation, rate limiting, and logging. Frontend bypasses it entirely.
- **Implementation complexity**: Low — change the form's `action` to point at the backend endpoint instead of Formspree.
- **Engineering effort**: 30 minutes

### 16.7 Chat Streaming (Actual SSR/EventSource)
- **Why it belongs**: The current typing animation is faked (buffer → slice). True streaming would use SSE or WebSocket for lower perceived latency.
- **Implementation complexity**: High — requires backend changes (streaming response), frontend changes (incremental rendering), and infrastructure (WebSocket or SSE support on Vercel).
- **Engineering effort**: 1-2 weeks

### 16.8 Route-based URL for Blog Posts
- **Why it belongs**: Blog content exists but has no URL. Adding React Router for hash-less URLs would enable direct links to blog posts.
- **Implementation complexity**: Medium — add `react-router-dom`, create a simple route for blog posts, maintain SPA behavior via Vercel rewrites.
- **Engineering effort**: 4-6 hours

---

## 17. Extensibility

### 17.1 New Projects
**Difficulty: Easy**
1. Edit `src/data/projects.json` — add new object with id, title, description, tech, tags, links, image path, status
2. Edit `server/data/projects.json` — add matching entry for AI context
3. (If needed) Add project image to `public/images/projects/`
4. (If using dead code) Also update `src/data/context/projects.json`
**Time**: 10 minutes per project
**Risk**: Forgetting to update all 3 data sources

### 17.2 New Terminal Commands
**Difficulty: Easy**
1. Add entry to `TERMINAL_COMMANDS` in `src/constants/index.js` OR `terminal-commands.json`
2. Add command name to `commandNames` useMemo array
3. Add `case 'newcmd':` in the `getCommandOutput` switch
**Time**: 15 minutes per command
**Note**: Must edit 3 locations. No way to isolate.

### 17.3 New Pages
**Difficulty: Medium**
The app has no router. A new page would require:
1. Create new section component in `src/sections/`
2. Add to `App.jsx` render tree
3. Add nav link in `Navbar`
4. (For separate URL) Add `react-router-dom` and restructure routing
**Time**: 1-4 hours depending on routing approach

### 17.4 Markdown Rendering
**Difficulty: Easy**
Architecture already supports it:
- `react-markdown` + `remark-gfm` + `rehype-highlight` already bundled
- `ChatAssistant` already renders markdown for AI responses
- `MarkdownRenderer` component exists (dead code but functional)
- To render blog content: wire `useBlogs` hook into a section, use `MarkdownRenderer`

### 17.5 Architecture Diagrams
**Difficulty: Easy**
- Can embed Mermaid diagrams in ChatAssistant (need `rehype-mermaid` plugin)
- Or use simple ASCII diagrams (already done in blog content)
- Or embed SVG/PNG diagrams as images

### 17.6 Engineering Journal
**Difficulty: Easy**
The infrastructure already exists:
- `src/content/blog/` for markdown files
- `useBlogs` hook for loading
- `BlogSection` component (needs to be wired in)
- Just add markdown files and add the section to App.jsx

### 17.7 GitHub Timeline
**Difficulty: Medium**
- Need GitHub API integration (similar to LeetCode pattern)
- Could use GitHub's GraphQL API or REST API
- Would need a new backend route (`/api/github/:username`)
- Frontend needs new section/hook component
- Caching strategy similar to LeetCode (30-min TTL)

---

## 18. Development Roadmap

Based ONLY on the current architecture and stated weaknesses:

### Immediate Improvements (1-2 days)
1. **Wire BlogSection into App.jsx** — The component and content exist; just import and render. This is a 30-min fix that makes two blog posts accessible.
2. **Remove dead code** — Delete `src/components/molecules/`, `src/components/organisms/`, `src/components/sections/`, `src/data/context/`, `src/context/portfolioContext.js`, `src/services/leetcode.js`. Delete unused dependencies (`zustand`, `gray-matter`, `leetcode-query`).
3. **Point contact form to backend endpoint** — Change form submission from Formspree to `/api/contact/send`. Backend already has validation and rate limiting.

### Near-term Improvements (1 week)
4. **Consolidate data sources** — Decide on one data directory. Either have the server read from `src/data/` or copy data during build. Remove `src/data/context/` and `server/data/` duplication.
5. **Refactor terminal into separate modules** — Split `TerminalSection.jsx` into: `CommandEngine.js` (parser + executors), `FileSystem.js` (virtual FS), `TerminalUI.jsx` (rendering), `TerminalSection.jsx` (orchestrator). Enables unit testing of commands.
6. **Add terminal autocomplete** — Tab key to autocomplete command names. Track history index for arrow-up/down.
7. **Build-time image optimization** — Add Vite plugin (`vite-imagetools` or similar) for automatic WebP conversion, responsive srcSet generation.

### Long-term Improvements (1-2 months)
8. **True AI streaming** — Switch from buffered response + fake typing to Server-Sent Events. Backend streams tokens as they arrive from the AI provider. Frontend renders incrementally.
9. **Add React Router** — Enable proper URL routing. Blog posts get `/blog/:slug` URLs. Optionally add `/projects/:id` URLs.
10. **Add testing** — Vitest + React Testing Library for component tests. Integration tests for AI pipeline. End-to-end test with Playwright or Cypress.
11. **Dedicated blog page or section** — Render the two existing blog posts as a proper blog section with full markdown rendering, reading time, tags.

---

## 19. Final Architecture Summary

### What This Is
A **single-page React 18 + Vite portfolio** with an **Express.js backend** running AI and data proxy services. Content is driven by static JSON files. There is no database, no router, no global state management, no TypeScript, and no testing.

### Key Architectural Facts
- **Frontend port**: 5173 (dev), proxied `/api` → 4000
- **Backend port**: 4000
- **Entry point**: `src/main.jsx` → `App.jsx` renders 8 sections vertically
- **Data files**: 3 sets (`src/data/`, `src/data/context/`, `server/data/`) — only `src/data/` is actively used by frontend rendering
- **Dead code**: ~2000 lines across multiple component directories and hooks
- **AI pipeline**: Question → classifier → retrieval (keyword scoring) → prompt builder → LLM provider (Groq default, Gemini fallback)
- **Terminal**: Single 1324-line component with 44 mock commands and a virtual filesystem
- **Styling**: Tailwind CSS with static dark theme, no light mode, no CSS variables
- **Deployment**: Vite builds to `dist/`, deployed via Vercel with serverless API handler at `api/index.js`

### Quick Start for New Engineers
1. `npm install` (root for frontend) + `cd server && npm install` (for backend)
2. Copy `server/.env.example` → `server/.env` and add API keys
3. `cd server && node index.js` (backend on :4000)
4. `npm run dev` (frontend on :5173, proxies /api → :4000)
5. Build: `npm run build` → `dist/`

### To Add a New Feature
- **Page section**: Create component in `src/sections/`, add to `App.jsx` render tree
- **Data**: Update the appropriate `src/data/*.json` AND `server/data/*.json`
- **Terminal command**: Edit 3 locations — constants, commandNames, switch case
- **AI context**: Data from `server/data/*.json` is automatically chunked and retrieved

### Critical UX Files to Know
| File | Lines | Purpose |
|---|---|---|
| `src/sections/TerminalSection.jsx` | 1324 | Entire terminal feature — parsing, execution, filesystem, UI |
| `server/aiProviders/groq.js` | 322 | AI provider with circuit breaker, retry, queue |
| `server/routes/ai.js` | 338 | AI chat endpoint with full pipeline orchestration |
| `server/retrieval/chunker.js` | 246 | Content chunking for AI context |
| `src/hooks/useAI.js` | 218 | Frontend AI hook with typing animation |
| `src/components/layout/index.jsx` | 335 | Layout system (Navbar, Grid, Flex, Section) |
| `src/components/primitives/index.jsx` | 347 | UI primitives (Button, Card, Input, Modal, etc.) |
