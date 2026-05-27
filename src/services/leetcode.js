// LeetCode API service using alfa-leetcode-api
// Endpoints: https://alfa-leetcode-api.onrender.com

const BASE_URL = 'https://alfa-leetcode-api.onrender.com';

// Fetch solved problems breakdown (easy, medium, hard)
export async function getSolvedStats(username) {
  try {
    const response = await fetch(`${BASE_URL}/${username}/solved`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`[LeetCode] getSolvedStats(${username}) failed:`, error.message);
    throw error;
  }
}

// Fetch contest statistics (rating, rank, contests attended)
export async function getContestStats(username) {
  try {
    const response = await fetch(`${BASE_URL}/${username}/contest`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`[LeetCode] getContestStats(${username}) failed:`, error.message);
    throw error;
  }
}

// Fetch submission calendar (streak, daily activity)
export async function getSubmissionCalendar(username) {
  try {
    const response = await fetch(`${BASE_URL}/${username}/calendar`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`[LeetCode] getSubmissionCalendar(${username}) failed:`, error.message);
    throw error;
  }
}

// Fetch recent accepted submissions
export async function getRecentAccepted(username, limit = 5) {
  try {
    const response = await fetch(
      `${BASE_URL}/${username}/acSubmission?limit=${limit}`,
      { headers: { 'Accept': 'application/json' } }
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`[LeetCode] getRecentAccepted(${username}) failed:`, error.message);
    throw error;
  }
}

// Combined fetch for all stats (used by hook)
export async function getAllStats(username) {
  try {
    const [solved, contest, calendar, recent] = await Promise.all([
      getSolvedStats(username),
      getContestStats(username),
      getSubmissionCalendar(username),
      getRecentAccepted(username, 5),
    ]);
    return { solved, contest, calendar, recent };
  } catch (error) {
    console.error(`[LeetCode] getAllStats(${username}) failed:`, error.message);
    throw error;
  }
}
