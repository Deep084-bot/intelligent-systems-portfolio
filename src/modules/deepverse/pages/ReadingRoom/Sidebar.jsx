import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BOOKS } from './data'

const SECTIONS = [
  { id: 'science-engineering', label: 'Engineering & Science', icon: '⚙' },
  { id: 'philosophy', label: 'Philosophy & Ideas', icon: '◇' },
  { id: 'inspirational', label: 'Inspirational & Poetry', icon: '○' },
  { id: 'colleen-hoover', label: 'Colleen Hoover', icon: '♡' },
  { id: 'romance', label: 'Other Romance', icon: '♤' },
  { id: 'young-adult', label: 'Young Adult', icon: '△' },
]

const favorites = BOOKS.filter((b) => b.favorite)
const totalPages = BOOKS.reduce((s, b) => s + (b.pages || 0), 0)

const SIDEBAR_KEY = 'deepverse-sidebar-collapsed'

function getInitialCollapsed() {
  try { return localStorage.getItem(SIDEBAR_KEY) === 'true' } catch { return false }
}

function Tooltip({ label, sublabel, children }) {
  const timeoutRef = useRef(null)
  const [show, setShow] = useState(false)

  const handleMouseEnter = useCallback(() => {
    timeoutRef.current = setTimeout(() => setShow(true), 300)
  }, [])

  const handleMouseLeave = useCallback(() => {
    clearTimeout(timeoutRef.current)
    setShow(false)
  }, [])

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current)
  }, [])

  return (
    <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded text-[10px] whitespace-nowrap pointer-events-none z-50"
            style={{ background: '#1c1917', border: '1px solid rgba(245,237,220,0.1)', boxShadow: '0 6px 20px rgba(0,0,0,0.5)' }}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.12 }}
          >
            <p className="text-neutral-200 font-medium">{label}</p>
            {sublabel && <p className="text-neutral-500 mt-0.5">{sublabel}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Sidebar({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  onSectionClick,
}) {
  const [collapsed, setCollapsed] = useState(getInitialCollapsed)
  const [showInlineSearch, setShowInlineSearch] = useState(false)
  const inputRef = useRef(null)
  const inlineSearchRef = useRef(null)

  const toggleCollapse = useCallback(() => {
    setCollapsed((c) => {
      const next = !c
      try { localStorage.setItem(SIDEBAR_KEY, String(next)) } catch {}
      return next
    })
  }, [])

  useEffect(() => {
    const handle = (e) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.target.closest('input,textarea')) {
        e.preventDefault()
        if (!collapsed) {
          inputRef.current?.focus()
        } else {
          setShowInlineSearch(true)
          setTimeout(() => inlineSearchRef.current?.focus(), 100)
        }
      }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [collapsed])

  useEffect(() => {
    if (showInlineSearch && inlineSearchRef.current) {
      inlineSearchRef.current.focus()
    }
  }, [showInlineSearch])

  if (collapsed) {
    return (
      <motion.aside
        className="flex flex-col items-center h-full relative z-30"
        style={{
          width: 68,
          background: 'linear-gradient(180deg, #0d0805 0%, #0a0603 100%)',
          borderRight: '1px solid rgba(245,237,220,0.04)',
        }}
        initial={false}
        animate={{ width: 68 }}
        transition={{ type: 'spring', damping: 28, stiffness: 200 }}
      >
        {/* Toggle button */}
        <button
          onClick={toggleCollapse}
          className="mt-4 w-8 h-8 flex items-center justify-center rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50 transition-colors"
          aria-label="Expand sidebar"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>

        <nav className="flex-1 flex flex-col items-center gap-3 mt-6 px-2">
          {/* Inline search */}
          <div className="relative w-full flex justify-center">
            {showInlineSearch ? (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '100%', opacity: 1 }}
                transition={{ duration: 0.15 }}
                className="px-1"
              >
                <input
                  ref={inlineSearchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search…"
                  className="w-full bg-neutral-900/80 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-[10px] text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-primary-500/40 transition-all"
                  onBlur={() => { if (!searchQuery) setShowInlineSearch(false) }}
                  onKeyDown={(e) => e.key === 'Escape' && setShowInlineSearch(false)}
                />
              </motion.div>
            ) : (
              <Tooltip label="Search books" sublabel="Press / to search">
                <button
                  onClick={() => setShowInlineSearch(true)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/40 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </Tooltip>
            )}
          </div>

          <div className="w-6 h-px" style={{ background: 'rgba(245,237,220,0.04)' }} />

          {SECTIONS.map((s) => (
            <Tooltip key={s.id} label={s.label} sublabel={`${BOOKS.filter((b) => b.shelf === s.id).length} books`}>
              <button
                onClick={() => { onSectionClick(s.id); onFilterChange(null) }}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/40 transition-colors relative"
              >
                <span className="text-xs">{s.icon}</span>
              </button>
            </Tooltip>
          ))}

          <div className="w-6 h-px" style={{ background: 'rgba(245,237,220,0.04)' }} />

          <Tooltip label="Favorites" sublabel={`${favorites.length} books`}>
            <button
              onClick={() => onFilterChange(activeFilter === 'favorites' ? null : 'favorites')}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                activeFilter === 'favorites' ? 'text-amber-400 bg-amber-500/10 shadow-[0_0_8px_rgba(251,191,36,0.08)]' : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/40'
              }`}
            >
              <motion.span
                className="text-xs"
                animate={activeFilter === 'favorites' ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                ★
              </motion.span>
            </button>
          </Tooltip>
        </nav>
      </motion.aside>
    )
  }

  return (
    <motion.aside
      className="flex flex-col h-full relative z-30"
      style={{
        background: 'linear-gradient(180deg, #0d0805 0%, #0a0603 100%)',
        borderRight: '1px solid rgba(245,237,220,0.04)',
      }}
      initial={false}
      animate={{ width: 240 }}
      transition={{ type: 'spring', damping: 28, stiffness: 200 }}
    >
      {/* Toggle button */}
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={toggleCollapse}
          className="w-7 h-7 flex items-center justify-center rounded-md text-neutral-600 hover:text-neutral-300 hover:bg-neutral-800/50 transition-colors"
          aria-label="Collapse sidebar"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Search */}
      <div className="px-4 pt-5 pb-3">
        <div className="relative">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search books…"
            className="w-full bg-neutral-900/80 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-xs text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-primary-500/40 focus:ring-1 focus:ring-primary-500/15 focus:shadow-[0_0_12px_rgba(167,139,250,0.06)] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-400 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto">
        {SECTIONS.map((s) => {
          const count = BOOKS.filter((b) => b.shelf === s.id).length
          return (
            <button
              key={s.id}
              onClick={() => { onSectionClick(s.id); onFilterChange(null) }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-colors text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/40 group"
            >
              <motion.span
                className="text-neutral-600 w-4 text-center group-hover:text-neutral-400 transition-colors"
                whileHover={{ scale: 1.15 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
              >
                {s.icon}
              </motion.span>
              <span className="flex-1 text-left">{s.label}</span>
              <span className="text-[10px] text-neutral-600 font-mono">{count}</span>
            </button>
          )
        })}

        <div className="h-px my-2 mx-2" style={{ background: 'rgba(245,237,220,0.04)' }} />

        {/* Filter toggles */}
        <FilterButton
          label="Favorites"
          icon="★"
          active={activeFilter === 'favorites'}
          onClick={() => onFilterChange(activeFilter === 'favorites' ? null : 'favorites')}
          count={favorites.length}
        />
        <FilterButton
          label="Highly Recommended"
          icon="✓"
          active={activeFilter === 'recommended'}
          onClick={() => onFilterChange(activeFilter === 'recommended' ? null : 'recommended')}
          count={BOOKS.filter((b) => b.recommend).length}
        />
      </nav>

      {/* Stats */}
      <AnimatePresence>
        <motion.div
          className="px-4 py-4 border-t border-neutral-800/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <p className="text-[10px] text-neutral-600 uppercase tracking-widest mb-2 font-semibold">Reading Stats</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500">Total Books</span>
              <span className="text-neutral-300 font-mono">{BOOKS.length}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500">Pages Read</span>
              <span className="text-neutral-300 font-mono">{totalPages.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500">Favorites</span>
              <span className="text-amber-400 font-mono">{favorites.length}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500">Goal</span>
              <span className="text-neutral-400 font-mono">52 / yr</span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.aside>
  )
}

function FilterButton({ label, icon, active, onClick, count }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-colors group ${
        active
          ? 'text-primary-300 bg-primary-500/8'
          : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/40'
      }`}
    >
      <motion.span
        className={`w-4 text-center transition-colors ${
          active ? 'text-primary-400' : 'text-neutral-600 group-hover:text-neutral-400'
        }`}
        whileHover={{ scale: 1.15 }}
        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
      >
        {active ? '●' : icon}
      </motion.span>
      <span className="flex-1 text-left">{label}</span>
      {count > 0 && (
        <span className={`text-[10px] font-mono ${active ? 'text-primary-400' : 'text-neutral-600'}`}>
          {count}
        </span>
      )}
    </button>
  )
}
