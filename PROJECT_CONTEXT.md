# Engineering Design Document - AI Portfolio

## 1. Project Overview

### Purpose
A personal engineering portfolio website showcasing a Computer Science student's projects, skills, achievements, and AI engineering capabilities. The portfolio serves as both a professional presence and a demonstration of backend systems thinking.

### Target Audience
- Technical recruiters and hiring managers
- Potential employers seeking backend/AI engineers
- Fellow developers interested in the tech stack
- AI assistants querying portfolio context

### Core Philosophy
Engineering-first: The portfolio itself is built as a system — from JSON-driven content architecture to the retrieval-augmented AI assistant. Every feature reflects backend engineering principles: clean data flow, structured APIs, resilient error handling, and observable telemetry.

### Primary Engineering Focus
- Backend systems and API design
- AI integration with retrieval-augmented generation (RAG)
- Real-time telemetry from competitive programming platforms
- Terminal-inspired UI reflecting developer tooling

### Overall Architecture
Single Page Application (SPA) with:
- React + Vite frontend (port 5173)
- Express.js backend API server (port 4000)
- AI-powered chat assistant with context retrieval
- JSON and Markdown-driven content system

### Deployment Model
- Frontend: Vercel (static build)
- Backend: Vercel serverless functions / Render
- AI Providers: Groq (primary), Gemini (fallback)

### Repository Type
Full-stack monorepo with frontend and server code.

---

## 2. Folder Architecture

### `/` - Root
- Configuration files (package.json, vite.config.js, tailwind.config.js, etc.)
- Environment files (.env)
- Documentation (README.md, ARCHITECTURE.md, PDD.md, AI-ASSISTANT-READY.md)

### `/src` - Frontend Source
- `main.jsx` - React entry point
- `App.jsx` - Root component rendering all sections
- `styles/globals.css` - Global Tailwind and custom CSS
- `constants/` - Design tokens, terminal config, skills data
- `data/` - JSON data files for content
- `sections/` - Page section components
- `components/` - Reusable UI components
- `hooks/` - Custom React hooks (useAI, useLeetCode)
- `api/` - Frontend API clients
- `services/` - External service integrations
- `context/` - React context providers
- `layout/` - Layout components
- `animations/` - Framer Motion animation presets
- `utils/` - Utility functions
- `content/` - Markdown blog content

### `/server` - Backend Source
- `index.js` - Express server entry point
- `cache.js` - In-memory caching
- `routes/` - API route handlers
  - `ai.js` - AI chat endpoint
  - `contact.js` - Contact form endpoint
  - `leetcode.js` - LeetCode stats endpoint
- `aiProviders/` - AI provider implementations
  - `index.js` - Provider factory
  - `groq.js` - Groq API implementation
  - `gemini.js` - Gemini API implementation
- `retrieval/` - Context retrieval pipeline
  - `index.js` - Main retrieval orchestration
  - `chunker.js` - Text chunking strategy
  - `scorer.js` - Relevance scoring
- `prompt/` - Prompt engineering
  - `builder.js` - System prompt construction
- `context/` - Data loading for AI
  - `loader.js` - JSON file loader with validation
- `classifiers/` - Question classification
  - `index.js` - Category detection
- `middleware/` - Express middleware
  - `rateLimit.js` - Rate limiting
- `services/` - External integrations
  - `leetcodeService.js` - LeetCode API client
- `data/` - Server-side JSON data

### `/public` - Static Assets
- `images/` - Profile images, project screenshots
- `og-image.svg` - Open Graph social image
- `favicon.svg` - Site favicon

### `/scripts` - Build/CI Scripts
- `validate-content.js` - Content validation script

### `/api` - Frontend API Client
- `index.js` - API function exports

---

## 3. Technology Stack

### Frontend
- **React 18.2.0** - UI framework
- **Vite 4.4.5** - Build tool and dev server
- **Tailwind CSS 3.3.0** - Utility-first CSS
- **Framer Motion 10.16.4** - Animation library
- **React Markdown 8.0.7** - Markdown rendering
- **remark-gfm 3.0.1** - GitHub Flavored Markdown
- **rehype-highlight 6.0.0** - Code syntax highlighting
- **rehype-sanitize 5.0.1** - HTML sanitization
- **Lucide React 0.263.1** - Icon library
- **Zustand 4.4.0** - State management (for AI chat)

### Backend
- **Express.js 4.18.2** - Web framework
- **Node.js** - Runtime
- **CORS 2.8.5** - Cross-origin resource sharing
- **Express** - HTTP server

