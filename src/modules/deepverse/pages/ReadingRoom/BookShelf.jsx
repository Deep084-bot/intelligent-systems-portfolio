import { useRef, useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useCover } from './useCover'

const SHELF_HEIGHT = 28
const SHELF_LIP = 6
const LAMBDA = 0.95

const BOOKEND_WIDTH = 10
const BOOKEND_HEIGHT = 120

const SHELF_ICONS = {
  'science-engineering': '⚙',
  philosophy: '◇',
  inspirational: '○',
  'colleen-hoover': '♡',
  romance: '♤',
  'young-adult': '△',
}

function Book({ book, onSelect, index, hoveredIndex, onHover, onLeave, isSearchMatch, bookIndex }) {
  const { coverUrl, loading } = useCover(book)
  const isHovered = hoveredIndex === index
  const isLeftNeighbor = hoveredIndex === index + 1
  const isRightNeighbor = hoveredIndex === index - 1
  const [imageLoaded, setImageLoaded] = useState(false)

  const height = Math.max((book.height || 190) - 78, 40)
  const width = Math.max((book.thickness || 20) + 6, 10)
  const isLeaning = Math.random() < 0.12
  const leanAngle = isLeaning ? (Math.random() < 0.5 ? 2 : -2) + (Math.random() - 0.5) * 1 : 0

  return (
    <motion.div
      className="relative flex-shrink-0 cursor-pointer"
      style={{
        width,
        zIndex: isHovered ? 50 : isLeftNeighbor || isRightNeighbor ? 25 : 1 + index * 0.01,
      }}
      onHoverStart={() => onHover(index)}
      onHoverEnd={onLeave}
      onClick={() => onSelect(book)}
      layout
      animate={isSearchMatch ? { scale: [1, 1.04, 1], transition: { duration: 0.6, delay: bookIndex * 0.04 } } : {}}
    >
      <motion.div
        className="relative origin-bottom"
        style={{
          height,
          transform: `rotate(${leanAngle}deg)`,
        }}
        animate={isHovered ? {
          y: -10,
          scaleX: 1.04,
          scaleY: 1.08,
          rotate: 0,
          x: isLeftNeighbor ? -3 : isRightNeighbor ? 3 : 0,
        } : {
          y: isLeftNeighbor || isRightNeighbor ? -2 : 0,
          scaleX: 1,
          scaleY: 1,
          rotate: leanAngle,
          x: 0,
        }}
        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      >
        <div
          className="w-full h-full relative overflow-hidden"
          style={{
            borderRadius: 2,
            background: loading
              ? `linear-gradient(135deg, ${book.spineColor || '#2a2a2a'}, ${book.coverColor || '#1a1a1a'})`
              : 'none',
            boxShadow: isHovered
              ? `0 12px 36px rgba(0,0,0,0.6), 0 0 0 1px ${book.accentColor}30, 0 0 20px ${book.accentColor}15`
              : `1px 0 4px rgba(0,0,0,0.3), 0 0 1px 0 rgba(255,255,255,0.012)`,
          }}
        >
          {coverUrl && !loading && (
            <>
              <img
                src={coverUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  objectPosition: '50% 0%',
                  borderRadius: 1.5,
                  opacity: imageLoaded ? 1 : 0,
                  transition: 'opacity 0.3s ease',
                }}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
              />
              {!imageLoaded && (
                <div
                  className="absolute inset-0 animate-pulse"
                  style={{ background: `linear-gradient(135deg, ${book.spineColor}66, ${book.coverColor}33)` }}
                />
              )}
              {/* Cover paper texture */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
                  mixBlendMode: 'multiply',
                }}
              />
              {/* Glass reflection */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 30%, transparent 50%)',
                }}
              />
              {/* Emboss */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03), inset 0 -1px 0 rgba(0,0,0,0.08)' }}
              />
            </>
          )}
          {loading && (
            <div
              className="absolute inset-0 animate-pulse"
              style={{ background: `linear-gradient(135deg, ${book.spineColor}66, ${book.coverColor}33)` }}
            />
          )}
          {!coverUrl && !loading && (
            <div
              className="absolute inset-0 flex items-center justify-center p-0.5"
              style={{
                background: `linear-gradient(135deg, ${book.spineColor}, ${book.coverColor})`,
              }}
            >
              <span
                className="text-[5px] leading-tight font-medium text-center transition-opacity duration-200"
                style={{
                  writingMode: 'vertical-rl',
                  textOrientation: 'mixed',
                  color: book.accentColor,
                  opacity: isHovered ? 0.7 : 0.4,
                }}
              >
                {book.title.length > 25 ? book.title.slice(0, 22) + '…' : book.title}
              </span>
            </div>
          )}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            style={{ background: `linear-gradient(135deg, ${book.accentColor}18, transparent 60%)` }}
          />
        </div>
      </motion.div>

      {/* Hover card */}
      {isHovered && (
        <motion.div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 pointer-events-none"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div
            className="px-2.5 py-1.5 rounded text-xs whitespace-nowrap"
            style={{
              background: '#1c1917',
              border: '1px solid rgba(245,237,220,0.1)',
              boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
            }}
          >
            <p className="text-neutral-200 font-medium truncate max-w-[180px]">{book.title}</p>
            <p className="text-neutral-400 truncate max-w-[180px]">{book.author}</p>
            <p className="text-neutral-600 text-[9px] mt-0.5">{book.rating}★ · {book.pages}p · {book.year}</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

function Bookend({ side }) {
  return (
    <motion.div
      className="flex-shrink-0 rounded-sm relative"
      style={{
        width: BOOKEND_WIDTH,
        height: BOOKEND_HEIGHT,
        background: `linear-gradient(135deg, #4a3a2a, #2a1f14)`,
        border: '1px solid rgba(245,237,220,0.06)',
        borderRadius: 2,
        marginTop: 'auto',
        marginBottom: 0,
        boxShadow: side === 'left'
          ? '3px 0 8px rgba(0,0,0,0.5), inset 1px 0 2px rgba(245,237,220,0.05)'
          : '-3px 0 8px rgba(0,0,0,0.5), inset -1px 0 2px rgba(245,237,220,0.05)',
      }}
      whileHover={{ scaleY: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `repeating-linear-gradient(0deg, transparent 0px, rgba(245,237,220,0.03) 1px, transparent 3px)`,
          borderRadius: 1,
        }}
      />
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{
          background: 'rgba(245,237,220,0.08)',
          borderRadius: '1px 1px 0 0',
        }}
      />
      {/* Bottom shadow from bookend onto shelf */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1"
        style={{
          background: 'linear-gradient(0deg, rgba(0,0,0,0.2), transparent)',
        }}
      />
    </motion.div>
  )
}

function useVisibility(threshold = 0.15) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.unobserve(el)
        }
      },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, visible }
}

