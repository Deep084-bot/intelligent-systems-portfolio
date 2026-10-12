// DeepPet — action registry.
//
// A deliberately small registry, not a plugin framework. It owns one job: given
// an action id and some plain arguments, validate them and run the registered
// handler, always returning the same structured result. It has no knowledge of
// routes, the pet, React, or the AI provider.
//
// Safety properties this module guarantees:
//   - only ids registered at runtime can run (no dynamic dispatch by name);
//   - arguments are validated before a handler is ever called;
//   - handlers are plain functions registered in code — never strings, never
//     eval, never anything the model produced;
//   - a throwing, hanging, or misbehaving handler becomes a normal result.

export const ACTION_STATUS = {
  OK: 'ok',
  REJECTED: 'rejected',
  INVALID_ARGS: 'invalid_args',
  UNSUPPORTED: 'unsupported',
  FAILED: 'failed',
  TIMEOUT: 'timeout',
  CANCELLED: 'cancelled',
  DUPLICATE: 'duplicate',
}

const ID_PATTERN = /^[a-z][a-z0-9_]{1,63}$/
const DEFAULT_TIMEOUT_MS = 5000
const MAX_TIMEOUT_MS = 30000

const registry = new Map()

function result(actionId, status, message = '', errorCode = null, data = null) {
  return {
    ok: status === ACTION_STATUS.OK,
    actionId: actionId || null,
    status,
    message,
    errorCode,
    data,
  }
}

export function registerAction(definition) {
  if (!definition || typeof definition !== 'object') {
    throw new Error('action definition must be an object')
  }

  const { id, name, handler } = definition

  if (typeof id !== 'string' || !ID_PATTERN.test(id)) {
    throw new Error(`invalid action id: ${String(id)}`)
  }
  if (registry.has(id)) {
    throw new Error(`duplicate action id: ${id}`)
  }
  if (typeof name !== 'string' || !name.trim()) {
    throw new Error(`action "${id}" needs a display name`)
  }
  if (typeof handler !== 'function') {
    throw new Error(`action "${id}" needs a handler function`)
  }
  if (definition.validate !== undefined && typeof definition.validate !== 'function') {
    throw new Error(`action "${id}" validate must be a function`)
  }

  const timeoutMs = Number.isFinite(definition.timeoutMs)
    ? Math.min(Math.max(definition.timeoutMs, 0), MAX_TIMEOUT_MS)
    : DEFAULT_TIMEOUT_MS

  const action = {
    id,
    name: name.trim(),
    description: typeof definition.description === 'string' ? definition.description : '',
    requiresConfirmation: definition.requiresConfirmation === true,
    timeoutMs,
    validate: definition.validate || (() => ({ ok: true, args: {} })),
    handler,
  }

  registry.set(id, action)
  return () => unregisterAction(id)
}

export function unregisterAction(id) {
  return registry.delete(id)
}

export function hasAction(id) {
  return registry.has(id)
}

export function getAction(id) {
  return registry.get(id) || null
}

export function listActions() {
  return [...registry.values()].map(({ id, name, description, requiresConfirmation, timeoutMs }) => ({
    id,
    name,
    description,
    requiresConfirmation,
    timeoutMs,
  }))
}

// Test seam — clears the registry so QA can start from a known state.
export function resetActionRegistry() {
  registry.clear()
}

// Pure argument validation. Safe to call on its own (the brain uses it to give
// early feedback) and again inside runAction (defense in depth before execution).
export function validateActionArgs(id, rawArgs) {
  const action = registry.get(id)
  if (!action) {
    return { ok: false, status: ACTION_STATUS.REJECTED, errorCode: 'UNKNOWN_ACTION', message: `Unknown action: ${id}` }
  }

  let outcome
  try {
    outcome = action.validate(rawArgs)
  } catch {
    return { ok: false, status: ACTION_STATUS.INVALID_ARGS, errorCode: 'VALIDATOR_THREW', message: 'That request had invalid arguments.' }
  }

  if (!outcome || outcome.ok !== true) {
    return {
      ok: false,
      status: ACTION_STATUS.INVALID_ARGS,
      errorCode: outcome?.errorCode || 'INVALID_ARGS',
      message: outcome?.message || 'That request had invalid arguments.',
    }
  }

  return { ok: true, args: outcome.args ?? {} }
}

function normalizeHandlerResult(actionId, raw) {
  if (raw && typeof raw === 'object' && typeof raw.ok === 'boolean') {
    return result(
      actionId,
      raw.ok ? ACTION_STATUS.OK : (raw.status || ACTION_STATUS.FAILED),
      typeof raw.message === 'string' ? raw.message : '',
      raw.errorCode || null,
      raw.data ?? null,
    )
  }
  return result(actionId, ACTION_STATUS.FAILED, '', 'BAD_HANDLER_RESULT', null)
}

// Validate then execute. Never throws: handler exceptions and timeouts are
// converted into normal results so one bad action cannot sink the conversation.
export async function runAction(id, rawArgs, ctx = {}) {
  const action = registry.get(id)
  if (!action) {
    return result(id, ACTION_STATUS.REJECTED, '', 'UNKNOWN_ACTION', null)
  }

  const validated = validateActionArgs(id, rawArgs)
  if (!validated.ok) {
    return result(id, validated.status, validated.message, validated.errorCode, null)
  }

  let timer = null
  let timedOut = false

  const handlerPromise = Promise.resolve()
    .then(() => action.handler(validated.args, ctx))
  // Swallow a late rejection so a handler that throws after a timeout does not
  // surface as an unhandled rejection.
  handlerPromise.catch(() => {})

  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      timedOut = true
      reject(new Error('__action_timeout__'))
    }, action.timeoutMs)
  })

  try {
    const raw = await Promise.race([handlerPromise, timeoutPromise])
    if (timer) clearTimeout(timer)
    return normalizeHandlerResult(id, raw)
  } catch (err) {
    if (timer) clearTimeout(timer)
    if (timedOut) {
      return result(id, ACTION_STATUS.TIMEOUT, '', 'TIMEOUT', null)
    }
    return result(id, ACTION_STATUS.FAILED, '', 'HANDLER_ERROR', {
      detail: String(err?.message || '').slice(0, 200),
    })
  }
}