### AI & ML
- **Groq SDK 1.2.0** - Primary AI provider (Llama 3.1)
- **@google/generative-ai 0.24.1** - Gemini provider

### Data & Content
- **gray-matter 4.0.3** - Markdown frontmatter parsing
- **leetcode-query 2.0.1** - LeetCode API client

### Developer Tooling
- **PostCSS 8.4.24** - CSS transformation
- **Autoprefixer 10.4.14** - Vendor prefixing
- **ESLint** - Linting

### External Services
- **Formspree** - Contact form submission
- **Vercel** - Deployment platform

---

## 4. Application Flow

### How Application Starts

1. **Vite Dev Server** (`npm run dev`)
   - Starts on port 5173
   - Opens browser automatically
   - Proxies `/api` requests to backend at `http://localhost:4000`

2. **React Mount** (`src/main.jsx`)
   - ReactDOM.createRoot renders App component
   - `scrollRestoration` set to 'manual' to prevent scroll restore

3. **App Initialization** (`src/App.jsx`)
   - Sets up scroll behavior
   - Renders LayoutContainer with Navbar
   - Shows LoadingScreen initially
   - Fires `app:loaded` event when ready
   - Renders all sections in order

### How Data Flows

1. **JSON Data Loading**
   - Profile, projects, skills, achievements loaded from `/src/data/*.json`
   - Terminal commands from `terminal-commands.json`
   - LeetCode stats via `useLeetCode` hook fetching from `/api/leetcode`

2. **AI Chat Flow**
   - User enters message in ChatAssistant
   - `useAI` hook sends to `/api/ai/chat`
   - Backend classifies question, retrieves context, builds prompt
   - AI provider generates response
   - Frontend renders with typing animation

3. **Contact Form Flow**
   - User fills form
   - POST to Formspree endpoint `https://formspree.io/f/mzdgwyow`
   - Success/error feedback displayed

### How Sections Render

Each section:
- Wrapped in `<Section>` component with ID and background
- Uses `<PageContainer>` for max-width
- Contains animation with `<FadeIn>` or `<ScrollTrigger>`
- Renders content from JSON data files

### How State Flows

- **React State**: Local state in each section
- **AI Messages**: Managed by `useAI` hook with Zustand-like pattern
- **LeetCode Stats**: Fetched via `useLeetCode` hook with caching
- **Terminal History**: Local state in TerminalSection

### How User Interaction Works

- **Navigation**: Smooth scroll to section via ID
- **Terminal**: Command input with history, autocomplete, filesystem simulation
- **AI Chat**: Message submission with typing animation and retry
- **Contact Form**: Validation, submission, feedback
- **Project Cards**: Hover effects, external links to GitHub/blog

---

## 5. Routing

### Frontend Routes (Hash Navigation)
The app uses scroll-based navigation with section IDs:

- `#hero` - Hero section (default)
- `#terminal` - Interactive terminal
- `#education` - Education & achievements
- `#leetcode` - LeetCode telemetry
- `#projects` - Projects showcase
- `#ai` - AI assistant
- `#contact` - Contact form
- Footer - Social links

### Scroll Behavior
- `scroll-behavior: smooth` in CSS
- Manual scroll restoration disabled
- Click handlers use `scrollIntoView({ behavior: 'smooth' })`

### Backend Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ai/chat` | POST | AI chat with context |
| `/api/ai/status` | GET | AI service health check |
| `/api/ai/test` | GET | Provider connectivity test |
| `/api/contact` | POST | Contact form submission |
| `/api/leetcode` | GET | LeetCode stats fetching |

---

## 6. Component Architecture

### Root Components

**`src/App.jsx`**
- Root component
- Renders LayoutContainer
- Contains all sections in order
- Manages loading screen state

**`src/main.jsx`**
- React entry point
- Creates root and mounts App

### Layout Components (`src/components/layout/`)

**`LayoutContainer`**
- Wraps entire app
- Contains Navbar
- Renders children sections

**`Navbar`**
- Fixed position navigation
- Links to all sections
- Responsive hamburger menu

**`PageContainer`**
- Max-width container (max-w-7xl)
- Responsive padding

**`Section`**
- Generic section wrapper
- Accepts id, className, padding props
- Background and border styling

**`Stack`**
- Vertical stack with gap
- Flexbox-based spacing

**`Grid`**
- CSS Grid wrapper
- Configurable columns and gap

### Primitive Components (`src/components/primitives/`)

