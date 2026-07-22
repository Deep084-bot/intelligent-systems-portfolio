import { useState } from 'react'
import { motion } from 'framer-motion'

export default function PermissionGate({ onAllow, onBack }) {
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleRequest = async () => {
    setLoading(true)
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      })
      onAllow(stream)
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera access denied. Please allow camera access in your browser settings.')
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.')
      } else {
        setError(`Camera error: ${err.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center px-6">
      <button
        onClick={onBack}
        className="absolute top-6 left-6 inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 rounded px-2 py-1"
      >
        <span aria-hidden="true">←</span>
        <span>Back</span>
      </button>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md text-center"
      >
        <div className="text-4xl mb-6">👁</div>

        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-50 mb-3">
          Vision Arena
        </h1>

        <p className="text-neutral-400 text-sm sm:text-base leading-relaxed mb-8">
          This experience uses your camera to track your hand in real time.
          No data leaves your browser — everything runs locally.
        </p>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-sm mb-6 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3"
          >
            {error}
          </motion.p>
        )}

        <button
          onClick={handleRequest}
          disabled={loading}
          className={`
            inline-flex items-center gap-2 px-8 py-3.5 rounded-lg text-sm font-medium
            border border-primary-500/40 text-primary-300
            hover:bg-primary-500/10 hover:border-primary-500/60
            focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50
            transition-all duration-300
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {loading ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-primary-500/40 border-t-primary-300 animate-spin" />
              <span>Requesting camera...</span>
            </>
          ) : (
            <>
              <span>Enable Camera</span>
              <span className="text-lg">→</span>
            </>
          )}
        </button>

        <p className="mt-6 text-xs text-neutral-600">
          Your camera feed is processed locally and never sent to any server.
        </p>
      </motion.div>
    </div>
  )
}
