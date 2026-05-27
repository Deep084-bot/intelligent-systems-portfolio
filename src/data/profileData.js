// Centralized source for education, achievements, certifications, and coding profiles
// Used by: EducationAchievementsSection, AI Assistant Context, Terminal Commands

export const profileData = {
  education: [
    {
      id: 'iiit-vadodara',
      school: 'IIIT Vadodara',
      degree: 'Bachelor of Technology (BTech)',
      field: 'Computer Science & Engineering',
      status: 'Pursuing',
      startYear: 2022,
      endYear: 2026,
      cgpa: 8.2,
      coursework: [
        'Data Structures & Algorithms',
        'Operating Systems',
        'Database Management Systems',
        'Computer Networks',
        'Web Development',
        'Software Engineering',
        'System Design',
        'Distributed Systems',
      ],
      highlights: [
        'Strong focus on backend engineering and distributed systems',
        'Active in competitive programming and DSA practice',
        'Exploring AI/ML integration in systems',
      ],
    },
  ],

  achievements: [
    {
      id: 'dsa-741',
      title: '741 DSA Problems Solved',
      description: 'Consistent problem-solving across multiple platforms. 184 easy, 312 medium, 47 hard.',
      category: 'Problem Solving',
      date: '2024',
      icon: 'target',
      stats: {
        easy: 184,
        medium: 312,
        hard: 47,
        total: 541,
      },
    },
    {
      id: 'leetcode-streak',
      title: '146-Day LeetCode Streak',
      description: 'Maintained consistent daily practice and problem-solving discipline.',
      category: 'Discipline',
      date: '2024',
      icon: 'zap',
    },
    {
      id: 'portfolio-ai',
      title: 'Portfolio AI Integration',
      description: 'Designed and implemented a production-grade portfolio website with RAG-powered AI assistant using Groq API and vector embeddings.',
      category: 'Project',
      date: '2024',
      icon: 'brain',
      tech: ['React', 'Node.js', 'Groq API', 'Vector DB', 'Express'],
    },
    {
      id: 'backend-systems',
      title: 'Backend Systems Development',
      description: 'Strong focus on building scalable, efficient backend systems with proper error handling, caching, and optimization.',
      category: 'Engineering',
      date: '2023-2024',
      icon: 'server',
    },
  ],

  certifications: [
    {
      id: 'cert-1',
      title: 'Advanced Backend Engineering',
      issuer: 'Self-Study',
      date: '2024',
      description: 'Through building production systems and open-source contributions',
      credentialId: 'portfolio-projects',
    },
    {
      id: 'cert-2',
      title: 'AI/ML Systems Integration',
      issuer: 'Practical Implementation',
      date: '2024',
      description: 'LLM integration, RAG pipelines, prompt engineering, API integration',
      credentialId: 'portfolio-ai-project',
    },
  ],

  codingProfiles: [
    {
      id: 'leetcode',
      platform: 'LeetCode',
      username: 'Deep04_Mehta',
      url: 'https://leetcode.com/u/Deep04_Mehta/',
      stats: {
        solved: 541,
        easy: 184,
        medium: 312,
        hard: 47,
        contests: 35,
        rating: 1784,
      },
    },
    {
      id: 'codechef',
      platform: 'CodeChef',
      username: 'deep04_mehta',
      url: 'https://www.codechef.com/users/deep04_mehta',
    },
    {
      id: 'codeforces',
      platform: 'Codeforces',
      username: 'dpmehta1211',
      url: 'https://codeforces.com/profile/dpmehta1211',
    },
    {
      id: 'gfg',
      platform: 'GeeksforGeeks',
      username: 'deep084',
      url: 'https://www.geeksforgeeks.org/profile/deep084?tab=activity',
    },
  ],
};

export default profileData;
