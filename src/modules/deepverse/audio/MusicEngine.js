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
//   - volume is always clamped to [0, 1];
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

function clamp01(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return null
  if (n < 0) return 0
  if (n > 1) return 1
  return n
}

export class MusicEngine {
  constructor() {
    this.context = null
    this.master = null
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
      this.master = this.context.createGain()
      this.master.gain.value = this.volume
      this.master.connect(this.context.destination)
    }
    return true
  }

  _applyVolume() {
    if (this.master) {
      const t = this.context?.currentTime ?? 0
      this.master.gain.cancelScheduledValues?.(t)
      this.master.gain.setValueAtTime(this.volume, t)
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

    this._teardownVoices()
    this.presetId = presetId
    this._eventsByStep = buildEventsByStep(getPreset(presetId))
    this._buildPads(getPreset(presetId))
    this._applyVolume()
    this.status = MUSIC_STATUS.PLAYING
    this._startScheduler()
    this._emit()
    return { ok: true, presetId, status: this.status }
  }

  async pause() {
    if (this.status !== MUSIC_STATUS.PLAYING) {
      return { ok: false, errorCode: MUSIC_ERROR.NOTHING_PLAYING }
    }
    this._stopScheduler()
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
    this._stopScheduler()
    this._teardownVoices()
    this.status = MUSIC_STATUS.IDLE
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
      for (const e of events) this._playNote(e, this._nextTime, preset)
      this._nextTime += stepDur
      this._step = (this._step + 1) % preset.steps
    }
  }

  _playNote(event, time, preset) {
    const ctx = this.context
    const osc = ctx.createOscillator()
    osc.type = event.type || 'sine'
    osc.frequency.value = preset.root * Math.pow(2, (event.semitone || 0) / 12)

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

    let tail = gain
    if (event.filter) {
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = event.filter
      filter.Q.value = 0.7
      gain.connect(filter)
      tail = filter
    }
    osc.connect(gain)
    tail.connect(this.master)

    this._track(osc, end, [osc, gain, tail])
    osc.start(time)
    osc.stop(end + 0.05)
  }

  _buildPads(preset) {
    const ctx = this.context
    if (!ctx || !preset.pad) return
    for (const layer of preset.pad) {
      const osc = ctx.createOscillator()
      osc.type = layer.type || 'sine'
      osc.frequency.value = preset.root * Math.pow(2, (layer.semitone || 0) / 12)
      osc.detune.value = layer.detune || 0

      const gain = ctx.createGain()
      gain.gain.value = 0.0001
      gain.gain.linearRampToValueAtTime(Math.max(0.0001, layer.gain ?? 0.06), ctx.currentTime + 2.5)

      const nodes = [osc, gain]
      let tail = gain
      if (layer.filter) {
        const filter = ctx.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.value = layer.filter
        filter.Q.value = 0.6
        gain.connect(filter)
        tail = filter
        nodes.push(filter)
      }
      osc.connect(gain)
      tail.connect(this.master)

      if (layer.lfoRate) {
        const lfo = ctx.createOscillator()
        lfo.frequency.value = layer.lfoRate
        const lfoGain = ctx.createGain()
        lfoGain.gain.value = layer.lfoDepth || 0
        lfo.connect(lfoGain)
        lfoGain.connect(osc.frequency)
        lfo.start()
        nodes.push(lfo, lfoGain)
      }

      osc.start()
      this._pads.add({ osc, nodes })
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
      try {
        pad.osc.stop()
      } catch {
        /* ignore */
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
    this.master = null
    this.context = null
    this._eventsByStep = null
    this.volume = 0.7
    this.listeners.clear()
    this._snapshot = null
  }
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
