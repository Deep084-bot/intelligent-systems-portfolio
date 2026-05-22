import { useState, useEffect } from 'react';
import matter from 'gray-matter';
import { ContentValidator } from '../../utils/content/contentValidator';
import { ContentFormatter } from '../../utils/content/contentFormatter';

// Use Vite's glob import to discover markdown files at build time
const blogModules = import.meta.glob('/src/content/blog/*.md', { as: 'raw' });

export function useBlogs() {
  const [blogs, setBlogs] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadBlogs = async () => {
      try {
        setLoading(true);
        const entries = Object.entries(blogModules);
        const loaded = [];

        for (const [path, resolver] of entries) {
          try {
            const raw = await resolver();
            const parsed = matter(raw);
            const metadata = parsed.data || {};
            const content = parsed.content || '';

            const validation = ContentValidator.validateBlog(metadata);
            if (!validation.valid) {
              ContentValidator.logErrors(`Blog: ${metadata.title || path}`, validation);
              continue;
            }

            const readingTime = metadata.readingTime || ContentFormatter.calculateReadingTime(content);
            const excerpt = metadata.excerpt || ContentFormatter.generateExcerpt(content, 200);
            const slug = metadata.slug || ContentFormatter.titleToSlug(metadata.title || path);

            loaded.push({
              ...metadata,
              slug,
              readingTime,
              excerpt,
              content,
              _path: path,
            });
          } catch (err) {
            console.warn('Failed to load blog:', path, err);
          }
        }

        const sorted = loaded.sort((a, b) => new Date(b.date) - new Date(a.date));
        setBlogs(sorted);
        setFeatured(sorted.filter(b => b.featured));
        setError(null);
      } catch (err) {
        console.error('Failed to load blogs:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadBlogs();
  }, []);

  return {
    blogs,
    featured,
    loading,
    error,
    isEmpty: blogs.length === 0,
    byTag: (tag) => blogs.filter(b => b.tags && b.tags.includes(tag)),
    bySlug: (slug) => blogs.find(b => b.slug === slug),
    recent: (count = 5) => blogs.slice(0, count),
  };
}

export default useBlogs;
