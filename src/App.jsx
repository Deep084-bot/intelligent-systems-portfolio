import { useEffect, useState } from 'react';
import { LayoutContainer, Navbar } from './components/layout';
import HeroSection from './sections/HeroSection';
import TerminalSection from './sections/TerminalSection';
import EducationAchievementsSection from './sections/EducationAchievementsSection';
import LeetCodeTelemetrySection from './sections/LeetCodeTelemetrySection';
import ProjectsSection from './sections/ProjectsSection';
import ContactSection from './sections/ContactSection';
import FooterSection from './sections/FooterSection';
import {
  DSADashboardSection,
  AIAssistantSection,
} from './sections/PlaceholderSections';
import LoadingScreen from './components/primitives/LoadingScreen';
import './styles/globals.css';

function App() {
  const [showLoader, setShowLoader] = useState(true);

  // Smooth scroll behavior
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
  }, []);

  // Loader visibility is controlled by LoadingScreen flow (onFinish will hide)

  return (
    <LayoutContainer>
      <Navbar />
      {/* Fullscreen loader overlays the app on first load */}
      {showLoader && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-neutral-900">
          <LoadingScreen onFinish={() => { setShowLoader(false); window.dispatchEvent(new Event('app:loaded')); }} />
        </div>
      )}

      <HeroSection />
      <TerminalSection />
      <EducationAchievementsSection />
      <LeetCodeTelemetrySection />
      <ProjectsSection />
      <DSADashboardSection />
      <AIAssistantSection />
      <ContactSection />
      <FooterSection />
    </LayoutContainer>
  );
}

export default App;
