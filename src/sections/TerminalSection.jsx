import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TERMINAL_COMMANDS, TERMINAL_CONFIG } from '../constants';
import { Section, PageContainer, Stack } from '../layout';
import { SectionTitle } from '../primitives';
import { FadeIn } from '../animations';
import { parseCommand, delay } from '../utils';
import { Copy, RotateCcw } from 'lucide-react';

const WHOAMI_OUTPUT = `┌─────────────────────────────────────┐
│ Portfolio Owner Information         │
└─────────────────────────────────────┘

Name: Deep Mehta
Status: CS Student (Backend Focus)
Location: Remote

Expertise:
  • Backend Systems & APIs
  • AI/ML Applications
  • Distributed Systems
  • Problem Solving & DSA

Current Focus:
  • Building scalable systems
  • Learning LLMs & AI engineering
  • Contributing to open source`;

const SKILLS_OUTPUT = `┌─────────────────────────────────────┐
│ Technical Skills & Expertise        │
└─────────────────────────────────────┘

Backend:
  ✓ Node.js + Express
  ✓ REST API Design
  ✓ Database Design (SQL/NoSQL)
  ✓ System Architecture

AI/ML:
  ✓ Large Language Models (LLMs)
  ✓ Prompt Engineering
  ✓ RAG & Vector Databases
  ✓ Gemini API Integration

Systems:
  ✓ Distributed Systems Design
  ✓ Microservices Architecture
  ✓ Caching Strategies
  ✓ Load Balancing & Scalability

Frontend:
  ✓ React & Vite
  ✓ Tailwind CSS
  ✓ Framer Motion
  ✓ UI/UX Implementation`;

const PROJECTS_OUTPUT = `┌─────────────────────────────────────┐
│ Featured Projects                   │
└─────────────────────────────────────┘

[1] AI-Powered Content Engine
    Tech: Node.js, Gemini API, Vector DB
    Focus: LLM Integration, Scalability

[2] Real-time Chat Application
    Tech: WebSockets, React, Express
    Focus: Real-time Systems Design

[3] Distributed Task Queue
    Tech: Node.js, Redis, Bull
    Focus: Background Job Processing

[4] DSA Problem Solution Suite
    Tech: React, Algorithms, Visualizations
    Focus: Problem-Solving Showcase

Type 'projects' for detailed information`;

const LEARNING_OUTPUT = `┌─────────────────────────────────────┐
│ Currently Learning & Exploring      │
└─────────────────────────────────────┘

In Progress:
  → Advanced Distributed Systems
  → LLM Fine-tuning & Optimization
  → System Design Patterns
  → Cloud Architecture (AWS/GCP)

Next:
  → Kubernetes & Container Orchestration
  → GraphQL & Advanced API Design
  → Machine Learning Operations (MLOps)
  → Real-time Data Streaming

Resources:
  • Operating Systems (OSTEP)
  • Designing Data-Intensive Applications
  • Machine Learning Engineering`;

const HELP_OUTPUT = `┌─────────────────────────────────────┐
│ Available Commands                  │
└─────────────────────────────────────┘

whoami              - Display portfolio information
skills              - Show technical skills
projects            - View featured projects
currently_learning  - What I'm exploring
help                - Show this message
clear               - Clear terminal screen

💡 Type a command and press Enter to execute`;

export const TerminalSection = () => {
  const [history, setHistory] = useState([
    {
      type: 'output',
      content: '$ Welcome to Deep\'s Interactive Terminal',
    },
    {
      type: 'output',
      content: '$ Type "help" to see available commands',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const terminalRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const getCommandOutput = (command) => {
    switch (command) {
      case 'whoami':
        return WHOAMI_OUTPUT;
      case 'skills':
        return SKILLS_OUTPUT;
      case 'projects':
        return PROJECTS_OUTPUT;
      case 'currently_learning':
        return LEARNING_OUTPUT;
      case 'help':
        return HELP_OUTPUT;
      case 'clear':
        return 'clear';
      default:
        return `Command not found: ${command}. Type "help" for available commands.`;
    }
  };

  const handleCommand = async (e) => {
    e.preventDefault();

    if (!input.trim()) return;

    // Add user input to history
    setHistory((prev) => [...prev, { type: 'input', content: input }]);

    const { command, args } = parseCommand(input);
    setInput('');
    setIsLoading(true);

    // Simulate command processing delay
    await delay(TERMINAL_CONFIG.commandDelay);

    if (command === 'clear') {
      setHistory([
        {
          type: 'output',
          content: '$ Terminal cleared',
        },
      ]);
    } else {
      const output = getCommandOutput(command);
      setHistory((prev) => [...prev, { type: 'output', content: output }]);
    }

    setIsLoading(false);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setHistory([
      {
        type: 'output',
        content: '$ Terminal cleared',
      },
    ]);
    setInput('');
  };

  const handleCopy = () => {
    const content = history
      .map((item) => (item.type === 'input' ? `$ ${item.content}` : item.content))
      .join('\n');
    navigator.clipboard.writeText(content);
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

          {/* Terminal Container */}
          <motion.div
            className="rounded-lg border border-neutral-700 overflow-hidden shadow-lg shadow-primary/10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            {/* Terminal Header */}
            <div className="bg-neutral-800 border-b border-neutral-700 px-4 py-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <p className="text-xs text-neutral-400 font-mono">deep@portfolio:~$</p>
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

            {/* Terminal Output */}
            <div
              ref={terminalRef}
              className="bg-terminal-bg p-4 sm:p-6 font-mono text-sm text-terminal-text h-96 overflow-y-auto"
            >
              <AnimatePresence mode="popLayout">
                {history.map((item, index) => (
                  <motion.div
                    key={index}
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

            {/* Terminal Input */}
            <form
              onSubmit={handleCommand}
              className="bg-neutral-800 border-t border-neutral-700 px-4 sm:px-6 py-3 flex items-center gap-2"
            >
              <span className="text-terminal-prompt">$</span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type 'help' for commands..."
                className="flex-1 bg-transparent text-terminal-text outline-none text-sm font-mono placeholder-neutral-600"
                disabled={isLoading}
              />
            </form>
          </motion.div>

          {/* Quick Commands */}
          <FadeIn delay={0.2}>
            <div className="mt-4 p-4 bg-neutral-800/50 border border-neutral-700 rounded-lg">
              <p className="text-xs text-neutral-400 mb-3 font-mono">Quick commands:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {['whoami', 'skills', 'projects', 'currently_learning'].map((cmd) => (
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
