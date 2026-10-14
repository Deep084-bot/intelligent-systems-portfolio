import { memo, useState, useCallback, useRef, useEffect } from 'react'
import useStore from './store'

const COLORS = {
  yellow: '#fef3c7',
  blue: '#dbeafe',
  green: '#d1fae5',
  pink: '#fce7f3',
}

const BORDER_COLORS = {
  yellow: '#fde68a',
  blue: '#bfdbfe',
  green: '#a7f3d0',
  pink: '#fbcfe8',
}

function CommentNode({ id, data, selected, xPos, yPos }) {
  const [text, setText] = useState(data?.text || '')
  const [editing, setEditing] = useState(false)
  const updateNodeData = useStore((s) => s.updateNodeData)
  const textareaRef = useRef(null)

  const colorName = data?.color || 'yellow'
  const bg = COLORS[colorName] || COLORS.yellow
  const border = BORDER_COLORS[colorName] || BORDER_COLORS.yellow

  const width = data?.width || 200
  const height = data?.height || 120

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [editing])

  const handleBlur = useCallback(() => {
    setEditing(false)
    updateNodeData(id, { text })
  }, [id, text, updateNodeData])

  return (
    <div
      className="rounded-xl overflow-hidden shadow-lg"
      style={{
        width,
        height,
        background: bg,
        border: `1.5px solid ${selected ? '#6d5cfc' : border}`,
        boxShadow: selected
          ? '0 0 0 2px rgba(109,92,252,0.2), 0 8px 24px rgba(0,0,0,0.15)'
          : '0 4px 12px rgba(0,0,0,0.08)',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
      onDoubleClick={() => setEditing(true)}
    >
      {/* Fold corner */}
      <div
        className="absolute"
        style={{
          top: 0,
          right: 0,
          width: 0,
          height: 0,
          borderStyle: 'solid',
          borderWidth: '0 20px 20px 0',
          borderColor: `transparent ${selected ? '#6d5cfc' : border} transparent transparent`,
          opacity: 0.3,
        }}
      />

      {/* Content */}
      {editing ? (
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Escape') handleBlur()
          }}
          className="w-full h-full bg-transparent resize-none outline-none p-3 text-[11px] leading-relaxed"
          style={{ color: '#1c1917' }}
          placeholder="Write a note..."
        />
      ) : (
        <div
          className="w-full h-full p-3 overflow-y-auto cursor-pointer"
          style={{ color: '#1c1917' }}
        >
          {text ? (
            <p className="text-[11px] leading-relaxed whitespace-pre-wrap">{text}</p>
          ) : (
            <p className="text-[11px] opacity-40 italic">Double-click to edit</p>
          )}
        </div>
      )}
    </div>
  )
}

export default memo(CommentNode)
