const CACHE_KEY = 'gh-activity';
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

export async function fetchActivity() {
  const cached = getCached();
  if (cached) return cached;

  try {
    const response = await fetch('/api/github/activity');
    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const json = await response.json();
    const activities = json.activities || [];
    setCached(activities);
    return activities;
  } catch (err) {
    console.warn('[Activity] Failed to fetch:', err.message);
    return [];
  }
}