**`Button`**
- Variants: primary, outline, ghost
- Sizes: sm, md, lg
- Disabled state support

**`Input`**
- Label, type, placeholder
- Error state display

**`Textarea`**
- Multi-line input
- Row configuration

**`Card`**
- Container with border, padding
- Hover effects

**`SectionTitle`**
- Title and subtitle
- Gradient text option

**`LoadingScreen`**
- Initial loading animation
- onFinish callback

### Section Components (`src/sections/`)

| Component | Purpose |
|-----------|---------|
| `HeroSection` | Profile introduction with photo, roles, stats |
| `TerminalSection` | Interactive terminal with 45+ commands |
| `EducationAchievementsSection` | Education, achievements, certifications |
| `LeetCodeTelemetrySection` | Real-time LeetCode stats dashboard |
| `ProjectsSection` | Project cards with details |
| `ContactSection` | Contact form and social links |
| `FooterSection` | Footer with copyright and links |
| `PlaceholderSections` | AI assistant section wrapper |

### Molecule Components (`src/components/molecules/`)

**`MarkdownRenderer`**
- Renders markdown content
- Uses react-markdown with plugins
- Code highlighting support

**`ProjectCard`**
- Project display with image, description, tags
- Links to GitHub/blog

### Organism Components (`src/components/organisms/`)

**`ProjectDetailView`**
- Expanded project view
- Architecture and challenges display

### AI Components (`src/components/ai/`)

**`ChatAssistant`**
- Chat interface with messages
- Typing animation
- Suggested prompts
- Error handling and retry

### Animation Components (`src/animations/`)

**`FadeIn`**
- Fade animation with delay

**`SlideIn`**
- Slide from direction with delay

**`StaggerContainer`**
- Staggered children animation

**`StaggerItem`**
- Individual stagger item

**`ScrollTrigger`**
- Trigger animation on scroll

---

## 7. Sections

### HeroSection (`src/sections/HeroSection.jsx`)

**Purpose**
Profile introduction showcasing name, title, roles, and stats.

**Data Source**
- `src/data/profile.json` - Profile info
- `src/data/projects.json` - Project count
- `src/data/skills.json` - Skills count
- `src/data/profileData.js` - Coding profiles

**Dependencies**
- framer-motion for animations
- lucide-react for icons
- profileData module

**Rendering Flow**
1. Renders gradient background with decorative blurs
2. Profile image with fallback
3. Name with gradient text effect
4. Rotating role labels (3s interval)
5. Bio headline
6. Action buttons (Get in Touch, GitHub, Resume)
7. Stats (Projects, Technologies, Platforms)
8. Scroll indicator

---

### TerminalSection (`src/sections/TerminalSection.jsx`)

**Purpose**
Interactive terminal allowing visitors to explore portfolio through CLI-style commands.

**Data Source**
- `src/data/profile.json`
- `src/data/projects.json`
- `src/data/skills.json`
- `src/data/achievements.json`
- `src/data/terminal-commands.json`

**Dependencies**
- framer-motion for animations
- lucide-react for icons
- parseCommand utility

**Rendering Flow**
1. Boot sequence animation (8 lines with delays)
2. Terminal input/output display
3. Command history with input/output separation
4. Computation panel (right side, desktop only)
5. Quick command buttons below

**Commands Implemented**
- Profile: whoami, contact, resume, github
- Tech: skills, stack, dsa, focus, roadmap, currently_reading
- Work: projects, achievements
- System: help, clear, history, status, ping, ai, logs, api health, docker ps, top, npm, repo_status, deploy, clear cache, grep bugs
- Easter eggs: coffee, sudo, matrix, vibecheck, neofetch, easteregg, commit, motivation
- Filesystem: ls, cd, pwd, cat, tree
- Social: open

---

### EducationAchievementsSection (`src/sections/EducationAchievementsSection.jsx`)

**Purpose**
Display academic background, achievements, certifications, and coding profiles.

**Data Source**
- `src/data/profileData.js` - education, achievements, certifications, codingProfiles

**Dependencies**
- framer-motion for animations
- lucide-react for icons

**Rendering Flow**
1. Two-column layout (education/achievements left, certifications/stats right)
2. Education cards with coursework and highlights
3. Achievement cards with icons
4. Quick stats dashboard (741 problems, 1679 rating, 45d streak)
5. Certification buttons opening modal
6. Coding profile links

---

### LeetCodeTelemetrySection (`src/sections/LeetCodeTelemetrySection.jsx`)

