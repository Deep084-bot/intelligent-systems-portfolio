/*
 * classifiers/index.js - detects the category of a user question.
 *
 * Uses keyword/regex heuristics with scoring.
 * Returns one of: projects, backend, databases, devops, dsa, learning, ai, system-design, general.
 *
 * Architecture decision: lightweight keyword matching avoids the cost and latency
 * of an LLM-based classifier. Good enough for routing to the right context chunks.
 */

const PATTERNS = {
  projects: [
    /project/, /portfolio/, /built/, /build/, /develop(ed|ing)/,
    /application/, /what (tech|tools?|framework|library|language)/,
    /\bstack\b/, /tech.?stack/,
  ],

  backend: [
    /backend/, /\bapi\b/, /endpoint/, /route/, /middleware/,
    /authentication/, /authorization/, /jwt/, /login/, /signup/,
    /node\.?js/, /express/, /server/, /rest(ful)?/,
    /how.*(built|design|work|architect).*(api|backend|server)/,
  ],

  databases: [
    /database/, /sql/, /nosql/, /postgres(ql)?/, /mongodb/, /redis/,
    /schema/, /query/, /indexing/, /normalization/, /table/, /migration/,
    /data.*model/, /transaction/,
  ],

  devops: [
    /devops/, /deploy/, /docker/, /container/, /ci\/cd/, /pipeline/,
    /github actions/, /cloud/, /hosting/, /vercel/, /render/,
    /linux/, /nginx/, /monitoring/,
  ],

  dsa: [
    /\bdsa\b/, /data structure/, /algorithm/, /problem.?solv/,
    /leetcode/, /codechef/, /coding/, /competitive/,
    /(how many|solved|problems|questions)/,
    /rating/, /\brank\b/, /streak/, /accuracy/,
    /arrays/, /strings/, /tree/, /graph/, /dynamic programming/, /dp\b/,
  ],

  learning: [
    /(currently )?learning/, /studying/, /what are you (doing|up to|working on)/,
    /goals/, /aspirations/, /career/, /future/, /direction/,
    /interests/, /curious about/, /exploring/,
    /technolog(y|ies) (are you|do you)/,
    /roadmap/, /learn (next|more)/,
  ],

  ai: [
    /\bai\b/, /artificial intelligence/, /machine learning/, /\bml\b/,
    /assistant/, /chatbot/, /gemini/, /groq/, /\bllm\b/, /\bmodel\b/,
    /intelligent/, /rag\b/, /vector/, /embedding/,
    /how.*(built|build|create|design|work).*(ai|assistant|chat|intel)/,
  ],

  'system-design': [
    /system.?design/, /distributed/, /scalab/, /architecture/,
    /microservice/, /load balanc/, /cache/, /consistent.?hash/,
    /cap theorem/, /consensus/, /raft\b/, /paxos/,
    /high.?availab/, /fault.?toleran/, /partition/,
    /how.*(design|architect|scale).*(system|app)/,
  ],
};

const CATEGORY_WEIGHTS = {
  projects: 3, backend: 3, databases: 3, devops: 3,
  dsa: 4, learning: 3, ai: 3, 'system-design': 3,
};

export function detectCategory(query) {
  if (!query || typeof query !== 'string') return 'general';
  const q = query.toLowerCase().trim();
  if (!q) return 'general';

  const scores = {};

  for (const [cat, patterns] of Object.entries(PATTERNS)) {
    scores[cat] = 0;
    for (const pat of patterns) {
      if (pat.test(q)) {
        scores[cat] += CATEGORY_WEIGHTS[cat] || 3;
      }
    }
  }

  const maxScore = Math.max(...Object.values(scores), 0);
  if (maxScore === 0) return 'general';

  const tied = Object.entries(scores)
    .filter(([, s]) => s === maxScore)
    .map(([k]) => k);

  // Precedence: dsa > backend > projects > system-design > ai > databases > devops > learning > general
  const precedence = ['dsa', 'backend', 'projects', 'system-design', 'ai', 'databases', 'devops', 'learning'];
  for (const cat of precedence) {
    if (tied.includes(cat)) return cat;
  }

  return tied[0] || 'general';
}

export function getAllCategories() {
  return Object.keys(PATTERNS);
}
