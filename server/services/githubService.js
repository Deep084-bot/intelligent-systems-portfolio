/**
 * GitHub Data Service
 * Fetches pinned repositories via GraphQL, detects portfolio.json, falls back to REST API
 */

const OWNER = 'Deep084-bot';
const GITHUB_API = 'https://api.github.com';
const GRAPHQL_URL = 'https://api.github.com/graphql';
const TIMEOUT_MS = 10000;

class GitHubError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
    this.name = 'GitHubError';
  }
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'portfolio-backend',
        ...options.headers,
      },
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') throw new GitHubError('Request timeout', 504);
    throw new GitHubError(`Fetch failed: ${error.message}`, 500);
  }
}

function getToken() {
  return process.env.GITHUB_TOKEN || null;
}

async function fetchPinnedGraphQL() {
  const token = getToken();
  if (!token) return null;

  const query = `{
    user(login: "${OWNER}") {
      pinnedItems(first: 6, types: REPOSITORY) {
        nodes {
          ... on Repository {
            name
            description
            homepageUrl
            repositoryTopics(first: 10) {
              nodes { topic { name } }
            }
            primaryLanguage { name }
            stargazerCount
            forkCount
            updatedAt
            url
          }
        }
      }
    }
  }`;

  const response = await fetchWithTimeout(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new GitHubError(`GraphQL error: ${response.status}`, response.status);
  }

  const json = await response.json();
  if (json.errors) {
    throw new GitHubError(`GraphQL: ${json.errors[0]?.message || 'Unknown error'}`, 502);
  }

  const nodes = json?.data?.user?.pinnedItems?.nodes || [];
  return nodes.map(repo => ({
    name: repo.name,
    description: repo.description || '',
    homepageUrl: repo.homepageUrl || null,
    topics: (repo.repositoryTopics?.nodes || []).map(t => t.topic.name),
    language: repo.primaryLanguage?.name || null,
    stars: repo.stargazerCount || 0,
    forks: repo.forkCount || 0,
    updatedAt: repo.updatedAt || null,
    url: repo.url,
  }));
}

async function fetchCommits(repoName, count = 5) {
  const token = getToken();
  try {
    const response = await fetchWithTimeout(
      `${GITHUB_API}/repos/${OWNER}/${repoName}/commits?per_page=${count}`,
      { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data.map(c => ({
      sha: c.sha,
      message: c.commit.message.split('\n')[0],
      date: c.commit.committer?.date || c.commit.author?.date || null,
      url: c.html_url,
    }));
  } catch {
    return [];
  }
}

function parseChangelog(content) {
  const entries = [];
  const versionRegex = /^##\s*\[?([^\]]+)\]?\s*[-–]\s*(\d{4}[-/]\d{2}[-/]\d{2})/gm;
  let match;
  while ((match = versionRegex.exec(content)) !== null) {
    const version = match[1].replace(/[\[\]]/g, '').trim();
    entries.push({ version, date: match[2] });
  }
  return entries;
}

async function fetchChangelog(repoName) {
  const token = getToken();
  try {
    const response = await fetchWithTimeout(
      `${GITHUB_API}/repos/${OWNER}/${repoName}/contents/CHANGELOG.md`,
      { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.content || data.encoding !== 'base64') return null;
    const decoded = Buffer.from(data.content, 'base64').toString('utf-8');
    return parseChangelog(decoded);
  } catch {
    return null;
  }
}

export async function getActivityFeed() {
  const { projects } = await getPinnedProjects();
  const allActivities = [];

  for (const repo of projects) {
    const commits = await fetchCommits(repo.name, 5);
    for (const c of commits) {
      allActivities.push({
        type: 'commit',
        repoName: repo.name,
        repoUrl: repo.url,
        message: c.message,
        date: c.date,
        url: c.url,
      });
    }

    const changelog = await fetchChangelog(repo.name);
    if (changelog) {
      for (const entry of changelog) {
        allActivities.push({
          type: 'changelog',
          repoName: repo.name,
          repoUrl: repo.url,
          message: `Released ${entry.version}`,
          date: entry.date,
          url: `${repo.url}/releases`,
        });
      }
    }
  }

  allActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
  return allActivities.slice(0, 25);
}

async function fetchPortfolioJson(repoName) {
  const token = getToken();
  try {
    const response = await fetchWithTimeout(
      `${GITHUB_API}/repos/${OWNER}/${repoName}/contents/portfolio.json`,
      { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.content || data.encoding !== 'base64') return null;
    const decoded = Buffer.from(data.content, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export async function getPinnedProjects() {
  const token = getToken();
  if (!token) {
    return { source: 'none', projects: [] };
  }

  let repos = [];

  try {
    const pinned = await fetchPinnedGraphQL();
    if (pinned) repos = pinned;
  } catch (error) {
    console.error(`[GitHub] Pinned fetch failed:`, error.message);
    return { source: 'none', projects: [] };
  }

  const projects = await Promise.all(repos.map(async (repo) => {
    const portfolioJson = await fetchPortfolioJson(repo.name);
    return {
      ...repo,
      portfolioJson,
      hasPortfolioJson: !!portfolioJson,
    };
  }));

  return { source: 'graphql', projects };
}

console.log('[GitHub Service Loaded]');
