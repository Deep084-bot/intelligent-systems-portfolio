// DeepVerse — shared music playback service.
//
// One framework-free singleton owns the whole music experience so DeepPet and
// the Music Lab never run two competing playback engines. It uses the browser's
// native Web Audio API to synthesise the procedural presets in presets.js — no
// samples, no network, no keys, no third party.
//
// Design rules baked in:
//   - the AudioContext is created lazily and only ever resumed from a user
//     gesture; `play()` reports AUTOPLAY_BLOCKED rather than pretending to play;
//   - every scheduled note is a short-lived oscillator with a clean stop time,
//     so no loop survives a pause / preset switch / stop;
//   - sustained "pad" voices are tracked and torn down explicitly;
//   - a gentle master chain (soft tone lowpass + compressor where available)
//     tames harsh highs and stops overlapping voices from clipping;
//   - preset switches / pause / resume cross-fade the master so there are no
//     clicks, and a generation guard discards stale fades;
//   - volume is always clamped to [0, 1] and scales the preset's own `trim`;
//   - the module is Node-safe: with no Web Audio it degrades to an unsupported
//     result instead of throwing.

import {
  PRESETS,
  PRESET_IDS,
  getPreset,
  isPresetId,
  nextPresetId,
  presetList,
} from './presets'

export const MUSIC_STATUS = {
  IDLE: 'idle',
  PLAYING: 'playing',
  PAUSED: 'paused',
}

export const MUSIC_ERROR = {
  UNSUPPORTED: 'AUDIO_UNSUPPORTED',
  BLOCKED: 'AUTOPLAY_BLOCKED',
  UNKNOWN_TRACK: 'UNKNOWN_TRACK',
  NOTHING_PLAYING: 'NOTHING_PLAYING',
  INVALID_VOLUME: 'INVALID_VOLUME',
}

const SCHEDULE_AHEAD = 0.15 // seconds of lookahead
const TIMER_MS = 25
const LOOKAHEAD_MS = 0.05

// Cross-fade timings (seconds). Kept short so transport feels instant while
// still avoiding clicks at note boundaries.
const FADE_OUT = 0.12
const FADE_IN = 0.4
const FADE_RESUME = 0.3
const FADE_VOLUME = 0.05
const FADE_WAIT_MS = 130

// Hard ceiling on simultaneous scheduled voices. Generous for these presets,
// but a guarantee that a bug can never spawn an unbounded graph.
const MAX_VOICES = 80

