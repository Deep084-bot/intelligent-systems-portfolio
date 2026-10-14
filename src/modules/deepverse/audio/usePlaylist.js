// Binds React to the playlist singleton.
//
// Exclusivity with the shared procedural MusicEngine is installed once for the
// whole app session (see ./exclusivity) rather than for this component's
// lifetime, so leaving the My Music tab never removes the coordination — a local
// track and a procedural preset can no longer play at the same time.

import { useEffect, useSyncExternalStore } from 'react'
import { playlistEngine } from './playlistEngine'
import { installAudioExclusivity } from './exclusivity'

export default function usePlaylist() {
  const snapshot = useSyncExternalStore(
    (cb) => playlistEngine.subscribe(cb),
    () => playlistEngine.getSnapshot(),
    () => playlistEngine.getSnapshot(),
  )

  useEffect(() => {
    installAudioExclusivity()
    playlistEngine.init()
  }, [])

  return snapshot
}
