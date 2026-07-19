import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import cache from '../cache.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHE_TTL = parseInt(process.env.PROJECT_CACHE_TTL || '3600', 10);
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || null;
const GITHUB_RAW = 'https://raw.githubusercontent.com';

let registryCache = null;
let legacyCache = null;

async function loadRegistry() {
  if (registryCache) return registryCache;
  const regPath = path.resolve(__dirname, '..', 'projectRegistry.json');
  const raw = await fs.readFile(regPath, 'utf8');
  registryCache = JSON.parse(raw);
  return registryCache;
}

async function loadLegacyProjects() {
  if (legacyCache) return legacyCache;
  const dataPath = path.resolve(__dirname, '..', 'data', 'projects.json');
  const raw = await fs.readFile(dataPath, 'utf8');
  legacyCache = JSON.parse(raw);
  return legacyCache;
}

async function rawFetch(url) {
  const headers = {};
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  const res = await fetch(url, { headers });
  if (res.status === 404) return null;
  if (res.status === 403 || res.status === 429) {
    throw new Error('GitHub rate limit exceeded');
  }
  if (!res.ok) throw new Error(`GitHub fetch failed: ${res.status}`);
  return res;
}

async function fetchPortfolioJson(repo) {
  const cacheKey = `project:portfolio:${repo}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  let res = await rawFetch(`${GITHUB_RAW}/${repo}/main/portfolio.json`);
  if (!res) res = await rawFetch(`${GITHUB_RAW}/${repo}/master/portfolio.json`);
  if (!res) return null;

  const data = await res.json();
  await cache.set(cacheKey, data, CACHE_TTL);
  return data;
}

async function fetchReadme(repo) {
  const cacheKey = `project:readme:${repo}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  let res = await rawFetch(`${GITHUB_RAW}/${repo}/main/README.md`);
  if (!res) res = await rawFetch(`${GITHUB_RAW}/${repo}/master/README.md`);
  if (!res) return null;

  const text = await res.text();
  await cache.set(cacheKey, text, CACHE_TTL * 2);
  return text;
}

function normalizeDynamic(raw, slug) {
  return {
    id: slug,
    slug: raw.slug || slug,
    title: raw.title || slug,
    shortDescription: raw.shortDescription || raw.subtitle || '',
    image: raw.images?.thumbnail || raw.cover || `/images/projects/${slug}.png`,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    status: raw.status || 'Active',
    featured: raw.featured === true,
    priority: typeof raw.priority === 'number' ? raw.priority : 0,
    startDate: raw.startDate || null,
    endDate: raw.endDate || null,
    links: {
      github: raw.links?.github || raw.github || null,
      demo: raw.links?.demo || raw.demo || raw.live || null,
      blog: raw.links?.blog || null,
    },
    overview: {
      problem: raw.overview?.problem || '',
      solution: raw.overview?.solution || raw.summary || '',
    },
    details: {
      architecture: raw.details?.architecture || raw.architecture || '',
      technicalChallenges: raw.details?.technicalChallenges ||
        (Array.isArray(raw.highlights) ? raw.highlights : []),
      learnings: raw.details?.learnings || raw.learning?.join(' ') || '',
    },
    tech: Array.isArray(raw.tech) ? raw.tech : [],
    futureImprovements: Array.isArray(raw.futureImprovements) ? raw.futureImprovements : [],
    _source: 'dynamic',
  };
}

function normalizeLegacy(raw) {
  const detailsArch = raw.details?.architecture || raw.architecture || '';
  const detailsChallenges = raw.details?.technicalChallenges ||
    (Array.isArray(raw.challenges) ? raw.challenges : []);
  const detailsLearnings = raw.details?.learnings || raw.learnings || '';

  return {
    id: raw.id || raw.slug,
    slug: raw.slug || raw.id,
    title: raw.title || 'Untitled',
    shortDescription: raw.shortDescription || '',
    image: raw.image || `/images/projects/${raw.id || raw.slug}.png`,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    status: raw.status || 'Active',
    featured: raw.featured === true,
    priority: typeof raw.priority === 'number' ? raw.priority : 0,
    startDate: raw.startDate || null,
    endDate: raw.endDate || null,
    links: {
      github: raw.links?.github || null,
      demo: raw.links?.demo || null,
      blog: raw.links?.blog || null,
    },
    overview: {
      problem: raw.overview?.problem || '',
      solution: raw.overview?.solution || '',
    },
    details: {
      architecture: detailsArch,
      technicalChallenges: detailsChallenges,
      learnings: detailsLearnings,
    },
    tech: Array.isArray(raw.tech) ? raw.tech : [],
    futureImprovements: Array.isArray(raw.futureImprovements) ? raw.futureImprovements : [],
    _source: 'legacy',
  };
}

