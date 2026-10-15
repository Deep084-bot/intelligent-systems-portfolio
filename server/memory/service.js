/*
 * memory/service.js - internal execution of parsed memory commands.
 *
 * This is the ONLY place that mutates owner memory in response to a command. It
 * is transport-agnostic and does not itself decide who is allowed to call it:
 * callers must first establish a trusted owner context (see memory/access.js).
 *
 * Contract:
 *   - Deterministic: the same intent + store state yields the same outcome.
 *   - Idempotent: re-running the same remember/forget does not create duplicates
 *     and never silently overwrites an unrelated record.
 *   - Honest: a result is `ok:true` ONLY after the store confirms the write. If
 *     the store is unavailable or a record is missing, the outcome is `ok:false`
 *     with a code, and the reply never claims success.
 *   - No fabrication: unknown or ambiguous targets are refused with a clarify,
 *     never guessed.
 */

import {
  getProfile,
  addFact,
  updateFact,
  deleteFact,
  listProjects,
  getProject,
  upsertProject,
  wipeUser,
} from './store.js';
import { validateUserId, PROFILE_FACT_KEYS } from './schema.js';

const FACT_LABELS = {
  'identity.role': 'your role',
  'identity.education': 'your education',
  'identity.career_goal': 'your career goal',
  'dsa.default_language': 'your preferred DSA language',
  'learning.explanation_style': 'your preferred explanation style',
  'preference.response_style': 'your preferred response style',
  'constraint.recurring': 'your recurring constraint',
};

function label(key) {
  return FACT_LABELS[key] || key;
}

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function fail(code, message, data) {
  return { ok: false, code, message, data: data || null };
}

function pass(action, message, data) {
  return { ok: true, action, message, data: data || null };
}

// Map a store error code to an honest user-facing outcome.
function storeError(err, onMissing) {
  switch (err) {
    case 'storage_unavailable':
      return fail('storage_unavailable', 'I couldn\'t reach memory storage, so nothing was changed.');
    case 'not_found':
      return onMissing ? onMissing() : fail('not_found', 'I couldn\'t find that in memory, so nothing was changed.');
    case 'unsupported_schema':
      return fail('unsupported_schema', 'Stored memory uses an unsupported format, so I left it untouched.');
    case 'corrupt_record':
      return fail('corrupt_record', 'Stored memory could not be read safely, so I left it untouched.');
    case 'limit_exceeded':
      return fail('limit_exceeded', 'Memory is full, so I couldn\'t add that. Nothing was changed.');
    case 'invalid_user':
      return fail('invalid_namespace', 'Memory is not configured for this owner.');
    default:
      return fail(err || 'error', 'I couldn\'t complete that memory change.');
  }
}

function activeFactFor(facts, key) {
  return (Array.isArray(facts) ? facts : []).find((f) => f && f.key === key && !f.supersededBy) || null;
}

function projectLabelMatch(refNorm, project) {
  const labels = [project.id, project.name, ...(Array.isArray(project.aliases) ? project.aliases : [])];
  return labels.some((l) => normalize(l) === refNorm);
}

// Resolve a project reference to exactly one existing record, or explain why not.
async function resolveProject(namespace, ref) {
  const refNorm = normalize(ref);
  if (!refNorm) return { status: 'invalid' };

  const list = await listProjects(namespace);
  if (!list.ok || list.degraded) return { status: 'storage' };

  const matches = (Array.isArray(list.projects) ? list.projects : []).filter((p) => projectLabelMatch(refNorm, p));
  if (matches.length === 0) return { status: 'not_found' };
  if (matches.length > 1) return { status: 'ambiguous', candidates: matches.map((p) => p.name) };

  const full = await getProject(namespace, matches[0].id);
  if (!full.ok || full.degraded) return { status: 'storage' };
  if (!full.project) return { status: 'not_found' };
  return { status: 'found', project: full.project };
}

function projectToInput(project, decisions) {
  return {
    id: project.id,
    name: project.name,
    aliases: project.aliases,
    purpose: project.purpose,
    stack: project.stack,
    status: project.status,
    decisions: decisions !== undefined ? decisions : project.decisions,
    completed: project.completed,
    bugs: project.bugs,
    failedApproaches: project.failedApproaches,
    nextTasks: project.nextTasks,
    notes: project.notes,
  };
}

function hasDecision(project, text) {
  const t = normalize(text);
  return (Array.isArray(project.decisions) ? project.decisions : []).some((d) => d && normalize(d.text) === t);
}

function decisionInput(d, fallbackAt) {
  return {
    id: d.id,
    text: d.text,
    rationale: d.rationale,
    confirmed: d.confirmed === true,
    at: d.at || fallbackAt,
  };
}

// --- intent handlers --------------------------------------------------------

