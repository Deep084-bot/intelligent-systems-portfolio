import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import DustParticles from './DustParticles'
import { BOOKS } from './data'
import BookShelf from './BookShelf'
import BookDetail from './BookDetail'
import Sidebar from './Sidebar'
import { preloadCover } from './useCover'

const SHELF_CONFIG = [
  { id: 'science-engineering', label: 'Engineering & Science' },
  { id: 'philosophy', label: 'Philosophy & Ideas' },
  { id: 'inspirational', label: 'Inspirational & Poetry' },
  { id: 'colleen-hoover', label: 'Colleen Hoover' },
  { id: 'romance', label: 'Other Romance' },
  { id: 'young-adult', label: 'Young Adult' },
]

export default function ReadingRoom({ navigate }) {
  const [selectedBook, setSelectedBook] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState(null)
  const shelfRefs = useRef({})
  const shelvesRef = useRef([])
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 })

  const filteredBySearch = useMemo(() => {
    if (!searchQuery) return BOOKS
    const q = searchQuery.toLowerCase()
    return BOOKS.filter((b) =>
      [b.title, b.author, b.genre, ...(b.tags || [])].some((t) =>
        t?.toLowerCase().includes(q)
      )
    )
  }, [searchQuery])

  const filteredBooks = useMemo(() => {
    let f = filteredBySearch
    if (activeFilter === 'favorites') f = f.filter((b) => b.favorite)
    if (activeFilter === 'recommended') f = f.filter((b) => b.recommend)
    return f
  }, [filteredBySearch, activeFilter])

  const shelves = useMemo(() => {
    const result = SHELF_CONFIG.map((s) => ({
      ...s,
      books: filteredBooks.filter((b) => b.shelf === s.id),
    })).filter((s) => s.books.length > 0)
    shelvesRef.current = result
    return result
  }, [filteredBooks])

  const handleSelectBook = useCallback((book) => {
    setSelectedBook(book)
    const i = BOOKS.findIndex((b) => b.id === book.id)
    if (i > 0) preloadCover(BOOKS[i - 1])
    if (i < BOOKS.length - 1) preloadCover(BOOKS[i + 1])
  }, [])

  const handleCloseDetail = useCallback(() => {
    setSelectedBook(null)
  }, [])

  const currentIndex = useMemo(() => {
    if (!selectedBook) return -1
    return BOOKS.findIndex((b) => b.id === selectedBook.id)
  }, [selectedBook])

  const handleNext = useMemo(() => {
    if (currentIndex < 0 || currentIndex >= BOOKS.length - 1) return null
    return () => setSelectedBook(BOOKS[currentIndex + 1])
  }, [currentIndex])

  const handlePrev = useMemo(() => {
    if (currentIndex <= 0) return null
    return () => setSelectedBook(BOOKS[currentIndex - 1])
  }, [currentIndex])

  const handleSectionClick = useCallback((shelfId) => {
    const el = shelfRefs.current[shelfId]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  const handleSearchChange = useCallback((q) => {
    setSearchQuery(q)
    if (q && q.length > 1) {
      const currentShelves = shelvesRef.current
      if (currentShelves.length > 0) {
        setTimeout(() => {
          const el = shelfRefs.current[currentShelves[0].id]
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
      }
    }
  }, [])

  useEffect(() => {
    const handleMouse = (e) => {
      setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight })
    }
    window.addEventListener('mousemove', handleMouse, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [])

  const isEmpty = shelves.length === 0 && (searchQuery || activeFilter)

  return (
    <div className="fixed inset-0 flex" style={{ background: '#050302' }}>
      <DustParticles mousePos={mousePos} />

      {/* Wall texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-[3]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f5eddc' fill-opacity='0.015'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          opacity: 0.5,
        }}
      />

      {/* Wall panels (vertical wood strips) */}
      <div
        className="fixed inset-0 pointer-events-none z-[1] overflow-hidden"
        style={{ opacity: 0.12 }}
      >
        <div className="flex h-full">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 h-full"
              style={{
                width: 1,
                marginLeft: i === 0 ? 80 : 0,
                background: i % 2 === 0
                  ? 'linear-gradient(180deg, transparent 0%, rgba(245,237,220,0.06) 50%, transparent 100%)'
                  : 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.04) 50%, transparent 100%)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Top corner lamp glow */}
      <div
        className="fixed top-0 left-0 w-1/3 h-1/2 pointer-events-none z-[2]"
        style={{
          background: 'radial-gradient(ellipse at 15% 10%, rgba(212,165,116,0.08) 0%, rgba(212,165,116,0.03) 30%, transparent 70%)',
        }}
      />
      <div
        className="fixed top-0 right-0 w-1/3 h-1/2 pointer-events-none z-[2]"
        style={{
          background: 'radial-gradient(ellipse at 85% 10%, rgba(167,139,250,0.06) 0%, rgba(167,139,250,0.02) 30%, transparent 70%)',
        }}
      />

      {/* Wall lamp glow (left wall) */}
      <div
        className="fixed top-1/3 left-0 w-20 h-40 pointer-events-none z-[2]"
        style={{
          background: 'radial-gradient(ellipse at 0% 50%, rgba(245,237,220,0.06) 0%, transparent 70%)',
        }}
      />

      {/* Warm ambient gradient at bottom */}
      <div
        className="fixed bottom-0 left-0 right-0 h-1/3 pointer-events-none z-[2]"
        style={{
          background: 'linear-gradient(0deg, rgba(212,165,116,0.03) 0%, transparent 100%)',
        }}
      />

      {/* Sidebar */}
      <div className="relative z-30 flex-shrink-0">
        <Sidebar
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          onSectionClick={handleSectionClick}
        />
      </div>

      {/* Main content */}
      <main className="flex-1 relative z-20 overflow-y-auto min-w-0">
        {/* Top bar */}
        <div className="sticky top-0 z-20 px-5 pt-4 pb-3 flex items-center justify-between" style={{ background: 'linear-gradient(180deg, rgba(5,3,2,0.95) 0%, transparent 100%)' }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/deepverse')}
              className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              ← Back
            </button>
            <h1 className="text-sm font-semibold text-neutral-200">The Reading Room</h1>
          </div>
          <span className="text-[10px] text-neutral-600 font-mono">
            {activeFilter === 'favorites' ? `${filteredBooks.length} favorites` : `${BOOKS.length} books`}
          </span>
        </div>

        {/* Shelves */}
        <motion.div className="px-5 pb-8 space-y-1" layout>
          {!isEmpty ? (
            shelves.map((shelf, i) => (
              <div
                key={shelf.id}
                ref={(el) => { shelfRefs.current[shelf.id] = el }}
              >
                <BookShelf
                  books={shelf.books}
                  label={shelf.label}
                  shelfId={shelf.id}
                  onSelectBook={handleSelectBook}
                  searchQuery={searchQuery}
                />
              </div>
            ))
          ) : (
            <motion.div
              className="flex flex-col items-center justify-center py-20"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <svg className="w-16 h-16 mb-4 text-neutral-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p className="text-sm text-neutral-600 mb-1">No books found</p>
              <p className="text-xs text-neutral-700">
                {searchQuery ? 'Try a different search term' : 'Try adjusting your filters'}
              </p>
            </motion.div>
          )}

          {/* Reading goal */}
          {!isEmpty && (
            <div className="pt-4 pb-2">
              <div className="flex items-center gap-2 text-[10px] text-neutral-600">
                <span>Reading Goal</span>
                <span className="text-neutral-500">12 / 52 books this year</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(245,237,220,0.04)' }} />
              </div>
              <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(245,237,220,0.04)' }}>
                <div className="h-full rounded-full" style={{ width: '23%', background: 'linear-gradient(90deg, #d4a574, #a78bfa)' }} />
              </div>
            </div>
          )}
        </motion.div>
      </main>

      {/* Book detail desk */}
      {selectedBook && (
        <BookDetail
          key={selectedBook.id}
          book={selectedBook}
          allBooks={BOOKS}
          onClose={handleCloseDetail}
          onNext={handleNext}
          onPrev={handlePrev}
        />
      )}
    </div>
  )
}
