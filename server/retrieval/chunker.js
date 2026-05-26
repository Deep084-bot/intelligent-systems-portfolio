/*
 * retrieval/chunker.js - splits loaded data into independent retrievable chunks.
 *
 * Each chunk is a self-contained unit with:
 *  - id: unique identifier
 *  - category: topic classification
 *  - content: text content for the prompt
 *  - keywords: searchable terms
 *  - source: origin (profile/project/skill/blog/dsa)
 *
 * Chunks are small and focused to allow precise retrieval.
 */

export function createProfileChunks(profile) {
  if (!profile) return [];
  const chunks = [];

  // Identity chunk
  if (profile.name || profile.title || profile.bio) {
    chunks.push({
      id: 'profile-identity',
      category: ['general', 'projects', 'backend', 'learning'],
      content: [
        profile.name && `Name: ${profile.name}`,
        profile.title && `Title: ${profile.title}`,
        profile.bio && `Bio: ${profile.bio}`,
        profile.location && `Location: ${profile.location}`,
      ].filter(Boolean).join('\n'),
      keywords: ['deep mehta', 'student', 'engineer', 'bio', 'about', 'who is'],
      source: 'profile',
      weight: 1,
    });
  }

  // Technical interests chunk
  if (profile.technicalInterests?.length) {
    chunks.push({
      id: 'profile-interests',
      category: ['general', 'learning', 'backend', 'ai'],
      content: `Technical Interests: ${profile.technicalInterests.join(', ')}`,
      keywords: ['interests', 'technical interests', ...profile.technicalInterests.map(t => t.toLowerCase())],
      source: 'profile',
      weight: 1,
    });
  }

  // Strengths chunk
  if (profile.strengths?.length) {
    chunks.push({
      id: 'profile-strengths',
      category: ['general', 'learning', 'backend', 'dsa'],
      content: `Strengths: ${profile.strengths.join(', ')}`,
      keywords: ['strengths', 'good at', ...profile.strengths.map(s => s.toLowerCase())],
      source: 'profile',
      weight: 1,
    });
  }

  // Current focus chunk
  const focusParts = [];
  if (profile.currentFocus?.academics?.length) {
    focusParts.push(`Academics: ${profile.currentFocus.academics.join(', ')}`);
  }
  if (profile.currentFocus?.engineering?.length) {
    focusParts.push(`Engineering Focus: ${profile.currentFocus.engineering.join(', ')}`);
  }
  if (profile.currentFocus?.projectFocus?.length) {
    focusParts.push(`Project Focus: ${profile.currentFocus.projectFocus.join(', ')}`);
  }
  if (focusParts.length) {
    chunks.push({
      id: 'profile-focus',
      category: ['general', 'learning', 'backend', 'ai'],
      content: `Current Focus:\n${focusParts.join('\n')}`,
      keywords: ['focus', 'learning', 'studying', 'working on', 'currently'],
      source: 'profile',
      weight: 1,
    });
  }

  // Currently learning chunk
  if (profile.currentlyLearning?.length) {
    chunks.push({
      id: 'profile-learning',
      category: ['learning', 'general', 'ai', 'backend'],
      content: `Currently Learning: ${profile.currentlyLearning.join(', ')}`,
      keywords: ['learning', 'studying', 'currently', ...profile.currentlyLearning.map(l => l.toLowerCase())],
      source: 'profile',
      weight: 2,
    });
  }

  // Career direction chunk
  if (profile.careerDirection?.length) {
    chunks.push({
      id: 'profile-career',
      category: ['learning', 'general'],
      content: `Career Direction: ${profile.careerDirection.join(', ')}`,
      keywords: ['career', 'goals', 'future', 'aspirations', 'direction'],
      source: 'profile',
      weight: 1,
    });
  }

  // Contact chunk
  if (profile.contact && Object.keys(profile.contact).length) {
    const contactLines = Object.entries(profile.contact).map(([k, v]) => `${k}: ${v}`);
    chunks.push({
      id: 'profile-contact',
      category: ['general'],
      content: `Contact:\n${contactLines.join('\n')}`,
      keywords: ['contact', 'email', 'github', 'linkedin', 'hire', 'reach'],
      source: 'profile',
      weight: 3,
    });
  }

  return chunks;
}

export function createProjectChunks(projects) {
  if (!Array.isArray(projects)) return [];
  return projects.map(p => {
    const lines = [`[PROJECT] ${p.title}`];
    if (p.shortDescription) lines.push(`Description: ${p.shortDescription}`);
    if (p.tech?.length) lines.push(`Tech: ${p.tech.join(', ')}`);
    if (p.architecture) lines.push(`Architecture: ${p.architecture}`);
    if (p.challenges?.length) lines.push(`Challenges: ${p.challenges.join('; ')}`);
    if (p.learnings) lines.push(`Learnings: ${p.learnings}`);

    return {
      id: `project-${p.id || p.title?.toLowerCase().replace(/\s+/g, '-')}`,
      category: Array.isArray(p.category) ? p.category : ['general'],
      content: lines.join('\n'),
      keywords: [
        p.title?.toLowerCase(),
        ...(Array.isArray(p.tags) ? p.tags.map(t => t.toLowerCase()) : []),
        ...(Array.isArray(p.tech) ? p.tech.map(t => t.toLowerCase()) : []),
        ...(Array.isArray(p.keywords) ? p.keywords : []),
      ],
      source: 'project',
      weight: 2,
    };
  });
}

