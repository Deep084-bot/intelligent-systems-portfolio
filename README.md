# Deep Mehta — Engineering Portfolio

Production-ready engineering portfolio with an interactive AI assistant, LeetCode telemetry, and a backend-first architecture. Built as a systems-oriented alternative to conventional portfolio templates.

## Live

`https://deepmehta.dev`

## Features

- **AI Assistant** — context-grounded chat powered by Groq (Llama 3.1) or Gemini. Retrieves project, skill, and technical context to answer questions conversationally. Identity is roleplayed via system prompt, not scraped from retrieval.
- **LeetCode Telemetry** — live solved-count dashboard with contest profile, streak tracking, and engineering status signals. Data fetched via Express proxy with 30-minute cache.
- **Interactive Terminal** — command-line interface accepting `whoami`, `skills`, `projects`, `currently_learning`, and more. Typing animation, command history, quick-invoke buttons.
- **Education & Certifications** — two-column dashboard with degree details, CGPA, achievement highlights, certification cards with a dark modal viewer.
- **Projects** — filtered card grid with architecture descriptions, technology tags, GitHub links.
- **Contact** — form with Formspree integration, social and coding profile links.
- **Loading Screen** — phase-based boot-sequence animation that overlays content until the React tree is ready.
- **Responsive Design** — mobile-first layout with Tailwind breakpoints. Scroll-position stabilization on load. No autofocus on AI or terminal inputs to prevent page jump.
- **SEO** — OpenGraph, Twitter Card, meta description, keywords, sitemap.xml, robots.txt, terminal-style favicon.
- **Certificate Preview** — dark modal lightbox with lazy-loaded images for linked and unlinked certificates.
- **Resume** — downloadable PDF in the hero CTA.

## Tech Stack

| Layer     | Technologies |
|-----------|-------------|
| Frontend  | React 18, Vite 4, Tailwind CSS 3, Framer Motion 10, Lucide React, Zustand |
| Backend   | Node.js, Express 4, CORS, dotenv |
| AI        | Groq SDK (default), Google Generative AI (fallback) |
| Data      | Static JSON files (projects, skills, profile, achievements, DSA stats, terminal commands) |
| External  | Formspree (contact), LeetCode GraphQL (telemetry) |
| Deployment| Vite build → `dist/`, static hosting (Vercel-ready) |

## Architecture

```
Client                         Server (Express :4000)
──────                         ─────────────────────
index.html                     POST /api/ai/chat
  └─ main.jsx                    ├─ classifier.js (category detection)
      └─ App.jsx                 ├─ retrieval/index.js (chunking + scoring)
          ├─ HeroSection         ├─ prompt/builder.js (identity + context)
          ├─ TerminalSection     └─ aiProviders/groq.js or gemini.js
          ├─ Education...
          ├─ LeetCodeTelemetry   GET  /api/leetcode/:username
          ├─ Projects             └─ leetcodeService.js (cache + GraphQL)
          ├─ AI Assistant        POST /api/contact
          ├─ Contact              └─ file-based JSONL logging
          └─ Footer
```

### AI flow

1. User submits a question via the `ChatAssistant` React component.
2. `POST /api/ai/chat` receives the message and conversation history.
3. `classifier.js` detects the category (project, skill, education, DSA, general).
4. `retrieval/index.js` chunks and scores relevant JSON data for that category.
5. `prompt/builder.js` assembles a system prompt with a short roleplay identity section and appended context.
6. The provider (Groq by default) sends `[system, history..., user]` and returns the response.

### Prompt design

- Identity is **statically defined** in the system prompt — retrieval never handles personal information.
- The model is instructed to speak as a first-person roleplay of Deep Mehta, not as an external assistant.
- Forbidden phrases include `"I don't have information..."`, `"Based on the provided context..."`, and similar hedging.
- System prompt identity section is under 500 characters for identity + examples to maximize instruction adherence on smaller models.

## Project Structure

