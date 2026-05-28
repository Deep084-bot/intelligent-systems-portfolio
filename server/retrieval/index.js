import { loadAll } from '../context/loader.js';
import { chunkAll } from './chunker.js';
import { rankChunks } from './scorer.js';

const MAX_CONTEXT_CHARS = 3500;
const MIN_CONTEXT_CHARS = 500;

function safeText(val) {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

function dedupeChunks(chunks) {
  const seen = new Set();
  const out = [];
  for (const c of chunks) {
    const key = c.id || c.content?.slice(0, 80);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}

/*
 * Retrieval provides ONLY technical depth — projects, skills, architecture.
 * Identity is handled exclusively by the system prompt (prompt/builder.js).
 * This separation prevents conflicting signals.
 */
function assembleContext(selectedChunks) {
  const parts = [];
  let totalLen = 0;

  for (const chunk of selectedChunks) {
    const text = safeText(chunk && chunk.content);
    if (!text) continue;

    const withGap = (parts.length > 0 ? '\n\n' : '') + text;
    if (totalLen + withGap.length > MAX_CONTEXT_CHARS) break;

    parts.push(text);
    totalLen += withGap.length;
  }

  if (totalLen < MIN_CONTEXT_CHARS && selectedChunks.length > 0) {
    const extra = selectedChunks.slice(0, 6);
    for (const chunk of extra) {
      const text = safeText(chunk && chunk.content);
      if (!text) continue;
      const withGap = (parts.length > 0 ? '\n\n' : '') + text;
      if (totalLen + withGap.length > MAX_CONTEXT_CHARS) break;
      if (parts.includes(text)) continue;
      parts.push(text);
      totalLen += withGap.length;
    }
  }

  return parts.join('\n\n');
}

export async function retrieveRelevantContext({ category, query } = {}) {
  const cat = category || 'general';
  const q = query || '';

  let data;
  try {
    data = await loadAll();
  } catch (loadErr) {
    console.error(JSON.stringify({
      event: 'retrieval_load_error', msg: loadErr.message, stack: loadErr.stack?.slice(0, 500),
    }));
    throw loadErr;
  }

  if (!data) {
    console.error(JSON.stringify({ event: 'retrieval_no_data' }));
    return { context: '', category: cat, chunkCount: 0, sources: [], contextLength: 0 };
  }

  let allChunks;
  try {
    allChunks = chunkAll(data);
  } catch (chunkErr) {
    console.error(JSON.stringify({
      event: 'retrieval_chunk_error', msg: chunkErr.message, stack: chunkErr.stack?.slice(0, 500),
    }));
    throw chunkErr;
  }

  let catFiltered;
  try {
    catFiltered = allChunks.filter(c => {
      if (!c || !Array.isArray(c.category)) return cat === 'general';
      return c.category.includes(cat) || c.category.includes('general');
    });
  } catch (filterErr) {
    console.error(JSON.stringify({
      event: 'retrieval_filter_error', msg: filterErr.message, stack: filterErr.stack?.slice(0, 500),
    }));
    throw filterErr;
  }

  let ranked;
  try {
    ranked = rankChunks(catFiltered, q, 10);
  } catch (rankErr) {
    console.error(JSON.stringify({
      event: 'retrieval_rank_error', msg: rankErr.message, stack: rankErr.stack?.slice(0, 500),
    }));
    throw rankErr;
  }

  let deduped;
  try {
    deduped = dedupeChunks(ranked);
  } catch (dedupeErr) {
    console.error(JSON.stringify({
      event: 'retrieval_dedupe_error', msg: dedupeErr.message, stack: dedupeErr.stack?.slice(0, 500),
    }));
    throw dedupeErr;
  }

  let context;
  try {
    context = assembleContext(deduped);
  } catch (assembleErr) {
    console.error(JSON.stringify({
      event: 'retrieval_assemble_error', msg: assembleErr.message, stack: assembleErr.stack?.slice(0, 500),
    }));
    throw assembleErr;
  }

  // If retrieval returned nothing, return empty — identity is handled by system prompt
  if (!context || context.trim().length < 50) {
    console.log(JSON.stringify({ event: 'retrieval_empty', category: cat }));
    return {
      context: '',
      category: cat,
      chunkCount: 0,
      sources: [],
      contextLength: 0,
    };
  }

  console.log(JSON.stringify({
    event: 'retrieval',
    category: cat,
    totalChunks: allChunks.length,
    categoryFiltered: catFiltered.length,
    rankedReturned: ranked.length,
    finalContextLen: context.length,
    sourceTypes: [...new Set(deduped.map(c => c.source))],
  }));

  return {
    context,
    category: cat,
    chunkCount: deduped.length,
    sources: [...new Set(deduped.map(c => c.source))],
    contextLength: context.length,
  };
}
