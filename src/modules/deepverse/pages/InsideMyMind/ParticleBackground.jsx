import { useRef, useEffect } from 'react'
import useBrainStore from './store'

function layer(ctx, particles, w, h, tint) {
  const color = tint ? [168, 85, 247] : [255, 255, 255]
  for (const p of particles) {
    p.x += p.vx
    p.y += p.vy
    if (p.x < -50) p.x = w + 50
    if (p.x > w + 50) p.x = -50
    if (p.y < -50) p.y = h + 50
    if (p.y > h + 50) p.y = -50
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},${p.a})`
    ctx.fill()
  }
}

function connections(ctx, particles, tint) {
  const color = tint ? [168, 85, 247] : [255, 255, 255]
  const strength = tint ? 0.05 : 0.02
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x
      const dy = particles[i].y - particles[j].y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 100) {
        ctx.beginPath()
        ctx.moveTo(particles[i].x, particles[i].y)
        ctx.lineTo(particles[j].x, particles[j].y)
        ctx.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},${strength * (1 - dist / 100)})`
        ctx.stroke()
      }
    }
  }
}

export default function ParticleBackground() {
  const canvasRef = useRef(null)
  const enabled = useBrainStore((s) => s.particlesEnabled)
  const reducedMotion = useBrainStore((s) => s.reducedMotion)
  const developerMode = useBrainStore((s) => s.developerMode)

  useEffect(() => {
    if (!enabled) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf
    let stars = []
    let particles = []
    let constellations = []

    const tint = developerMode

    function resize() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      const w = canvas.width
      const h = canvas.height
      const count = reducedMotion ? 30 : 80
      const starCount = reducedMotion ? 40 : 120
      const speed = developerMode ? 2.2 : 1

      stars = []
      for (let i = 0; i < (developerMode ? starCount * 1.6 : starCount); i++) {
        stars.push({
          x: Math.random() * w, y: Math.random() * h,
          r: Math.random() * 0.8 + 0.2,
          a: (Math.random() * 0.3 + 0.05) * (developerMode ? 1.5 : 1),
          vx: (Math.random() - 0.5) * 0.05 * speed,
          vy: (Math.random() - 0.5) * 0.05 * speed,
        })
      }

      particles = []
      for (let i = 0; i < (developerMode ? count * 2 : count); i++) {
        particles.push({
          x: Math.random() * w, y: Math.random() * h,
          r: Math.random() * 1.5 + 0.5,
          a: (Math.random() * 0.25 + 0.05) * (developerMode ? 1.6 : 1),
          vx: (Math.random() - 0.5) * 0.25 * speed,
          vy: (Math.random() - 0.5) * 0.25 * speed,
        })
      }

      constellations = []
      for (let i = 0; i < (reducedMotion ? 2 : 5); i++) {
        const pts = []
        const cx = Math.random() * w
        const cy = Math.random() * h
        const n = 3 + Math.floor(Math.random() * 3)
        for (let j = 0; j < n; j++) {
          pts.push({
            x: cx + (Math.random() - 0.5) * 200,
            y: cy + (Math.random() - 0.5) * 200,
          })
        }
        constellations.push({ pts, vx: (Math.random() - 0.5) * 0.03 * speed, vy: (Math.random() - 0.5) * 0.03 * speed })
      }
    }
    resize()
    window.addEventListener('resize', resize)

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      layer(ctx, stars, canvas.width, canvas.height, tint)

      layer(ctx, particles, canvas.width, canvas.height, tint)
      connections(ctx, particles, tint)

      const constColor = tint ? '168, 85, 247' : '109, 92, 252'
      for (const c of constellations) {
        for (const p of c.pts) {
          p.x += c.vx
          p.y += c.vy
          if (p.x < -100) p.x = canvas.width + 100
          if (p.x > canvas.width + 100) p.x = -100
          if (p.y < -100) p.y = canvas.height + 100
          if (p.y > canvas.height + 100) p.y = -100
        }
        for (let i = 0; i < c.pts.length; i++) {
          for (let j = i + 1; j < c.pts.length; j++) {
            ctx.beginPath()
            ctx.moveTo(c.pts[i].x, c.pts[i].y)
            ctx.lineTo(c.pts[j].x, c.pts[j].y)
            ctx.strokeStyle = `rgba(${constColor}, ${tint ? 0.07 : 0.03})`
            ctx.stroke()
          }
        }
        for (const p of c.pts) {
          ctx.beginPath()
          ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${constColor}, ${tint ? 0.14 : 0.06})`
          ctx.fill()
        }
      }

      raf = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [enabled, reducedMotion, developerMode])

  if (!enabled) return null

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 pointer-events-none"
    />
  )
}
