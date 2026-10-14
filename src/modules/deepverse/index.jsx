import { useState, useCallback, lazy, Suspense } from 'react'
import { AnimatePresence } from 'framer-motion'
import Portal from './pages/Portal'
import Hub from './pages/Hub'
import DeepPet from './components/DeepPet/DeepPet'

const VisionArena = lazy(() => import('./pages/VisionArena'))
const Cosmos = lazy(() => import('./pages/Cosmos'))
const MusicLab = lazy(() => import('./pages/MusicLab'))
const ReadingRoom = lazy(() => import('./pages/ReadingRoom'))
const SystemDesign = lazy(() => import('./pages/SystemDesign'))
const InsideMyMind = lazy(() => import('./pages/InsideMyMind'))
const DeepPetWorld = lazy(() => import('./pages/DeepPet'))

export default function DeepVerse({ route, navigate }) {
  const inPetWorld = route === '/deepverse/deeppet'
  return (
    <>
      <DeepVerseWorlds route={route} navigate={navigate} />
      {/* The floating companion is rendered once, globally. It is hidden inside
          its own world, where the large centrepiece is the same pet — this keeps
          exactly one DeepPet instance on screen at any time. */}
      {!inPetWorld && <DeepPet route={route} navigate={navigate} />}
    </>
  );
}

function DeepVerseWorlds({ route, navigate }) {
  const [phase, setPhase] = useState('portal')

  const handleEnter = useCallback(() => {
    setPhase('hub')
  }, [])

  if (route === '/deepverse/vision-arena') {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-neutral-700 border-t-primary-500 animate-spin" />
        </div>
      }>
        <VisionArena navigate={navigate} />
      </Suspense>
    )
  }

  if (route === '/deepverse/cosmos') {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-neutral-700 border-t-primary-500 animate-spin" />
        </div>
      }>
        <Cosmos navigate={navigate} />
      </Suspense>
    )
  }

  if (route === '/deepverse/music-lab') {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-neutral-700 border-t-primary-500 animate-spin" />
        </div>
      }>
        <MusicLab navigate={navigate} />
      </Suspense>
    )
  }

  if (route === '/deepverse/reading-room') {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-neutral-700 border-t-primary-500 animate-spin" />
        </div>
      }>
        <ReadingRoom navigate={navigate} />
      </Suspense>
    )
  }

  if (route === '/deepverse/system-design') {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-neutral-700 border-t-primary-500 animate-spin" />
        </div>
      }>
        <SystemDesign navigate={navigate} />
      </Suspense>
    )
  }

  if (route === '/deepverse/inside-my-mind') {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-neutral-700 border-t-primary-500 animate-spin" />
        </div>
      }>
        <InsideMyMind navigate={navigate} />
      </Suspense>
    )
  }

  if (route === '/deepverse/deeppet') {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-neutral-700 border-t-primary-500 animate-spin" />
        </div>
      }>
        <DeepPetWorld navigate={navigate} />
      </Suspense>
    )
  }

  if (phase === 'hub') {
    return <Hub navigate={navigate} />
  }

  return (
    <AnimatePresence mode="wait">
      <Portal key="portal" onEnter={handleEnter} />
    </AnimatePresence>
  )
}
