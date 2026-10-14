import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import usePlaylist from '../../../audio/usePlaylist'
import { playlistEngine } from '../../../audio/playlistEngine'
import { formatDuration } from '../../../audio/playlistQueue'

const REPEAT_LABEL = { off: 'Repeat: off', all: 'Repeat: all', one: 'Repeat: one' }

function IconButton({ label, onClick, active = false, disabled = false, children, testid }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active || undefined}
      data-testid={testid}
      className={`inline-flex items-center justify-center rounded-md border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 disabled:opacity-40 disabled:cursor-not-allowed ${
        active
          ? 'bg-primary-500/20 border-primary-500/50 text-primary-100'
          : 'bg-neutral-900/60 border-neutral-800 text-neutral-300 hover:text-neutral-100 hover:border-neutral-700'
      }`}
    >
      {children}
    </button>
  )
}

const svg = (path) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    {path}
  </svg>
)

const PlayIcon = svg(<path d="M8 5v14l11-7z" />)
const PauseIcon = svg(<path d="M6 5h4v14H6zM14 5h4v14h-4z" />)
const PrevIcon = svg(<path d="M6 6h2v12H6zm3 6l9-6v12z" />)
const NextIcon = svg(<path d="M16 6h2v12h-2zM6 18l9-6-9-6z" />)
const HeartIcon = svg(<path d="M12 21s-7-4.35-9.5-8.5C.5 9 2.5 5 6.5 5c2 0 3.5 1.17 4.5 2.5C12 6.17 13.5 5 15.5 5c4 0 6 4 4 7.5C19 16.65 12 21 12 21z" />)