**Purpose**
Real-time LeetCode statistics dashboard showing problem-solving metrics.

**Data Source**
- `src/hooks/useLeetCode` - Fetches from `/api/leetcode`
- `src/data/profileData.js` - Username

**Dependencies**
- framer-motion for animations
- leetcode-query for API

**Rendering Flow**
1. Loading spinner while fetching
2. Error state with retry button
3. Stats dashboard:
   - Problems solved (easy/medium/hard)
   - Contest rating and rank
   - Current streak
4. Engineering status signals (Status, Primary Domain, Current Track, Workflow, Architecture Style, Consistency)

---

### ProjectsSection (`src/sections/ProjectsSection.jsx`)

**Purpose**
Showcase engineering projects with details.

**Data Source**
- `src/data/projects.json`

**Dependencies**
- framer-motion for animations
- lucide-react for icons
- MarkdownRenderer component

**Rendering Flow**
1. Section title
2. Grid of ProjectCard components
3. Each card shows:
   - Image with fallback
   - Title and description
   - Architecture snippet
   - Technical challenges
   - Learnings
   - Tech tags
   - GitHub/blog links

---

### ContactSection (`src/sections/ContactSection.jsx`)

**Purpose**
Contact form and social links.

**Data Source**
- `src/data/profile.json` - Contact info

**Dependencies**
- framer-motion for animations
- lucide-react for icons
- Formspree for submission

**Rendering Flow**
1. Two-column layout
2. Left: Email CTA, social links, coding platforms, quick facts
3. Right: Contact form (name, email, message)
4. Success/error states

---

### FooterSection (`src/sections/FooterSection.jsx`)

**Purpose**
Footer with copyright and social links.

**Data Source**
- `src/data/profile.json`

**Dependencies**
- lucide-react for icons

**Rendering Flow**
1. Tech stack description
2. Copyright and role
3. Social icons (GitHub, LinkedIn, Email)
4. Coding platform links

---

## 8. Data Layer

### JSON Data Files (`src/data/`)

| File | Purpose | Consumed By |
|------|---------|-------------|
| `profile.json` | Profile info, bio, contact | Hero, Terminal, Contact, Footer |
| `projects.json` | Project details | Hero, Terminal, ProjectsSection |
| `skills.json` | Technical skills | Hero, Terminal |
| `achievements.json` | Achievement items | Terminal |
| `terminal-commands.json` | Command definitions | Terminal |
| `profileData.js` | Education, achievements, certifications | EducationSection |

### Server Data Files (`server/data/`)

| File | Purpose | Consumed By |
|------|---------|-------------|
| `profile.json` | Profile for AI retrieval | Context loader |
| `projects.json` | Projects for AI retrieval | Context loader |
| `skills.json` | Skills for AI retrieval | Context loader |
| `dsa.json` | DSA stats for AI retrieval | Context loader |
| `blogs.json` | Blog posts for AI retrieval | Context loader |

### Content Files (`src/content/blog/`)

| File | Purpose |
|------|---------|
| `scalable-backend-systems.md` | Engineering blog post |
| `distributed-systems-case-study.md` | Engineering blog post |

### Dynamic vs Static Data
- **Static**: All JSON files (updated manually)
- **Dynamic**: LeetCode stats (fetched from API), AI responses (generated)

---

## 9. Terminal System

The Terminal System is one of the most distinctive features, simulating a developer CLI.

### Command Parser (`src/utils/index.js`)

```javascript
parseCommand(input) // Returns { command, args }
```

Splits input by whitespace, lowercases command, preserves args.

### Command Registry

45+ commands defined in `src/data/terminal-commands.json`:
- Profile: whoami, contact, resume, github
- Tech: skills, stack, dsa, focus, roadmap, currently_reading
- Work: projects, achievements
- Content: blog
- System: help, clear, history, status, ping, ai, logs, api health, docker ps, top, npm, repo_status, deploy, clear cache, grep bugs
- Easter eggs: coffee, sudo, matrix, vibecheck, neofetch, easteregg, commit, motivation
- Filesystem simulation: ls, cd, pwd, cat, tree
- Social: open

### Filesystem Simulation

Virtual filesystem at `/`:
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

Supported filesystem commands: ls, cd, pwd, cat, tree

### Autocomplete & History

- Levenshtein distance for fuzzy matching (threshold: 3)
- Alias resolution: cls→clear, gh→github, lc→leetcode, ll→ls
- Command history stored in React state

### Boot Sequence

