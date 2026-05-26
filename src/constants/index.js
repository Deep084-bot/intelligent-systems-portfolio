export const COLORS = {
  primary: '#5d6eff',
  primaryDark: '#3d48cc',
  accent: '#29b6f6',
  accentLight: '#4fc3f7',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  bg: '#0f1419',
  bgSecondary: '#171717',
  bgTertiary: '#262626',
  text: '#e8eaed',
  textSecondary: '#a3a3a3',
  border: '#404040',
  terminalPrompt: '#29b6f6',
};

export const BREAKPOINTS = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export const ANIMATION_DURATION = {
  xs: 0.1,
  sm: 0.15,
  base: 0.2,
  md: 0.3,
  lg: 0.5,
  xl: 0.7,
};

export const TRANSITION = {
  smooth: { type: 'spring', stiffness: 100, damping: 15 },
  bouncy: { type: 'spring', stiffness: 120, damping: 12 },
  ease: { type: 'tween', duration: 0.3, ease: 'easeInOut' },
};

export const NAVBAR_HEIGHT = 64;

export const Z_INDEX = {
  base: 1,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  navbar: 100,
  modal: 200,
  tooltip: 300,
};

export const SECTION_PADDING = {
  mobile: '40px 20px',
  tablet: '60px 40px',
  desktop: '80px 60px',
};

export const TERMINAL_CONFIG = {
  typingSpeed: 30,
  cursorBlinkRate: 500,
  commandDelay: 200,
  charDelay: 16,
};

export const SKILLS_DATA = [
  { category: 'Backend', skills: ['Node.js', 'Express', 'REST APIs', 'Database Design'] },
  { category: 'AI/ML', skills: ['LLMs', 'Prompt Engineering', 'Vector Databases', 'RAG'] },
  { category: 'Systems', skills: ['Distributed Systems', 'Microservices', 'Caching', 'Load Balancing'] },
  { category: 'Frontend', skills: ['React', 'Vite', 'Tailwind CSS', 'Framer Motion'] },
];

export const TERMINAL_COMMANDS = {
  whoami: { description: 'Portfolio owner information', usage: 'whoami', category: 'profile' },
  skills: { description: 'Technical skills and expertise', usage: 'skills', category: 'tech' },
  projects: { description: 'Featured engineering projects', usage: 'projects', category: 'work' },
  currently_learning: { description: 'Current learning journey', usage: 'currently_learning', category: 'learning' },
  dsa_stats: { description: 'DSA problem-solving statistics', usage: 'dsa_stats', category: 'tech' },
  engineering_notes: { description: 'Recent technical articles', usage: 'engineering_notes', category: 'content' },
  github: { description: 'GitHub profile and repos', usage: 'github', category: 'social' },
  contact: { description: 'Contact information', usage: 'contact', category: 'social' },
  system_focus: { description: 'Current engineering focus areas', usage: 'system_focus', category: 'learning' },
  clear: { description: 'Clear terminal screen', usage: 'clear', category: 'system' },
  help: { description: 'Show all commands', usage: 'help', category: 'system' },
  ls: { description: 'List projects or items', usage: 'ls [projects|skills|notes]', category: 'browse' },
  cat: { description: 'Display file contents', usage: 'cat [profile.txt|architecture.md|about.md]', category: 'browse' },
  status: { description: 'System status overview', usage: 'status', category: 'system' },
  stack: { description: 'Technology stack overview', usage: 'stack', category: 'tech' },
  roadmap: { description: 'Learning and project roadmap', usage: 'roadmap', category: 'learning' },
  open: { description: 'Open external links', usage: 'open [github|linkedin|email]', category: 'social' },
  coffee: { description: 'Check developer coffee status', usage: 'coffee', category: 'easter-egg' },
  'sudo': { description: 'Superuser commands', usage: 'sudo hire-deep', category: 'easter-egg' },
  matrix: { description: 'Matrix-style terminal animation', usage: 'matrix', category: 'easter-egg' },
  vibecheck: { description: 'Developer vibe check', usage: 'vibecheck', category: 'easter-egg' },
  neofetch: { description: 'Portfolio system info', usage: 'neofetch', category: 'easter-egg' },
  achievements: { description: 'DSA and project milestones', usage: 'achievements', category: 'easter-egg' },
  repo_status: { description: 'Git repository status', usage: 'repo_status', category: 'easter-egg' },
  ping: { description: 'Test backend connectivity', usage: 'ping [target]', category: 'easter-egg' },
  ai: { description: 'AI service info', usage: 'ai status', category: 'easter-egg' },
  easteregg: { description: 'Hidden engineering surprise', usage: 'easteregg', category: 'easter-egg' },
};

export const QUICK_COMMANDS = [
  'whoami', 'skills', 'projects', 'currently_learning',
  'dsa_stats', 'stack', 'status', 'help',
  'neofetch', 'achievements', 'vibecheck', 'easteregg',
];