export default function LocalPlaylist() {
  const lib = usePlaylist()
  const fileInputRef = useRef(null)
  const reselectInputRef = useRef(null)
  const [importing, setImporting] = useState(false)
  const [notice, setNotice] = useState(null)
  const [reselectId, setReselectId] = useState(null)
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [newPlaylistName, setNewPlaylistName] = useState('')

  const handleFiles = async (event) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    setImporting(true)
    setNotice(null)
    const result = await playlistEngine.addFiles(files)
    if (result.skipped.length > 0) {
      setNotice(`${result.skipped.length} unsupported file(s) skipped: ${result.skipped.join(', ')}`)
    } else if (result.added > 0) {
      setNotice(`Added ${result.added} track(s).`)
    }
    setImporting(false)
    event.target.value = ''
  }

  const handleReselect = async (event) => {
    const file = event.target.files && event.target.files[0]
    if (file && reselectId) await playlistEngine.replaceTrackFile(reselectId, file)
    setReselectId(null)
    event.target.value = ''
  }

  const beginReselect = (id) => {
    setReselectId(id)
    reselectInputRef.current?.click()
  }

  const submitNewPlaylist = (e) => {
    e.preventDefault()
    if (!newPlaylistName.trim()) return
    playlistEngine.createPlaylist(newPlaylistName)
    setNewPlaylistName('')
  }

  const commitRename = () => {
    if (renamingId) playlistEngine.renamePlaylist(renamingId, renameValue)
    setRenamingId(null)
    setRenameValue('')
  }

  const persistenceLabel =
    lib.persistence === 'indexeddb'
      ? 'Saved in this browser (IndexedDB)'
      : lib.persistence === 'localstorage'
        ? 'Metadata saved; audio session-only (reselect after reload)'
        : 'Session only — audio not saved'

  return (
    <div data-testid="local-playlist" className="w-full max-w-3xl mx-auto">
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-100">My Music</h2>
            <p className="text-xs text-neutral-500" data-testid="playlist-persistence">
              {persistenceLabel}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              id="playlist-file-input"
              type="file"
              accept="audio/*,.mp3,.wav,.ogg,.oga,.m4a,.aac,.flac,.opus"
              multiple
              onChange={handleFiles}
              className="sr-only"
              aria-label="Import audio files"
              tabIndex={-1}
              data-testid="playlist-file-input"
            />
            <input
              ref={reselectInputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.ogg,.oga,.m4a,.aac,.flac,.opus"
              onChange={handleReselect}
              className="sr-only"
              aria-hidden="true"
              tabIndex={-1}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              data-testid="playlist-import"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-accent-400 text-white text-sm font-medium hover:shadow-lg hover:shadow-primary-500/25 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 disabled:opacity-50"
            >
              {importing ? 'Importing…' : 'Import audio files'}
            </button>
          </div>
        </div>

        {notice && (
          <div className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-xs text-neutral-400">
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss notice" className="text-neutral-500 hover:text-neutral-200">
              ×
            </button>
          </div>
        )}

        {lib.lastError && (
          <div
            role="alert"
            data-testid="playlist-error"
            className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-error/40 bg-error/10 px-3 py-2 text-xs text-error"
          >
            <span>{lib.lastError.message}</span>
            <button type="button" onClick={() => playlistEngine.clearError()} aria-label="Dismiss error" className="text-error/80 hover:text-error">
              ×
            </button>
          </div>
        )}

        {!lib.hasTracks ? (
          <div className="py-10 text-center" data-testid="playlist-empty">
            <p className="text-sm text-neutral-400 mb-2">No tracks yet.</p>
            <p className="text-xs text-neutral-600 max-w-sm mx-auto">
              Import local audio files (MP3, WAV, OGG, M4A…) to build a playlist. Files stay on
              your device and are never uploaded.
            </p>
          </div>
        ) : (
          <>
            {/* Player bar */}
            <div className="mb-4 rounded-xl border border-neutral-800 bg-neutral-900/40 p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-neutral-100 truncate" data-testid="playlist-now-playing">
                    {lib.current ? lib.current.title : 'Nothing selected'}
                  </div>
                  <div className="text-[11px] text-neutral-500 tabular-nums">
                    <span data-testid="playlist-position">{lib.positionLabel}</span>
                    {' / '}
                    <span>{lib.durationLabel}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <IconButton label="Previous track" testid="playlist-prev" onClick={() => playlistEngine.prev()}>
                    {PrevIcon}
                  </IconButton>
                  <IconButton
                    label={lib.playing ? 'Pause' : 'Play'}
                    testid="playlist-toggle"
                    onClick={() => playlistEngine.toggle()}
                  >
                    {lib.playing ? PauseIcon : PlayIcon}
                  </IconButton>
                  <IconButton label="Next track" testid="playlist-next" onClick={() => playlistEngine.next()}>
                    {NextIcon}
                  </IconButton>
                </div>
              </div>

              <input
                type="range"
                min={0}
                max={Math.max(1, lib.durationMs)}
                value={Math.min(lib.positionMs, lib.durationMs || 0)}
                onChange={(e) => playlistEngine.seek(Number(e.target.value))}
                aria-label="Seek"
                data-testid="playlist-seek"
                className="mt-3 w-full accent-primary-500"
              />

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <IconButton
                    label="Shuffle"
                    testid="playlist-shuffle"
                    active={lib.shuffle}
                    onClick={() => playlistEngine.setShuffle(!lib.shuffle)}
                  >
                    <span className="px-2 text-xs">Shuffle</span>
                  </IconButton>
                  <IconButton
                    label={REPEAT_LABEL[lib.repeat]}
                    testid="playlist-repeat"
                    active={lib.repeat !== 'off'}
                    onClick={() => playlistEngine.cycleRepeat()}
                  >
                    <span className="px-2 text-xs">{REPEAT_LABEL[lib.repeat]}</span>
                  </IconButton>
                </div>
                <label className="flex items-center gap-2 text-xs text-neutral-400">
                  <span>Volume</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={lib.volume}
                    onChange={(e) => playlistEngine.setVolume(Number(e.target.value))}
                    aria-label="Volume"
                    data-testid="playlist-volume"
                    className="w-28 accent-primary-500"
                  />
                </label>
              </div>
            </div>

            {/* Track list */}
            <ul role="list" className="divide-y divide-neutral-900" data-testid="playlist-tracks">
              {lib.tracks.map((track) => (
                <li key={track.id} className="flex items-center gap-3 py-2.5">
                  <IconButton
                    label={lib.currentId === track.id && lib.playing ? `Pause ${track.title}` : `Play ${track.title}`}
                    onClick={() => {
                      if (lib.currentId === track.id) playlistEngine.toggle()
                      else playlistEngine.play(track.id)
                    }}
                    disabled={!track.available}
                  >
                    {lib.currentId === track.id && lib.playing ? PauseIcon : PlayIcon}
                  </IconButton>

                  <div className="min-w-0 flex-1">
                    <div className={`truncate text-sm ${lib.currentId === track.id ? 'text-primary-200' : 'text-neutral-200'}`}>
                      {track.title}
                    </div>
                    <div className="truncate text-[11px] text-neutral-600">
                      {track.name}
                      {track.duration > 0 ? ` · ${formatDuration(track.duration)}` : ''}
                      {!track.available ? ' · File missing' : ''}
                      {!track.persisted && track.available ? ' · Session only' : ''}
                    </div>
                  </div>

                  {!track.available && (
                    <button
                      type="button"
                      onClick={() => beginReselect(track.id)}
                      data-testid={`playlist-reselect-${track.id}`}
                      className="rounded-md border border-warning/40 px-2 py-1 text-[11px] text-warning hover:bg-warning/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
                    >
                      Reselect
                    </button>
                  )}

                  <IconButton
                    label={track.favourite ? `Remove ${track.title} from favourites` : `Add ${track.title} to favourites`}
                    testid={`playlist-fav-${track.id}`}
                    active={track.favourite}
                    onClick={() => playlistEngine.toggleFavourite(track.id)}
                  >
                    {HeartIcon}
                  </IconButton>

                  {lib.playlists.length > 0 && (
                    <select
                      aria-label={`Add ${track.title} to a playlist`}
                      value=""
                      onChange={(e) => {
                        if (e.target.value) playlistEngine.addToPlaylist(e.target.value, track.id)
                        e.target.value = ''
                      }}
                      className="rounded-md bg-neutral-900 border border-neutral-800 px-1.5 py-1 text-[11px] text-neutral-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
                    >
                      <option value="">Add to…</option>
                      {lib.playlists.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  )}

                  <button
                    type="button"
                    onClick={() => playlistEngine.removeTrack(track.id)}
                    aria-label={`Remove ${track.title}`}
                    data-testid={`playlist-remove-${track.id}`}
                    className="rounded-md px-2 py-1 text-xs text-neutral-600 hover:text-error focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Playlists */}
        <div className="mt-6 border-t border-neutral-900 pt-4">
          <h3 className="text-sm font-semibold text-neutral-200 mb-3">Playlists</h3>
          <form onSubmit={submitNewPlaylist} className="flex gap-2 mb-3">
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="New playlist name"
              aria-label="New playlist name"
              data-testid="playlist-new-name"
              className="flex-1 rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
            />
            <button
              type="submit"
              data-testid="playlist-create"
              className="rounded-lg border border-neutral-800 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
            >
              Create
            </button>
          </form>

          {lib.playlists.length === 0 ? (
            <p className="text-xs text-neutral-600">No custom playlists yet.</p>
          ) : (
            <ul role="list" className="space-y-2" data-testid="playlists">
              {lib.playlists.map((p) => (
                <li key={p.id} className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/40 px-3 py-2">
                  {renamingId === p.id ? (
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename()
                        if (e.key === 'Escape') setRenamingId(null)
                      }}
                      autoFocus
                      aria-label="Rename playlist"
                      className="flex-1 rounded bg-neutral-900 border border-neutral-700 px-2 py-1 text-sm text-neutral-100"
                    />
                  ) : (
                    <span className="flex-1 text-sm text-neutral-200">
                      {p.name} <span className="text-xs text-neutral-600">· {p.trackIds.length} track(s)</span>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => playlistEngine.playPlaylist(p.id)}
                    data-testid={`playlist-play-${p.id}`}
                    className="rounded-md border border-neutral-800 px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
                  >
                    Play
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRenamingId(p.id)
                      setRenameValue(p.name)
                    }}
                    aria-label={`Rename ${p.name}`}
                    className="rounded-md px-2 py-1 text-xs text-neutral-500 hover:text-neutral-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    onClick={() => playlistEngine.deletePlaylist(p.id)}
                    aria-label={`Delete ${p.name}`}
                    className="rounded-md px-2 py-1 text-xs text-neutral-500 hover:text-error focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-5 text-[11px] text-neutral-600"
        >
          Audio is stored locally on your device only. Nothing is uploaded.
        </motion.p>
      </div>
    </div>
  )
}
