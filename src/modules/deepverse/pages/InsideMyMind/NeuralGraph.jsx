import { useCallback, useRef, useState, useEffect, memo } from 'react'
import { MODULES, CONNECTIONS, getConnectedIds } from './nodes.config'
import useBrainStore, { DEBUG_EASTER_EGGS } from './store'

const NR = 28
const GW = 1500
const GH = 1125
const HOME_ZOOM = 0.7
const MIN_ZOOM = 0.25
const MAX_ZOOM = 4
const MAX_STRETCH = 15
const CONNECTED_PULL = 0.15
const SECONDARY_PULL = 0.05
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

const CURIOSITY_POS = { x: 0.5, y: 0.9 }
const WHISPER_NODE = 'ai'
const CONSTELLATION_ORDER = ['learning', 'problem-solving', 'architecture', 'ai', 'performance']

const connectedCache = {}
for (const m of MODULES) {
  connectedCache[m.id] = getConnectedIds(m.id)
}

function getNodePos(m, offsets) {
  const base = { x: m.x * GW, y: m.y * GH }
  const off = offsets?.[m.id]
  return {
    x: base.x + (off?.dx || 0),
    y: base.y + (off?.dy || 0),
  }
}

function edgePath(a, b) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const dist = Math.hypot(dx, dy) || 1
  const bend = dist * 0.2
  const nx = -dy / dist * bend
  const ny = dx / dist * bend
  return {
    d: `M${a.x},${a.y} C${a.x + nx},${a.y + ny} ${b.x + nx},${b.y + ny} ${b.x},${b.y}`,
  }
}

const Connection = memo(function Connection({ from, to, hoveredId, activeId, reducedMotion, offsets, developerMode }) {
  const a = getNodePos(from, offsets)
  const b = getNodePos(to, offsets)
  const { d } = edgePath(a, b)

  const connectedHover = hoveredId && (hoveredId === from.id || hoveredId === to.id)
  const connectedActive = activeId && (activeId === from.id || activeId === to.id)
  const highlighted = connectedHover || connectedActive

  const speed = developerMode ? 0.55 : 1
  const baseOpacity = (highlighted ? 0.25 : 0.04) + (developerMode ? 0.03 : 0)
  const glowOpacity = (highlighted ? 0.12 : 0) + (developerMode ? 0.05 : 0)
  const strokeW = highlighted ? 1.5 : 0.5
  const pulseColor = developerMode ? '#a855f7' : '#6d5cfc'

  return (
    <g>
      <path d={d} fill="none" stroke={`rgba(109, 92, 252, ${glowOpacity})`} strokeWidth={4} style={{ transition: 'stroke 0.3s ease, stroke-width 0.3s ease' }} />
      <path d={d} fill="none" stroke={`rgba(255,255,255,${baseOpacity})`} strokeWidth={strokeW} style={{ transition: 'stroke 0.3s ease, stroke-width 0.3s ease' }} />
      {!reducedMotion && highlighted && (
        <circle r={2} fill={pulseColor} opacity={0.5}>
          <animateMotion dur={`${(3 + Math.random() * 2) * speed}s`} repeatCount="indefinite" path={d} />
        </circle>
      )}
      {!reducedMotion && (
        <circle r={1.5} fill={pulseColor} opacity={developerMode ? 0.3 : 0.15}>
          <animateMotion dur={`${(4 + Math.random() * 3) * speed}s`} repeatCount="indefinite" begin={`${Math.random() * 4}s`} path={d} />
        </circle>
      )}
    </g>
  )
})

const nodeBreath = MODULES.map(() => {
  const scaleAmp = 0.025 + Math.random() * 0.01
  const driftR = 2 + Math.random() * 2
  return {
    scaleDur: 3 + Math.random() * 2,
    scaleDelay: Math.random() * 3,
    driftDur: 4 + Math.random() * 3,
    driftDelay: Math.random() * 4,
    scaleValues: `1 1; ${1 + scaleAmp} ${1 + scaleAmp}; 1 1`,
    driftValues: `0 0; ${driftR} ${driftR}; 0 0; ${-driftR} ${-driftR}; 0 0`,
  }
})

