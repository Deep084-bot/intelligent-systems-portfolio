import { useRef, useEffect } from 'react'
import { cn } from '../../../../utils'

const STAR_COUNT = 150

export default function StarField({ className }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let animationId = null
    let stars = []
    let w = 0
    let h = 0

    function initStars() {
      stars = Array.from({ length: STAR_COUNT }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        radius: 0.3 + Math.random() * 2.2,
        baseAlpha: 0.3 + Math.random() * 0.7,
        speed: 0.3 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2,
      }))
    }

    function resize() {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w
      canvas.height = h
      initStars()
    }

    function draw(time) {
      ctx.clearRect(0, 0, w, h)

      for (const star of stars) {
        const alpha = star.baseAlpha * (0.5 + 0.5 * Math.sin(time * 0.001 * star.speed + star.phase))
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(210, 220, 255, ${alpha})`
        ctx.fill()
      }

      animationId = requestAnimationFrame(draw)
    }

    resize()
    animationId = requestAnimationFrame(draw)
    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={cn('absolute inset-0 w-full h-full', className)}
      aria-hidden="true"
    />
  )
}
