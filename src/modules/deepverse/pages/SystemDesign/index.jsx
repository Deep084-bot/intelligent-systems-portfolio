import {
  useState, useRef, useCallback, useMemo, useEffect,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactFlow, {
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  SelectionMode,
  NodeToolbar,
  MiniMap,
  MarkerType,
  useOnViewportChange,
  useReactFlow,
} from 'reactflow'
import { toPng } from 'html-to-image'
import 'reactflow/dist/style.css'
import useStore, { PROTOCOL_COLORS, PROTOCOL_DEFAULTS } from './store'
import { CATEGORIES, SNAP, TEMPLATES } from './data'
import ApplianceNode from './ApplianceNode'
import CommentNode from './CommentNode'
import ProtocolEdge from './ProtocolEdge'
import Toolbar from './Toolbar'

const nodeTypes = { appliance: ApplianceNode, comment: CommentNode }
const edgeTypes = { protocol: ProtocolEdge }

const PROTOCOLS = ['HTTP', 'gRPC', 'TCP', 'ASYNC', 'DB']

function ReactFlowCanvas() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setSelectedNode,
    setSelectedEdge,
    selectedNodeId,
    selectedEdgeId,
    removeSelected,
    duplicateSelected,
    updateNodeData,
    finishRename,
    renamingNodeId,
    pushHistory,
    setTemplateOpen,
  } = useStore()

  const reactFlowInstance = useReactFlow()
  const containerRef = useRef(null)

  const addNodeAt = useStore((s) => s.addNodeAt)
  const snapEnabled = useStore((s) => s.snapEnabled)
  const gridVisible = useStore((s) => s.gridVisible)
  const selectedNodes = nodes.filter((n) => n.selected)
  const multiSelected = selectedNodes.filter((n) => n.type === 'appliance')
  const onNodeClick = useCallback((_, node) => setSelectedNode(node.id), [setSelectedNode])
  const onEdgeClick = useCallback((_, edge) => setSelectedEdge(edge.id), [setSelectedEdge])
  const onPaneClick = useCallback(() => { setSelectedNode(null); setSelectedEdge(null) }, [setSelectedNode, setSelectedEdge])
  const onPaneDoubleClick = useCallback(() => reactFlowInstance.fitView({ padding: 0.2, duration: 300 }), [reactFlowInstance])

  const onNodesDelete = useCallback(() => pushHistory(), [pushHistory])
  const onEdgesDelete = useCallback(() => pushHistory(), [pushHistory])
  const log = useCallback((tag) => (...args) => console.log(`[RF] ${tag}`, ...args), [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const itemId = e.dataTransfer.getData('text/plain')
    if (!itemId) return
    const pos = reactFlowInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY })
    addNodeAt(itemId, pos)
  }, [reactFlowInstance, addNodeAt])

  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 })
  useOnViewportChange({
    onChange: (v) => setViewport(v),
  })

  return (
    <div
      ref={containerRef}
      className="h-full relative"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectStart={log('onConnectStart')}
        onConnectEnd={log('onConnectEnd')}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{ type: 'smoothstep', style: { stroke: '#6d5cfc', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#6d5cfc', width: 16, height: 16, refX: 0 } }}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        snapToGrid={snapEnabled}
        snapGrid={[SNAP, SNAP]}
        panOnDrag={[1, 2]}
        panOnScroll
        zoomOnScroll
        zoomOnPinch
        panActivationKeyCode={null}
        multiSelectionKeyCode="Shift"
        deleteKeyCode={null}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onPaneDoubleClick={onPaneDoubleClick}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        onNodeDragStart={log('onNodeDragStart')}
        onNodeDrag={log('onNodeDrag')}
        onNodeDragStop={log('onNodeDragStop')}
        onMoveStart={log('onMoveStart')}
        onMove={log('onMove')}
        onMoveEnd={log('onMoveEnd')}
        onSelectionChange={log('onSelectionChange')}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }}
        minZoom={0.05}
        maxZoom={4}
        fitView={false}
      >
        {gridVisible && (
          <Background
            variant={BackgroundVariant.Dots}
            gap={SNAP}
            size={1.2}
            color="rgba(255,255,255,0.06)"
            style={{ background: '#0a0a0d' }}
          />
        )}

        {/* Floating Node Toolbar */}
        {selectedNodeId && (
          <NodeToolbar
            nodeId={selectedNodeId}
            isVisible
            position="top"
            offset={10}
            align="center"
          >
            <div
              className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg shadow-xl"
              style={{
                background: 'rgba(18,18,20,0.95)',
                border: '1px solid rgba(255,255,255,0.06)',
                backdropFilter: 'blur(12px)',
              }}
            >
              {[
                { label: 'Duplicate', icon: '⊞', action: duplicateSelected },
                { label: 'Delete', icon: '✕', action: removeSelected },
                { label: 'Rename', icon: '✎', action: () => store.getState().renameNode(selectedNodeId) },
                { label: 'Center', icon: '⊕', action: () => reactFlowInstance.setCenter(nodes.find(n => n.id === selectedNodeId)?.position.x || 0, nodes.find(n => n.id === selectedNodeId)?.position.y || 0, { zoom: 1.5 }) },
              ].map((btn) => (
                <button
                  key={btn.label}
                  title={btn.label}
                  onClick={(e) => { e.stopPropagation(); btn.action() }}
                  className="w-8 h-8 flex items-center justify-center rounded text-[13px] text-neutral-500 hover:text-neutral-300 hover:bg-[rgba(255,255,255,0.04)] transition-colors"
                >
                  {btn.icon}
                </button>
              ))}
            </div>
          </NodeToolbar>
        )}

        {/* Empty state */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
            <div className="text-center max-w-sm">
              <div className="text-4xl mb-3 opacity-20">▣</div>
              <h3 className="text-[15px] font-semibold text-neutral-500 mb-1">Design Your Architecture</h3>
              <p className="text-[12px] text-neutral-700 leading-relaxed">
                Drag infrastructure components from the sidebar, browse a starter template, or press <kbd className="px-1 py-0.5 rounded text-[10px] font-mono text-neutral-500" style={{ background: 'rgba(255,255,255,0.04)' }}>/</kbd> to quickly search components
              </p>
              <div className="mt-4 flex items-center justify-center gap-4 pointer-events-auto">
                <button
                  onClick={() => setTemplateOpen(true)}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors"
                  style={{ background: 'rgba(109,92,252,0.1)', color: '#a1a1aa', border: '1px solid rgba(109,92,252,0.15)' }}
                >
                  Browse Templates
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rename overlay */}
        {renamingNodeId && (() => {
          const node = nodes.find((n) => n.id === renamingNodeId)
          if (!node) return null
          return (
            <div
              className="absolute z-50"
              style={{
                left: node.position?.x || 0,
                top: (node.position?.y || 0) - 32,
              }}
            >
              <input
                autoFocus
                defaultValue={node.data?.name || ''}
                className="px-2 py-1 rounded text-[11px] outline-none"
                style={{
                  width: 120,
                  background: '#1a1a1d',
                  border: '1px solid rgba(109,92,252,0.4)',
                  color: '#e4e4e7',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') finishRename(node.id, e.target.value)
                  if (e.key === 'Escape') useStore.setState({ renamingNodeId: null })
                  e.stopPropagation()
                }}
                onBlur={(e) => finishRename(node.id, e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )
        })()}

        {/* Alignment toolbar for multi-selection */}
        {multiSelected.length >= 2 && (
          <div
            className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-0.5 px-2.5 py-1.5 rounded-xl select-none shadow-2xl"
            style={{
              background: 'rgba(14,14,16,0.92)',
              border: '1px solid rgba(255,255,255,0.06)',
              backdropFilter: 'blur(12px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {[
              { label: 'Align Left', action: 'alignLeft', icon: '▐' },
              { label: 'Align Center', action: 'alignCenter', icon: '▌' },
              { label: 'Align Right', action: 'alignRight', icon: '▌→' },
              { label: 'Align Top', action: 'alignTop', icon: '▔' },
              { label: 'Align Middle', action: 'alignMiddle', icon: '▬' },
              { label: 'Align Bottom', action: 'alignBottom', icon: '▁' },
            ].map((btn) => (
              <button
                key={btn.action}
                title={btn.label}
                onClick={(e) => { e.stopPropagation(); useStore.getState()[btn.action]() }}
                className="w-8 h-8 flex items-center justify-center rounded text-[11px] text-neutral-600 hover:text-neutral-400 hover:bg-[rgba(255,255,255,0.04)] transition-colors"
              >
                <span className="text-[10px]">{btn.icon}</span>
              </button>
            ))}
            <div className="w-px h-5 mx-0.5" style={{ background: 'rgba(255,255,255,0.04)' }} />
            {[
              { label: 'Distribute Horizontally', action: 'distributeHorizontally', icon: '↔' },
              { label: 'Distribute Vertically', action: 'distributeVertically', icon: '↕' },
            ].map((btn) => (
              <button
                key={btn.action}
                title={btn.label}
                onClick={(e) => { e.stopPropagation(); useStore.getState()[btn.action]() }}
                className="w-8 h-8 flex items-center justify-center rounded text-[11px] text-neutral-600 hover:text-neutral-400 hover:bg-[rgba(255,255,255,0.04)] transition-colors"
              >
                <span className="text-[10px]">{btn.icon}</span>
              </button>
            ))}
          </div>
        )}

        {/* Custom MiniMap */}
        <div
          className="absolute rounded-xl overflow-hidden select-none"
          onClick={(e) => e.stopPropagation()}
          style={{
            bottom: 40, right: 12, zIndex: 10,
            width: 160, height: 110,
            background: 'rgba(14,14,16,0.92)',
            border: '1px solid rgba(255,255,255,0.06)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <MiniMap
            nodeColor={(n) => {
              if (n.type === 'group') return 'rgba(255,255,255,0.05)'
              if (n.type === 'comment') return '#fef3c7'
              if (n.selected) return '#a78bfa'
              return '#6d5cfc'
            }}
            maskColor="rgba(0,0,0,0.7)"
            style={{ width: 160, height: 110, background: 'transparent' }}
            pannable
            zoomable
            nodeStrokeWidth={2}
            nodeBorderColor={(n) => n.selected ? '#a78bfa' : 'transparent'}
          />
          <div
            className="absolute bottom-1.5 right-1.5 text-[9px] font-mono font-medium"
            style={{ color: 'rgba(255,255,255,0.25)' }}
          >
            {Math.round(viewport.zoom * 100)}%
          </div>
        </div>

        <Toolbar />
      </ReactFlow>
    </div>
  )
}

function CategorySection({ cat, expanded, onToggle, onAdd }) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-3 py-2 text-[11px] text-neutral-500 uppercase tracking-widest font-semibold hover:text-neutral-300 transition-colors rounded-md"
      >
        <span className="flex items-center gap-1.5">{cat.icon} {cat.label} <span className="text-[10px] font-mono text-neutral-600 font-normal">{cat.items.length}</span></span>
        <motion.svg
          animate={{ rotate: expanded ? 0 : -90 }}
          className="w-3 h-3 text-neutral-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path d="M6 9l6 6 6-6" />
        </motion.svg>
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-2 pb-2 space-y-0.5">
              {cat.items.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', item.id)
                    e.dataTransfer.effectAllowed = 'copy'
                  }}
                  onClick={() => onAdd(item.id)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-grab active:cursor-grabbing transition-all group"
                  style={{ background: 'transparent' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <span className="w-8 h-8 flex items-center justify-center rounded-lg text-sm text-neutral-500 group-hover:text-neutral-400 transition-colors flex-shrink-0" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    {item.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-neutral-300 group-hover:text-neutral-200 transition-colors truncate">
                      {item.name}
                    </div>
                    <div className="text-[10px] text-neutral-600 truncate">{item.description}</div>
                  </div>
                  <span className="text-[9px] text-neutral-600 uppercase tracking-wider flex-shrink-0 font-medium">{item.complexity}</span>
                </div>
              ))}
              {cat.id === 'messaging' && (
                <button
                  onClick={() => onAdd('comment', true)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group w-full"
                  style={{ background: 'transparent' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <span className="w-8 h-8 flex items-center justify-center rounded-lg text-sm" style={{ background: 'rgba(255,255,255,0.03)', color: '#fef3c7' }}>
                    📝
                  </span>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-[13px] font-medium text-neutral-300 truncate">Sticky Note</div>
                    <div className="text-[10px] text-neutral-600 truncate">Add a comment or annotation</div>
                  </div>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function InspectorPanel({ selectedNode, selectedEdge, onClose, commentColors }) {
  const updateNodeData = useStore((s) => s.updateNodeData)
  const updateEdgeData = useStore((s) => s.updateEdgeData)

  if (selectedEdge) {
    return <EdgeInspector edge={selectedEdge} onUpdate={updateEdgeData} onClose={onClose} />
  }

  if (!selectedNode) {
    return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-neutral-500 uppercase tracking-wider font-semibold">Inspector</span>
      </div>
      <div className="h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
      <div className="space-y-4">
        <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="text-2xl mb-2 opacity-30">▣</div>
          <p className="text-[12px] text-neutral-600 leading-relaxed">
            Select a component or connection to inspect its properties.
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-[11px] text-neutral-600 font-medium uppercase tracking-wide">Quick Start</p>
          <div className="space-y-1.5">
            {[
              ['Click any component', 'to see its properties'],
              ['Drag from ports ⊙', 'to create connections'],
              ['Press  /', 'to quick-search components'],
              ['Press  ⌫', 'to delete selected items'],
            ].map(([action, desc], i) => (
              <div key={i} className="flex items-center justify-between py-1 px-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <span className="text-[11px] text-neutral-600">{desc}</span>
                <span className="text-[11px] font-mono text-neutral-500">{action}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    )
  }

  if (selectedNode.type === 'comment') {
    return (
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Sticky Note</span>
          <button onClick={onClose} className="text-neutral-600 hover:text-neutral-400 transition-colors">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <Section label="Color">
          <div className="flex gap-1.5">
            {Object.entries(commentColors).map(([name, hex]) => (
              <button
                key={name}
                onClick={() => updateNodeData(selectedNode.id, { color: name })}
                className="w-5 h-5 rounded-full border transition-transform"
                style={{
                  background: hex,
                  borderColor: selectedNode.data?.color === name ? 'rgba(255,255,255,0.3)' : 'transparent',
                  transform: selectedNode.data?.color === name ? 'scale(1.2)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        </Section>
      </div>
    )
  }

  if (selectedNode.type === 'group') {
    return (
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Group</span>
          <button onClick={onClose} className="text-neutral-600 hover:text-neutral-400 transition-colors">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <EditableField label="Name" value={selectedNode.data?.label} onChange={(v) => updateNodeData(selectedNode.id, { label: v })} />
      </div>
    )
  }

  const d = selectedNode.data || {}
  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 flex items-center justify-center rounded-lg text-base" style={{ background: 'rgba(255,255,255,0.03)' }}>{d.icon || '○'}</span>
          <span className="text-[15px] font-semibold text-neutral-200">{d.name || d.componentId}</span>
        </div>
        <button onClick={onClose} className="text-neutral-600 hover:text-neutral-400 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />

      <Section label="Properties">
        <EditableField label="Name" value={d.name || d.componentId} onChange={(v) => updateNodeData(selectedNode.id, { name: v })} />
        <EditableField label="Description" value={d.description || ''} onChange={(v) => updateNodeData(selectedNode.id, { description: v })} />
        <EditableField label="Environment" value={d.environment || ''} onChange={(v) => updateNodeData(selectedNode.id, { environment: v })} />
      </Section>

      <Section label="Resources">
        <EditableField label="CPU" value={d.cpu || ''} onChange={(v) => updateNodeData(selectedNode.id, { cpu: v })} />
        <EditableField label="Memory" value={d.memory || ''} onChange={(v) => updateNodeData(selectedNode.id, { memory: v })} />
        <EditableField label="Replicas" value={d.replicas || ''} onChange={(v) => updateNodeData(selectedNode.id, { replicas: v })} />
        <EditableField label="Scaling" value={d.scaling || ''} onChange={(v) => updateNodeData(selectedNode.id, { scaling: v })} />
      </Section>

      <Section label="Reliability">
        <EditableField label="Availability" value={d.availability || ''} onChange={(v) => updateNodeData(selectedNode.id, { availability: v })} />
        <EditableField label="Owner" value={d.owner || ''} onChange={(v) => updateNodeData(selectedNode.id, { owner: v })} />
        <EditableField label="Tags" value={d.tags || ''} onChange={(v) => updateNodeData(selectedNode.id, { tags: v })} />
      </Section>
    </div>
  )
}

function EdgeInspector({ edge, onUpdate, onClose }) {
  const d = edge.data || {}
  const [protocol, setProtocol] = useState(d.protocol || 'HTTP')

  const handleProtocolChange = (p) => {
    setProtocol(p)
    const defaults = PROTOCOL_DEFAULTS[p] || PROTOCOL_DEFAULTS.HTTP
    onUpdate(edge.id, {
      protocol: p,
      bandwidth: defaults.bandwidth,
      latency: defaults.latency,
      retries: defaults.retries,
      timeout: defaults.timeout,
      encrypted: defaults.encrypted,
    })
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: PROTOCOL_COLORS[protocol] || '#3b82f6' }} />
          <span className="text-xs font-medium text-neutral-200">{protocol} Connection</span>
        </div>
        <button onClick={onClose} className="text-neutral-600 hover:text-neutral-400 transition-colors">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />

      <Section label="Protocol">
        <div className="flex flex-wrap gap-1">
          {PROTOCOLS.map((p) => (
            <button
              key={p}
              onClick={() => handleProtocolChange(p)}
              className="px-2 py-1 rounded text-[9px] font-mono transition-all"
              style={{
                background: protocol === p ? `${PROTOCOL_COLORS[p]}22` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${protocol === p ? PROTOCOL_COLORS[p] : 'rgba(255,255,255,0.04)'}`,
                color: protocol === p ? PROTOCOL_COLORS[p] : '#71717a',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </Section>

      <Section label="Metadata">
        <EditableField label="Label" value={d.label || ''} onChange={(v) => onUpdate(edge.id, { label: v })} />
        <EditableField label="Bandwidth" value={d.bandwidth || ''} onChange={(v) => onUpdate(edge.id, { bandwidth: v })} />
        <EditableField label="Latency" value={d.latency || ''} onChange={(v) => onUpdate(edge.id, { latency: v })} />
      </Section>

      <Section label="Configuration">
        <EditableField label="Retries" value={d.retries ?? ''} type="number" onChange={(v) => onUpdate(edge.id, { retries: Number(v) })} />
        <EditableField label="Timeout (s)" value={d.timeout ?? ''} type="number" onChange={(v) => onUpdate(edge.id, { timeout: Number(v) })} />
        <ToggleField label="Encrypted" value={!!d.encrypted} onChange={(v) => onUpdate(edge.id, { encrypted: v })} />
        <ToggleField label="Animated Flow" value={!!d.animated} onChange={(v) => onUpdate(edge.id, { animated: v })} />
      </Section>

      <Section label="Notes">
        <textarea
          value={d.notes || ''}
          onChange={(e) => onUpdate(edge.id, { notes: e.target.value })}
          className="w-full bg-transparent rounded text-[10px] outline-none resize-none"
          style={{
            border: '1px solid rgba(255,255,255,0.06)',
            color: '#a1a1aa',
            padding: '4px 6px',
            minHeight: 48,
          }}
          placeholder="Add notes..."
        />
      </Section>
    </div>
  )
}

function EditableField({ label, value, type, onChange }) {
  const [editing, setEditing] = useState(false)
  const [local, setLocal] = useState(value ?? '')

  useEffect(() => setLocal(value ?? ''), [value])

  if (!editing) {
    return (
      <div className="flex items-center justify-between py-1 group cursor-pointer" onClick={() => setEditing(true)}>
        <span className="text-[11px] text-neutral-600">{label}</span>
        <span className="text-[12px] text-neutral-400 font-mono truncate max-w-[140px] cursor-text group-hover:text-neutral-300 transition-colors">
          {value || <span className="italic opacity-40">empty</span>}
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between py-1 gap-2">
      <span className="text-[11px] text-neutral-600 flex-shrink-0">{label}</span>
      <input
        autoFocus
        type={type || 'text'}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => { onChange(local); setEditing(false) }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { onChange(local); setEditing(false) }
          if (e.key === 'Escape') { setEditing(false) }
        }}
        className="flex-1 bg-transparent text-[12px] text-neutral-200 font-mono text-right outline-none rounded px-1.5"
        style={{ border: '1px solid rgba(109,92,252,0.3)' }}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}

function ToggleField({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[11px] text-neutral-600">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className="w-8 h-4 rounded-full relative transition-colors"
        style={{ background: value ? 'rgba(109,92,252,0.4)' : 'rgba(255,255,255,0.08)' }}
      >
        <div
          className="absolute top-0.5 w-3 h-3 rounded-full transition-transform"
          style={{
            background: value ? '#6d5cfc' : '#52525b',
            transform: value ? 'translateX(18px)' : 'translateX(2px)',
          }}
        />
      </button>
    </div>
  )
}

function Section({ label, children }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">{label}</p>
      <div className="rounded-lg p-2.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)' }}>
        {children}
      </div>
    </div>
  )
}

function ToolBtn({ label, onClick, children }) {
  return (
    <button
      title={label}
      onClick={onClick}
      className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-600 hover:text-neutral-300 hover:bg-[rgba(255,255,255,0.05)] transition-all active:scale-95"
    >
      {children}
    </button>
  )
}

function HelpPanel({ onClose }) {
  const sections = [
    {
      title: 'Mouse Controls',
      items: [
        { keys: 'Left drag (canvas)', desc: 'Pan' },
        { keys: 'Left drag (node)', desc: 'Move' },
        { keys: 'Mouse wheel', desc: 'Scroll' },
        { keys: '⌘/Ctrl + wheel', desc: 'Zoom' },
        { keys: 'Double click', desc: 'Fit diagram' },
      ],
    },
    {
      title: 'Editing',
      items: [
        { keys: '⌫ / Delete', desc: 'Delete selected' },
        { keys: 'R', desc: 'Rename node' },
        { keys: '⌘C / ⌘V', desc: 'Copy / Paste' },
        { keys: '⌘D', desc: 'Duplicate selected' },
        { keys: '⌘Z / ⌘⇧Z', desc: 'Undo / Redo' },
        { keys: '⌘A', desc: 'Select all' },
        { keys: '⌘G', desc: 'Group selected' },
        { keys: '/', desc: 'Command palette' },
        { keys: 'Esc', desc: 'Deselect / close panels' },
      ],
    },
    {
      title: 'Tools',
      items: [
        { keys: 'Sidebar', desc: 'Drag components onto canvas' },
        { keys: 'Connections', desc: 'Drag handle to handle' },
        { keys: 'Inspector', desc: 'Select to edit properties' },
        { keys: 'Validate', desc: 'Analyse architecture' },
      ],
    },
    {
      title: 'Tips',
      items: [
        { keys: 'Snap to grid', desc: 'Toggle from toolbar' },
        { keys: 'Shift + click', desc: 'Multi-select' },
        { keys: 'Select 2+ nodes', desc: 'Alignment toolbar appears' },
        { keys: 'Export', desc: 'Save as PNG / JSON' },
      ],
    },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-[420px] max-h-[65vh] rounded-xl overflow-hidden shadow-2xl"
        style={{
          background: 'rgba(18,18,20,0.98)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Help & Shortcuts</span>
          <button onClick={onClose} className="text-neutral-600 hover:text-neutral-400 transition-colors">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto max-h-[55vh] p-3 space-y-4">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="text-[9px] text-neutral-600 uppercase tracking-wider font-medium mb-1.5">{section.title}</p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <div key={item.keys} className="flex items-center justify-between py-0.5">
                    <span className="text-[10px] text-neutral-400">{item.desc}</span>
                    <kbd
                      className="px-1.5 py-0.5 rounded text-[9px] font-mono whitespace-nowrap ml-2"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        color: '#a1a1aa',
                        border: '1px solid rgba(255,255,255,0.04)',
                      }}
                    >
                      {item.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

function CommandPalette({ onClose }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)
  const addNodeAtCenter = useStore((s) => s.addNodeAtCenter)
  const toggleCommandPalette = useStore((s) => s.toggleCommandPalette)

  const allItems = useMemo(() => {
    const items = []
    for (const cat of CATEGORIES) for (const i of cat.items) items.push({ ...i, category: cat.label })
    items.push({ id: 'comment', name: 'Sticky Note', icon: '📝', description: 'Add a comment or annotation', category: 'Utility' })
    return items
  }, [])

  const results = useMemo(() => {
    if (!query) return allItems
    const q = query.toLowerCase()
    return allItems.filter((i) => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q))
  }, [query, allItems])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={(e) => { if (e.target === e.currentTarget) toggleCommandPalette() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-[360px] rounded-xl overflow-hidden shadow-2xl"
        style={{
          background: 'rgba(18,18,20,0.98)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="px-3 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') toggleCommandPalette()
              if (e.key === 'Enter' && results.length > 0) {
                if (results[0].id === 'comment') useStore.getState().addComment({ x: 400, y: 200 })
                else addNodeAtCenter(results[0].id)
                toggleCommandPalette()
              }
            }}
            placeholder="Search components..."
            className="w-full bg-transparent text-sm outline-none"
            style={{ color: '#e4e4e7' }}
          />
        </div>
        <div className="max-h-[320px] overflow-y-auto py-1">
          {results.map((item) => (
            <button
              key={item.id}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
              style={{ background: 'transparent' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              onClick={() => {
                if (item.id === 'comment') useStore.getState().addComment({ x: 400, y: 200 })
                else addNodeAtCenter(item.id)
                toggleCommandPalette()
              }}
            >
              <span className="text-base text-neutral-400 w-7 text-center">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-neutral-200">{item.name}</div>
                <div className="text-[10px] text-neutral-600 truncate">{item.description}</div>
              </div>
              <span className="text-[9px] text-neutral-700 font-medium">{item.category}</span>
            </button>
          ))}
          {results.length === 0 && (
            <p className="text-[12px] text-neutral-600 text-center py-8">No results for &quot;{query}&quot;</p>
          )}
        </div>
      </motion.div>
    </div>
  )
}

function ValidationDrawer() {
  const result = useStore((s) => s.validationResult)
  const open = useStore((s) => s.validationDrawerOpen)
  const toggleDrawer = useStore((s) => s.toggleValidationDrawer)
  const performValidation = useStore((s) => s.performValidation)
  const nodes = useStore((s) => s.nodes)
  const setSelectedNode = useStore((s) => s.setSelectedNode)
  const setInspectorOpen = useStore((s) => s.setInspectorOpen)
  const reactFlowInstance = useReactFlow()

  const archNodes = nodes.filter((n) => n.type !== 'comment' && n.type !== 'group')

  const handleClickIssue = useCallback((nodeId) => {
    if (nodeId) {
      setSelectedNode(nodeId)
      setInspectorOpen(true)
      const node = nodes.find((n) => n.id === nodeId)
      if (node && reactFlowInstance) {
        reactFlowInstance.setCenter(node.position.x + 74, node.position.y + 31, { zoom: 1.5, duration: 400 })
      }
    }
  }, [setSelectedNode, setInspectorOpen, nodes, reactFlowInstance])

  const progress = result ? Math.round((result.score / 100) * 314) : 0
  const circ = 314

  const groups = result ? [
    { label: 'Good', items: result.good, color: '#22c55e', icon: '✓' },
    { label: 'Warnings', items: result.warnings, color: '#f97316', icon: '⚠' },
    { label: 'Errors', items: result.errors, color: '#ef4444', icon: '✖' },
    { label: 'Suggestions', items: result.suggestions, color: '#60a5fa', icon: 'ℹ' },
  ].filter((g) => g.items.length > 0) : []

  const [collapsed, setCollapsed] = useState({})

  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: open ? 300 : 0, opacity: open ? 1 : 0 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="overflow-hidden z-30 flex-shrink-0"
      style={{
        background: 'rgba(14,14,16,0.95)',
        borderLeft: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="w-[300px] h-full overflow-y-auto">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-neutral-500 uppercase tracking-wider font-semibold">Analysis</span>
            <button onClick={toggleDrawer} className="text-neutral-600 hover:text-neutral-400 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />

          {archNodes.length < 2 && (
            <div className="py-8 text-center">
              <p className="text-[12px] text-neutral-600">No architecture to analyze.</p>
              <p className="text-[10px] text-neutral-700 mt-1">Place at least two components and connect them.</p>
            </div>
          )}

          {result && archNodes.length >= 2 && (
            <>
              {/* Score ring */}
              <div className="flex flex-col items-center py-2">
                <div className="relative w-20 h-20">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 110 110">
                    <circle cx="55" cy="55" r="50" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
                    <circle
                      cx="55" cy="55" r="50" fill="none"
                      stroke={result.score >= 80 ? '#22c55e' : result.score >= 50 ? '#f97316' : '#ef4444'}
                      strokeWidth="6"
                      strokeDasharray={circ}
                      strokeDashoffset={circ - progress}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.3s' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold font-mono" style={{ color: '#e4e4e7' }}>{result.score}</span>
                  </div>
                </div>
                <span className="text-[10px] text-neutral-600 font-mono mt-1">/ 100</span>
                <span
                  className="text-[12px] font-semibold mt-1"
                  style={{
                    color: result.score >= 80 ? '#22c55e' : result.score >= 50 ? '#f97316' : '#ef4444',
                  }}
                >
                  {result.score >= 80 ? 'Excellent' : result.score >= 60 ? 'Good' : result.score >= 40 ? 'Needs Work' : 'Broken'}
                </span>
              </div>

              {/* Issue groups */}
              <div className="space-y-2">
                {groups.map((group) => (
                  <div key={group.label}>
            <button
              onClick={() => setCollapsed((s) => ({ ...s, [group.label]: !s[group.label] }))}
              className="flex items-center gap-2 w-full text-left py-1.5"
            >
              <span style={{ color: group.color }} className="text-[10px] font-bold">{group.icon}</span>
              <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">{group.label}</span>
              <span className="text-[9px] font-mono text-neutral-600">{group.items.length}</span>
              <motion.svg
                animate={{ rotate: collapsed[group.label] ? -90 : 0 }}
                className="w-2.5 h-2.5 ml-auto text-neutral-600"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
              >
                <path d="M6 9l6 6 6-6" />
              </motion.svg>
            </button>
            {!collapsed[group.label] && (
              <div className="space-y-0.5 ml-3">
                {group.items.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => handleClickIssue(item.nodeId)}
                    className="w-full flex items-start gap-2 px-2 py-1.5 rounded text-left transition-colors hover:bg-[rgba(255,255,255,0.03)]"
                  >
                    <span className="text-[10px] mt-px flex-shrink-0" style={{ color: group.color }}>{group.icon}</span>
                    <span className="text-[11px]" style={{ color: '#a1a1aa' }}>{item.message}</span>
                  </button>
                ))}
              </div>
            )}
                  </div>
                ))}
              </div>
            </>
          )}

          <button
            onClick={performValidation}
            className="w-full py-2.5 rounded-xl text-[12px] font-medium transition-all hover:bg-[rgba(109,92,252,0.15)] active:scale-[0.98]"
            style={{
              background: 'rgba(109,92,252,0.1)',
              color: '#a1a1aa',
              border: '1px solid rgba(109,92,252,0.15)',
            }}
          >
            {archNodes.length < 2 ? 'Run Validation' : 'Re-run Analysis'}
          </button>
        </div>

        {/* Settings */}
        <div className="px-4 pb-3 pt-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          <LiveValidationToggle />
        </div>
      </div>
    </motion.aside>
  )
}

function LiveValidationToggle() {
  const liveValidation = useStore((s) => s.liveValidation)
  const setLiveValidation = useStore((s) => s.setLiveValidation)
  return (
      <button
        onClick={() => setLiveValidation(!liveValidation)}
        className="flex items-center gap-2 w-full py-1.5"
      >
        <div
          className="w-7 h-3.5 rounded-full relative transition-colors flex-shrink-0"
          style={{ background: liveValidation ? 'rgba(109,92,252,0.4)' : 'rgba(255,255,255,0.08)' }}
        >
          <div
            className="absolute top-0.5 w-2.5 h-2.5 rounded-full transition-transform"
            style={{
              background: liveValidation ? '#6d5cfc' : '#52525b',
              transform: liveValidation ? 'translateX(16px)' : 'translateX(2px)',
            }}
          />
        </div>
        <span className="text-[11px] text-neutral-600">Live Validation</span>
        <span className="text-[9px] text-neutral-700 ml-auto">2s debounce</span>
      </button>
  )
}

export default function SystemDesign({ navigate }) {
  const store = useStore()
  const {
    nodes,
    edges,
    selectedNodeId,
    selectedEdgeId,
    sidebarOpen,
    inspectorOpen,
    setSidebarOpen,
    setInspectorOpen,
    expandedCats,
    toggleCat,
    commandPaletteOpen,
    toggleCommandPalette,
    addNodeAtCenter,
    addComment,
    addGroup,
    newProject,
    saveProject,
    loadProject,
    loadRecentProjects,
    projects,
    dirty,
    validationResult,
    validationDrawerOpen,
    toggleValidationDrawer,
    performValidation,
    liveValidation,
    setLiveValidation,
    presentationMode,
    togglePresentationMode,
    templateOpen,
    setTemplateOpen,
    loadTemplate,
  } = store

  const [expandedCatsState, setExpandedCatsState] = useState(() => CATEGORIES.map((c) => c.id))
  const toggleCatState = useCallback((id) => {
    setExpandedCatsState((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id])
  }, [])

  const [showExport, setShowExport] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const helpOpenRef = useRef(false)
  useEffect(() => { helpOpenRef.current = helpOpen }, [helpOpen])

  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedNodeId) || null, [nodes, selectedNodeId])
  const selectedEdge = useMemo(() => edges.find((e) => e.id === selectedEdgeId) || null, [edges, selectedEdgeId])

  useEffect(() => { loadRecentProjects() }, [loadRecentProjects])

  useEffect(() => {
    if (!dirty) return
    const timer = setTimeout(() => saveProject(), 10000)
    return () => clearTimeout(timer)
  }, [dirty, saveProject])

  useEffect(() => {
    if (!liveValidation || nodes.length < 2) return
    const timer = setTimeout(() => performValidation(), 2000)
    return () => clearTimeout(timer)
  }, [liveValidation, nodes, edges, performValidation])

  useEffect(() => {
    const handler = (e) => {
      const target = e.target
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
      if (isInput) return
      const st = useStore.getState()
      if (e.key === 'Backspace' || e.key === 'Delete') {
        if (st.selectedNodeId || st.selectedEdgeId) { e.preventDefault(); st.removeSelected() }
      } else if (e.key === 'Escape') {
        if (helpOpenRef.current) { setHelpOpen(false); return }
        st.setSelectedNode(null); st.setSelectedEdge(null)
      } else if (e.key === 'r' && !e.metaKey && !e.ctrlKey) {
        if (st.selectedNodeId) st.renameNode(st.selectedNodeId)
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault(); st.selectAll()
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
        if (st.selectedNodeId || st.selectedEdgeId) { e.preventDefault(); st.copySelected() }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
        e.preventDefault(); st.paste()
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault(); st.duplicateSelected()
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault(); e.shiftKey ? st.redo() : st.undo()
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'g') {
        e.preventDefault()
        const selNodes = st.nodes.filter((n) => n.selected).map((n) => n.id)
        if (selNodes.length > 1) st.addGroup(selNodes)
      } else if (e.key === '/' && e.target === document.body) {
        e.preventDefault(); st.toggleCommandPalette()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const commentColors = { yellow: '#fef3c7', blue: '#dbeafe', green: '#d1fae5', pink: '#fce7f3' }

  const handleFileImport = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const { nodes: importedNodes, edges: importedEdges } = JSON.parse(ev.target.result)
        useStore.setState({ nodes: importedNodes, edges: importedEdges, dirty: false, history: [], historyIndex: -1 })
      } catch {}
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [])

  const fileInputRef = useRef(null)

  const handleExport = useCallback(async (format) => {
    setShowExport(false)
    const rfEl = document.querySelector('.react-flow__pane') || document.querySelector('.react-flow')
    if (!rfEl) return
    if (format === 'json') {
      const data = { nodes, edges }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'architecture.json'; a.click()
      URL.revokeObjectURL(url)
    } else if (format === 'png') {
      try {
        const dataUrl = await toPng(rfEl, { backgroundColor: '#09090b', pixelRatio: 2 })
        const a = document.createElement('a')
        a.href = dataUrl; a.download = 'architecture.png'; a.click()
      } catch {}
    } else if (format === 'svg') {
      try {
        const dataUrl = await toPng(rfEl, { backgroundColor: '#09090b', pixelRatio: 2 })
        const a = document.createElement('a')
        a.href = dataUrl; a.download = 'architecture.png'; a.click()
      } catch {}
    }
  }, [nodes, edges])

  const handleImport = useCallback((file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const { nodes: importedNodes, edges: importedEdges } = JSON.parse(e.target.result)
        useStore.setState({ nodes: importedNodes, edges: importedEdges, dirty: false })
      } catch {}
    }
    reader.readAsText(file)
  }, [])

  const TemplateDialog = ({ onClose }) => (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-[480px] max-h-[70vh] rounded-xl overflow-hidden shadow-2xl"
        style={{
          background: 'rgba(18,18,20,0.98)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          <span className="text-[12px] text-neutral-500 uppercase tracking-wider font-semibold">Templates</span>
          <button onClick={onClose} className="text-neutral-600 hover:text-neutral-400 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto max-h-[55vh] p-2">
          {TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => { loadTemplate(tpl.id); onClose() }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all hover:translate-x-0.5"
              style={{ background: 'transparent' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(109,92,252,0.1)' }}>
                <svg className="w-5 h-5" style={{ color: '#6d5cfc' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={tpl.components.length === 0
                    ? 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z'
                    : 'M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z'}
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-neutral-200">{tpl.name}</div>
                <div className="text-[10px] text-neutral-600 truncate">{tpl.description}</div>
              </div>
              <span className="text-[9px] text-neutral-700 font-mono font-medium">{tpl.components.length} items</span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  )

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: '#09090b' }}>
      {/* Header */}
      {!presentationMode && <header
        className="flex items-center justify-between px-3 py-1.5 z-30 flex-shrink-0 select-none"
        style={{
          background: 'rgba(12,12,14,0.92)',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          backdropFilter: 'blur(12px)',
          height: 38,
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/deepverse')}
            className="flex items-center gap-1.5 text-[11px] text-neutral-600 hover:text-neutral-300 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div className="w-px h-4" style={{ background: 'rgba(255,255,255,0.04)' }} />
          <span className="text-[14px] font-semibold text-neutral-200 tracking-wide">System Design</span>
          <span className="text-[10px] text-neutral-600 font-mono">Playground</span>
          {dirty && <span className="text-[9px] text-amber-500 font-mono">●</span>}
        </div>

        <div className="flex items-center gap-1">
          <div className="flex items-center">
            <button
              onClick={() => setTemplateOpen(true)}
              className="px-2.5 py-1.5 text-[11px] text-neutral-500 hover:text-neutral-300 transition-colors rounded-lg"
            >
              New
            </button>
            <button
              onClick={saveProject}
              className="px-2.5 py-1.5 text-[11px] text-neutral-500 hover:text-neutral-300 transition-colors rounded-lg"
            >
              Save
            </button>
            <div className="relative">
              <button
                onClick={() => setShowExport(!showExport)}
                className="px-2.5 py-1.5 text-[11px] text-neutral-500 hover:text-neutral-300 transition-colors rounded-lg"
              >
                Export
              </button>
              {showExport && (
                <div
                  className="absolute top-full right-0 mt-1.5 rounded-xl overflow-hidden shadow-xl z-50"
                  style={{
                    background: 'rgba(18,18,20,0.98)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(12px)',
                    minWidth: 140,
                  }}
                >
                  <button
                    onClick={() => { setShowExport(false); fileInputRef.current?.click() }}
                    className="w-full px-3 py-2 text-left text-[12px] text-neutral-400 hover:text-neutral-200 hover:bg-[rgba(255,255,255,0.03)] transition-colors"
                  >
                    Import JSON
                  </button>
                  <div className="h-px mx-2" style={{ background: 'rgba(255,255,255,0.04)' }} />
                  {['PNG', 'SVG', 'JSON'].map((f) => (
                    <button
                      key={f}
                      onClick={() => handleExport(f.toLowerCase())}
                      className="w-full px-3 py-2 text-left text-[12px] text-neutral-400 hover:text-neutral-200 hover:bg-[rgba(255,255,255,0.03)] transition-colors"
                    >
                      Export as {f}
                    </button>
                  ))}
                  <div className="h-px mx-2" style={{ background: 'rgba(255,255,255,0.04)' }} />
                  <button
                    onClick={() => {
                      setShowExport(false)
                      const data = JSON.stringify({ nodes, edges }, null, 2)
                      navigator.clipboard?.writeText(data)
                    }}
                    className="w-full px-3 py-2 text-left text-[12px] text-neutral-400 hover:text-neutral-200 hover:bg-[rgba(255,255,255,0.03)] transition-colors"
                  >
                    Copy Diagram JSON
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="w-px h-3 mx-1" style={{ background: 'rgba(255,255,255,0.04)' }} />
          <button
            onClick={() => { if (!validationResult) performValidation(); toggleValidationDrawer() }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] rounded-lg transition-colors"
            style={{
              color: validationResult ? (validationResult.score >= 80 ? '#22c55e' : validationResult.score >= 50 ? '#f97316' : '#ef4444') : '#a1a1aa',
              background: validationResult ? 'rgba(255,255,255,0.03)' : 'transparent',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = validationResult ? 'rgba(255,255,255,0.03)' : 'transparent' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Validate
          </button>
          <div className="w-px h-4 mx-1" style={{ background: 'rgba(255,255,255,0.04)' }} />
          <ToolBtn label="Help" onClick={() => setHelpOpen(true)}>
            <span className="text-[14px] font-semibold leading-none" style={{ color: '#71717a' }}>?</span>
          </ToolBtn>
          <div className="w-px h-4 mx-1" style={{ background: 'rgba(255,255,255,0.04)' }} />
          <ToolBtn label="Toggle sidebar" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </ToolBtn>
        </div>
      </header>}

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        {!presentationMode && <motion.aside
          className="flex flex-col overflow-y-auto z-20 flex-shrink-0 overflow-x-hidden"
          style={{
            background: 'rgba(12,12,14,0.85)',
            borderRight: '1px solid rgba(255,255,255,0.04)',
            backdropFilter: 'blur(12px)',
          }}
          animate={{ width: sidebarOpen ? 220 : 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          <div className="flex-shrink-0 px-3 py-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-neutral-500 uppercase tracking-widest font-semibold">Components</span>
              <span className="text-[9px] text-neutral-700 font-mono font-medium">{nodes.length}</span>
            </div>
          </div>
          <div className="h-px mx-3" style={{ background: 'rgba(255,255,255,0.04)' }} />
          <div className="flex-1 py-1.5 space-y-0.5">
            {CATEGORIES.map((cat) => (
              <CategorySection
                key={cat.id}
                cat={cat}
                expanded={expandedCatsState.includes(cat.id)}
                onToggle={() => toggleCatState(cat.id)}
                onAdd={(id, isComment) => {
                  if (isComment || id === 'comment') {
                    addComment({ x: 400, y: 200 })
                  } else {
                    addNodeAtCenter(id)
                  }
                }}
              />
            ))}
          </div>
        </motion.aside>}

        {/* Canvas */}
        <ReactFlowProvider>
          <div className="flex flex-1 min-h-0">
            <div className="flex-1 relative">
              <ReactFlowCanvas />
            </div>

            <ValidationDrawer />

            {/* Inspector */}
            {!presentationMode && <motion.aside
          className="overflow-y-auto z-20 flex-shrink-0 overflow-x-hidden"
          style={{
            background: 'rgba(12,12,14,0.85)',
            borderLeft: '1px solid rgba(255,255,255,0.04)',
            backdropFilter: 'blur(12px)',
          }}
          animate={{ width: inspectorOpen ? 260 : 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          {inspectorOpen && (
            <InspectorPanel
              selectedNode={selectedNode}
              selectedEdge={selectedEdge}
              onClose={() => setInspectorOpen(false)}
              commentColors={commentColors}
            />
          )}
        </motion.aside>}
        </div>
        </ReactFlowProvider>
      </div>

      {/* Status bar */}
      {!presentationMode && <footer
        className="flex items-center justify-between px-3 z-30 flex-shrink-0 select-none"
        style={{
          height: 26,
          background: 'rgba(12,12,14,0.92)',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-neutral-700 font-mono font-medium">
            {nodes.filter((n) => n.type !== 'comment' && n.type !== 'group').length} component{Object.keys(nodes).length !== 1 ? 's' : ''} · {edges.length} connection{edges.length !== 1 ? 's' : ''}
          </span>
          {validationResult && (
            <button
              onClick={toggleValidationDrawer}
              className="text-[10px] font-mono transition-colors hover:underline"
              style={{
                color: validationResult.score >= 80 ? '#22c55e' : validationResult.score >= 50 ? '#f97316' : '#ef4444',
              }}
            >
              {validationResult.score >= 80 ? '✓' : validationResult.score >= 50 ? '⚠' : '✖'} {validationResult.score}/100
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-neutral-700 font-mono">snap: {SNAP}px</span>
          <span className="text-[10px] text-neutral-600">Left-click to pan · scroll to zoom</span>
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: '#22c55e',
              boxShadow: '0 0 4px rgba(34,197,94,0.4)',
            }}
          />
          <span className="text-[10px] text-neutral-600">Ready</span>
        </div>
      </footer>}

      {/* Template dialog */}
      <AnimatePresence>
        {templateOpen && <TemplateDialog onClose={() => setTemplateOpen(false)} />}
      </AnimatePresence>

      {/* Help panel */}
      <AnimatePresence>
        {helpOpen && <HelpPanel onClose={() => setHelpOpen(false)} />}
      </AnimatePresence>

      {/* Command palette */}
      <AnimatePresence>
        {commandPaletteOpen && <CommandPalette />}
      </AnimatePresence>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileImport}
        style={{ display: 'none' }}
      />
    </div>
  )
}
