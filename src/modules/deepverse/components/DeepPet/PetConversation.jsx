import { useCallback, useEffect, useRef, useState } from 'react'
import { getReply } from './petBrain'
import { executeProposal } from './actionRunner'
import { actionResultLine, reactionForActionResult } from './petPersona'
import { pet } from './store'
import { REACTION_PRIORITY } from './petState'

const MAX_INPUT = 500
const REPLY_HOLD_MS = 9000

const SUGGESTIONS = [
  'Tell me about yourself',
  'Take me to Cosmos',
  "Let's listen to music",
  'What can you do?',
]

// Compact conversation surface for the dedicated DeepPet world only. The global
// floating pet never mounts this, so entering another world stays lightweight.
export default function PetConversation({ navigate, reduced = false }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasBackend, setHasBackend] = useState(null)

  const abortRef = useRef(null)
  const listRef = useRef(null)
  const inputRef = useRef(null)

  // Availability probe: the same endpoint the portfolio assistant uses. A false
  // result does not disable chat — it switches the brain to its local persona.
  useEffect(() => {
    const ac = new AbortController()
    const tid = setTimeout(() => ac.abort(), 3000)
    fetch('/api/ai/status', { signal: ac.signal })
      .then((r) => { clearTimeout(tid); setHasBackend(r.ok) })
      .catch(() => { clearTimeout(tid); setHasBackend(false) })
    return () => { clearTimeout(tid); ac.abort() }
  }, [])

  useEffect(() => () => {
    if (abortRef.current) { try { abortRef.current.abort() } catch { /* ignore */ } }
  }, [])

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      const el = listRef.current
      if (el) el.scrollTop = el.scrollHeight
    })
  }, [])

  useEffect(() => { scrollToEnd() }, [messages, loading, scrollToEnd])

  // One event drives both the face and the spoken line; the hold expires so the
  // autonomous idle behaviour is never permanently overridden.
  const applyReply = useCallback((text, reactionEvent) => {
    pet.react(reactionEvent, {
      force: true,
      priority: REACTION_PRIORITY.success,
      hold: REPLY_HOLD_MS,
      line: text,
    })
  }, [])

  const send = useCallback(async (raw) => {
    const text = String(raw || '').trim().slice(0, MAX_INPUT)
    if (!text || loading) return

    setInput('')
    setError(null)

    const historySnapshot = messages
    setMessages((prev) => [...prev, { role: 'user', text }])
    setLoading(true)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const reply = await getReply(text, {
        history: historySnapshot,
        aiEnabled: hasBackend === true,
        signal: controller.signal,
      })

      if (reply.kind === 'action' && reply.proposal) {
        // Interpretation stays separate from execution: getReply only proposes.
        // The registry validates and runs the handler, and we report the real
        // result. For navigation the handler calls navigate(), so the success
        // line lands on the destination pet rather than charging ahead of it.
        applyReply(reply.text, 'greet')
        const result = await executeProposal(reply.proposal, {
          navigate: navigate ? (path) => navigate(path) : undefined,
          signal: controller.signal,
        })
        const line = actionResultLine(result)
        applyReply(line, reactionForActionResult(result))
        setMessages((prev) => [...prev, { role: 'assistant', text: line }])
      } else {
        applyReply(reply.text, reply.reaction)
        setMessages((prev) => [...prev, { role: 'assistant', text: reply.text }])
      }
    } catch {
      setError("I lost my train of thought for a second. Try again?")
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }, [applyReply, hasBackend, loading, messages, navigate])

  const handleSubmit = (e) => {
    e?.preventDefault()
    send(input)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  const reset = () => {
    if (abortRef.current) { try { abortRef.current.abort() } catch { /* ignore */ } }
    setMessages([])
    setError(null)
    setLoading(false)
    setInput('')
    inputRef.current?.focus()
  }

  const busy = loading
  const modeLabel = hasBackend === null ? 'connecting' : hasBackend ? 'AI brain' : 'offline brain'

  return (
    <section
      aria-label="Talk to DeepPet"
      className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-3"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-500">Talk to DeepPet</h3>
        <div className="flex items-center gap-2">
          <span
            className="rounded-full border border-neutral-700 bg-neutral-800/60 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-neutral-500"
            title={hasBackend === false ? 'No AI provider reachable — chatting with DeepPet\'s local personality' : 'Answers come from the configured AI provider'}
          >
            {modeLabel}
          </span>
          <button
            onClick={reset}
            disabled={busy || messages.length === 0}
            className="text-[11px] text-neutral-500 transition-colors hover:text-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Reset
          </button>
        </div>
      </div>

      <div
        ref={listRef}
        className="mb-2 max-h-[220px] min-h-[88px] space-y-2 overflow-y-auto rounded-lg bg-neutral-950/40 p-3"
        aria-live="polite"
        aria-label="Conversation history"
      >
        {messages.length === 0 && !loading && (
          <p className="py-4 text-center text-xs text-neutral-600">
            Say hi, ask what DeepPet can do, or tell it where to go.
          </p>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={
                'max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm leading-relaxed ' +
                (m.role === 'user'
                  ? 'rounded-br-sm border border-green-400/25 bg-green-400/10 text-green-100'
                  : 'rounded-bl-sm border border-neutral-700 bg-neutral-800 text-neutral-200')
              }
            >
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm border border-neutral-700 bg-neutral-800 px-3 py-2">
              <span className="text-xs text-neutral-400">
                {reduced ? 'DeepPet is thinking…' : 'DeepPet is thinking'}
                {!reduced && <span className="deeppet-typing" aria-hidden="true">…</span>}
              </span>
            </div>
          </div>
        )}

        {error && (
          <p className="text-center text-[11px] text-amber-300/80">{error}</p>
        )}
      </div>

      <div className="mb-2 flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
            disabled={busy}
            className="rounded-full border border-neutral-700 bg-neutral-800/60 px-2.5 py-1 text-[11px] text-neutral-300 transition-colors hover:border-green-400/40 hover:text-green-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {s}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <label htmlFor="deeppet-input" className="sr-only">Message DeepPet</label>
        <textarea
          id="deeppet-input"
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          maxLength={MAX_INPUT}
          placeholder="Ask or tell DeepPet where to go…"
          disabled={busy}
          className="max-h-24 min-h-[38px] flex-1 resize-none rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-green-400/50 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          aria-label="Send message"
          className="rounded-lg border border-green-400/30 bg-green-400/10 px-3 py-2 text-sm text-green-200 transition-colors hover:bg-green-400/20 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </section>
  )
}
