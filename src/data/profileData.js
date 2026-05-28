// Centralized source for education, achievements, certifications, and coding profiles
// Used by: EducationAchievementsSection, AI Assistant Context, Terminal Commands

export const profileData = {
  education: [
    {
      id: 'iiit-vadodara',
      school: 'Indian Institute of Information Technology, Vadodara',
      degree: 'Bachelor of Technology (BTech)',
      field: 'Computer Science & Engineering',
      status: 'Pursuing',
      startYear: 2022,
      endYear: 2026,
      cgpa: 8.88,
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
      id: 'hackout-finalist',
      title: 'DAIICT HackOut Finalist',
      description: 'Advanced to finals in DAIICT HackOut 2025 — a competitive hackathon focused on innovative backend and systems solutions.',
      category: 'Competition',
      date: '2025',
      icon: 'trophy',
    },
    {
      id: 'encore-secretary',
      title: 'Joint Secretary, Encore Music Club',
      description: 'Leadership role managing club operations, organizing events, and fostering a community of musicians and performers.',
      category: 'Leadership',
      date: '2023-2024',
      icon: 'users',
    },
    {
      id: 'kala-mahakumbh',
      title: '3-Time District Kala Mahakumbh Winner',
      description: 'Achieved district-level recognition in classical performing arts across three consecutive competitions.',
      category: 'Competition',
      date: '2021-2023',
      icon: 'award',
    },
  ],

  certifications: [
    {
      id: 'kaggle-ml',
      issuer: 'Kaggle',
      title: 'Intro to Machine Learning',
      date: '2024',
      credentialUrl: 'https://www.kaggle.com/learn/intro-to-machine-learning',
    },
    {
      id: 'kaggle-python',
      issuer: 'Kaggle',
      title: 'Python',
      date: '2024',
      credentialUrl: 'https://www.kaggle.com/learn/python',
    },
    {
      id: 'pw-java-dsa',
      issuer: 'Physics Wallah',
      title: 'Decode Java with DSA',
      date: '2023',
      credentialUrl: '#',
    },
  ],

  codingProfiles: [
    {
      id: 'leetcode',
      platform: 'LeetCode',
      username: 'Deep04_Mehta',
      url: 'https://leetcode.com/u/Deep04_Mehta/',
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
