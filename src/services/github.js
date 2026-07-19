const GITHUB_API = 'https://api.github.com';
const OWNER = 'Deep084-bot';
const REPO = 'engineering-notes';
const CACHE_KEY = 'gh-engineering-notes';
const CACHE_TTL = 5 * 60 * 1000;

let _branchCache = null;

function getCached(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts < CACHE_TTL) return data;
  } catch {}
  return null;
}

function setCached(key, data) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

async function githubFetch(path) {
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: { Accept: 'application/vnd.github+json' },
  });
  if (res.status === 403 || res.status === 429) {
    throw new Error('GitHub API rate limit reached. Try again later.');
  }
  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status}`);
  }
  return res.json();
}

async function getDefaultBranch() {
  if (_branchCache) return _branchCache;
  const repo = await githubFetch(`/repos/${OWNER}/${REPO}`);
  _branchCache = repo.default_branch || 'main';
  return _branchCache;
}

export async function getRepoInfo() {
  return githubFetch(`/repos/${OWNER}/${REPO}`);
}

export async function getRepoLatestCommit() {
  const commits = await githubFetch(`/repos/${OWNER}/${REPO}/commits?per_page=1`);
  return commits[0] || null;
}

export async function getFileTree() {
  const branch = await getDefaultBranch();
  const tree = await githubFetch(
    `/repos/${OWNER}/${REPO}/git/trees/${branch}?recursive=1`
  );
  return tree.tree || [];
}

export async function getFileContent(path) {
  const branch = await getDefaultBranch();
  const url = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${branch}/${path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load: ${path}`);
  return res.text();
}

export async function getNotesTree() {
  const cached = getCached(CACHE_KEY);
  if (cached) return cached;

  const tree = await getFileTree();
  const items = tree.filter(i => i.type === 'blob' && i.path.endsWith('.md'));

  const notes = {};
  for (const item of items) {
    const parts = item.path.split('/');
    const category = parts.length > 1 ? parts[0] : 'Uncategorized';
    const name = parts.slice(1).join('/').replace(/\.md$/, '');
    if (!notes[category]) notes[category] = [];
    notes[category].push({ name, path: item.path, sha: item.sha });
  }

  const totalNotes = Object.values(notes).reduce((s, a) => s + a.length, 0);
  const categories = Object.keys(notes).sort();

  const latestCommit = await getRepoLatestCommit();
  const latestCommitDate = latestCommit?.commit?.committer?.date || null;
  const repoUrl = `https://github.com/${OWNER}/${REPO}`;

  const result = {
    categories,
    notes,
    totalNotes,
    latestCommitDate,
    repoUrl,
  };

  setCached(CACHE_KEY, result);
  return result;
}

export async function getCategoryNotes(category) {
  const tree = await getNotesTree();
  return tree.notes[category] || [];
}

export function clearCache() {
  sessionStorage.removeItem(CACHE_KEY);
}

function stripPrefix(name) {
  return name
    .replace(/^\d+[-_\s]+/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function insertIntoTree(children, parts, sha, fullPath, parentPath) {
  const [head, ...rest] = parts;
  const isFile = rest.length === 0;
  const currentPath = parentPath ? `${parentPath}/${head}` : head;

  if (isFile) {
    const name = head.replace(/\.md$/, '');
    children.push({
      type: 'file',
      name,
      displayName: stripPrefix(name),
      path: fullPath,
      sha,
    });
  } else {
    let folder = children.find(c => c.type === 'folder' && c.name === head);
    if (!folder) {
      folder = {
        type: 'folder',
        name: head,
        displayName: stripPrefix(head),
        path: currentPath,
        children: [],
      };
      children.push(folder);
    }
    insertIntoTree(folder.children, rest, sha, fullPath, currentPath);
  }
}

function sortTree(nodes) {
  nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  nodes.forEach(n => {
    if (n.children) sortTree(n.children);
  });
}

function countTreeNotes(nodes) {
  return nodes.reduce(
    (sum, n) => sum + (n.type === 'file' ? 1 : countTreeNotes(n.children)),
    0
  );
}

export function findFirstFile(nodes) {
  for (const n of nodes) {
    if (n.type === 'file') return { name: n.name, displayName: n.displayName, path: n.path, sha: n.sha };
    if (n.children) {
      const found = findFirstFile(n.children);
      if (found) return found;
    }
  }
  return null;
}

export async function getHandbookTree() {
  const cached = getCached('gh-handbook-tree');
  if (cached) return cached;

  const tree = await getFileTree();

  const readmeItem = tree.find(i => i.path === 'README.md');
  const readme = readmeItem
    ? { path: 'README.md', sha: readmeItem.sha }
    : null;

  const mdItems = tree.filter(
    i => i.type === 'blob' && i.path.endsWith('.md') && i.path !== 'README.md'
  );

  const root = [];
  for (const item of mdItems) {
    const parts = item.path.split('/');
    insertIntoTree(root, parts, item.sha, item.path, '');
  }
  sortTree(root);

  const categories = root
    .filter(n => n.type === 'folder')
    .map(n => n.displayName);

  const latestCommit = await getRepoLatestCommit();
  const latestCommitDate = latestCommit?.commit?.committer?.date || null;
  const repoUrl = `https://github.com/${OWNER}/${REPO}`;

  const result = {
    readme,
    tree: root,
    categories,
    totalNotes: countTreeNotes(root),
    latestCommitDate,
    repoUrl,
  };

  setCached('gh-handbook-tree', result);
  return result;
}
