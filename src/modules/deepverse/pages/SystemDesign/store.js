import { create } from 'zustand'
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  MarkerType,
} from 'reactflow'
import { CATEGORIES, SNAP, createComponentInstance, findItem, TEMPLATES } from './data'

const MAX_HISTORY = 50
const PROTOCOL_COLORS = {
  HTTP: '#3b82f6',
  gRPC: '#a855f7',
  TCP: '#22c55e',
  ASYNC: '#f97316',
  DB: '#6b7280',
}
const PROTOCOL_DEFAULTS = {
  HTTP: { bandwidth: '1 Gbps', latency: '10-50ms', retries: 3, timeout: 30, encrypted: true },
  gRPC: { bandwidth: '10 Gbps', latency: '1-5ms', retries: 3, timeout: 10, encrypted: true },
  TCP: { bandwidth: '1 Gbps', latency: '1-10ms', retries: 5, timeout: 60, encrypted: false },
  ASYNC: { bandwidth: '100 Mbps', latency: '50-500ms', retries: 10, timeout: 300, encrypted: true },
  DB: { bandwidth: '10 Gbps', latency: '1-5ms', retries: 2, timeout: 5, encrypted: true },
}
export { PROTOCOL_COLORS, PROTOCOL_DEFAULTS }

let nodeIdCounter = 0
function uid(prefix = 'n') {
  return `${prefix}_${Date.now()}_${++nodeIdCounter}_${Math.random().toString(36).slice(2, 6)}`
}

function findComponent(id) {
  const found = findItem(id)
  return found ? found.item : null
}

function snap(v) {
  return Math.round(v / SNAP) * SNAP
}

function serialize(nodes, edges) {
  return JSON.stringify({ nodes, edges })
}

function createSnapshot(nodes, edges) {
  return { nodes: structuredClone(nodes), edges: structuredClone(edges) }
}

const NODE_W = 148
const CARD_H = 62

function closestSide(ax, ay, bx, by) {
  const dx = bx - ax
  const dy = by - ay
  const adx = Math.abs(dx)
  const ady = Math.abs(dy)
  if (adx > ady) return dx > 0 ? { from: 'right', to: 'left' } : { from: 'left', to: 'right' }
  return dy > 0 ? { from: 'bottom', to: 'top' } : { from: 'top', to: 'bottom' }
}

function pickHandles(nodes, source, target) {
  const src = nodes.find((n) => n.id === source)
  const tgt = nodes.find((n) => n.id === target)
  if (!src || !tgt) return { sourceHandle: null, targetHandle: null }
  const sx = src.position.x + NODE_W / 2
  const sy = src.position.y + CARD_H / 2
  const tx = tgt.position.x + NODE_W / 2
  const ty = tgt.position.y + CARD_H / 2
  const { from, to } = closestSide(sx, sy, tx, ty)
  return {
    sourceHandle: `${source}-${from}-source`,
    targetHandle: `${target}-${to}-target`,
  }
}

