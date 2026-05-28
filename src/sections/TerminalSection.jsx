import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TERMINAL_CONFIG } from '../constants';
import { Section, PageContainer, Stack } from '../layout';
import { SectionTitle } from '../primitives';
import { FadeIn } from '../animations';
import { parseCommand, delay, getRandomElement } from '../utils';
import { Copy, RotateCcw } from 'lucide-react';
import profileData from '../data/profile.json';
import projectsData from '../data/projects.json';
import skillsData from '../data/skills.json';
import achievementsData from '../data/achievements.json';


const PROFILE = profileData;
const PROJECTS = projectsData.projects || [];
const SKILLS = skillsData.skills || [];
const ACHIEVEMENTS = achievementsData.achievements || [];

const BOOT_LINES = [
  { text: `Last login: ${new Date().toLocaleString()} on ttys000`, delay: 160 },
  { text: 'Welcome back, Deep.', delay: 140 },
  { text: 'Loading portfolio kernel...', delay: 200 },
  { text: 'Initializing module system...', delay: 180 },
  { text: 'Mounting project filesystems...', delay: 250 },
  { text: 'Starting backend services...', delay: 150 },
  { text: 'AI subsystem online.', delay: 300 },
  { text: 'Session restored. Ready.', delay: 200 },
  { text: 'Type "help" for available commands.', delay: 150 },
];

const GIT_MESSAGES = [
  'fix: resolve race condition in request pipeline',
  'feat: add caching layer for AI responses',
  'refactor: extract context builder from route handler',
  'chore: update dependencies and audit fixes',
  'docs: add API examples to readme',
  'fix: handle edge case in empty DSA stats',
  'feat: implement fuzzy command matching',
  'style: align terminal output padding',
  'test: add integration test for chat endpoint',
  'perf: reduce re-renders in terminal history',
];

const QUOTES = [
  '"First, solve the problem. Then, write the code." – John Johnson',
  '"Programs must be written for people to read." – Harold Abelson',
  '"Make it work, make it right, make it fast." – Kent Beck',
  '"The best way to learn is to build." – Unknown Engineer',
  '"Simplicity is prerequisite for reliability." – Edsger Dijkstra',
  '"Any fool can write code that a computer understands." – Martin Fowler',
  '"Talk is cheap. Show me the code." – Linus Torvalds',
  '"The most dangerous phrase in language is: we have always done it this way." – Grace Hopper',
];

const FILESYSTEM = {
  '/': {
    type: 'dir',
    children: {
      'about.txt': { type: 'file', content: () => `${PROFILE.name}\n${PROFILE.title}\n${PROFILE.bio}` },
      'skills.txt': { type: 'file', content: () => SKILLS.map(s => `${s.category}: ${s.skills.map(x => x.name || x).join(', ')}`).join('\n') },
      'projects': {
        type: 'dir',
        children: {
          'portfolio-ai.md': { type: 'file', content: () => `# Portfolio AI\n\nA project combining retrieval, structured prompts and LLMs to power portfolio-aware assistant.\n\nTech: Node, React, Groq API, Vite, Express` },
          'github-analyzer.md': { type: 'file', content: () => `# GitHub Analyzer\n\nTooling to analyze repositories for insights, contribution patterns, and hot spots.` },
          'sums.md': { type: 'file', content: () => `# Sums Project\n\nUtility microservice for quick-sum analytics and batch processing.` },
          'academic-system.md': { type: 'file', content: () => `# Academic System\n\nCourse management prototype with role-based access and grading pipelines.` },
        }
      },
      'notes': {
        type: 'dir',
        children: {
          'retrieval-pipeline.md': { type: 'file', content: () => `# Retrieval Pipeline\n\nNotes: context assembly, chunking strategy, relevance scoring, fallback heuristics.` },
          'groq-debugging.md': { type: 'file', content: () => `# Groq Debugging\n\nDebug steps used: direct fetch, SDK test, DNS/TCP checks, requestId tracing, abort wiring.` },
          'backend-learning.md': { type: 'file', content: () => `# Backend Learning\n\nTopics: request lifecycle, AbortController, error normalization, circuit breakers, retry/backoff.` },
          'scaling-notes.md': { type: 'file', content: () => `# Scaling Notes\n\nObservations: serialized queues, provider rate limits, caching strategies, horizontal scaling tradeoffs.` },
        }
      },
      'README.md': { type: 'file', content: () => '# Deep Mehta - Portfolio\n\nBackend engineer & AI engineering learner.\nType `help` for available commands.' },
    },
  },
};

// --- Virtual filesystem utilities ---
// Resolve a path (relative or absolute) against the current working directory.
function resolvePath(cwd, target) {
  if (!target) return cwd;
  // normalize slashes
  const parts = (target.startsWith('/') ? target : `${cwd === '/' ? '' : cwd}${cwd === '/' ? '' : '/'}${target}`)
    .split('/')
    .filter(Boolean);
  const stack = [];
  for (const p of parts) {
    if (p === '.') continue;
    if (p === '..') {
      if (stack.length) stack.pop();
      continue;
    }
    stack.push(p);
  }
  return '/' + stack.join('/');
}

// Get node at absolute path. Returns { node, name }
function getNodeAtPath(path) {
  const clean = path === '/' ? '/' : path.replace(/\/+$/,'');
  if (clean === '/') return { node: FILESYSTEM['/'], name: '/' };
  const parts = clean.split('/').filter(Boolean);
  let node = FILESYSTEM['/'];
  let name = '/';
  for (const p of parts) {
    if (!node || node.type !== 'dir' || !node.children) return { node: null, name: p };
    if (!Object.prototype.hasOwnProperty.call(node.children, p)) return { node: null, name: p };
    node = node.children[p];
    name = p;
  }
  return { node, name };
}

function listDirectory(path) {
  const { node } = getNodeAtPath(path);
  if (!node) return { error: `ls: cannot access '${path}': No such file or directory` };
  if (node.type !== 'dir') return { error: `ls: cannot access '${path}': Not a directory` };
  const entries = Object.entries(node.children || {}).map(([name, entry]) => entry.type === 'dir' ? `${name}/` : name);
  return { entries };
}

