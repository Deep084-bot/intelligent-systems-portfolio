// DeepVerse — React binding for the shared music engine.
//
// A thin useSyncExternalStore wrapper so any component can render the one true
// playback state (engine, preset, volume, paused) without duplicating it.

import { useSyncExternalStore } from 'react'
import { musicEngine } from './MusicEngine'

export default function useMusicEngine() {
  return useSyncExternalStore(
    (cb) => musicEngine.subscribe(cb),
    () => musicEngine.getSnapshot(),
    () => musicEngine.getSnapshot(),
  )
}

export { musicEngine }
