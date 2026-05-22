import fs from 'fs/promises';
import path from 'path';

const projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dataDir = path.join(projectRoot, 'src', 'data');

console.log('Project Root:', projectRoot);
console.log('Data Dir:', dataDir);

try {
  const exists = await fs.access(dataDir);
  console.log('✓ Data directory exists');
} catch (err) {
  console.log('✗ Data directory not found:', err.message);
}

try {
  const files = await fs.readdir(dataDir);
  console.log('✓ Files in data dir:', files);
} catch (err) {
  console.log('✗ Error reading dir:', err.message);
}

// Try reading projects.json
try {
  const content = await fs.readFile(path.join(dataDir, 'projects.json'), 'utf8');
  const data = JSON.parse(content);
  console.log('✓ Projects.json loaded, projects count:', data.projects?.length || 0);
} catch (err) {
  console.log('✗ Error loading projects.json:', err.message);
}
