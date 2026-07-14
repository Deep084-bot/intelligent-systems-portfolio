import { FileText, Folder } from 'lucide-react';
import { cn } from '../../utils';

export function HandbookSidebar({
  categories,
  notes,
  activeCategory,
  activeNote,
  onCategoryClick,
  onNoteClick,
}) {
  return (
    <div className="w-full h-full overflow-y-auto font-mono">
      <div className="p-4">
        <div className="text-accent-400 text-xs uppercase tracking-wider mb-4">
          Categories
        </div>
        <nav className="space-y-1">
          {categories.map((cat) => {
            const catNotes = notes[cat] || [];
            const isActive = activeCategory === cat;
            return (
              <div key={cat}>
                <button
                  onClick={() => onCategoryClick(cat)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded text-xs transition',
                    isActive
                      ? 'bg-neutral-800 text-accent-400'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                  )}
                >
                  <Folder size={14} className="shrink-0" />
                  <span className="truncate">{cat}</span>
                  <span className="ml-auto text-[10px] text-neutral-600">
                    {catNotes.length}
                  </span>
                </button>
                {isActive && (
                  <div className="ml-4 mt-1 space-y-0.5 border-l border-neutral-800 pl-2">
                    {catNotes.map((note) => (
                      <button
                        key={note.path}
                        onClick={() => onNoteClick(note)}
                        className={cn(
                          'w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition',
                          activeNote?.path === note.path
                            ? 'text-accent-400 bg-neutral-800/50'
                            : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/30'
                        )}
                      >
                        <FileText size={12} className="shrink-0" />
                        <span className="truncate">{note.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export default HandbookSidebar;