function readFile(path) {
  const { node } = getNodeAtPath(path);
  if (!node) return { error: `cat: ${path}: No such file or directory` };
  if (node.type === 'dir') return { error: `cat: ${path}: Is a directory` };
  const content = typeof node.content === 'function' ? node.content() : (node.content || '');
  return { content };
}

function renderTree(path, prefix = '') {
  const { node } = getNodeAtPath(path);
  if (!node) return `tree: ${path}: No such directory`;
  if (node.type !== 'dir') return `tree: ${path}: Not a directory`;
  const lines = [];
  const children = Object.entries(node.children || {});
  children.forEach(([name, child], idx) => {
    const isLast = idx === children.length - 1;
    const pointer = isLast ? '└── ' : '├── ';
    lines.push(`${prefix}${pointer}${name}${child.type === 'dir' ? '/' : ''}`);
    if (child.type === 'dir') {
      const nextPrefix = prefix + (isLast ? '    ' : '│   ');
      lines.push(renderTree(`${path === '/' ? '' : path}/${name}`, nextPrefix));
    }
  });
  return lines.join('\n');
}

const MOCK_CONTAINERS = [
  { id: 'fc9d7b1f2e3a', image: 'node:18-alpine', command: 'node server/index.js', created: '2h', status: 'Up 2h', ports: '4000/tcp' },
  { id: 'a8b3c4d5e6f7', image: 'postgres:16', command: 'docker-entrypoint.s…', created: '2h', status: 'Up 2h', ports: '5432/tcp' },
  { id: 'e5f6a7b8c9d0', image: 'redis:7-alpine', command: 'redis-server', created: '2h', status: 'Up 2h', ports: '6379/tcp' },
  { id: 'b1c2d3e4f5a6', image: 'nginx:alpine', command: 'nginx -g daemon off;', created: '1h', status: 'Up 1h', ports: '80/tcp' },
];

const MOCK_LOGS = [
  '[2026-05-23T10:15:23.421Z] INFO  server: Listening on port 4000',
  '[2026-05-23T10:15:23.422Z] INFO  cache: Initialized in-memory store',
  '[2026-05-23T10:15:24.001Z] INFO  ai: Provider groq ready',
  '[2026-05-23T10:15:24.102Z] INFO  context: Built 5 context sections',
  '[2026-05-23T10:15:30.550Z] INFO  router: POST /api/ai/chat 200 524ms',
  '[2026-05-23T10:15:31.200Z] WARN  rate-limit: 2 requests from 127.0.0.1',
  '[2026-05-23T10:15:35.110Z] INFO  router: POST /api/ai/chat 200 412ms',
  '[2026-05-23T10:15:40.890Z] INFO  cache: Miss for ctx:profile:who is deep',
  '[2026-05-23T10:15:41.203Z] INFO  ai: Generated response (312 tokens)',
  '[2026-05-23T10:15:42.001Z] INFO  router: POST /api/ai/chat 200 1102ms',
];

const MOCK_HEALTH = [
  { name: 'API Server', status: 'healthy', latency: '12ms' },
  { name: 'Database (PostgreSQL)', status: 'healthy', latency: '3ms' },
  { name: 'Cache (Redis)', status: 'healthy', latency: '1ms' },
  { name: 'AI Provider (Groq)', status: 'healthy', latency: '524ms' },
  { name: 'Rate Limiter', status: 'healthy', latency: '0ms' },
];

const COMMAND_ALIASES = {
  cls: 'clear',
  gh: 'github',
  lc: 'leetcode',
  ll: 'ls',
  'npm run dev': 'npm',
  'npm start': 'npm',
  neofetch: 'neofetch',
};

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function findSimilar(cmd, candidates, threshold = 3) {
  let best = null, bestDist = Infinity;
  for (const c of candidates) {
    const dist = levenshtein(cmd, c);
    if (dist < bestDist && dist <= threshold) {
      bestDist = dist;
      best = c;
    }
  }
  return best;
}

