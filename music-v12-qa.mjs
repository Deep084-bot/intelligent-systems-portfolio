// DeepVerse v12 unit QA — Focus Sessions + personal playlist logic/engine.
// Run via esbuild bundle + node (see package scripts / docs).

import { FocusSession, FOCUS_MODE, FOCUS_STATUS, formatClock, LONG_BREAK_EVERY } from './src/modules/deepverse/audio/focusSession.js'
import {
  titleFromFilename,
  isSupportedAudioFile,
  formatDuration,
  buildOrder,
  stepIndex,
  nextRepeatMode,
  toggleId,
  createPlaylist,
  addToPlaylist,
  removeFromPlaylist,
  deletePlaylist,
  renamePlaylist,
} from './src/modules/deepverse/audio/playlistQueue.js'
import { PlaylistEngine, playlistEngine } from './src/modules/deepverse/audio/playlistEngine.js'
import { PERSISTENCE } from './src/modules/deepverse/audio/playlistStore.js'
import { musicEngine, MUSIC_STATUS } from './src/modules/deepverse/audio/MusicEngine.js'
import {
  wireAudioExclusivity,
  installAudioExclusivity,
  _resetAudioExclusivity,
} from './src/modules/deepverse/audio/exclusivity.js'
import { CollisionEngine } from './src/modules/deepverse/pages/MusicLab/core/CollisionEngine.js'
import { InteractionOrchestrator } from './src/modules/deepverse/pages/MusicLab/core/InteractionOrchestrator.js'

let passed = 0
let failed = 0
const failures = []

function ok(cond, name, detail) {
  if (cond) {
    passed++
  } else {
    failed++
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`)
  }
}
function eq(actual, expected, name) {
  ok(Object.is(actual, expected), name, `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
}

// ---- test doubles -----------------------------------------------------------

function fakeStorage() {
  const map = new Map()
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    _map: map,
  }
}

function makeMockAudio() {
  return {
    src: '',
    volume: 1,
    currentTime: 0,
    duration: 0,
    paused: true,
    _listeners: {},
    addEventListener(ev, fn) {
      ;(this._listeners[ev] = this._listeners[ev] || []).push(fn)
    },
    removeEventListener() {},
    play() {
      this.paused = false
      this._fire('play')
      return Promise.resolve()
    },
    pause() {
      this.paused = true
      this._fire('pause')
    },
    load() {},
    removeAttribute() {},
    _fire(ev) {
      ;(this._listeners[ev] || []).forEach((fn) => fn({ type: ev }))
    },
  }
}

function makeMockStore({ tracks = [], playlists = [], blobs = new Map() } = {}) {
  let saved = { tracks, playlists }
  return {
    async init() {
      this.persistence = PERSISTENCE.MEMORY
      return PERSISTENCE.MEMORY
    },
    async loadLibrary() {
      return saved
    },
    async loadBlobs() {
      return blobs
    },
    async saveLibrary(lib) {
      saved = { tracks: lib.tracks, playlists: lib.playlists }
      return { ok: true }
    },
    async saveBlob() {
      return { ok: true, persisted: false }
    },
    async deleteBlob() {
      return { ok: true }
    },
    async clearBlobs() {
      return { ok: true }
    },
  }
}

// URL.createObjectURL is not meaningful for our plain-object stand-ins.
globalThis.URL.createObjectURL = () => `blob:mock/${Math.random().toString(36).slice(2)}`
globalThis.URL.revokeObjectURL = () => {}

// ==== FocusSession ===========================================================

