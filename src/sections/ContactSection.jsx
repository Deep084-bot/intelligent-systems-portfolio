import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Github, Linkedin, Twitter, ArrowRight } from 'lucide-react';
import { Section, PageContainer, Stack, Flex } from '../layout';
import { SectionTitle, Button, Input, Textarea } from '../primitives';
import { FadeIn, SlideIn } from '../animations';

export const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitted(true);
    setFormData({ name: '', email: '', message: '' });
    setIsSubmitting(false);

    // Reset success message after 3 seconds
    setTimeout(() => setIsSubmitted(false), 3000);
  };

  const socialLinks = [
    {
      label: 'GitHub',
      url: 'https://github.com',
      icon: Github,
    },
    {
      label: 'LinkedIn',
      url: 'https://linkedin.com',
      icon: Linkedin,
    },
    {
      label: 'Twitter',
      url: 'https://twitter.com',
      icon: Twitter,
    },
    {
      label: 'Email',
      url: 'mailto:deep@example.com',
      icon: Mail,
    },
  ];

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
                  href="mailto:deep@example.com"
                  whileHover={{ x: 10 }}
                  className="group"
                >
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-neutral-800 border border-neutral-700 hover:border-primary-500/50 transition-all">
                    <div className="w-12 h-12 rounded-lg bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-primary-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-50 group-hover:text-primary-400 transition">Email</p>
                      <p className="text-sm text-neutral-400">deep@example.com</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-neutral-600 group-hover:text-primary-400 transition ml-auto" />
                  </div>
                </motion.a>

                {/* Social Links */}
                <div>
                  <h3 className="text-sm font-semibold text-neutral-300 mb-3">Connect on Social</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {socialLinks.slice(0, 3).map((link) => {
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

                {/* Quick Facts */}
                <div className="space-y-3 p-4 bg-neutral-800/50 border border-neutral-700 rounded-lg">
                  <p className="text-sm text-neutral-300">
                    <span className="text-accent-400 font-mono">→ </span>
                    Open to internships & full-time roles
                  </p>
                  <p className="text-sm text-neutral-300">
                    <span className="text-accent-400 font-mono">→ </span>
                    Interested in Backend, AI/ML, Systems
                  </p>
                  <p className="text-sm text-neutral-300">
                    <span className="text-accent-400 font-mono">→ </span>
                    Based in [Your Location]
                  </p>
                </div>
              </Stack>
            </SlideIn>

            {/* Right Column - Contact Form */}
            <SlideIn direction="right" delay={0.2}>
              {isSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="h-full flex items-center justify-center"
                >
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-success/20 border border-success/50 flex items-center justify-center">
                      <span className="text-3xl">✓</span>
                    </div>
                    <h3 className="text-xl font-semibold text-neutral-50">Message Sent!</h3>
                    <p className="text-neutral-400">I'll get back to you soon.</p>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <Input
                    label="Name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Deep Mehta"
                    required
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
                  />
                  <Button
                    variant="primary"
                    size="lg"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                    {!isSubmitting && <ArrowRight className="w-5 h-5" />}
                  </Button>
                  <p className="text-xs text-neutral-500 text-center">
                    I'll respond within 24 hours
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
