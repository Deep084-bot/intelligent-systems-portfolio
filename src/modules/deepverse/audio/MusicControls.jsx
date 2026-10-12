// DeepVerse — music controls, driven by the one shared MusicEngine.
//
// Rendered in two places (the DeepPet world and the Music Lab) with different
// densities, but both read and write the same singleton, so a change made in
// one is instantly reflected in the other. There is no second player and no
// second AudioContext.

import { useState } from 'react'
import useMusicEngine from './useMusicEngine'
import { musicEngine } from './MusicEngine'

function statusLabel(status) {
  if (status === 'playing') return 'Playing'
  if (status === 'paused') return 'Paused'
  return 'Stopped'
}

export default function MusicControls({ variant = 'compact' }) {
  const snap = useMusicEngine()
  const [notice, setNotice] = useState(null)
  const full = variant === 'full'

  const supported = snap.supported
  const playing = snap.status === 'playing'

  const handlePlayPause = async () => {
    setNotice(null)
    if (snap.status === 'playing') {
      const res = await musicEngine.pause()
      if (!res.ok && res.errorCode) setNotice('Could not pause right now.')
      return
    }
    if (snap.status === 'paused') {
      const res = await musicEngine.resume()
      if (!res.ok) setNotice(noticeFor(res.errorCode))
      return
    }
    const res = await musicEngine.play(snap.presetId || 'cosmic-drift')
    if (!res.ok) setNotice(noticeFor(res.errorCode))
  }

  const handleNext = async () => {
    setNotice(null)
    const res = await musicEngine.next()
    if (!res.ok) setNotice(noticeFor(res.errorCode))
  }

  const handleStop = () => {
    setNotice(null)
    musicEngine.stop()
  }

  const handlePreset = async (id) => {
    setNotice(null)
    const res = await musicEngine.play(id)
    if (!res.ok) setNotice(noticeFor(res.errorCode))
  }

  const handleVolume = (e) => {
    setNotice(null)
    musicEngine.setVolume(Number(e.target.value) / 100)
  }

  const activeName = snap.preset ? snap.preset.name : 'Choose a track'

  return (
    <div
      className={
        'rounded-xl border border-neutral-800 bg-neutral-900/50 ' +
        (full ? 'p-5' : 'p-4')
      }
      aria-label="Music player"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className={'font-semibold text-neutral-200 ' + (full ? 'text-base' : 'text-sm')}>
          {full ? 'Music Player' : 'Music'}
        </h3>
        <span
          className={
            'rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ' +
            (playing
              ? 'border-green-400/40 bg-green-400/10 text-green-200'
              : snap.status === 'paused'
                ? 'border-amber-400/30 bg-amber-400/10 text-amber-200'
                : 'border-neutral-700 bg-neutral-800/60 text-neutral-500')
          }
          role="status"
          aria-live="polite"
        >
          {statusLabel(snap.status)}
        </span>
      </div>

      <p className="mt-1 text-xs text-neutral-500">
        {snap.preset ? snap.preset.description : 'Procedural synth presets, made in your browser.'}
      </p>

      {!supported && (
        <p className="mt-3 rounded-lg border border-neutral-800 bg-neutral-950/50 px-3 py-2 text-xs text-amber-300/80">
          Audio isn&apos;t available in this browser. Controls stay here for when it is.
        </p>
      )}

      {/* transport */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={handlePlayPause}
          disabled={!supported}
          aria-label={playing ? 'Pause' : snap.status === 'paused' ? 'Resume' : 'Play'}
          className="rounded-lg border border-green-400/30 bg-green-400/10 px-3 py-2 text-sm text-green-200 transition-colors hover:bg-green-400/20 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {playing ? 'Pause' : snap.status === 'paused' ? 'Resume' : 'Play'}
        </button>
        <button
          onClick={handleNext}
          disabled={!supported}
          aria-label="Next track"
          className="rounded-lg border border-neutral-700 bg-neutral-800/60 px-3 py-2 text-sm text-neutral-300 transition-colors hover:bg-neutral-700/60 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
        </button>
        {full && (
          <button
            onClick={handleStop}
            disabled={!supported || snap.status === 'idle'}
            aria-label="Stop"
            className="rounded-lg border border-neutral-700 bg-neutral-800/60 px-3 py-2 text-sm text-neutral-300 transition-colors hover:bg-neutral-700/60 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Stop
          </button>
        )}
      </div>

      {/* volume */}
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <label htmlFor={`music-volume-${variant}`} className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">
            Volume
          </label>
          <span className="text-[11px] text-neutral-400">{snap.volumePercent}%</span>
        </div>
        <input
          id={`music-volume-${variant}`}
          type="range"
          min="0"
          max="100"
          value={snap.volumePercent}
          onChange={handleVolume}
          className="mt-1 w-full accent-green-400"
          aria-label="Volume"
        />
      </div>

      {/* preset picker */}
      {full ? (
        <div className="mt-4">
          <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">Preset</span>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {snap.presets.map((p) => {
              const isActive = p.id === snap.presetId
              return (
                <button
                  key={p.id}
                  onClick={() => handlePreset(p.id)}
                  disabled={!supported}
                  aria-pressed={isActive}
                  className={
                    'rounded-lg border px-3 py-2 text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed ' +
                    (isActive
                      ? 'border-green-400/50 bg-green-400/10'
                      : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700 hover:bg-neutral-800/60')
                  }
                >
                  <span className={'block text-sm ' + (isActive ? 'text-green-200' : 'text-neutral-200')}>
                    {p.name}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-neutral-500">
                    {p.description}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-2">
          <label htmlFor={`music-preset-${variant}`} className="sr-only">Preset</label>
          <select
            id={`music-preset-${variant}`}
            value={snap.presetId || ''}
            onChange={(e) => e.target.value && handlePreset(e.target.value)}
            disabled={!supported}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-2 py-2 text-sm text-neutral-200 outline-none transition focus:border-green-400/50 disabled:opacity-40"
          >
            <option value="">{activeName}</option>
            {snap.presets.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      {notice && (
        <p className="mt-3 text-[11px] leading-relaxed text-amber-300/80" role="status" aria-live="polite">
          {notice}
        </p>
      )}
    </div>
  )
}

function noticeFor(errorCode) {
  if (errorCode === 'AUTOPLAY_BLOCKED') return 'Your browser needs a direct tap before audio can start.'
  if (errorCode === 'AUDIO_UNSUPPORTED') return 'Audio isn\u2019t available in this browser.'
  if (errorCode === 'UNKNOWN_TRACK') return 'That track isn\u2019t available.'
  if (errorCode === 'NOTHING_PLAYING') return 'Nothing is playing right now.'
  return 'Something went wrong starting playback.'
}
