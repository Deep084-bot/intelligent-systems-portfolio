import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function initial() {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return !!window.matchMedia(QUERY).matches
}

// Reactive read of the OS reduced-motion preference. Re-evaluates if the user
// changes the setting mid-session, unlike the module-level snapshot some
// DeepVerse labs use.
export default function useReducedMotion() {
  const [reduced, setReduced] = useState(initial)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia(QUERY)
    const onChange = (e) => setReduced(e.matches)
    setReduced(mq.matches)

    if (mq.addEventListener) {
      mq.addEventListener('change', onChange)
      return () => mq.removeEventListener('change', onChange)
    }
    mq.addListener(onChange)
    return () => mq.removeListener(onChange)
  }, [])

  return reduced
}