const useStore = create((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  history: [],
  historyIndex: -1,
  clipboard: null,
  sidebarOpen: true,
  inspectorOpen: true,
  commandPaletteOpen: false,
  renamingNodeId: null,
  projects: [],
  currentProject: null,
  dirty: false,
  validationResult: null,
  validationDrawerOpen: false,
  liveValidation: false,
  presentationMode: false,
  templateOpen: false,
  gridVisible: true,
  snapEnabled: true,

  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  setInspectorOpen: (v) => set({ inspectorOpen: v }),

  onNodesChange: (changes) => {
    const { nodes, edges } = get()
    const next = applyNodeChanges(changes, nodes)
    const removed = changes.filter((c) => c.type === 'remove')
    if (removed.length > 0) get().pushHistory()
    set({ nodes: next, dirty: true })
    const sel = next.find((n) => n.selected)
    if (sel) set({ selectedNodeId: sel.id, selectedEdgeId: null })
    else if (!get().selectedEdgeId && !next.some((n) => n.selected)) set({ selectedNodeId: null })
  },

  onEdgesChange: (changes) => {
    const { edges } = get()
    const next = applyEdgeChanges(changes, edges)
    const removed = changes.filter((c) => c.type === 'remove')
    if (removed.length > 0) get().pushHistory()
    set({ edges: next, dirty: true })
    const sel = next.find((e) => e.selected)
    if (sel) set({ selectedEdgeId: sel.id, selectedNodeId: null })
    else if (!next.some((e) => e.selected)) set({ selectedEdgeId: null })
  },

  onConnect: (params) => {
    const { nodes, edges } = get()
    const sourceNode = nodes.find((n) => n.id === params.source)
    const targetNode = nodes.find((n) => n.id === params.target)
    if (!sourceNode || !targetNode || params.source === params.target) return
    const dup = edges.some(
      (e) => e.source === params.source && e.target === params.target && e.sourceHandle === params.sourceHandle && e.targetHandle === params.targetHandle
    )
    if (dup) return
    get().pushHistory()
    const proto = 'HTTP'
    const color = PROTOCOL_COLORS[proto]
    const handles = pickHandles(nodes, params.source, params.target)
    const parallelCount = edges.filter(
      (e) => e.source === params.source && e.target === params.target
    ).length
    set({
      edges: addEdge(
        {
          ...params,
          sourceHandle: handles.sourceHandle,
          targetHandle: handles.targetHandle,
          type: 'protocol',
          animated: false,
          markerEnd: { type: MarkerType.ArrowClosed, color },
          style: { stroke: color, strokeWidth: 2 },
          data: {
            protocol: proto,
            label: '',
            bandwidth: PROTOCOL_DEFAULTS[proto].bandwidth,
            latency: PROTOCOL_DEFAULTS[proto].latency,
            retries: PROTOCOL_DEFAULTS[proto].retries,
            timeout: PROTOCOL_DEFAULTS[proto].timeout,
            encrypted: PROTOCOL_DEFAULTS[proto].encrypted,
            notes: '',
            parallelIndex: parallelCount,
          },
        },
        edges
      ),
      dirty: true,
    })
  },

  setSelectedNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
  setSelectedEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),

  updateNodeData: (id, data) => {
    get().pushHistory()
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...data } } : n)),
      dirty: true,
    }))
  },

  updateEdgeData: (id, data) => {
    get().pushHistory()
    set((s) => ({
      edges: s.edges.map((e) => {
        if (e.id !== id) return e
        const proto = data.protocol || e.data.protocol
        const color = PROTOCOL_COLORS[proto] || PROTOCOL_COLORS.HTTP
        return {
          ...e,
          data: { ...e.data, ...data },
          markerEnd: { type: MarkerType.ArrowClosed, color },
          style: { stroke: color, strokeWidth: 1.5 },
          animated: false,
        }
      }),
      dirty: true,
    }))
  },

  addNodeAt: (componentId, position) => {
    const comp = findComponent(componentId)
    if (!comp) return null
    const { nodes } = get()
    get().pushHistory()
    const inst = createComponentInstance(comp)
    const id = uid('node')
    const node = {
      id,
      type: 'appliance',
      position: { x: snap(position.x), y: snap(position.y) },
      data: { ...inst, componentId },
    }
    set({ nodes: [...nodes, node], selectedNodeId: id, dirty: true })
    return id
  },

  addNodeAtCenter: (componentId) => {
    const { nodes } = get()
    const centerX = window.innerWidth / 2 - 74
    const centerY = window.innerHeight / 2 - 31
    return get().addNodeAt(componentId, { x: centerX, y: centerY })
  },

  removeSelected: () => {
    const { nodes, edges, selectedNodeId, selectedEdgeId } = get()
    get().pushHistory()
    const filteredNodes = selectedNodeId
      ? nodes.filter((n) => n.id !== selectedNodeId)
      : nodes.filter((n) => !n.selected)
    const filteredEdges = selectedEdgeId
      ? edges.filter((e) => e.id !== selectedEdgeId)
      : edges
    set({ nodes: filteredNodes, edges: filteredEdges, selectedNodeId: null, selectedEdgeId: null, dirty: true })
  },

  duplicateSelected: () => {
    const { nodes, edges, selectedNodeId } = get()
    get().pushHistory()
    const source = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : nodes.find((n) => n.selected)
    if (!source) return
    const id = uid('node')
    const newNode = {
      ...source,
      id,
      position: { x: source.position.x + 40, y: source.position.y + 40 },
      selected: false,
      data: { ...source.data, id: source.data.id },
    }
    set({ nodes: [...nodes, newNode], selectedNodeId: id, dirty: true })
  },

  copySelected: () => {
    const { nodes, edges, selectedNodeId } = get()
    const source = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : null
    if (!source) return
    set({ clipboard: { nodes: [source], edges: edges.filter((e) => e.source === source.id || e.target === source.id) } })
  },

  paste: () => {
    const { clipboard, nodes, edges } = get()
    if (!clipboard || clipboard.nodes.length === 0) return
    get().pushHistory()
    const idMap = {}
    const newNodes = clipboard.nodes.map((n) => {
      const id = uid('node')
      idMap[n.id] = id
      return { ...n, id, position: { x: n.position.x + 60, y: n.position.y + 60 }, selected: false }
    })
    const newEdges = clipboard.edges.map((e) => ({
      ...e,
      id: uid('edge'),
      source: idMap[e.source] || e.source,
      target: idMap[e.target] || e.target,
    }))
    set({ nodes: [...nodes, ...newNodes], edges: [...edges, ...newEdges], selectedNodeId: newNodes[0]?.id || null, dirty: true })
  },

  pushHistory: () => {
    const { nodes, edges, history, historyIndex } = get()
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(createSnapshot(nodes, edges))
    if (newHistory.length > MAX_HISTORY) newHistory.shift()
    set({ history: newHistory, historyIndex: newHistory.length - 1 })
  },

  undo: () => {
    const { historyIndex, history } = get()
    if (historyIndex < 0) return
    const snapshot = history[historyIndex]
    set({ nodes: structuredClone(snapshot.nodes), edges: structuredClone(snapshot.edges), historyIndex: historyIndex - 1, dirty: true })
  },

  redo: () => {
    const { historyIndex, history } = get()
    if (historyIndex >= history.length - 2) return
    const snapshot = history[historyIndex + 2]
    if (!snapshot) return
    set({ nodes: structuredClone(snapshot.nodes), edges: structuredClone(snapshot.edges), historyIndex: historyIndex + 1, dirty: true })
  },

  addComment: (position, color = '#fef3c7') => {
    get().pushHistory()
    const id = uid('comment')
    const node = {
      id,
      type: 'comment',
      position: { x: snap(position.x), y: snap(position.y) },
      data: { text: '', color, width: 200, height: 120 },
    }
    set((s) => ({ nodes: [...s.nodes, node], selectedNodeId: id, dirty: true }))
  },

  addGroup: (nodeIds) => {
    get().pushHistory()
    const { nodes } = get()
    const targets = nodes.filter((n) => nodeIds.includes(n.id))
    if (targets.length === 0) return
    const minX = Math.min(...targets.map((n) => n.position.x)) - 40
    const minY = Math.min(...targets.map((n) => n.position.y)) - 40
    const maxX = Math.max(...targets.map((n) => n.position.x + 148)) + 40
    const maxY = Math.max(...targets.map((n) => n.position.y + 62)) + 40
    const id = uid('group')
    const parentNode = {
      id,
      type: 'group',
      position: { x: minX, y: minY },
      data: { label: 'Group', width: maxX - minX, height: maxY - minY },
      style: { width: maxX - minX, height: maxY - minY },
    }
    const childNodes = targets.map((n) => ({ ...n, parentId: id, position: { x: n.position.x - minX, y: n.position.y - minY } }))
    const filtered = nodes.filter((n) => !nodeIds.includes(n.id))
    set({ nodes: [...filtered, parentNode, ...childNodes], selectedNodeId: id, dirty: true })
  },

  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),

  saveProject: () => {
    const { nodes, edges, currentProject } = get()
    const data = { nodes, edges }
    const key = currentProject || `project_${Date.now()}`
    try {
      localStorage.setItem(`sd_${key}`, JSON.stringify(data))
      const recent = JSON.parse(localStorage.getItem('sd_recent') || '[]')
      const updated = [{ name: key, timestamp: Date.now() }, ...recent.filter((p) => p.name !== key)].slice(0, 10)
      localStorage.setItem('sd_recent', JSON.stringify(updated))
      set({ currentProject: key, dirty: false, projects: updated })
    } catch {}
  },

  loadProject: (name) => {
    try {
      const raw = localStorage.getItem(`sd_${name}`)
      if (!raw) return
      const { nodes, edges } = JSON.parse(raw)
      set({ nodes, edges, currentProject: name, dirty: false, selectedNodeId: null, selectedEdgeId: null })
    } catch {}
  },

  newProject: () => {
    set({ nodes: [], edges: [], currentProject: null, dirty: false, selectedNodeId: null, selectedEdgeId: null, history: [], historyIndex: -1 })
  },

  loadRecentProjects: () => {
    try {
      const recent = JSON.parse(localStorage.getItem('sd_recent') || '[]')
      set({ projects: recent })
    } catch {}
  },

  toggleValidationDrawer: () => set((s) => ({ validationDrawerOpen: !s.validationDrawerOpen })),
  setLiveValidation: (v) => set({ liveValidation: v }),
  togglePresentationMode: () => set((s) => ({ presentationMode: !s.presentationMode })),
  setTemplateOpen: (v) => set({ templateOpen: v }),
  setGridVisible: (v) => set({ gridVisible: v }),
  setSnapEnabled: (v) => set({ snapEnabled: v }),

  runValidation: (nodeList, edgeList) => {
    const nodes = nodeList || get().nodes
    const edges = edgeList || get().edges
    const good = []
    const errors = []
    const warnings = []
    const suggestions = []
    const archNodes = nodes.filter((n) => n.type !== 'comment' && n.type !== 'group')
    const connected = new Set()
    edges.forEach((e) => { connected.add(e.source); connected.add(e.target) })

    if (archNodes.length < 2) {
      return { score: 0, good, errors, warnings, suggestions, total: 0, label: 'No architecture to analyze' }
    }

    archNodes.forEach((n) => {
      const cid = n.data?.componentId
      const name = n.data?.name || cid
      if (!cid) return
      if (connected.has(n.id)) {
        good.push({ nodeId: n.id, message: `${name} connected`, type: 'good' })
      } else {
        errors.push({ nodeId: n.id, message: `${name} disconnected`, type: 'error' })
      }
    })

    const hasApi = archNodes.some((n) => n.data?.componentId === 'api-gateway')
    const hasLB = archNodes.some((n) => n.data?.componentId === 'load-balancer')
    const hasDB = archNodes.some((n) => n.data?.componentId === 'database')
    const hasS3 = archNodes.some((n) => n.data?.componentId === 's3')
    const hasCache = archNodes.some((n) => n.data?.componentId === 'redis' || n.data?.componentId === 'memcached')
    const hasCDN = archNodes.some((n) => n.data?.componentId === 'cdn')
    const hasKafka = archNodes.some((n) => n.data?.componentId === 'kafka')
    const hasQueue = archNodes.some((n) => n.data?.componentId === 'queue')
    const hasWorker = archNodes.some((n) => n.data?.componentId === 'worker')
    const hasService = archNodes.some((n) => n.data?.componentId === 'service')
    const hasMonitoring = archNodes.some((n) => n.data?.componentId === 'prometheus')

    if (hasApi) {
      const backends = edges.filter((e) => {
        const src = archNodes.find((n) => n.id === e.source)
        return src?.data?.componentId === 'api-gateway'
      })
      if (backends.length === 0) errors.push({ nodeId: null, message: 'API Gateway has no backend services', type: 'error' })
      else good.push({ nodeId: null, message: 'API Gateway connected to backends', type: 'good' })
    }

    if (hasService && !hasApi && !hasLB) warnings.push({ nodeId: null, message: 'Services exposed without API Gateway or Load Balancer', type: 'warning' })

    if (hasLB) good.push({ nodeId: null, message: 'Load Balancer configured', type: 'good' })
    else if (archNodes.length >= 3) suggestions.push({ nodeId: null, message: 'Consider adding a Load Balancer for multiple services', type: 'suggestion' })

    if (hasDB) {
      const consumers = edges.filter((e) => e.target === archNodes.find((n) => n.data?.componentId === 'database')?.id || e.source === archNodes.find((n) => n.data?.componentId === 'database')?.id)
      if (consumers.length === 0) errors.push({ nodeId: null, message: 'Database has no consumers', type: 'error' })
      const replicas = archNodes.find((n) => n.data?.componentId === 'database')?.data?.replicas
      if (!replicas || Number(replicas) < 2) suggestions.push({ nodeId: null, message: 'Database has a single point of failure — add replicas', type: 'suggestion' })
    }

    if (hasCache) {
      const clients = edges.filter((e) => {
        const src = archNodes.find((n) => n.id === e.source)
        const tgt = archNodes.find((n) => n.id === e.target)
        return src?.data?.componentId === 'redis' || src?.data?.componentId === 'memcached' ||
               tgt?.data?.componentId === 'redis' || tgt?.data?.componentId === 'memcached'
      })
      if (clients.length === 0) warnings.push({ nodeId: null, message: 'Redis/Memcached has no clients', type: 'warning' })
    }

    if (hasCDN) {
      if (hasS3 || hasApi || hasService) good.push({ nodeId: null, message: 'CDN configured for content delivery', type: 'good' })
      else warnings.push({ nodeId: null, message: 'CDN has no origin sources configured', type: 'warning' })
    } else if (archNodes.length >= 4) suggestions.push({ nodeId: null, message: 'Consider adding a CDN for global content delivery', type: 'suggestion' })

    if (hasKafka) {
      const producers = edges.filter((e) => e.target === archNodes.find((n) => n.data?.componentId === 'kafka')?.id)
      if (producers.length === 0) warnings.push({ nodeId: null, message: 'Kafka has no producers', type: 'warning' })
      const consumers = edges.filter((e) => e.source === archNodes.find((n) => n.data?.componentId === 'kafka')?.id)
      if (consumers.length === 0) warnings.push({ nodeId: null, message: 'Kafka has no consumers', type: 'warning' })
    }

    if (hasQueue) {
      const producers = edges.filter((e) => e.target === archNodes.find((n) => n.data?.componentId === 'queue')?.id)
      if (producers.length === 0) warnings.push({ nodeId: null, message: 'Queue has no producers', type: 'warning' })
      if (hasWorker) {
        const workerConsumes = edges.some((e) => {
          const tgt = archNodes.find((n) => n.id === e.target)
          return tgt?.data?.componentId === 'worker' && e.source === archNodes.find((n) => n.data?.componentId === 'queue')?.id
        })
        if (!workerConsumes && edges.length > 0) warnings.push({ nodeId: null, message: 'Worker not consuming from Queue', type: 'warning' })
      }
    }

    if (hasWorker && !hasQueue) suggestions.push({ nodeId: null, message: 'Workers typically consume from a Queue — consider adding one', type: 'suggestion' })

    if (hasApi || hasService) {
      if (!hasMonitoring) suggestions.push({ nodeId: null, message: 'Add monitoring (Prometheus) for observability', type: 'suggestion' })
      else good.push({ nodeId: null, message: 'Monitoring configured', type: 'good' })
    }

    if (hasDB && hasCache) suggestions.push({ nodeId: null, message: 'Consider cache-before-DB pattern to reduce database load', type: 'suggestion' })

    const adj = {}
    archNodes.forEach((n) => { adj[n.id] = [] })
    edges.forEach((e) => { adj[e.source]?.push(e.target) })
    function hasCycle() {
      const visited = new Set()
      const stack = new Set()
      function dfs(nid) {
        if (stack.has(nid)) return true
        if (visited.has(nid)) return false
        visited.add(nid)
        stack.add(nid)
        for (const next of adj[nid] || []) if (dfs(next)) return true
        stack.delete(nid)
        return false
      }
      for (const nid of archNodes.map((n) => n.id)) if (dfs(nid)) return true
      return false
    }
    if (hasCycle()) errors.push({ nodeId: null, message: 'Circular dependency detected', type: 'error' })

    const score = Math.max(0, Math.min(100,
      100 - errors.length * 10 - warnings.length * 5 - suggestions.length * 2
    ))

    return { score, good, errors, warnings, suggestions, total: good.length + errors.length + warnings.length + suggestions.length, label: null }
  },

  performValidation: () => {
    const result = get().runValidation()
    set({ validationResult: result })
  },

  selectAll: () => {
    set((s) => ({
      nodes: s.nodes.map((n) => ({ ...n, selected: true })),
    }))
  },

  renameNode: (id) => {
    set({ renamingNodeId: id })
  },

  finishRename: (id, name) => {
    if (name && name.trim()) {
      get().updateNodeData(id, { name: name.trim() })
    }
    set({ renamingNodeId: null })
  },

  getSelectedNodes: () => {
    const { nodes, selectedNodeId } = get()
    const selected = nodes.filter((n) => n.selected)
    if (selected.length === 0 && selectedNodeId) {
      const n = nodes.find((n) => n.id === selectedNodeId)
      if (n) selected.push(n)
    }
    return selected.filter((n) => n.type === 'appliance')
  },

  alignLeft: () => {
    const sel = get().getSelectedNodes()
    if (sel.length < 2) return
    get().pushHistory()
    const minX = Math.min(...sel.map((n) => n.position.x))
    set((s) => ({ nodes: s.nodes.map((n) => sel.find((x) => x.id === n.id) ? { ...n, position: { x: minX, y: n.position.y } } : n), dirty: true }))
  },
  alignRight: () => {
    const sel = get().getSelectedNodes()
    if (sel.length < 2) return
    get().pushHistory()
    const maxX = Math.max(...sel.map((n) => n.position.x + NODE_W))
    set((s) => ({ nodes: s.nodes.map((n) => sel.find((x) => x.id === n.id) ? { ...n, position: { x: maxX - NODE_W, y: n.position.y } } : n), dirty: true }))
  },
  alignCenter: () => {
    const sel = get().getSelectedNodes()
    if (sel.length < 2) return
    get().pushHistory()
    const avgX = sel.reduce((s, n) => s + n.position.x, 0) / sel.length + NODE_W / 2
    set((s) => ({ nodes: s.nodes.map((n) => sel.find((x) => x.id === n.id) ? { ...n, position: { x: avgX - NODE_W / 2, y: n.position.y } } : n), dirty: true }))
  },
  alignTop: () => {
    const sel = get().getSelectedNodes()
    if (sel.length < 2) return
    get().pushHistory()
    const minY = Math.min(...sel.map((n) => n.position.y))
    set((s) => ({ nodes: s.nodes.map((n) => sel.find((x) => x.id === n.id) ? { ...n, position: { x: n.position.x, y: minY } } : n), dirty: true }))
  },
  alignBottom: () => {
    const sel = get().getSelectedNodes()
    if (sel.length < 2) return
    get().pushHistory()
    const maxY = Math.max(...sel.map((n) => n.position.y + CARD_H))
    set((s) => ({ nodes: s.nodes.map((n) => sel.find((x) => x.id === n.id) ? { ...n, position: { x: n.position.x, y: maxY - CARD_H } } : n), dirty: true }))
  },
  alignMiddle: () => {
    const sel = get().getSelectedNodes()
    if (sel.length < 2) return
    get().pushHistory()
    const avgY = sel.reduce((s, n) => s + n.position.y, 0) / sel.length + CARD_H / 2
    set((s) => ({ nodes: s.nodes.map((n) => sel.find((x) => x.id === n.id) ? { ...n, position: { x: n.position.x, y: avgY - CARD_H / 2 } } : n), dirty: true }))
  },
  distributeHorizontally: () => {
    const sel = get().getSelectedNodes()
    if (sel.length < 3) return
    get().pushHistory()
    const sorted = [...sel].sort((a, b) => a.position.x - b.position.x)
    const minX = sorted[0].position.x
    const maxX = sorted[sorted.length - 1].position.x
    const gap = (maxX - minX) / (sorted.length - 1)
    const map = {}
    sorted.forEach((n, i) => { map[n.id] = { x: minX + gap * i, y: n.position.y } })
    set((s) => ({ nodes: s.nodes.map((n) => map[n.id] ? { ...n, position: map[n.id] } : n), dirty: true }))
  },
  distributeVertically: () => {
    const sel = get().getSelectedNodes()
    if (sel.length < 3) return
    get().pushHistory()
    const sorted = [...sel].sort((a, b) => a.position.y - b.position.y)
    const minY = sorted[0].position.y
    const maxY = sorted[sorted.length - 1].position.y
    const gap = (maxY - minY) / (sorted.length - 1)
    const map = {}
    sorted.forEach((n, i) => { map[n.id] = { x: n.position.x, y: minY + gap * i } })
    set((s) => ({ nodes: s.nodes.map((n) => map[n.id] ? { ...n, position: map[n.id] } : n), dirty: true }))
  },

  loadTemplate: (templateId) => {
    const tpl = TEMPLATES.find((t) => t.id === templateId)
    if (!tpl || tpl.components.length === 0) {
      set({ nodes: [], edges: [], selectedNodeId: null, selectedEdgeId: null, templateOpen: false, history: [], historyIndex: -1, dirty: false })
      return
    }
    get().pushHistory()
    const startX = 200
    const startY = 150
    const spacing = 180
    const newNodes = []
    const newEdges = []
    tpl.components.forEach((cid, i) => {
      const comp = findComponent(cid)
      if (!comp) return
      const inst = createComponentInstance(comp)
      const nodeId = uid('node')
      const col = i % 4
      const row = Math.floor(i / 4)
      const node = {
        id: nodeId,
        type: 'appliance',
        position: { x: snap(startX + col * spacing), y: snap(startY + row * spacing) },
        data: { ...inst, componentId: cid },
      }
      newNodes.push(node)
      if (i > 0) {
        const prevId = newNodes[i - 1].id
        const handles = pickHandles(newNodes, prevId, nodeId)
        newEdges.push({
          id: uid('edge'),
          source: prevId,
          target: nodeId,
          sourceHandle: handles.sourceHandle,
          targetHandle: handles.targetHandle,
          type: 'protocol',
          animated: false,
          markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' },
          style: { stroke: '#3b82f6', strokeWidth: 2 },
          data: {
            protocol: 'HTTP',
            label: '',
            bandwidth: '1 Gbps',
            latency: '10-50ms',
            retries: 3,
            timeout: 30,
            encrypted: true,
            notes: '',
          },
        })
      }
    })
    set({ nodes: newNodes, edges: newEdges, selectedNodeId: newNodes[0]?.id || null, templateOpen: false, selectedEdgeId: null, dirty: true })
  },

  autoLayout: () => {
    const { nodes, edges } = get()
    if (nodes.length < 2) return
    get().pushHistory()
    const archNodes = nodes.filter((n) => n.type === 'appliance')
    if (archNodes.length === 0) return
    const startX = 100
    const startY = 100
    const spacing = 180
    const cols = Math.min(archNodes.length, 4)
    const newPositions = {}
    archNodes.forEach((n, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      newPositions[n.id] = { x: snap(startX + col * spacing), y: snap(startY + row * spacing) }
    })
    set((s) => ({
      nodes: s.nodes.map((n) => newPositions[n.id] ? { ...n, position: newPositions[n.id] } : n),
      dirty: true,
    }))
  },
}))

export default useStore