8-line boot animation on first load:
1. "Last login: [timestamp] on ttys000"
2. "Welcome back, Deep."
3. "Loading portfolio kernel..."
4. "Initializing module system..."
5. "Mounting project filesystems..."
6. "Starting backend services..."
7. "AI subsystem online."
8. "Session restored. Ready."

### Rendering

- Terminal panel: 70% width (desktop)
- Computation panel: 30% width (desktop, hidden on mobile)
- Monospace font (JetBrains Mono)
- Color-coded output (cyan for directories, green for success, red for errors)
- Line-by-line streaming for cat, tree, logs, neofetch

### Animations

- Input prompt with `$ ` prefix
- Output text with fade-in
- Loading indicator "⟳ Processing..."
- Blinking cursor during boot

---

## 10. AI Assistant

The AI Assistant provides portfolio-aware chat using retrieval-augmented generation.

### Frontend Flow (`src/components/ai/ChatAssistant.jsx`)

1. **Message Input**
   - Text input with Send button
   - Suggested prompts for quick start

2. **API Call** (`src/api/ai.js`)
   - POST to `/api/ai/chat`
   - 30-second timeout
   - AbortController for cancellation

3. **Response Handling** (`src/hooks/useAI.js`)
   - Stores messages in state
   - Typing animation (5 chars per 40ms chunk)
   - Error detection and retry

4. **Rendering**
   - ReactMarkdown with syntax highlighting
   - Code blocks with copy button
   - User/assistant message differentiation

### Backend Flow (`server/routes/ai.js`)

1. **Request Validation**
   - question required
   - history optional (last 6 messages)

2. **Provider Selection**
   - getProvider() from `aiProviders/index.js`
   - Default: groq, fallback: gemini

3. **Classification**
   - detectCategory() from `classifiers/index.js`
   - Categories: general, project, skills, dsa, education, contact

4. **Context Retrieval**
   - retrieveRelevantContext() from `retrieval/index.js`
   - Loads all data, chunks, scores, assembles

5. **Prompt Building**
   - buildPrompt() from `prompt/builder.js`
   - Identity section (always included)
   - Retrieved context (appended)

6. **AI Generation**
   - provider.sendPrompt()
   - Returns { text, tokensUsed, latencyMs }

7. **Response**
   - { success: true, answer, requestId }

### Prompt Builder (`server/prompt/builder.js`)

System prompt structure:
```
You are roleplaying as Deep Mehta, a BTech Computer Science student at IIIT Vadodara...
Speak naturally in first person...
Never say: "I work with...", "Based on the provided context..."...
Always answer directly...

Relevant context:
[retrieved chunks]
```

### Context Retrieval (`server/retrieval/index.js`)

1. **Load** - loadAll() from context/loader.js
2. **Chunk** - chunkAll() creates text chunks with metadata
3. **Filter** - By category (project, skills, dsa, etc.)
4. **Score** - rankChunks() relevance scoring
5. **Dedupe** - Remove duplicates
6. **Assemble** - Join up to 3500 chars

### Chunking Strategy (`server/retrieval/chunker.js`)

- Profile: name, title, bio, technicalInterests, strengths
- Projects: title, shortDescription, architecture, challenges, learnings
- Skills: category, skills array
- DSA: totalSolved, byDifficulty, byCategory
- Blogs: title, excerpt, tags

### Scoring (`server/retrieval/scorer.js`)

- Keyword matching against query
- Boost for exact matches
- Category alignment scoring

### Providers

**Groq Provider** (`server/aiProviders/groq.js`)
- Model: llama-3.1-8b-instant (default)
- Circuit breaker pattern (3 failures → 20s open)
- Exponential backoff (200ms base)
- Max 1 retry
- 10s timeout per request

**Gemini Provider** (`server/aiProviders/gemini.js`)
- Model: gemini-pro
- Similar resilience patterns

### Fallbacks

- If no API key: mock response
- If provider fails: circuit breaker opens
- If retrieval fails: empty context (identity-only prompt)
- If timeout: 504 response

### Typing Animation

- Chunk size: 5 characters
- Interval: 40ms + random(0-20ms)
- Defensive: validates answer before animating

### Conversation Lifecycle

1. **Init** - Empty messages array
2. **Send** - Add user message, set loading
3. **Receive** - Add assistant message with empty text
4. **Animate** - Stream characters one chunk at a time
5. **Error** - Show error message with retry button
6. **Reset** - Clear all messages

---

## 11. Styling System

