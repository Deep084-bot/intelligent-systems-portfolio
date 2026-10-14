// Binds React to the focus-session singleton and drives its clock.
//
// The engine never owns a timer; this hook provides one. The interval is only a
// heartbeat — the true remaining time is derived from a timestamp inside the
// engine, so a throttled interval in a background tab cannot cause drift.
// Visibility/focus events trigger an immediate re-tick so the display is
// correct the moment the user returns.

import { useEffect, useSyncExternalStore } from 'react'
import { focusSession } from './focusSession'

const HEARTBEAT_MS = 250

export default function useFocusSession() {
  const snapshot = useSyncExternalStore(
    (cb) => focusSession.subscribe(cb),
    () => focusSession.getSnapshot(),
    () => focusSession.getSnapshot(),
  )

  useEffect(() => {
    let id = setInterval(() => focusSession.tick(), HEARTBEAT_MS)
    const onVisible = () => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        focusSession.tick()
      }
    }
    window.addEventListener('focus', onVisible)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      window.removeEventListener('focus', onVisible)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return snapshot
}
