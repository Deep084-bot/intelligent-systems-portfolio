import { motion } from 'framer-motion';
import { BookOpen, FolderOpen, Clock, ChevronRight } from 'lucide-react';
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

export function EngineeringHandbookPreview({ onViewHandbook }) {
  const { data, loading, error } = useEngineeringNotes();

  if (loading) {
    return (
      <div className="bg-neutral-950/50 border border-neutral-800 rounded-lg p-6 space-y-4">
        <div className="h-5 w-40 bg-neutral-800 animate-pulse rounded" />
        <div className="h-3 w-64 bg-neutral-800 animate-pulse rounded" />
        <div className="space-y-2 pt-2">
          <div className="h-3 w-28 bg-neutral-800 animate-pulse rounded" />
          <div className="h-3 w-24 bg-neutral-800 animate-pulse rounded" />
          <div className="h-3 w-32 bg-neutral-800 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-neutral-950/50 border border-neutral-800 rounded-lg p-6">
        <div className="text-accent-400 text-xs font-mono uppercase tracking-wider mb-2">
          Engineering Handbook
        </div>
        <p className="text-xs text-neutral-500">Unable to load handbook.</p>
      </div>
    );
  }

  if (!data || data.totalNotes === 0) {
    return (
      <div className="bg-neutral-950/50 border border-neutral-800 rounded-lg p-6">
        <div className="text-accent-400 text-xs font-mono uppercase tracking-wider mb-2">
          Engineering Handbook
        </div>
        <p className="text-xs text-neutral-500">No notes found.</p>
      </div>
    );
  }

  const previewCategories = data.categories.slice(0, 5);
  const remainingCount = Math.max(0, data.categories.length - 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-neutral-950/50 border border-neutral-800 rounded-lg p-6 h-full flex flex-col"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-primary-500/20 border border-primary-500/30 flex items-center justify-center shrink-0">
          <BookOpen className="w-5 h-5 text-primary-400" />
        </div>
        <div>
          <h3 className="text-base font-bold text-neutral-100">
            Engineering Handbook
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
            A living collection of my engineering notes, architecture writeups and learning journey.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4 text-[11px] text-neutral-500 font-mono">
        <span className="flex items-center gap-1.5">
          <BookOpen size={12} />
          {data.totalNotes} Notes
        </span>
        <span className="flex items-center gap-1.5">
          <FolderOpen size={12} />
          {data.categories.length} Categories
        </span>
        {data.latestCommitDate && (
          <span className="flex items-center gap-1.5">
            <Clock size={12} />
            {timeAgo(data.latestCommitDate)}
          </span>
        )}
      </div>

      <div className="space-y-1 mb-4 flex-1">
        {previewCategories.map((cat) => (
          <div
            key={cat}
            className="flex items-center gap-2 text-xs text-neutral-400 py-1.5 px-2 rounded hover:bg-neutral-800/30 transition"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent-400/50" />
            {cat.replace(/-/g, ' ')}
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="text-xs text-neutral-600 py-1.5 px-2">
            +{remainingCount} more...
          </div>
        )}
      </div>

      <button
        onClick={onViewHandbook}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-500/10 hover:bg-accent-500/20 text-accent-400 text-sm rounded-lg border border-accent-500/30 transition font-mono mt-auto"
      >
        Browse Handbook
        <ChevronRight size={14} />
      </button>
    </motion.div>
  );
}

export default EngineeringHandbookPreview;