```
ai-portfolio/
├── src/
│   ├── components/         # Primitives, layout, AI chat, molecules
│   ├── sections/           # Page sections (Hero, Terminal, Contact, etc.)
│   ├── animations/         # Framer Motion wrappers (FadeIn, SlideIn, etc.)
│   ├── hooks/              # Custom hooks (useAI, useLeetCode, useTerminalCommands)
│   ├── api/                # Chat API client
│   ├── data/               # JSON files for projects, skills, profile, DSA, achievements
│   ├── utils/              # Content loaders, validators, formatters
│   ├── context/            # Master profile and data context
│   ├── styles/             # Tailwind globals
│   ├── App.jsx
│   └── main.jsx            # Entry point (scroll restoration disabled)
├── server/
│   ├── routes/             # Express routers (ai.js, contact.js, leetcode.js)
│   ├── aiProviders/        # Groq and Gemini provider wrappers (circuit breaker, retry)
│   ├── prompt/             # System prompt builder
│   ├── retrieval/          # Context chunking, scoring, assembly
│   ├── classifiers/        # Question category detection
│   ├── services/           # LeetCode service (cached GraphQL)
│   ├── middleware/         # Rate limiting
│   ├── index.js            # Express server entry
│   └── .env                # Server environment (gitignored)
├── public/
│   ├── favicon.svg         # Terminal-style ">_" icon
│   ├── og-image.svg        # OpenGraph preview (1200×630)
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── images/             # Profile photo, certificates, project images
│   └── assets/             # Resume PDF
├── index.html              # SEO meta tags, OpenGraph, Twitter card, fonts
├── package.json
├── tailwind.config.js
└── vite.config.js          # Dev server proxies /api → :4000
```

## Local Development

```bash
# 1. Install frontend dependencies
npm install

# 2. Install server dependencies
cd server && npm install && cd ..

# 3. Start the backend (terminal 1)
cd server && npm run dev

# 4. Start the frontend dev server (terminal 2)
npm run dev
```

The Vite dev server proxies `/api` requests to `localhost:4000`, so the frontend works seamlessly with the backend during development.

### Production build

```bash
npm run build          # Outputs to dist/
npm run preview        # Preview the production build
```

## Environment Variables

Create `server/.env` for the backend:

```
AI_PROVIDER=groq                          # groq | gemini
GROQ_API_KEY=                             # https://console.groq.com
GROQ_MODEL=llama-3.1-8b-instant           # or llama-3.3-70b-versatile
GROQ_ENDPOINT=                            # optional API endpoint override
GEMINI_API_KEY=                           # https://aistudio.google.com
GEMINI_MODEL=gemini-2.0-flash             # or gemini-1.5-pro
RATE_LIMIT_AI=4                           # max AI requests per window
PORT=4000                                 # server port
```

The root `.env` controls Vite client config (gitignored):

```
VITE_API_BASE_URL=/
VITE_APP_NAME=Deep's Portfolio
VITE_APP_ENV=production
```

## AI Assistant Overview

The assistant uses a **roleplay-style system prompt** — the model speaks as Deep Mehta in first person, not as a generic chatbot answering questions about a profile. Identity is injected statically (name, college, CGPA, focus areas) and never fetched from retrieval, preventing conflicting signals.

**Retrieval grounding:** user questions are classified by topic, then relevant chunks from the JSON data sources are scored and assembled into a context block appended to the system prompt. The context includes project descriptions, skill breakdowns, education details, and DSA stats.

**Anti-hedging constraints:** the system prompt explicitly forbids phrases like "I don't have information about..." and "Based on the provided context...". The model is told to answer directly or respond briefly if something is unknown.

**Providers:** Groq (default with `llama-3.1-8b-instant`) with circuit breaker, exponential backoff, and configurable retry. Gemini (fallback). Mock mode when no API key is present — useful for development.

## Deployment

1. Build the frontend: `npm run build`
2. Deploy `dist/` to a static host (Vercel, Netlify, etc.)
3. Deploy `server/` to a Node.js host (Railway, Render, Fly.io, etc.)
4. Set environment variables on the server host
5. Point the frontend's API calls to the server URL

## Performance Notes

- Chunk size warning (~685 KB) is non-blocking. The largest contributors are `react-markdown` and `framer-motion`. Code-splitting these is a future optimization.
- Images use `loading="lazy"` and `object-contain` sizing.
- The LeetCode proxy caches responses for 30 minutes to avoid rate limits.
- AI responses are limited to 512 tokens with trimmed conversation history (6 recent turns).
- Background elements use pointer-events-none and are hidden on mobile.
- Scroll restoration is disabled at the entry point (`main.jsx`) for reliable top-of-page loading.

## Author

**Deep Mehta**  
BTech Computer Science — IIIT Vadodara  
Backend Engineering · Distributed Systems · AI Engineering  

- GitHub: [Deep084-bot](https://github.com/Deep084-bot)
- LinkedIn: [deepmehta](https://linkedin.com/in/deepmehta)
- LeetCode: [Deep04_Mehta](https://leetcode.com/u/Deep04_Mehta/)
