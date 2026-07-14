import React, { useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
import { motion } from 'framer-motion';

import 'highlight.js/styles/github-dark.css';

const CALLOUT_MAP = {
  note: { icon: 'ℹ', border: 'border-accent-400/30', bg: 'bg-accent-500/5', text: 'text-accent-300' },
  tip: { icon: '💡', border: 'border-green-400/30', bg: 'bg-green-500/5', text: 'text-green-300' },
  important: { icon: '⚠', border: 'border-purple-400/30', bg: 'bg-purple-500/5', text: 'text-purple-300' },
  warning: { icon: '⚠', border: 'border-amber-400/30', bg: 'bg-amber-500/5', text: 'text-amber-300' },
  caution: { icon: '✕', border: 'border-red-400/30', bg: 'bg-red-500/5', text: 'text-red-300' },
};

function CalloutBlock({ children, type }) {
  const style = CALLOUT_MAP[type] || CALLOUT_MAP.note;
  return (
    <div className={`${style.bg} ${style.border} border-l-4 rounded-r-lg px-4 py-3 my-4`}>
      <div className={`${style.text} text-xs font-semibold uppercase tracking-wider mb-1 font-mono`}>
        {style.icon} {type}
      </div>
      <div className="text-neutral-300 text-sm [&>:first-child]:mt-0 [&>:last-child]:mb-0">
        {children}
      </div>
    </div>
  );
}

function CodeBlock({ node, inline, className, children, ...props }) {
  const code = String(children).replace(/\n$/, '');
  const language = (className || '').replace('language-', '') || '';

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch (err) {
      // ignore
    }
  }, [code]);

  if (inline) {
    return (
      <code className="inline-code bg-neutral-800 px-1 py-0.5 rounded text-sm font-mono">
        {code}
      </code>
    );
  }

  return (
    <div className="relative">
      <pre className="bg-neutral-900 rounded-lg p-4 overflow-auto text-sm">
        <code className={className} {...props}>
          {code}
        </code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 bg-neutral-800/60 hover:bg-neutral-800 text-xs px-2 py-1 rounded flex items-center gap-2"
        title="Copy code"
      >
        Copy
      </button>
    </div>
  );
}

function BlockQuote({ children, ...props }) {
  const childArray = React.Children.toArray(children);
  const firstChild = childArray[0];

  let calloutType = null;
  if (typeof firstChild === 'string') {
    const match = firstChild.trim().match(/^\[!(\w+)\]/i);
    if (match) calloutType = match[1].toLowerCase();
  } else if (firstChild?.props?.children) {
    const text = typeof firstChild.props.children === 'string'
      ? firstChild.props.children
      : Array.isArray(firstChild.props.children)
        ? firstChild.props.children[0]
        : '';
    const match = (text || '').trim().match(/^\[!(\w+)\]/i);
    if (match) calloutType = match[1].toLowerCase();
  }

  if (calloutType && CALLOUT_MAP[calloutType]) {
    const rest = childArray.slice(1);
    const firstText = typeof firstChild === 'string'
      ? firstChild.replace(/^\[!\w+\]\s*/i, '')
      : null;
    return (
      <CalloutBlock type={calloutType}>
        {firstText && <p>{firstText}</p>}
        {rest}
      </CalloutBlock>
    );
  }

  return (
    <blockquote className="border-l-4 border-neutral-700 pl-4 my-4 text-neutral-400 italic">
      {children}
    </blockquote>
  );
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...defaultSchema.tagNames, 'mark'],
  attributes: {
    ...defaultSchema.attributes,
    mark: ['class'],
  },
};

export function MarkdownRenderer({ content, className = '', searchTerm }) {
  if (!content) return null;

  const processedContent = useMemo(() => {
    if (!searchTerm) return content;
    const escaped = escapeRegex(searchTerm);
    return content.replace(
      new RegExp(`(${escaped})`, 'gi'),
      '<mark class="bg-accent-500/30 text-accent-200 rounded px-0.5">$1</mark>'
    );
  }, [content, searchTerm]);

  return (
    <motion.div
      className={`prose prose-invert max-w-none ${className}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32 }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          [rehypeSanitize, sanitizeSchema],
          rehypeHighlight,
        ]}
        components={{
          code: CodeBlock,
          blockquote: BlockQuote,
          a: ({node, ...props}) => (
            <a {...props} className="text-accent-400 hover:underline" target="_blank" rel="noopener noreferrer" />
          ),
          img: ({node, ...props}) => (
            <img {...props} className="rounded-lg border border-neutral-800" loading="lazy" />
          ),
          table: ({node, ...props}) => (
            <div className="overflow-x-auto my-4">
              <table {...props} className="min-w-full border-collapse border border-neutral-800 text-sm" />
            </div>
          ),
          th: ({node, ...props}) => (
            <th {...props} className="border border-neutral-800 bg-neutral-900 px-3 py-2 text-left font-semibold text-neutral-300" />
          ),
          td: ({node, ...props}) => (
            <td {...props} className="border border-neutral-800 px-3 py-2 text-neutral-400" />
          ),
          h1: ({node, ...props}) => <h1 {...props} className="text-2xl font-bold text-neutral-100 mt-8 mb-4" />,
          h2: ({node, ...props}) => <h2 {...props} className="text-xl font-bold text-neutral-100 mt-6 mb-3" />,
          h3: ({node, ...props}) => <h3 {...props} className="text-lg font-semibold text-neutral-100 mt-5 mb-2" />,
          ul: ({node, ...props}) => <ul {...props} className="list-disc list-inside space-y-1 text-neutral-300" />,
          ol: ({node, ...props}) => <ol {...props} className="list-decimal list-inside space-y-1 text-neutral-300" />,
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </motion.div>
  );
}

export default MarkdownRenderer;
