import { useCallback, useState } from 'react'
import { useReactFlow, useOnViewportChange } from 'reactflow'
import useStore from './store'

function ToolBtn({ label, onClick, children, active }) {
  return (
    <button
      title={label}
      onClick={onClick}
      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all text-[13px] active:scale-95 ${
        active
          ? 'text-neutral-300 bg-[rgba(109,92,252,0.15)] shadow-sm'
          : 'text-neutral-500 hover:text-neutral-300 hover:bg-[rgba(255,255,255,0.05)]'
      }`}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="w-px h-5 mx-1" style={{ background: 'rgba(255,255,255,0.04)' }} />
}

export default function Toolbar() {
  const reactFlowInstance = useReactFlow()
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 })
  useOnViewportChange({ onChange: (v) => setViewport(v) })
  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)
  const historyIndex = useStore((s) => s.historyIndex)
  const performValidation = useStore((s) => s.performValidation)
  const toggleValidationDrawer = useStore((s) => s.toggleValidationDrawer)
  const validationResult = useStore((s) => s.validationResult)
  const gridVisible = useStore((s) => s.gridVisible)
  const snapEnabled = useStore((s) => s.snapEnabled)
  const setGridVisible = useStore((s) => s.setGridVisible)
  const setSnapEnabled = useStore((s) => s.setSnapEnabled)
  const togglePresentationMode = useStore((s) => s.togglePresentationMode)
  const presentationMode = useStore((s) => s.presentationMode)
  const setTemplateOpen = useStore((s) => s.setTemplateOpen)
  const autoLayout = useStore((s) => s.autoLayout)
  const nodes = useStore((s) => s.nodes)
  const edges = useStore((s) => s.edges)

  const zoomIn = useCallback(() => reactFlowInstance.zoomIn(), [reactFlowInstance])
  const zoomOut = useCallback(() => reactFlowInstance.zoomOut(), [reactFlowInstance])
  const fitView = useCallback(() => reactFlowInstance.fitView({ padding: 0.2, duration: 300 }), [reactFlowInstance])
  const centerView = useCallback(() => reactFlowInstance.setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 300 }), [reactFlowInstance])

  const zoomPct = Math.round((viewport?.zoom || 1) * 100)

  const handleExport = useCallback(async (format) => {
    const rfEl = document.querySelector('.react-flow__pane') || document.querySelector('.react-flow')
    if (!rfEl) return
    if (format === 'json') {
      const data = { nodes, edges }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'architecture.json'; a.click()
      URL.revokeObjectURL(url)
    }
  }, [nodes, edges])

  return (
    <div
      className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-0.5 px-2 py-1.5 rounded-xl select-none shadow-lg"
      style={{
        background: 'rgba(14,14,16,0.92)',
        border: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <ToolBtn label="Undo" onClick={undo}>
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 015 5v2M3 10l4-4m-4 4l4 4" />
        </svg>
      </ToolBtn>
      <ToolBtn label="Redo" onClick={redo}>
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a5 5 0 00-5 5v2m15-7l-4-4m4 4l-4 4" />
        </svg>
      </ToolBtn>

      <Divider />

      <ToolBtn label="Zoom Out" onClick={zoomOut}>
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
        </svg>
      </ToolBtn>
      <span className="text-[11px] font-mono font-medium text-neutral-500 w-9 text-center">{zoomPct}%</span>
      <ToolBtn label="Zoom In" onClick={zoomIn}>
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </ToolBtn>

      <Divider />

      <ToolBtn label="Fit View" onClick={fitView}>
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
        </svg>
      </ToolBtn>
      <ToolBtn label="Center" onClick={centerView}>
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="12" cy="12" r="3" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v4m0 12v4m10-10h-4M6 12H2" />
        </svg>
      </ToolBtn>

      <Divider />

      <ToolBtn label="Toggle Grid" onClick={() => setGridVisible(!gridVisible)} active={gridVisible}>
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      </ToolBtn>
      <ToolBtn label="Toggle Snap" onClick={() => setSnapEnabled(!snapEnabled)} active={snapEnabled}>
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </ToolBtn>

      <Divider />

      <ToolBtn label="Templates" onClick={() => setTemplateOpen(true)}>
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      </ToolBtn>
      <ToolBtn label="Auto Layout" onClick={autoLayout} active={false}>
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
        </svg>
      </ToolBtn>

      <Divider />

      <ToolBtn label="Validate" onClick={() => { performValidation(); toggleValidationDrawer() }}>
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      </ToolBtn>

      <ToolBtn label="Export JSON" onClick={() => handleExport('json')}>
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </ToolBtn>

      <Divider />

      <ToolBtn label={presentationMode ? 'Exit Presentation' : 'Presentation'} onClick={togglePresentationMode}>
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </ToolBtn>
    </div>
  )
}
