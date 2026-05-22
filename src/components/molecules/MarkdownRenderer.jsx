import React, { useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
import { motion } from 'framer-motion';

import 'highlight.js/styles/github-dark.css';

// Code block component with copy-to-clipboard
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

export function MarkdownRenderer({ content, className = '' }) {
  if (!content) return null;

  return (
    <motion.div
      className={`prose prose-invert max-w-none ${className}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32 }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize, rehypeHighlight]}
        components={{
          code: CodeBlock,
          a: ({node, ...props}) => (
            <a {...props} className="text-accent-400 hover:underline" target="_blank" rel="noopener noreferrer" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </motion.div>
  );
}

export default MarkdownRenderer;
