/**
 * INTEGRATION EXAMPLE: How to use content sections in your App
 * 
 * This file shows how to import and use the dynamic content sections
 * in your main application. Copy this pattern to add content to pages.
 */

import React from 'react';

// Import section components (these handle all content loading automatically)
import { ProjectsSection, BlogSection } from '@/components/sections';

/**
 * Example: Homepage with Dynamic Content
 * 
 * All content loads automatically from JSON/Markdown files.
 * No hardcoding needed.
 */
export function HomePage() {
  return (
    <div className="bg-dark-primary">
      {/* Hero Section - add your own or use existing */}
      {/* <HeroSection /> */}

      {/* Featured Projects - automatically loads from src/data/projects.json */}
      <ProjectsSection className="py-20" />

      {/* Engineering Blog - automatically loads from src/content/blog/*.md */}
      <BlogSection className="py-20 bg-dark-secondary/50" />

      {/* Add more sections as needed */}
      {/* <SkillsSection /> */}
      {/* <TerminalSection /> */}
      {/* <DSASection /> */}
    </div>
  );
}

/**
 * Example: Using individual hooks to build custom sections
 */
function CustomProjectsPage() {
  const { projects, featured, loading, error } = useProjects();
  const { profile } = useProfile();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>All {projects.length} Projects by {profile.name}</h1>
      
      {/* Display all projects (not just featured) */}
      <div className="grid grid-cols-3 gap-4">
        {projects.map(project => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      {/* Filter by tag */}
      <h2>Backend Projects</h2>
      <div className="grid grid-cols-3 gap-4">
        {projects.byTag('Backend').map(project => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}

/**
 * Example: Using markdown rendering directly
 */
function BlogPostPage({ slug }) {
  const { blogs } = useBlogs();
  const blog = blogs.bySlug(slug);

  if (!blog) return <div>Blog not found</div>;

  return (
    <div className="max-w-3xl mx-auto py-12">
      <h1>{blog.title}</h1>
      <p>{blog.date} • {blog.readingTime} min read</p>
      
      {/* Render markdown content with automatic styling */}
      <MarkdownRenderer content={blog.content} />
    </div>
  );
}

/**
 * Example: Terminal section with dynamic commands
 */
function TerminalPage() {
  const { commands, execute } = useTerminalCommands();

  const handleCommand = (name) => {
    const output = execute(name);
    // Display output in terminal UI
  };

  return (
    <div>
      <h1>Terminal</h1>
      <TerminalComponent 
        commands={commands}
        onExecute={handleCommand}
      />
    </div>
  );
}

/**
 * Example: Profile section with dynamic skills & achievements
 */
function ProfilePage() {
  const { profile, skills, achievements, dsaStats, loading } = useProfile();

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-12">
      <section>
        <h1>{profile.name}</h1>
        <p>{profile.title}</p>
        <p>{profile.longBio}</p>
      </section>

      <section>
        <h2>Skills</h2>
        {skills.map(category => (
          <div key={category.category}>
            <h3>{category.category}</h3>
            {category.skills.map(skill => (
              <div key={skill.name}>
                {skill.name} - Level {skill.level}/5
              </div>
            ))}
          </div>
        ))}
      </section>

      <section>
        <h2>Achievements</h2>
        {achievements.map(achievement => (
          <div key={achievement.id}>
            <h3>{achievement.title}</h3>
            <p>{achievement.description}</p>
          </div>
        ))}
      </section>

      <section>
        <h2>Problem-Solving Stats</h2>
        <p>Total Solved: {dsaStats.totalSolved}</p>
        <p>Expert Rating: {dsaStats.platforms[0].rating}</p>
      </section>
    </div>
  );
}

/**
 * IMPORTS YOU'LL NEED
 */
import {
  useProjects,
  useBlogs,
  useProfile,
  useTerminalCommands,
} from '@/hooks/content';

import {
  ProjectCard,
  MarkdownRenderer,
} from '@/components/molecules';

import {
  ProjectDetailView,
} from '@/components/organisms';

import {
  ProjectsSection,
  BlogSection,
} from '@/components/sections';

export {
  HomePage,
  CustomProjectsPage,
  BlogPostPage,
  TerminalPage,
  ProfilePage,
};
