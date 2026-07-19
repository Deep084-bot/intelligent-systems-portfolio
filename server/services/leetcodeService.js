import { LeetCode } from 'leetcode-query';

const leetcode = new LeetCode();

class LeetCodeError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
    this.name = 'LeetCodeError';
  }
}

function parseSolvedStats(data) {
  if (!data?.matchedUser?.submitStats?.acSubmissionNum) {
    return { easy: 0, medium: 0, hard: 0, total: 0 };
  }

  const counts = { easy: 0, medium: 0, hard: 0 };
  for (const entry of data.matchedUser.submitStats.acSubmissionNum) {
    const diff = entry.difficulty?.toLowerCase();
    if (diff && diff in counts) {
      counts[diff] = Math.max(0, Math.floor(entry.count || 0));
    }
  }

  return {
    easy: counts.easy,
    medium: counts.medium,
    hard: counts.hard,
    total: counts.easy + counts.medium + counts.hard,
  };
}

function parseContestStats(data) {
  if (!data?.userContestRanking) {
    return { rating: 0, globalRank: 0, contests: 0 };
  }

  const ranking = data.userContestRanking;
  return {
    rating: Math.max(0, Math.floor(ranking.rating || 0)),
    globalRank: Math.max(0, Math.floor(ranking.globalRanking || 0)),
    contests: Math.max(0, Math.floor(ranking.attendedContestsCount || 0)),
  };
}

function parseStreak(data) {
  const calendarStr = data?.matchedUser?.submissionCalendar;
  if (!calendarStr) return { streak: 0 };

  try {
    const calendar = JSON.parse(
      typeof calendarStr === 'string' ? calendarStr : JSON.stringify(calendarStr)
    );

    const now = new Date();
    const todayTs = Math.floor(
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 1000
    );
    const day = 86400;

    const hasSubmission = (ts) => calendar[String(ts)] || calendar[ts];

    let startTs = todayTs;
    if (!hasSubmission(todayTs)) {
      startTs = todayTs - day;
    }

    if (!hasSubmission(startTs)) {
      return { streak: 0 };
    }

    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const ts = startTs - i * day;
      if (hasSubmission(ts)) {
        streak++;
      } else {
        break;
      }
    }

    return { streak };
  } catch {
    return { streak: 0 };
  }
}

export async function getLeetCodeStats(username) {
  if (!username || typeof username !== 'string' || username.trim().length === 0) {
    throw new LeetCodeError('Invalid username provided', 400);
  }

  const cleanUsername = username.trim();

  const results = await Promise.allSettled([
    leetcode.user(cleanUsername),
    leetcode.user_contest_info(cleanUsername),
  ]);

  const errors = [];

  const userResult = results[0];
  const contestResult = results[1];

  let solved = { easy: 0, medium: 0, hard: 0, total: 0 };
  let calendar = { streak: 0 };
  let contest = { rating: 0, globalRank: 0, contests: 0 };

  if (userResult.status === 'fulfilled') {
    solved = parseSolvedStats(userResult.value);
    calendar = parseStreak(userResult.value);
  } else {
    errors.push(`user: ${userResult.reason?.message || userResult.reason}`);
    console.log('[LeetCode Service] user() failed:', userResult.reason?.message || userResult.reason);
  }

  if (contestResult.status === 'fulfilled') {
    contest = parseContestStats(contestResult.value);
  } else {
    errors.push(`contest: ${contestResult.reason?.message || contestResult.reason}`);
    console.log('[LeetCode Service] user_contest_info() failed:', contestResult.reason?.message || contestResult.reason);
  }

  const result = {
    username: cleanUsername,
    solved,
    contest,
    calendar,
    fetchedAt: new Date().toISOString(),
  };

  if (errors.length > 0) {
    result._upstreamErrors = errors;
  }

  return result;
}
