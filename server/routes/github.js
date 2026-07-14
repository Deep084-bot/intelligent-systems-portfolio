import express from 'express';
import { getPinnedProjects, getActivityFeed } from '../services/githubService.js';

const router = express.Router();

const projectsCache = new Map();
const activityCache = new Map();
const CACHE_TTL = 30 * 60 * 1000;

router.get('/projects', async (req, res) => {
  try {
    const cached = projectsCache.get('pinned');
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_TTL) {
      return res.json({
        ...cached.data,
        cached: true,
        cacheAge: now - cached.timestamp,
      });
    }

    const data = await getPinnedProjects();

    projectsCache.set('pinned', { timestamp: now, data });

    res.json(data);
  } catch (error) {
    console.error(`[GitHub] Error:`, error.message);

    const cached = projectsCache.get('pinned');
    if (cached) {
      return res.json({
        ...cached.data,
        cached: true,
        stale: true,
        cacheAge: Date.now() - cached.timestamp,
        error: `Using stale cache: ${error.message}`,
      });
    }

    res.status(error.status || 500).json({
      error: error.message || 'Failed to fetch GitHub projects',
      status: error.status || 500,
    });
  }
});

router.get('/activity', async (req, res) => {
  try {
    const cached = activityCache.get('feed');
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_TTL) {
      return res.json({
        activities: cached.data,
        cached: true,
        cacheAge: now - cached.timestamp,
      });
    }

    const activities = await getActivityFeed();

    activityCache.set('feed', { timestamp: now, data: activities });

    res.json({ activities, cached: false });
  } catch (error) {
    console.error(`[GitHub] Activity Error:`, error.message);

    const cached = activityCache.get('feed');
    if (cached) {
      return res.json({
        activities: cached.data,
        cached: true,
        stale: true,
        cacheAge: Date.now() - cached.timestamp,
        error: `Using stale cache: ${error.message}`,
      });
    }

    res.status(error.status || 500).json({
      error: error.message || 'Failed to fetch GitHub activity',
      status: error.status || 500,
    });
  }
});

export default router;
