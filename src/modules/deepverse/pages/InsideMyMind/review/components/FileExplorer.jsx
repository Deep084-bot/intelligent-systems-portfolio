export default function FileExplorer({ files, activePath, comments, onSelect }) {
  const additions = files.reduce((s, f) => s + f.lines.filter((l) => l.type === 'add').length, 0)
  const deletions = files.reduce((s, f) => s + f.lines.filter((l) => l.type === 'remove').length, 0)

  return (
    <div className="flex flex-col rounded-xl overflow-hidden h-full" style={{ background: 'rgba(13,13,17,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="px-3 py-2 border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(16,16,20,0.6)' }}>
        <div className="text-[9px] font-mono uppercase tracking-wider text-neutral-600">Changed files</div>
        <div className="text-[9px] font-mono mt-0.5">
          <span className="text-emerald-500/80">+{additions}</span>
          <span className="text-neutral-700"> / </span>
          <span className="text-red-500/80">−{deletions}</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-1.5">
        {files.map((f) => {
          const addCount = f.lines.filter((l) => l.type === 'add').length
          const delCount = f.lines.filter((l) => l.type === 'remove').length
          const commentCount = comments.filter((c) => c.file === f.path).length
          const active = activePath === f.path
          return (
            <button
              key={f.path}
              onClick={() => onSelect(f.path)}
              className="w-full text-left px-3 py-1.5 flex items-center justify-between gap-2"
              style={{ background: active ? 'rgba(109,92,252,0.12)' : 'transparent', borderLeft: active ? '2px solid #6d5cfc' : '2px solid transparent' }}
            >
              <div className="min-w-0">
                <div className="text-[10.5px] font-mono truncate" style={{ color: active ? '#e4e4e7' : '#a1a1aa' }}>
                  {f.path.split('/').pop()}
                </div>
                <div className="text-[8.5px] font-mono text-neutral-600 truncate">{f.path}</div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 text-[8.5px] font-mono">
                {commentCount > 0 && <span style={{ color: '#d4af37' }}>{commentCount}c</span>}
                <span className="text-emerald-500/70">+{addCount}</span>
                {delCount > 0 && <span className="text-red-500/70">−{delCount}</span>}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
