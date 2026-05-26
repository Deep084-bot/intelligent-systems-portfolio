/*
 * context/loader.js - loads structured data files for the retrieval pipeline.
 *
 * Loads from server/data/*.json (the retrieval-oriented data layer).
 * All loaded data is validated and returned as a flat registry.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const dataDir = path.resolve(path.dirname(__filename), '..', 'data');

async function loadJSON(filename) {
  try {
    const raw = await fs.readFile(path.join(dataDir, filename), 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(JSON.stringify({ event: 'loader_failed', file: filename, msg: err.message, stack: err.stack?.slice(0, 300) }));
    return null;
  }
}

function validateProfile(data) {
  if (!data || typeof data !== 'object') return null;
  return {
    name: data.name || '',
    title: data.title || '',
    bio: data.bio || '',
    location: data.location || '',
    technicalInterests: Array.isArray(data.technicalInterests) ? data.technicalInterests : [],
    currentlyLearning: Array.isArray(data.currentlyLearning) ? data.currentlyLearning : [],
    careerDirection: Array.isArray(data.careerDirection) ? data.careerDirection : [],
    strengths: Array.isArray(data.strengths) ? data.strengths : [],
    comfortableTechnologies: data.comfortableTechnologies || {},
    currentFocus: data.currentFocus || {},
    engineeringMindset: data.engineeringMindset || {},
    personalitySignals: Array.isArray(data.personalitySignals) ? data.personalitySignals : [],
    contact: data.contact || {},
    identity: data.identity || {},
  };
}

function validateProjects(data) {
  if (!Array.isArray(data)) return [];
  return data.filter(p => p && p.title).map(p => ({
    id: p.id || p.title?.toLowerCase().replace(/\s+/g, '-'),
    title: p.title || 'Untitled',
    shortDescription: p.shortDescription || '',
    tags: Array.isArray(p.tags) ? p.tags : [],
    architecture: p.architecture || '',
    challenges: Array.isArray(p.challenges) ? p.challenges : [],
    learnings: p.learnings || '',
    tech: Array.isArray(p.tech) ? p.tech : [],
    category: Array.isArray(p.category) ? p.category : [],
    keywords: Array.isArray(p.keywords) ? p.keywords : [],
    featured: !!p.featured,
  }));
}

function validateSkills(data) {
  if (!Array.isArray(data)) return [];
  return data.filter(s => s && s.category).map(s => ({
    category: s.category,
    proficiency: s.proficiency || 'Beginner',
    skills: Array.isArray(s.skills) ? s.skills : [],
    keywords: Array.isArray(s.keywords) ? s.keywords : [],
  }));
}

function validateDSA(data) {
  if (!data || typeof data !== 'object') return null;
  return {
    totalSolved: data.totalSolved || 0,
    byDifficulty: data.byDifficulty || {},
    byCategory: Array.isArray(data.byCategory) ? data.byCategory : [],
    platforms: Array.isArray(data.platforms) ? data.platforms : [],
    stats: data.stats || {},
  };
}

function validateBlogs(data) {
  if (!Array.isArray(data)) return [];
  return data.filter(b => b && b.title).map(b => ({
    slug: b.slug || '',
    title: b.title || 'Untitled',
    tags: Array.isArray(b.tags) ? b.tags : [],
    excerpt: b.excerpt || '',
    content: b.content || '',
    category: Array.isArray(b.category) ? b.category : [],
    keywords: Array.isArray(b.keywords) ? b.keywords : [],
    featured: !!b.featured,
  }));
}

let cached = null;

export async function loadAll() {
  if (cached) return cached;

  const [profileRaw, projectsRaw, skillsRaw, dsaRaw, blogsRaw] = await Promise.all([
    loadJSON('profile.json'),
    loadJSON('projects.json'),
    loadJSON('skills.json'),
    loadJSON('dsa.json'),
    loadJSON('blogs.json'),
  ]);

  const registry = {
    profile: validateProfile(profileRaw),
    projects: validateProjects(projectsRaw),
    skills: validateSkills(skillsRaw),
    dsa: validateDSA(dsaRaw),
    blogs: validateBlogs(blogsRaw),
  };

  cached = registry;
  return registry;
}

export function invalidateCache() {
  cached = null;
}
