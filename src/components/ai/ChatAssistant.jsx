import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize from 'rehype-sanitize';
import useAI from '../../hooks/useAI';

const SUGGESTED = [
  'Tell me about your backend architecture',
  'Summarize projects',
  'Explain two-pointer problems',
  'Next learning steps for system design',
];

export default function ChatAssistant() {
  const { messages, loading, send, reset } = useAI();
  const [input, setInput] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const txt = input.trim();
    if (!txt) return;
    await send(txt);
    setInput('');
  };

  const handleSuggested = async (s) => {
    setInput('');
    await send(s);
  };

  return (
    <div className="bg-neutral-900 rounded-lg border border-neutral-700 p-4 md:p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-neutral-50">AI Assistant</h3>
          <p className="text-sm text-neutral-400">Ask contextual questions about projects, DSA, and backend systems.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-400">
          <button
            onClick={() => { reset(); }}
            className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 rounded"
            aria-label="Reset conversation"
          >Reset</button>
        </div>
      </div>

      {/* Message list */}
      <div className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-2 mb-4" role="log" aria-live="polite">
        {messages.length === 0 && !loading ? (
          <div className="text-neutral-400">Start a conversation — try one of the suggested prompts below.</div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`${m.role === 'user' ? 'bg-primary-600 text-white' : 'bg-neutral-800 text-neutral-200'} rounded-lg p-3 max-w-[85%] break-words`}>
                {m.role === 'assistant' ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight, rehypeSanitize]} className="prose prose-invert text-sm">
                    {m.text || ''}
                  </ReactMarkdown>
                ) : (
                  <div className="text-sm font-mono text-white">{m.text}</div>
                )}
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-neutral-800 text-neutral-200 rounded-lg p-2 px-3">
              <span className="inline-block animate-pulse">• • •</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      <div className="mb-3">
        <div className="flex flex-wrap gap-2">
          {SUGGESTED.map(s => (
            <button key={s} className="text-xs px-3 py-1 bg-neutral-800 hover:bg-neutral-700 rounded font-mono text-neutral-300" onClick={() => handleSuggested(s)}>{s}</button>
          ))}
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the assistant (press Enter to send)"
          className="flex-1 bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none"
          aria-label="AI assistant input"
        />
        <button type="submit" className="px-3 py-2 bg-primary-600 hover:bg-primary-500 rounded text-sm text-white">Send</button>
      </form>

    </div>
  );
}
