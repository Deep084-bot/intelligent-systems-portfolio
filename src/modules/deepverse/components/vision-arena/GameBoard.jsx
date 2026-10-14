import { motion, AnimatePresence } from 'framer-motion'

const GESTURE_EMOJI = {
  rock: '✊',
  paper: '✋',
  scissors: '✌️',
}

const RESULT_MESSAGES = {
  win: { text: 'You Win!', className: 'text-green-400' },
  lose: { text: 'Computer Wins!', className: 'text-red-400' },
  draw: { text: "It's a Draw!", className: 'text-yellow-400' },
}

export default function GameBoard({
  playerGesture,
  computerGesture,
  result,
  score,
  round,
  status,
  onEndGame,
}) {
  const showChoices = status === 'result' || status === 'playing'
  const showComputerChoice = status === 'result'

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-neutral-500 font-mono">
          Round {round}
        </div>
        <div className="flex items-center gap-6 text-sm">
          <span className="text-neutral-300">
            You: <strong className="text-primary-300">{score.player}</strong>
          </span>
          <span className="text-neutral-600">|</span>
          <span className="text-neutral-300">
            Computer: <strong className="text-accent-300">{score.computer}</strong>
          </span>
        </div>
        <button
          onClick={onEndGame}
          className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors px-2 py-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
        >
          End Game
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:gap-8">
        <div className="text-center">
          <div className="text-xs text-neutral-500 uppercase tracking-wider mb-2 font-mono">
            You
          </div>
          <div className="h-32 sm:h-40 flex items-center justify-center bg-neutral-900/60 border border-neutral-800/60 rounded-xl">
            {playerGesture ? (
              <motion.span
                key={playerGesture}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="text-5xl sm:text-6xl"
              >
                {GESTURE_EMOJI[playerGesture]}
              </motion.span>
            ) : (
              <span className="text-neutral-700 text-sm">Waiting...</span>
            )}
          </div>
          {playerGesture && (
            <p className="mt-2 text-sm text-neutral-400 font-mono capitalize">
              {playerGesture}
            </p>
          )}
        </div>

        <div className="text-center">
          <div className="text-xs text-neutral-500 uppercase tracking-wider mb-2 font-mono">
            Computer
          </div>
          <div className="h-32 sm:h-40 flex items-center justify-center bg-neutral-900/60 border border-neutral-800/60 rounded-xl">
            {showComputerChoice && computerGesture ? (
              <motion.span
                key={computerGesture}
                initial={{ rotateY: 180, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="text-5xl sm:text-6xl"
              >
                {GESTURE_EMOJI[computerGesture]}
              </motion.span>
            ) : (
              <span className="text-neutral-700 text-sm">
                {status === 'result' ? '...' : '?'}
              </span>
            )}
          </div>
          {showComputerChoice && computerGesture && (
            <p className="mt-2 text-sm text-neutral-400 font-mono capitalize">
              {computerGesture}
            </p>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {status === 'result' && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="mt-6 text-center"
          >
            <span
              className={`inline-block text-lg sm:text-xl font-semibold ${RESULT_MESSAGES[result].className}`}
            >
              {RESULT_MESSAGES[result].text}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {status === 'playing' && (
        <p className="mt-6 text-center text-xs text-neutral-600 font-mono">
          Show your gesture to play
        </p>
      )}
    </div>
  )
}
