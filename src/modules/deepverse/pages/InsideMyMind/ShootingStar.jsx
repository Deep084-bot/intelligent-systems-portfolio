import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useBrainStore, { DEBUG_EASTER_EGGS } from './store'

const STAR_COLORS = ['#e6f4ff', '#dbe9ff', '#f4f8ff', '#ffe9c9']
const FLIGHT_MS = 1100
const TRAIL_LEN = 220

function randomSchedule() {
  return DEBUG_EASTER_EGGS
    ? 10000 + Math.random() * 10000
    : 120000 + Math.random() * 180000
}

export default function ShootingStar() {
  const [star, setStar] = useState(null)
  const timerRef = useRef(null)
  const dismissRef = useRef(null)
  const notify = useBrainStore((s) => s.notify)
  const recordDiscovery = useBrainStore((s) => s.recordDiscovery)

  useEffect(() => {
    function spawn() {
      timerRef.current = setTimeout(() => {
        const fromX = Math.random() * 0.6 + 0.1
        const fromY = Math.random() * 0.5 + 0.05
        const start = { x: window.innerWidth * fromX, y: window.innerHeight * fromY }
        const end = { x: window.innerWidth * (fromX - 0.4), y: window.innerHeight * (fromY + 0.35) }
        const dx = end.x - start.x
        const dy = end.y - start.y
        const len = Math.hypot(dx, dy) || 1
        setStar({
          id: Date.now(),
          color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
          start,
          end,
          tx: (dx / len) * TRAIL_LEN,
          ty: (dy / len) * TRAIL_LEN,
        })
        if (DEBUG_EASTER_EGGS) console.log('[brainos] Shooting star spawned')
        dismissRef.current = setTimeout(() => {
          setStar(null)
          spawn()
        }, FLIGHT_MS + 150)
      }, randomSchedule())
    }
    spawn()
    return () => {
      clearTimeout(timerRef.current)
      clearTimeout(dismissRef.current)
    }
  }, [])

  const handleClick = (id) => {
    if (DEBUG_EASTER_EGGS) console.log('[brainos] Shooting star clicked')
    notify('Wish Granted')
    recordDiscovery('shooting-star')
    setStar(null)
  }

  return (
    <AnimatePresence>
      {star && (
        <motion.div
          key={star.id}
          onClick={() => handleClick(star.id)}
          initial={{ x: 0, y: 0, opacity: 0 }}
          animate={{ x: star.end.x - star.start.x, y: star.end.y - star.start.y, opacity: [0, 1, 0.6, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: FLIGHT_MS / 1000, ease: 'easeIn' }}
          className="fixed z-[60] cursor-pointer pointer-events-auto"
          style={{
            left: star.start.x,
            top: star.start.y,
            width: 0,
            height: 0,
          }}
        >
          <svg
            width={240}
            height={240}
            style={{
              position: 'absolute',
              left: -120,
              top: -120,
              overflow: 'visible',
            }}
          >
            <defs>
              <linearGradient
                id={`star-trail-${star.id}`}
                gradientUnits="userSpaceOnUse"
                x1="120"
                y1="120"
                x2={120 - star.tx}
                y2={120 - star.ty}
              >
                <stop offset="0%" stopColor={star.color} />
                <stop offset="100%" stopColor={star.color} stopOpacity="0" />
              </linearGradient>
              <filter id={`star-blur-${star.id}`} x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="1.4" />
              </filter>
              <radialGradient id={`star-halo-${star.id}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="60%" stopColor={star.color} />
                <stop offset="100%" stopColor={star.color} stopOpacity="0" />
              </radialGradient>
            </defs>
            <line
              x1="120"
              y1="120"
              x2={120 - star.tx}
              y2={120 - star.ty}
              stroke={`url(#star-trail-${star.id})`}
              strokeWidth="1.5"
              strokeLinecap="round"
              filter={`url(#star-blur-${star.id})`}
            />
            <circle cx="120" cy="120" r="7" fill={`url(#star-halo-${star.id})`} />
            <circle cx="120" cy="120" r="2.2" fill="#ffffff" />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