async function rememberFact(namespace, key, value) {
  if (!PROFILE_FACT_KEYS.has(key)) {
    return fail('clarify', 'I\'m not sure what to remember — could you say it as a clear preference, like "Remember that I prefer Java for DSA"?');
  }
  const res = await addFact(namespace, { key, value });
  if (!res.ok) return storeError(res.error);
  if (res.duplicate) return pass('remember', `I already had that stored — ${label(key)} is ${value}.`, { duplicate: true });
  if (res.superseded) {
    return pass('remember', `Got it — I updated ${label(key)} to ${value}.`, { superseded: true });
  }
  return pass('remember', `Got it — I'll remember ${label(key)} is ${value}.`);
}

async function rememberProjectDecision(namespace, ref, decision) {
  const resolved = await resolveProject(namespace, ref);

  if (resolved.status === 'ambiguous') {
    return fail('ambiguous', `I found more than one project matching "${ref}" (${resolved.candidates.join(', ')}). Which one did you mean?`, { candidates: resolved.candidates });
  }
  if (resolved.status === 'storage') return storeError('storage_unavailable');
  if (resolved.status === 'invalid') return fail('clarify', 'I need a project name to remember that.');

  if (resolved.status === 'found') {
    const project = resolved.project;
    if (hasDecision(project, decision)) {
      return pass('remember', `I already had that stored for ${project.name}.`, { duplicate: true });
    }
    const decisions = project.decisions.map((d) => decisionInput(d));
    decisions.push({ text: decision, rationale: '', confirmed: true });
    const res = await upsertProject(namespace, projectToInput(project, decisions));
    if (!res.ok) return storeError(res.error);
    return pass('remember', `Got it — I'll remember that ${project.name} uses: ${decision}.`);
  }

  // Not found: the explicit command supplies the project name, so create it.
  const res = await upsertProject(namespace, {
    name: ref,
    decisions: [{ text: decision, rationale: '', confirmed: true }],
  });
  if (!res.ok) return storeError(res.error);
  return pass('remember', `Got it — I'll remember that ${ref} uses: ${decision}.`, { createdProject: true });
}

async function updateProjectDecision(namespace, ref, decision) {
  const resolved = await resolveProject(namespace, ref);
  if (resolved.status === 'ambiguous') {
    return fail('ambiguous', `I found more than one project matching "${ref}" (${resolved.candidates.join(', ')}). Which one did you mean?`, { candidates: resolved.candidates });
  }
  if (resolved.status === 'storage') return storeError('storage_unavailable');
  if (resolved.status === 'invalid') return fail('clarify', 'I need a project name to update a decision.');
  if (resolved.status === 'not_found') {
    return fail('not_found', `I don't have a project called "${ref}" stored, so there was nothing to update.`);
  }

  const project = resolved.project;
  if (hasDecision(project, decision)) {
    return pass('update', `${project.name} already had that decision — no change needed.`, { duplicate: true });
  }
  const decisions = project.decisions.map((d) => decisionInput(d));
  decisions.push({ text: decision, rationale: 'Supersedes an earlier decision.', confirmed: true });
  const res = await upsertProject(namespace, projectToInput(project, decisions));
  if (!res.ok) return storeError(res.error);
  return pass('update', `Updated — I'll treat ${project.name}\'s decision as: ${decision}.`);
}

async function updateProfileFact(namespace, key, value) {
  if (!PROFILE_FACT_KEYS.has(key)) {
    return fail('clarify', 'I\'m not sure which preference to update — could you name it clearly?');
  }
  const profile = await getProfile(namespace);
  if (!profile.ok) return storeError(profile.error);
  if (profile.degraded) return storeError('storage_unavailable');

  const active = activeFactFor(profile.facts, key);
  if (!active) {
    return fail('not_found', `I don't have ${label(key)} stored yet, so there was nothing to update. Say "remember ..." to add it.`);
  }
  if (active.value === value) {
    return pass('update', `${label(key)} is already ${value} — no change needed.`, { duplicate: true });
  }
  const res = await updateFact(namespace, active.id, { value });
  if (!res.ok) return storeError(res.error);
  return pass('update', `Updated — ${label(key)} is now ${value}.`);
}

async function forgetFact(namespace, key, value) {
  if (!PROFILE_FACT_KEYS.has(key)) {
    return fail('clarify', 'I\'m not sure what to forget — could you name the preference clearly?');
  }
  const profile = await getProfile(namespace);
  if (!profile.ok) return storeError(profile.error);
  if (profile.degraded) return storeError('storage_unavailable');

  const active = activeFactFor(profile.facts, key);
  // If a specific value was named, only forget when it actually matches.
  if (!active || (value && normalize(active.value) !== normalize(value))) {
    return fail('not_found', `I don't have that stored, so there was nothing to forget.`);
  }
  const res = await deleteFact(namespace, active.id);
  if (!res.ok) return storeError(res.error, () => fail('not_found', 'I don\'t have that stored, so there was nothing to forget.'));
  return pass('forget', `Done — I've forgotten ${label(key)}.`);
}

