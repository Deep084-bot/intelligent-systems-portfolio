import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import cache from '../cache.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REGISTRY_PATH = path.resolve(__dirname, '..', 'data', 'projectRegistry.json');
const LOCAL_PROJECTS_PATH = path.resolve(__dirname, '..', 'data', 'projects.json');
const CACHE_TTL = 300;
const CACHE_KEY = 'project-metadata';

const GITHUB_RAW = 'https://raw.githubusercontent.com';

let registry = null;

async function loadRegistry() {
  if (registry) return registry;
  const raw = await fs.readFile(REGISTRY_PATH, 'utf8');
  registry = JSON.parse(raw);
  return registry;
}

function invalidateRegistryCache() {
  registry = null;
}

async function loadLocalProjects() {
  const raw = await fs.readFile(LOCAL_PROJECTS_PATH, 'utf8');
  return JSON.parse(raw);
}

async function fetchGitHubJSON(repo, filePath, branch) {
  const url = `${GITHUB_RAW}/${repo}/${branch}/${filePath}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`GitHub fetch failed for ${repo}/${filePath}: ${res.status}`);
  }
  return res.json();
}

function normalizeGitHubProject(raw, id, repo) {
  const tech = Array.isArray(raw.tech) ? raw.tech : [];
  return {
    id,
    title: raw.title || id,
    shortDescription: raw.shortDescription || '',
    tags: Array.isArray(raw.tags) ? raw.tags : tech,
    status: raw.status || 'In Development',
    featured: raw.featured !== false,
    overview: raw.overview || { problem: '', solution: '' },
    architecture: raw.architecture || '',
    challenges: Array.isArray(raw.challenges) ? raw.challenges : [],
    learnings: raw.learnings || '',
    tech,
    category: Array.isArray(raw.category) ? raw.category : [id, 'projects'],
    keywords: Array.isArray(raw.keywords)
      ? raw.keywords
      : [id, ...tech.map(t => String(t).toLowerCase())],
  };
}

export async function getAllProjects() {
  const cached = await cache.get(CACHE_KEY);
  if (cached) {
    return cached;
  }

  const cfg = await loadRegistry();
  const localProjects = await loadLocalProjects();

  const localMap = {};
  for (const p of localProjects) {
    localMap[p.id] = p;
  }

  const results = [];

  for (const dp of cfg.dynamicProjects) {
    try {
      const ghData = await fetchGitHubJSON(dp.repo, dp.portfolioPath, dp.branch || 'main');
      results.push(normalizeGitHubProject(ghData, dp.id, dp.repo));
    } catch (err) {
      const fallback = localMap[dp.id];
      if (fallback) {
        results.push(fallback);
      }
    }
  }

  for (const localId of cfg.localProjectIds) {
    if (localMap[localId]) {
      results.push(localMap[localId]);
    }
  }

  await cache.set(CACHE_KEY, results, CACHE_TTL);
  return results;
}

export async function getProjectById(id) {
  const all = await getAllProjects();
  return all.find(p => p.id === id) || null;
}

export function invalidateCache() {
  invalidateRegistryCache();
  return cache.del(CACHE_KEY);
}
