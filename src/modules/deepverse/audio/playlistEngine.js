// DeepVerse — personal playlist engine.
//
// Owns the user's local audio: the library of imported tracks, the live queue
// (shuffle/repeat aware), playback through a single HTMLAudioElement, custom
// playlists and favourites. It reuses the MusicEngine subscribe/getSnapshot
// contract so components bind with useSyncExternalStore.
//
// Audio never leaves the device: files are played from in-browser Blob URLs and
// persisted (when possible) through PlaylistStore's IndexedDB. This engine is
// deliberately separate from the shared procedural MusicEngine — coordination
// between the two sources lives in the UI layer (see usePlaylist), not here.

import {
  REPEAT_MODES,
  buildOrder,
  clamp01,
  formatDuration,
  isSupportedAudioFile,
  makeId,
  nextRepeatMode,
  stepIndex,
  titleFromFilename,
  toggleId,
  createPlaylist as createPlaylistReducer,
  renamePlaylist as renamePlaylistReducer,
  deletePlaylist as deletePlaylistReducer,
  addToPlaylist as addToPlaylistReducer,
  removeFromPlaylist as removeFromPlaylistReducer,
} from './playlistQueue'
import { PlaylistStore, PERSISTENCE } from './playlistStore'

const DEFAULT_VOLUME = 0.8

function defaultAudioFactory() {
  try {
    if (typeof Audio === 'undefined') return null
    return new Audio()
  } catch {
    return null
  }
}

export class PlaylistEngine {
  constructor({ store = new PlaylistStore(), audioFactory = defaultAudioFactory } = {}) {
    this._store = store
    this._audioFactory = audioFactory
    this._audio = null
    this.listeners = new Set()
    this._snapshot = null

    this.tracks = [] // { id, name, title, duration, favourite, blob, available, persisted, _url }
    this.playlists = []
    this.order = [] // indices into tracks
    this.orderPos = -1
    this.currentId = null
    this.playing = false
    this.positionMs = 0
    this.durationMs = 0
    this.volume = DEFAULT_VOLUME
    this.shuffle = false
    this.repeat = 'off'
    this.persistence = PERSISTENCE.MEMORY
    this.lastError = null
    this.ready = false
    this._lastSecond = -1
    this._persistQueue = Promise.resolve()

    // Set by the UI to stop the other audio source before this one plays.
    this.onBeforePlay = null
  }

  get supported() {
    return !!this._audioFactory && typeof this._audioFactory === 'function'
  }

  async init() {
    if (this.ready) return this.getSnapshot()
    // Cache the in-flight promise so concurrent callers (e.g. React StrictMode's
    // double-invoked effect) share one hydration instead of racing. A late
    // second run previously overwrote freshly-imported tracks with the older
    // persisted library.
    if (!this._initPromise) {
      this._initPromise = this._doInit().catch((err) => {
        this._initPromise = null
        throw err
      })
    }
    try {
      await this._initPromise
    } catch {
      /* leave ready=false; caller may retry */
    }
    return this.getSnapshot()
  }

  // Resolve hydration before a write. Idempotent and safe to call often; used
  // by the mutating APIs so they never persist through a not-yet-resolved
  // backend.
  async _ensureHydrated() {
    if (this.ready) return
    try {
      await this.init()
    } catch {
      /* leave ready=false; writes still go to whatever backend exists */
    }
  }

