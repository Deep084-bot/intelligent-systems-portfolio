import { useEffect } from 'react';
import { LayoutContainer, Navbar } from './components/layout';
import HeroSection from './sections/HeroSection';
import TerminalSection from './sections/TerminalSection';
import ProjectsSection from './sections/ProjectsSection';
import ContactSection from './sections/ContactSection';
import FooterSection from './sections/FooterSection';
import {
  DSADashboardSection,
  AIAssistantSection,
  EngineeringNotesSection,
  GitHubIntelligenceSection,
} from './sections/PlaceholderSections';
import './styles/globals.css';

function App() {
  // Smooth scroll behavior
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
  }, []);

  return (
    <LayoutContainer>
      <Navbar />
      <HeroSection />
      <TerminalSection />
      <ProjectsSection />
      <DSADashboardSection />
      <AIAssistantSection />
      <EngineeringNotesSection />
      <GitHubIntelligenceSection />
      <ContactSection />
      <FooterSection />
    </LayoutContainer>
  );
}

export default App;
