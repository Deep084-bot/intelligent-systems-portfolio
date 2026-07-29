import { useState, useEffect, useRef } from 'react'

const CACHE_KEY = 'deepverse-book-covers-v3'
const memoryCache = new Map()
const failedSet = new Set()
const preloadQueue = new Set()

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      for (const [key, val] of Object.entries(parsed)) {
        memoryCache.set(key, val)
      }
    }
  } catch {}
}
loadCache()

function saveCache() {
  try {
    const obj = {}
    for (const [key, val] of memoryCache.entries()) {
      obj[key] = val
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(obj))
  } catch {}
}

async function fetchByISBN(isbn) {
  if (!isbn) return null
  try {
    const res = await fetch(
      `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`,
      { method: 'HEAD' }
    )
    if (res.ok || res.status === 302) {
      return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
    }
  } catch {}
  return null
}

async function fetchBySearch(title, author) {
  const query = `${title} ${author}`.trim()
  if (!query) return null
  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=5`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (!res.ok) return null
    const data = await res.json()
    const doc = data.docs?.[0]
    if (doc?.cover_i) {
      return `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
    }
  } catch {}
  return null
}

const pending = new Map()

function buildCacheKey(book) {
  if (book.isbn) return `isbn:${book.isbn}`
  return `book:${book.title}|${book.author}`
}

function validateCachedUrl(book, url) {
  if (!url) return false
  if (url.startsWith('http')) return true
  return false
}

export function preloadCover(book) {
  if (!book) return
  const cacheKey = buildCacheKey(book)
  if (memoryCache.has(cacheKey) || failedSet.has(cacheKey) || preloadQueue.has(cacheKey)) return
  preloadQueue.add(cacheKey)
  const img = new Image()
  if (book.isbn) {
    img.src = `https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg`
  }
}

export function useCover(book) {
  const [coverUrl, setCoverUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const cacheKey = buildCacheKey(book)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (book.manualCover) {
        if (mountedRef.current) {
          setCoverUrl(book.manualCover)
          setLoading(false)
        }
        return
      }

      if (memoryCache.has(cacheKey)) {
        const cachedUrl = memoryCache.get(cacheKey)
        if (validateCachedUrl(book, cachedUrl)) {
          if (mountedRef.current) {
            setCoverUrl(cachedUrl)
            setLoading(false)
          }
          return
        }
        memoryCache.delete(cacheKey)
        saveCache()
      }

      if (failedSet.has(cacheKey)) {
        if (mountedRef.current) setLoading(false)
        return
      }

      if (pending.has(cacheKey)) {
        const result = await pending.get(cacheKey)
        if (mountedRef.current && result) {
          setCoverUrl(result)
          setLoading(false)
        } else if (mountedRef.current) {
          setLoading(false)
        }
        return
      }

      const promise = (async () => {
        let url = null

        if (book.isbn) {
          url = await fetchByISBN(book.isbn)
        }

        if (!url) {
          url = await fetchBySearch(book.title, book.author)
        }

        if (url) {
          memoryCache.set(cacheKey, url)
          saveCache()
        } else {
          failedSet.add(cacheKey)
        }

        return url
      })()

      pending.set(cacheKey, promise)

      const url = await promise
      pending.delete(cacheKey)

      if (!cancelled && mountedRef.current) {
        setCoverUrl(url)
        setLoading(false)
      }
    }

    load()

    return () => { cancelled = true }
  }, [cacheKey, book.isbn, book.title, book.author, book.manualCover])

  return { coverUrl, loading }
}
