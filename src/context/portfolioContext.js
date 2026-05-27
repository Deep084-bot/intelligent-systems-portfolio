// Centralized portfolio context aggregating all data sources
// Used by: AI Assistant, Terminal Commands, Dashboard, Analytics
// Single source of truth pattern: JSON → Hooks → Context → Components/AI

import profileJSON from '../data/profile.json';
import projectsJSON from '../data/projects.json';
import skillsJSON from '../data/skills.json';
import dsaStatsJSON from '../data/dsa-stats.json';
import achievementsJSON from '../data/achievements.json';
import { profileData } from '../data/profileData';

// Formatted text builders
function formatEducation(education) {
  if (!education || education.length === 0) return 'No education info available.';
  return education
    .map((edu) => {
      const coursework = edu.coursework?.slice(0, 5).join(', ') || 'N/A';
      return `${edu.degree} from ${edu.school} (${edu.startYear}–${edu.endYear})\nCGPA: ${edu.cgpa}\nKey Courses: ${coursework}`;
    })
    .join('\n\n');
}

function formatAchievements(achievements) {
  if (!achievements || achievements.length === 0) return 'No achievements loaded.';
  return achievements
    .map((a) => `${a.title}: ${a.description}${a.stats ? ` (Easy: ${a.stats.easy}, Medium: ${a.stats.medium}, Hard: ${a.stats.hard})` : ''}`)
    .join('\n');
}

function formatSkills(skills) {
  if (!skills || skills.length === 0) return 'No skills data available.';
  return skills
    .map((cat) => {
      const skillsList = (cat.skills || []).map((s) => (typeof s === 'string' ? s : s.name || s)).join(', ');
      return `${cat.category}: ${skillsList}`;
    })
    .join('\n');
}

function formatProjects(projects) {
  if (!projects || projects.length === 0) return 'No projects available.';
  return projects
    .slice(0, 5)
    .map((p) => {
      const tech = (p.tech || p.tags || []).join(', ') || 'N/A';
      return `${p.title} (${p.status || 'N/A'})\nTech: ${tech}\n${p.shortDescription || ''}`;
    })
    .join('\n\n');
}

function formatDSA(dsa) {
  if (!dsa || !dsa.totalSolved) return 'DSA stats not available.';
  const platforms = (dsa.platforms || []).map((p) => `${p.name}: ${p.solved || p.rating || 'N/A'}`).join(', ');
  return `Total: ${dsa.totalSolved} problems\nBreakdown: Easy ${dsa.byDifficulty?.easy || 0}, Medium ${dsa.byDifficulty?.medium || 0}, Hard ${dsa.byDifficulty?.hard || 0}\nPlatforms: ${platforms}`;
}

// Build comprehensive context object
export const buildPortfolioContext = () => {
  const profile = profileJSON;
  const projects = projectsJSON.projects || [];
  const skills = skillsJSON.skills || [];
  const dsa = dsaStatsJSON.dsa || {};
  const achievements = achievementsJSON.achievements || [];
  const { education, certifications, codingProfiles } = profileData;

  return {
    // Raw data objects
    profile,
    projects,
    skills,
    dsa,
    achievements,
    education,
    certifications,
    codingProfiles,

    // Formatted summaries for AI
    formattedEducation: formatEducation(education),
    formattedSkills: formatSkills(skills),
    formattedProjects: formatProjects(projects),
    formattedDSA: formatDSA(dsa),
    formattedAchievements: formatAchievements(achievements),

    // AI System Prompt
    systemPrompt: `You are an AI assistant helping visitors learn about Deep Mehta. You have access to comprehensive portfolio information.

ABOUT DEEP:
${profile.bio || 'A passionate engineer focused on backend systems and AI/ML.'}

EDUCATION:
${formatEducation(education)}

SKILLS:
${formatSkills(skills)}

PROJECTS:
${formatProjects(projects)}

PROBLEM-SOLVING JOURNEY:
${formatDSA(dsa)}

ACHIEVEMENTS:
${formatAchievements(achievements)}

KEY ROLES: ${profile.identity?.primaryRoles?.join(', ') || 'Engineer'}
INTERESTS: ${profile.technicalInterests?.join(', ') || 'Systems, AI, Backend'}

COMMUNICATION STYLE:
- Be specific and technical when discussing projects or problems
- Reference actual project details and tech stacks
- Acknowledge the depth of their engineering work
- Keep responses concise and focused on what matters

ALWAYS:
✓ Reference actual projects, not generic ones
✓ Mention specific technologies used
✓ Connect questions to real portfolio work
✓ Be honest about limitations or unknowns
✗ Don't make up project details
✗ Don't overgeneralize engineering experience`,
  };
};

// Memoized context (recreate only if needed)
let cachedContext = null;
export function getPortfolioContext() {
  if (!cachedContext) {
    cachedContext = buildPortfolioContext();
  }
  return cachedContext;
}

export default getPortfolioContext;