### Tailwind Configuration (`tailwind.config.js`)

**Colors**
- Primary: #5d6eff (deep blue)
- Accent: #29b6f6 (cyan)
- Neutral: #171717 to #fafafa (dark theme)
- Terminal: #0f1419 background

**Typography**
- Sans: Inter, system-ui
- Mono: JetBrains Mono, Fira Code
- Sizes: xs (12px) to 7xl (72px)

**Spacing**
- Base unit: 4px
- Scale: xs (4px) to 4xl (96px)

**Shadows**
- Premium: 0 20px 40px -10px rgba(93, 110, 255, 0.15)
- Glow: 0 0 20px rgba(93, 110, 255, 0.3)

**Animations**
- fadeIn, slideUp, slideDown, slideLeft, slideRight
- pulseSubtle, glow
- Custom float animation

### Global CSS (`src/styles/globals.css`)

**Base Styles**
- Box-sizing: border-box
- Scroll behavior: smooth
- Font smoothing: antialiased

**Custom Classes**
- `.text-gradient` - Gradient text
- `.text-glow` - Glow effect
- `.glass` - Backdrop blur
- `.terminal-container` - Terminal styling
- `.btn-base`, `.input-base`, `.card-base` - Component bases
- `.section-padding`, `.section-spacing` - Section utilities

**Scrollbar**
- 2px width, neutral-800 track, neutral-600 thumb

**Selection**
- Primary-500 background, white text

### Responsive Behavior

Breakpoints:
- xs: 320px
- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px
- 2xl: 1536px

Mobile-first approach with sm/md/lg/xl overrides.

### Animation System

Framer Motion variants:
- FadeIn: opacity 0→1, y 10→0
- SlideIn: directional variants
- StaggerContainer/Item: sequenced children
- ScrollTrigger: on viewport entry

### Design Philosophy

- Dark theme with premium accents
- Minimal animations (only where meaningful)
- Glass effects for depth
- Gradient text for emphasis
- Terminal-inspired for developer audience

---

## 12. Assets

### Images (`/public/images/`)

| Asset | Purpose |
|-------|---------|
| `profile.png` | Profile photo in Hero section |
| `projects/` | Project screenshots (referenced in projects.json) |

### Icons

- **Lucide React**: All UI icons
- **SVG**: Custom favicon and OG image

### Static Resources

- `favicon.svg` - Browser tab icon
- `og-image.svg` - Social sharing image
- `resume.pdf` - Resume download (referenced)

---

## 13. Existing Content

### Profile (from profile.json)

- **Name**: Deep Mehta
- **Title**: Systems, Backend & AI Engineering Student
- **Location**: Gujarat, India
- **Institution**: IIIT Vadodara (BTech CS, 2022-2026, CGPA 8.88)
- **Bio**: CS student focused on backend systems, distributed computing, AI engineering

### Projects (4 total)

1. **Portfolio Website** - AI-integrated engineering portfolio (React, Vite, Express, Groq)
2. **SUMS** - Smart University Management System (Node, Express, PostgreSQL)
3. **GitHub Analyzer** - Repository analytics dashboard (Node, Express, Chart.js)
4. **School Management API** - REST APIs with geolocation (Node, Express, MySQL)

### Skills (5 categories)

1. Backend & APIs: Node.js, Express.js, REST APIs, CRUD, Middleware
2. Databases: PostgreSQL, MongoDB, MySQL, Schema Design
3. Frontend: React, Tailwind CSS, Vite, Responsive UI
4. Engineering Foundations: DSA, Algorithms, OOP, DBMS, OS, Networks
5. Currently Exploring: System Design, Docker, DevOps, Distributed Systems, AI Engineering

### Achievements (6 items)

- SUMS Project (2026)
- AI-Integrated Portfolio (2026)
- GitHub Analyzer (2026)
- School Management API (2026)
- 700+ DSA Problems Solved
- DAIICT HackOut Finalist (2025)

### Telemetry (LeetCode)

- Total Solved: 741
- Easy: ~250
- Medium: ~400
- Hard: ~90
- Contest Rating: 1679
- Streak: 45 days

### Contact

- Email: dpmehta1211@gmail.com
- GitHub: github.com/Deep084-bot
- LinkedIn: linkedin.com/in/deepmehta
- LeetCode: leetcode.com/u/Deep04_Mehta/
- CodeChef: codechef.com/users/deep04_mehta
- Codeforces: codeforces.com/profile/dpmehta1211
- GeeksforGeeks: geeksforgeeks.org/profile/deep084