;(function focusTests() {
  let now = 1_000_000
  const storage = fakeStorage()
  const fs = new FocusSession({ storage, now: () => now })

  eq(fs.status, FOCUS_STATUS.IDLE, 'focus: initial status idle')
  eq(fs.durationMs(FOCUS_MODE.FOCUS), 25 * 60000, 'focus: default 25 min')
  eq(fs.remainingMs(), 25 * 60000, 'focus: initial remaining = duration')

  // start + timestamp-derived remaining
  fs.start()
  eq(fs.status, FOCUS_STATUS.RUNNING, 'focus: running after start')
  now += 60_000
  eq(fs.remainingMs(), 24 * 60000, 'focus: remaining derives from clock (60s elapsed)')

  // pause freezes remaining, resume re-anchors
  fs.pause()
  eq(fs.status, FOCUS_STATUS.PAUSED, 'focus: paused')
  now += 5 * 60_000
  eq(fs.remainingMs(), 24 * 60000, 'focus: paused remaining does not advance')
  fs.resume()
  eq(fs.status, FOCUS_STATUS.RUNNING, 'focus: resumed')
  now += 60_000
  eq(fs.remainingMs(), 23 * 60000, 'focus: resumes from stored remaining')

  // natural completion -> counts a focus round, idles on short break
  now += 23 * 60000
  fs.tick()
  eq(fs.status, FOCUS_STATUS.COMPLETE, 'focus: completes at zero')
  eq(fs.completed, 1, 'focus: completed count increments')
  eq(fs.mode, FOCUS_MODE.SHORT_BREAK, 'focus: suggests short break next')
  eq(fs.remainingMs(), 5 * 60000, 'focus: next duration loaded')

  // every Nth focus round -> long break
  fs.completed = LONG_BREAK_EVERY - 1
  fs.selectMode(FOCUS_MODE.FOCUS)
  fs.start()
  now += 25 * 60000
  fs.tick()
  eq(fs.completed, LONG_BREAK_EVERY, 'focus: count reaches cycle')
  eq(fs.mode, FOCUS_MODE.LONG_BREAK, 'focus: long break after cycle')

  // breaks do not increment completed
  const before = fs.completed
  fs.start(FOCUS_MODE.SHORT_BREAK)
  now += 5 * 60000
  fs.tick()
  eq(fs.completed, before, 'focus: break does not increment count')

  // reset + duration clamps
  fs.reset()
  eq(fs.status, FOCUS_STATUS.IDLE, 'focus: reset to idle')
  fs.setDuration(FOCUS_MODE.FOCUS, 0)
  eq(fs.preferences[FOCUS_MODE.FOCUS], 1, 'focus: duration clamps to min 1')
  fs.setDuration(FOCUS_MODE.FOCUS, 999)
  eq(fs.preferences[FOCUS_MODE.FOCUS], 180, 'focus: duration clamps to max 180')

  // persistence round-trip
  fs.completed = 7
  fs.setDuration(FOCUS_MODE.FOCUS, 30)
  fs.setMusicEnabled(true)
  fs.setPresetId('focus-mode')
  const restored = new FocusSession({ storage, now: () => now })
  eq(restored.completed, 7, 'focus: completed persisted')
  eq(restored.preferences[FOCUS_MODE.FOCUS], 30, 'focus: duration persisted')
  eq(restored.musicEnabled, true, 'focus: music flag persisted')
  eq(restored.presetId, 'focus-mode', 'focus: preset persisted')

  // subscribe emits
  let emissions = 0
  const unsub = fs.subscribe(() => emissions++)
  fs.start()
  fs.tick(now)
  ok(emissions > 0, 'focus: subscribers notified')
  unsub()

  eq(formatClock(0), '00:00', 'formatClock: zero')
  eq(formatClock(65_000), '01:05', 'formatClock: mm:ss')
  eq(formatClock(3_600_000), '60:00', 'formatClock: hours as minutes')
})()

// ==== playlistQueue (pure) ===================================================

