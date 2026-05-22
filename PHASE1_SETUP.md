# PHASE 1: Frontend Foundation - Complete Setup & Implementation Guide

## Project Overview
Professional CS internship portfolio website with terminal-inspired UI, modern SaaS aesthetics, and AI-focused design. Pure frontend foundation with reusable components and premium design system.

## Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Code editor (VS Code recommended)

## Setup Instructions

### Step 1: Create Vite React Project
```bash
npm create vite@latest ai-portfolio -- --template react
cd ai-portfolio
npm install
```

### Step 2: Install Dependencies
```bash
npm install -D tailwindcss postcss autoprefixer
npm install -D @tailwindcss/typography @tailwindcss/container-queries
npm install framer-motion
npm install lucide-react
npm install clsx
npm install zustand
```

### Step 3: Initialize Tailwind
```bash
npx tailwindcss init -p
```

### Step 4: Create Project Folder Structure
Run from project root:
```bash
mkdir -p src/{components,layouts,sections,animations,hooks,utils,constants,styles,assets,content}
mkdir -p src/components/{ui,primitives,layout}
mkdir -p src/content/{projects,notes,skills}
```

### Step 5: File Organization
See FOLDER_STRUCTURE.md for complete breakdown.

### Step 6: Copy All Configuration Files
- Copy tailwind.config.js
- Copy postcss.config.js
- Copy vite.config.js
- Update package.json with scripts

### Step 7: Copy All Source Files
All React components, utilities, and assets in order.

### Step 8: Start Development Server
```bash
npm run dev
```

The app will run at `http://localhost:5173`

## Development Commands
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run linter (if configured)
```

## Key Architecture Decisions

### Design System
- Color palette: Dark theme with grays and premium accent colors
- Typography: Sans-serif with strong hierarchy
- Spacing: 4px base unit (tailwind default)
- Shadows: Subtle, minimal elevation system
- Animations: Smooth, purposeful, not distracting

### Component Architecture
- Primitives: Reusable UI building blocks (Button, Card, Badge)
- Sections: Full-width page sections (Hero, Terminal, Projects)
- Layouts: Page containers and navigation
- Animations: Framer Motion wrappers for smooth effects

### State Management
- Zustand for simple global state (terminal commands, modal states)
- React hooks for component-local state
- No complex state needed in PHASE 1

### Content Loading
- JSON files for projects, skills, notes
- Dynamic imports and loaders
- Easy to extend with new content types

### Responsive Design
- Mobile-first approach
- Breakpoints: sm, md, lg, xl, 2xl
- Touch-friendly interactions on mobile
- Optimized terminal width for all screens

## Next Steps (PHASE 2+)
- Backend API integration
- AI Assistant chatbot
- Dynamic content loading from database
- GitHub API integration
- Email contact form
- Analytics and SEO optimization
