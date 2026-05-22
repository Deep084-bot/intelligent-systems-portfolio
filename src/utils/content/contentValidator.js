/**
 * Content Validation Utilities
 * Validates loaded content against expected schemas
 */

export class ContentValidator {
  /**
   * Validate project schema
   */
  static validateProject(project) {
    const errors = [];

    // Required fields
    const required = ['id', 'slug', 'title', 'shortDescription', 'tech', 'tags'];
    for (const field of required) {
      if (!project[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Type validation
    if (typeof project.title !== 'string' || project.title.length < 5) {
      errors.push('Title must be a string with at least 5 characters');
    }

    if (!Array.isArray(project.tech) || project.tech.length === 0) {
      errors.push('Tech must be a non-empty array');
    }

    if (!Array.isArray(project.tags) || project.tags.length === 0) {
      errors.push('Tags must be a non-empty array');
    }

    // Link validation
    if (project.links) {
      const validProtocols = ['http', 'https'];
      for (const [key, url] of Object.entries(project.links)) {
        if (url && !validProtocols.some(p => url.startsWith(p + ':'))) {
          errors.push(`Invalid URL in links.${key}: ${url}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate blog metadata
   */
  static validateBlog(metadata) {
    const errors = [];

    const required = ['title', 'slug', 'date', 'author', 'excerpt', 'tags'];
    for (const field of required) {
      if (!metadata[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate date format
    if (metadata.date && isNaN(new Date(metadata.date).getTime())) {
      errors.push('Invalid date format (use YYYY-MM-DD)');
    }

    if (!Array.isArray(metadata.tags)) {
      errors.push('Tags must be an array');
    }

    if (typeof metadata.readingTime !== 'number' || metadata.readingTime < 1) {
      errors.push('Reading time must be a positive number');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate skill category
   */
  static validateSkillCategory(category) {
    const errors = [];

    if (!category.category || typeof category.category !== 'string') {
      errors.push('Category name is required');
    }

    if (!Array.isArray(category.skills) || category.skills.length === 0) {
      errors.push('Skills array must be non-empty');
    }

    for (const skill of category.skills || []) {
      if (!skill.name || typeof skill.name !== 'string') {
        errors.push('Skill name is required');
      }

      if (typeof skill.level !== 'number' || skill.level < 1 || skill.level > 5) {
        errors.push(`Skill level must be 1-5, got: ${skill.level}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate DSA stats
   */
  static validateDSAStats(stats) {
    const errors = [];

    if (typeof stats.totalSolved !== 'number' || stats.totalSolved < 0) {
      errors.push('totalSolved must be a non-negative number');
    }

    if (stats.byDifficulty) {
      const difficulties = ['easy', 'medium', 'hard'];
      for (const diff of difficulties) {
        if (stats.byDifficulty[diff] !== undefined) {
          if (typeof stats.byDifficulty[diff] !== 'number') {
            errors.push(`byDifficulty.${diff} must be a number`);
          }
        }
      }
    }

    if (stats.platforms && Array.isArray(stats.platforms)) {
      for (const platform of stats.platforms) {
        if (!platform.name || !platform.solved) {
          errors.push('Platform must have name and solved count');
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Log validation errors in development
   */
  static logErrors(resource, validation) {
    if (!validation.valid) {
      console.warn(`⚠️  Content validation failed for ${resource}:`);
      validation.errors.forEach(error => {
        console.warn(`   - ${error}`);
      });
    }
  }
}

export default ContentValidator;
