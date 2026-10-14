import { useState } from 'react'
import { motion } from 'framer-motion'
import { CATEGORIES } from '../engine'

const CAT_COLOR = (id) => {
  const map = {
    performance: '#d19a66',
    security: '#f87171',
    scalability: '#38bdf8',
    architecture: '#a78bfa',
    readability: '#34d399',
    maintainability: '#d4af37',
    correctness: '#4ade80',
    testing: '#f59e0b',
  }
  return map[id] || '#a1a1aa'
}

export default function CommentPanel({ file, line, snippet, onAdd, onCancel }) {
  const [category, setCategory] = useState('')
  const [text, setText] = useState('')

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="rounded-xl p-3"
      style={{ background: 'rgba(16,16,20,0.95)', border: '1px solid rgba(109,92,252,0.3)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-mono text-neutral-300">
          <span style={{ color: '#6d5cfc' }}>＃</span> Comment on {file.split('/').pop()}:{line}
        </div>
        <button onClick={onCancel} className="text-[10px] font-mono text-neutral-600 hover:text-neutral-300">
          ✕
        </button>
      </div>

      <div className="rounded-md px-2.5 py-1.5 mb-2.5 font-mono text-[11px] text-neutral-400 whitespace-pre overflow-x-auto" style={{ background: 'rgba(0,0,0,0.4)' }}>
        {snippet}
      </div>

      <div className="text-[8px] font-mono uppercase tracking-wider text-neutral-600 mb-1.5">Category</div>
      <div className="flex flex-wrap gap-1.5 mb-2.5">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(category === c.id ? '' : c.id)}
            className="px-2 py-1 rounded-md text-[9.5px] font-mono transition-all"
            style={{
              background: category === c.id ? CAT_COLOR(c.id) + '22' : 'rgba(255,255,255,0.03)',
              color: category === c.id ? CAT_COLOR(c.id) : '#71717a',
              border: `1px solid ${category === c.id ? CAT_COLOR(c.id) : 'rgba(255,255,255,0.05)'}`,
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        maxLength={200}
        placeholder="Optional note — why this matters…"
        className="w-full px-2.5 py-2 rounded-lg text-[11px] text-neutral-300 resize-none outline-none placeholder:text-neutral-600 mb-2"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      />

      <div className="flex gap-2">
        <button
          onClick={() => onAdd(category, text.trim())}
          className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-neutral-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: 'rgba(109,92,252,0.9)' }}
        >
          Add comment
        </button>
        <span className="text-[9px] font-mono text-neutral-600 self-center">
          {category ? 'matched to a category' : 'custom note'} · clicking a line highlights it
        </span>
      </div>
    </motion.div>
  )
}