  async _doInit() {
    this.persistence = await this._store.init()
    const { tracks, playlists } = await this._store.loadLibrary()
    const blobs = await this._store.loadBlobs()
    // If files were imported while hydration was in flight, do not clobber them.
    if (this.tracks.length === 0) {
      this.tracks = (tracks || []).map((t) => {
        const blob = blobs.get(t.id) || null
        return {
          id: t.id,
          name: t.name || '',
          title: t.title || titleFromFilename(t.name || ''),
          duration: Number.isFinite(t.duration) ? t.duration : 0,
          favourite: !!t.favourite,
          blob,
          available: !!blob,
          persisted: !!blob,
          _url: null,
        }
      })
      this.playlists = (playlists || []).map((p) => ({ id: p.id, name: p.name, trackIds: [...(p.trackIds || [])] }))
      // Drop playlist references to tracks that no longer exist.
      const ids = new Set(this.tracks.map((t) => t.id))
      this.playlists = this.playlists.map((p) => ({ ...p, trackIds: p.trackIds.filter((id) => ids.has(id)) }))
    }
    this._rebuildOrder()
    this.ready = true
    this._emit()
  }

  // ---- subscription ---------------------------------------------------------

  subscribe(listener) {
    if (typeof listener !== 'function') return () => {}
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot() {
    if (!this._snapshot) this._snapshot = this._buildSnapshot()
    return this._snapshot
  }

  _buildSnapshot() {
    const currentTrack = this.currentId ? this.tracks.find((t) => t.id === this.currentId) : null
    return {
      ready: this.ready,
      persistence: this.persistence,
      lastError: this.lastError,
      tracks: this.tracks.map((t) => ({
        id: t.id,
        name: t.name,
        title: t.title,
        duration: t.duration,
        favourite: t.favourite,
        available: t.available,
        persisted: t.persisted,
      })),
      playlists: this.playlists.map((p) => ({ id: p.id, name: p.name, trackIds: [...p.trackIds] })),
      currentId: this.currentId,
      current: currentTrack
        ? { id: currentTrack.id, title: currentTrack.title, available: currentTrack.available }
        : null,
      playing: this.playing,
      positionMs: this.positionMs,
      durationMs: this.durationMs,
      volume: this.volume,
      shuffle: this.shuffle,
      repeat: this.repeat,
      hasTracks: this.tracks.length > 0,
      positionLabel: formatDuration(this.positionMs / 1000),
      durationLabel: formatDuration(this.durationMs / 1000),
    }
  }

  _emit() {
    this._snapshot = this._buildSnapshot()
    for (const listener of Array.from(this.listeners)) {
      try {
        listener(this._snapshot)
      } catch {
        /* ignore listener errors */
      }
    }
  }

  _persist() {
    this._persistQueue = this._persistQueue
      .then(() => this._store.saveLibrary({ tracks: this.tracks, playlists: this.playlists }))
      .catch(() => {})
    return this._persistQueue
  }

  // ---- audio plumbing -------------------------------------------------------

  _ensureAudio() {
    if (this._audio) return this._audio
    const audio = this._audioFactory ? this._audioFactory() : null
    if (!audio) return null
    this._audio = audio
    try {
      audio.volume = this.volume
    } catch {
      /* ignore */
    }
    const on = (ev, fn) => {
      try {
        audio.addEventListener?.(ev, fn)
      } catch {
        /* ignore */
      }
    }
    on('loadedmetadata', () => {
      this.durationMs = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration * 1000 : this.durationMs
      const track = this.tracks.find((t) => t.id === this.currentId)
      if (track && this.durationMs > 0) track.duration = this.durationMs / 1000
      this._emit()
    })
    on('timeupdate', () => {
      this.positionMs = (audio.currentTime || 0) * 1000
      const sec = Math.floor(this.positionMs / 1000)
      if (sec !== this._lastSecond) {
        this._lastSecond = sec
        this._emit()
      }
    })
    on('play', () => {
      this.playing = true
      this._emit()
    })
    on('pause', () => {
      this.playing = false
      this._emit()
    })
    on('ended', () => this._handleEnded())
    on('error', () => this._handleAudioError())
    return audio
  }

  _urlFor(track) {
    if (!track) return null
    if (track._url) return track._url
    if (!track.blob) return null
    try {
      track._url = URL.createObjectURL(track.blob)
    } catch {
      track._url = null
    }
    return track._url
  }

  _revoke(track) {
    if (track && track._url) {
      try {
        URL.revokeObjectURL(track._url)
      } catch {
        /* ignore */
      }
      track._url = null
    }
  }

  // ---- library import -------------------------------------------------------

  async addFiles(fileList) {
    // Persistence backend must be resolved before we write: importing during the
    // brief hydration window would otherwise store bytes in the in-memory
    // fallback and report the library as session-only even when IndexedDB is
    // available.
    await this._ensureHydrated()
    const files = Array.from(fileList || [])
    const added = []
    const skipped = []
    for (const file of files) {
      if (!isSupportedAudioFile(file)) {
        skipped.push(file.name)
        continue
      }
      const id = makeId('track')
      const track = {
        id,
        name: file.name,
        title: titleFromFilename(file.name),
        duration: 0,
        favourite: false,
        blob: file,
        available: true,
        persisted: false,
        _url: null,
      }
      this.tracks.push(track)
      // Persist the bytes when we can; otherwise it stays session-only.
      const res = await this._store.saveBlob(id, file).catch(() => ({ persisted: false }))
      track.persisted = !!(res && res.persisted)
      added.push(id)
    }
    this._rebuildOrder()
    await this._persist()
    this.lastError = skipped.length
      ? { code: 'UNSUPPORTED_SKIPPED', message: `${skipped.length} file(s) skipped as unsupported`, detail: skipped.join(', ') }
      : null
    this._emit()
    return { added: added.length, skipped }
  }

  async replaceTrackFile(id, file) {
    const track = this.tracks.find((t) => t.id === id)
    if (!track || !isSupportedAudioFile(file)) return { ok: false }
    await this._ensureHydrated()
    this._revoke(track)
    track.blob = file
    track.name = file.name
    track.title = titleFromFilename(file.name)
    track.available = true
    track.duration = 0
    const res = await this._store.saveBlob(id, file).catch(() => ({ persisted: false }))
    track.persisted = !!(res && res.persisted)
    await this._persist()
    this._emit()
    return { ok: true }
  }

  async removeTrack(id) {
    const idx = this.tracks.findIndex((t) => t.id === id)
    if (idx < 0) return
    const track = this.tracks[idx]
    if (this.currentId === id) {
      this._stopAudio()
      this.currentId = null
      this.playing = false
    }
    this._revoke(track)
    this.tracks.splice(idx, 1)
    this.playlists = this.playlists.map((p) => ({ ...p, trackIds: p.trackIds.filter((t) => t !== id) }))
    await this._store.deleteBlob(id).catch(() => {})
    this._rebuildOrder()
    await this._persist()
    this._emit()
  }

  async clearLibrary() {
    this._stopAudio()
    this.currentId = null
    this.playing = false
    for (const t of this.tracks) this._revoke(t)
    this.tracks = []
    for (const p of this.playlists) p.trackIds = []
    await this._store.clearBlobs().catch(() => {})
    this._rebuildOrder()
    await this._persist()
    this._emit()
  }

  // ---- order / queue --------------------------------------------------------

  _trackIndex(id) {
    return this.tracks.findIndex((t) => t.id === id)
  }

  // Rebuild the order array. When shuffling, the current track is pinned to the
  // front so toggling shuffle never interrupts what is playing.
  _rebuildOrder() {
    const count = this.tracks.length
    const currentIndex = this.currentId ? this._trackIndex(this.currentId) : -1
    if (!this.shuffle) {
      this.order = buildOrder(count, { shuffle: false })
    } else {
      this.order = buildOrder(count, { shuffle: true })
      if (currentIndex >= 0) {
        const at = this.order.indexOf(currentIndex)
        if (at > 0) {
          this.order.splice(at, 1)
          this.order.unshift(currentIndex)
        }
      }
    }
    this.orderPos = currentIndex >= 0 ? this.order.indexOf(currentIndex) : -1
  }

  // ---- playback -------------------------------------------------------------

  async play(id) {
    const idx = this._trackIndex(id)
    if (idx < 0) return this.getSnapshot()
    return this.playAt(idx)
  }

  async playAt(trackIndex) {
    const track = this.tracks[trackIndex]
    if (!track) return this.getSnapshot()
    if (!track.available) {
      this.lastError = { code: 'FILE_MISSING', message: 'This file is not available. Reselect it to play.', trackId: track.id }
      this._emit()
      return this.getSnapshot()
    }
    const audio = this._ensureAudio()
    const url = this._urlFor(track)
    if (!audio || !url) {
      this.lastError = { code: 'PLAYBACK_UNSUPPORTED', message: 'Playback is not supported in this browser.' }
      this._emit()
      return this.getSnapshot()
    }
    // Give the other audio source a chance to stop first.
    try {
      this.onBeforePlay?.()
    } catch {
      /* ignore */
    }
    this.currentId = track.id
    this.positionMs = 0
    this.durationMs = Number.isFinite(track.duration) ? track.duration * 1000 : 0
    this._lastSecond = -1
    this.orderPos = this.order.indexOf(trackIndex)
    this.lastError = null
    try {
      audio.src = url
      audio.volume = this.volume
      audio.currentTime = 0
      const p = audio.play()
      if (p && typeof p.then === 'function') await p
      this.playing = true
    } catch (err) {
      const name = err && err.name
      this.playing = false
      this.lastError =
        name === 'NotAllowedError'
          ? { code: 'AUTOPLAY_BLOCKED', message: 'Playback was blocked. Press play to start.', trackId: track.id }
          : { code: 'PLAYBACK_FAILED', message: 'Could not play this file.', trackId: track.id }
    }
    this._emit()
    return this.getSnapshot()
  }

  toggle() {
    if (this.playing) {
      this.pause()
    } else if (this.currentId) {
      this.resume()
    } else {
      const firstAvailable = this.order.find((i) => this.tracks[i]?.available)
      if (firstAvailable != null) this.playAt(firstAvailable)
    }
  }

  pause() {
    if (this._audio) {
      try {
        this._audio.pause()
      } catch {
        /* ignore */
      }
    }
    this.playing = false
    this._emit()
    return this.getSnapshot()
  }

  async resume() {
    if (!this.currentId || this.playing) return this.getSnapshot()
    const audio = this._ensureAudio()
    if (!audio) return this.getSnapshot()
    try {
      this.onBeforePlay?.()
    } catch {
      /* ignore */
    }
    try {
      const p = audio.play()
      if (p && typeof p.then === 'function') await p
      this.playing = true
      this.lastError = null
    } catch (err) {
      this.playing = false
      this.lastError = { code: 'PLAYBACK_FAILED', message: 'Could not resume playback.' }
    }
    this._emit()
    return this.getSnapshot()
  }

  next() {
    return this._step(1)
  }

  prev() {
    return this._step(-1)
  }

  _step(direction) {
    if (this.order.length === 0) return this.getSnapshot()
    const { pos, ended } = stepIndex({
      length: this.order.length,
      pos: this.orderPos,
      direction,
      repeat: this.repeat,
    })
    if (ended && direction > 0 && this.repeat === 'off') {
      this.pause()
      this.lastError = { code: 'QUEUE_ENDED', message: 'End of queue.' }
      this._emit()
      return this.getSnapshot()
    }
    this.orderPos = pos
    return this.playAt(this.order[pos])
  }

  seek(ms) {
    if (!this._audio) return
    const sec = Math.max(0, ms / 1000)
    try {
      this._audio.currentTime = sec
    } catch {
      /* ignore */
    }
    this.positionMs = sec * 1000
    this._emit()
  }

  setVolume(value) {
    const v = clamp01(value)
    this.volume = v == null ? this.volume : v
    if (this._audio) {
      try {
        this._audio.volume = this.volume
      } catch {
        /* ignore */
      }
    }
    this._emit()
    return this.getSnapshot()
  }

  setShuffle(on) {
    this.shuffle = !!on
    this._rebuildOrder()
    this._emit()
    return this.getSnapshot()
  }

  cycleRepeat() {
    this.repeat = nextRepeatMode(this.repeat)
    this._emit()
    return this.getSnapshot()
  }

  setRepeat(mode) {
    if (REPEAT_MODES.includes(mode)) this.repeat = mode
    this._emit()
    return this.getSnapshot()
  }

  _handleEnded() {
    if (this.repeat === 'one') {
      const audio = this._ensureAudio()
      if (audio) {
        try {
          audio.currentTime = 0
          const p = audio.play()
          if (p && typeof p.then === 'function') p.catch(() => {})
          this.playing = true
        } catch {
          /* ignore */
        }
      }
      this._emit()
      return
    }
    this._step(1)
  }

  _handleAudioError() {
    this.playing = false
    this.lastError = { code: 'PLAYBACK_FAILED', message: 'This file could not be played. It may be unsupported.', trackId: this.currentId }
    this._emit()
  }

  _stopAudio() {
    if (this._audio) {
      try {
        this._audio.pause()
        this._audio.removeAttribute?.('src')
        this._audio.load?.()
      } catch {
        /* ignore */
      }
    }
  }

  // Called by the UI when the procedural engine takes over.
  pauseIfPlaying() {
    if (this.playing) this.pause()
  }

  clearError() {
    this.lastError = null
    this._emit()
  }

  // ---- favourites -----------------------------------------------------------

  toggleFavourite(id) {
    const track = this.tracks.find((t) => t.id === id)
    if (!track) return
    track.favourite = !track.favourite
    this._persist()
    this._emit()
  }

  // ---- custom playlists -----------------------------------------------------

  createPlaylist(name) {
    this.playlists = createPlaylistReducer(this.playlists, name)
    this._persist()
    this._emit()
  }

  renamePlaylist(id, name) {
    this.playlists = renamePlaylistReducer(this.playlists, id, name)
    this._persist()
    this._emit()
  }

  deletePlaylist(id) {
    this.playlists = deletePlaylistReducer(this.playlists, id)
    this._persist()
    this._emit()
  }

  addToPlaylist(id, trackId) {
    this.playlists = addToPlaylistReducer(this.playlists, id, trackId)
    this._persist()
    this._emit()
  }

  removeFromPlaylist(id, trackId) {
    this.playlists = removeFromPlaylistReducer(this.playlists, id, trackId)
    this._persist()
    this._emit()
  }

  // Play every track in a playlist (in stored order), starting at the first
  // available entry.
  playPlaylist(id) {
    const pl = this.playlists.find((p) => p.id === id)
    if (!pl) return
    const indices = pl.trackIds.map((tid) => this._trackIndex(tid)).filter((i) => i >= 0)
    if (indices.length === 0) return
    this.shuffle = false
    this.order = indices
    this.currentId = null
    const firstAvailable = indices.find((i) => this.tracks[i]?.available)
    if (firstAvailable != null) {
      this.orderPos = this.order.indexOf(firstAvailable)
      this.playAt(firstAvailable)
    } else {
      this.orderPos = 0
      this.lastError = { code: 'FILE_MISSING', message: 'No playable files in this playlist. Reselect them.' }
      this._emit()
    }
  }

  // Test seam.
  _reset() {
    this._stopAudio()
    for (const t of this.tracks) this._revoke(t)
    this.tracks = []
    this.playlists = []
    this.order = []
    this.orderPos = -1
    this.currentId = null
    this.playing = false
    this.positionMs = 0
    this.durationMs = 0
    this.volume = DEFAULT_VOLUME
    this.shuffle = false
    this.repeat = 'off'
    this.lastError = null
    this.listeners.clear()
    this._snapshot = null
    this.ready = false
    this._initPromise = null
    this._audio = null
  }
}

export const playlistEngine = new PlaylistEngine()

export { DEFAULT_VOLUME, toggleId }