;(function queueTests() {
  eq(titleFromFilename('my_song_01.mp3'), 'my song 01', 'title: strips ext + underscores')
  eq(titleFromFilename('Track.WAV'), 'Track', 'title: uppercase ext')
  eq(titleFromFilename(''), '', 'title: empty')
  eq(titleFromFilename('.hidden'), '.hidden', 'title: dotfile fallback')

  ok(isSupportedAudioFile({ name: 'a.mp3', type: '' }), 'support: mp3 by ext')
  ok(isSupportedAudioFile({ name: 'a', type: 'audio/ogg' }), 'support: by mime')
  ok(!isSupportedAudioFile({ name: 'a.txt', type: 'text/plain' }), 'support: rejects text')
  ok(!isSupportedAudioFile(null), 'support: rejects null')

  eq(formatDuration(0), '0:00', 'duration: zero')
  eq(formatDuration(65), '1:05', 'duration: 1:05')
  eq(formatDuration(3661), '1:01:01', 'duration: hours')
  eq(formatDuration(NaN), '--:--', 'duration: NaN guard')

  const ordered = buildOrder(4)
  ok(JSON.stringify(ordered) === '[0,1,2,3]', 'order: unshuffled identity')
  const seq = [0.1, 0.9, 0.3, 0.7, 0.2, 0.5]
  let i = 0
  const shuffled = buildOrder(3, { shuffle: true, rng: () => seq[i++ % seq.length] })
  eq(shuffled.length, 3, 'order: shuffle length preserved')
  ok(new Set(shuffled).size === 3, 'order: shuffle is a permutation')

  eq(stepIndex({ length: 3, pos: 0, direction: 1, repeat: 'off' }).pos, 1, 'step: next')
  ok(stepIndex({ length: 3, pos: 2, direction: 1, repeat: 'off' }).ended, 'step: end off')
  eq(stepIndex({ length: 3, pos: 2, direction: 1, repeat: 'all' }).pos, 0, 'step: wrap all')
  eq(stepIndex({ length: 3, pos: 0, direction: -1, repeat: 'off' }).pos, 0, 'step: prev clamp')
  eq(stepIndex({ length: 3, pos: 0, direction: -1, repeat: 'all' }).pos, 2, 'step: prev wrap')
  ok(stepIndex({ length: 0, pos: -1, direction: 1, repeat: 'off' }).ended, 'step: empty ends')

  eq(nextRepeatMode('off'), 'all', 'repeat: off→all')
  eq(nextRepeatMode('all'), 'one', 'repeat: all→one')
  eq(nextRepeatMode('one'), 'off', 'repeat: one→off')

  ok(JSON.stringify(toggleId([], 'x')) === '["x"]', 'toggleId: add')
  ok(JSON.stringify(toggleId(['x'], 'x')) === '[]', 'toggleId: remove')

  let pls = createPlaylist([], '  Chill  ')
  eq(pls[0].name, 'Chill', 'playlist: create trims name')
  pls = addToPlaylist(pls, pls[0].id, 't1')
  pls = addToPlaylist(pls, pls[0].id, 't1')
  eq(pls[0].trackIds.length, 1, 'playlist: add is idempotent')
  pls = removeFromPlaylist(pls, pls[0].id, 't1')
  eq(pls[0].trackIds.length, 0, 'playlist: remove')
  pls = renamePlaylist(pls, pls[0].id, 'Focus')
  eq(pls[0].name, 'Focus', 'playlist: rename')
  pls = deletePlaylist(pls, pls[0].id)
  eq(pls.length, 0, 'playlist: delete')
})()

// ==== PlaylistEngine =========================================================

