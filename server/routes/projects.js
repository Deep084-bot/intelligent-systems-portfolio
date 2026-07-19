import express from 'express';
import {
  getAllProjects,
  getProjectBySlug,
  getProjectReadme,
} from '../services/projectMetadataService.js';

const router = express.Router();

function log(event, extra = {}) {
  console.log(JSON.stringify({
    event: `projects.${event}`,
    timestamp: new Date().toISOString(),
    ...extra,
  }));
}

router.get('/', async (req, res) => {
  try {
    log('list_requested');
    const projects = await getAllProjects();
    const clean = projects.map(({ _source, _error, ...rest }) => rest);
    res.json({ projects: clean, count: clean.length });
  } catch (err) {
    log('list_error', { msg: err.message });
    res.status(500).json({ error: 'Failed to load projects' });
  }
});

router.get('/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    log('detail_requested', { slug });
    const project = await getProjectBySlug(slug);
    if (!project) {
      return res.status(404).json({ error: `Project '${slug}' not found` });
    }
    const { _source, _error, ...clean } = project;
    res.json(clean);
  } catch (err) {
    log('detail_error', { slug, msg: err.message });
    res.status(500).json({ error: `Failed to load project: ${slug}` });
  }
});

router.get('/:slug/readme', async (req, res) => {
  const { slug } = req.params;
  try {
    log('readme_requested', { slug });
    const readme = await getProjectReadme(slug);
    if (readme === null) {
      return res.status(404).json({ error: `README not found for project: ${slug}` });
    }
    res.json({ slug, readme });
  } catch (err) {
    log('readme_error', { slug, msg: err.message });
    res.status(500).json({ error: `Failed to load README for project: ${slug}` });
  }
});

export default router;
