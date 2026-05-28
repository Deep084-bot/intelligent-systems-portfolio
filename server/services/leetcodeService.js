/**
 * LeetCode Data Service
 * Uses stable alfa-leetcode-api.onrender.com service
 * Proven reliable, handles all data normalization and error cases
 */

const BASE_URL = 'https://alfa-leetcode-api.onrender.com';
const TIMEOUT_MS = 10000;

class LeetCodeError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
    this.name = 'LeetCodeError';
  }
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ...options.headers,
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new LeetCodeError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status
      );
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new LeetCodeError('Request timeout (10s)', 504);
    }
    if (error instanceof LeetCodeError) {
      throw error;
    }
    throw new LeetCodeError(`Fetch failed: ${error.message}`, 500);
  }
}

/**
 * Parse solved problems breakdown
 * Handles multiple response formats from the API
 */
function parseSolvedStats(data) {
  if (!data) return { easy: 0, medium: 0, hard: 0, total: 0 };

  // Format 1: Direct difficulty counts
  if (typeof data.easy === 'number' && typeof data.medium === 'number' && typeof data.hard === 'number') {
    return {
      easy: Math.max(0, Math.floor(data.easy)),
      medium: Math.max(0, Math.floor(data.medium)),
      hard: Math.max(0, Math.floor(data.hard)),
      total: Math.max(0, Math.floor((data.easy || 0) + (data.medium || 0) + (data.hard || 0))),
    };
  }

  // Format 2: Nested acSubmissionNum array
  if (data.acSubmissionNum && Array.isArray(data.acSubmissionNum)) {
    const counts = {};
    data.acSubmissionNum.forEach((item) => {
      if (item.difficulty && typeof item.count === 'number') {
        const diff = item.difficulty.toLowerCase();
        counts[diff] = Math.max(0, Math.floor(item.count));
      }
    });
    return {
      easy: counts.easy || 0,
      medium: counts.medium || 0,
      hard: counts.hard || 0,
      total: (counts.easy || 0) + (counts.medium || 0) + (counts.hard || 0),
    };
  }

  return { easy: 0, medium: 0, hard: 0, total: 0 };
}

/**
 * Parse contest stats
 */
function parseContestStats(data) {
  if (!data) return { rating: 0, globalRank: 0, contests: 0 };

  return {
    rating: Math.max(0, Math.floor(data.contestRating || data.rating || 0)),
    globalRank: Math.max(0, Math.floor(data.globalRanking || data.globalRank || 0)),
    contests: Math.max(0, Math.floor(data.attendedContestsCount || data.contests || 0)),
  };
}

/**
 * Parse calendar/streak data
 */
function parseCalendarStats(data) {
  if (!data) return { streak: 0 };

  let streak = 0;
  if (typeof data.streak === 'number') {
    streak = Math.max(0, Math.floor(data.streak));
  } else if (data.submissionCalendar && typeof data.submissionCalendar === 'string') {
    try {
      const calendar = JSON.parse(data.submissionCalendar);
      if (typeof calendar.streak === 'number') {
        streak = Math.max(0, Math.floor(calendar.streak));
      }
    } catch (e) {
      // Ignore parse errors
    }
  }

  return { streak };
}

/**
 * Fetch all LeetCode stats for a username
 */
export async function getLeetCodeStats(username) {
  if (!username || typeof username !== 'string' || username.trim().length === 0) {
    throw new LeetCodeError('Invalid username provided', 400);
  }

  const cleanUsername = username.trim();

  try {
    // Fetch all three endpoints in parallel for speed
    const [solvedResponse, contestResponse, calendarResponse] = await Promise.all([
      fetchWithTimeout(`${BASE_URL}/${cleanUsername}/solved`),
      fetchWithTimeout(`${BASE_URL}/${cleanUsername}/contest`),
      fetchWithTimeout(`${BASE_URL}/${cleanUsername}/calendar`),
    ]);

    const solved = parseSolvedStats(solvedResponse);
    const contest = parseContestStats(contestResponse);
    const calendar = parseCalendarStats(calendarResponse);

    return {
      username: cleanUsername,
      solved,
      contest,
      calendar,
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    if (error instanceof LeetCodeError) {
      throw error;
    }
    throw new LeetCodeError(
      `Failed to fetch LeetCode stats: ${error.message}`,
      500
    );
  }
}

console.log('[LeetCode Service Loaded]');
