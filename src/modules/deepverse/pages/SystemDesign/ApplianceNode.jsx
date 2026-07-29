import { memo, useState, useRef, useEffect, useMemo } from 'react'
import { Handle, Position } from 'reactflow'
import useStore from './store'
import { findItem } from './data'

const NODE_W = 164
const PORT_HIT = 18
const PORT_GAP = 22

const G = PORT_GAP / 2

const POS_MAP = {
  top: Position.Top,
  bottom: Position.Bottom,
  left: Position.Left,
  right: Position.Right,
}

function handleTransform(side, type) {
  const offset = type === 'source' ? -G : G
  if (side === 'left' || side === 'right') {
    return `translate(-50%, calc(-50% + ${offset}px))`
  }
  return `translate(calc(-50% + ${offset}px), -50%)`
}

const CAT_COLORS = {
  networking: '#3b82f6',
  compute: '#22c55e',
  storage: '#a855f7',
  messaging: '#f97316',
  cache: '#ef4444',
  monitoring: '#06b6d4',
  applications: '#ec4899',
  auth: '#f59e0b',
  infrastructure: '#64748b',
  ai: '#8b5cf6',
  cloud: '#38bdf8',
}

function getCategoryColor(componentId) {
  const found = findItem(componentId)
  if (found) return CAT_COLORS[found.category.id] || '#6d5cfc'
  return '#6d5cfc'
}

function Badge({ label, color }) {
  return (
    <span
      className="rounded-full font-mono font-medium"
      style={{
        fontSize: 8,
        lineHeight: '14px',
        padding: '0 5px',
        background: `${color}18`,
        color,
      }}
    >
      {label}
    </span>
  )
}

function ApplianceNode({ id, data, selected }) {
  const [hovered, setHovered] = useState(false)
  const ledRef = useRef(null)
  const setSelectedNode = useStore((s) => s.setSelectedNode)
  const validationResult = useStore((s) => s.validationResult)

  const catColor = useMemo(() => getCategoryColor(data.componentId), [data.componentId])

  const badge = useMemo(() => {
    if (!validationResult) return null
    const hasError = validationResult.errors?.some((x) => x.nodeId === id)
    const hasWarning = validationResult.warnings?.some((x) => x.nodeId === id)
    if (hasError) return { color: '#ef4444', label: 'Has errors' }
    if (hasWarning) return { color: '#f97316', label: 'Has warnings' }
    const hasGood = validationResult.good?.some((x) => x.nodeId === id)
    if (hasGood) return { color: '#22c55e', label: 'Healthy' }
    return null
  }, [validationResult, id])

  const hasCpu = data.cpu
  const hasMem = data.memory
  const hasReplicas = data.replicas
  const hasBadges = hasCpu || hasMem || hasReplicas

  useEffect(() => {
    if (!selected || !ledRef.current) return
    let frame
    const pulse = () => {
      if (!ledRef.current) return
      ledRef.current.style.opacity = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(Date.now() * 0.003))
      frame = requestAnimationFrame(pulse)
    }
    frame = requestAnimationFrame(pulse)
    return () => cancelAnimationFrame(frame)
  }, [selected])

  return (
    <div
      className="relative"
      style={{ width: NODE_W }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false)
      }}
      onDoubleClick={() => setSelectedNode(id)}
    >
      <motionWrapper selected={selected} hovered={hovered} catColor={catColor}>
        {badge && (
          <div
            className="absolute top-1.5 right-1.5 rounded-full"
            style={{
              width: 6,
              height: 6,
              background: badge.color,
              boxShadow: `0 0 6px ${badge.color}66`,
              zIndex: 5,
            }}
            title={badge.label}
          />
        )}
        <div
          style={{
            height: 3,
            background: selected
              ? `linear-gradient(90deg, ${catColor}, ${catColor}88)`
              : hovered
              ? `linear-gradient(90deg, ${catColor}66, transparent)`
              : 'rgba(255,255,255,0.03)',
            transition: 'background 0.25s',
          }}
        />
        <div className="px-3 py-2.5">
          <div className="flex items-center gap-2 mb-1">
            <span
              ref={ledRef}
              className="w-[6px] h-[6px] rounded-full flex-shrink-0"
              style={{
                background: selected ? catColor : '#22c55e',
                boxShadow: selected
                  ? `0 0 6px ${catColor}66`
                  : '0 0 4px rgba(34,197,94,0.3)',
                transition: 'background 0.3s, box-shadow 0.3s',
              }}
            />
            <span className="text-sm leading-none text-neutral-500">{data.icon || '○'}</span>
            <span className="text-[13px] font-bold text-neutral-100 leading-none truncate">
              {data.name || data.componentId}
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 leading-snug mb-1.5 line-clamp-2">
            {data.description || ''}
          </p>
          {hasBadges ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              {hasCpu && <Badge label={`CPU:${data.cpu}`} color={catColor} />}
              {hasMem && <Badge label={`RAM:${data.memory}`} color={catColor} />}
              {hasReplicas && <Badge label={`${data.replicas} pod`} color={catColor} />}
            </div>
          ) : (
            <div className="flex items-center gap-1.5" style={{ opacity: hovered ? 0.5 : 0.2 }}>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-full"
                  style={{
                    width: 4,
                    height: 4,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </motionWrapper>
      {['top', 'bottom', 'left', 'right'].flatMap((side) =>
        ['source', 'target'].map((type) => {
          const handleId = `${id}-${side}-${type}`
          return (
            <Handle
              key={handleId}
              type={type}
              position={POS_MAP[side]}
              id={handleId}
              isConnectable
              className="custom-handle"
              style={{
                width: PORT_HIT,
                height: PORT_HIT,
                background: 'transparent',
                border: 'none',
                zIndex: type === 'source' ? 11 : 9,
                cursor: 'crosshair',
                transform: handleTransform(side, type),
              }}
            />
          )
        })
      )}
    </div>
  )
}

const nodeBoxShadow = (sel, hovered, color) => {
  if (sel) return `0 0 0 1px ${color}22, 0 0 20px ${color}15, 0 8px 32px rgba(0,0,0,0.45)`
  if (hovered) return `0 0 12px ${color}0a, 0 4px 20px rgba(0,0,0,0.3)`
  return '0 2px 12px rgba(0,0,0,0.2)'
}

function motionWrapper({ children, selected, hovered, catColor }) {
  return (
    <div
      className="relative rounded-xl overflow-hidden select-none node-appear"
      style={{
        width: NODE_W,
        background: 'linear-gradient(180deg, rgba(20,20,24,0.98), rgba(16,16,20,0.98))',
        border: `1px solid ${
          selected
            ? `${catColor}88`
            : hovered
            ? `${catColor}55`
            : 'rgba(255,255,255,0.06)'
        }`,
        boxShadow: nodeBoxShadow(selected, hovered, catColor),
        transform: hovered && !selected ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'border-color 0.2s, box-shadow 0.25s, transform 0.2s ease-out',
      }}
    >
      {children}
    </div>
  )
}

export default memo(ApplianceNode)