export const TerminalSection = () => {
  const [bootPhase, setBootPhase] = useState(false);
  const [bootIndex, setBootIndex] = useState(0);
  const [bootLines, setBootLines] = useState([]);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [filesystem] = useState(FILESYSTEM);
  const [cwd, setCwd] = useState('/');
  const terminalRef = useRef(null);
  const inputRef = useRef(null);
  const userAtBottomRef = useRef(true);

  // Observability / command center state (right-side panel)
  const [obsLogs, setObsLogs] = useState(() => MOCK_LOGS.slice(-6));
  const [serviceHealth] = useState(MOCK_HEALTH);

  // track whether user scrolled away from bottom to avoid forcing scroll
  useEffect(() => {
    const el = terminalRef.current;
    if (!el) return;
    const onScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      userAtBottomRef.current = distanceFromBottom < 200;
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Simulate lightweight computation panel updates (visual only)
  const [compLines, setCompLines] = useState([]);

  // Determine semantic color for a log message
  const getLogColor = (message) => {
    if (message.includes('CONNECTED') || message.includes('vector.db')) return 'text-green-400';
    if (message.includes('ACTIVE') || message.includes('inference') || message.includes('latency') || message.includes('similarity')) return 'text-cyan-400';
    if (message.includes('latency') || message.includes('ms') || message.includes('cpu') || message.includes('gpu')) return 'text-amber-400';
    if (message.includes('error') || message.includes('failed') || message.includes('unavailable')) return 'text-red-400/70';
    if (message.includes('warning') || message.includes('warn')) return 'text-orange-400/70';
    return 'text-neutral-400';
  };

  useEffect(() => {
    const pool = [
      'tokens: 0.00 -> 12.8k',
      'embedding.dim=1536',
      'inference.latency=34ms',
      'retrieval.chunks=8',
      'prompt.tokens=482',
      'memory.used=128MB',
      'cpu: 4.2%',
      'gpu: 0%',
      'vector.sim=0.8723',
      'vector.db=CONNECTED',
      'inference=ACTIVE',
    ];
    const iv = setInterval(() => {
      const now = new Date();
      const time = now.toTimeString().split(' ')[0];
      const msg = pool[Math.floor(Math.random() * pool.length)];
      const entry = `[${time}] ${msg}`;
      setCompLines(prev => [...prev.slice(-26), entry]);
    }, 900 + Math.floor(Math.random() * 700));
    return () => clearInterval(iv);
  }, []);

  // Start terminal boot sequence after app signals it's ready
  useEffect(() => {
    const onLoaded = () => {
      setBootLines([]);
      setBootIndex(0);
      setBootPhase(true);
    };
    window.addEventListener('app:loaded', onLoaded);
    return () => window.removeEventListener('app:loaded', onLoaded);
  }, []);

  const commandNames = useMemo(() => [
    'whoami', 'skills', 'projects', 'achievements', 'dsa', 'blog',
    'contact', 'help', 'clear', 'coffee', 'sudo', 'matrix', 'vibecheck',
    'neofetch', 'repo_status', 'ping', 'ai', 'easteregg',
    'roadmap', 'currently_reading', 'stack', 'focus', 'github', 'resume',
    'clear cache', 'deploy', 'logs', 'api health', 'docker ps', 'top',
    'grep bugs', 'commit', 'motivation', 'ls', 'cd', 'pwd', 'cat', 'tree',
    'npm', 'status', 'open', 'history',
  ], []);

  const commandAliases = useMemo(() => ({
    cls: 'clear', gh: 'github', lc: 'leetcode', ll: 'ls', la: 'ls', '..': '..', '...': '...', home: 'home',
  }), []);

  useEffect(() => {
    if (!bootPhase) return;
    if (bootIndex >= BOOT_LINES.length) {
      const t = setTimeout(() => {
        setBootPhase(false);
        // Persist boot lines in history permanently + add welcome message
        const bootHistory = BOOT_LINES.map(line => ({ type: 'output', content: line.text }));
        setHistory(bootHistory);
        setBootLines([]);
      }, 400);
      return () => clearTimeout(t);
    }
    const line = BOOT_LINES[bootIndex];
    const t = setTimeout(() => {
      setBootLines(prev => [...prev, { type: 'boot', content: line.text }]);
      setBootIndex(i => i + 1);
    }, line.delay);
    return () => clearTimeout(t);
  }, [bootPhase, bootIndex]);

  useEffect(() => {
    const el = terminalRef.current;
    if (!el) return;
    // Auto-scroll when user is near the bottom or when terminal is actively producing output
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    // Only auto-scroll when user is already at/near bottom — respect manual scrolls
    const shouldAuto = userAtBottomRef.current || distanceFromBottom < 300;
    if (shouldAuto) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [history, bootLines, isLoading]);

  // Do not autofocus terminal input on mount to avoid scrolling the page on load.
  // inputRef.current?.focus();

  const addOutput = useCallback((content) => {
    setHistory(prev => [...prev, { type: 'output', content }]);
  }, []);

  const getCommandOutput = useCallback((command, args) => {
    switch (command) {
      case 'whoami': {
        const roles = PROFILE.identity?.primaryRoles?.join(', ') || 'Backend Engineering Student';
        return `Name: ${PROFILE.name}
Title: ${PROFILE.title}
Location: ${PROFILE.location}
Bio: ${PROFILE.bio}

Primary Roles: ${roles}
Technical Interests: ${PROFILE.technicalInterests?.join(', ')}
Strengths: ${PROFILE.strengths?.join(', ')}

Career Direction: ${PROFILE.careerDirection?.join(', ')}
Personality: ${PROFILE.personalitySignals?.join(', ')}`;
      }

      case 'skills': {
        return SKILLS.map(cat => {
          const names = cat.skills.map(s => `  • ${typeof s === 'string' ? s : s.name}`).join('\n');
          return `${cat.category}\n${names}`;
        }).join('\n\n');
      }

      case 'projects': {
        return PROJECTS.slice(0, 5).map((p, i) => {
          const tech = (p.tech && p.tech.join(', ')) || (p.tags && p.tags.join(', ')) || 'N/A';
          return `[${i + 1}] ${p.title}
    Status: ${p.status || 'N/A'} | Tech: ${tech}
    ${p.shortDescription || ''}`;
        }).join('\n\n');
      }

      case 'achievements': {
        if (!ACHIEVEMENTS.length) return 'No achievements loaded.';
        return ACHIEVEMENTS.map(a => `[${a.category}] ${a.title}\n  ${a.description}`).join('\n\n');
      }

      case 'dsa': {
        return 'DSA & competitive programming stats are displayed in the dedicated LeetCode section. Use "scroll" or navigate to view telemetry.';
      }

      case 'blog': {
        return 'Blog posts are accessed via the Engineering Notes section. Use "help" to see available browsing commands.';
      }

      case 'contact': {
        const c = PROFILE.contact || {};
        return Object.entries(c).map(([k, v]) => `  • ${k}: ${v}`).join('\n');
      }

      case 'roadmap': {
        return `Current Learning Roadmap:

  Backend Engineering
    → Node.js/Express deep dive
    → Database design & optimization
    → API architecture patterns

  Distributed Systems
    → Consistency models
    → Consensus algorithms
    → Event-driven architectures

  AI Engineering
    → LLM fundamentals
    → Prompt engineering patterns
    → RAG & vector databases

  System Design
    → Scalability patterns
    → Caching strategies
    → Load balancing

  Operating Systems
    → Process & memory management
    → Concurrency & synchronization
    → File systems & I/O

  ML Fundamentals
    → Supervised & unsupervised learning
    → Neural network basics
    → Model evaluation & tuning`;
      }

      case 'currently_reading': {
        return `Currently Reading & Exploring:

  • Designing Data-Intensive Applications (Kleppmann)
  • Operating Systems: Three Easy Pieces
  • System Design Interview (Alex Xu)
  • Deep Learning (Goodfellow)
  • Machine Learning Engineering (Andriy Burkov)`;
      }

      case 'stack': {
        return `Backend Stack:

  Runtime:    Node.js v18+
  Framework:  Express.js
  Database:   PostgreSQL 16 / MongoDB
  Cache:      Redis 7
  ORM:        Prisma / raw SQL
  Auth:       JWT / session-based

DevOps Stack:

  Container:  Docker
  CI/CD:      GitHub Actions
  Hosting:    Vercel / Render
  OS:         Linux (Ubuntu), macOS

AI Stack:

  Provider:   Groq / Gemini API
  Models:     Llama 3.1, Gemini Pro
  Patterns:   RAG, prompt chaining`;
      }

      case 'focus': {
        return `Current Engineering Focus:

  • Building practical backend systems
  • Improving architecture & design thinking
  • Creating AI-integrated applications
  • Deepening system design fundamentals
  • Learning distributed systems concepts

${PROFILE.currentlyLearning ? 'Currently Learning:\n' + PROFILE.currentlyLearning.map(s => `  → ${s}`).join('\n') : ''}`;
      }

      case 'github':
        return 'Opening GitHub profile...\nhttps://github.com/Deep084-bot';

      case 'resume':
        return 'Resume feature coming soon. For now, connect via email or LinkedIn.';

      case 'status': {
        return `System Status:
  Uptime:        ${Math.floor(Math.random() * 72) + 1}h ${Math.floor(Math.random() * 60)}m
  Requests:      ${Math.floor(Math.random() * 1000) + 200}
  Avg Response:  ${Math.floor(Math.random() * 200) + 50}ms
  Cache Hit:     ${Math.floor(Math.random() * 30) + 60}%
  Memory:        ${Math.floor(Math.random() * 200) + 100}MB / 512MB
  CPU:           ${(Math.random() * 30 + 5).toFixed(1)}%`;
      }

      case 'coffee': {
        const cups = Math.floor(Math.random() * 8) + 1;
        const levels = ['full', 'half', 'nearly empty', 'cold'];
        return `☕ Coffee Status

  Cups today:  ${cups}
  Current cup: ${getRandomElement(levels)}
  Brew method: ${getRandomElement(['Pour-over', 'French press', 'Espresso', 'Aeropress'])}

${cups > 5 ? 'Warning: Approaching caffeine threshold.' : 'Caffeine levels optimal for engineering.'}`;
      }

      case 'sudo': {
        if (args[0] === 'hire-deep') {
          return `🔧 sudo: authorizing hiring process...

  Permission granted.
  Initiating deep talent acquisition protocol...

  Resume:     Available on request
  Portfolio:  https://deepmehta.dev
  Email:      ${PROFILE.contact?.email || 'available in profile'}
  GitHub:     github.com/Deep084-bot

  System ready for technical interview.
  Type 'contact' for more details.`;
        }
        return `sudo: ${args.join(' ')}: command not found. Try 'sudo hire-deep'.`;
      }

      case 'matrix': {
        return `Initializing Matrix visualization...

  Warning: This terminal may look cooler temporarily.
  Simulating green text cascade...
  
  > Connecting to the Matrix...
  > Loading code waterfalls...
  > 01001110 01100101 01101111 01101110
  
  Just kidding. It's a terminal, not a movie.`;
      }

      case 'vibecheck': {
        const vibes = [
          '✨ Vibe check passed. Engineering mindset: optimal.',
          '🔧 Developer is currently in flow state. Do not disturb.',
          '📐 System architecture thinking in progress.',
          '⚡ Productive energy detected. Backend mode engaged.',
          '🧠 Solving problems. Status: focused.',
          '☕ Caffeinated and ready to deploy.',
        ];
        return `┌─────────────────────────────────────┐
│ Developer Vibe Check                │
└─────────────────────────────────────┘

${getRandomElement(vibes)}

  Mood: ${getRandomElement(['focused', 'curious', 'building', 'learning', 'engineering'])}
  Energy: ${getRandomElement(['high', 'sustainable', 'caffeinated'])}
  Bugs today: ${Math.floor(Math.random() * 5)}`;
      }

      case 'neofetch': {
        return `        ████████████        ${PROFILE.name}
      ██            ██      ${PROFILE.title}
    ██                ██    -----------------
    ██    ████  ████    ██  OS:       PortfolioOS v2.0
    ██    ████  ████    ██  Host:     Vercel Edge
    ██    ████  ████    ██  Kernel:   React 18 + Node 18
    ██                ██    Uptime:    ${Math.floor(Math.random() * 30) + 1} days
      ██            ██      Shell:    /bin/portfolio
        ████████████        DE:       Tailwind UI
                            Terminal: Interactive Mode

  Projects: ${PROJECTS.length} featured
  Location: ${PROFILE.location}
  Interests: ${PROFILE.technicalInterests?.slice(0, 3).join(', ')}`;
      }

      // Lightweight UNIX-like helpers
      case 'date': {
        return new Date().toString();
      }

      case 'who': {
        return `${PROFILE.name}  ${PROFILE.title}`;
      }

      case 'uptime': {
        const days = Math.floor(Math.random() * 5) + 1;
        const hours = Math.floor(Math.random() * 23);
        return `up ${days} days, ${hours} hours`;
      }

      case 'uname': {
        return 'PortfolioOS Linux 6.1.0-react';
      }

      case 'env': {
        return `NODE_ENV=${process.env.NODE_ENV || 'development'}\nPORT=5173\nAPI_URL=/api/ai`;
      }

      case 'echo': {
        return args.join(' ');
      }

      case 'repo_status': {
        const files = ['src/sections/TerminalSection.jsx', 'src/hooks/useAI.js', 'server/routes/ai.js', 'server/contextBuilder.js'];
        const changed = files.filter(() => Math.random() > 0.4);
        return `On branch main
Your branch is up to date with 'origin/main'.

${changed.length ? 'Changes not staged for commit:' : 'Nothing to commit, working tree clean'}
${changed.map(f => `  modified:   ${f}`).join('\n')}

Untracked files:
  .env.local

${changed.length ? `Files changed: ${changed.length}  |  Insertions: ${Math.floor(Math.random() * 50) + 10}  |  Deletions: ${Math.floor(Math.random() * 20)}` : ''}`;
      }

      case 'ping': {
        const target = args[0] || 'backend';
        const latency = Math.floor(Math.random() * 80) + 10;
        if (target === 'backend') {
          return `PING backend.local (127.0.0.1): 56 data bytes
64 bytes from 127.0.0.1: icmp_seq=1 ttl=64 time=${latency}ms
64 bytes from 127.0.0.1: icmp_seq=2 ttl=64 time=${latency + 2}ms
64 bytes from 127.0.0.1: icmp_seq=3 ttl=64 time=${latency - 1}ms

--- backend.local ping statistics ---
3 packets transmitted, 3 received, 0% packet loss
time=${latency + 5}ms`;
        }
        if (target === 'google') {
          return 'Pinging google.com... Network unreachable. (This is a portfolio terminal.)';
        }
        return `ping: ${target}: Name or service not known`;
      }

      case 'ai': {
        if (args[0] === 'status') {
          return `AI Service Status:

  Provider:  ${process.env.NODE_ENV === 'development' ? 'Groq' : 'Gemini'}
  Model:     Llama 3.1 8B / Gemini Pro
  Status:    Online and responding
  Avg Resp:  ~1200ms
  Context:   Portfolio-aware (profile + projects + skills + DSA)
  Features:  Chat, Q&A, engineering guidance

  Last request: ${new Date().toLocaleTimeString()}`;
        }
        return 'Usage: ai status';
      }

      case 'easteregg': {
        const eggs = [
          '🐛 You found a bug. It\'s a feature now.',
          'There is no easter egg. You\'re the easter egg.',
          '42',
          'sudo rm -rf /* (just kidding)',
          'This terminal was built with ☕ and 🎵.',
          'Actually, the real easter egg was the friends we made along the way.',
          'Deep\'s terminal runs on 100% recycled electrons.',
          'I think therefore I am... a terminal.',
          'LeetCode streak: 45 days. Don\'t break the chain.',
        ];
        return `\n  ${getRandomElement(eggs)}\n`;
      }

      case 'clear cache': {
        return `🧹 Clearing cache...

  Dropping Redis cache... done.
  Invalidating CDN... done.
  Clearing browser storage... done.
  Flushing DNS... done.
  Resetting local state... done.

  Cache cleared. ${Math.floor(Math.random() * 50) + 10} entries removed.
  System performance restored.`;
      }

      case 'deploy': {
        const steps = [
          '✓ Linting passed',
          '✓ Running test suite (2s)',
          '✓ Building for production (1.5s)',
          '✓ Optimizing assets',
          '✓ Uploading to CDN',
          '✓ Deploying to Vercel',
          '✓ Health check passed',
          '✓ Deployment complete',
        ];
        const done = Math.floor(Math.random() * 3) + 6;
        return `🚀 Deploying to production...

${steps.slice(0, done).map(s => `  ${s}`).join('\n')}
${done < steps.length ? `\n  ⏳ Waiting for: ${steps.slice(done).join(', ')}` : '\n  ✅ Deployment successful (v2.0.' + Math.floor(Math.random() * 50) + ')'}`;
      }

      case 'logs': {
        return MOCK_LOGS.slice(Math.max(0, MOCK_LOGS.length - 8)).join('\n');
      }

      case 'api health': {
        const results = MOCK_HEALTH.map(h =>
          `  ${h.name.padEnd(35)} ${h.status === 'healthy' ? '✓' : '✗'} ${h.status} (${h.latency})`
        ).join('\n');
        return `Service Health Check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${results}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
All services operational.`;
      }

      case 'top': {
        const processes = [
          { pid: 1423, user: 'node', cpu: '2.4', mem: '1.2', cmd: 'node server/index.js' },
          { pid: 891, user: 'postgres', cpu: '0.8', mem: '3.1', cmd: 'postgres: writer process' },
          { pid: 892, user: 'postgres', cpu: '0.3', mem: '0.8', cmd: 'postgres: wal writer' },
          { pid: 2056, user: 'node', cpu: '1.1', mem: '0.5', cmd: 'vite --port 5173' },
          { pid: 312, user: 'redis', cpu: '0.2', mem: '0.3', cmd: 'redis-server *:6379' },
          { pid: 1789, user: 'deepmehta', cpu: '5.2', mem: '1.8', cmd: 'cursor' },
          { pid: 423, user: 'deepmehta', cpu: '12.5', mem: '4.2', cmd: 'chrome' },
          { pid: 1, user: 'root', cpu: '0.0', mem: '0.1', cmd: 'init' },
        ];
        return `top - ${new Date().toLocaleTimeString()}  up ${Math.floor(Math.random() * 5) + 1} day(s), ${Math.floor(Math.random() * 60)} users, load average: ${(Math.random() * 2).toFixed(2)}, ${(Math.random() * 1.5).toFixed(2)}, ${(Math.random() * 1).toFixed(2)}
Tasks: ${processes.length} total, 1 running, ${processes.length - 1} sleeping

PID    USER       CPU%  MEM%  COMMAND
${processes.map(p => `${String(p.pid).padEnd(6)} ${p.user.padEnd(10)} ${p.cpu.padEnd(5)} ${p.mem.padEnd(5)} ${p.cmd}`).join('\n')}`;
      }

      case 'grep bugs': {
        const bugs = [
          'src/hooks/useAI.js:47:   # potential race condition on retry',
          'server/routes/ai.js:22:  # missing input validation edge case',
          'src/sections/TerminalSection.jsx:301:  // TODO: fix infinite scroll edge case',
          'server/contextBuilder.js:120:  # null check needed for empty profile',
          'src/api/ai.js:15: # timeout not cleared on error path',
        ];
        return `Searching for "bug" in ${Math.floor(Math.random() * 50) + 20} files...

${bugs.map(b => `  ${b}`).join('\n')}

${bugs.length} match(es) found. Time to debug.`;
      }

      case 'commit': {
        return `[main ${Math.random().toString(36).slice(2, 9)}] ${getRandomElement(GIT_MESSAGES)}
 ${Math.floor(Math.random() * 10) + 1} file(s) changed, ${Math.floor(Math.random() * 50) + 5} insertions(+), ${Math.floor(Math.random() * 10)} deletions(-)`;
      }

      case 'motivation': {
        return `\n  ${getRandomElement(QUOTES)}\n`;
      }

      case 'docker ps':
        return `CONTAINER ID   IMAGE               COMMAND                  CREATED   STATUS    PORTS
${MOCK_CONTAINERS.map(c =>
  `${c.id}   ${c.image.padEnd(18)} ${c.command.padEnd(22)} ${c.created}   ${c.status}   ${c.ports}`
).join('\n')}

Status: ${MOCK_CONTAINERS.length} running, 0 stopped`;

      case 'docker':
        return `Usage: docker [ps]

Available commands:
  ps    List running containers`;

      case 'npm':
        return `> ai-portfolio@0.1.0 dev
> vite

  VITE v4.5.14  ready in 587ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.5:5173/

✓ Frontend running
✓ HMR enabled
✓ API proxy to http://localhost:4000 active`;

      case 'open': {
        const targets = {
          github: 'https://github.com/Deep084-bot',
          linkedin: 'https://linkedin.com/in/deepmehta',
          leetcode: 'https://leetcode.com/u/Deep04_Mehta/',
          codechef: 'https://www.codechef.com/users/deep04_mehta',
          codeforces: 'https://codeforces.com/profile/dpmehta1211',
          gfg: 'https://www.geeksforgeeks.org/profile/deep084?tab=activity',
          email: `mailto:${PROFILE.contact?.email || ''}`,
          portfolio: 'https://deepmehta.dev',
        };
        const target = args[0];
        if (target && targets[target]) {
          window.open(targets[target], '_blank');
          return `Opening ${target}...`;
        }
        return `Usage: open [github|linkedin|leetcode|codechef|codeforces|gfg|email|portfolio]`;
      }

      case 'ls': {
        const target = args[0] || '';
        const prefix = cwd === '/' ? '' : cwd;
        if (target === 'projects' || cwd.includes('projects')) {
          return PROJECTS.map(p => `${p.title}/`).join('\n');
        }
        if (target === 'notes' || cwd.includes('notes')) {
          return 'engineering-notes/  dsa-notes/  system-design/';
        }
        const entries = Object.entries(FILESYSTEM['/']?.children || {});
        return entries.map(([name, entry]) =>
          entry.type === 'dir' ? `${name}/` : name
        ).join('  ');
      }

      case 'cd': {
        const target = args[0] || '/';
        const validDirs = ['/', '/projects', '/notes'];
        if (target === '..' || target === '/') {
          setCwd('/');
          return '';
        }
        const dir = target.startsWith('/') ? target : (cwd === '/' ? `/${target}` : `${cwd}/${target}`);
        if (validDirs.includes(dir) || validDirs.includes(target)) {
          setCwd(dir);
          return '';
        }
        return `cd: ${target}: No such directory`;
      }

      case 'pwd':
        return cwd;

      case 'tree': {
        if (args[0] && args[0] !== '-L' && args[0] !== '1' && args[0] !== '2') {
          const lower = args[0];
          const entry = FILESYSTEM['/']?.children?.[lower];
          if (entry?.type === 'dir') {
            return `${lower}/\n  (empty)`;
          }
          return `tree: ${lower}: No such directory`;
        }
        return `.
├── about.txt
├── skills.txt
├── projects/
├── notes/
├── README.md

3 files, 2 directories`;
      }

      case 'cat': {
        const file = args[0] || '';
        if (file === 'about.txt' || file.endsWith('about.txt')) {
          return `${PROFILE.name}\n${PROFILE.title}\n${PROFILE.bio}\n\nLocation: ${PROFILE.location}\nInterests: ${PROFILE.technicalInterests?.join(', ')}`;
        }
        if (file === 'skills.txt' || file.endsWith('skills.txt')) {
          return SKILLS.map(s => `${s.category}: ${s.skills.map(x => x.name || x).join(', ')}`).join('\n');
        }
        if (file === 'README.md' || file.endsWith('README.md')) {
          return `# Deep Mehta - Portfolio\n\nBackend engineer & AI engineering learner.`;
        }
        return `cat: ${file}: No such file or directory`;
      }

      case 'history':
        return history
          .filter(h => h.type === 'input')
          .map((h, i) => `  ${i + 1}  ${h.content}`)
          .join('\n') || 'No commands in history.';

      case 'help': {
        const cmds = [
          ['whoami', 'Portfolio owner information'],
          ['skills', 'Technical skills (from profile data)'],
          ['projects', 'Featured engineering projects'],
          ['dsa', 'DSA problem-solving statistics'],
          ['achievements', 'Milestones & achievements'],
          ['contact', 'Contact information'],
          ['blog', 'Engineering notes'],
          ['roadmap', 'Current learning roadmap'],
          ['focus', 'Current focus areas'],
          ['currently_reading', 'Books & resources'],
          ['stack', 'Backend & devops stack'],
          ['status', 'System status overview'],
          ['history', 'Command history'],
          ['clear', 'Clear terminal screen'],
          ['', ''],
          ['ls', 'List files/directories'],
          ['cd <dir>', 'Change directory'],
          ['pwd', 'Print working directory'],
          ['cat <file>', 'Display file contents'],
          ['tree', 'Directory structure'],
          ['', ''],
          ['ping [target]', 'Test connectivity'],
          ['ai status', 'AI service info'],
          ['logs', 'Backend server logs'],
          ['api health', 'Service health checks'],
          ['docker ps', 'Running containers'],
          ['top', 'Process monitor'],
          ['npm', 'Dev server status'],
          ['open <link>', 'Open external link'],
          ['', ''],
          ['coffee', 'Developer coffee status'],
          ['vibecheck', 'Developer vibe check'],
          ['neofetch', 'Portfolio system info'],
          ['sudo hire-deep', 'Authorize hiring'],
          ['commit', 'Random git message'],
          ['grep bugs', 'Search for bugs'],
          ['deploy', 'Deploy to production'],
          ['clear cache', 'Clear system cache'],
          ['motivation', 'Engineering quote'],
          ['easteregg', 'Hidden surprise'],
          ['matrix', 'Movie reference'],
          ['', ''],
          ['cls', 'Alias for clear'],
          ['gh', 'Alias for github'],
        ];
        return `Available Commands:\n\n${cmds.map(([cmd, desc]) => cmd ? `  ${cmd.padEnd(22)} ${desc}` : '').join('\n')}\n\nType a command and press Enter.`;
      }

      default:
        return null;
    }
  }, [cwd, history]);

  const resolveAlias = useCallback((cmd) => commandAliases[cmd] || cmd, [commandAliases]);

  const handleCommand = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setHistory(prev => [...prev, { type: 'input', content: input.trim() }]);

    const parsed = parseCommand(input);
    const rawCmd = parsed.command; // lowercased command token
    // preserve original argument casing for filesystem paths and echoes
    const argsPreserve = input.trim().split(/\s+/).slice(1);
    const inputLower = input.trim().toLowerCase();
    setInput('');
    setIsLoading(true);
    // resume auto-follow on new command
    userAtBottomRef.current = true;

    await delay(TERMINAL_CONFIG.commandDelay || 200);

    const multiWordCommands = {
      'clear cache': 'clear cache',
      'api health': 'api health',
      'grep bugs': 'grep bugs',
      'docker ps': 'docker ps',
      'ai status': 'ai status',
    };

    if (multiWordCommands[inputLower]) {
      const output = getCommandOutput(multiWordCommands[inputLower], []);
      setHistory(prev => [...prev, { type: 'output', content: output }]);
      setIsLoading(false);
      inputRef.current?.focus();
      return;
    }

    // Support lightweight aliases and no-op tokens
    const effectiveCmd = commandAliases[rawCmd] || rawCmd;

    // No-op for '.' and './'
    if (rawCmd === '.' || rawCmd === './') {
      setIsLoading(false);
      inputRef.current?.focus();
      return;
    }

    // Shortcuts: '..' -> cd .., '...' -> cd ../..
    if (rawCmd === '..') {
      setCwd(resolvePath(cwd, '..'));
      setIsLoading(false);
      inputRef.current?.focus();
      return;
    }
    if (rawCmd === '...') {
      setCwd(resolvePath(cwd, '../..'));
      setIsLoading(false);
      inputRef.current?.focus();
      return;
    }

    // home shortcut
    if (rawCmd === 'home') {
      setCwd('/');
      setIsLoading(false);
      inputRef.current?.focus();
      return;
    }

    if (effectiveCmd === 'clear') {
      setHistory([]);
      setIsLoading(false);
      inputRef.current?.focus();
      return;
    }

    // Lightweight filesystem command handling to provide realistic terminal navigation
    if (['ls', 'cd', 'pwd', 'cat', 'tree'].includes(effectiveCmd)) {
      let fsOutput = '';
      try {
        switch (rawCmd) {
          case 'ls': {
            const target = argsPreserve[0] || '.';
            const abs = resolvePath(cwd, target === '.' ? '' : target);
            const res = listDirectory(abs);
            fsOutput = res.error || (res.entries || []).join('  ');
            break;
          }
          case 'cd': {
            let target = argsPreserve[0] || '/';
            if (target === '~') target = '/';
            const abs = resolvePath(cwd, target);
            const { node } = getNodeAtPath(abs);
            if (!node) fsOutput = `cd: ${target}: No such directory`;
            else if (node.type !== 'dir') fsOutput = `cd: ${target}: Not a directory`;
            else { setCwd(abs); fsOutput = ''; }
            break;
          }
          case 'pwd': {
            fsOutput = cwd;
            break;
          }
          case 'tree': {
            const target = argsPreserve[0] || '.';
            const abs = resolvePath(cwd, target === '.' ? '' : target);
            const { node } = getNodeAtPath(abs);
            if (!node) fsOutput = `tree: ${target}: No such directory`;
            else if (node.type !== 'dir') fsOutput = `tree: ${target}: Not a directory`;
            else {
              const header = abs === '/' ? '.' : abs;
              const body = renderTree(abs);
              const countFiles = (n) => {
                if (!n) return 0;
                if (n.type === 'file') return 1;
                return Object.values(n.children || {}).reduce((acc, c) => acc + countFiles(c), 0);
              };
              const files = countFiles(node);
              const dirs = Object.values(node.children || {}).filter(c => c.type === 'dir').length;
              fsOutput = `${header}\n${body}\n\n${files} files, ${dirs} directories`;
            }
            break;
          }
          case 'cat': {
            const target = argsPreserve[0];
            if (!target) {
              fsOutput = 'Usage: cat <file>';
            } else {
              const abs = resolvePath(cwd, target);
              const { node } = getNodeAtPath(abs);
              if (!node) {
                // preserve original user-facing target in the message
                fsOutput = `cat: ${target}: No such file or directory`;
              } else if (node.type === 'dir') {
                fsOutput = `cat: ${target}: Is a directory`;
              } else {
                const content = typeof node.content === 'function' ? node.content() : (node.content || '');
                fsOutput = content;
              }
            }
            break;
          }
          default:
            fsOutput = 'Command not implemented.';
        }
      } catch (err) {
        fsOutput = `Error: ${err.message}`;
      }

      // trailing spacing for readability on certain commands
      const trailingCommands = new Set(['cat', 'tree', 'neofetch']);
      let finalFsOutput = fsOutput || '';
      if (trailingCommands.has(effectiveCmd) && finalFsOutput && !finalFsOutput.endsWith('\n')) finalFsOutput += '\n';

      // Stream outputs line-by-line for immersive terminal feel on certain commands
      const streamCommands = new Set(['cat', 'tree', 'logs', 'neofetch']);
      if (streamCommands.has(effectiveCmd)) {
        const lines = finalFsOutput.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          // push each line as a separate output item for natural scrolling
          setHistory(prev => [...prev, { type: 'output', content: line }]);
          // small random delay to simulate streaming
          await delay(18 + Math.floor(Math.random() * 36));
        }
      } else {
        setHistory(prev => [...prev, { type: 'output', content: finalFsOutput }]);
      }

      setIsLoading(false);
      inputRef.current?.focus();
      return;
    }

    const cmd = resolveAlias(rawCmd);
    // use preserved args for commands to keep casing (echo, etc.)
    let output = getCommandOutput(cmd, argsPreserve);
    // add trailing newline for neofetch
    if (cmd === 'neofetch' && output && !output.endsWith('\n')) output += '\n';

    if (output === null) {
      const suggestion = findSimilar(rawCmd, commandNames, 3);
      output = suggestion
        ? `Command not found: ${rawCmd}. Did you mean '${suggestion}'?`
        : `Command not found: ${rawCmd}. Type 'help' for available commands.`;
    }

    setHistory(prev => [...prev, { type: 'output', content: output }]);
    setIsLoading(false);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setHistory([]);
    setInput('');
  };

  const handleCopy = () => {
    const content = history
      .map(item => (item.type === 'input' ? `$ ${item.content}` : item.content))
      .join('\n');
    navigator.clipboard.writeText(content);
  };

  const displayItems = bootPhase ? bootLines : history;

  // Render output with light styling for directories (tokens ending with '/')
  const renderOutput = (content) => {
    if (!content && content !== '') return null;
    // split into lines and render each line; preserve empty lines
    const lines = String(content).split('\n');
    return lines.map((line, idx) => {
      // split tokens by double space for ls-like outputs
      const parts = line.split('  ');
      return (
        <div key={`line-${idx}`} className={line === '' ? 'mb-1' : ''}>
          {parts.map((part, i) => {
            if (part.endsWith('/')) {
              return (
                <span key={i} className="text-accent-400">{part}{i < parts.length - 1 ? '  ' : ''}</span>
              );
            }
            return <span key={i}>{part}{i < parts.length - 1 ? '  ' : ''}</span>;
          })}
        </div>
      );
    });
  };

  return (
    <Section id="terminal" className="bg-gradient-terminal">
      <PageContainer>
        <Stack gap={8}>
          <FadeIn>
            <SectionTitle
              title="Interactive Terminal"
              subtitle="Explore my skills, projects, and learning journey through commands"
            />
          </FadeIn>

          <motion.div
            className="w-full rounded-lg border border-neutral-700/50 overflow-hidden shadow-xl shadow-primary/5 flex flex-col md:flex-row h-[440px] md:h-[580px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Left: Terminal (fixed height, internal scrolling) */}
            <div className="w-full md:w-[70%] flex flex-col min-h-0">
              <div className="bg-neutral-800/80 border-b border-neutral-700/50 px-5 py-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <p className="text-xs text-neutral-400 font-mono">deep@portfolio:{cwd === '/' ? '~' : `~${cwd.slice(1)}`}$</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="p-1.5 hover:bg-neutral-700 rounded transition text-neutral-400 hover:text-neutral-200"
                    title="Copy output"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    onClick={handleClear}
                    className="p-1.5 hover:bg-neutral-700 rounded transition text-neutral-400 hover:text-neutral-200"
                    title="Clear terminal"
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0 flex flex-col">
                <div
                  ref={terminalRef}
                  className="bg-terminal-bg p-5 sm:p-7 font-mono text-sm leading-relaxed text-terminal-text flex-1 min-h-0 overflow-y-auto"
                >
                  {bootPhase && (
                    <div className="mb-2 text-accent-400 text-xs">
                      {bootLines.map((line, i) => (
                        <div key={i} className="mb-1">{line.content}</div>
                      ))}
                      <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      >_</motion.span>
                    </div>
                  )}
                  <AnimatePresence mode="popLayout">
                    {displayItems.map((item, index) => (
                      <motion.div
                        key={`${bootPhase ? 'boot' : 'hist'}-${index}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-2 whitespace-pre-wrap break-words"
                      >
                        {item.type === 'input' ? (
                          <div className="text-accent-400">
                            <span>$ </span>
                            <span className="text-terminal-text">{item.content}</span>
                          </div>
                        ) : (
                          <div className="text-neutral-300 text-xs leading-relaxed">
                            {item.content}
                          </div>
                        )}
                      </motion.div>
                    ))}

                    {isLoading && (
                      <motion.div
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="text-accent-400"
                      >
                        ⟳ Processing...
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <form
                  onSubmit={handleCommand}
                  className="bg-neutral-800/80 border-t border-neutral-700/50 px-5 sm:px-7 py-3 flex items-center gap-3"
                >
                  <span className="text-terminal-prompt">$</span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type 'help' for commands..."
                    className="flex-1 bg-transparent text-terminal-text outline-none text-sm font-mono placeholder-neutral-600"
                    disabled={isLoading || bootPhase}
                  />
                </form>
              </div>
            </div>

            {/* Right: Computation Panel */}
            <div className="hidden md:flex flex-col w-full md:w-[30%] bg-neutral-900 border-l border-neutral-800 min-h-0">
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-neutral-800">
                  <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Computation Logs</h4>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 font-mono text-xs">
                  <div className="flex flex-col gap-1">
                    {compLines.map((l, i) => (
                      <div key={i} className={`text-[11px] leading-relaxed ${getLogColor(l)}`}>{l}</div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="border-t border-neutral-800 bg-neutral-950 px-4 py-3 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500">Inference:</span>
                  <span className="text-cyan-400 font-mono">ACTIVE</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500">Vector DB:</span>
                  <span className="text-green-400 font-mono">CONNECTED</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500">Latency:</span>
                  <span className="text-amber-400 font-mono">34ms</span>
                </div>
              </div>
            </div>
          </motion.div>

          <FadeIn delay={0.2}>
            <div className="mt-4 p-4 bg-neutral-800/50 border border-neutral-700 rounded-lg">
              <p className="text-xs text-neutral-400 mb-3 font-mono">Quick commands:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {['whoami', 'skills', 'projects', 'dsa', 'neofetch', 'vibecheck', 'stack', 'help'].map((cmd) => (
                  <button
                    key={cmd}
                    onClick={() => {
                      setInput(cmd);
                      inputRef.current?.focus();
                    }}
                    className="px-3 py-2 bg-neutral-700 hover:bg-neutral-600 rounded text-xs font-mono text-terminal-prompt transition"
                  >
                    {cmd}
                  </button>
                ))}
              </div>
            </div>
          </FadeIn>
        </Stack>
      </PageContainer>
    </Section>
  );
};

export default TerminalSection;
