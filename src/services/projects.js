const CACHE_KEY = 'gh-projects';
const CACHE_TTL = 5 * 60 * 1000;

function getCached() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts < CACHE_TTL) return data;
  } catch {}
  return null;
}

function setCached(data) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

function toTitle(str) {
  return str.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function toGitHubRawUrl(repoName, path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const clean = path.replace(/^\/+/, '');
  return `https://raw.githubusercontent.com/Deep084-bot/${repoName}/main/${clean}`;
}

function mergeProjects(githubData, localProjects) {
  const githubList = githubData?.projects || [];
  const merged = [];

  for (const gp of githubList) {
    const local = localProjects.find(
      p => p.slug === gp.name || p.id === gp.name
    );
    const pj = gp.portfolioJson || {};
    const name = gp.name;

    const image = toGitHubRawUrl(name, pj.image) || local?.image || null;

    const project = {
      id: name,
      slug: name,
      title: pj.title || local?.title || toTitle(name),
      shortDescription: pj.shortDescription || pj.description || gp.description || local?.shortDescription || '',
      image,
      tags: pj.tags || gp.topics || (gp.language ? [gp.language] : []) || local?.tags || [],
      status: pj.status || local?.status || 'Active',
      featured: pj.featured !== undefined ? pj.featured : (local?.featured || false),
      priority: pj.priority || local?.priority || 99,
      startDate: pj.startDate || local?.startDate || null,
      endDate: pj.endDate || local?.endDate || null,
      links: {
        github: gp.url,
        demo: pj.demo || gp.homepageUrl || local?.links?.demo || null,
      },
      overview: pj.overview || local?.overview || { problem: '', solution: '' },
      details: pj.details || local?.details || {
        architecture: '',
        technicalChallenges: [],
        learnings: '',
      },
      tech: pj.tech || gp.topics || (gp.language ? [gp.language] : []) || local?.tech || [],
      futureImprovements: pj.futureImprovements || local?.futureImprovements || [],
      relatedNotes: pj.relatedNotes || local?.relatedNotes || [],
      architectureImage: toGitHubRawUrl(name, pj.architectureImage) || null,
      timeline: pj.timeline || null,
      metrics: pj.metrics || null,
      learning: pj.learning || null,
      futureWork: pj.futureWork || null,
      stars: gp.stars,
      forks: gp.forks,
      updatedAt: gp.updatedAt,
      language: gp.language,
      portfolioJson: gp.portfolioJson || null,
      _source: 'github',
    };

    merged.push(project);
  }

  for (const lp of localProjects) {
    if (!merged.find(p => p.slug === lp.slug || p.id === lp.id)) {
      merged.push({ ...lp, _source: 'local' });
    }
  }

  merged.sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    if (a.updatedAt && b.updatedAt) return new Date(b.updatedAt) - new Date(a.updatedAt);
    if (a.stars !== undefined && b.stars !== undefined) return b.stars - a.stars;
    if (a.priority !== b.priority) return a.priority - b.priority;
    return 0;
  });

  return merged;
}

export async function fetchProjects(localProjects) {
  const cached = getCached();
  if (cached) return cached;

  try {
    const response = await fetch('/api/github/projects');
    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const githubData = await response.json();
    const merged = mergeProjects(githubData, localProjects);
    setCached(merged);
    return merged;
  } catch (err) {
    console.warn('[Projects] GitHub sync failed, using local data:', err.message);
    return localProjects;
  }
}