async function engineTests() {
  const audio = makeMockAudio()
  const store = makeMockStore()
  const engine = new PlaylistEngine({ store, audioFactory: () => audio })

  await engine.init()
  eq(engine.getSnapshot().hasTracks, false, 'engine: empty after init')

  const res = await engine.addFiles([
    { name: 'One.mp3', type: 'audio/mpeg', size: 10 },
    { name: 'Two.wav', type: 'audio/wav', size: 20 },
    { name: 'notes.txt', type: 'text/plain', size: 5 },
    { name: 'Three.ogg', type: '', size: 30 },
  ])
  eq(res.added, 3, 'engine: adds supported files')
  eq(res.skipped.length, 1, 'engine: skips unsupported')
  eq(engine.tracks.length, 3, 'engine: three tracks stored')
  eq(engine.tracks[0].title, 'One', 'engine: title derived')

  // exclusivity hook + play
  let beforePlayCalls = 0
  engine.onBeforePlay = () => beforePlayCalls++
  const firstId = engine.tracks[0].id
  await engine.play(firstId)
  eq(beforePlayCalls, 1, 'engine: onBeforePlay fires before playback')
  eq(engine.currentId, firstId, 'engine: current set on play')
  eq(engine.playing, true, 'engine: playing true on play')
  ok(audio.src.startsWith('blob:'), 'engine: element src is a blob URL')
  eq(audio.volume, 0.8, 'engine: default volume applied to element on creation')

  // pause / resume
  engine.pause()
  eq(engine.playing, false, 'engine: pause')
  await engine.resume()
  eq(engine.playing, true, 'engine: resume')

  // next / prev in order
  await engine.next()
  eq(engine.currentId, engine.tracks[1].id, 'engine: next advances')
  await engine.prev()
  eq(engine.currentId, engine.tracks[0].id, 'engine: prev rewinds')

  // end of queue with repeat off
  await engine.play(engine.tracks[2].id)
  const beforeEnd = engine.currentId
  engine.next()
  eq(engine.playing, false, 'engine: stops at queue end (repeat off)')
  eq(engine.lastError.code, 'QUEUE_ENDED', 'engine: queue-ended error set')
  eq(engine.currentId, beforeEnd, 'engine: stays on last track at end')

  // repeat all wraps
  engine.setRepeat('all')
  engine.playAt(2)
  engine.next()
  eq(engine.currentId, engine.tracks[0].id, 'engine: repeat all wraps to start')

  // repeat one replays current on ended
  engine.setRepeat('one')
  const curId = engine.currentId
  engine._handleEnded()
  eq(engine.currentId, curId, 'engine: repeat one keeps track')

  // shuffle pins the track that was current when shuffle was enabled
  engine.setRepeat('off')
  eq(engine.currentId, engine.tracks[0].id, 'engine: current is first before shuffle')
  engine.setShuffle(true)
  eq(engine.order[0], 0, 'engine: shuffle pins current first')
  await engine.play(engine.tracks[1].id)
  eq(engine.currentId, engine.tracks[1].id, 'engine: play after shuffle selects track')
  engine.setShuffle(false)
  ok(engine.order.every((v, idx) => v === idx), 'engine: unshuffle restores order')

  // seek + volume clamp
  engine.seek(5000)
  eq(engine.positionMs, 5000, 'engine: seek updates position')
  engine.setVolume(2)
  eq(engine.volume, 1, 'engine: volume clamps high')
  engine.setVolume(-1)
  eq(engine.volume, 0, 'engine: volume clamps low')
  engine.setVolume(0.5)
  eq(audio.volume, 0.5, 'engine: volume applied to element')

  // favourites
  engine.toggleFavourite(engine.tracks[0].id)
  eq(engine.getSnapshot().tracks[0].favourite, true, 'engine: favourite toggles on')
  engine.toggleFavourite(engine.tracks[0].id)
  eq(engine.getSnapshot().tracks[0].favourite, false, 'engine: favourite toggles off')

  // custom playlists
  engine.createPlaylist('Road Trip')
  const pid = engine.playlists[0].id
  engine.addToPlaylist(pid, engine.tracks[0].id)
  engine.addToPlaylist(pid, engine.tracks[2].id)
  eq(engine.playlists[0].trackIds.length, 2, 'engine: playlist holds tracks')
  engine.playPlaylist(pid)
  eq(engine.currentId, engine.tracks[0].id, 'engine: playlist plays first available')
  eq(engine.shuffle, false, 'engine: playlist play disables shuffle')
  engine.renamePlaylist(pid, 'Drive')
  eq(engine.playlists[0].name, 'Drive', 'engine: playlist rename')
  engine.removeFromPlaylist(pid, engine.tracks[0].id)
  eq(engine.playlists[0].trackIds.length, 1, 'engine: playlist remove track')
  engine.deletePlaylist(pid)
  eq(engine.playlists.length, 0, 'engine: playlist delete')

  // missing-file track surfaces an error, does not play
  engine.tracks[1].available = false
  await engine.play(engine.tracks[1].id)
  eq(engine.lastError.code, 'FILE_MISSING', 'engine: missing file error')

  // removeTrack drops it and clears current if needed
  engine.play(engine.tracks[0].id)
  await engine.removeTrack(engine.tracks[0].id)
  eq(engine.tracks.find((t) => t.id === firstId), undefined, 'engine: track removed')
  eq(engine.currentId, null, 'engine: current cleared on remove')

  // hydrate from a preloaded store, including blob availability
  const blobTrack = { id: 'k1', name: 'Kept.mp3', title: 'Kept', duration: 12, favourite: true }
  const blobs = new Map([['k1', { size: 1 }]])
  const store2 = makeMockStore({ tracks: [blobTrack], playlists: [{ id: 'p1', name: 'P', trackIds: ['k1', 'ghost'] }], blobs })
  const engine2 = new PlaylistEngine({ store: store2, audioFactory: () => makeMockAudio() })
  await engine2.init()
  eq(engine2.tracks[0].available, true, 'engine: hydrated blob is available')
  eq(engine2.tracks[0].favourite, true, 'engine: hydrated favourite')
  eq(engine2.playlists[0].trackIds.length, 1, 'engine: drops dangling playlist refs')

  // metadata-only hydration (no blob) -> unavailable, reselect needed
  const store3 = makeMockStore({ tracks: [{ id: 'm1', name: 'Meta.mp3', title: 'Meta', duration: 3 }] })
  const engine3 = new PlaylistEngine({ store: store3, audioFactory: () => makeMockAudio() })
  await engine3.init()
  eq(engine3.tracks[0].available, false, 'engine: metadata-only track unavailable')
  await engine3.play('m1')
  eq(engine3.lastError.code, 'FILE_MISSING', 'engine: metadata-only play blocked')
  await engine3.replaceTrackFile('m1', { name: 'Meta.mp3', type: 'audio/mpeg', size: 2 })
  eq(engine3.tracks[0].available, true, 'engine: reselect restores availability')

  // concurrency: concurrent inits share one hydration (StrictMode race)...
  const slowStore = makeMockStore()
  let loadCalls = 0
  slowStore.loadLibrary = () =>
    new Promise((res) => {
      loadCalls++
      setTimeout(() => res({ tracks: [], playlists: [] }), 30)
    })
  const engine4 = new PlaylistEngine({ store: slowStore, audioFactory: () => makeMockAudio() })
  const p1 = engine4.init()
  const p2 = engine4.init()
  await Promise.all([p1, p2])
  eq(loadCalls, 1, 'engine: concurrent init hydrates once')
  eq(engine4.ready, true, 'engine: concurrent init reaches ready')

  // ...and a late init must not clobber tracks imported while it was pending.
  const slowStore2 = makeMockStore()
  slowStore2.loadLibrary = () => new Promise((res) => setTimeout(() => res({ tracks: [], playlists: [] }), 40))
  const engine5 = new PlaylistEngine({ store: slowStore2, audioFactory: () => makeMockAudio() })
  const pending = engine5.init()
  await engine5.addFiles([{ name: 'Late.mp3', type: 'audio/mpeg', size: 1 }])
  await pending
  eq(engine5.tracks.length, 1, 'engine: late init does not clobber imported tracks')

  // Importing during the hydration window must wait for the backend to resolve,
  // otherwise bytes are written to the memory fallback and the library looks
  // session-only even though IndexedDB is available.
  const raceStore = makeMockStore()
  let persistenceAtSave = null
  raceStore.init = () =>
    new Promise((res) =>
      setTimeout(() => {
        raceStore.persistence = PERSISTENCE.INDEXEDDB
        res(PERSISTENCE.INDEXEDDB)
      }, 30),
    )
  raceStore.saveBlob = async () => {
    persistenceAtSave = raceStore.persistence
    return { ok: true, persisted: raceStore.persistence === PERSISTENCE.INDEXEDDB }
  }
  const engine6 = new PlaylistEngine({ store: raceStore, audioFactory: () => makeMockAudio() })
  await engine6.addFiles([{ name: 'Race.mp3', type: 'audio/mpeg', size: 1 }])
  eq(persistenceAtSave, PERSISTENCE.INDEXEDDB, 'engine: addFiles awaits hydration before storing bytes')
  eq(engine6.persistence, PERSISTENCE.INDEXEDDB, 'engine: persistence resolved during import')
  eq(engine6.tracks[0].persisted, true, 'engine: bytes persisted once the backend resolved')

  // Quota failure: the bytes can't be stored, but the track still plays this
  // session and the library metadata write still succeeds.
  const quotaStore = makeMockStore()
  quotaStore.init = async () => {
    quotaStore.persistence = PERSISTENCE.INDEXEDDB
    return PERSISTENCE.INDEXEDDB
  }
  quotaStore.saveBlob = async () => ({ ok: false, persisted: false, error: 'QUOTA' })
  let metaSaves = 0
  quotaStore.saveLibrary = async () => {
    metaSaves++
    return { ok: true }
  }
  const engine7 = new PlaylistEngine({ store: quotaStore, audioFactory: () => makeMockAudio() })
  const qres = await engine7.addFiles([{ name: 'Huge.flac', type: 'audio/flac', size: 9e9 }])
  eq(qres.added, 1, 'engine/quota: track still added')
  eq(engine7.tracks[0].available, true, 'engine/quota: track usable this session')
  eq(engine7.tracks[0].persisted, false, 'engine/quota: not persisted when bytes fail')
  ok(metaSaves >= 1, 'engine/quota: metadata still persisted')
}

