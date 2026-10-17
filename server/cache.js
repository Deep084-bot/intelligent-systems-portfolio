/*
 * cache.js - small persistence abstraction for the assistant.
 *
 * Backend selection is evaluated per call so tests can exercise each mode:
 *   - "upstash": durable Redis REST (Upstash / Vercel KV) when both the URL and
 *     token env vars are present. Durable across serverless invocations.
 *   - "memory": an in-process Map. Ephemeral: it does NOT survive a serverless
 *     cold start or a process restart. Suitable for local development only.
 *
 * Writes return an explicit result so callers can tell durable persistence from
 * an ephemeral fallback and never claim a durable write that did not happen:
 *   { ok: true, durable: boolean, backend: 'upstash'|'memory', degraded?: true }
 * `durable` is true only when the value was written to the Upstash backend. If a
 * configured Upstash write fails and we fall back to the in-process Map, the
 * result is `{ ok: true, durable: false, degraded: true }` - the value is usable
 * for the life of this process but was NOT durably persisted.
 *
 * Keys are never logged (they can encode private identifiers).
 */

// Generic short-lived cache TTL (seconds). Used only when a caller does not
// specify its own retention. Durable memory writes pass an explicit policy.
export const DEFAULT_TTL_SECONDS = 43200; // 12h

// TTL sentinel meaning "no expiry": the record persists until overwritten/deleted.
export const NO_EXPIRY = 0;

function upstashConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || null;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || null;
  if (!url || !token) return null;
  return { url: url.replace(/\/$/, ''), token };
}

const PING_KEY = 'cache:__ping__';

const store = new Map();

export function getBackendInfo() {
  const configured = !!upstashConfig();
  return {
    mode: configured ? 'upstash' : 'memory',
    durable: configured,
  };
}

async function upstashCommand(cfg, command, key, ...args) {
  const url = `${cfg.url}/${command}/${encodeURIComponent(key)}`;
  const headers = { Authorization: `Bearer ${cfg.token}` };

  let res;
  if (args.length > 0) {
    const body = JSON.stringify({ value: args[0], ...(args[1] || {}) });
    res = await fetch(url, { method: 'POST', headers, body });
  } else {
    res = await fetch(url, { headers });
  }
  if (!res.ok) throw new Error(`Upstash error: ${res.status}`);

  // Upstash REST replies with { result: <value> }. Unwrap it; fall back to the
  // raw body for compatibility.
  const json = await res.json();
  return json && typeof json === 'object' && 'result' in json ? json.result : json;
}

function ttlOf(ttlSeconds) {
  return Number.isFinite(ttlSeconds) && ttlSeconds > 0 ? ttlSeconds : NO_EXPIRY;
}

export default {
  async get(key) {
    const cfg = upstashConfig();
    if (cfg) {
      try {
        const result = await upstashCommand(cfg, 'get', key);
        if (result === null || result === undefined) return null;
        const parsed = typeof result === 'string' ? JSON.parse(result) : result;
        return parsed;
      } catch (err) {
        // Do not log the key (it can contain a namespace identifier).
        console.log(`[Cache] Upstash GET failed, using memory fallback: ${err.name || 'Error'}`);
      }
    }

    const entry = store.get(key);
    if (!entry) return null;
    if (entry.expiry && entry.expiry < nowSec()) {
      store.delete(key);
      return null;
    }
    return entry.value;
  },

  async set(key, value, ttlSeconds = DEFAULT_TTL_SECONDS) {
    const serialized = JSON.stringify(value);
    const ttl = ttlSeconds && ttlSeconds > 0 ? ttlSeconds : NO_EXPIRY;
    const cfg = upstashConfig();

    if (cfg) {
      try {
        const args = ttl > 0 ? [{ ex: ttl }] : [];
        await upstashCommand(cfg, 'set', key, serialized, ...args);
        return { ok: true, durable: true, backend: 'upstash' };
      } catch (err) {
        console.log(`[Cache] Upstash SET failed, using memory fallback: ${err.name || 'Error'}`);
        store.set(key, { value, expiry: ttl > 0 ? nowSec() + ttl : null });
        // Written, but NOT durably: surface this so callers never report a
        // durable save when the durable backend rejected the write.
        return { ok: true, durable: false, backend: 'memory', degraded: true };
      }
    }

    store.set(key, { value, expiry: ttl > 0 ? nowSec() + ttl : null });
    return { ok: true, durable: false, backend: 'memory' };
  },

  async del(key) {
    const cfg = upstashConfig();
    if (cfg) {
      try {
        await upstashCommand(cfg, 'del', key);
        return { ok: true, durable: true, backend: 'upstash' };
      } catch (err) {
        console.log(`[Cache] Upstash DEL failed, using memory fallback: ${err.name || 'Error'}`);
        store.delete(key);
        return { ok: true, durable: false, backend: 'memory', degraded: true };
      }
    }

    store.delete(key);
    return { ok: true, durable: false, backend: 'memory' };
  },

  async has(key) {
    const value = await this.get(key);
    return value !== null && value !== undefined;
  },

  /*
   * Honest reachability probe. Unlike get(), it never silently falls back: it
   * reports whether the configured DURABLE backend actually answered. In memory
   * mode it reports reachable (the in-process Map always works) but durable:false.
   */
  async probe() {
    const cfg = upstashConfig();
    if (!cfg) return { reachable: true, durable: false, mode: 'memory' };
    try {
      await upstashCommand(cfg, 'get', PING_KEY);
      return { reachable: true, durable: true, mode: 'upstash' };
    } catch {
      return { reachable: false, durable: false, mode: 'upstash' };
    }
  },
};

function nowSec() {
  return Math.floor(Date.now() / 1000);
}
