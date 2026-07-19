const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || null;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || null;
const useUpstash = !!(UPSTASH_URL && UPSTASH_TOKEN);

const store = new Map();

async function upstashCommand(command, key, ...args) {
  const url = `${UPSTASH_URL.replace(/\/$/, '')}/${command}/${encodeURIComponent(key)}`;
  const headers = { Authorization: `Bearer ${UPSTASH_TOKEN}` };

  if (args.length > 0) {
    const body = JSON.stringify({ value: args[0], ...(args[1] || {}) });
    const res = await fetch(url, { method: 'POST', headers, body });
    if (!res.ok) throw new Error(`Upstash error: ${res.status}`);
    return res.json();
  }

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Upstash error: ${res.status}`);
  return res.json();
}

export default {
  async get(key) {
    if (useUpstash) {
      try {
        const result = await upstashCommand('get', key);
        if (result === null || result === undefined) return null;
        const parsed = typeof result === 'string' ? JSON.parse(result) : result;
        return parsed;
      } catch (err) {
        console.log(`[Cache] Upstash GET failed for ${key}, falling back: ${err.message}`);
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

  async set(key, value, ttlSeconds = 43200) {
    const serialized = JSON.stringify(value);

    if (useUpstash) {
      try {
        await upstashCommand('set', key, serialized, { ex: ttlSeconds });
        return;
      } catch (err) {
        console.log(`[Cache] Upstash SET failed for ${key}, falling back: ${err.message}`);
      }
    }

    store.set(key, { value, expiry: ttlSeconds ? nowSec() + ttlSeconds : null });
  },

  async del(key) {
    if (useUpstash) {
      try {
        await upstashCommand('del', key);
        return;
      } catch (err) {
        console.log(`[Cache] Upstash DEL failed for ${key}, falling back: ${err.message}`);
      }
    }

    store.delete(key);
  },

  async has(key) {
    const value = await this.get(key);
    return value !== null && value !== undefined;
  },
};

function nowSec() {
  return Math.floor(Date.now() / 1000);
}
