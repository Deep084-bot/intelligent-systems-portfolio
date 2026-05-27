import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize from 'rehype-sanitize';
import useAI from '../../hooks/useAI';
import { Copy, Check, Eraser, Send, Bot, RefreshCcw, Wifi, WifiOff } from 'lucide-react';

const SUGGESTED = [
  'Summarize your projects and architecture',
  'What backend technologies do you use?',
  'Explain your DSA practice approach',
  'What are you currently learning?',
  'Describe your engineering portfolio system design',
  "What's your problem-solving workflow?",
];

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="opacity-0 group-hover/code:opacity-100 transition-opacity p-1 hover:bg-neutral-700 rounded text-neutral-400 hover:text-neutral-200"
      title="Copy code"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

function CodeBlock({ language, children }) {
  return (
    <div className="group/code relative my-3 bg-neutral-900 rounded-lg border border-neutral-700 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-neutral-800 border-b border-neutral-700">
        <span className="text-xs text-neutral-400 font-mono">{language || 'code'}</span>
        <CopyButton text={String(children).replace(/\n$/, '')} />
      </div>
      <pre className="p-4 text-sm overflow-auto m-0">
        <code className="font-mono text-neutral-200">{children}</code>
      </pre>
    </div>
  );
}

function isErrorMessage(text) {
  return /(failed|error|timed out|unavailable|busy|denied)/i.test(text || '');
}

