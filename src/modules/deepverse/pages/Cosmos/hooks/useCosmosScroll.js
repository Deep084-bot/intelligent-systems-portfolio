import { useRef, useEffect, useCallback, useState } from 'react'

const SENSITIVITY = 600
const STATE_UPDATE_INTERVAL = 100
const FRICTION = 0.92
const ACCELERATION = 0.15
const MAX_SPEED = 0.012
const SNAP_THRESHOLD = 0.0005
const SNAP_SPEED = 0.003

export function useCosmosScroll() {
  const progressRef = useRef(0)
  const velocityRef = useRef(0)
  const targetRef = useRef(0)
  const [progressState, setProgressState] = useState(0)
  const lastStateUpdate = useRef(0)

  useEffect(() => {
    function handleWheel(e) {
      e.preventDefault()
      const input = e.deltaY / SENSITIVITY
      targetRef.current = Math.max(0, Math.min(1, targetRef.current + input))
    }

    function handleTouchStart(e) {
      const touch = e.touches[0]
      if (!touch) return
      window._cosmosTouchY = touch.clientY
    }

    function handleTouchMove(e) {
      e.preventDefault()
      const touch = e.touches[0]
      if (!touch || window._cosmosTouchY === undefined) return
      const dy = (window._cosmosTouchY - touch.clientY) / window.innerHeight
      targetRef.current = Math.max(0, Math.min(1, targetRef.current + dy * 0.8))
      window._cosmosTouchY = touch.clientY
    }

    function handleKeyDown(e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault()
        targetRef.current = Math.min(1, targetRef.current + 0.04)
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault()
        targetRef.current = Math.max(0, targetRef.current - 0.04)
      } else if (e.key === 'Home') {
        e.preventDefault()
        targetRef.current = 0
      } else if (e.key === 'End') {
        e.preventDefault()
        targetRef.current = 1
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  useEffect(() => {
    let rafId
    let last = performance.now()

    function update(now) {
      // Advance by elapsed time rather than per-frame so the journey feels (and
      // times) the same regardless of the renderer's frame rate — the scene is
      // heavy enough that a fixed per-frame step made the ending unreachable on
      // slower devices.
      const dt = Math.min(50, now - last)
      last = now
      const k = dt / (1000 / 60)

      const current = progressRef.current
      const target = targetRef.current
      const diff = target - current
      let velocity = velocityRef.current

      if (Math.abs(diff) > SNAP_THRESHOLD) {
        velocity += Math.sign(diff) * ACCELERATION * Math.min(Math.abs(diff) * 3, 1) * k
        velocity *= Math.pow(FRICTION, k)
        velocity = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, velocity))

        if (Math.sign(velocity) !== Math.sign(diff) && Math.abs(velocity) > Math.abs(diff) * 0.5) {
          velocity = Math.sign(diff) * Math.abs(diff) * 0.3
        }

        let next = current + velocity * k
        if ((diff > 0 && next > target) || (diff < 0 && next < target)) next = target
        progressRef.current = Math.max(0, Math.min(1, next))
      } else {
        velocity *= Math.pow(0.85, k)
        if (Math.abs(velocity) < 0.0001) {
          progressRef.current = target
          velocity = 0
        } else {
          progressRef.current = Math.max(0, Math.min(1, current + velocity * k))
        }
      }

      velocityRef.current = velocity

      if (now - lastStateUpdate.current > STATE_UPDATE_INTERVAL) {
        setProgressState(progressRef.current)
        lastStateUpdate.current = now
      }

      rafId = requestAnimationFrame(update)
    }

    rafId = requestAnimationFrame(update)

    return () => cancelAnimationFrame(rafId)
  }, [])

  const setProgress = useCallback((val) => {
    targetRef.current = Math.max(0, Math.min(1, val))
    velocityRef.current = 0.003
  }, [])

  return { progressRef, progress: progressState, setProgress }
}
