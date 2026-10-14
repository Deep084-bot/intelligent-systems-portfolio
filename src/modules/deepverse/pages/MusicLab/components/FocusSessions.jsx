import { useEffect, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import useFocusSession from '../../../audio/useFocusSession'
import { focusSession } from '../../../audio/focusSession'
import { musicEngine } from '../../../audio/MusicEngine'
import { presetList } from '../../../audio/presets'
import {
  FOCUS_MODE,
  FOCUS_STATUS,
  FOCUS_MODE_LABELS,
  LONG_BREAK_EVERY,
  formatClock,
  MIN_MINUTES,
  MAX_MINUTES,
} from '../../../audio/focusSession'

function ModeTab({ mode, active, onSelect }) {
  const label = FOCUS_MODE_LABELS[mode]
  return (
    <button
      type="button"
      onClick={() => onSelect(mode)}
      aria-pressed={active}
      data-testid={`focus-mode-${mode}`}
      className={`px-3 py-1.5 text-sm rounded-md border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 ${
        active
          ? 'bg-primary-500/20 border-primary-500/50 text-primary-100'
          : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
      }`}
    >
      {label}
    </button>
  )
}

function DurationField({ label, mode, value, onChange, disabled }) {
  const id = `focus-duration-${mode}`
  return (
    <label htmlFor={id} className="flex items-center gap-2 text-xs text-neutral-400">
      <span className="min-w-[5.5rem]">{label}</span>
      <input
        id={id}
        type="number"
        min={MIN_MINUTES}
        max={MAX_MINUTES}
        step={1}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={`${label} minutes`}
        className="w-16 rounded-md bg-neutral-900 border border-neutral-800 px-2 py-1 text-neutral-100 text-sm disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
      />
      <span>min</span>
    </label>
  )
}

export default function FocusSessions() {
  const session = useFocusSession()
  const presets = useMemo(() => presetList(), [])
  const prevStatusRef = useRef(session.status)
  const prevMusicRef = useRef(session.musicEnabled)
  const prevPresetRef = useRef(session.presetId)

  // Music is only ever driven when the user has explicitly enabled it. We act
  // on state *transitions* so opening this tab never disturbs unrelated
  // playback the user may have started manually.
  useEffect(() => {
    const statusChanged = session.status !== prevStatusRef.current
    const musicChanged = session.musicEnabled !== prevMusicRef.current
    const presetChanged = session.presetId !== prevPresetRef.current
    prevStatusRef.current = session.status
    prevMusicRef.current = session.musicEnabled
    prevPresetRef.current = session.presetId

    if (!statusChanged && !musicChanged && !presetChanged) return

    const presetId = session.presetId
    const hasFocusMusic = session.musicEnabled && !!presetId

    if (!hasFocusMusic) {
      // Either the switch is off, or the user chose "No music (silent session)".
      // Only stop on the transitions that explicitly ask for it, so opening the
      // tab or starting a session never cuts off unrelated playback the user
      // started elsewhere.
      if (musicChanged || presetChanged) musicEngine.stop()
      return
    }

    if (session.status === FOCUS_STATUS.RUNNING) {
      musicEngine.play(presetId)
    } else if (session.status === FOCUS_STATUS.PAUSED) {
      musicEngine.pause()
    } else if (statusChanged) {
      // idle / complete — end background music only on an actual transition.
      musicEngine.stop()
    }
  }, [session.status, session.musicEnabled, session.presetId])

  // Stop background music when leaving the lab.
  useEffect(() => {
    return () => {
      if (session.musicEnabled) {
        try {
          musicEngine.stop()
        } catch {
          /* ignore */
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const running = session.status === FOCUS_STATUS.RUNNING
  const paused = session.status === FOCUS_STATUS.PAUSED
  const complete = session.status === FOCUS_STATUS.COMPLETE
  const idle = session.status === FOCUS_STATUS.IDLE
  const nextLabel = FOCUS_MODE_LABELS[session.mode]

  const nextInCycle = session.completed % LONG_BREAK_EVERY === 0 && session.completed > 0
    ? LONG_BREAK_EVERY
    : LONG_BREAK_EVERY - (session.completed % LONG_BREAK_EVERY)

  return (
    <div data-testid="focus-sessions" className="w-full max-w-2xl mx-auto">
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-semibold text-neutral-100">Focus Session</h2>
            <p className="text-xs text-neutral-500">
              Pomodoro-style timer. Completed today: <span data-testid="focus-completed">{session.completed}</span>
            </p>
          </div>
          <div className="flex gap-2" role="group" aria-label="Session mode">
            {[FOCUS_MODE.FOCUS, FOCUS_MODE.SHORT_BREAK, FOCUS_MODE.LONG_BREAK].map((m) => (
              <ModeTab key={m} mode={m} active={session.mode === m} onSelect={(m2) => focusSession.selectMode(m2)} />
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center text-center py-4">
          <div
            data-testid="focus-mode-label"
            className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-2"
          >
            {FOCUS_MODE_LABELS[session.mode]}
          </div>
          <div
            data-testid="focus-clock"
            className="text-6xl sm:text-7xl font-bold text-neutral-50 font-mono tabular-nums"
            role="timer"
            aria-live="off"
            aria-label={`${Math.ceil(session.remainingMs / 60000)} minutes remaining`}
          >
            {formatClock(session.remainingMs)}
          </div>
          <div className="mt-3 h-6 text-sm" role="status">
            {complete && (
              <motion.span
                data-testid="focus-complete-msg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-success"
              >
                {FOCUS_MODE_LABELS[session.mode]} complete — start when ready
              </motion.span>
            )}
            {running && <span className="text-neutral-500">In progress…</span>}
            {paused && <span className="text-warning">Paused</span>}
            {idle && (
              <span className="text-neutral-500">
                Ready · {session.preferences[session.mode]} min
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          {!running && (
            <button
              type="button"
              onClick={() => (paused ? focusSession.resume() : focusSession.start())}
              data-testid="focus-start"
              className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-primary-500 to-accent-400 text-white text-sm font-medium hover:shadow-lg hover:shadow-primary-500/25 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
            >
              {paused ? 'Resume' : complete ? 'Start next' : 'Start'}
            </button>
          )}
          {running && (
            <button
              type="button"
              onClick={() => focusSession.pause()}
              data-testid="focus-pause"
              className="px-6 py-2.5 rounded-lg bg-neutral-800 text-neutral-100 text-sm font-medium hover:bg-neutral-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
            >
              Pause
            </button>
          )}
          <button
            type="button"
            onClick={() => focusSession.reset()}
            data-testid="focus-reset"
            className="px-4 py-2.5 rounded-lg border border-neutral-800 text-neutral-300 text-sm hover:bg-neutral-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
          >
            Reset
          </button>
          {(running || paused) && (
            <button
              type="button"
              onClick={() => focusSession.skip()}
              data-testid="focus-skip"
              className="px-4 py-2.5 rounded-lg border border-neutral-800 text-neutral-400 text-sm hover:bg-neutral-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
            >
              Skip
            </button>
          )}
        </div>

        <p className="mt-3 text-center text-xs text-neutral-600" data-testid="focus-hint">
          {complete
            ? `Next up: ${nextLabel}`
            : `Long break every ${LONG_BREAK_EVERY} focus rounds · ${nextInCycle} to go`}
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-neutral-800 bg-neutral-950/60 p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-neutral-200 mb-4">Background music</h3>
        <label className="flex items-center gap-3 text-sm text-neutral-300 mb-4">
          <input
            type="checkbox"
            checked={session.musicEnabled}
            onChange={(e) => focusSession.setMusicEnabled(e.target.checked)}
            data-testid="focus-music-toggle"
            className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
          />
          Play a procedural preset while focusing
        </label>

        <label htmlFor="focus-preset" className="block text-xs text-neutral-500 mb-1">
          Preset
        </label>
        <select
          id="focus-preset"
          data-testid="focus-preset"
          value={session.presetId || ''}
          disabled={!session.musicEnabled}
          onChange={(e) => focusSession.setPresetId(e.target.value || null)}
          className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm text-neutral-100 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
        >
          <option value="">No music (silent session)</option>
          {presets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <h3 className="mt-6 text-sm font-semibold text-neutral-200 mb-3">Durations</h3>
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          <DurationField
            label="Focus"
            mode={FOCUS_MODE.FOCUS}
            value={session.preferences[FOCUS_MODE.FOCUS]}
            onChange={(v) => focusSession.setDuration(FOCUS_MODE.FOCUS, v)}
            disabled={running}
          />
          <DurationField
            label="Short break"
            mode={FOCUS_MODE.SHORT_BREAK}
            value={session.preferences[FOCUS_MODE.SHORT_BREAK]}
            onChange={(v) => focusSession.setDuration(FOCUS_MODE.SHORT_BREAK, v)}
            disabled={running}
          />
          <DurationField
            label="Long break"
            mode={FOCUS_MODE.LONG_BREAK}
            value={session.preferences[FOCUS_MODE.LONG_BREAK]}
            onChange={(v) => focusSession.setDuration(FOCUS_MODE.LONG_BREAK, v)}
            disabled={running}
          />
        </div>
        <p className="mt-3 text-xs text-neutral-600">
          Durations apply the next time a session starts. Your settings and completed count are saved on this device.
        </p>
      </div>
    </div>
  )
}
