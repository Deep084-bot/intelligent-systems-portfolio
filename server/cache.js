// Lightweight in-memory cache with TTL for development
const store = new Map();

function nowSec() { return Math.floor(Date.now() / 1000); }

export default {
  async get(key) {
    const entry = store.get(key);
    if (!entry) return null;
    if (entry.expiry && entry.expiry < nowSec()) { store.delete(key); return null; }
    return entry.value;
  },
  async set(key, value, ttlSeconds = 300) {
    const expiry = ttlSeconds ? nowSec() + ttlSeconds : null;
    store.set(key, { value, expiry });
  },
  async del(key) { store.delete(key); },
  // lightweight stats for status endpoints
  async stats() {
    const keys = Array.from(store.keys());
    return { keysCount: keys.length, keys: keys.slice(0, 50) };
  }
};