const GraphNode = memo(function GraphNode({
  module, activeId, hoveredId, onSelect, onHover, onHoldStart, onHoldMove, onHoldEnd,
  offset, reducedMotion, zoomRef, developerMode,
}) {
  const [isHovered, setIsHovered] = useState(false)
  const gestureRef = useRef({ active: false, moved: false, start: { x: 0, y: 0 } })
  const isActive = activeId === module.id
  const connectedHover = hoveredId && connectedCache[module.id]?.has(hoveredId)
  const dimmed = hoveredId && hoveredId !== module.id && !connectedHover
  const breath = nodeBreath[MODULES.indexOf(module)]

  const handlePointerDown = useCallback((e) => {
    e.stopPropagation()
    if (e.button !== 0) return
    const z = zoomRef.current
    gestureRef.current = { active: true, moved: false, start: { x: e.clientX, y: e.clientY } }
    onHoldStart?.(module.id)

    const handleMove = (ev) => {
      if (!gestureRef.current.active) return
      const dx = (ev.clientX - gestureRef.current.start.x) / z
      const dy = (ev.clientY - gestureRef.current.start.y) / z
      const dist = Math.hypot(dx, dy)
      if (dist > 4) gestureRef.current.moved = true
      const mag = Math.min(dist, MAX_STRETCH)
      const k = dist > 0 ? mag / dist : 0
      onHoldMove?.(module.id, dx * k, dy * k)
    }
    const handleUp = () => {
      if (gestureRef.current.active) {
        gestureRef.current.active = false
        onHoldEnd?.(module.id)
        window.removeEventListener('pointermove', handleMove)
        window.removeEventListener('pointerup', handleUp)
      }
    }
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
  }, [module.id, zoomRef, onHoldStart, onHoldMove, onHoldEnd])

  const base = { x: module.x * GW, y: module.y * GH }
  const posX = base.x + (offset?.dx || 0)
  const posY = base.y + (offset?.dy || 0)

  const s = isActive ? NR + 8 : isHovered ? NR + 5 : NR
  const fillA = (isActive ? 0.18 : isHovered ? 0.1 : connectedHover ? 0.06 : 0.02) + (developerMode ? 0.04 : 0)
  const strokeC = isActive ? '#6d5cfc' : isHovered ? '#6d5cfcaa' : connectedHover ? '#6d5cfc66' : 'rgba(255,255,255,0.06)'
  const strokeW = isActive ? 2 : isHovered ? 1.5 : 0.5
  const iconSize = isActive || isHovered ? 17 : 13
  const iconFill = isActive ? '#e4e4e7' : isHovered ? '#d4d4d8' : connectedHover ? '#a1a1aa' : '#71717a'
  const labelFill = isActive ? '#e4e4e7' : isHovered ? '#a1a1aa' : connectedHover ? '#71717a' : '#52525b'
  const labelSize = isActive || isHovered ? 11 : 10

  const visuals = (
    <>
      <circle cx={0} cy={0} r={s + 16} fill={`url(#glow-${module.id})`} filter={`url(#blur-${module.id})`} style={{ transition: 'r 0.4s ease, fill 0.3s ease' }} />
      <circle cx={0} cy={0} r={s} fill={`rgba(255,255,255,${fillA})`} stroke={strokeC} strokeWidth={strokeW} style={{ transition: 'r 0.35s ease, fill 0.3s ease, stroke 0.3s ease, stroke-width 0.3s ease' }} />
      {reducedMotion ? null : (
        <circle cx={0} cy={0} r={s + 2} fill="none" stroke="#6d5cfc" strokeWidth={0.5} opacity={0.15 + (isHovered ? 0.15 : 0)} style={{ transition: 'opacity 0.3s ease' }}>
          <animate attributeName="r" from={s} to={s + 10} dur={`${2 + Math.random() * 2}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" from={0.15} to={0} dur={`${2 + Math.random() * 2}s`} repeatCount="indefinite" />
        </circle>
      )}
      <text x={0} y={0} textAnchor="middle" dominantBaseline="central" fontSize={iconSize} fill={iconFill} style={{ transition: 'font-size 0.3s ease, fill 0.3s ease', pointerEvents: 'none', userSelect: 'none' }}>{module.icon}</text>
      <text x={0} y={s + 14} textAnchor="middle" dominantBaseline="central" fontSize={labelSize} fontWeight={isActive ? 600 : 500} fill={labelFill} style={{ transition: 'font-size 0.3s ease, fill 0.3s ease', pointerEvents: 'none', userSelect: 'none' }}>{module.label}</text>
    </>
  )

  return (
    <g
      data-node={module.id}
      style={{
        cursor: 'grab',
        opacity: dimmed ? 0.15 : 1,
        transition: 'opacity 0.35s ease',
        pointerEvents: dimmed ? 'none' : 'auto',
      }}
      onPointerDown={handlePointerDown}
      onClick={(e) => {
        e.stopPropagation()
        if (gestureRef.current.moved) return
        onSelect?.(module.id)
      }}
      onMouseEnter={() => { setIsHovered(true); onHover?.(module.id) }}
      onMouseLeave={() => { setIsHovered(false); onHover?.(null) }}
    >
      <defs>
        <radialGradient id={`glow-${module.id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={isActive ? '#6d5cfc' : isHovered ? '#6d5cfc' : '#ffffff'} stopOpacity={isActive ? 0.2 : isHovered ? 0.12 : 0.04} />
          <stop offset="100%" stopColor={isActive ? '#6d5cfc' : '#ffffff'} stopOpacity={0} />
        </radialGradient>
        <filter id={`blur-${module.id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={isHovered ? 6 : 4} />
        </filter>
      </defs>
      <g transform={`translate(${posX} ${posY})`}>
        {reducedMotion ? visuals : (
          <g>
            <animateTransform attributeName="transform" type="translate" values={breath.driftValues} dur={`${breath.driftDur}s`} begin={`${breath.driftDelay}s`} repeatCount="indefinite" additive="sum" />
            <g>
              <animateTransform attributeName="transform" type="scale" values={breath.scaleValues} dur={`${breath.scaleDur}s`} begin={`${breath.scaleDelay}s`} repeatCount="indefinite" additive="sum" />
              {visuals}
            </g>
          </g>
        )}
      </g>
    </g>
  )
})

const CuriosityNode = memo(function CuriosityNode({ onOpen, zoomRef, reducedMotion }) {
  const [hovered, setHovered] = useState(false)
  const gestureRef = useRef({ moved: false })
  const pos = { x: CURIOSITY_POS.x * GW, y: CURIOSITY_POS.y * GH }
  const s = hovered ? NR + 6 : NR

  useEffect(() => {
    if (DEBUG_EASTER_EGGS) console.log('[brainos] Curiosity mounted.')
  }, [])

  const handlePointerDown = useCallback((e) => {
    e.stopPropagation()
    const start = { x: e.clientX, y: e.clientY }
    gestureRef.current = { moved: false }
    const handleMove = (ev) => {
      if (Math.hypot(ev.clientX - start.x, ev.clientY - start.y) > 4) gestureRef.current.moved = true
    }
    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
  }, [])

  return (
    <g
      data-node="curiosity"
      style={{ cursor: 'pointer', animation: 'curiosityFadeIn 2.5s ease forwards' }}
      onPointerDown={handlePointerDown}
      onClick={(e) => { e.stopPropagation(); if (gestureRef.current.moved) return; onOpen() }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <defs>
        <radialGradient id="glow-curiosity" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#d4af37" stopOpacity={hovered ? 0.3 : 0.16} />
          <stop offset="100%" stopColor="#d4af37" stopOpacity={0} />
        </radialGradient>
      </defs>
      <g transform={`translate(${pos.x} ${pos.y})`} style={{ opacity: hovered ? 1 : 0.9, transition: 'opacity 0.3s ease' }}>
        <circle cx={0} cy={0} r={s + 18} fill="url(#glow-curiosity)" />
        <circle cx={0} cy={0} r={s} fill="rgba(212,175,55,0.08)" stroke={hovered ? '#e8c84a' : '#d4af37'} strokeWidth={hovered ? 1.6 : 0.8} style={{ transition: 'r 0.35s ease, stroke 0.3s ease, stroke-width 0.3s ease' }} />
        {reducedMotion ? null : (
          <circle cx={0} cy={0} r={s + 2} fill="none" stroke="#d4af37" strokeWidth={0.4} opacity={0.3}>
            <animate attributeName="r" from={s} to={s + 10} dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" from={0.3} to={0} dur="3s" repeatCount="indefinite" />
          </circle>
        )}
        <text x={0} y={0} textAnchor="middle" dominantBaseline="central" fontSize={hovered ? 17 : 14} fill="#f0d98a" style={{ transition: 'font-size 0.3s ease', pointerEvents: 'none', userSelect: 'none' }}>✦</text>
        <text x={0} y={s + 14} textAnchor="middle" dominantBaseline="central" fontSize={hovered ? 11 : 10} fontWeight={600} fill="#d4af37" style={{ transition: 'font-size 0.3s ease', pointerEvents: 'none', userSelect: 'none' }}>Curiosity</text>
      </g>
    </g>
  )
})

export default function NeuralGraph({ onSelectModule }) {
  const activeModule = useBrainStore((s) => s.activeModule)
  const reducedMotion = useBrainStore((s) => s.reducedMotion)
  const developerMode = useBrainStore((s) => s.developerMode)
  const curiosityVisible = useBrainStore((s) => s.curiosityVisible)
  const constellationAt = useBrainStore((s) => s.constellationAt)
  const openCuriosity = useBrainStore((s) => s.openCuriosity)
  const recordDiscovery = useBrainStore((s) => s.recordDiscovery)
  const notify = useBrainStore((s) => s.notify)
  const [hoveredModule, setHoveredModule] = useState(null)
  const [holdOffsets, setHoldOffsets] = useState({})
  const [whisper, setWhisper] = useState(false)
  const [whisperKey, setWhisperKey] = useState(0)
  const [flicker, setFlicker] = useState(false)
  const [curiosityRevealed, setCuriosityRevealed] = useState(false)

  const containerRef = useRef(null)
  const gRef = useRef(null)
  const sizeRef = useRef({ w: 1200, h: 800 })
  const zoomRef = useRef(HOME_ZOOM)

  const camRef = useRef({ x: 0, y: 0, zoom: HOME_ZOOM })
  const camTargetRef = useRef({ x: 0, y: 0, zoom: HOME_ZOOM })
  const camVelRef = useRef({ x: 0, y: 0 })
  const camModeRef = useRef('idle')
  const springRef = useRef(null)
  const onSpringDoneRef = useRef(null)
  const isTransitioningRef = useRef(false)
  const focusRef = useRef({ x: 0, y: 0 })
  const camDragRef = useRef(null)
  const prevActiveRef = useRef(activeModule)
  const flickeredRef = useRef(false)
  const whisperedRef = useRef(false)
  const curiosityLoggedRef = useRef(false)

  const startSpring = useCallback((tx, ty, tzoom, done) => {
    springRef.current = {
      tx, ty, tzoom,
      vx: camVelRef.current.x, vy: camVelRef.current.y,
      stiffness: 0.11, damping: 0.115,
    }
    camModeRef.current = 'spring'
    onSpringDoneRef.current = done || null
  }, [])

  useEffect(() => {
    function onResize() {
      sizeRef.current = { w: window.innerWidth, h: window.innerHeight }
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (activeModule) {
      prevActiveRef.current = activeModule
      return
    }
    if (prevActiveRef.current && !activeModule) {
      prevActiveRef.current = null
      if (curiosityVisible && !flickeredRef.current) {
        flickeredRef.current = true
        setCuriosityRevealed(true)
        setFlicker(true)
        if (DEBUG_EASTER_EGGS) console.log('[brainos] Graph flicker')
        setTimeout(() => setFlicker(false), 750)
      }
      startSpring(0, 0, HOME_ZOOM, null)
    }
  }, [activeModule, curiosityVisible, startSpring])

  useEffect(() => {
    if (hoveredModule !== WHISPER_NODE) {
      setWhisper(false)
      return
    }
    if (whisperedRef.current) return
    if (DEBUG_EASTER_EGGS) {
      console.log('[brainos] Hover started')
      console.log('[brainos] Hover 10s remaining')
    }
    let remaining = 10
    const interval = setInterval(() => {
      remaining -= 1
      if (DEBUG_EASTER_EGGS) console.log(`[brainos] Hover ${remaining}s remaining`)
    }, 1000)
    const timer = setTimeout(() => {
      clearInterval(interval)
      if (hoveredModule === WHISPER_NODE && !whisperedRef.current) {
        whisperedRef.current = true
        setWhisperKey((k) => k + 1)
        setWhisper(true)
        recordDiscovery('long-hover')
        notify('Still Learning')
        if (DEBUG_EASTER_EGGS) console.log('[brainos] Hover completed')
        setTimeout(() => setWhisper(false), 4500)
      }
    }, 10000)
    return () => {
      clearTimeout(timer)
      clearInterval(interval)
      if (DEBUG_EASTER_EGGS && hoveredModule === WHISPER_NODE) {
        console.log('[brainos] Hover cancelled')
      }
    }
  }, [hoveredModule, recordDiscovery, notify])

  useEffect(() => {
    let raf
    function tick() {
      const cam = camRef.current
      const size = sizeRef.current
      const cx = size.w / 2
      const cy = size.h / 2

      if (camModeRef.current === 'drag') {
        const t = camTargetRef.current
        cam.x += (t.x - cam.x) * 0.4
        cam.y += (t.y - cam.y) * 0.4
        cam.zoom += (t.zoom - cam.zoom) * 0.25
      } else if (camModeRef.current === 'inertia') {
        const v = camVelRef.current
        const t = camTargetRef.current
        cam.x += v.x
        cam.y += v.y
        v.x *= 0.9
        v.y *= 0.9
        cam.x += (t.x - cam.x) * 0.08
        cam.y += (t.y - cam.y) * 0.08
        cam.zoom += (t.zoom - cam.zoom) * 0.12
        if (Math.abs(v.x) < 0.01 && Math.abs(v.y) < 0.01 &&
            Math.abs(t.x - cam.x) < 0.05 && Math.abs(t.y - cam.y) < 0.05 &&
            Math.abs(t.zoom - cam.zoom) < 0.001) {
          camModeRef.current = 'idle'
        }
      } else if (camModeRef.current === 'spring') {
        const sp = springRef.current
        if (sp) {
          const ax = (sp.tx - cam.x) * sp.stiffness
          const ay = (sp.ty - cam.y) * sp.stiffness
          sp.vx += ax
          sp.vy += ay
          sp.vx *= (1 - sp.damping)
          sp.vy *= (1 - sp.damping)
          cam.x += sp.vx
          cam.y += sp.vy
          cam.zoom += (sp.tzoom - cam.zoom) * 0.07
          if (Math.abs(sp.tx - cam.x) < 0.3 && Math.abs(sp.ty - cam.y) < 0.3 &&
              Math.abs(sp.tzoom - cam.zoom) < 0.005 && Math.abs(sp.vx) < 0.04 && Math.abs(sp.vy) < 0.04) {
            cam.x = sp.tx
            cam.y = sp.ty
            cam.zoom = sp.tzoom
            camModeRef.current = 'idle'
            if (onSpringDoneRef.current) {
              const done = onSpringDoneRef.current
              onSpringDoneRef.current = null
              done()
            }
          }
        }
      }

      zoomRef.current = cam.zoom
      const f = focusRef.current
      if (gRef.current) {
        gRef.current.setAttribute(
          'transform',
          `translate(${cx + f.x} ${cy + f.y}) scale(${cam.zoom}) translate(${-GW / 2 + cam.x} ${-GH / 2 + cam.y})`
        )
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const cam = camRef.current
    const mx = e.clientX - rect.left - rect.width / 2
    const my = e.clientY - rect.top - rect.height / 2
    const factor = e.deltaY > 0 ? 1 / 1.1 : 1.1
    const nz = clamp(cam.zoom * factor, MIN_ZOOM, MAX_ZOOM)
    const wx = mx / cam.zoom
    const wy = my / cam.zoom
    camTargetRef.current = {
      x: cam.x + wx - mx / nz,
      y: cam.y + wy - my / nz,
      zoom: nz,
    }
    if (camModeRef.current !== 'drag') camModeRef.current = 'inertia'
  }, [])

  const handlePointerDown = useCallback((e) => {
    if (e.button !== 0) return
    if (e.target.closest('[data-node]')) return
    camDragRef.current = {
      startX: e.clientX, startY: e.clientY,
      camX: camRef.current.x, camY: camRef.current.y,
      lastX: e.clientX, lastY: e.clientY, lastT: Date.now(),
    }
    camVelRef.current = { x: 0, y: 0 }
    camModeRef.current = 'drag'
  }, [])

  const handlePointerMove = useCallback((e) => {
    if (camModeRef.current !== 'drag' || !camDragRef.current) return
    const d = camDragRef.current
    const z = camRef.current.zoom
    camTargetRef.current = {
      x: d.camX + (e.clientX - d.startX) / z,
      y: d.camY + (e.clientY - d.startY) / z,
      zoom: camRef.current.zoom,
    }
    const now = Date.now()
    const dt = Math.max(16, now - d.lastT)
    camVelRef.current = {
      x: ((e.clientX - d.lastX) / z) * (16 / dt) * 0.7,
      y: ((e.clientY - d.lastY) / z) * (16 / dt) * 0.7,
    }
    d.lastX = e.clientX
    d.lastY = e.clientY
    d.lastT = now
  }, [])

  const handlePointerUp = useCallback(() => {
    if (camModeRef.current === 'drag') camModeRef.current = 'inertia'
    camDragRef.current = null
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [handlePointerMove, handlePointerUp])

  const computeInfluenced = useCallback((id, dx, dy) => {
    const result = {}
    result[id] = { dx, dy }
    for (const cid of connectedCache[id] || []) {
      if (!result[cid]) result[cid] = { dx: dx * CONNECTED_PULL, dy: dy * CONNECTED_PULL }
      for (const cid2 of connectedCache[cid] || []) {
        if (cid2 !== id && !result[cid2]) {
          result[cid2] = { dx: dx * SECONDARY_PULL, dy: dy * SECONDARY_PULL }
        }
      }
    }
    return result
  }, [])

  const handleHoldStart = useCallback((id) => {
    setHoldOffsets((prev) => ({ ...prev, [id]: { dx: 0, dy: 0 } }))
  }, [])

  const handleHoldMove = useCallback((id, dx, dy) => {
    setHoldOffsets(computeInfluenced(id, dx, dy))
  }, [computeInfluenced])

  const handleHoldEnd = useCallback(() => {
    setHoldOffsets((current) => {
      if (Object.keys(current).length === 0) return current
      const start = { ...current }
      const dur = 350
      const t0 = performance.now()
      let raf
      function tick() {
        const t = Math.min(1, (performance.now() - t0) / dur)
        const e = 1 - Math.pow(1 - t, 3)
        const next = {}
        for (const key of Object.keys(start)) {
          const o = start[key]
          next[key] = { dx: o.dx * (1 - e), dy: o.dy * (1 - e) }
        }
        setHoldOffsets(next)
        if (t < 1) raf = requestAnimationFrame(tick)
        else setHoldOffsets({})
      }
      raf = requestAnimationFrame(tick)
      return current
    })
  }, [])

  const handleSelect = useCallback((id) => {
    if (isTransitioningRef.current) return
    isTransitioningRef.current = true
    const node = MODULES.find((m) => m.id === id)
    if (!node) return
    const tx = -(node.x * GW - GW / 2)
    const ty = -(node.y * GH - GH / 2)
    startSpring(tx, ty, 1.5, () => {
      isTransitioningRef.current = false
      onSelectModule?.(id)
    })
  }, [startSpring, onSelectModule])

  const handleHover = useCallback((id) => {
    setHoveredModule(id)
    if (!id) {
      focusRef.current = { x: 0, y: 0 }
      return
    }
    const node = MODULES.find((m) => m.id === id)
    if (!node) return
    focusRef.current = {
      x: (node.x * GW - GW / 2) * 0.015,
      y: (node.y * GH - GH / 2) * 0.015,
    }
  }, [])

  const handleDoubleClick = useCallback(() => {
    startSpring(0, 0, HOME_ZOOM, null)
  }, [startSpring])

  const constellationNodes = CONSTELLATION_ORDER.map((id) => MODULES.find((m) => m.id === id)).filter(Boolean)
  const whisperNode = MODULES.find((m) => m.id === WHISPER_NODE)

  if (curiosityVisible && curiosityRevealed && !curiosityLoggedRef.current) {
    curiosityLoggedRef.current = true
    if (DEBUG_EASTER_EGGS) console.log('[brainos] Rendering Curiosity node...')
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden select-none touch-none"
      style={flicker ? { animation: 'brainFlicker 0.7s ease' } : undefined}
      onPointerDown={handlePointerDown}
      onDoubleClick={handleDoubleClick}
      onMouseLeave={() => handleHover(null)}
      onTouchEnd={() => handleHover(null)}
    >
      <style>{`@keyframes brainFlicker { 0%{opacity:1} 15%{opacity:0.25} 35%{opacity:0.85} 55%{opacity:0.35} 75%{opacity:0.9} 100%{opacity:1} } @keyframes curiosityFadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
      <svg width="100%" height="100%" style={{ display: 'block' }}>
        <g ref={gRef}>
          {CONNECTIONS.map(([fromId, toId]) => {
            const from = MODULES.find((m) => m.id === fromId)
            const to = MODULES.find((m) => m.id === toId)
            if (!from || !to) return null
            return (
              <Connection
                key={`${fromId}-${toId}`}
                from={from}
                to={to}
                hoveredId={hoveredModule}
                activeId={activeModule}
                reducedMotion={reducedMotion}
                offsets={holdOffsets}
                developerMode={developerMode}
              />
            )
          })}
          {MODULES.map((m) => (
            <GraphNode
              key={m.id}
              module={m}
              activeId={activeModule}
              hoveredId={hoveredModule}
              onSelect={handleSelect}
              onHover={handleHover}
              onHoldStart={handleHoldStart}
              onHoldMove={handleHoldMove}
              onHoldEnd={handleHoldEnd}
              offset={holdOffsets[m.id]}
              reducedMotion={reducedMotion}
              zoomRef={zoomRef}
              developerMode={developerMode}
            />
          ))}
          {curiosityVisible && curiosityRevealed && (
            <CuriosityNode onOpen={openCuriosity} zoomRef={zoomRef} reducedMotion={reducedMotion} />
          )}
          {constellationAt > 0 && (
            <g key={`constellation-${constellationAt}`} style={{ pointerEvents: 'none' }}>
              <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.25;0.85;1" dur="5.2s" fill="freeze" />
              {constellationNodes.slice(0, -1).map((m, i) => {
                const a = getNodePos(m, holdOffsets)
                const b = getNodePos(constellationNodes[i + 1], holdOffsets)
                const len = Math.hypot(b.x - a.x, b.y - a.y) || 1
                return (
                  <g key={`cl-${i}`}>
                    <line
                      x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                      stroke="rgba(212,175,55,0.22)"
                      strokeWidth={4}
                      strokeLinecap="round"
                      style={{ filter: 'blur(1px)' }}
                    />
                    <line
                      x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                      stroke="rgba(240,217,138,0.9)"
                      strokeWidth={1.2}
                      strokeLinecap="round"
                      strokeDasharray={len}
                      strokeDashoffset={len}
                    >
                      <animate attributeName="stroke-dashoffset" from={len} to={0} dur="0.9s" begin={`${i * 0.2}s`} fill="freeze" />
                    </line>
                  </g>
                )
              })}
              {constellationNodes.map((m, i) => {
                const p = getNodePos(m, holdOffsets)
                return (
                  <g key={`cs-${m.id}`}>
                    <circle cx={p.x} cy={p.y} r={7} fill="rgba(212,175,55,0.12)" style={{ filter: 'blur(2px)' }} />
                    <circle cx={p.x} cy={p.y} r={3} fill="rgba(240,217,138,0.95)">
                      <animate attributeName="r" values="3;5.5;3" keyTimes="0;0.5;1" dur="1.1s" begin={`${1.4 + i * 0.12}s`} fill="freeze" />
                    </circle>
                  </g>
                )
              })}
            </g>
          )}
          {whisper && whisperNode && (
            <g key={`whisper-${whisperKey}`} style={{ pointerEvents: 'none' }}>
              <text x={getNodePos(whisperNode, holdOffsets).x + 70} y={getNodePos(whisperNode, holdOffsets).y - 44} textAnchor="start" fontSize={13} fontStyle="italic" fill="rgba(212,175,55,0.85)" fontFamily="Georgia, serif">
                Still learning...
                <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.2;0.7;1" dur="4.2s" fill="freeze" />
              </text>
            </g>
          )}
        </g>
      </svg>
    </div>
  )
}
