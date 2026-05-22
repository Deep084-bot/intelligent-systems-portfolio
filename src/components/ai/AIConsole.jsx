import React, { useState } from 'react';
import useAI from '../../hooks/useAI';

const suggested = [
  'Explain your strongest project',
  'What backend technologies do you know?',
  'Tell me about your DSA experience',
  'What are you currently learning?'
];

export default function AIConsole() {
  const { messages, loading, send, reset } = useAI();
  const [input, setInput] = useState('');

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!input.trim()) return;
    await send(input.trim());
    setInput('');
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-accent-500 flex items-center justify-center font-bold">AI</div>
          <div>
            <div className="text-sm font-semibold">Talk with my AI</div>
            <div className="text-xs text-neutral-500">Technical, concise, portfolio-focused</div>
          </div>
        </div>
        <div className="text-xs text-neutral-400">No credentials required • Portfolio context only</div>
      </div>

      <div className="h-80 overflow-auto bg-neutral-850 border border-neutral-800 rounded p-3 mb-3 font-mono text-sm space-y-3">
        {messages.length === 0 && (
          <div className="text-neutral-500">Try: "Explain your strongest project" or click a suggested prompt below.</div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-accent-300' : 'text-neutral-200'}>
            <div className="text-xs text-neutral-400">{m.role === 'user' ? 'You' : 'Assistant'}</div>
            <div className="whitespace-pre-wrap">{m.text}</div>
          </div>
        ))}
        {loading && (
          <div className="text-neutral-400">Assistant is typing<span className="animate-pulse">...</span></div>
        )}
      </div>

      <div className="mb-3 flex gap-2 flex-wrap">
        {suggested.map(s => (
          <button key={s} onClick={() => send(s)} className="px-3 py-1 text-xs bg-neutral-800 border border-neutral-700 text-neutral-200 rounded font-mono hover:bg-neutral-700">
            {s}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about projects, skills, or the learning journey..." className="flex-1 bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm rounded text-neutral-200" />
        <button type="submit" disabled={loading} className="px-4 py-2 bg-accent-500 text-white rounded text-sm">Send</button>
      </form>

      <div className="mt-3 text-xs text-neutral-500">Responses are limited to portfolio context and curated content.</div>
    </div>
  );
}
