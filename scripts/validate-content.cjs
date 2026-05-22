const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const BLOG_DIR = path.join(process.cwd(), 'src', 'content', 'blog');

function loadJson(name) {
  const p = path.join(DATA_DIR, name);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function fail(msg) {
  console.error('VALIDATION ERROR:', msg);
  process.exitCode = 2;
}

function warn(msg) {
  console.warn('VALIDATION WARNING:', msg);
}

function validateProjects(projects) {
  if (!Array.isArray(projects)) return fail('projects.json: projects must be an array');
  projects.forEach(p => {
    if (!p.id || !p.title || !p.shortDescription) fail(`projects.json: missing required field in project ${JSON.stringify(p)}`);
    if (p.performance) warn(`projects.json: project ${p.id} has performance claims; ensure they are realistic or marked as example`);
    if (p.level && !['personal','prototype','production'].includes(p.level)) warn(`projects.json: project ${p.id} has unknown level '${p.level}'`);
  });
}

function validateProfile(profile) {
  if (!profile) return fail('profile.json missing');
  if (!profile.name) fail('profile.json: name is required');
  if (!profile.title) fail('profile.json: title is required');
}

function validateDSA(dsa) {
  if (!dsa) return fail('dsa-stats.json missing');
  if (typeof dsa.totalSolved !== 'number') fail('dsa-stats.json: totalSolved must be a number');
}

function validateBlogs() {
  if (!fs.existsSync(BLOG_DIR)) return;
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
  files.forEach(f => {
    const content = fs.readFileSync(path.join(BLOG_DIR, f), 'utf8');
    if (!content.includes('title:')) warn(`${f}: missing front-matter title or improperly formatted`);
    if (!content.includes('audience:')) warn(`${f}: consider adding audience: education|case-study to front-matter`);
  });
}

function main() {
  const profile = loadJson('profile.json');
  validateProfile(profile);

  const projects = loadJson('projects.json');
  validateProjects(projects && projects.projects);

  const dsa = loadJson('dsa-stats.json');
  validateDSA(dsa && dsa.dsa);

  validateBlogs();

  console.log('Content validation complete. Review warnings above if any.');
}

main();
