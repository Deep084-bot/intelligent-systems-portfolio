// DeepVerse — local playlist persistence.
//
// Audio files never leave the browser. We use IndexedDB when available because
// it can hold Blobs (the actual audio) and is the only browser store suited to
// binary data of this size; localStorage is used only as a metadata fallback so
// playlists survive a reload as *metadata-only* entries when IndexedDB is
// unavailable or a blob could not be stored (e.g. quota exceeded).
//
// Every browser call is guarded: in Node, in private mode, or when the user has
// blocked storage, the store degrades to an in-memory session and reports that
// via `persistence`.

const DB_NAME = 'deepverse-playlist'
const DB_VERSION = 1
const BLOB_STORE = 'blobs'
const KV_STORE = 'kv'
const META_KEY = 'deepverse.playlist.meta.v1'
const META_RECORD = 'library'

export const PERSISTENCE = {
  INDEXEDDB: 'indexeddb',
  LOCALSTORAGE: 'localstorage',
  MEMORY: 'memory',
}

function safeLocalStorage() {
  try {
    if (typeof localStorage === 'undefined') return null
    const probe = '__dv_pl_probe__'
    localStorage.setItem(probe, '1')
    localStorage.removeItem(probe)
    return localStorage
  } catch {
    return null
  }
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export class PlaylistStore {
  constructor({ indexedDB = typeof globalThis !== 'undefined' ? globalThis.indexedDB : undefined, storage = safeLocalStorage() } = {}) {
    this._idbFactory = indexedDB
    this._storage = storage
    this._db = null
    this.persistence = PERSISTENCE.MEMORY
    this.memoryBlobs = new Map()
  }

  async init() {
    if (this._idbFactory && typeof this._idbFactory.open === 'function') {
      try {
        this._db = await this._openDb()
        this.persistence = PERSISTENCE.INDEXEDDB
        return this.persistence
      } catch {
        this._db = null
      }
    }
    this.persistence = this._storage ? PERSISTENCE.LOCALSTORAGE : PERSISTENCE.MEMORY
    return this.persistence
  }

  _openDb() {
    return new Promise((resolve, reject) => {
      let req
      try {
        req = this._idbFactory.open(DB_NAME, DB_VERSION)
      } catch (err) {
        reject(err)
        return
      }
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(BLOB_STORE)) db.createObjectStore(BLOB_STORE, { keyPath: 'id' })
        if (!db.objectStoreNames.contains(KV_STORE)) db.createObjectStore(KV_STORE)
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  }

  // ---- metadata (library = track metadata + custom playlists) ----------------

  async saveLibrary({ tracks = [], playlists = [] } = {}) {
    const clean = {
      tracks: tracks.map((t) => ({
        id: t.id,
        name: t.name,
        title: t.title,
        duration: Number.isFinite(t.duration) ? t.duration : 0,
        favourite: !!t.favourite,
      })),
      playlists: playlists.map((p) => ({ id: p.id, name: p.name, trackIds: [...p.trackIds] })),
    }
    if (this.persistence === PERSISTENCE.INDEXEDDB && this._db) {
      try {
        const tx = this._db.transaction(KV_STORE, 'readwrite')
        tx.objectStore(KV_STORE).put(clean, META_RECORD)
        await new Promise((res, rej) => {
          tx.oncomplete = () => res()
          tx.onerror = () => rej(tx.error)
          tx.onabort = () => rej(tx.error)
        })
        return { ok: true }
      } catch (err) {
        return { ok: false, error: 'META_WRITE_FAILED', detail: String(err) }
      }
    }
    if (this._storage) {
      try {
        this._storage.setItem(META_KEY, JSON.stringify(clean))
        return { ok: true }
      } catch (err) {
        // Most commonly a quota error.
        return { ok: false, error: 'QUOTA', detail: String(err) }
      }
    }
    return { ok: false, error: 'NO_STORAGE' }
  }

  async loadLibrary() {
    const parse = (value) => {
      if (Array.isArray(value)) return { tracks: value, playlists: [] } // legacy shape
      if (value && typeof value === 'object') {
        return {
          tracks: Array.isArray(value.tracks) ? value.tracks : [],
          playlists: Array.isArray(value.playlists) ? value.playlists : [],
        }
      }
      return { tracks: [], playlists: [] }
    }
    if (this.persistence === PERSISTENCE.INDEXEDDB && this._db) {
      try {
        const tx = this._db.transaction(KV_STORE, 'readonly')
        const value = await requestToPromise(tx.objectStore(KV_STORE).get(META_RECORD))
        return parse(value)
      } catch {
        return { tracks: [], playlists: [] }
      }
    }
    if (this._storage) {
      try {
        const raw = this._storage.getItem(META_KEY)
        return parse(raw ? JSON.parse(raw) : null)
      } catch {
        return { tracks: [], playlists: [] }
      }
    }
    return { tracks: [], playlists: [] }
  }

  // ---- blobs ----------------------------------------------------------------

  async saveBlob(id, blob) {
    if (this.persistence === PERSISTENCE.INDEXEDDB && this._db) {
      try {
        const tx = this._db.transaction(BLOB_STORE, 'readwrite')
        tx.objectStore(BLOB_STORE).put({ id, blob })
        await new Promise((res, rej) => {
          tx.oncomplete = () => res()
          tx.onerror = () => rej(tx.error)
          tx.onabort = () => rej(tx.error)
        })
        return { ok: true, persisted: true }
      } catch (err) {
        // QuotaExceededError or a blocked transaction: keep it in memory only.
        return { ok: false, persisted: false, error: 'QUOTA', detail: String(err) }
      }
    }
    // No IndexedDB: hold the blob for this session only. It is not persistent,
    // so callers should surface a "reselect after reload" state.
    this.memoryBlobs.set(id, blob)
    return { ok: true, persisted: false }
  }

  async loadBlobs() {
    const map = new Map()
    if (this.persistence === PERSISTENCE.INDEXEDDB && this._db) {
      try {
        const tx = this._db.transaction(BLOB_STORE, 'readonly')
        const all = await requestToPromise(tx.objectStore(BLOB_STORE).getAll())
        for (const rec of all || []) {
          if (rec && rec.id && rec.blob) map.set(rec.id, rec.blob)
        }
      } catch {
        /* ignore — treat as no blobs */
      }
    }
    for (const [id, blob] of this.memoryBlobs) map.set(id, blob)
    return map
  }

  async deleteBlob(id) {
    this.memoryBlobs.delete(id)
    if (this.persistence === PERSISTENCE.INDEXEDDB && this._db) {
      try {
        const tx = this._db.transaction(BLOB_STORE, 'readwrite')
        tx.objectStore(BLOB_STORE).delete(id)
        await new Promise((res) => {
          tx.oncomplete = () => res()
          tx.onerror = () => res()
          tx.onabort = () => res()
        })
        return { ok: true }
      } catch {
        return { ok: false }
      }
    }
    return { ok: true }
  }

  async clearBlobs() {
    this.memoryBlobs.clear()
    if (this.persistence === PERSISTENCE.INDEXEDDB && this._db) {
      try {
        const tx = this._db.transaction(BLOB_STORE, 'readwrite')
        tx.objectStore(BLOB_STORE).clear()
        await new Promise((res) => {
          tx.oncomplete = () => res()
          tx.onerror = () => res()
          tx.onabort = () => res()
        })
      } catch {
        /* ignore */
      }
    }
  }
}

export { META_KEY }
