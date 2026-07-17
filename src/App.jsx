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
  AIAssistantSection,
} from './sections/PlaceholderSections';
import LoadingScreen from './components/primitives/LoadingScreen';
import HandbookPage from './pages/HandbookPage';
import './styles/globals.css';

function App() {
  const [showLoader, setShowLoader] = useState(true);
  const [route, setRoute] = useState(window.location.pathname);

  useEffect(() => {
    const handlePop = () => setRoute(window.location.pathname);
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.style.scrollBehavior = 'smooth';
  }, []);

  const navigate = (path) => {
    window.history.pushState({}, '', path);
    setRoute(path);
  };

  if (route === '/handbook') {
    return <HandbookPage onBack={() => navigate('/')} />;
  }

  return (
    <LayoutContainer>
      <Navbar />
      {showLoader && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-neutral-900">
          <LoadingScreen onFinish={() => { setShowLoader(false); window.dispatchEvent(new Event('app:loaded')); }} />
        </div>
      )}

      <HeroSection />
      <TerminalSection />
      <EducationAchievementsSection />
      <LeetCodeTelemetrySection
        onViewHandbook={() => navigate('/handbook')}
      />
      <ProjectsSection />
      <AIAssistantSection />
      <ContactSection />
      <FooterSection />
    </LayoutContainer>
  );
}

export default App;