---

## 14. User Journey

### Visitor Experience

1. **Landing** - Loading screen with animation
2. **Hero** - Name, title, rotating roles, photo, stats, CTAs
3. **Terminal** - Interactive exploration or quick command buttons
4. **Education** - Academic background, achievements, certifications
5. **Telemetry** - Real-time LeetCode stats demonstrating problem-solving
6. **Projects** - Project cards with details and links
7. **AI Assistant** - Chat to learn more about portfolio
8. **Contact** - Form to reach out, social links
9. **Footer** - Copyright, tech stack, final links

### Section-by-Section Flow

- **Hero**: Scroll down or click buttons
- **Terminal**: Type commands or click quick buttons
- **Education**: Read cards, view certifications
- **Telemetry**: See live stats, click LeetCode link
- **Projects**: Browse cards, click GitHub/blog links
- **AI**: Type questions, see responses with typing animation
- **Contact**: Fill form or click social links

---

## 15. Existing Features

### Interactive Terminal
- 45+ commands with real output
- Filesystem simulation (ls, cd, pwd, cat, tree)
- Command history and fuzzy matching
- Boot animation sequence
- Computation panel with mock logs

### AI Assistant
- Portfolio-aware chat
- Context retrieval from JSON data
- Typing animation
- Error handling with retry
- Suggested prompts

### Markdown Rendering
- Engineering blog posts
- Syntax-highlighted code blocks
- Sanitized HTML output

### LeetCode Telemetry
- Real-time problem counts
- Contest ratings
- Streak tracking
- Animated counters

### Project Cards
- Image with fallback
- Architecture snippets
- Technical challenges
- Learning takeaways
- GitHub and blog links

### Contact Form
- Name, email, message fields
- Formspree integration
- Success/error feedback
- Validation

### Quick Commands
- One-click terminal commands
- Social link openers
- Navigation buttons

---

## 16. External Integrations

### GitHub
- Repository hosting for all projects
- Profile: github.com/Deep084-bot

### LeetCode
- Problem-solving stats
- API: leetcode-query package
- Endpoint: leetcode.com/u/Deep04_Mehta/

### Groq
- Primary AI provider
- Model: llama-3.1-8b-instant
- Environment: GROQ_API_KEY

### Gemini
- Fallback AI provider
- Model: gemini-pro
- Environment: GEMINI_API_KEY

### Formspree
- Contact form submission
- Endpoint: https://formspree.io/f/mzdgwyow

### Vercel
- Frontend deployment
- Backend deployment (serverless)

### Code Forces, CodeChef, GeeksforGeeks
- Coding profiles linked in footer

---

