import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  Search,
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
  Menu,
  X,
} from 'lucide-react';
import { getFileContent, getNotesTree } from '../services/github';
import MarkdownRenderer from '../components/molecules/MarkdownRenderer';

const FILE_CACHE_KEY = 'hb-file-cache';

function getFileCache() {
  try {
    const raw = sessionStorage.getItem(FILE_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setFileCache(path, content) {
  try {
    const cache = getFileCache();
    cache[path] = { content, ts: Date.now() };
    sessionStorage.setItem(FILE_CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

function SidebarTree({ categories, selectedPath, onSelect, searchQuery }) {
  const [openFolders, setOpenFolders] = useState(() => {
    const initial = {};
    const keys = Object.keys(categories);
    if (keys.length <= 5) keys.forEach(k => (initial[k] = true));
    return initial;
  });

  const toggleFolder = (name) => {
    setOpenFolders(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const q = searchQuery.toLowerCase().trim();

  return (
    <div className="space-y-0.5">
      {Object.entries(categories)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([folder, notes]) => {
          const filtered = q
            ? notes.filter(
                n =>
                  n.name.toLowerCase().includes(q) ||
                  folder.toLowerCase().includes(q)
              )
            : notes;

          if (q && filtered.length === 0 && !folder.toLowerCase().includes(q)) {
            return null;
          }

          const isOpen = openFolders[folder] || q.length > 0;

          return (
            <div key={folder}>
              <button
                onClick={() => toggleFolder(folder)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 rounded-lg transition group"
              >
                {isOpen ? (
                  <ChevronDown size={12} className="shrink-0" />
                ) : (
                  <ChevronRight size={12} className="shrink-0" />
                )}
                {isOpen ? (
                  <FolderOpen size={14} className="shrink-0 text-accent-400" />
                ) : (
                  <Folder size={14} className="shrink-0 text-neutral-500" />
                )}
                <span className="truncate">{folder.replace(/-/g, ' ')}</span>
                <span className="ml-auto text-[10px] text-neutral-600">
                  {notes.length}
                </span>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="ml-4 border-l border-neutral-800/50 pl-2 space-y-0.5">
                      {filtered.map((note) => (
                        <button
                          key={note.path}
                          onClick={() => onSelect(note)}
                          className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg transition group ${
                            selectedPath === note.path
                              ? 'bg-accent-500/10 text-accent-400 border border-accent-500/20'
                              : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/30 border border-transparent'
                          }`}
                        >
                          <FileText size={12} className="shrink-0" />
                          <span className="truncate">{note.name}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
    </div>
  );
}

function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-0.5 z-50">
      <motion.div
        className="h-full bg-gradient-to-r from-accent-400 to-primary-400"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
}

export function HandbookPage({ onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [content, setContent] = useState(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    const loadTree = async () => {
      try {
        const tree = await getNotesTree();
        setData(tree);
        const firstNote = Object.values(tree.notes).flat()[0];
        if (firstNote) {
          setSelectedNote(firstNote);
        }
      } catch (err) {
        setError(err.message || 'Failed to load handbook');
      } finally {
        setLoading(false);
      }
    };
    loadTree();
  }, []);

  useEffect(() => {
    if (!selectedNote) return;
    const loadContent = async () => {
      setContentLoading(true);
      const cache = getFileCache();
      if (cache[selectedNote.path]) {
        setContent(cache[selectedNote.path].content);
        setContentLoading(false);
        return;
      }
      try {
        const text = await getFileContent(selectedNote.path);
        setFileCache(selectedNote.path, text);
        setContent(text);
      } catch (err) {
        setContent('*Failed to load this note.*');
      } finally {
        setContentLoading(false);
      }
    };
    loadContent();
  }, [selectedNote]);

  const handleSelectNote = useCallback((note) => {
    setSelectedNote(note);
    setMobileSidebar(false);
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
      window.scrollTo(0, 0);
    }
  }, []);

  const categories = data?.notes || {};

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-neutral-700 border-t-primary-400 rounded-full animate-spin mx-auto" />
          <p className="text-neutral-500 text-sm mt-4 font-mono">Loading handbook...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <BookOpen className="w-12 h-12 text-neutral-600 mx-auto" />
          <p className="text-neutral-500 text-sm font-mono">{error}</p>
          <button
            onClick={onBack}
            className="text-accent-400 hover:text-accent-300 text-sm font-mono transition"
          >
            ← Back to portfolio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      <ReadingProgress />

      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-neutral-950/95 backdrop-blur-sm border-b border-neutral-800/50">
        <div className="flex items-center gap-3 px-4 h-14">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs text-neutral-400 hover:text-neutral-200 transition font-mono shrink-0"
          >
            <ArrowLeft size={14} />
            Back
          </button>

          <div className="h-4 w-px bg-neutral-800" />

          <div className="flex items-center gap-2 text-sm font-semibold text-neutral-100 min-w-0">
            <BookOpen size={16} className="text-accent-400 shrink-0" />
            <span className="truncate">Engineering Handbook</span>
          </div>

          <div className="flex-1" />

          {/* Desktop search */}
          <div className="hidden md:flex relative w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search notes..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-neutral-300 placeholder-neutral-600 font-mono focus:outline-none focus:border-accent-500/40 transition"
            />
          </div>

          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setMobileSidebar(!mobileSidebar)}
            className="md:hidden text-neutral-400 hover:text-neutral-200 transition p-1"
          >
            {mobileSidebar ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Mobile search */}
        <div className="md:hidden px-4 pb-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search notes..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-xs text-neutral-300 placeholder-neutral-600 font-mono focus:outline-none focus:border-accent-500/40 transition"
            />
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col w-72 border-r border-neutral-800/50 bg-neutral-950/50 shrink-0">
          <div className="flex-1 overflow-y-auto p-3">
            <SidebarTree
              categories={categories}
              selectedPath={selectedNote?.path}
              onSelect={handleSelectNote}
              searchQuery={search}
            />
          </div>
        </aside>

        {/* Mobile sidebar drawer */}
        <AnimatePresence>
          {mobileSidebar && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 z-30 md:hidden"
                onClick={() => setMobileSidebar(false)}
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed left-0 top-14 bottom-0 w-72 bg-neutral-950 border-r border-neutral-800/50 z-40 md:hidden"
              >
                <div className="h-full overflow-y-auto p-3">
                  <SidebarTree
                    categories={categories}
                    selectedPath={selectedNote?.path}
                    onSelect={handleSelectNote}
                    searchQuery={search}
                  />
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main content */}
        <main
          ref={contentRef}
          className="flex-1 overflow-y-auto min-w-0"
        >
          <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
            {contentLoading ? (
              <div className="space-y-4">
                <div className="h-8 w-3/4 bg-neutral-800 animate-pulse rounded" />
                <div className="h-4 w-1/2 bg-neutral-800 animate-pulse rounded" />
                <div className="space-y-2 pt-4">
                  <div className="h-3 w-full bg-neutral-800 animate-pulse rounded" />
                  <div className="h-3 w-11/12 bg-neutral-800 animate-pulse rounded" />
                  <div className="h-3 w-4/5 bg-neutral-800 animate-pulse rounded" />
                  <div className="h-3 w-full bg-neutral-800 animate-pulse rounded" />
                  <div className="h-3 w-3/4 bg-neutral-800 animate-pulse rounded" />
                </div>
              </div>
            ) : content ? (
              <MarkdownRenderer content={content} />
            ) : (
              <div className="text-center py-16">
                <BookOpen className="w-12 h-12 mx-auto text-neutral-700 mb-4" />
                <p className="text-neutral-500 text-sm font-mono">
                  Select a note from the sidebar to start reading.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default HandbookPage;
