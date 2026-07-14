import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ExternalLink, ChevronLeft, ChevronRight, BookOpen, FileText } from 'lucide-react';
import { getNotesTree, getFileContent, clearCache } from '../../services/github';
import { MarkdownRenderer } from './MarkdownRenderer';
import { HandbookSidebar } from './HandbookSidebar';
import { Spinner } from '../primitives';
import { cn } from '../../utils';

const LS_KEY = 'hb-last-state';

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractHeadings(content) {
  return (content.match(/^#{1,3}\s+(.+)$/gm) || []).map(h => h.replace(/^#+\s+/, '').trim());
}

function Breadcrumb({ category, noteName }) {
  return (
    <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
      <span className="text-neutral-600">{category}</span>
      <span className="text-neutral-700">&gt;</span>
      <span className="text-neutral-600">{noteName}</span>
    </div>
  );
}

function applyFilter(tree, filter) {
  if (!filter || !filter.relatedNotes || filter.relatedNotes.length === 0) {
    return tree;
  }
  const keywords = filter.relatedNotes.map(k => k.toLowerCase());
  const filteredNotes = {};
  for (const [category, notes] of Object.entries(tree.notes)) {
    const matching = notes.filter(note =>
      keywords.some(keyword => note.name.toLowerCase().includes(keyword))
    );
    if (matching.length > 0) {
      filteredNotes[category] = matching;
    }
  }
  return {
    ...tree,
    notes: filteredNotes,
    categories: Object.keys(filteredNotes).sort(),
    totalNotes: Object.values(filteredNotes).reduce((s, a) => s + a.length, 0),
  };
}

function saveLastState(category, note) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ category, path: note?.path }));
  } catch {}
}

function loadLastState() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY));
  } catch {
    return null;
  }
}

