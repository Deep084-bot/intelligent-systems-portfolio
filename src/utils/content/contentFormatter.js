/**
 * Content Formatting Utilities
 * Formats content for display and rendering
 */

export class ContentFormatter {
  /**
   * Format date to readable string
   * @param {string|Date} date
   * @returns {string} "May 22, 2024"
   */
  static formatDate(date) {
    if (!date) return '';
    
    const d = new Date(date);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return d.toLocaleDateString('en-US', options);
  }

  /**
   * Format date to ISO string for storage
   * @param {Date} date
   * @returns {string} "2024-05-22"
   */
  static formatDateISO(date) {
    return new Date(date).toISOString().split('T')[0];
  }

  /**
   * Generate slug from title
   * @param {string} title
   * @returns {string} "distributed-cache-system"
   */
  static titleToSlug(title) {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with dashes
      .replace(/-+/g, '-') // Replace multiple dashes with single
      .slice(0, 50); // Limit length
  }

  /**
   * Extract first N words from text
   * @param {string} text
   * @param {number} wordCount
   * @returns {string}
   */
  static truncateText(text, wordCount = 30) {
    const words = text.split(/\s+/).slice(0, wordCount);
    const truncated = words.join(' ');
    return wordCount < text.split(/\s+/).length 
      ? truncated + '...' 
      : truncated;
  }

  /**
   * Calculate reading time in minutes
   * @param {string} text
   * @param {number} wordsPerMinute
   * @returns {number}
   */
  static calculateReadingTime(text, wordsPerMinute = 200) {
    const wordCount = text.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  /**
   * Format tech stack for display
   * @param {string[]} tech
   * @returns {string} "Go, Redis, Kubernetes"
   */
  static formatTechStack(tech) {
    return Array.isArray(tech) ? tech.join(', ') : '';
  }

  /**
   * Format tags for display with proper styling
   * @param {string[]} tags
   * @returns {object[]} [{ name: 'Backend', color: 'emerald' }, ...]
   */
  static formatTags(tags) {
    const tagColors = {
      'backend': 'emerald',
      'frontend': 'blue',
      'systems': 'purple',
      'ai/ml': 'pink',
      'data': 'orange',
      'devops': 'red',
      'distributed-systems': 'purple',
      'algorithms': 'indigo',
      'problem-solving': 'cyan',
      'optimization': 'yellow',
    };

    return tags.map(tag => ({
      name: tag,
      color: tagColors[tag.toLowerCase()] || 'slate',
    }));
  }

  /**
   * Format number with commas
   * @param {number} num
   * @returns {string} "1,234,567"
   */
  static formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  /**
   * Format performance metric
   * @param {number} value
   * @param {string} unit
   * @returns {string} "500K requests/second"
   */
  static formatMetric(value, unit = '') {
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M ${unit}`;
    }
    if (value >= 1_000) {
      return `${(value / 1_000).toFixed(1)}K ${unit}`;
    }
    return `${value} ${unit}`;
  }

  /**
   * Format status badge
   * @param {string} status
   * @returns {object} { label: "In Progress", color: "blue" }
   */
  static formatStatus(status) {
    const statusMap = {
      'complete': { label: 'Complete', color: 'emerald', icon: '✓' },
      'in-progress': { label: 'In Progress', color: 'blue', icon: '⚙' },
      'planned': { label: 'Planned', color: 'slate', icon: '○' },
      'archived': { label: 'Archived', color: 'gray', icon: '-' },
    };

    return statusMap[status?.toLowerCase()] || { 
      label: status, 
      color: 'slate',
      icon: '•',
    };
  }

  /**
   * Generate excerpt from text
   * @param {string} text
   * @param {number} length
   * @returns {string}
   */
  static generateExcerpt(text, length = 160) {
    // Remove markdown syntax
    const cleaned = text
      .replace(/[#*_`]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();

    if (cleaned.length <= length) {
      return cleaned;
    }

    // Truncate at word boundary
    const excerpt = cleaned.slice(0, length);
    const lastSpace = excerpt.lastIndexOf(' ');
    return excerpt.slice(0, lastSpace > 0 ? lastSpace : length) + '...';
  }

  /**
   * Format URI-safe filename
   * @param {string} filename
   * @returns {string}
   */
  static sanitizeFilename(filename) {
    return filename
      .toLowerCase()
      .replace(/[^a-z0-9-_.]/g, '')
      .replace(/\.{2,}/g, '.');
  }
}

export default ContentFormatter;
