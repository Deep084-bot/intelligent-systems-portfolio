import matter from 'gray-matter';

// In-memory cache for content (in production, use Redis)
const contentCache = new Map();
const CACHE_TTL = 1 * 60 * 60 * 1000; // 1 hour

export class ContentLoader {
  /**
   * Load and parse JSON file
   */
  static async loadJSON(path) {
    const cacheKey = `json:${path}`;

    if (contentCache.has(cacheKey)) {
      const cached = contentCache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
      }
    }

    try {
      const module = await import(path);
      const data = module.default || module;

      contentCache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error(`Failed to load JSON: ${path}`, error);
      throw new Error(`Failed to load content from ${path}`);
    }
  }

  /**
   * Load markdown content from raw text or from a URL
   * Returns { metadata, content }
   */
  static async loadMarkdown(pathOrRaw, { isRaw = false } = {}) {
    const cacheKey = `md:${pathOrRaw}`;

    if (contentCache.has(cacheKey)) {
      const cached = contentCache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
      }
    }

    try {
      const text = isRaw ? pathOrRaw : await (await fetch(pathOrRaw)).text();
      const parsed = matter(text);
      const data = {
        metadata: parsed.data || {},
        content: parsed.content || '',
      };

      contentCache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error(`Failed to load markdown: ${pathOrRaw}`, error);
      throw new Error(`Failed to load markdown from ${pathOrRaw}`);
    }
  }

  static clearCache() {
    contentCache.clear();
  }

  static clearCacheEntry(cacheKey) {
    contentCache.delete(cacheKey);
  }
}

export default ContentLoader;
