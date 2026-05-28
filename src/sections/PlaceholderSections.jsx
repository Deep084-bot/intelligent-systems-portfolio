import { motion } from 'framer-motion';
import { Section, PageContainer, Stack } from '../layout';
import { SectionTitle } from '../primitives';
import { FadeIn } from '../animations';

import ChatAssistant from '../components/ai/ChatAssistant';

export const AIAssistantSection = () => {
  return (
    <Section id="ai-assistant" className="bg-neutral-900">
      <div className="w-full">
        {/* Section header at normal width */}
        <PageContainer>
          <FadeIn>
            <SectionTitle
              title="AI Assistant"
              subtitle="Ask me about my projects, skills, and learning journey."
            />
          </FadeIn>
        </PageContainer>

        {/* Assistant card at wider width */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-12">
          <FadeIn>
            <ChatAssistant />
          </FadeIn>
        </div>
      </div>
    </Section>
  );
};

export default {
  AIAssistantSection,
};
