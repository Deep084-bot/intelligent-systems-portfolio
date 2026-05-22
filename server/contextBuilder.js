import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

// Correctly resolve paths relative to project root (one level up from server/)
const __filename = fileURLToPath(import.meta.url);
const serverDir = path.dirname(__filename);
const projectRoot = path.resolve(serverDir, '..');
const dataDir = path.join(projectRoot, 'src', 'data');
const blogDir = path.join(projectRoot, 'src', 'content', 'blog');

async function loadJson(filename) {
  try {
    const content = await fs.readFile(path.join(dataDir, filename), 'utf8');
    return JSON.parse(content);
  } catch (err) {
    return null;
  }
}

function sanitizeText(text) {
  if (!text) return ''; 
  // remove excessive markdown chars, collapse whitespace
  let cleaned = text.replace(/[\t\r]/g, ' ').replace(/\s+/g, ' ').trim();
  // redact very large numeric claims (e.g., 10000+, 1M, 500K)
  cleaned = cleaned.replace(/\b\d{5,}\b/g, '[redacted-number]');
  cleaned = cleaned.replace(/\b\d+(K|M|B)\b/gi, '[redacted-number]');
  // redact p99 or latency patterns (keep the concept but remove exact numbers)
  cleaned = cleaned.replace(/p99[: ]*<?\s*\d+\s*ms/gi, 'p99:[redacted]');
  return cleaned;
}

function summarizeProjects(projects) {
  if (!projects || !projects.length) return '';
  return projects
    .map(p => `- [PROJECT] ${p.title} (${(p.tech && p.tech.join(', ')) || (p.tags && p.tags.join(', ')) || 'N/A'}): ${sanitizeText(p.shortDescription)}`)
    .join('\n');
}

function summarizeSkills(skills) {
  if (!skills || !skills.length) return '';
  return skills
    .map(cat => `- [SKILLS] ${cat.category}: ${cat.skills.map(s => (s.name || s)).slice(0,6).join(', ')}`)
    .join('\n');
}

function excerptText(text, maxChars = 300) {
  if (!text) return '';
  const cleaned = sanitizeText(text).replace(/[#__*`>\[\]]/g, '').trim();
  if (cleaned.length <= maxChars) return cleaned;
  const slice = cleaned.slice(0, maxChars);
  const lastSpace = slice.lastIndexOf(' ');
  return slice.slice(0, lastSpace > 0 ? lastSpace : maxChars) + '...';
}

async function loadBlogs() {
  try {
    const files = await fs.readdir(blogDir);
    const posts = [];
    for (const f of files) {
      if (!f.endsWith('.md')) continue;
      const content = await fs.readFile(path.join(blogDir, f), 'utf8');
      const parsed = matter(content);
      posts.push({
        metadata: parsed.data || {},
        content: parsed.content || '',
        file: f,
      });
    }
    return posts;
  } catch (err) {
    return [];
  }
}

async function buildContext() {
  const [projectsJson, skillsJson, achievementsJson, terminalJson, blogs] = await Promise.all([
    loadJson('projects.json'),
    loadJson('skills.json'),
    loadJson('achievements.json'),
    loadJson('terminal-commands.json'),
    loadBlogs()
  ]);

  const projects = projectsJson?.projects || [];
  const skills = skillsJson?.skills || [];
  const achievements = achievementsJson?.achievements || [];
  const commands = terminalJson?.commands || [];

  const ctxParts = [];

  if (projects.length) {
    ctxParts.push('Projects:\n' + summarizeProjects(projects));
  }

  if (skills.length) {
    ctxParts.push('Skills:\n' + summarizeSkills(skills));
  }

  if (achievements.length) {
    ctxParts.push('Achievements:\n' + achievements.map(a => `- ${a.title}: ${a.description}`).join('\n'));
  }

  if (blogs && blogs.length) {
    // Prioritize featured blogs, then newest
    const featured = blogs.filter(b => b.metadata?.featured).slice(0, 3);
    const rest = blogs.filter(b => !b.metadata?.featured).slice(0, 5 - featured.length);
    const selected = [...featured, ...rest];
    const blogSummaries = selected.map(b => `- ${b.metadata.title || b.file}: ${excerptText(b.content, 260)}`);
    ctxParts.push('Engineering Notes & Blogs (summaries):\n' + blogSummaries.join('\n'));
  }

  if (commands.length) {
    ctxParts.push('Terminal commands (short):\n' + commands.map(c => `- ${c.name}: ${c.description}`).join('\n'));
  }

  // Include learning areas if present in profile data file
  try {
    const profileRaw = await loadJson('profile.json');
    if (profileRaw?.currentlyLearning) {
      ctxParts.push('Currently Learning:\n' + (profileRaw.currentlyLearning.title || '') + '\n' + (profileRaw.currentlyLearning.description || ''));
    }
  } catch (err) {
    // ignore
  }

  // Limit total length to avoid huge prompts
  const context = ctxParts.join('\n\n');
  return context.substring(0, 28_000); // keep under token limit buffer
}

export default buildContext;
