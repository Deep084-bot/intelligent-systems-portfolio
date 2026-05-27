import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Github, Linkedin, Code, ArrowRight, Send, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { Section, PageContainer, Stack, Flex } from '../layout';
import { SectionTitle, Button, Input, Textarea } from '../primitives';
import { FadeIn, SlideIn } from '../animations';

import profileData from '../data/profile.json';
const pc = profileData.contact || {};
const SOCIAL_LINKS = [
  { label: 'GitHub', url: pc.github ? `https://${pc.github}` : 'https://github.com/Deep084-bot', icon: Github },
  { label: 'LinkedIn', url: pc.linkedin ? `https://${pc.linkedin}` : 'https://linkedin.com/in/deepmehta', icon: Linkedin },
  { label: 'LeetCode', url: pc.leetcode ? `https://${pc.leetcode}` : 'https://leetcode.com/u/Deep04_Mehta/', icon: Code },
  { label: 'Email', url: `mailto:${pc.email || 'dpmehta1211@gmail.com'}`, icon: Mail },
];

const PLATFORM_LINKS = [
  { label: 'CodeChef', url: 'https://www.codechef.com/users/deep04_mehta', icon: ExternalLink },
  { label: 'Codeforces', url: 'https://codeforces.com/profile/dpmehta1211', icon: ExternalLink },
  { label: 'GeeksforGeeks', url: 'https://www.geeksforgeeks.org/profile/deep084?tab=activity', icon: ExternalLink },
];

const INITIAL_FORM = { name: '', email: '', message: '' };

export const ContactSection = () => {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(null); // null | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus(null);
    setErrorMessage('');

    try {
      const formPayload = new FormData();
      formPayload.append('name', formData.name);
      formPayload.append('email', formData.email);
      formPayload.append('message', formData.message);

      const res = await fetch('https://formspree.io/f/mzdgwyow', {
        method: 'POST',
        body: formPayload,
        headers: { 'Accept': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      setStatus('success');
      setFormData(INITIAL_FORM);
      setTimeout(() => setStatus(null), 5000);
    } catch (err) {
      setStatus('error');
      setErrorMessage(err.message);
      setTimeout(() => setStatus(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Section id="contact" className="bg-gradient-dark">
      <PageContainer>
        <Stack gap={12}>
          <FadeIn>
            <SectionTitle
              title="Let's Connect"
              subtitle="Have an exciting opportunity or just want to chat about systems and AI?"
            />
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {/* Left Column - Contact Info */}
            <SlideIn direction="left" delay={0.1}>
              <Stack gap={8}>
                {/* Email CTA */}
                <motion.a
                  href={`mailto:${pc.email || 'dpmehta1211@gmail.com'}`}
                  whileHover={{ x: 10 }}
                  className="group"
                >
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-neutral-800 border border-neutral-700 hover:border-primary-500/50 transition-all">
                    <div className="w-12 h-12 rounded-lg bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-primary-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-50 group-hover:text-primary-400 transition">Email</p>
                      <p className="text-sm text-neutral-400">{pc.email || 'dpmehta1211@gmail.com'}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-neutral-600 group-hover:text-primary-400 transition ml-auto" />
                  </div>
                </motion.a>

                {/* Social Links */}
                <div>
                  <h3 className="text-sm font-semibold text-neutral-300 mb-3">Connect on Social</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {SOCIAL_LINKS.slice(0, 3).map((link) => {
                      const Icon = link.icon;
                      return (
                        <motion.a
                          key={link.label}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.05 }}
                          className="flex items-center gap-2 px-4 py-3 bg-neutral-800 border border-neutral-700 hover:border-accent-500/50 rounded-lg transition-all"
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-sm font-medium">{link.label}</span>
                        </motion.a>
                      );
                    })}
                  </div>
                </div>

                {/* DSA & Coding Platforms */}
                <div>
                  <h3 className="text-sm font-semibold text-neutral-300 mb-3">Coding Profiles</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {PLATFORM_LINKS.map((link) => {
                      const Icon = link.icon;
                      return (
                        <motion.a
                          key={link.label}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.05 }}
                          className="flex items-center gap-2 px-4 py-3 bg-neutral-800 border border-neutral-700 hover:border-accent-500/50 rounded-lg transition-all"
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-sm font-medium">{link.label}</span>
                        </motion.a>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Facts */}
                <div className="space-y-3 p-4 bg-neutral-800/50 border border-neutral-700 rounded-lg">
                  <p className="text-sm text-neutral-300">
                    <span className="text-accent-400 font-mono">→ </span>
                    Open to internships & full-time roles
                  </p>
                  <p className="text-sm text-neutral-300">
                    <span className="text-accent-400 font-mono">→ </span>
                    Backend, AI/ML, Systems Engineering
                  </p>
                  <p className="text-sm text-neutral-300">
                    <span className="text-accent-400 font-mono">→ </span>
                    Gujarat, India
                  </p>
                </div>
              </Stack>
            </SlideIn>

            {/* Right Column - Contact Form */}
            <SlideIn direction="right" delay={0.2}>
              {status === 'success' ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="h-full flex items-center justify-center"
                >
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-success/20 border border-success/50 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-success" />
                    </div>
                    <h3 className="text-xl font-semibold text-neutral-50">Message Sent!</h3>
                    <p className="text-neutral-400">I'll review and respond soon.</p>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <Input
                    label="Name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Deep Mehta"
                    required
                    minLength={1}
                    maxLength={100}
                  />
                  <Input
                    label="Email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                  />
                  <Textarea
                    label="Message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell me about your project or opportunity..."
                    rows={5}
                    required
                    minLength={10}
                    maxLength={2000}
                  />

                  {status === 'error' && (
                    <div className="flex items-center gap-2 p-3 bg-error/10 border border-error/30 rounded-lg text-sm text-error">
                      <AlertCircle size={16} />
                      {errorMessage || 'Something went wrong. Please try again.'}
                    </div>
                  )}

                  <Button
                    variant="primary"
                    size="lg"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Message
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-neutral-500 text-center">
                    I typically respond within 24 hours
                  </p>
                </form>
              )}
            </SlideIn>
          </div>
        </Stack>
      </PageContainer>
    </Section>
  );
};

export default ContactSection;
