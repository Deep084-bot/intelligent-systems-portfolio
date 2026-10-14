// DeepVerse — Focus Session engine.
//
// A framework-free singleton that owns the focus / short-break / long-break
// timer. It mirrors the MusicEngine pattern (subscribe + getSnapshot) so the UI
// can bind to it with useSyncExternalStore, and it is deliberately independent
// of any audio: the session only *asks* whether music should play; the caller
// decides what to do with the shared MusicEngine.
//
// Timing is timestamp-based, never a blind decrement: while running we store
// `_endsAt` (epoch ms) and derive the remaining time from the clock. That makes
// it immune to throttled timers in background tabs — when the tab wakes, one
// tick recomputes the true remaining time. The host hook is responsible for
// calling `tick()` on an interval and on visibility changes.
//
// Preferences and the completed-session count are persisted to localStorage
// (the pattern already used across DeepVerse). All storage access is guarded so
// the engine is safe in Node and in private-mode browsers.

export const FOCUS_MODE = {
  FOCUS: 'focus',
  SHORT_BREAK: 'short-break',
  LONG_BREAK: 'long-break',
}

export const FOCUS_STATUS = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  COMPLETE: 'complete',
}

export const FOCUS_MODE_LABELS = {
  [FOCUS_MODE.FOCUS]: 'Focus',
  [FOCUS_MODE.SHORT_BREAK]: 'Short Break',
  [FOCUS_MODE.LONG_BREAK]: 'Long Break',
}

// Defaults in minutes. Matched by the product spec (25 / 5 / 15).
export const DEFAULT_DURATIONS = {
  [FOCUS_MODE.FOCUS]: 25,
  [FOCUS_MODE.SHORT_BREAK]: 5,
  [FOCUS_MODE.LONG_BREAK]: 15,
}

// A long break replaces the short break after every N completed focus rounds.
export const LONG_BREAK_EVERY = 4

const MIN_MINUTES = 1
const MAX_MINUTES = 180
const STORAGE_KEY = 'deepverse.focus.v1'

function safeStorage() {
  try {
    if (typeof localStorage === 'undefined') return null
    const probe = '__dv_focus_probe__'
    localStorage.setItem(probe, '1')
    localStorage.removeItem(probe)
    return localStorage
  } catch {
    return null
  }
}

function clampMinutes(value, fallback) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, Math.round(n)))
}

export class FocusSession {
  constructor({ storage = safeStorage(), now = () => Date.now() } = {}) {
    this._storage = storage
    this._now = now
    this.listeners = new Set()
    this._snapshot = null

    this.mode = FOCUS_MODE.FOCUS
    this.status = FOCUS_STATUS.IDLE
    this._endsAt = null // epoch ms while running
    this._remainingMs = null // stored while paused/idle
    this.completed = 0
    this.musicEnabled = false
    this.presetId = null

    this.preferences = { ...DEFAULT_DURATIONS }
    this._hydrate()
    this._remainingMs = this.durationMs()
  }

  // ---- persistence ----------------------------------------------------------

  _hydrate() {
    if (!this._storage) return
    try {
      const raw = this._storage.getItem(STORAGE_KEY)
      if (!raw) return
      const data = JSON.parse(raw)
      if (data && typeof data === 'object') {
        if (data.preferences) {
          this.preferences = {
            [FOCUS_MODE.FOCUS]: clampMinutes(data.preferences[FOCUS_MODE.FOCUS], DEFAULT_DURATIONS[FOCUS_MODE.FOCUS]),
            [FOCUS_MODE.SHORT_BREAK]: clampMinutes(data.preferences[FOCUS_MODE.SHORT_BREAK], DEFAULT_DURATIONS[FOCUS_MODE.SHORT_BREAK]),
            [FOCUS_MODE.LONG_BREAK]: clampMinutes(data.preferences[FOCUS_MODE.LONG_BREAK], DEFAULT_DURATIONS[FOCUS_MODE.LONG_BREAK]),
          }
        }
        if (Number.isFinite(data.completed) && data.completed >= 0) {
          this.completed = Math.floor(data.completed)
        }
        if (typeof data.musicEnabled === 'boolean') this.musicEnabled = data.musicEnabled
        if (typeof data.presetId === 'string' || data.presetId === null) this.presetId = data.presetId
      }
    } catch {
      /* corrupt or unavailable storage — fall back to defaults */
    }
  }

