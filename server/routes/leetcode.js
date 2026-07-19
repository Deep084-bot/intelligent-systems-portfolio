import express from 'express';
import { getLeetCodeStats } from '../services/leetcodeService.js';
import cache from '../cache.js';

const router = express.Router();

const CACHE_TTL = 12 * 60 * 60;

function log(event, username, extra = {}) {
  console.log(JSON.stringify({
    event: `leetcode.${event}`,
    username,
    timestamp: new Date().toISOString(),
    ...extra,
  }));
}

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'leetcode',
    timestamp: new Date().toISOString(),
  });
});

router.get('/:username', async (req, res) => {
  const { username } = req.params;

  if (!username || typeof username !== 'string' || username.trim().length === 0) {
    return res.status(400).json({
      error: 'Invalid username parameter',
      username: username || null,
    });
  }

  const cleanUsername = username.trim();
  const cacheKey = `leetcode:${cleanUsername}`;
  const now = Date.now();

  try {
    const cached = await cache.get(cacheKey);
    const cacheAge = cached ? (now - new Date(cached.fetchedAt).getTime()) : null;
    const isFresh = cached && cacheAge < CACHE_TTL * 1000;

    if (isFresh) {
      log('cache_hit', cleanUsername, { cacheAgeMs: cacheAge });
      return res.json({
        ...cached,
        cached: true,
        stale: false,
        cacheAge,
      });
    }

    if (cached) {
      log('cache_refresh', cleanUsername, { cacheAgeMs: cacheAge });
    } else {
      log('cache_miss', cleanUsername);
    }

    log('upstream_request', cleanUsername);
    const data = await getLeetCodeStats(cleanUsername);
    log('upstream_success', cleanUsername);

    await cache.set(cacheKey, data, CACHE_TTL);

    res.json(data);
  } catch (error) {
    log('upstream_failure', cleanUsername, { error: error.message });

    try {
      const cached = await cache.get(cacheKey);
      if (cached) {
        const cacheAge = Date.now() - new Date(cached.fetchedAt).getTime();
        log('returning_stale', cleanUsername, { cacheAgeMs: cacheAge });
        return res.json({
          ...cached,
          cached: true,
          stale: true,
          cacheAge,
          error: `Using stale cache: ${error.message}`,
        });
      }
    } catch (cacheErr) {
      log('cache_read_error', cleanUsername, { error: cacheErr.message });
    }

    const statusCode = error.status || 500;
    res.status(statusCode).json({
      error: error.message || 'Failed to fetch LeetCode stats',
      username: cleanUsername,
      status: statusCode,
    });
  }
});

export default router;