export function createSkillChunks(skills) {
  if (!Array.isArray(skills)) return [];
  return skills.map(s => {
    const skillNames = Array.isArray(s.skills)
      ? (typeof s.skills[0] === 'string' ? s.skills : s.skills.map(sk => sk.name || sk))
      : [];

    const catLower = s.category?.toLowerCase() || '';
    const catMap = {
      'backend engineering': ['backend'],
      'frontend development': ['general'],
      'databases & storage': ['databases', 'backend'],
      'devops & deployment': ['devops'],
      'problem-solving': ['dsa'],
    };

    return {
      id: `skill-${catLower.replace(/\s+/g, '-')}`,
      category: catMap[catLower] || ['general'],
      content: `[SKILLS] ${s.category} (${s.proficiency || 'N/A'}): ${skillNames.join(', ')}`,
      keywords: [
        catLower,
        ...skillNames.map(n => n.toLowerCase()),
        ...(Array.isArray(s.keywords) ? s.keywords : []),
        'skills', 'proficient', 'experienced',
      ],
      source: 'skill',
      weight: 1,
    };
  });
}

export function createDSATreeChunks(dsa) {
  if (!dsa) return [];
  const chunks = [];

  if (dsa.totalSolved >= 0) {
    const byDiff = dsa.byDifficulty || {};
    chunks.push({
      id: 'dsa-overview',
      category: ['dsa'],
      content: `[DSA] Total Problems Solved: ${dsa.totalSolved} (Easy: ${byDiff.easy || 0}, Medium: ${byDiff.medium || 0}, Hard: ${byDiff.hard || 0})`,
      keywords: ['dsa', 'problems', 'solved', 'leetcode', 'coding', 'competitive', 'algorithm', 'data structure'],
      source: 'dsa',
      weight: 3,
    });
  }

  if (dsa.byCategory?.length) {
    const categories = dsa.byCategory.map(c => `${c.name}: ${c.count}`).join(', ');
    chunks.push({
      id: 'dsa-categories',
      category: ['dsa'],
      content: `[DSA] By Topic: ${categories}`,
      keywords: ['arrays', 'strings', 'trees', 'graphs', 'dp', 'dynamic programming', 'linked list', 'stack', 'queue', 'heaps', 'sorting', 'binary search', 'hash table'],
      source: 'dsa',
      weight: 2,
    });
  }

  if (dsa.platforms?.length) {
    const platforms = dsa.platforms.map(p => `${p.name}: ${p.solved ? p.solved + ' solved' : ''}${p.rating ? ' rating ' + p.rating : ''}`.trim()).join(', ');
    chunks.push({
      id: 'dsa-platforms',
      category: ['dsa'],
      content: `[DSA] Platforms: ${platforms}`,
      keywords: ['leetcode', 'codechef', 'codeforces', 'geeksforgeeks', 'rating', 'platform'],
      source: 'dsa',
      weight: 1,
    });
  }

  if (dsa.stats) {
    const stats = Object.entries(dsa.stats).map(([k, v]) => `${k}: ${v}`).join(', ');
    chunks.push({
      id: 'dsa-stats',
      category: ['dsa'],
      content: `[DSA] Stats: ${stats}`,
      keywords: ['streak', 'accuracy', 'time', 'hours', 'consistency'],
      source: 'dsa',
      weight: 1,
    });
  }

  return chunks;
}

export function createBlogChunks(blogs) {
  if (!Array.isArray(blogs)) return [];
  return blogs.map(b => ({
    id: `blog-${b.slug || b.title?.toLowerCase().replace(/\s+/g, '-')}`,
    category: Array.isArray(b.category) ? b.category : ['general'],
    content: `[BLOG] ${b.title}:\n${b.excerpt || b.content?.slice(0, 300)}`,
    keywords: [
      b.title?.toLowerCase(),
      ...(Array.isArray(b.tags) ? b.tags.map(t => t.toLowerCase()) : []),
      ...(Array.isArray(b.keywords) ? b.keywords : []),
      'blog', 'note', 'engineering', 'article',
    ],
    source: 'blog',
    weight: 2,
  }));
}

export function chunkAll(data) {
  if (!data || typeof data !== 'object') return [];
  return [
    ...createProfileChunks(data.profile),
    ...createProjectChunks(data.projects),
    ...createSkillChunks(data.skills),
    ...createDSATreeChunks(data.dsa),
    ...createBlogChunks(data.blogs),
  ];
}
