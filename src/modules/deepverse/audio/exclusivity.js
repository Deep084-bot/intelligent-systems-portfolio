// DeepVerse — audio-source exclusivity.
//
// The procedural MusicEngine and the personal PlaylistEngine are independent
// singletons, but only one full music source may ever play at a time. Those two
// edges used to be wired inside `usePlaylist`, which meant they existed only
// while the "My Music" tab happened to be mounted: leaving that tab (or playing
// a preset from the always-visible player / DeepPet) let a local track and a
// preset play simultaneously.
//
// Installing the edges once for the whole session — independent of component
// lifetime — closes that gap:
//   • before the playlist starts a track -> stop the procedural engine
//   • when the procedural engine starts -> pause the playlist
// The reverse edge cannot loop: stopping the procedural engine only emits an
// `idle` status, which the playlist edge ignores.

import { playlistEngine } from './playlistEngine'
import { musicEngine, MUSIC_STATUS } from './MusicEngine'

// Wire two engines together. Parameterised so the behaviour can be unit-tested
// with fakes; pass nothing to wire the shared singletons. Returns an unsubscribe
// function for the procedural -> playlist edge.
export function wireAudioExclusivity({ playlist = playlistEngine, music = musicEngine } = {}) {
  playlist.onBeforePlay = () => {
    try {
      music.stop()
    } catch {
      /* ignore */
    }
  }

  return music.subscribe((state) => {
    if (state && state.status === MUSIC_STATUS.PLAYING) {
      playlist.pauseIfPlaying()
    }
  })
}

let installed = false

// Install the shared-singleton wiring exactly once per app session so it
// survives any component unmounting.
export function installAudioExclusivity() {
  if (installed) return
  installed = true
  wireAudioExclusivity()
}

// Test seam.
export function _resetAudioExclusivity() {
  installed = false
}