export function HandbookReader({ initialNote, onClose, filter }) {
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAll, setShowAll] = useState(false);

  const [activeCategory, setActiveCategory] = useState(null);
  const [activeNote, setActiveNote] = useState(null);
  const [noteContent, setNoteContent] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedResultIdx, setSelectedResultIdx] = useState(0);
  const [headingsCache, setHeadingsCache] = useState({});
  const searchRef = useRef(null);

  const displayTree = useMemo(() => {
    if (!tree) return null;
    if (showAll || !filter) return tree;
    return applyFilter(tree, filter);
  }, [tree, filter, showAll]);

  const isFiltered = !showAll && !!filter;

  const searchIndex = useMemo(() => {
    if (!tree) return [];
    const index = [];
    for (const [cat, notes] of Object.entries(tree.notes)) {
      for (const note of notes) {
        index.push({ ...note, category: cat });
      }
    }
    return index;
  }, [tree]);

  const searchResults = useMemo(() => {
    if (!searchQuery || !searchIndex.length) return [];
    const q = searchQuery.toLowerCase();
    return searchIndex
      .map(item => {
        const nameMatch = item.name.toLowerCase().includes(q);
        const catMatch = item.category.toLowerCase().includes(q);
        const cachedHeadings = headingsCache[item.path] || [];
        const headingMatches = cachedHeadings.filter(h => h.toLowerCase().includes(q));
        const score = (nameMatch ? 3 : 0) + (catMatch ? 1 : 0) + (headingMatches.length ? 1 : 0);
        return {
          ...item,
          score,
          headingMatches,
          matchReason: nameMatch ? 'title' : headingMatches.length ? 'heading' : catMatch ? 'category' : null,
        };
      })
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 30);
  }, [searchQuery, searchIndex, headingsCache]);

  const categoriesByCount = useMemo(() => {
    if (!tree) return [];
    return Object.entries(tree.notes)
      .sort((a, b) => b[1].length - a[1].length)
      .map(([cat]) => cat)
      .slice(0, 8);
  }, [tree]);

  const recentNotes = useMemo(() => {
    if (!searchIndex.length) return [];
    return searchIndex.slice(0, 5);
  }, [searchIndex]);

  useEffect(() => {
    setSelectedResultIdx(0);
  }, [searchResults]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const t = await getNotesTree();
        setTree(t);
        const target = filter && !showAll ? applyFilter(t, filter) : t;
        if (target.categories.length > 0) {
          if (initialNote) {
            const noteExists = Object.values(target.notes).some(notes =>
              notes.some(n => n.path === initialNote.path)
            );
            if (noteExists) {
              setActiveNote(initialNote);
              setActiveCategory(initialNote.category);
              return;
            }
          }
          const saved = !initialNote ? loadLastState() : null;
          if (saved?.path) {
            for (const [cat, notes] of Object.entries(t.notes)) {
              const found = notes.find(n => n.path === saved.path);
              if (found) {
                setActiveCategory(cat);
                setActiveNote(found);
                return;
              }
            }
          }
          const firstCat = target.categories[0];
          setActiveCategory(firstCat);
          const catNotes = target.notes[firstCat] || [];
          if (catNotes.length > 0) {
            setActiveNote(catNotes[0]);
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [initialNote]);

  useEffect(() => {
    if (!activeNote) return;
    async function loadContent() {
      setNoteLoading(true);
      try {
        const content = await getFileContent(activeNote.path);
        setNoteContent(content);
        setHeadingsCache(prev => {
          if (prev[activeNote.path]) return prev;
          return { ...prev, [activeNote.path]: extractHeadings(content) };
        });
      } catch (err) {
        setNoteContent(`*Failed to load: ${err.message}*`);
      } finally {
        setNoteLoading(false);
      }
    }
    loadContent();
  }, [activeNote]);

  useEffect(() => {
    if (activeNote) {
      saveLastState(activeCategory, activeNote);
    }
  }, [activeNote, activeCategory]);

  useEffect(() => {
    if (!searchQuery && !searchFocused) return;
    const handler = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedResultIdx(i => Math.min(i + 1, (searchResults.length || 1) - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedResultIdx(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        const result = searchResults[selectedResultIdx];
        if (result) {
          e.preventDefault();
          setActiveCategory(result.category);
          setActiveNote(result);
          setSearchQuery('');
          setSearchFocused(false);
          searchRef.current?.blur();
        }
      } else if (e.key === 'Escape') {
        if (searchQuery) {
          e.preventDefault();
          setSearchQuery('');
        } else {
          setSearchFocused(false);
          searchRef.current?.blur();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [searchQuery, searchFocused, searchResults, selectedResultIdx]);

  const currentCategoryNotes = useMemo(() => {
    if (!displayTree || !activeCategory) return [];
    return displayTree.notes[activeCategory] || [];
  }, [displayTree, activeCategory]);

  const currentIndex = useMemo(() => {
    return currentCategoryNotes.findIndex(n => n.path === activeNote?.path);
  }, [currentCategoryNotes, activeNote]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setActiveNote(currentCategoryNotes[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (currentIndex < currentCategoryNotes.length - 1) {
      setActiveNote(currentCategoryNotes[currentIndex + 1]);
    }
  };

  const handleRefresh = async () => {
    clearCache();
    setLoading(true);
    try {
      const t = await getNotesTree();
      setTree(t);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBrowseAll = () => {
    setShowAll(true);
    if (tree?.categories.length > 0) {
      setActiveCategory(tree.categories[0]);
      const catNotes = tree.notes[tree.categories[0]] || [];
      setActiveNote(catNotes[0] || null);
    }
  };

  const handleChipClick = (cat) => {
    setSearchQuery(cat);
    setSearchFocused(true);
    searchRef.current?.focus();
  };

  const handleResultClick = (result) => {
    setActiveCategory(result.category);
    setActiveNote(result);
    setSearchQuery('');
    setSearchFocused(false);
    searchRef.current?.blur();
  };

  const isEmptyFiltered = isFiltered && displayTree && displayTree.totalNotes === 0;
  const showingSearch = !loading && !error && (searchQuery || searchFocused);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-neutral-900 h-full flex flex-col"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 30, opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Top Bar */}
          <div className="sticky top-0 z-10 bg-neutral-900/95 backdrop-blur-sm border-b border-neutral-800/50">
            <div className="flex items-center justify-between px-4 sm:px-6 h-14">
              <div className="flex items-center gap-3 min-w-0">
                <BookOpen size={18} className="text-accent-400 shrink-0" />
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-mono text-neutral-300 whitespace-nowrap">
                    Engineering Handbook
                  </span>
                  {isFiltered && filter && (
                    <>
                      <span className="text-neutral-700 text-xs shrink-0">·</span>
                      <span className="text-[11px] font-mono text-accent-400 truncate">
                        {filter.projectName}
                      </span>
                      <span className="text-neutral-600 text-[11px] font-mono whitespace-nowrap">
                        {displayTree.totalNotes} Notes
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isFiltered && !showingSearch && (
                  <button
                    onClick={handleBrowseAll}
                    className="text-[11px] text-neutral-500 hover:text-accent-400 font-mono px-2 py-1 rounded border border-neutral-800 hover:border-accent-400/30 transition"
                  >
                    Browse All
                  </button>
                )}
                <button
                  onClick={handleRefresh}
                  className="text-[11px] text-neutral-500 hover:text-neutral-300 font-mono px-2 py-1 rounded border border-neutral-800 hover:border-neutral-700 transition"
                  title="Refresh from GitHub"
                >
                  sync
                </button>
                <button
                  onClick={onClose}
                  className="text-neutral-500 hover:text-neutral-300 transition p-1"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="border-b border-neutral-800/50">
            <div className="flex items-center gap-3 px-4 sm:px-6 h-11">
              <Search size={14} className="text-neutral-600 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                placeholder="Search engineering notes..."
                className="flex-1 bg-transparent text-sm font-mono text-neutral-300 placeholder-neutral-600 outline-none border-none"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); searchRef.current?.focus(); }}
                  className="text-neutral-600 hover:text-neutral-400 transition"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Spinner size="lg" />
                <p className="text-neutral-500 text-sm mt-4 font-mono">loading handbook...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="p-6 bg-neutral-950 border border-neutral-800 rounded-lg font-mono text-sm max-w-md">
                <div className="text-accent-400 mb-2">[handbook.error]</div>
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded text-red-400/80">
                  {error}
                </div>
              </div>
            </div>
          ) : isEmptyFiltered ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center font-mono">
                <BookOpen size={40} className="mx-auto text-neutral-700 mb-4" />
                <p className="text-neutral-400 text-sm mb-1">
                  No engineering documentation available yet.
                </p>
                <p className="text-neutral-600 text-xs mb-6">
                  Notes matching this project will appear here once published.
                </p>
                <button
                  onClick={handleBrowseAll}
                  className="inline-flex items-center gap-1.5 text-xs text-accent-400 hover:text-accent-300 font-mono transition border border-accent-400/30 hover:border-accent-400/50 rounded-lg px-4 py-2"
                >
                  Open Full Handbook →
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar / Search Results */}
              <aside className="w-60 lg:w-72 border-r border-neutral-800/50 overflow-y-auto hidden md:block shrink-0">
                {showingSearch && searchQuery ? (
                  searchResults.length > 0 ? (
                    <div className="p-4 font-mono">
                      <div className="text-[10px] text-neutral-600 uppercase tracking-wider mb-3">
                        Search Results
                      </div>
                      <div className="space-y-0.5">
                        {searchResults.map((result, idx) => (
                          <button
                            key={result.path}
                            onClick={() => handleResultClick(result)}
                            className={cn(
                              'w-full flex flex-col gap-0.5 px-3 py-2 rounded text-xs transition text-left',
                              idx === selectedResultIdx
                                ? 'bg-neutral-800 text-accent-400'
                                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                            )}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText size={12} className="shrink-0" />
                              <span className="truncate font-medium">{result.name}</span>
                            </div>
                            <div className="flex items-center gap-2 ml-5 min-w-0">
                              <span className="text-[10px] text-neutral-600 truncate">{result.category}</span>
                              {result.headingMatches?.length > 0 && (
                                <span className="text-[10px] text-accent-500/70 truncate">
                                  Matched: {result.headingMatches[0]}
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                      <div className="text-[10px] text-neutral-600 mt-3 text-center">
                        ↑↓ Navigate · Enter Open · Esc Close
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-xs font-mono text-neutral-600">No notes found.</p>
                    </div>
                  )
                ) : showingSearch && !searchQuery ? (
                  <div className="overflow-y-auto h-full font-mono">
                    {/* Recent notes */}
                    <div className="p-4 pb-2">
                      <div className="text-[10px] text-neutral-600 uppercase tracking-wider mb-2">
                        Recently Added
                      </div>
                      <div className="space-y-0.5">
                        {recentNotes.map(note => (
                          <button
                            key={note.path}
                            onClick={() => handleResultClick(note)}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-neutral-400 hover:text-accent-400 hover:bg-neutral-800/50 transition text-left"
                          >
                            <FileText size={12} className="shrink-0" />
                            <span className="truncate">{note.name}</span>
                            <span className="ml-auto text-[10px] text-neutral-600 shrink-0">{note.category}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Category chips */}
                    <div className="px-4 pt-2 border-t border-neutral-800/30">
                      <div className="text-[10px] text-neutral-600 uppercase tracking-wider mb-2.5 pt-2">
                        Categories
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {categoriesByCount.map(cat => (
                          <button
                            key={cat}
                            onClick={() => handleChipClick(cat)}
                            className="px-2.5 py-1 text-[11px] font-mono rounded-full bg-neutral-800/50 border border-neutral-700/50 text-neutral-400 hover:text-accent-400 hover:border-accent-400/30 transition"
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <HandbookSidebar
                    categories={displayTree.categories}
                    notes={displayTree.notes}
                    activeCategory={activeCategory}
                    activeNote={activeNote}
                    onCategoryClick={setActiveCategory}
                    onNoteClick={(note) => {
                      setActiveCategory(note.category || activeCategory);
                      setActiveNote(note);
                    }}
                  />
                )}
              </aside>

              {/* Main Area */}
              <main className="flex-1 overflow-y-auto">
                {activeNote ? (
                  <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {/* Breadcrumb */}
                    <div className="mb-6 flex items-center justify-between">
                      <Breadcrumb
                        category={activeCategory}
                        noteName={activeNote.name}
                      />
                      <a
                        href={`https://github.com/Deep084-bot/engineering-notes/blob/main/${activeNote.path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[11px] text-neutral-500 hover:text-accent-400 font-mono transition"
                      >
                        <ExternalLink size={12} />
                        Open on GitHub
                      </a>
                    </div>

                    {/* Note Content */}
                    {noteLoading ? (
                      <div className="flex items-center justify-center py-20">
                        <Spinner size="md" />
                      </div>
                    ) : (
                      <div className="prose prose-invert max-w-none">
                        <MarkdownRenderer content={noteContent} searchTerm={searchQuery} />
                      </div>
                    )}

                    {/* Navigation */}
                    <div className="mt-12 pt-6 border-t border-neutral-800/30 flex items-center justify-between">
                      <button
                        onClick={handlePrev}
                        disabled={currentIndex <= 0}
                        className="flex items-center gap-1.5 text-xs font-mono text-neutral-500 hover:text-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
                      >
                        <ChevronLeft size={14} />
                        Previous Note
                      </button>
                      <button
                        onClick={handleNext}
                        disabled={currentIndex >= currentCategoryNotes.length - 1}
                        className="flex items-center gap-1.5 text-xs font-mono text-neutral-500 hover:text-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
                      >
                        Next Note
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-neutral-500 text-sm font-mono">Select a note to read</p>
                  </div>
                )}
              </main>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default HandbookReader;
