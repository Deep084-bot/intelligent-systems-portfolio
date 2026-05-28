import express from 'express';
import { getLeetCodeStats } from '../services/leetcodeService.js';

const router = express.Router();

// Cache with 30-minute TTL
const statsCache = new Map();
const CACHE_TTL = 30 * 60 * 1000;

/**
 * Health check endpoint for testing
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'leetcode',
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/leetcode/:username
 * Fetch LeetCode stats with caching and fallback support
 */
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;

    if (!username || typeof username !== 'string' || username.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid username parameter',
        username: username || null,
      });
    }

    const cleanUsername = username.trim();
    const cacheKey = `leetcode:${cleanUsername}`;
    const cached = statsCache.get(cacheKey);
    const now = Date.now();

    // Return fresh cache if available
    if (cached && now - cached.timestamp < CACHE_TTL) {
      console.log(`[LeetCode] Cache hit for ${cleanUsername}`);
      return res.json({
        ...cached.data,
        cached: true,
        cacheAge: now - cached.timestamp,
      });
    }

    console.log(`[LeetCode] Fetching stats for ${cleanUsername}...`);
    const data = await getLeetCodeStats(cleanUsername);

    // Update cache
    statsCache.set(cacheKey, {
      timestamp: now,
      data,
    });

    res.json(data);
  } catch (error) {
    console.error(`[LeetCode] Error:`, error.message);

    const { username } = req.params;
    const cleanUsername = username?.trim() || 'unknown';
    const cacheKey = `leetcode:${cleanUsername}`;
    const cached = statsCache.get(cacheKey);

    // Fallback to stale cache if available
    if (cached) {
      console.log(`[LeetCode] Returning stale cache for ${cleanUsername}`);
      return res.json({
        ...cached.data,
        cached: true,
        stale: true,
        cacheAge: Date.now() - cached.timestamp,
        error: `Using stale cache: ${error.message}`,
      });
    }

    // No cache available, return error
    const statusCode = error.status || 500;
    res.status(statusCode).json({
      error: error.message || 'Failed to fetch LeetCode stats',
      username: cleanUsername,
      status: statusCode,
    });
  }
});

export default router;
