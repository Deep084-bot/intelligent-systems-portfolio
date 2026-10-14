import { memo, useState, useMemo } from 'react'
import { EdgeLabelRenderer } from 'reactflow'
import { PROTOCOL_COLORS } from './store'

const EDGE_OFFSET = 40
const PARALLEL_SHIFT = 14
const ARROW_SIZE = 10

const EDGE_STYLES = {
  HTTP: { dash: 'none', label: 'API' },
  gRPC: { dash: 'none', label: 'gRPC' },
  TCP: { dash: 'none', label: 'TCP' },
  ASYNC: { dash: '4 4', label: 'Async' },
  DB: { dash: '2 3', label: 'DB' },
}

function getControlOffset(sx, sy, tx, ty, sourcePos, targetPos) {
  const dx = tx - sx
  const dy = ty - sy
  const dist = Math.sqrt(dx * dx + dy * dy)
  const base = Math.max(EDGE_OFFSET, dist * 0.4)
  if (sourcePos === 'right' || sourcePos === 'left') return base + Math.abs(dx) * 0.3
  return base + Math.abs(dy) * 0.3
}

function buildPath(sx, sy, tx, ty, sp, tp) {
  const srcOf = getControlOffset(sx, sy, tx, ty, sp, tp)
  const tgtOf = getControlOffset(tx, ty, sx, sy, tp, sp)

  let c1x, c1y, c2x, c2y
  if (sp === 'right') { c1x = sx + srcOf; c1y = sy }
  else if (sp === 'left') { c1x = sx - srcOf; c1y = sy }
  else if (sp === 'bottom') { c1x = sx; c1y = sy + srcOf }
  else { c1x = sx; c1y = sy - srcOf }

  if (tp === 'right') { c2x = tx + tgtOf; c2y = ty }
  else if (tp === 'left') { c2x = tx - tgtOf; c2y = ty }
  else if (tp === 'bottom') { c2x = tx; c2y = ty + tgtOf }
  else { c2x = tx; c2y = ty - tgtOf }

  return `M${sx},${sy} C${c1x},${c1y} ${c2x},${c2y} ${tx},${ty}`
}

function arrowPoints(tx, ty, angle) {
  const a = ARROW_SIZE
  return {
    p1x: tx - a * Math.cos(angle - Math.PI / 6),
    p1y: ty - a * Math.sin(angle - Math.PI / 6),
    p2x: tx - a * Math.cos(angle + Math.PI / 6),
    p2y: ty - a * Math.sin(angle + Math.PI / 6),
  }
}

function estimateEndpointAngle(sx, sy, tx, ty, sp, tp) {
  const srcOf = getControlOffset(sx, sy, tx, ty, sp, tp)
  const tgtOf = getControlOffset(tx, ty, sx, sy, tp, sp)

  let c1x, c1y, c2x, c2y
  if (sp === 'right') { c1x = sx + srcOf; c1y = sy }
  else if (sp === 'left') { c1x = sx - srcOf; c1y = sy }
  else if (sp === 'bottom') { c1x = sx; c1y = sy + srcOf }
  else { c1x = sx; c1y = sy - srcOf }

  if (tp === 'right') { c2x = tx + tgtOf; c2y = ty }
  else if (tp === 'left') { c2x = tx - tgtOf; c2y = ty }
  else if (tp === 'bottom') { c2x = tx; c2y = ty + tgtOf }
  else { c2x = tx; c2y = ty - tgtOf }

  const dt = 0.01
  const t = 1 - dt
  const mt = 1 - t
  const x = mt * mt * mt * sx + 3 * mt * mt * t * c1x + 3 * mt * t * t * c2x + t * t * t * tx
  const px = mt * mt * mt * sx + 3 * mt * mt * (t + dt) * c1x + 3 * mt * (t + dt) * (t + dt) * c2x + (t + dt) * (t + dt) * (t + dt) * tx
  const y = mt * mt * mt * sy + 3 * mt * mt * t * c1y + 3 * mt * t * t * c2y + t * t * t * ty
  const py = mt * mt * mt * sy + 3 * mt * mt * (t + dt) * c1y + 3 * mt * (t + dt) * (t + dt) * c2y + (t + dt) * (t + dt) * (t + dt) * ty
  return Math.atan2(py - y, px - x)
}

function ProtocolEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}) {
  const [hovered, setHovered] = useState(false)
  const isActive = selected || hovered

  const proto = data?.protocol || 'HTTP'
  const color = PROTOCOL_COLORS[proto] || PROTOCOL_COLORS.HTTP
  const style = EDGE_STYLES[proto] || EDGE_STYLES.HTTP
  const sp = sourcePosition || 'right'
  const tp = targetPosition || 'left'
  const parallelIdx = data?.parallelIndex || 0
  const animated = data?.animated || false

  const yShift = parallelIdx * PARALLEL_SHIFT - (parallelIdx > 0 ? PARALLEL_SHIFT / 2 : 0)

  const edgePath = useMemo(() =>
    buildPath(sourceX, sourceY + yShift, targetX, targetY - yShift, sp, tp),
    [sourceX, sourceY, targetX, targetY, sp, tp, yShift]
  )

  const angle = useMemo(() =>
    estimateEndpointAngle(sourceX, sourceY + yShift, targetX, targetY - yShift, sp, tp),
    [sourceX, sourceY, targetX, targetY, sp, tp, yShift]
  )

  const arrow = useMemo(() =>
    arrowPoints(targetX, targetY - yShift, angle),
    [targetX, targetY, yShift, angle]
  )

  const midX = (sourceX + targetX) / 2
  const midY = (sourceY + targetY) / 2
  const labelVisible = data?.label || isActive

  return (
    <>
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={24}
        className="cursor-pointer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
      {isActive && (
        <path
          d={edgePath}
          fill="none"
          stroke={color}
          strokeWidth={9}
          opacity={0.08}
          pointerEvents="none"
        />
      )}
      {isActive && (
        <path
          d={edgePath}
          fill="none"
          stroke={color}
          strokeWidth={13}
          opacity={0.05}
          pointerEvents="none"
          style={{ filter: 'blur(6px)' }}
        />
      )}
      <path
        d={edgePath}
        fill="none"
        stroke={isActive ? color : `${color}aa`}
        strokeWidth={isActive ? 2.5 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={style.dash === 'none' ? undefined : style.dash}
        className={animated ? 'edge-flow' : undefined}
        style={{
          transition: 'stroke-width 0.15s, stroke 0.15s',
          cursor: 'pointer',
        }}
      />
      {isActive && (
        <path
          d={edgePath}
          fill="none"
          stroke={`url(#edgeGradient-${id})`}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.6}
          pointerEvents="none"
        />
      )}
      {selected && (
        <path
          d={edgePath}
          fill="none"
          stroke={color}
          strokeWidth={5}
          opacity={0.25}
          pointerEvents="none"
          style={{ filter: 'blur(6px)' }}
        />
      )}
      <path
        d={`M${arrow.p1x},${arrow.p1y} L${targetX},${targetY - yShift} L${arrow.p2x},${arrow.p2y} Z`}
        fill={color}
        opacity={isActive ? 1 : 0.8}
        pointerEvents="none"
        style={{ transition: 'opacity 0.15s' }}
      />
      {labelVisible && (
        <EdgeLabelRenderer>
          <div
            className="absolute px-2 py-1 rounded-lg text-[11px] font-medium pointer-events-none whitespace-nowrap"
            style={{
              transform: `translate(-50%, -50%) translate(${midX}px, ${midY}px)`,
              background: isActive ? 'rgba(18,18,20,0.95)' : 'rgba(18,18,20,0.8)',
              border: `1px solid ${color}33`,
              color: isActive ? '#e4e4e7' : '#71717a',
              backdropFilter: 'blur(8px)',
              transition: 'color 0.15s, background 0.15s',
            }}
          >
            {data?.label || style.label}
          </div>
        </EdgeLabelRenderer>
      )}
      <defs>
        <linearGradient id={`edgeGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="50%" stopColor={color} stopOpacity="0.8" />
          <stop offset="100%" stopColor={color} stopOpacity="0.15" />
        </linearGradient>
      </defs>
    </>
  )
}

export default memo(ProtocolEdge)