await engineTests()

// ---- guitar: collision + orchestrator wiring --------------------------------
// Mirrors the live string layout declared in MusicLab/layers/InteractionLayer.
const STRING_CONFIG = [
  { index: 0, note: 'E2', y: 224, x1: 148, x2: 1175, hitRadius: 18 },
  { index: 1, note: 'A2', y: 242, x1: 148, x2: 1175, hitRadius: 18 },
  { index: 2, note: 'D3', y: 260, x1: 148, x2: 1175, hitRadius: 18 },
  { index: 3, note: 'G3', y: 278, x1: 148, x2: 1175, hitRadius: 18 },
  { index: 4, note: 'B3', y: 296, x1: 148, x2: 1175, hitRadius: 18 },
  { index: 5, note: 'E4', y: 314, x1: 148, x2: 1175, hitRadius: 18 },
]

async function guitarTests() {
  // Every string must be reachable. The hit radius equals the 18px string
  // spacing, so a first-match loop resolves to the lowest index in an overlap
  // zone and makes string 5 impossible to pluck.
  const ce = new CollisionEngine(STRING_CONFIG)
  const hitAt = (y) => ce.testCollision(700, y, 'p', 0)
  for (let i = 0; i < 6; i++) {
    eq(hitAt(224 + i * 18).stringIndex, i, `guitar/collision: string ${i} reachable at its centre`)
  }

  // New-collision semantics: same string not re-triggered, cleared on leave.
  const ce2 = new CollisionEngine(STRING_CONFIG)
  ok(ce2.testCollision(700, 224, 'p', 0).isNewCollision === true, 'guitar/collision: first contact is new')
  ok(ce2.testCollision(700, 224, 'p', 0).isNewCollision === false, 'guitar/collision: same string not re-triggered')
  ce2.testCollision(700, 400, 'p', 0)
  ok(ce2.testCollision(700, 224, 'p', 0).isNewCollision === true, 'guitar/collision: re-contact after leaving is new')
  ok(ce2.testCollision(50, 224, 'p2', 0) === null, 'guitar/collision: before the nut has no collision')

  // Orchestrator routes pointer movement through collisions into the audio engine.
  const played = []
  const orch = new InteractionOrchestrator({ playString: async (i, v) => { played.push([i, v]) } })
  orch.initializeCollision(STRING_CONFIG)
  for (const y of [224, 242, 260, 278, 296, 314]) {
    orch.handleInteractionEvent({ type: 'pointer-move', pointerId: 'mouse', x: 700, y })
  }
  await Promise.resolve()
  eq(played.length, 6, 'guitar/orchestrator: sweeping all strings triggers six plucks')
  eq(played.map((p) => p[0]).join(','), '0,1,2,3,4,5', 'guitar/orchestrator: every string reaches the audio engine')

  // Pointer input before the layout is registered must be ignored, not throw.
  const orch2 = new InteractionOrchestrator({ playString: async () => {} })
  orch2.handleInteractionEvent({ type: 'pointer-move', pointerId: 'mouse', x: 700, y: 224 })
  ok(true, 'guitar/orchestrator: events before layout are ignored safely')

  orch.destroy()
  orch2.destroy()
  ce.destroy?.()
  ce2.destroy?.()
}

