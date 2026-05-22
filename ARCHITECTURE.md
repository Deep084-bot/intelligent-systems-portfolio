# AI Portfolio Architecture — Phase 3

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    USER BROWSER (Frontend)                   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         AI Console Component (React)                 │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │ - Message input                                 │ │  │
│  │  │ - Message history display                       │ │  │
│  │  │ - Loading indicator                             │ │  │
│  │  │ - Suggested prompts                             │ │  │
│  │  │ - Terminal-style styling                        │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  │                       ↓ HTTP POST                      │  │
│  │         useAI hook (custom React hook)               │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │
                    (localhost:5173)
                             │
        ┌────────────────────┴────────────────────┐
        │ Network (CORS enabled)                  │
        │ Content-Type: application/json          │
        └────────────────────┬────────────────────┘
                             │
        ┌────────────────────▼────────────────────┐
        │   BACKEND EXPRESS SERVER (Port 4000)    │
        │                                         │
        │  POST /api/ai/chat                      │
        │  ↓                                      │
        │  Middleware:                           │
        │  ├─ CORS                              │
        │  ├─ JSON body parser                  │
        │  ├─ Rate limiter                      │
        │  └─ Error handler                     │
        │                                         │
        │  Request handler (routes/ai.js):        │
        │  1. Extract question & history         │
        │  2. Build system prompt                │
        │  ├─ Call contextBuilder()              │
        │  │  ├─ Load projects.json              │
        │  │  ├─ Load skills.json                │
        │  │  ├─ Load achievements.json          │
        │  │  ├─ Load terminal-commands.json     │
        │  │  └─ Load & excerpt markdown blogs   │
        │  │     (from src/content/blog/*.md)    │
        │  ├─ Sanitize context (provenance tags, │
        │  │   numeric redaction)                │
        │  └─ Combine with user question        │
        │  3. Call generateText() → Gemini API  │
        │  4. Return response or error           │
        │                                         │
        └────────────────────┬────────────────────┘
                             │
        ┌────────────────────▼────────────────────┐
        │     PORTFOLIO DATA FILES                │
        │     (src/data/)                         │
        │     ├─ profile.json                     │
        │     ├─ projects.json                    │
        │     ├─ skills.json                      │
        │     ├─ achievements.json                │
        │     ├─ dsa-stats.json                   │
        │     └─ terminal-commands.json           │
        │                                         │
        │     MARKDOWN CONTENT                    │
        │     (src/content/blog/)                 │
        │     ├─ scalable-backend-systems.md     │
        │     ├─ distributed-systems.md          │
        │     └─ [other engineering notes]       │
        └─────────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
        ┌───────▼──────┐         ┌───────▼──────┐
        │ Backend Config│         │  SDK Wrapper │
        │ (.env file)  │         │ (geminiClient│
        │              │         │  .js)        │
        │ - API Key    │         │              │
        │ - Model Name │         │ - Lazy config│
        │ - Port       │         │ - Retry logic│
        └────────────────┘        │ - Error msgs │
                                  └──────────────┘
                                         │
                          ┌──────────────▼──────────────┐
                          │   Google Generative AI API  │
                          │                              │
                          │  POST v1beta/models/        │
                          │       gemini-2.5-flash:    │
                          │       generateContent      │
                          │                              │
                          │  Headers:                   │
                          │  - Authorization: Bearer   │
                          │  - Content-Type: app/json  │
                          │                              │
                          │  Body:                      │
                          │  {                          │
                          │    contents: [{             │
                          │      role: "user",          │
                          │      parts: [{              │
                          │        text: "..." (3.2KB)  │
                          │      }]                     │
                          │    }],                      │
                          │    generationConfig: {      │
                          │      temperature: 0.05,     │
                          │      maxOutputTokens: 512   │
                          │    }                        │
                          │  }                          │
                          │                              │
                          │  Response:                  │
                          │  {                          │
                          │    candidates: [{           │
                          │      content: {             │
                          │        parts: [{            │
                          │          text: "Answer..."  │
                          │        }]                   │
                          │      }                      │
                          │    }]                       │
                          │  }                          │
                          └──────────────┬──────────────┘
                                         │
                          (latency: 1-3 seconds typical)
                                         │
                          Back to Frontend (response)
```

## Data Flow

### Request Journey
```
1. User types: "What are your strongest backend projects?"
   ↓
2. Frontend AI Console captures input
   ↓
3. useAI hook sends: POST /api/ai/chat
   └─ body: { question: "...", history: [] }
   ↓
4. Backend receives request
   ├─ Rate limiter checks quota
   ├─ JSON parser extracts body
   └─ Route handler processes
   ↓
5. Build complete prompt:
   ├─ System instructions (engineering tone, constraints)
   ├─ Portfolio context (3.2KB):
   │  ├─ Projects: [4 real projects]
   │  ├─ Skills: [authenticated proficiency levels]
   │  ├─ Achievements: [real achievements only]
   │  ├─ Blogs: [engineering notes excerpts]
   │  └─ Terminal commands: [workflow examples]
   ├─ Conversation history: [previous messages]
   └─ User question
   ↓
6. Sanitize context:
   ├─ Add provenance tags: [PROJECT], [SKILLS], [BLOG]
   ├─ Redact numeric claims (5+ digits, K/M/B suffixes)
   └─ Truncate to 28k chars (safety buffer)
   ↓
7. Call Gemini API (v1beta/gemini-2.5-flash):
   ├─ Send prompt + config (temp=0.05, maxTokens=512)
   ├─ Wait for response (avg latency: 1-3s)
   └─ Handle errors with retry logic:
      ├─ 429 (Quota): wait 30s, retry once
      ├─ 503 (Overload): wait 5s, retry once
      └─ Other: fail with diagnostic message
   ↓
8. Extract response text from SDK object:
   ├─ Try: result.response.text()
   ├─ Try: result.response.text (property)
   ├─ Try: result.candidates[0].content.parts[0].text
   └─ Fallback: empty string + warning log
   ↓
9. Send response back to frontend:
   { "answer": "The author's strongest backend projects include SUMS..." }
   ↓
10. Frontend displays answer in AI Console
```

## Context Assembly Details

### Source Files & Loading Order

```
contextBuilder.js loads (in parallel):

1. projects.json
   └─ 4 real projects with descriptions
      • Portfolio Website
      • SUMS (Smart University Management System)
      • GitHub Project Analyzer
      • School Management API

2. skills.json
   └─ Skills by category with proficiency
      • Backend: Node.js, Express (Intermediate)
      • Languages: Java, JavaScript, Python (Intermediate/Beginner)
      • Frontend: React, Tailwind (Intermediate)
      • Currently learning: System Design, Gemini API (Beginner)

3. achievements.json
   └─ Real achievements only (not inflated)
      • DSA problems solved: 741
      • LeetCode rating: ~1679
      • Key projects completed
      • Learning milestones

4. terminal-commands.json
   └─ Common engineering workflow commands
      • Build, test, deploy commands
      • Git workflows
      • Database queries

5. Markdown blogs (src/content/blog/*.md)
   └─ Each file parsed with gray-matter:
      • Front matter: { title, featured, date, ... }
      • Content: Markdown text
      • Excerpt: First 260 chars (sanitized)
      • Maximum 8 posts loaded (featured first)
```

### Sanitization Pipeline

```
Raw context text
     ↓
1. Strip excessive whitespace
   └─ Replace tabs/CR with spaces
   └─ Collapse multiple spaces
   ↓
2. Redact numeric claims
   ├─ Replace 5+ digit numbers: "10000" → "[redacted-number]"
   ├─ Replace K/M/B suffixes: "500K" → "[redacted-number]"
   └─ Replace p99 latency: "p99: 50ms" → "p99: [redacted]"
   ↓
3. Add provenance tags
   ├─ "Portfolio Website" → "[PROJECT] Portfolio Website"
   ├─ "Node.js" → "[SKILLS] Node.js"
   └─ "Blog title" → "[BLOG] Blog title"
   ↓
4. Truncate to safety limit
   └─ Max 28,000 characters (token budget safety)

Final sanitized context (~3.2KB) used in prompt
```

## Error Handling Flow

```
Request to Gemini API
        ↓
    Success?
    ├─ Yes → Extract response → Return to frontend ✓
    ├─ No → Check error type
    │   ↓
    │   ├─ 429 (Quota Exceeded)
    │   │   ├─ Log: "Quota Exceeded"
    │   │   ├─ Retry in 30s
    │   │   ├─ If still fails: Return quota_exceeded error
    │   │   └─ Frontend shows: "API quota exceeded. Try again later."
    │   │
    │   ├─ 503 (Service Unavailable)
    │   │   ├─ Log: "Service Overloaded"
    │   │   ├─ Retry in 5s
    │   │   ├─ If still fails: Return service_unavailable error
    │   │   └─ Frontend shows: "Service busy. Retrying..."
    │   │
    │   ├─ 400 (Bad Request)
    │   │   ├─ Log: Malformed request details
    │   │   └─ Frontend shows: "Invalid request format"
    │   │
    │   └─ Other errors
    │       ├─ Log: Full error message
    │       └─ Frontend shows: "AI service error. Try again."
    │
    └─ All errors include diagnostic info in logs
```

## API Contract

### Request
```javascript
POST /api/ai/chat HTTP/1.1
Host: localhost:4000
Content-Type: application/json

{
  "question": "Tell me about SUMS",
  "history": [
    { "role": "user", "text": "Who are you?" },
    { "role": "assistant", "text": "I'm a..." }
  ]
}
```

### Successful Response
```javascript
HTTP/1.1 200 OK
Content-Type: application/json

{
  "answer": "SUMS (Smart University Management System) is a backend-focused..."
}
```

### Error Response
```javascript
HTTP/1.1 500 Internal Server Error
Content-Type: application/json

{
  "error": "Gemini API failed: Free tier quota exhausted..."
}
```

## Performance Characteristics

| Component | Typical Latency | Impact |
|-----------|-----------------|--------|
| Context assembly | 50-100ms | Minimal |
| Gemini API call | 1000-3000ms | Primary latency |
| Response parsing | <50ms | Minimal |
| Network overhead | 100-500ms | Included in total |
| **Total latency** | **1.1-3.2s** | **Acceptable** |

---

## Deployment Architecture

### Development
```
Frontend (npm run dev)  →  Backend (node index.js)  →  Gemini API
localhost:5173              localhost:4000              v1beta
```

### Production (Recommended)
```
CDN (Static files)
    ↓
Vercel/Netlify (Frontend)  →  Cloud Run (Backend)  →  Gemini API
www.deepmehta.dev              /api                    v1beta
                            (with billing)
```

---

**Last Updated:** May 22, 2026  
**Status:** Phase 3 Complete ✅
