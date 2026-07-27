import { useRef, useEffect } from 'react'

const COUNT = 140

export default function DustParticles({ mousePos }) {
  const canvasRef = useRef(null)
  const mouseRef = useRef({ x: 0.5, y: 0.5 })

  useEffect(() => {
    mouseRef.current = mousePos || { x: 0.5, y: 0.5 }
  }, [mousePos])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let frameId

    const dpr = window.devicePixelRatio || 1
    const particles = Array.from({ length: COUNT }, () => {
      const isNearLight = Math.random() < 0.35
      const side = isNearLight ? (Math.random() < 0.5 ? 'left' : 'right') : 'any'
      return {
        x: side === 'left' ? Math.random() * 0.3 : side === 'right' ? 0.7 + Math.random() * 0.3 : Math.random(),
        y: isNearLight ? Math.random() * 0.4 : 0.1 + Math.random() * 0.8,
        vx: (Math.random() - 0.5) * 0.0004,
        vy: -(0.0003 + Math.random() * 0.0006),
        size: isNearLight ? 0.8 + Math.random() * 3.5 : 0.5 + Math.random() * 2.5,
        opacity: isNearLight ? 0.05 + Math.random() * 0.15 : 0.02 + Math.random() * 0.08,
        drift: Math.random() * Math.PI * 2,
        driftSpeed: 0.003 + Math.random() * 0.012,
      }
    })

    const resize = () => {
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.scale(dpr, dpr)
    }
    resize()
    window.addEventListener('resize', resize)

    const animate = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

      const w = window.innerWidth, h = window.innerHeight
      const mx = mouseRef.current.x * w
      const my = mouseRef.current.y * h

      // Warm ambient bloom
      const bloomGrad = ctx.createRadialGradient(w / 2, h * 0.1, 0, w / 2, h * 0.1, h * 0.5)
      bloomGrad.addColorStop(0, 'rgba(245, 237, 220, 0.02)')
      bloomGrad.addColorStop(1, 'rgba(245, 237, 220, 0)')
      ctx.fillStyle = bloomGrad
      ctx.fillRect(0, 0, w, h)

      // Left lamp beam
      const leftGrad = ctx.createRadialGradient(w * 0.08, h * 0.08, 0, w * 0.08, h * 0.08, h * 0.4)
      leftGrad.addColorStop(0, 'rgba(212, 165, 116, 0.02)')
      leftGrad.addColorStop(1, 'rgba(212, 165, 116, 0)')
      ctx.fillStyle = leftGrad
      ctx.fillRect(0, 0, w, h)

      // Right lamp beam
      const rightGrad = ctx.createRadialGradient(w * 0.92, h * 0.08, 0, w * 0.92, h * 0.08, h * 0.4)
      rightGrad.addColorStop(0, 'rgba(167, 139, 250, 0.015)')
      rightGrad.addColorStop(1, 'rgba(167, 139, 250, 0)')
      ctx.fillStyle = rightGrad
      ctx.fillRect(0, 0, w, h)

      for (const p of particles) {
        p.x += p.vx + Math.sin(p.drift) * 0.0003
        p.y += p.vy
        p.drift += p.driftSpeed

        // Cursor repulsion
        const dx = (p.x * w) - mx
        const dy = (p.y * h) - my
        const dist = Math.sqrt(dx * dx + dy * dy)
        const repRadius = 120
        if (dist < repRadius && dist > 0) {
          const force = (1 - dist / repRadius) * 0.004
          p.x += (dx / dist) * force
          p.y += (dy / dist) * force
        }

        if (p.y < -0.02) {
          p.y = 0.9 + Math.random() * 0.1
          p.x = Math.random()
        }
        if (p.x < -0.02) p.x = 1.02
        if (p.x > 1.02) p.x = -0.02

        const sx = p.x * w
        const sy = p.y * h

        ctx.beginPath()
        ctx.arc(sx, sy, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(245, 237, 220, ${p.opacity})`
        ctx.fill()
      }

      frameId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 2 }}
      aria-hidden="true"
    />
  )
}
