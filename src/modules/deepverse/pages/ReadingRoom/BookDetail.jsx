import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCover } from './useCover'

export default function BookDetail({ book, allBooks, onClose, onNext, onPrev }) {
  const { coverUrl, loading } = useCover(book)
  const [page, setPage] = useState(0)
  const panelRef = useRef(null)

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setPage((p) => Math.min(p + 1, pages.length - 1))
      if (e.key === 'ArrowLeft') setPage((p) => Math.max(p - 1, 0))
      if (e.key === 'Enter' && e.target === panelRef.current) setPage((p) => (p + 1) % pages.length)
    }
    window.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  if (!book) return null

  const pages = [
    {
      title: 'Favorite Quote',
      content: book.favoriteQuote,
    },
    {
      title: 'Biggest Lesson',
      content: book.biggestLesson,
    },
    {
      title: 'Personal Notes',
      content: book.notes,
    },
    {
      title: 'How It Changed My Thinking',
      content: book.influence,
    },
  ].filter((p) => p.content)

  const idx = Math.min(page, pages.length - 1)
  const isQuote = pages[idx]?.title === 'Favorite Quote'

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
      >
        {/* Blur backdrop — appears slightly before panel */}
        <motion.div
          className="absolute inset-0 backdrop-blur-sm"
          style={{ background: 'rgba(5, 3, 2, 0.75)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          onClick={onClose}
        />

        {/* Reading desk — book physics entrance */}
        <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-8">
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto outline-none"
            style={{
              background: 'linear-gradient(160deg, #1c1917 0%, #0f0c0a 100%)',
              borderRadius: 16,
              boxShadow:
                '0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(245,237,220,0.05), inset 0 0 60px rgba(212,165,116,0.03)',
            }}
            initial={{ scale: 0.75, y: 100, rotate: -3, opacity: 0 }}
            animate={{ scale: 1, y: 0, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.75, y: 100, rotate: -3, opacity: 0 }}
            transition={{
              type: 'spring',
              damping: 22,
              stiffness: 200,
              mass: 1.2,
            }}
          >
            {/* Paper texture overlay */}
            <div
              className="absolute inset-0 pointer-events-none rounded-[16px] overflow-hidden"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
                mixBlendMode: 'overlay',
              }}
            />

            {/* Warm desk lamp glow */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at 50% 0%, rgba(212,165,116,0.07) 0%, transparent 70%)',
              }}
            />

            {/* Vignette */}
            <div
              className="absolute inset-0 pointer-events-none rounded-[16px]"
              style={{
                boxShadow: 'inset 0 0 80px rgba(0,0,0,0.3)',
              }}
            />

            <div className="flex flex-col lg:flex-row relative z-[1]">
              {/* Cover column */}
              <div className="lg:w-80 shrink-0 p-6 lg:p-8 flex flex-col items-center">
                <div
                  className="w-44 h-60 rounded-lg overflow-hidden shadow-2xl mb-5 relative"
                  style={{
                    background: loading
                      ? `linear-gradient(135deg, ${book.spineColor}, ${book.coverColor})`
                      : 'none',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(245,237,220,0.06)',
                    borderRadius: 6,
                  }}
                >
                  {coverUrl && !loading && (
                    <>
                      <img
                        src={coverUrl}
                        alt={book.title}
                        className="w-full h-full object-cover"
                        style={{ borderRadius: 5 }}
                      />
                      {/* Paper texture on cover */}
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`,
                          mixBlendMode: 'multiply',
                          borderRadius: 5,
                        }}
                      />
                    </>
                  )}
                  {loading && (
                    <div className="w-full h-full animate-pulse" style={{ background: `${book.spineColor}66` }} />
                  )}

                  {/* Glass reflection */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.015) 30%, transparent 50%)',
                      borderRadius: 5,
                    }}
                  />
                  {/* Emboss highlight */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.1)',
                      borderRadius: 6,
                    }}
                  />
                </div>

                <h2 className="text-center text-base font-semibold text-neutral-200 leading-tight max-w-[200px]">
                  {book.title}
                </h2>
                <p className="text-xs text-neutral-500 mt-1">{book.author}</p>

                <div className="flex items-center gap-1 mt-2.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg
                      key={s}
                      className={`w-3.5 h-3.5 ${s <= book.rating ? 'text-amber-400' : 'text-neutral-700'}`}
                      fill="currentColor" viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                <div className="flex items-center gap-3 mt-2.5 text-[11px] text-neutral-600">
                  <span>{book.year}</span>
                  <span className="text-neutral-700">·</span>
                  <span>{book.pages}p</span>
                  <span className="text-neutral-700">·</span>
                  <span>{book.genre}</span>
                </div>

                <div className="flex flex-wrap gap-2 mt-3 justify-center">
                  {book.recommend && (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1.5 tracking-wider bg-emerald-500/5 px-2 py-0.5 rounded-full border border-emerald-500/10">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      RECOMMENDED
                    </span>
                  )}
                  {book.favorite && (
                    <span className="text-[11px] text-amber-400 bg-amber-500/5 px-2 py-0.5 rounded-full border border-amber-500/10">
                      ★ FAVORITE
                    </span>
                  )}
                </div>
              </div>

              {/* Reading content */}
              <div className="flex-1 p-6 lg:p-8 lg:pl-0 lg:pr-8 min-w-0">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <span className="text-[9px] text-neutral-600 uppercase tracking-[0.2em] font-semibold">Reading Notes</span>
                    <h3 className="text-sm font-semibold text-neutral-300 mt-0.5">{pages[idx]?.title || 'About'}</h3>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-neutral-600 hover:text-neutral-300 hover:bg-neutral-800 transition-colors"
                    aria-label="Close (Esc)"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-8">
                  {pages[idx] && (
                    <div>
                      {isQuote ? (
                        <div className="relative">
                          <svg className="absolute -top-3 -left-2 w-6 h-6 text-neutral-700/40" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151C7.546 6.068 5.983 8.789 5.983 11H10v10H0z" />
                          </svg>
                          <p className="text-base text-neutral-200 leading-relaxed italic pl-6 pt-1 font-medium">
                            {pages[idx].content}
                          </p>
                        </div>
                      ) : (
                        <div className="relative pl-4 border-l-2 border-neutral-700">
                          <p className="text-sm text-neutral-300 leading-[1.85]">
                            {pages[idx].content}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {book.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {book.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-[10px] rounded-full bg-neutral-800 text-neutral-500 border border-neutral-700/50"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Page dots + nav */}
                <div className="mt-8 pt-4 border-t border-neutral-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {pages.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPage(i)}
                        className={`rounded-full transition-all ${
                          i === idx ? 'bg-neutral-400 w-3 h-1.5' : 'bg-neutral-700 w-1.5 h-1.5 hover:bg-neutral-500'
                        }`}
                      />
                    ))}
                    <span className="text-[9px] text-neutral-600 ml-1 font-mono">{idx + 1}/{pages.length}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={onPrev}
                      disabled={!onPrev}
                      className="px-3 py-1.5 text-[10px] text-neutral-500 hover:text-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-md hover:bg-neutral-800/50"
                    >
                      ← Prev
                    </button>
                    <button
                      onClick={onNext}
                      disabled={!onNext}
                      className="px-3 py-1.5 text-[10px] text-neutral-500 hover:text-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-md hover:bg-neutral-800/50"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
