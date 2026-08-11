import { motion } from 'framer-motion'
import { tokenize } from './highlight'
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

const LINE_BG = {
  add: 'rgba(74,222,128,0.07)',
  remove: 'rgba(248,113,113,0.06)',
  context: 'transparent',
}

const LINE_BORDER = {
  add: '1px solid rgba(74,222,128,0.12)',
  remove: '1px solid rgba(248,113,113,0.12)',
  context: 'none',
}

function LineComment({ comment }) {
  const cat = CATEGORIES.find((c) => c.id === comment.category)
  return (
    <div
      className="mx-8 my-1.5 px-3 py-2 rounded-lg"
      style={{ background: 'rgba(109,92,252,0.07)', borderLeft: `2px solid ${CAT_COLOR(comment.category)}` }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[8px] font-mono uppercase tracking-wider" style={{ color: CAT_COLOR(comment.category) }}>
          {cat?.label || comment.category}
        </span>
        {comment.hit ? (
          <span className="text-[8px] font-mono text-emerald-400/80">issue flagged</span>
        ) : (
          <span className="text-[8px] font-mono text-neutral-600">note</span>
        )}
      </div>
      {comment.text && <div className="text-[10.5px] text-neutral-300 leading-snug">{comment.text}</div>}
    </div>
  )
}

export default function CodeEditor({ file, comments, selectedLine, onSelectLine }) {
  const fileComments = comments.filter((c) => c.file === file.path)

  return (
    <div className="flex flex-col h-full overflow-hidden rounded-xl" style={{ background: 'rgba(13,13,17,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center justify-between px-3 py-2 border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(16,16,20,0.6)' }}>
        <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400">
          <span style={{ color: '#6d5cfc' }}>⌥</span>
          {file.path}
        </div>
        <div className="text-[9px] font-mono text-neutral-600">{file.lines.filter((l) => l.type === 'add').length} additions</div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="min-w-[460px] py-2">
          {file.lines.map((line, idx) => {
            const num = idx + 1
            const clickable = line.type !== 'remove'
            const hasComments = fileComments.some((c) => c.line === num)
            const selected = selectedLine === num
            return (
              <div key={num}>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(0.4, idx * 0.008) }}
                  onClick={() => clickable && onSelectLine(num)}
                  className="group flex items-stretch cursor-pointer"
                  style={{
                    background: selected ? 'rgba(109,92,252,0.12)' : LINE_BG[line.type],
                    boxShadow: selected ? 'inset 2px 0 0 #6d5cfc' : 'none',
                  }}
                >
                  <div className="w-12 shrink-0 flex items-center justify-end pr-2 select-none text-[10px] font-mono text-neutral-600 border-r" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    {line.type === 'add' ? (
                      <span className="text-emerald-500/70 mr-1.5">+</span>
                    ) : line.type === 'remove' ? (
                      <span className="text-red-500/70 mr-1.5">−</span>
                    ) : (
                      <span className="mr-1.5" />
                    )}
                    {num}
                    {hasComments && <span className="ml-1 w-1 h-1 rounded-full" style={{ background: '#d4af37' }} />}
                  </div>
                  <div
                    className="flex-1 px-3 py-[1.5px] font-mono text-[12px] leading-[1.7] whitespace-pre"
                    style={{
                      color: line.type === 'remove' ? 'rgba(248,113,113,0.6)' : '#abb2bf',
                      textDecoration: line.type === 'remove' ? 'line-through' : 'none',
                      background: 'transparent',
                    }}
                  >
                    {line.type !== 'remove' &&
                      tokenize(line.text, file.language).map((t, ti) => (
                        <span key={ti} style={{ color: t.color }}>
                          {t.text}
                        </span>
                      ))}
                    {line.type === 'remove' && line.text}
                  </div>
                  <div
                    className="w-6 shrink-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {clickable && <span className="text-[10px]" style={{ color: '#6d5cfc' }}>＋</span>}
                  </div>
                </motion.div>
                {hasComments &&
                  fileComments
                    .filter((c) => c.line === num)
                    .map((c) => <LineComment key={c.id} comment={c} />)}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
