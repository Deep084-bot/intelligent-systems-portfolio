const API_BASE = '/api/projects';

export async function getProjects() {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error(`Failed to fetch projects: ${res.status}`);
  const data = await res.json();
  return data.projects || [];
}

export async function getProjectBySlug(slug) {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(slug)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch project: ${res.status}`);
  return res.json();
}

export async function getProjectReadme(slug) {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(slug)}/readme`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch README: ${res.status}`);
  const data = await res.json();
  return data.readme || null;
}