await guitarTests()

// ---- audio-source exclusivity ----------------------------------------------
// The procedural engine and the personal playlist must never play at once. The
// wiring previously lived only inside a mounted component, so leaving the My
// Music tab removed it; it is now installed once for the whole session.
async function exclusivityTests() {
  // Pure wiring, exercised with fakes.
  const fakeMusic = {
    stopCalls: 0,
    subs: [],
    stop() {
      this.stopCalls++
    },
    subscribe(cb) {
      this.subs.push(cb)
      return () => {}
    },
  }
  const fakePlaylist = {
    pauseCalls: 0,
    onBeforePlay: null,
    pauseIfPlaying() {
      this.pauseCalls++
    },
  }
  wireAudioExclusivity({ playlist: fakePlaylist, music: fakeMusic })
  ok(typeof fakePlaylist.onBeforePlay === 'function', 'exclusivity: playlist start edge wired')
  eq(fakeMusic.subs.length, 1, 'exclusivity: exactly one procedural subscription')
  fakePlaylist.onBeforePlay()
  eq(fakeMusic.stopCalls, 1, 'exclusivity: starting the playlist stops the procedural engine')
  fakeMusic.subs[0]({ status: MUSIC_STATUS.PLAYING })
  eq(fakePlaylist.pauseCalls, 1, 'exclusivity: starting a preset pauses the playlist')
  fakeMusic.subs[0]({ status: MUSIC_STATUS.IDLE })
  eq(fakePlaylist.pauseCalls, 1, 'exclusivity: procedural idle does not touch the playlist')

  // The shared-singleton install is idempotent and independent of any component
  // mounting (the regression: coordination used to vanish on tab unmount).
  _resetAudioExclusivity()
  const origPause = playlistEngine.pauseIfPlaying
  let pauseCount = 0
  playlistEngine.pauseIfPlaying = () => {
    pauseCount++
  }
  installAudioExclusivity()
  installAudioExclusivity()
  installAudioExclusivity()
  musicEngine.status = MUSIC_STATUS.PLAYING
  musicEngine._emit()
  eq(pauseCount, 1, 'exclusivity: installed once for the session, not once per mount')
  musicEngine.status = MUSIC_STATUS.IDLE
  musicEngine._emit()
  eq(pauseCount, 1, 'exclusivity: idle procedural state leaves the playlist alone')
  playlistEngine.pauseIfPlaying = origPause
  _resetAudioExclusivity()
}

await exclusivityTests()

// ---- report -----------------------------------------------------------------

console.log(`\nmusic-v12-qa: ${passed} passed, ${failed} failed`)
if (failed > 0) {
  console.log('\nFailures:')
  for (const f of failures) console.log(`  ✗ ${f}`)
  process.exit(1)
}
