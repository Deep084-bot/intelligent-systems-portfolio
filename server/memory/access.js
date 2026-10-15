/*
 * memory/access.js - the single place that decides who may read or write the
 * owner memory namespace.
 *
 * Reality check (audited): this app has no authentication, session, or user
 * identity layer. MEMORY_NAMESPACE is a shared, server-configured OWNER
 * namespace, not a per-visitor identity. A client-supplied userId/UUID is not a
 * credential.
 *
 * Consequently:
 *   - Public visitors may use portfolio-aware chat (which reads the owner
 *     namespace to answer, per P2), but may NOT inspect raw records or mutate
 *     memory.
 *   - Owner inspection/mutation is DISABLED at the HTTP/UI boundary by default.
 *   - MEMORY_OWNER_ENABLED=true is an operator-only switch for a trusted
 *     deployment. It is explicitly NOT authentication; enabling it does not
 *     create per-visitor privacy and must only be used where access is already
 *     controlled. The real prerequisite is an authentication layer that sets a
 *     verified owner identity.
 */

import { validateUserId } from './schema.js';

export const OWNER_MEMORY_DISABLED_CODE = 'owner_memory_disabled';

export const OWNER_MEMORY_DISABLED_MESSAGE =
  'Memory updates and inspection are owner-only, and this site has no sign-in to ' +
  'verify an owner, so they are disabled here. Nothing was read from or written to memory.';

export const OWNER_MUTATION_DISABLED_MESSAGE =
  'I can\'t change stored memory from a public chat. Persistent memory is owner-only and this ' +
  'site has no sign-in to verify an owner, so nothing was stored, updated, or deleted.';

export const OWNER_INSPECT_DISABLED_MESSAGE =
  'I can\'t show stored memory from a public chat. It is owner-only and this site has no sign-in ' +
  'to verify an owner, so I won\'t reveal or modify it.';

// The owner namespace is server-configured only. Never derived from a request.
export function memoryNamespace() {
  const configured = process.env.MEMORY_NAMESPACE || '';
  return validateUserId(configured) ? configured : null;
}

// Whether a trusted owner identity is currently available on a request. No
// middleware in this app ever sets req.memoryOwner, so this is always false for
// public traffic; an auth layer would set it after verifying identity.
export function requestOwner(req) {
  const owner = req && req.memoryOwner;
  if (owner && validateUserId(owner.namespace)) return owner.namespace;
  return null;
}

// Owner HTTP/UI operations require BOTH the operator switch and a resolved
// owner identity on the request. With no auth layer, the second condition can
// never be met by client input.
export function ownerMemoryEnabled() {
  return process.env.MEMORY_OWNER_ENABLED === 'true' && !!memoryNamespace();
}
