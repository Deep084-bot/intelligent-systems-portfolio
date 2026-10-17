import { motion } from 'framer-motion'
import { useReducedMotion } from '../../store'
import useDialogFocus from '../../useDialogFocus'

export default function LabShell({
  title,
  tag,
  steps,
  currentStep = -1,
  onBack,
  backLabel = '← Back',
  size = 'w-[min(920px,94vw)] h-[min(680px,90vh)]',
  children,
}) {
  const reducedMotion = useReducedMotion()
  const dialogRef = useDialogFocus()
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0.15 : 0.5, ease: 'easeOut' }}
      className="absolute inset-0 z-30 flex items-center justify-center"
      style={{
        background: 'rgba(10,10,13,0.85)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
      }}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Brain module'}
        tabIndex={-1}
        initial={{ scale: 0.92, y: 24, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.92, y: 24, opacity: 0 }}
        transition={{ duration: reducedMotion ? 0.15 : 0.5, ease: [0.16, 1, 0.3, 1], delay: reducedMotion ? 0 : 0.1 }}
        className={`${size} flex flex-col rounded-2xl overflow-hidden outline-none`}
        style={{
          background: 'rgba(16,16,20,0.9)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
        }}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onBack}
              className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-neutral-400 transition-all hover:text-neutral-200 shrink-0"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              {backLabel}
            </button>
            {title && (
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[11px] text-neutral-300 truncate">{title}</span>
                {tag && <span className="text-[9px] font-mono text-neutral-600 shrink-0">{tag}</span>}
              </div>
            )}
          </div>
          {steps && currentStep >= 0 && (
            <div className="flex items-center gap-1.5 shrink-0">
              {steps.map((label, i) => {
                const active = i === currentStep
                const done = i < currentStep
                return (
                  <div key={label} className="flex items-center gap-1.5">
                    <div
                      className="w-1.5 h-1.5 rounded-full transition-all"
                      style={{
                        background: done ? '#6d5cfc' : active ? '#d4af37' : 'rgba(255,255,255,0.12)',
                        boxShadow: active ? '0 0 8px rgba(212,175,55,0.6)' : 'none',
                      }}
                    />
                    <span
                      className="text-[8px] font-mono uppercase tracking-wider hidden sm:block"
                      style={{ color: active ? '#e4e4e7' : done ? '#a1a1aa' : '#52525b' }}
                    >
                      {label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex-1 min-h-0">{children}</div>
      </motion.div>
    </motion.div>
  )
}