async function getLegacyBySlug(slug) {
  const projects = await loadLegacyProjects();
  const raw = (Array.isArray(projects) ? projects : projects.projects || [])
    .find(p => (p.slug || p.id) === slug);
  if (!raw) return null;
  return normalizeLegacy(raw);
}

function getRegistryEntry(registry, slug) {
  return registry.projects.find(p => p.slug === slug) || null;
}

export async function getAllProjects() {
  const cacheKey = 'project:all';
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const registry = await loadRegistry();
  const legacyProjects = await loadLegacyProjects();
  const legacyList = Array.isArray(legacyProjects) ? legacyProjects : legacyProjects.projects || [];
  const results = [];

  for (const entry of registry.projects) {
    try {
      if (entry.local) {
        const raw = legacyList.find(p => (p.slug || p.id) === entry.slug);
        if (raw) results.push(normalizeLegacy(raw));
      } else {
        const raw = await fetchPortfolioJson(entry.repo);
        if (raw) {
          results.push(normalizeDynamic(raw, entry.slug));
        } else {
          const fallback = legacyList.find(p => (p.slug || p.id) === entry.slug);
          if (fallback) {
            const normalized = normalizeLegacy(fallback);
            normalized._source = 'dynamic_fallback';
            results.push(normalized);
          }
        }
      }
    } catch (err) {
      console.error(JSON.stringify({
        event: 'project_metadata_error',
        slug: entry.slug,
        msg: err.message,
      }));
      const fallback = legacyList.find(p => (p.slug || p.id) === entry.slug);
      if (fallback) {
        const normalized = normalizeLegacy(fallback);
        normalized._source = 'dynamic_fallback';
        normalized._error = err.message;
        results.push(normalized);
      }
    }
  }

  results.sort((a, b) => (a.priority || 999) - (b.priority || 999));
  await cache.set(cacheKey, results, CACHE_TTL);
  return results;
}

export async function getProjectBySlug(slug) {
  const cacheKey = `project:slug:${slug}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const registry = await loadRegistry();
  const entry = getRegistryEntry(registry, slug);
  if (!entry) return null;

  try {
    let result;
    if (entry.local) {
      result = await getLegacyBySlug(slug);
    } else {
      const raw = await fetchPortfolioJson(entry.repo);
      if (raw) {
        result = normalizeDynamic(raw, slug);
      } else {
        result = await getLegacyBySlug(slug);
        if (result) result._source = 'dynamic_fallback';
      }
    }
    if (result) await cache.set(cacheKey, result, CACHE_TTL);
    return result || null;
  } catch (err) {
    console.error(JSON.stringify({
      event: 'project_slug_error',
      slug,
      msg: err.message,
    }));
    const fallback = await getLegacyBySlug(slug);
    if (fallback) {
      fallback._source = 'dynamic_fallback';
      fallback._error = err.message;
      await cache.set(cacheKey, fallback, CACHE_TTL);
      return fallback;
    }
    return null;
  }
}

export async function getProjectReadme(slug) {
  const registry = await loadRegistry();
  const entry = getRegistryEntry(registry, slug);
  if (!entry || entry.local) return null;

  try {
    return await fetchReadme(entry.repo);
  } catch (err) {
    console.error(JSON.stringify({
      event: 'project_readme_error',
      slug,
      msg: err.message,
    }));
    return null;
  }
}

export function invalidateCache() {
    registryCache = null;
    legacyCache = null;
}
