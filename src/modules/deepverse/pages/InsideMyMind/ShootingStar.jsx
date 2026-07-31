import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useBrainStore, { DEBUG_EASTER_EGGS } from './store'

const STAR_COLORS = ['#e6f4ff', '#dbe9ff', '#f4f8ff', '#ffe9c9']
const FLIGHT_MS = 1100

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
        setStar({
          id: Date.now(),
          color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
          start: { x: window.innerWidth * fromX, y: window.innerHeight * fromY },
          end: { x: window.innerWidth * (fromX - 0.4), y: window.innerHeight * (fromY + 0.35) },
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed z-[60] cursor-pointer pointer-events-auto"
          style={{
            left: star.start.x,
            top: star.start.y,
            width: 1,
            height: 1,
          }}
        >
          <motion.div
            initial={{ x: 0, y: 0, opacity: 0, scale: 1 }}
            animate={{ x: star.end.x - star.start.x, y: star.end.y - star.start.y, opacity: [0, 1, 0.6, 0] }}
            transition={{ duration: FLIGHT_MS / 1000, ease: 'easeIn' }}
            style={{
              width: 220,
              height: 1.5,
              transformOrigin: 'left center',
              background: `linear-gradient(90deg, transparent, ${star.color})`,
              boxShadow: `0 0 12px ${star.color}, 0 0 4px ${star.color}`,
              borderRadius: 999,
            }}
          />
          <motion.div
            initial={{ x: 0, y: 0, opacity: 0 }}
            animate={{ x: star.end.x - star.start.x, y: star.end.y - star.start.y, opacity: [0, 1, 1, 0] }}
            transition={{ duration: FLIGHT_MS / 1000, ease: 'easeIn' }}
            style={{
              position: 'absolute',
              left: 2,
              top: -1,
              width: 3,
              height: 3,
              borderRadius: 999,
              background: star.color,
              boxShadow: `0 0 8px ${star.color}`,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