function Scratch({ x, y, angle, length }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: length,
        height: 0.5,
        background: 'rgba(245,237,220,0.04)',
        transform: `rotate(${angle}deg)`,
        opacity: 0.3 + Math.random() * 0.4,
      }}
    />
  )
}

export default function BookShelf({ books, label, onSelectBook, shelfId, searchQuery }) {
  const scrollRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const dragState = useRef({ startX: 0, scrollLeft: 0, isDown: false })
  const momentumRef = useRef({ velocity: 0, frameId: null })
  const { ref: visRef, visible } = useVisibility(0.1)

  const hasActiveSearch = searchQuery && searchQuery.length > 0

  const stopMomentum = useCallback(() => {
    if (momentumRef.current.frameId) {
      cancelAnimationFrame(momentumRef.current.frameId)
      momentumRef.current.frameId = null
    }
  }, [])

  const handleMouseDown = useCallback((e) => {
    stopMomentum()
    dragState.current = {
      startX: e.pageX,
      scrollLeft: scrollRef.current?.scrollLeft || 0,
      isDown: true,
    }
    setIsDragging(false)
  }, [stopMomentum])

  const handleMouseMove = useCallback((e) => {
    if (!dragState.current.isDown) return
    e.preventDefault()
    const dx = e.pageX - dragState.current.startX
    if (Math.abs(dx) > 3) setIsDragging(true)
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = dragState.current.scrollLeft - dx
    }
    momentumRef.current.velocity = -dx * 0.3
  }, [])

  const handleMouseUp = useCallback(() => {
    dragState.current.isDown = false
    const vel = momentumRef.current.velocity
    if (Math.abs(vel) > 3) {
      const animate = () => {
        momentumRef.current.velocity *= LAMBDA
        if (scrollRef.current) {
          scrollRef.current.scrollLeft -= momentumRef.current.velocity
        }
        if (Math.abs(momentumRef.current.velocity) > 0.1) {
          momentumRef.current.frameId = requestAnimationFrame(animate)
        }
      }
      momentumRef.current.frameId = requestAnimationFrame(animate)
    }
    setTimeout(() => setIsDragging(false), 50)
  }, [])

  useEffect(() => {
    return () => stopMomentum()
  }, [stopMomentum])

  if (!books?.length) return null

  const scratches = [
    { x: 15, y: 45, angle: 3, length: 28 },
    { x: 48, y: 62, angle: -2, length: 18 },
    { x: 72, y: 38, angle: 5, length: 22 },
    { x: 85, y: 55, angle: -4, length: 14 },
    { x: 33, y: 28, angle: 7, length: 20 },
    { x: 60, y: 70, angle: -1, length: 16 },
    { x: 92, y: 42, angle: 6, length: 24 },
  ]

  return (
    <div ref={visRef}>
      <motion.div
        className="py-2"
        initial={{ opacity: 0, y: 10 }}
        animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Shelf label */}
        <div className="flex items-center gap-2 mb-2 px-1 group">
          <motion.span
            className="text-xs text-neutral-500 group-hover:text-neutral-400 transition-colors"
            whileHover={{ scale: 1.2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          >
            {SHELF_ICONS[shelfId] || '▫'}
          </motion.span>
          <h3 className="text-xs font-semibold text-neutral-400 group-hover:text-neutral-300 uppercase tracking-[0.15em] transition-colors">
            {label}
          </h3>
          <span className="text-[10px] text-neutral-600 font-mono">{books.length}</span>
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(245,237,220,0.06), transparent)' }} />
        </div>

        {/* Shelf board */}
        <div
          ref={scrollRef}
          className="overflow-x-auto overflow-y-hidden select-none relative"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            cursor: isDragging ? 'grabbing' : 'grab',
            height: SHELF_HEIGHT + SHELF_LIP + 200,
            perspective: 800,
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDragStart={(e) => e.preventDefault()}
        >
          <style>{`div::-webkit-scrollbar { display: none; }`}</style>

          {/* Wood grain shelf surface */}
          <div className="absolute" style={{ left: 0, right: 0, bottom: SHELF_LIP, height: SHELF_HEIGHT }}>
            <div
              className="absolute inset-0"
              style={{
                background: `
                  linear-gradient(180deg,
                    rgba(245,237,220,0.04) 0%,
                    transparent 10%,
                    transparent 85%,
                    rgba(0,0,0,0.15) 100%
                  ),
                  repeating-linear-gradient(
                    90deg,
                    transparent 0px,
                    rgba(245,237,220,0.02) 2px,
                    transparent 5px,
                    rgba(0,0,0,0.04) 8px,
                    transparent 12px,
                    rgba(245,237,220,0.015) 16px,
                    transparent 20px,
                    rgba(0,0,0,0.03) 24px,
                    transparent 30px,
                    rgba(245,237,220,0.01) 36px,
                    transparent 42px
                  ),
                  repeating-linear-gradient(
                    0deg,
                    #2a1a0e 0px,
                    #3d2817 4px,
                    #2a1a0e 8px,
                    #3d2817 12px,
                    #1f1208 18px,
                    #2a1a0e 22px,
                    #3d2817 26px,
                    #2a1a0e 30px
                  )
                `,
                boxShadow: 'inset 0 1px 0 rgba(245,237,220,0.05)',
              }}
            />
            {/* Wood color variation */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `repeating-linear-gradient(90deg, transparent 0px, rgba(0,0,0,0.02) 30px, transparent 60px, rgba(245,237,220,0.015) 90px, transparent 120px)`,
              }}
            />
            {/* Scratches */}
            {scratches.map((s, i) => (
              <Scratch key={i} {...s} />
            ))}
            {/* Warm reflection on shelf surface */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(180deg, transparent 0%, rgba(212,165,116,0.03) 35%, transparent 60%)',
              }}
            />
          </div>

          {/* Shelf lip (front edge) with warm catch light */}
          <div
            className="absolute"
            style={{
              left: 0,
              right: 0,
              bottom: 0,
              height: SHELF_LIP,
              background: 'linear-gradient(180deg, #1f1208, #140c05)',
              borderTop: '1px solid rgba(245,237,220,0.04)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.4), inset 0 1px 0 rgba(212,165,116,0.04)',
            }}
          />

          {/* Underside shadow */}
          <div
            className="absolute"
            style={{
              left: 0,
              right: 0,
              bottom: -12,
              height: 14,
              background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, transparent 100%)',
              pointerEvents: 'none',
            }}
          />

          {/* Books and bookends */}
          <div
            className="flex items-end px-1 min-w-min relative"
            style={{
              height: '100%',
              paddingBottom: SHELF_HEIGHT + SHELF_LIP + 2,
            }}
            onClick={() => {
              if (isDragging) return
            }}
          >
            {/* Left bookend */}
            <div className="mr-1">
              <Bookend side="left" />
            </div>

            {books.map((book, i) => (
              <Book
                key={book.id}
                book={book}
                index={i}
                bookIndex={i}
                onSelect={onSelectBook}
                hoveredIndex={hoveredIndex}
                onHover={setHoveredIndex}
                onLeave={() => setHoveredIndex(null)}
                isSearchMatch={hasActiveSearch}
              />
            ))}

            {/* Right bookend */}
            <div className="ml-1">
              <Bookend side="right" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