## 17. Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                     │
├─────────────────────────────────────────────────────────────┤
│  HeroSection → TerminalSection → EducationSection → ...   │
│        ↓                ↓                ↓                │
│  JSON Data          Commands         Profile Data          │
│        ↓                ↓                                 │
│  useAI Hook ──────→ /api/ai/chat                           │
│        ↓                ↓                                  │
│  ChatAssistant ◄──── AI Response + Typing Animation       │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    Vite Proxy (5173 → 4000)
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      Backend (Express)                      │
├─────────────────────────────────────────────────────────────┤
│  routes/ai.js                                              │
│       ↓                                                    │
│  classify → retrieve → buildPrompt → provider.sendPrompt   │
│       ↓           ↓           ↓            ↓               │
│ classifiers  retrieval   prompt    groq/gemini             │
│                    ↓                                         │
│            context/loader                                   │
│                    ↓                                         │
│            server/data/*.json                               │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Static Content**: JSON files → React components → Rendered sections
2. **Dynamic Content**: External APIs → Hooks → Cached state → Rendered components
3. **AI Chat**: User → Hook → API → Backend → Retrieval → Prompt → AI → Response → Animation → Display

### State Management

- Local React state for each section
- useAI hook for chat messages
- useLeetCode hook for stats caching

### Error Handling

- Frontend: Try/catch with user feedback
- Backend: Error middleware, circuit breakers
- AI: Mock responses when no API key, retries with backoff

---

## 18. Current Development Philosophy

### Engineering-First
Every feature demonstrates backend engineering principles: clean APIs, structured data, observable logging.

### Minimal Animations
Animations are purposeful, not decorative. Fade-ins on scroll, typing animation for AI responses, boot sequence for terminal authenticity.

### Terminal-Inspired
The terminal section reflects developer tooling — real commands, filesystem simulation, computation logs panel.

### Backend-Centric
The portfolio itself is backend-focused — JSON-driven content, Express API, retrieval pipeline, provider abstraction.

### Documentation-First
Extensive markdown files (ARCHITECTURE.md, PDD.md, AI-ASSISTANT-READY.md) document the system.

### Observable
JSON logging throughout backend for debugging and monitoring.

### Resilient
Circuit breakers, rate limiting, fallback providers, error boundaries.

---

## 19. Future Extension Points

The architecture already supports these extension points:

### New Sections
- Add to `src/sections/` directory
- Import in `src/App.jsx`
- Use existing `<Section>` wrapper

### New Terminal Commands
- Add to `src/data/terminal-commands.json`
- Implement in `getCommandOutput()` switch in TerminalSection.jsx
- Filesystem commands: add to FILESYSTEM object

### New AI Context
- Add JSON to `server/data/`
- Validate in `context/loader.js`
- Chunk in `retrieval/chunker.js`

### New AI Providers
- Add to `server/aiProviders/`
- Implement in `aiProviders/index.js`
- Set environment variable

### New Blog Posts
- Add markdown to `src/content/blog/`
- Frontmatter with title, tags, excerpt

### New Project Data
- Update `src/data/projects.json`
- Add images to `/public/images/projects/`

### New Coding Platforms
- Add to `profileData.js` codingProfiles array
- Create new hook for stats if API available

### Contact Form
- Update Formspree endpoint in ContactSection.jsx

### Deployment
- Vercel for frontend
- Render or Vercel for backend
- Environment variables in deployment dashboard

---

## File Inventory

### Files Inspected

**Configuration** (10)
- package.json, package-lock.json
- vite.config.js
- tailwind.config.js
- postcss.config.js
- index.html
- vercel.json
- server/package.json, server/package-lock.json
- .env, server/.env

**Documentation** (4)
- README.md
- ARCHITECTURE.md
- PDD.md
- AI-ASSISTANT-READY.md

**Frontend Source** (47)
- src/main.jsx, src/App.jsx
- src/styles/globals.css
- src/constants/index.js
- src/data/profile.json, profileData.js, projects.json, skills.json, achievements.json, terminal-commands.json
- src/sections/: HeroSection, TerminalSection, EducationAchievementsSection, LeetCodeTelemetrySection, ProjectsSection, ContactSection, FooterSection, PlaceholderSections
- src/components/layout/: index.jsx
- src/components/primitives/: index.jsx, LoadingScreen.jsx
- src/components/ai/: ChatAssistant.jsx
- src/components/molecules/: index.jsx, MarkdownRenderer.jsx, ProjectCard.jsx
- src/components/organisms/: index.jsx, ProjectDetailView.jsx
- src/components/sections/: index.jsx, ProjectsSection.jsx, BlogSection.jsx
- src/hooks/: index.js, useAI.js, useLeetCode.js, content/useProfile.js, content/useProjects.js, content/useBlogs.js, content/useTerminalCommands.js, content/index.js
- src/api/ai.js
- src/services/leetcode.js
- src/animations/index.jsx
- src/context/portfolioContext.js
- src/utils/index.js, content/parseFrontmatter.js, content/index.js, content/contentLoader.js, content/contentValidator.js, content/contentFormatter.js

**Backend Source** (16)
- server/index.js, server/cache.js, server/aiClient.js
- server/routes/: ai.js, contact.js, leetcode.js
- server/aiProviders/: index.js, groq.js, gemini.js
- server/retrieval/: index.js, chunker.js, scorer.js
- server/prompt/builder.js
- server/context/loader.js
- server/classifiers/index.js
- server/middleware/rateLimit.js
- server/services/leetcodeService.js
- server/data/: profile.json, projects.json, skills.json, dsa.json, blogs.json

**Content** (2)
- src/content/blog/scalable-backend-systems.md
- src/content/blog/distributed-systems-case-study.md

**API** (1)
- api/index.js

**Scripts** (1)
- scripts/validate-content.js

**Public Assets** (3)
- public/favicon.svg
- public/og-image.svg
- dist/ (build output, not source)

### Metrics

- **Total Components**: 15+ React components
- **Total Sections**: 9 page sections
- **Total APIs**: 5 backend endpoints
- **Total Markdown Files**: 6 (4 docs + 2 blog posts)
- **Total Data Files**: 10 JSON files
- **Total Lines Scanned**: ~15,000+

### Confirmation

PROJECT_CONTEXT.md has been generated at the repository root.