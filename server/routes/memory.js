/*
 * server/routes/memory.js - HTTP surface for the standalone assistant's memory.
 *
 * Public surface:
 *   GET /status  - read-only, backend/durability + counts for the
 *                  server-configured MEMORY_STATUS_NAMESPACE only. No record
 *                  contents, user ids, or secrets.
 *
 * Owner surface (all behind requireOwner):
 *   GET    /profile           list active profile facts
 *   GET    /projects          list project summaries
 *   GET    /projects/:id      read one project
 *   POST   /facts             add/supersede a fact
 *   PATCH  /facts/:id         update a fact
 *   DELETE /facts/:id         delete a fact
 *   DELETE /projects/:id      delete a project
 *   DELETE /                  wipe all owner memory
 *   POST   /command           run an explicit memory command
 *
 * There is NO authentication on this app, so requireOwner always refuses public
 * traffic (403). It only proceeds when the deployment both opts in via
 * MEMORY_OWNER_ENABLED=true AND a trusted upstream middleware has attached a
 * verified owner identity to the request (req.memoryOwner). A client-supplied
 * userId is never accepted as identity. See memory/access.js.
 */

import express from 'express';
import { SCHEMA_VERSION } from '../memory/schema.js';
import {
  getStatus,
  getBackend,
  ping,
  validateUserId,
  getProfile,
  addFact,
  updateFact,
  deleteFact,
  listProjects,
  getProject,
  deleteProject,
  wipeUser,
} from '../memory/store.js';
import {
  ownerMemoryEnabled,
  requestOwner,
  memoryNamespace,
  OWNER_MEMORY_DISABLED_CODE,
  OWNER_MEMORY_DISABLED_MESSAGE,
} from '../memory/access.js';
import { parseMemoryCommand } from '../memory/commands.js';
import { executeMemoryCommand } from '../memory/service.js';

const router = express.Router();

function safeJson(res, status, data) {
  if (res.headersSent) return;
  try { res.status(status).json(data); } catch { /* ignore */ }
}

// --- public: status ---------------------------------------------------------

router.get('/status', async (_req, res) => {
  const backend = getBackend();
  const reachable = await ping();
  const namespace = process.env.MEMORY_STATUS_NAMESPACE || '';

  const payload = {
    ok: true,
    schemaVersion: SCHEMA_VERSION,
    storage: {
      mode: backend.mode,
      durable: backend.durable,
      reachable,
    },
    statusNamespaceConfigured: validateUserId(namespace),
    counts: null,
  };

  if (validateUserId(namespace)) {
    const status = await getStatus(namespace);
    payload.counts = status.ok ? status.counts : null;
    if (!status.ok) payload.storage.reachable = false;
  }

  safeJson(res, 200, payload);
});

// --- owner gate -------------------------------------------------------------

function requireOwner(req, res, next) {
  if (!ownerMemoryEnabled()) {
    return safeJson(res, 403, { ok: false, code: OWNER_MEMORY_DISABLED_CODE, message: OWNER_MEMORY_DISABLED_MESSAGE });
  }
  const namespace = requestOwner(req);
  if (!namespace) {
    return safeJson(res, 403, { ok: false, code: OWNER_MEMORY_DISABLED_CODE, message: OWNER_MEMORY_DISABLED_MESSAGE });
  }
  req.memoryNamespace = namespace;
  next();
}

router.use(requireOwner);

// Map store result codes to HTTP status. `result` is { ok, error } on failure.
function storeHttpStatus(code) {
  switch (code) {
    case 'invalid_user':
    case 'invalid_record':
    case 'invalid_intent':
      return 400;
    case 'not_found':
      return 404;
    case 'limit_exceeded':
    case 'unsupported_schema':
    case 'corrupt_record':
      return 409;
    case 'storage_unavailable':
      return 503;
    default:
      return 500;
  }
}

function sendStoreResult(res, result, successStatus = 200) {
  if (result.ok) return safeJson(res, successStatus, result);
  safeJson(res, storeHttpStatus(result.error), {
    ok: false,
    code: result.error || 'error',
    errors: result.errors || undefined,
  });
}

// --- owner: reads -----------------------------------------------------------

router.get('/profile', async (req, res) => {
  const result = await getProfile(req.memoryNamespace);
  if (!result.ok) return sendStoreResult(res, result);
  sendStoreResult(res, { ok: true, facts: (result.facts || []).filter((f) => !f.supersededBy) });
});

router.get('/projects', async (req, res) => {
  sendStoreResult(res, await listProjects(req.memoryNamespace));
});

router.get('/projects/:id', async (req, res) => {
  sendStoreResult(res, await getProject(req.memoryNamespace, req.params.id));
});

// --- owner: fact mutations --------------------------------------------------

router.post('/facts', async (req, res) => {
  const { key, value, tags, pinned } = req.body || {};
  sendStoreResult(res, await addFact(req.memoryNamespace, { key, value, tags, pinned }), 201);
});

router.patch('/facts/:id', async (req, res) => {
  sendStoreResult(res, await updateFact(req.memoryNamespace, req.params.id, req.body || {}));
});

router.delete('/facts/:id', async (req, res) => {
  sendStoreResult(res, await deleteFact(req.memoryNamespace, req.params.id));
});

// --- owner: project mutations ----------------------------------------------

router.delete('/projects/:id', async (req, res) => {
  sendStoreResult(res, await deleteProject(req.memoryNamespace, req.params.id));
});

// --- owner: wipe ------------------------------------------------------------

router.delete('/', async (req, res) => {
  sendStoreResult(res, await wipeUser(req.memoryNamespace));
});

// --- owner: commands --------------------------------------------------------

router.post('/command', async (req, res) => {
  const text = req.body && req.body.text;
  if (typeof text !== 'string' || !text.trim()) {
    return safeJson(res, 400, { ok: false, code: 'invalid_request', message: 'Provide a memory command in "text".' });
  }
  const intent = parseMemoryCommand(text);
  if (!intent) {
    return safeJson(res, 200, { ok: false, code: 'not_a_command', message: 'That did not look like a memory command.' });
  }
  const outcome = await executeMemoryCommand(req.memoryNamespace, intent);
  safeJson(res, outcome.ok ? 200 : storeHttpStatus(outcome.code), outcome);
});

export { requireOwner, memoryNamespace };
export default router;
