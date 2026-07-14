import { useState } from 'react';
import { motion } from 'framer-motion';
import { GitCommit } from 'lucide-react';
import useEngineeringNotes from '../../hooks/useEngineeringNotes';

function timeAgo(dateStr) {
  if (!dateStr) return null;
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function EngineeringHandbookPreview({ onNoteClick, onViewHandbook, activities = [] }) {
  const { data, loading, error, refetch } = useEngineeringNotes();
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    await refetch();
    setRetrying(false);
  };

  if (loading) {
    return (
      <div className="bg-neutral-950/50 border border-neutral-800 rounded-lg p-4 space-y-3">
        <div className="h-4 w-32 bg-neutral-800 animate-pulse rounded" />
        <div className="h-3 w-24 bg-neutral-800 animate-pulse rounded" />
        <div className="space-y-2 pt-3">
          <div className="h-3 w-40 bg-neutral-800 animate-pulse rounded" />
          <div className="h-3 w-36 bg-neutral-800 animate-pulse rounded" />
          <div className="h-3 w-44 bg-neutral-800 animate-pulse rounded" />
        </div>
        <div className="h-3 w-28 bg-neutral-800 animate-pulse rounded pt-3" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-neutral-950/50 border border-neutral-800 rounded-lg p-4 font-mono text-sm">
        <div className="text-accent-400 text-xs mb-2">[engineering-handbook]</div>
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400/80 text-xs mb-3">
          {error}
        </div>
        <button
          onClick={handleRetry}
          disabled={retrying}
          className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-accent-400 text-xs rounded font-mono border border-neutral-700 transition"
        >
          {retrying ? 'retrying...' : 'retry'}
        </button>
      </div>
    );
  }

  if (!data || data.totalNotes === 0) {
    return (
      <div className="bg-neutral-950/50 border border-neutral-800 rounded-lg p-4 font-mono text-sm">
        <div className="text-accent-400 text-xs mb-2">[engineering-handbook]</div>
        <div className="text-neutral-500 text-xs">No notes found</div>
      </div>
    );
  }

  const allNotes = Object.entries(data.notes).flatMap(([cat, notes]) =>
    notes.map(n => ({ ...n, category: cat }))
  );

  const latestNotes = allNotes.slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="bg-neutral-950/50 border border-neutral-800 rounded-lg p-4"
    >
      <div className="text-accent-400 text-xs font-mono uppercase tracking-wider mb-2">
        Engineering Handbook
      </div>

      <div className="flex items-center gap-1.5 mb-4">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        <span className="text-[10px] text-neutral-500 font-mono">
          Updated {timeAgo(data.latestCommitDate) || 'recently'}
        </span>
      </div>

      <div className="text-[10px] text-neutral-600 uppercase tracking-wider font-mono mb-2">
        Latest Notes
      </div>

      <div className="space-y-1 mb-4">
        {latestNotes.map((note) => (
          <button
            key={note.path}
            onClick={() => onNoteClick?.(note)}
            className="block w-full text-left text-xs text-neutral-400 hover:text-accent-400 hover:bg-neutral-800/50 rounded px-2 py-1 transition font-mono truncate"
          >
            {note.name}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 text-[10px] text-neutral-500 font-mono mb-3">
        <span>{data.totalNotes} Notes</span>
        <span className="text-neutral-700">·</span>
        <span>{data.categories.length} Categories</span>
      </div>

      {/* Recent Commits */}
      {activities.length > 0 && (
        <div className="pt-3 border-t border-neutral-800/30 mb-3">
          <div className="text-[10px] text-neutral-600 uppercase tracking-wider font-mono mb-2 flex items-center gap-1.5">
            <GitCommit size={10} />
            Recent Commits
          </div>
          <div className="space-y-1">
            {activities.map((act, i) => (
              <div
                key={`${act.repoName}-${act.date}-${i}`}
                className="flex items-start gap-2 text-xs text-neutral-500 py-1"
              >
                <GitCommit size={10} className="shrink-0 mt-0.5 text-neutral-600" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-neutral-500 truncate">
                      {act.repoName}
                    </span>
                    <span className="text-[9px] text-neutral-600 shrink-0 ml-auto">
                      {timeAgo(act.date)}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 truncate leading-relaxed">
                    {act.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-3 border-t border-neutral-800/30">
        <button
          onClick={onViewHandbook}
          className="text-xs text-accent-400 hover:text-accent-300 font-mono transition flex items-center gap-1"
        >
          View Handbook →
        </button>
      </div>
    </motion.div>
  );
}

export default EngineeringHandbookPreview;
