import { useEffect, useRef } from 'react'

// The element that triggered the currently-open dialog. Captured at open time
// (before the background becomes `inert`, which would blur the trigger) so focus
// can be restored to it when the dialog closes.
let lastTrigger = null

export function rememberDialogTrigger(el) {
  lastTrigger = el && el !== document.body ? el : null
}

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

function focusableElements(root) {
  return Array.from(root.querySelectorAll(FOCUSABLE)).filter(
    (el) => el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0,
  )
}

export default function useDialogFocus() {
  const ref = useRef(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const fallback = document.activeElement

    node.focus({ preventScroll: true })

    function handleKeyDown(e) {
      if (e.key !== 'Tab') return
      const els = focusableElements(node)
      if (els.length === 0) {
        e.preventDefault()
        node.focus({ preventScroll: true })
        return
      }
      const first = els[0]
      const last = els[els.length - 1]
      const active = document.activeElement
      if (e.shiftKey) {
        if (active === first || !node.contains(active)) {
          e.preventDefault()
          last.focus()
        }
      } else if (active === last || !node.contains(active)) {
        e.preventDefault()
        first.focus()
      }
    }

    node.addEventListener('keydown', handleKeyDown)
    return () => {
      node.removeEventListener('keydown', handleKeyDown)
      const target = lastTrigger || fallback
      if (
        target &&
        target !== document.body &&
        target.isConnected &&
        typeof target.focus === 'function'
      ) {
        target.focus({ preventScroll: true })
      }
    }
  }, [])

  return ref
}
