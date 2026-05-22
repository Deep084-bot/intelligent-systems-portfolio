// Design system constants
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

// Navbar
export const NAVBAR_HEIGHT = 64;

// Z-index layers
export const Z_INDEX = {
  base: 1,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  navbar: 100,
  modal: 200,
  tooltip: 300,
};

// Section spacing
export const SECTION_PADDING = {
  mobile: '40px 20px',
  tablet: '60px 40px',
  desktop: '80px 60px',
};

// Terminal settings
export const TERMINAL_CONFIG = {
  typingSpeed: 50, // ms per character
  cursorBlinkRate: 500, // ms
  commandDelay: 300, // ms before output
};

// Skills data - this will eventually come from JSON
export const SKILLS_DATA = [
  { category: 'Backend', skills: ['Node.js', 'Express', 'REST APIs', 'Database Design'] },
  { category: 'AI/ML', skills: ['LLMs', 'Prompt Engineering', 'Vector Databases', 'RAG'] },
  { category: 'Systems', skills: ['Distributed Systems', 'Microservices', 'Caching', 'Load Balancing'] },
  { category: 'Frontend', skills: ['React', 'Vite', 'Tailwind CSS', 'Framer Motion'] },
];

// Terminal commands reference
export const TERMINAL_COMMANDS = {
  whoami: {
    description: 'Display portfolio owner information',
    usage: 'whoami',
  },
  skills: {
    description: 'Show technical skills and expertise areas',
    usage: 'skills',
  },
  projects: {
    description: 'List featured projects and work',
    usage: 'projects',
  },
  currently_learning: {
    description: 'What I\'m currently learning and exploring',
    usage: 'currently_learning',
  },
  help: {
    description: 'Show all available commands',
    usage: 'help',
  },
  clear: {
    description: 'Clear terminal screen',
    usage: 'clear',
  },
};
