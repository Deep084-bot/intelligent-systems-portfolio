import { useEffect, useRef } from 'react'
import { usePetStore } from './store'
import { getProfile, PET_STATES } from './petState'

const MAX_PARTICLES = 90
const MAX_PARTICLES_REDUCED = 12

// Flowing digital trail + reaction burst.
// Runs on a single rAF loop and reads pet state imperatively from the store, so
// particle motion never triggers a React render.
export default function PetParticles({ reduced }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0
    let h = 0
    let cx = 0
    let cy = 0
    let raf = null
    let last = 0
    let emitAcc = 0
    let rate = 1
    let glow = 0.5
    let lastBurstId = usePetStore.getState().burstId

    const particles = []

    const cap = () => (reduced ? MAX_PARTICLES_REDUCED : MAX_PARTICLES)

    function resize() {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = rect.width
      h = rect.height
      canvas.width = Math.max(1, Math.round(w * dpr))
      canvas.height = Math.max(1, Math.round(h * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      cx = w / 2
      cy = h * 0.56
    }

    function spawnAmbient() {
      if (particles.length >= cap()) return
      const spread = w * 0.035
      particles.push({
        x: cx + (Math.random() - 0.5) * spread,
        y: cy + (Math.random() - 0.5) * spread * 0.7,
        vx: -(6 + Math.random() * 12) * rate,
        vy: -(4 + Math.random() * 11) * rate,
        life: 0,
        max: 1.1 + Math.random() * 1.3,
        size: 0.8 + Math.random() * 1.5,
        warm: Math.random() > 0.62,
      })
    }

    function spawnBurst() {
      const n = reduced ? 3 : 12
      for (let i = 0; i < n; i++) {
        if (particles.length >= cap()) break
        const a = (Math.PI * 2 * i) / n + Math.random() * 0.5
        const sp = 38 + Math.random() * 52
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 8,
          life: 0,
          max: 0.5 + Math.random() * 0.45,
          size: 1 + Math.random() * 1.7,
          warm: Math.random() > 0.5,
          spark: true,
        })
      }
    }

    function draw(time) {
      const dt = last ? Math.min(0.05, (time - last) / 1000) : 0.016
      last = time

      // ease rendered intensity toward the active state's profile
      const st = usePetStore.getState()
      const p = getProfile(st.state)
      const targetRate = reduced ? 0.35 : p.trailRate
      rate += (targetRate - rate) * Math.min(1, dt * 3.2)
      glow += (p.glow - glow) * Math.min(1, dt * 3.2)

      if (st.burstId !== lastBurstId) {
        lastBurstId = st.burstId
        spawnBurst()
      }

      emitAcc += dt * (reduced ? 1.6 : 5.2 * rate)
      while (emitAcc >= 1) {
        emitAcc -= 1
        spawnAmbient()
      }

      ctx.clearRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'lighter'

      for (let i = particles.length - 1; i >= 0; i--) {
        const q = particles[i]
        q.life += dt
        if (q.life >= q.max) {
          particles.splice(i, 1)
          continue
        }

        const t = q.life / q.max
        if (q.spark) {
          // bursts decelerate, ambient trails keep drifting
          const damp = 1 - t * 0.72
          q.x += q.vx * dt * damp
          q.y += q.vy * dt * damp
        } else {
          q.x += q.vx * dt
          q.y += q.vy * dt
          q.vy -= 2.2 * dt // gentle lift
        }

        const alpha = (1 - t) * (0.16 + glow * 0.5) * (q.spark ? 1.5 : 1)
        if (alpha <= 0.01) continue

        const size = q.size * (q.spark ? 1 - t * 0.45 : 1)
        ctx.fillStyle = q.warm
          ? `rgba(167,139,250,${alpha})`
          : `rgba(103,232,249,${alpha})`
        ctx.beginPath()
        ctx.arc(q.x, q.y, Math.max(0.2, size), 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.globalCompositeOperation = 'source-over'
      raf = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [reduced])

  // sleepy worlds breathe a little slower regardless of profile
  return <canvas ref={canvasRef} className="deeppet-trail" aria-hidden="true" />
}