Phase 3 — AI Assistant Implementation

Files added (server):
- server/index.js - Express app exposing /api/ai/chat
- server/routes/ai.js - Chat route, prompt construction, context injection
- server/contextBuilder.js - Dynamically aggregates project, skills, achievements, and terminal command JSON into a compact context
- server/utils/geminiClient.js - Lightweight Gemini API wrapper (uses GEMINI_API_KEY)
- server/middleware/rateLimit.js - Simple per-IP limiter
- server/.env.example - environment variable guidance

Files added (frontend):
- src/components/ai/AIConsole.jsx - Terminal-style AI console UI
- src/hooks/useAI.js - Hook to manage messages, loading and streaming-like reveal
- src/api/ai.js - API client wrapper for frontend

How to run backend (local):
1. cd server
2. cp .env.example .env and set GEMINI_API_KEY (use a Google Cloud service account or API key configured to call the Generative Models API)
3. npm install
4. npm start

Gemini notes:
- The geminiClient implementation shows a generic HTTP call to the Google Generative Models endpoint. Adjust request body/fields to match the exact API contract for your account and region (Vertex AI vs Generative Models API). Prefer service account tokens for production.

Security & deployment notes are in the full architecture explanation in the project wiki.