async function forgetProjectDecision(namespace, ref) {
  const resolved = await resolveProject(namespace, ref);
  if (resolved.status === 'ambiguous') {
    return fail('ambiguous', `I found more than one project matching "${ref}" (${resolved.candidates.join(', ')}). Which one did you mean?`, { candidates: resolved.candidates });
  }
  if (resolved.status === 'storage') return storeError('storage_unavailable');
  if (resolved.status === 'invalid') return fail('clarify', 'I need a project name to forget a decision.');
  if (resolved.status === 'not_found') {
    return fail('not_found', `I don't have a project called "${ref}" stored, so there was nothing to forget.`);
  }

  const project = resolved.project;
  const decisions = Array.isArray(project.decisions) ? project.decisions : [];
  if (decisions.length === 0) {
    return fail('not_found', `I don't have a decision stored for ${project.name}, so there was nothing to forget.`);
  }
  if (decisions.length > 1) {
    return fail('ambiguous', `${project.name} has more than one stored decision. Which one should I forget?`, { candidates: decisions.map((d) => d.text) });
  }
  const res = await upsertProject(namespace, projectToInput(project, []));
  if (!res.ok) return storeError(res.error);
  return pass('forget', `Done — I've forgotten ${project.name}'s stored decision.`);
}

async function inspect(namespace, scope) {
  const data = {};
  if (scope === 'projects' || scope === 'all') {
    const list = await listProjects(namespace);
    if (!list.ok) return storeError(list.error);
    if (list.degraded) return storeError('storage_unavailable');
    data.projects = list.projects.map((p) => ({ name: p.name, status: p.status }));
  }
  if (scope === 'profile' || scope === 'all') {
    const profile = await getProfile(namespace);
    if (!profile.ok) return storeError(profile.error);
    if (profile.degraded) return storeError('storage_unavailable');
    data.facts = (profile.facts || []).filter((f) => !f.supersededBy).map((f) => ({ key: f.key, value: f.value }));
  }

  const parts = [];
  if (data.facts) {
    parts.push(data.facts.length
      ? 'Preferences: ' + data.facts.map((f) => `${label(f.key)} = ${f.value}`).join('; ') + '.'
      : 'I have no preferences stored.');
  }
  if (data.projects) {
    parts.push(data.projects.length
      ? 'Projects: ' + data.projects.map((p) => p.name).join(', ') + '.'
      : 'I have no projects stored.');
  }
  return pass('inspect', parts.join(' ') || 'I have nothing stored.', data);
}

async function wipe(namespace) {
  const res = await wipeUser(namespace);
  if (!res.ok) return storeError(res.error);
  return pass('wipe', 'Done — I\'ve cleared everything I had stored about you.');
}

/*
 * executeMemoryCommand(namespace, intent)
 * Pure orchestration over the store. Returns an outcome object; never throws for
 * expected conditions. `intent` comes from parseMemoryCommand (commands.js).
 */
export async function executeMemoryCommand(namespace, intent) {
  if (!validateUserId(namespace)) return fail('invalid_namespace', 'Memory is not configured for this owner.');
  if (!intent || typeof intent.type !== 'string') return fail('invalid_intent', 'I didn\'t catch a memory command.');

  switch (intent.type) {
    case 'remember':
      if (intent.target === 'fact') return rememberFact(namespace, intent.key, intent.value);
      if (intent.target === 'project') return rememberProjectDecision(namespace, intent.ref, intent.decision);
      return fail('clarify', 'I want to remember that, but I need to know whether it\'s about you (a preference) or a project. Could you rephrase?');
    case 'update':
      if (intent.target === 'project') return updateProjectDecision(namespace, intent.ref, intent.decision);
      if (intent.target === 'fact') return updateProfileFact(namespace, intent.key, intent.value);
      return fail('clarify', 'I\'m not sure what to update — could you name the project or preference?');
    case 'forget':
      if (intent.target === 'fact') return forgetFact(namespace, intent.key, intent.value);
      if (intent.target === 'project') return forgetProjectDecision(namespace, intent.ref);
      return fail('clarify', 'I\'m not sure what to forget — could you name the project or preference?');
    case 'wipe':
      return wipe(namespace);
    case 'inspect':
      return inspect(namespace, intent.scope || 'all');
    default:
      return fail('unknown_command', 'I didn\'t catch a memory command.');
  }
}

export default executeMemoryCommand;
