// DeepVerse — pure playlist logic.
//
// No browser APIs, no DOM, no audio. Everything here is a pure function so the
// queue/shuffle/repeat maths, filename handling and playlist reducers can be
// unit-tested in isolation. The PlaylistEngine composes these with the
// HTMLAudioElement and the IndexedDB store.

const AUDIO_EXTENSIONS = ['mp3', 'wav', 'ogg', 'oga', 'm4a', 'aac', 'flac', 'opus', 'webm', 'mp4']

export const REPEAT_MODES = ['off', 'all', 'one']

export function extensionOf(name) {
  const m = /\.([a-z0-9]+)$/i.exec(typeof name === 'string' ? name : '')
  return m ? m[1].toLowerCase() : ''
}

// A human title from a filename: drop the extension, turn separators into
// spaces, collapse whitespace. Falls back to the original name.
export function titleFromFilename(name) {
  if (typeof name !== 'string' || !name) return ''
  const base = name.replace(/\.[^./\\]+$/, '')
  const cleaned = base.replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim()
  return cleaned || name
}

// Best-effort support check. Browsers often leave `file.type` empty, so we also
// accept by extension. Actual decoding failures are surfaced at playback time.
export function isSupportedAudioFile(file) {
  if (!file || typeof file.name !== 'string') return false
  const type = typeof file.type === 'string' ? file.type.toLowerCase() : ''
  if (type.startsWith('audio/')) return true
  return AUDIO_EXTENSIONS.includes(extensionOf(file.name))
}

export function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '--:--'
  const total = Math.floor(seconds)
  const s = total % 60
  const m = Math.floor(total / 60) % 60
  const h = Math.floor(total / 3600)
  const pad = (n) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

export function clamp01(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return null
  if (n < 0) return 0
  if (n > 1) return 1
  return n
}

let uidCounter = 0
export function makeId(prefix = 'track') {
  uidCounter += 1
  return `${prefix}_${Date.now().toString(36)}_${uidCounter.toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

// Fisher–Yates. `rng` is injectable for deterministic tests.
export function buildOrder(count, { shuffle = false, rng = Math.random } = {}) {
  const order = Array.from({ length: Math.max(0, count) }, (_, i) => i)
  if (!shuffle) return order
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = order[i]
    order[i] = order[j]
    order[j] = tmp
  }
  return order
}

// Step through an order array. `direction` is +1 (next) or -1 (previous).
// Returns the new position and whether we ran off the end.
export function stepIndex({ length, pos, direction, repeat = 'off' }) {
  if (length <= 0) return { pos: -1, ended: true }
  const next = pos + direction
  if (direction >= 0) {
    if (next < length) return { pos: next, ended: false }
    if (repeat === 'all') return { pos: 0, ended: false }
    return { pos: length - 1, ended: true }
  }
  if (next >= 0) return { pos: next, ended: false }
  if (repeat === 'all') return { pos: length - 1, ended: false }
  return { pos: 0, ended: false }
}

export function nextRepeatMode(mode) {
  const i = REPEAT_MODES.indexOf(mode)
  return REPEAT_MODES[(i + 1) % REPEAT_MODES.length]
}

// ---- immutable reducers (favourites + custom playlists) ---------------------

export function toggleId(list, id) {
  const arr = Array.isArray(list) ? list : []
  return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]
}

export function createPlaylist(playlists, name) {
  const clean = (typeof name === 'string' ? name.trim() : '') || 'Untitled playlist'
  return [...playlists, { id: makeId('pl'), name: clean, trackIds: [] }]
}

export function renamePlaylist(playlists, id, name) {
  const clean = (typeof name === 'string' ? name.trim() : '') || 'Untitled playlist'
  return playlists.map((p) => (p.id === id ? { ...p, name: clean } : p))
}

export function deletePlaylist(playlists, id) {
  return playlists.filter((p) => p.id !== id)
}

export function addToPlaylist(playlists, id, trackId) {
  return playlists.map((p) =>
    p.id === id && !p.trackIds.includes(trackId) ? { ...p, trackIds: [...p.trackIds, trackId] } : p,
  )
}

export function removeFromPlaylist(playlists, id, trackId) {
  return playlists.map((p) => (p.id === id ? { ...p, trackIds: p.trackIds.filter((t) => t !== trackId) } : p))
}
