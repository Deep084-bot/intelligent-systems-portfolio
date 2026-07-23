import { useState, useRef, useCallback, useMemo } from 'react'
import String from './String'

export default function GuitarStrings({ onPlayString }) {
  const [vibratingStrings, setVibratingStrings] = useState(new Map())
  const [hoveredString, setHoveredString] = useState(null)
  const [cursorX, setCursorX] = useState(null)
  const [pluckPositions, setPluckPositions] = useState(new Map())
  const isDragging = useRef(false)
  const lastPlayedString = useRef(null)
  const dragStartTime = useRef(null)
  const dragStartY = useRef(null)

  const handlePlay = useCallback((stringIndex, velocity = 1.0, x = null) => {
    onPlayString(stringIndex, velocity)

    setVibratingStrings((prev) => {
      const next = new Map(prev)
      next.set(stringIndex, velocity)
      return next
    })

    if (x !== null) {
      setPluckPositions((prev) => {
        const next = new Map(prev)
        next.set(stringIndex, x)
        return next
      })
    }

    lastPlayedString.current = stringIndex

    setTimeout(() => {
      setVibratingStrings((prev) => {
        const next = new Map(prev)
        next.delete(stringIndex)
        return next
      })
      setPluckPositions((prev) => {
        const next = new Map(prev)
        next.delete(stringIndex)
        return next
      })
    }, 600 + (5 - stringIndex) * 50)
  }, [onPlayString])

  const calculateVelocity = useCallback((currentY) => {
    if (!dragStartTime.current || !dragStartY.current) return 1.0

    const timeDelta = Date.now() - dragStartTime.current
    const distance = Math.abs(currentY - dragStartY.current)
    const speed = distance / (timeDelta + 1)
    const velocity = Math.min(0.5 + speed * 0.5, 1.0)

    return velocity
  }, [])

  const handleMouseMove = useCallback((e) => {
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Convert to SVG coordinates (viewBox is 1200x800)
    const svgX = (x / rect.width) * 1200
    const svgY = (y / rect.height) * 800

    setCursorX(svgX)

    // New string spacing - 38px apart, starting at Y=295
    const stringIndex = Math.floor((svgY - 295) / 38)

    if (stringIndex >= 0 && stringIndex < 6) {
      setHoveredString(stringIndex)
    } else {
      setHoveredString(null)
    }

    if (isDragging.current && stringIndex >= 0 && stringIndex < 6 && stringIndex !== lastPlayedString.current) {
      const velocity = calculateVelocity(svgY)
      handlePlay(stringIndex, velocity, svgX)

      dragStartTime.current = Date.now()
      dragStartY.current = svgY
    }
  }, [handlePlay, calculateVelocity])

  const handleMouseDown = useCallback((e) => {
    isDragging.current = true
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const y = e.clientY - rect.top
    const svgY = (y / rect.height) * 800
    dragStartTime.current = Date.now()
    dragStartY.current = svgY
  }, [])

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
    lastPlayedString.current = null
    dragStartTime.current = null
    dragStartY.current = null
  }, [])

  const handleMouseLeave = useCallback(() => {
    isDragging.current = false
    lastPlayedString.current = null
    setHoveredString(null)
    setCursorX(null)
    dragStartTime.current = null
    dragStartY.current = null
  }, [])

  const handleTouchMove = useCallback((e) => {
    if (!isDragging.current) return

    const touch = e.touches[0]
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top

    const svgX = (x / rect.width) * 1200
    const svgY = (y / rect.height) * 800

    const stringIndex = Math.floor((svgY - 295) / 38)

    if (stringIndex >= 0 && stringIndex < 6 && stringIndex !== lastPlayedString.current) {
      const velocity = calculateVelocity(svgY)
      handlePlay(stringIndex, velocity, svgX)

      dragStartTime.current = Date.now()
      dragStartY.current = svgY
    }
  }, [handlePlay, calculateVelocity])

  const handleTouchStart = useCallback((e) => {
    isDragging.current = true
    const touch = e.touches[0]
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const y = touch.clientY - rect.top
    const svgY = (y / rect.height) * 800
    dragStartTime.current = Date.now()
    dragStartY.current = svgY
  }, [])

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false
    lastPlayedString.current = null
    dragStartTime.current = null
    dragStartY.current = null
  }, [])

  const cursorStyle = useMemo(() => ({
    cursor: isDragging.current ? 'grabbing' : 'pointer',
  }), [])

  return (
    <svg
      viewBox="0 0 1200 800"
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'none', ...cursorStyle }}
    >
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <String
          key={index}
          index={index}
          isVibrating={vibratingStrings.has(index)}
          vibrateIntensity={vibratingStrings.get(index) || 1.0}
          isHovered={hoveredString === index}
          hoverX={hoveredString === index ? cursorX : null}
          pluckX={pluckPositions.get(index)}
          onPlay={(idx) => {
            const x = cursorX || 510
            handlePlay(idx, 1.0, x)
          }}
        />
      ))}
    </svg>
  )
}
