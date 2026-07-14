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
