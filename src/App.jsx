import { useEffect, useState, lazy, Suspense } from 'react';
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

const DeepVerse = lazy(() => import('./modules/deepverse'));

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

  if (route.startsWith('/deepverse')) {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-neutral-700 border-t-primary-500 animate-spin" />
        </div>
      }>
        <DeepVerse route={route} navigate={navigate} />
      </Suspense>
    );
  }

  return (
    <LayoutContainer>
      <Navbar onNavigate={navigate} />
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