export default function ChatAssistant() {
  const { messages, loading, send, reset, retry } = useAI();
  const [input, setInput] = useState('');
  const [hasBackend, setHasBackend] = useState(null);
  const [pending, setPending] = useState(false);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    const ac = new AbortController();
    const tid = setTimeout(() => ac.abort(), 3000);
    fetch('/api/ai/status', { signal: ac.signal })
      .then(r => { clearTimeout(tid); setHasBackend(r.ok); })
      .catch(() => { clearTimeout(tid); setHasBackend(false); });
  }, []);

  const scrollToBottom = useCallback(() => {
    // Auto-scroll only when the user is already near the bottom to avoid interrupting manual scrolls
    requestAnimationFrame(() => {
      const el = messagesContainerRef.current;
      if (!el) return;
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      if (distanceFromBottom < 160) {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      }
    });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, loading, scrollToBottom]);
  // Do NOT autofocus on mount to avoid page jump/auto-scroll to this section.
  // input will be focused after user interaction or programmatic focus after actions.

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const txt = input.trim();
    if (!txt || loading || pending) return;
    setPending(true);
    await send(txt);
    setPending(false);
    setInput('');
  };

  const handleSuggested = async (s) => {
    if (loading || pending) return;
    setPending(true);
    setInput('');
    await send(s);
    setPending(false);
  };

  const handleRetry = () => {
    if (loading || pending) return;
    setPending(true);
    retry();
    setTimeout(() => setPending(false), 1000);
  };

  const msgVariants = {
    hidden: { opacity: 0, y: 12, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.25, ease: 'easeOut' } },
  };

  const isBusy = loading || pending;

  // determine if assistant has already provided content (used to hide thinking bubble once content appears)
  const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
  const assistantHasContent = !!(lastAssistant && lastAssistant.text && String(lastAssistant.text).trim().length > 0);

  // local thinking bubble visibility to avoid duplicates and ensure immediate cleanup
  const [showThinking, setShowThinking] = useState(false);
  useEffect(() => {
    if (loading && !assistantHasContent) setShowThinking(true);
    else setShowThinking(false);
  }, [loading, assistantHasContent]);

  return (
    <div className="bg-neutral-900 rounded-lg border border-neutral-700 overflow-hidden flex flex-col h-[560px] w-full shadow-lg">
      {/* Header - always visible */}
      <div className="flex items-start justify-between px-6 md:px-8 py-4 border-b border-neutral-700 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-primary-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-neutral-50">AI Assistant</h3>
              <span className="flex items-center gap-1 text-[10px] font-mono"
                style={{ color: hasBackend === null ? '#666' : hasBackend ? '#10b981' : '#ef4444' }}>
                {hasBackend === null ? null : hasBackend ? <Wifi size={10} /> : <WifiOff size={10} />}
              </span>
            </div>
            <p className="text-xs text-neutral-400">Portfolio-aware · engineering-focused</p>
          </div>
        </div>
        <button
          onClick={() => { reset(); setPending(false); setShowThinking(false); inputRef.current?.focus(); }}
          disabled={isBusy}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-xs text-neutral-400 hover:text-neutral-200 transition shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Reset conversation"
        >
          <Eraser size={14} />
          Reset
        </button>
      </div>

      {/* Messages Viewport - always mounted, fixed height */}
      <div ref={messagesContainerRef} className="relative flex-1 min-h-0 overflow-y-auto px-6 md:px-8 py-5 bg-neutral-950/30">
        {/* Messages list */}
        <div className="flex flex-col gap-3">
          <AnimatePresence mode="popLayout">
            {messages.map((m, i) => (
              <motion.div
                key={`msg-${i}`}
                variants={msgVariants}
                initial="hidden"
                animate="visible"
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} mb-1`}
              >
                <div
                  className={`${
                    m.role === 'user'
                      ? 'bg-primary-600/20 border border-primary-500/30 rounded-2xl rounded-br-md'
                      : isErrorMessage(m.text)
                        ? 'bg-error/10 border border-error/30 rounded-2xl rounded-bl-md'
                        : 'bg-neutral-800 border border-neutral-700 rounded-2xl rounded-bl-md'
                  } p-4 max-w-[85%] break-words`}
                >
                  {m.role === 'assistant' ? (
                    <div className="prose prose-invert prose-sm max-w-none prose-code:before:content-none prose-code:after:content-none prose-pre:p-0 prose-pre:bg-transparent prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight, rehypeSanitize]}
                        components={{
                          code({ node, inline, className, children, ...props }) {
                            if (!inline && className) {
                              const match = /language-(\w+)/.exec(className || '');
                              return <CodeBlock language={match ? match[1] : ''}>{children}</CodeBlock>;
                            }
                            return (
                              <code className="px-1.5 py-0.5 bg-neutral-700 rounded text-xs font-mono text-accent-300" {...props}>
                                {children}
                              </code>
                            );
                          },
                          pre({ children }) {
                            return <>{children}</>;
                          },
                        }}
                      >
                        {m.text || ''}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="text-sm text-neutral-100 font-mono leading-relaxed">{m.text}</div>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Thinking bubble - single instance, mutually exclusive with content */}
            {showThinking && (
              <motion.div
                key="thinking"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex justify-start mb-1"
              >
                <div className="bg-neutral-800 border border-neutral-700 rounded-2xl rounded-bl-md p-4 max-w-[85%]">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs text-neutral-400 font-mono">Thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Retry button */}
            {!loading && messages.length > 0 && isErrorMessage(messages[messages.length - 1]?.text) && (
              <motion.div
                key="retry"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center mt-2"
              >
                <button
                  onClick={handleRetry}
                  disabled={isBusy}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-xs text-neutral-400 hover:text-neutral-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCcw size={13} />
                  Retry
                </button>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </AnimatePresence>
        </div>

        {/* Empty state overlay - absolutely positioned, behind messages */}
        {messages.length === 0 && !showThinking && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center px-4">
              <Bot className="w-12 h-12 mx-auto text-neutral-700 mb-4" />
              <p className="text-neutral-500 text-sm mb-5">Start a conversation — try one of the suggested prompts below.</p>
              <div className="flex flex-wrap gap-2 justify-center max-w-full">
                {SUGGESTED.map(s => (
                  <button
                    key={s}
                    onClick={() => handleSuggested(s)}
                    disabled={isBusy}
                    className="text-xs px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-neutral-600 rounded-lg font-mono text-neutral-300 transition disabled:opacity-50 disabled:cursor-not-allowed pointer-events-auto"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input - always pinned to bottom */}
      <form onSubmit={handleSubmit} className="flex gap-2 items-center border-t border-neutral-700 px-6 md:px-8 py-4 bg-neutral-900 shrink-0">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about projects, skills, DSA..."
          className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-primary-500/50 transition disabled:opacity-50"
          aria-label="AI assistant input"
          disabled={isBusy}
        />
        <button
          type="submit"
          disabled={isBusy || !input.trim()}
          className="p-2.5 bg-primary-600 hover:bg-primary-500 disabled:bg-neutral-700 disabled:cursor-not-allowed rounded-lg text-white transition shrink-0"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
