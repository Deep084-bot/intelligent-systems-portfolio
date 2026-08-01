export default function DecisionPrompt({ node, onChoose }) {
  return (
    <div className="flex flex-col h-full">
      <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-neutral-600 mb-3">Decision</div>
      <h3 className="text-[17px] font-medium text-neutral-200 leading-snug mb-6">{node.prompt}</h3>
      <div className="space-y-2">
        {node.choices.map((choice, i) => (
          <button
            key={choice.id}
            onClick={() => onChoose(choice.id)}
            className="w-full text-left px-4 py-3 rounded-xl group transition-all hover:translate-x-1 active:scale-[0.995]"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-neutral-600">{String.fromCharCode(65 + i)}</span>
              <span className="text-[13px] text-neutral-300 group-hover:text-neutral-100">{choice.label}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
