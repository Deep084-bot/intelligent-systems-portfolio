/*
 * retrieval/scorer.js - scores chunks against a user question
 * using simple keyword overlap.
 *
 * Architecture: lightweight keyword TF scoring (no embeddings, no vector DB).
 * Good enough for a portfolio-scale knowledge base. Can be swapped for
 * semantic search later if needed.
 */

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
  'may', 'might', 'shall', 'can', 'need', 'dare', 'ought', 'used',
  'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into',
  'through', 'during', 'before', 'after', 'above', 'below', 'between',
  'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'both', 'either', 'neither',
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you',
  'your', 'yours', 'yourself', 'he', 'him', 'his', 'himself', 'she',
  'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them',
  'their', 'theirs', 'themselves',
  'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those',
  'am', 'about', 'if', 'then', 'than', 'too', 'very', 'just', 'also',
  'how', 'why', 'when', 'where', 'here', 'there',
  'some', 'any', 'all', 'each', 'every', 'both', 'few', 'more', 'most',
  'other', 'such', 'no', 'only', 'own', 'same',
  'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further',
  'once', 'here', 'there', 'tell', 'please', 'like', 'get', 'make',
  'know', 'see', 'think', 'want', 'give', 'take', 'come', 'go', 'use',
  'find', 'ask', 'work', 'seem', 'feel', 'try', 'leave', 'call',
  'whats', 'what\'s', 'dont', 'don\'t', 'doesnt', 'doesn\'t',
]);

function extractKeywords(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOP_WORDS.has(w));
}

function scoreChunk(chunk, questionKeywords) {
  if (!chunk || !questionKeywords.length) return 0;

  const chunkKeywords = extractKeywords(chunk.content);
  const allKeywords = [
    ...new Set([
      ...chunkKeywords,
      ...(Array.isArray(chunk.keywords) ? chunk.keywords.map(k => k.toLowerCase()) : []),
    ]),
  ];

  let overlap = 0;
  for (const qWord of questionKeywords) {
    for (const cWord of allKeywords) {
      // Exact match
      if (qWord === cWord) {
        overlap += 2;
        continue;
      }
      // Substring match (e.g., "postgres" matches "postgresql")
      if (qWord.length > 3 && (qWord.includes(cWord) || cWord.includes(qWord))) {
        overlap += 1;
        continue;
      }
    }
  }

  // Boost for source weight
  const weightBoost = (chunk.weight || 1) * 0.5;

  return overlap + weightBoost;
}

export function rankChunks(chunks, question, topN = 8) {
  if (!Array.isArray(chunks) || !chunks.length) return [];
  const qKeywords = extractKeywords(question);
  if (!qKeywords.length) return chunks.filter(Boolean).slice(0, topN);

  const scored = chunks
    .filter(Boolean)
    .map(c => ({
      chunk: c,
      score: scoreChunk(c, qKeywords),
    }));

  scored.sort((a, b) => b.score - a.score);
  const selected = scored.filter(s => s.score > 0).slice(0, topN);

  return selected.map(s => s.chunk);
}

// Returns top score for normalization (useful for logging)
export function getTopScore(chunks, question) {
  if (!Array.isArray(chunks) || !chunks.length) return 0;
  const qKeywords = extractKeywords(question);
  if (!qKeywords.length) return 0;
  let max = 0;
  for (const c of chunks) {
    const s = scoreChunk(c, qKeywords);
    if (s > max) max = s;
  }
  return max;
}
