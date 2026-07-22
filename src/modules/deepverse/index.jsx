import { useState, useCallback, lazy, Suspense } from 'react'
import { AnimatePresence } from 'framer-motion'
import Portal from './pages/Portal'
import Hub from './pages/Hub'

const VisionArena = lazy(() => import('./pages/VisionArena'))

export default function DeepVerse({ route, navigate }) {
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

  if (phase === 'hub') {
    return <Hub navigate={navigate} />
  }

  return (
    <AnimatePresence mode="wait">
      <Portal key="portal" onEnter={handleEnter} />
    </AnimatePresence>
  )
}
