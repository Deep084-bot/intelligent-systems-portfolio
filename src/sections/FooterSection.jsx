import { Github, Linkedin, Code, ExternalLink, Mail } from 'lucide-react';
import profileData from '../data/profile.json';

const pc = profileData.contact || {};

const LINKS_LEFT = [
  { label: 'GitHub', url: pc.github ? `https://${pc.github}` : 'https://github.com/Deep084-bot', icon: Github },
  { label: 'LinkedIn', url: pc.linkedin ? `https://${pc.linkedin}` : 'https://linkedin.com/in/deepmehta', icon: Linkedin },
  { label: 'Email', url: `mailto:${pc.email || 'dpmehta1211@gmail.com'}`, icon: Mail },
];

const LINKS_RIGHT = [
  { label: 'LeetCode', url: pc.leetcode ? `https://${pc.leetcode}` : 'https://leetcode.com/u/Deep04_Mehta/', icon: Code },
  { label: 'CodeChef', url: 'https://www.codechef.com/users/deep04_mehta', icon: ExternalLink },
  { label: 'Codeforces', url: 'https://codeforces.com/profile/dpmehta1211', icon: ExternalLink },
  { label: 'GeeksforGeeks', url: 'https://www.geeksforgeeks.org/profile/deep084?tab=activity', icon: ExternalLink },
];

export const FooterSection = () => (
  <footer className="border-t border-neutral-800 bg-neutral-950">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 sm:gap-8">
        <div>
          <p className="text-sm text-neutral-500">
            &copy; {new Date().getFullYear()} {profileData.name || 'Deep Mehta'}
          </p>
          <p className="text-xs text-neutral-600 mt-1">Backend &middot; AI Engineering &middot; Problem Solving</p>
        </div>
        <div className="flex items-center gap-6">
          {LINKS_LEFT.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                title={link.label}
                className="text-neutral-500 hover:text-accent-400 transition-colors"
              >
                <Icon className="w-4 h-4" />
              </a>
            );
          })}
        </div>
      </div>
      <div className="mt-6 pt-6 border-t border-neutral-800/60 flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className="text-xs text-neutral-600">Coding Profiles</span>
        {LINKS_RIGHT.map((link) => {
          const Icon = link.icon;
          return (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-accent-400 transition-colors"
            >
              <Icon className="w-3.5 h-3.5" />
              {link.label}
            </a>
          );
        })}
      </div>
    </div>
  </footer>
);

export default FooterSection;