function clamp01(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return null
  if (n < 0) return 0
  if (n > 1) return 1
  return n
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class MusicEngine {
  constructor() {
    this.context = null
    this.master = null
    this._tone = null
    this._comp = null
    this.volume = 0.7
    this.presetId = null
    this.status = MUSIC_STATUS.IDLE
    this.listeners = new Set()
    this._timer = null
    this._step = 0
    this._nextTime = 0
    this._voices = new Set()
    this._pads = new Set()
    this._eventsByStep = null
    this._snapshot = null
    // Monotonic token: bumped by every transport change so a fade/teardown
    // scheduled by an older play() can never clobber a newer one.
    this._gen = 0
  }

  // ---- capability -----------------------------------------------------------

  isSupported() {
    return (
      typeof window !== 'undefined' &&
      typeof (window.AudioContext || window.webkitAudioContext) === 'function'
    )
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
    const preset = getPreset(this.presetId)
    return {
      supported: this.isSupported(),
      status: this.status,
      presetId: this.presetId,
      preset: preset ? { id: preset.id, name: preset.name, description: preset.description } : null,
      presets: presetList(),
      volume: this.volume,
      volumePercent: Math.round(this.volume * 100),
      contextState: this.context ? this.context.state : null,
    }
  }

  _emit() {
    this._snapshot = this._buildSnapshot()
    for (const listener of Array.from(this.listeners)) {
      try {
        listener(this._snapshot)
      } catch {
        /* a bad listener must not break the engine */
      }
    }
  }

  // ---- audio graph ----------------------------------------------------------

  _ensureContext() {
    if (this.context) return true
    if (!this.isSupported()) return false
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext
      this.context = new Ctor()
    } catch {
      this.context = null
      return false
    }
    if (!this.master) {
      const ctx = this.context
      this.master = ctx.createGain()
      this.master.gain.value = 0.0001 // silent until a preset fades in

      // master -> [soft tone lowpass] -> [compressor] -> destination
      let node = this.master
      try {
        if (typeof ctx.createBiquadFilter === 'function') {
          const tone = ctx.createBiquadFilter()
          tone.type = 'lowpass'
          tone.frequency.value = 9000 // take the edge off synthy highs
          tone.Q.value = 0.5
          node.connect(tone)
          node = tone
          this._tone = tone
        }
      } catch {
        this._tone = null
      }
      try {
        if (typeof ctx.createDynamicsCompressor === 'function') {
          const comp = ctx.createDynamicsCompressor()
          comp.threshold.value = -18
          comp.knee.value = 24
          comp.ratio.value = 3
          comp.attack.value = 0.01
          comp.release.value = 0.25
          node.connect(comp)
          node = comp
          this._comp = comp
        }
      } catch {
        this._comp = null
      }
      node.connect(ctx.destination)
    }
    return true
  }

  _targetMasterGain() {
    const preset = getPreset(this.presetId)
    const trim = preset && typeof preset.trim === 'number' ? preset.trim : 1
    return Math.max(0.0001, this.volume * trim)
  }

  // Ramp the master to `target`, optionally starting from an explicit value.
  _fadeMaster(target, seconds, from) {
    if (!this.master) return
    const g = this.master.gain
    const t = this.context?.currentTime ?? 0
    const start = from != null ? from : typeof g.value === 'number' ? g.value : target
    g.cancelScheduledValues?.(t)
    g.setValueAtTime(Math.max(0.0001, start), t)
    g.linearRampToValueAtTime(Math.max(0.0001, target), t + seconds)
  }

  _applyVolume(seconds = FADE_VOLUME) {
    if (!this.master) return
    if (this.status === MUSIC_STATUS.PLAYING) {
      this._fadeMaster(this._targetMasterGain(), seconds)
    } else {
      this._fadeMaster(0.0001, seconds)
    }
  }

  // Resume the context from a user gesture. Used by the UI unlock control.
  async unlock() {
    if (!this._ensureContext()) {
      return { ok: false, errorCode: MUSIC_ERROR.UNSUPPORTED }
    }
    if (this.context.state === 'suspended') {
      try {
        await this.context.resume()
      } catch {
        return { ok: false, errorCode: MUSIC_ERROR.BLOCKED }
      }
    }
    this._emit()
    return { ok: this.context.state === 'running', errorCode: this.context.state === 'running' ? null : MUSIC_ERROR.BLOCKED }
  }

  // ---- transport ------------------------------------------------------------

  async play(presetId) {
    if (!isPresetId(presetId)) {
      return { ok: false, errorCode: MUSIC_ERROR.UNKNOWN_TRACK, actionId: 'play_track' }
    }

    // Same track already playing -> idempotent, never a second loop.
    if (this.presetId === presetId && this.status === MUSIC_STATUS.PLAYING) {
      return { ok: true, presetId, status: this.status }
    }
    // Same track paused -> resume it.
    if (this.presetId === presetId && this.status === MUSIC_STATUS.PAUSED) {
      return this.resume()
    }

    const unlocked = await this.unlock()
    if (!unlocked.ok) {
      return { ok: false, errorCode: unlocked.errorCode || MUSIC_ERROR.BLOCKED }
    }

    const switching = this.status === MUSIC_STATUS.PLAYING
    const gen = ++this._gen

    // Fade out the outgoing preset before mutating the graph, so switching
    // never clicks. First play from idle skips the wait entirely.
    if (switching) {
      this._fadeMaster(0.0001, FADE_OUT)
      await wait(FADE_WAIT_MS)
      if (gen !== this._gen) {
        // A newer transport op superseded us; it owns the graph now.
        return { ok: true, presetId: this.presetId, status: this.status }
      }
    }

    this._teardownVoices()
    this.presetId = presetId
    this._eventsByStep = buildEventsByStep(getPreset(presetId))
    this._buildPads(getPreset(presetId))
    this._fadeMaster(this._targetMasterGain(), FADE_IN, 0.0001)
    this.status = MUSIC_STATUS.PLAYING
    this._startScheduler()
    this._emit()
    return { ok: true, presetId, status: this.status }
  }

  async pause() {
    if (this.status !== MUSIC_STATUS.PLAYING) {
      return { ok: false, errorCode: MUSIC_ERROR.NOTHING_PLAYING }
    }
    const gen = ++this._gen
    this._stopScheduler()
    // Fade the master down before suspending so the last notes don't click.
    this._fadeMaster(0.0001, FADE_OUT)
    await wait(FADE_WAIT_MS)
    if (gen !== this._gen) {
      return { ok: true, presetId: this.presetId, status: this.status }
    }
    if (this.context && this.context.state === 'running') {
      try {
        await this.context.suspend()
      } catch {
        /* ignore — still mark paused */
      }
    }
    this.status = MUSIC_STATUS.PAUSED
    this._emit()
    return { ok: true, presetId: this.presetId, status: this.status }
  }

  async resume() {
    if (this.status !== MUSIC_STATUS.PAUSED || !this.presetId) {
      return { ok: false, errorCode: MUSIC_ERROR.NOTHING_PLAYING }
    }
    const unlocked = await this.unlock()
    if (!unlocked.ok) {
      return { ok: false, errorCode: unlocked.errorCode || MUSIC_ERROR.BLOCKED }
    }
    ++this._gen
    this._fadeMaster(this._targetMasterGain(), FADE_RESUME, 0.0001)
    this.status = MUSIC_STATUS.PLAYING
    this._startScheduler()
    this._emit()
    return { ok: true, presetId: this.presetId, status: this.status }
  }

  async next() {
    const target = this.presetId ? nextPresetId(this.presetId) : PRESET_IDS[0]
    return this.play(target)
  }

  stop() {
    const hadPreset = this.presetId
    ++this._gen // invalidate any in-flight fade/teardown
    this._stopScheduler()
    this._teardownVoices()
    this.status = MUSIC_STATUS.IDLE
    this._fadeMaster(0.0001, FADE_OUT)
    this._emit()
    return { ok: true, presetId: hadPreset, status: this.status }
  }

  setVolume(value) {
    const level = clamp01(value)
    if (level === null) {
      return { ok: false, errorCode: MUSIC_ERROR.INVALID_VOLUME }
    }
    this.volume = level
    this._applyVolume()
    this._emit()
    return { ok: true, volume: this.volume, volumePercent: Math.round(this.volume * 100) }
  }

  // ---- scheduling -----------------------------------------------------------

  _startScheduler() {
    this._stopScheduler()
    if (!this.context || !this.presetId) return
    this._step = 0
    this._nextTime = this.context.currentTime + LOOKAHEAD_MS
    this._timer = setInterval(() => this._tick(), TIMER_MS)
    this._tick()
  }

  _stopScheduler() {
    if (this._timer) {
      clearInterval(this._timer)
      this._timer = null
    }
  }

  _tick() {
    const ctx = this.context
    const preset = getPreset(this.presetId)
    if (!ctx || !preset || this.status !== MUSIC_STATUS.PLAYING) return
    const stepDur = 60 / preset.bpm / 4 // a 16th note
    while (this._nextTime < ctx.currentTime + SCHEDULE_AHEAD) {
      const events = this._eventsByStep[this._step] || []
      for (const e of events) this._playEvent(e, this._nextTime)
      this._nextTime += stepDur
      this._step = (this._step + 1) % preset.steps
    }
  }

  // Schedule one event. `event.notes` may hold several semitone offsets (a
  // chord); `event.semitone` is the single-note shorthand. `event.strum` fans
  // the chord out in time; `event.pan` places it in the stereo field.
  _playEvent(event, time) {
    const notes = Array.isArray(event.notes) ? event.notes : [event.semitone || 0]
    const strum = event.strum || 0
    notes.forEach((semitone, i) => {
      this._playNote({ ...event, semitone }, time + i * strum)
    })
  }

  _playNote(event, time) {
    if (this._voices.size >= MAX_VOICES) return // never let the graph run away
    const ctx = this.context
    if (!ctx) return

    const osc = ctx.createOscillator()
    osc.type = event.type || 'sine'
    osc.frequency.value = presetRootFreq(this.presetId, event.semitone || 0)

    const gain = ctx.createGain()
    const peak = Math.max(0.0001, event.gain ?? 0.15)
    const attack = event.attack ?? 0.01
    const dur = event.dur ?? 0.4
    const release = event.release ?? dur
    const end = time + dur + release

    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.linearRampToValueAtTime(peak, time + attack)
    gain.gain.setValueAtTime(peak, Math.max(time + attack, time + dur))
    gain.gain.exponentialRampToValueAtTime(0.0001, end)

    const nodes = [osc, gain]
    let tail = gain
    if (event.filter) {
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = event.filter
      filter.Q.value = 0.7
      gain.connect(filter)
      tail = filter
      nodes.push(filter)
    }
    // Optional stereo placement — only where the browser provides it.
    if (event.pan && typeof ctx.createStereoPanner === 'function') {
      try {
        const panner = ctx.createStereoPanner()
        panner.pan.value = Math.max(-1, Math.min(1, event.pan))
        tail.connect(panner)
        tail = panner
        nodes.push(panner)
      } catch {
        /* fall through to mono */
      }
    }
    osc.connect(gain)
    tail.connect(this.master)

    this._track(osc, end, nodes)
    osc.start(time)
    osc.stop(end + 0.05)
  }

  _buildPads(preset) {
    const ctx = this.context
    if (!ctx || !preset.pad) return
    for (const layer of preset.pad) {
      const notes = Array.isArray(layer.notes) ? layer.notes : [layer.semitone || 0]
      const gain = ctx.createGain()
      gain.gain.value = 0.0001
      gain.gain.linearRampToValueAtTime(
        Math.max(0.0001, layer.gain ?? 0.06),
        ctx.currentTime + 2.5,
      )

      const nodes = [gain]
      let tail = gain
      let filter = null
      if (layer.filter) {
        filter = ctx.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.value = layer.filter
        filter.Q.value = 0.6
        gain.connect(filter)
        tail = filter
        nodes.push(filter)
      }
      tail.connect(this.master)

      const oscs = notes.map((semitone) => {
        const osc = ctx.createOscillator()
        osc.type = layer.type || 'sine'
        osc.frequency.value = preset.root * Math.pow(2, semitone / 12)
        osc.detune.value = layer.detune || 0
        osc.connect(gain)
        nodes.push(osc)
        return osc
      })

      if (layer.lfoRate) {
        const lfo = ctx.createOscillator()
        lfo.frequency.value = layer.lfoRate
        const lfoGain = ctx.createGain()
        lfoGain.gain.value = layer.lfoDepth || 0
        lfo.connect(lfoGain)
        // Sweep the filter if there is one (a moving timbre reads as "alive"),
        // otherwise gently bend the first oscillator.
        if (filter) {
          lfoGain.connect(filter.frequency)
        } else if (oscs[0]) {
          lfoGain.connect(oscs[0].frequency)
        }
        lfo.start()
        nodes.push(lfo, lfoGain)
      }

      for (const osc of oscs) osc.start()
      this._pads.add({ oscs, nodes })
    }
  }

  _track(osc, end, nodes) {
    const voice = { osc, end, nodes }
    this._voices.add(voice)
    osc.onended = () => {
      this._voices.delete(voice)
      for (const n of nodes) {
        try {
          n.disconnect()
        } catch {
          /* already gone */
        }
      }
    }
  }

  _teardownVoices() {
    for (const voice of Array.from(this._voices)) {
      try {
        voice.osc.stop()
      } catch {
        /* ignore */
      }
      for (const n of voice.nodes) {
        try {
          n.disconnect()
        } catch {
          /* already gone */
        }
      }
    }
    this._voices.clear()

    for (const pad of Array.from(this._pads)) {
      for (const osc of pad.oscs || []) {
        try {
          osc.stop()
        } catch {
          /* ignore */
        }
      }
      for (const n of pad.nodes) {
        try {
          n.disconnect()
        } catch {
          /* already gone */
        }
      }
    }
    this._pads.clear()
  }

  // Test seam.
  _reset() {
    this.stop()
    if (this.master) {
      try {
        this.master.disconnect()
      } catch {
        /* ignore */
      }
    }
    for (const node of [this._tone, this._comp]) {
      try {
        node?.disconnect()
      } catch {
        /* ignore */
      }
    }
    this.master = null
    this._tone = null
    this._comp = null
    this.context = null
    this._eventsByStep = null
    this.volume = 0.7
    this._gen = 0
    this.listeners.clear()
    this._snapshot = null
  }
}

function presetRootFreq(presetId, semitone) {
  const preset = getPreset(presetId)
  const root = preset ? preset.root : 440
  return root * Math.pow(2, semitone / 12)
}

function buildEventsByStep(preset) {
  const map = {}
  if (!preset) return map
  for (const e of preset.events || []) {
    ;(map[e.step] || (map[e.step] = [])).push(e)
  }
  return map
}

// The one shared instance both DeepPet and the Music Lab talk to.
export const musicEngine = new MusicEngine()

export { PRESETS, PRESET_IDS, getPreset, isPresetId, nextPresetId, presetList }
