/**
 * Hook: useTerminalCommands
 * Loads and manages terminal commands from configuration
 */

import { useState, useEffect } from 'react';
import commandsData from '../../data/terminal-commands.json';
import { useProfile } from './useProfile';
import { useProjects } from './useProjects';
import { useBlogs } from './useBlogs';

export function useTerminalCommands() {
  const [commands, setCommands] = useState([]);
  const { profile, skills, achievements, dsaStats } = useProfile();
  const { projects } = useProjects();
  const { blogs } = useBlogs();

  useEffect(() => {
    if (!profile) return;

    // Build command executor with context
    const commandExecutors = {
      whoami: () => `${profile.name}
Title: ${profile.title}
${profile.shortBio}

Focus Areas: ${profile.focusAreas.map(a => a.title).join(', ')}`,

      skills: () => {
        if (!skills.length) return 'No skills loaded';
        return skills.map(category => 
          `${category.category}:\n  ${category.skills.map(s => 
            `• ${typeof s === 'string' ? s : s.name}`
          ).join('\n  ')}`
        ).join('\n\n');
      },

      projects: () => {
        if (!projects.length) return 'No projects available';
        const featured = projects.filter(p => p.featured).slice(0, 5);
        return featured.map(p => 
          `${p.title}\n  Status: ${p.status} | Tech: ${p.tech.join(', ')}`
        ).join('\n\n');
      },

      achievements: () => {
        if (!achievements.length) return 'No achievements yet';
        return achievements.map(a => 
          `[${a.category}] ${a.title}\n  ${a.description}`
        ).join('\n\n');
      },

      dsa: () => {
        if (!dsaStats) return 'DSA stats not available';
        return `Problem-Solving Stats:
Total Solved: ${dsaStats.totalSolved}
Easy: ${dsaStats.byDifficulty.easy} | Medium: ${dsaStats.byDifficulty.medium} | Hard: ${dsaStats.byDifficulty.hard}

Top Categories:
${dsaStats.byCategory.slice(0, 5).map(c => 
  `• ${c.name}: ${c.count} problems`
).join('\n')}

Platforms:
${dsaStats.platforms.map(p => 
  `• ${p.name}: ${p.solved} solved (Rating: ${p.rating})`
).join('\n')}`;
      },

      'currently-learning': () => {
        if (!profile.currentlyLearning) return 'No learning path set';
        return `${profile.currentlyLearning.title}

${profile.currentlyLearning.description}

Resources:
${profile.currentlyLearning.resources.map(r => 
  `• ${r}`
).join('\n')}`;
      },

      blog: () => {
        if (!blogs.length) return 'No blog posts yet';
        return blogs.slice(0, 5).map(b => 
          `${b.title} (${b.date})\n  ${b.excerpt}\n  → /blog/${b.slug}`
        ).join('\n\n');
      },

      contact: () => {
        const links = Object.entries(profile.socialLinks || {})
          .map(([platform, url]) => `• ${platform}: ${url}`)
          .join('\n');
        return `Email: ${profile.email}
Website: ${profile.website}
Location: ${profile.location}

Social:
${links}`;
      },

      help: () => {
        const visible = commands.filter(c => !c.hidden);
        return `Available Commands:\n\n${visible.map(c => 
          `${c.name.padEnd(20)} - ${c.description}`
        ).join('\n')}

Type a command to execute it.`;
      },

      clear: () => {
        // Special handling in terminal component
        return '__CLEAR__';
      },
    };

    // Load command definitions and attach executors
    const enrichedCommands = (commandsData.commands || []).map(cmd => ({
      ...cmd,
      execute: commandExecutors[cmd.name] || (() => `Unknown command: ${cmd.name}`),
    }));

    setCommands(enrichedCommands);
  }, [profile, skills, achievements, dsaStats, projects, blogs]);

  return {
    commands,
    getCommand: (name) => commands.find(c => c.name === name),
    execute: (name) => {
      const cmd = commands.find(c => c.name === name);
      return cmd ? cmd.execute() : `Command not found: ${name}`;
    },
    getVisibleCommands: () => commands.filter(c => !c.hidden),
  };
}

export default useTerminalCommands;