  _persist() {
    if (!this._storage) return
    try {
      this._storage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          preferences: this.preferences,
          completed: this.completed,
          musicEnabled: this.musicEnabled,
          presetId: this.presetId,
        }),
      )
    } catch {
      /* quota / disabled storage — non-fatal, session continues in memory */
    }
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
    const remainingMs = this.remainingMs()
    return {
      mode: this.mode,
      modeLabel: FOCUS_MODE_LABELS[this.mode],
      status: this.status,
      remainingMs,
      durationMs: this.durationMs(),
      progress: this.durationMs() > 0 ? 1 - remainingMs / this.durationMs() : 0,
      completed: this.completed,
      musicEnabled: this.musicEnabled,
      presetId: this.presetId,
      preferences: { ...this.preferences },
      running: this.status === FOCUS_STATUS.RUNNING,
    }
  }

  _emit() {
    this._snapshot = this._buildSnapshot()
    for (const listener of Array.from(this.listeners)) {
      try {
        listener(this._snapshot)
      } catch {
        /* a bad listener must not break the timer */
      }
    }
  }

  // ---- timing helpers -------------------------------------------------------

  durationMs(mode = this.mode) {
    return clampMinutes(this.preferences[mode], DEFAULT_DURATIONS[mode]) * 60000
  }

  remainingMs(now = this._now()) {
    if (this.status === FOCUS_STATUS.RUNNING && this._endsAt != null) {
      return Math.max(0, this._endsAt - now)
    }
    if (this._remainingMs != null) return Math.max(0, this._remainingMs)
    return this.durationMs()
  }

  // ---- transport ------------------------------------------------------------

  start(mode = this.mode) {
    if (Object.values(FOCUS_MODE).includes(mode)) this.mode = mode
    this._endsAt = this._now() + this.durationMs()
    this._remainingMs = null
    this.status = FOCUS_STATUS.RUNNING
    this._emit()
    return this.getSnapshot()
  }

  pause() {
    if (this.status !== FOCUS_STATUS.RUNNING) return this.getSnapshot()
    this._remainingMs = this.remainingMs()
    this._endsAt = null
    this.status = FOCUS_STATUS.PAUSED
    this._emit()
    return this.getSnapshot()
  }

  resume() {
    if (this.status !== FOCUS_STATUS.PAUSED) return this.getSnapshot()
    const remaining = this._remainingMs != null ? this._remainingMs : this.durationMs()
    this._endsAt = this._now() + remaining
    this._remainingMs = null
    this.status = FOCUS_STATUS.RUNNING
    this._emit()
    return this.getSnapshot()
  }

  reset() {
    this._endsAt = null
    this._remainingMs = this.durationMs()
    this.status = FOCUS_STATUS.IDLE
    this._emit()
    return this.getSnapshot()
  }

  // Move to the suggested next mode without starting it.
  selectMode(mode) {
    if (!Object.values(FOCUS_MODE).includes(mode)) return this.getSnapshot()
    this.mode = mode
    this._endsAt = null
    this._remainingMs = this.durationMs()
    this.status = FOCUS_STATUS.IDLE
    this._emit()
    return this.getSnapshot()
  }

  // Which mode should follow the current one, based on the completed count.
  suggestedNextMode() {
    if (this.mode === FOCUS_MODE.FOCUS) {
      return this.completed > 0 && this.completed % LONG_BREAK_EVERY === 0
        ? FOCUS_MODE.LONG_BREAK
        : FOCUS_MODE.SHORT_BREAK
    }
    return FOCUS_MODE.FOCUS
  }

  // Finish the current interval now (skip or natural completion), then idle on
  // the suggested next mode so the user explicitly starts the next round.
  complete() {
    if (this.mode === FOCUS_MODE.FOCUS) {
      this.completed += 1
      this._persist()
    }
    // suggestedNextMode reads the (unchanged) current mode + updated count.
    const next = this.suggestedNextMode()
    this.mode = next
    this._endsAt = null
    this._remainingMs = this.durationMs(next)
    this.status = FOCUS_STATUS.COMPLETE
    this._emit()
    return this.getSnapshot()
  }

  skip() {
    if (this.status === FOCUS_STATUS.IDLE) return this.getSnapshot()
    return this.complete()
  }

  // Advance the clock. Idempotent and cheap; safe to call often.
  tick(now = this._now()) {
    if (this.status !== FOCUS_STATUS.RUNNING || this._endsAt == null) return
    if (now >= this._endsAt) {
      this.complete()
      return
    }
    // Re-emit only when the displayed second actually changes to avoid churn.
    const sec = Math.ceil((this._endsAt - now) / 1000)
    if (sec !== this._lastEmittedSec) {
      this._lastEmittedSec = sec
      this._emit()
    }
  }

  // ---- preferences & music --------------------------------------------------

  setDuration(mode, minutes) {
    if (!Object.values(FOCUS_MODE).includes(mode)) return this.getSnapshot()
    this.preferences[mode] = clampMinutes(minutes, DEFAULT_DURATIONS[mode])
    if (this.status === FOCUS_STATUS.IDLE || this.status === FOCUS_STATUS.COMPLETE) {
      this._remainingMs = this.durationMs()
    }
    this._persist()
    this._emit()
    return this.getSnapshot()
  }

  setMusicEnabled(enabled) {
    this.musicEnabled = !!enabled
    this._persist()
    this._emit()
    return this.getSnapshot()
  }

  setPresetId(presetId) {
    this.presetId = typeof presetId === 'string' ? presetId : null
    this._persist()
    this._emit()
    return this.getSnapshot()
  }

  // Test seam — wipe state and storage.
  _reset() {
    this.mode = FOCUS_MODE.FOCUS
    this.status = FOCUS_STATUS.IDLE
    this._endsAt = null
    this._remainingMs = null
    this._lastEmittedSec = null
    this.completed = 0
    this.musicEnabled = false
    this.presetId = null
    this.preferences = { ...DEFAULT_DURATIONS }
    this.listeners.clear()
    this._snapshot = null
    try {
      this._storage?.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }
}

export const focusSession = new FocusSession()

export function formatClock(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export { clampMinutes, MIN_MINUTES, MAX_MINUTES }
