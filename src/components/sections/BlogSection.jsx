/**
 * BlogSection Component
 * Displays recent blog posts with markdown rendering
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useBlogs } from '../../hooks/content';
import { ContentFormatter } from '../../utils/content';
import { ArrowRight, Calendar, Clock } from 'lucide-react';

export function BlogCard({ blog, onClick = () => {} }) {
  const formattedTags = ContentFormatter.formatTags(blog.tags || []);

  return (
    <motion.div
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      className="group cursor-pointer"
      onClick={onClick}
    >
      <div className="bg-dark-secondary border border-dark-secondary/50 rounded-xl p-6 h-full hover:border-accent-green/30 transition-all hover:shadow-lg hover:shadow-accent-green/10">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-2xl font-bold text-text-primary group-hover:text-accent-green transition-colors mb-3">
            {blog.title}
          </h3>
          <p className="text-text-secondary line-clamp-2">
            {blog.excerpt}
          </p>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-text-secondary mb-4 pb-4 border-b border-dark-primary">
          <div className="flex items-center gap-1">
            <Calendar size={16} />
            <span>{ContentFormatter.formatDate(blog.date)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={16} />
            <span>{blog.readingTime} min</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {formattedTags.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="text-xs px-2 py-1 rounded-full bg-dark-primary/50 text-text-secondary"
            >
              #{tag.name}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-2 text-accent-green group-hover:gap-3 transition-all">
          <span className="text-sm font-medium">Read Article</span>
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </motion.div>
  );
}

export function BlogSection({ className = '' }) {
  const { featured, loading, error } = useBlogs();
  const [selectedBlog, setSelectedBlog] = useState(null);

  if (loading) {
    return (
      <section className={`py-20 ${className}`}>
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-text-secondary">Loading blog posts...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={`py-20 ${className}`}>
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-red-400">Error loading blogs: {error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className={`py-20 ${className}`}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">
            Engineering Journal
          </h2>
          <p className="text-xl text-text-secondary max-w-3xl">
            Deep-dive technical articles on backend systems, distributed computing, and engineering principles.
          </p>
        </motion.div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featured.map((blog, idx) => (
            <motion.div
              key={blog.slug}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <BlogCard
                blog={blog}
                onClick={() => setSelectedBlog(blog)}
              />
            </motion.div>
          ))}
        </div>

        {featured.length === 0 && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-text-secondary">No blog posts yet. Stay tuned!</p>
          </motion.div>
        )}
      </div>

      {/* Blog Detail Modal */}
      {selectedBlog && (
        <BlogDetailModal
          blog={selectedBlog}
          onClose={() => setSelectedBlog(null)}
        />
      )}
    </section>
  );
}

function BlogDetailModal({ blog, onClose }) {
  const { MarkdownRenderer } = require('../molecules/MarkdownRenderer');

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-dark-primary relative"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-w-3xl mx-auto px-6 py-12">
          <button
            onClick={onClose}
            className="mb-6 text-text-secondary hover:text-text-primary transition-colors"
          >
            ← Back to Journal
          </button>

          <h1 className="text-5xl font-bold text-text-primary mb-4">
            {blog.title}
          </h1>

          <div className="flex gap-4 text-text-secondary mb-12 pb-8 border-b border-dark-secondary">
            <div className="flex items-center gap-2">
              <Calendar size={18} />
              {ContentFormatter.formatDate(blog.date)}
            </div>
            <div className="flex items-center gap-2">
              <Clock size={18} />
              {blog.readingTime} min read
            </div>
          </div>

          <MarkdownRenderer content={blog.content} />
        </div>
      </motion.div>
    </motion.div>
  );
}

export default BlogSection;
