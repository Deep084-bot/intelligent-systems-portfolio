import { useState, useRef, useEffect, useReducer, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PermissionGate from '../components/vision-arena/PermissionGate'
import WebcamFeed from '../components/vision-arena/WebcamFeed'
import HandOverlay from '../components/vision-arena/HandOverlay'
import GameBoard from '../components/vision-arena/GameBoard'
import { createHandLandmarker, detectHand } from '../services/visionArenaHands'
import { classifyGesture } from '../utils/gestureClassifier'

const MAX_ROUNDS = 5
const STABILITY_FRAMES = 25
const RESULT_DELAY_MS = 2000

const gestures = ['rock', 'paper', 'scissors']

function randomGesture() {
  return gestures[Math.floor(Math.random() * gestures.length)]
}

function getWinner(player, computer) {
  if (player === computer) return 'draw'
  if (
    (player === 'rock' && computer === 'scissors') ||
    (player === 'paper' && computer === 'rock') ||
    (player === 'scissors' && computer === 'paper')
  ) {
    return 'win'
  }
  return 'lose'
}

const initialGame = {
  phase: 'permission',
  playerGesture: null,
  computerGesture: null,
  score: { player: 0, computer: 0 },
  round: 0,
  result: null,
}

function gameReducer(state, action) {
  switch (action.type) {
    case 'CAMERA_GRANTED':
      return { ...state, phase: 'loading' }
    case 'MODEL_READY':
      return { ...state, phase: 'countdown' }
    case 'COUNTDOWN_DONE':
      return { ...state, phase: 'playing' }
    case 'ROUND_RESULT':
      return {
        ...state,
        phase: 'result',
        playerGesture: action.player,
        computerGesture: action.computer,
        result: action.result,
        score: action.score,
        round: state.round + 1,
      }
    case 'NEXT_ROUND':
      return {
        ...state,
        phase: state.round >= MAX_ROUNDS ? 'badge' : 'playing',
        playerGesture: null,
        computerGesture: null,
        result: null,
      }
    case 'SHOW_BADGE':
      return { ...state, phase: 'badge' }
    case 'RESET':
      return { ...initialGame }
    default:
      return state
  }
}

export default function VisionArena({ navigate }) {
  const [state, dispatch] = useReducer(gameReducer, initialGame)
  const [stream, setStream] = useState(null)
  const [landmarks, setLandmarks] = useState(null)
  const [videoReady, setVideoReady] = useState(false)

  const videoRef = useRef(null)
  const handLandmarkerRef = useRef(null)
  const animFrameRef = useRef(null)
  const stableCountRef = useRef(0)
  const stableGestureRef = useRef(null)
  const phaseRef = useRef(state.phase)
  const frameTimeRef = useRef(0)
  const scoreRef = useRef({ player: 0, computer: 0 })

  useEffect(() => { phaseRef.current = state.phase }, [state.phase])

  const handleCameraAllowed = useCallback((mediaStream) => {
    setStream(mediaStream)
    dispatch({ type: 'CAMERA_GRANTED' })
  }, [])

  const handleVideoReady = useCallback((video) => {
    videoRef.current = video
    setVideoReady(true)
  }, [])

  useEffect(() => {
    if (state.phase !== 'loading') return
    let cancelled = false
    ;(async () => {
      try {
        const hlm = await createHandLandmarker()
        if (!cancelled) {
          handLandmarkerRef.current = hlm
          dispatch({ type: 'MODEL_READY' })
        }
      } catch (err) {
        console.error('MediaPipe init failed:', err)
      }
    })()
    return () => { cancelled = true }
  }, [state.phase])

  useEffect(() => {
    if (state.phase !== 'playing' || !videoReady) return
    const video = videoRef.current
    const handLandmarker = handLandmarkerRef.current
    if (!video || !handLandmarker) return

    function detectLoop() {
      if (phaseRef.current !== 'playing') {
        animFrameRef.current = requestAnimationFrame(detectLoop)
        return
      }
      if (!video.videoWidth) {
        animFrameRef.current = requestAnimationFrame(detectLoop)
        return
      }

      const time = performance.now()
      if (time - frameTimeRef.current < 33) {
        animFrameRef.current = requestAnimationFrame(detectLoop)
        return
      }
      frameTimeRef.current = time

      const lm = detectHand(handLandmarker, video, time)
      setLandmarks(lm)

      if (lm) {
        const gesture = classifyGesture(lm)
        if (gesture !== 'none') {
          if (gesture === stableGestureRef.current) {
            stableCountRef.current++
            if (stableCountRef.current >= STABILITY_FRAMES) {
              stableCountRef.current = 0
              stableGestureRef.current = null
              const computer = randomGesture()
              const result = getWinner(gesture, computer)
              const s = scoreRef.current
              const newScore = {
                player: s.player + (result === 'win' ? 1 : 0),
                computer: s.computer + (result === 'lose' ? 1 : 0),
              }
              scoreRef.current = newScore
              dispatch({
                type: 'ROUND_RESULT',
                player: gesture,
                computer,
                result,
                score: newScore,
              })
              return
            }
          } else {
            stableGestureRef.current = gesture
            stableCountRef.current = 1
          }
        } else {
          stableGestureRef.current = null
          stableCountRef.current = 0
        }
      }

      animFrameRef.current = requestAnimationFrame(detectLoop)
    }

    animFrameRef.current = requestAnimationFrame(detectLoop)

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [state.phase, videoReady])

  useEffect(() => {
    if (state.phase !== 'result') return
    const timer = setTimeout(() => {
      dispatch({ type: 'NEXT_ROUND' })
    }, RESULT_DELAY_MS)
    return () => clearTimeout(timer)
  }, [state.phase])

  const handleEndGame = useCallback(() => {
    dispatch({ type: 'SHOW_BADGE' })
  }, [])

  const handleBack = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop())
    navigate('/deepverse')
  }, [stream, navigate])

  const handlePlayAgain = useCallback(() => {
    scoreRef.current = { player: 0, computer: 0 }
    setLandmarks(null)
    setStream(null)
    setVideoReady(false)
    stableCountRef.current = 0
    stableGestureRef.current = null
    frameTimeRef.current = 0
    if (handLandmarkerRef.current) {
      handLandmarkerRef.current.close()
      handLandmarkerRef.current = null
    }
    dispatch({ type: 'RESET' })
  }, [])

  if (state.phase === 'permission') {
    return <PermissionGate onAllow={handleCameraAllowed} onBack={handleBack} />
  }

  if (state.phase === 'badge') {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-lg w-full text-center"
        >
          <div className="text-4xl mb-4">👁</div>
          <h2 className="text-2xl font-bold text-neutral-50 mb-2">Vision Arena</h2>
          <p className="text-neutral-500 text-sm mb-6 font-mono">
            {state.round} rounds played
          </p>

          <div className="flex items-center justify-center gap-8 mb-8">
            <div>
              <div className="text-2xl font-bold text-primary-300">{state.score.player}</div>
              <div className="text-xs text-neutral-500 mt-1">You</div>
            </div>
            <div className="text-neutral-600 text-xl font-mono">:</div>
            <div>
              <div className="text-2xl font-bold text-accent-300">{state.score.computer}</div>
              <div className="text-xs text-neutral-500 mt-1">Computer</div>
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 mb-8 text-left">
            <h3 className="text-xs text-neutral-500 uppercase tracking-wider font-mono mb-4">
              Built With
            </h3>
            <div className="space-y-2">
              {[
                'MediaPipe Tasks Vision',
                'React',
                'Canvas API',
                'Browser Webcam API',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-neutral-300">
                  <span className="text-primary-400/60">◆</span>
                  {item}
                </div>
              ))}
            </div>

            <h3 className="text-xs text-neutral-500 uppercase tracking-wider font-mono mt-6 mb-3">
              Engineering Challenges
            </h3>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li className="flex gap-2">
                <span className="text-neutral-600 shrink-0">•</span>
                Real-time hand landmark detection at 30fps using MediaPipe Tasks
              </li>
              <li className="flex gap-2">
                <span className="text-neutral-600 shrink-0">•</span>
                Gesture stabilization buffer preventing flickering between frames
              </li>
              <li className="flex gap-2">
                <span className="text-neutral-600 shrink-0">•</span>
                Orientation-invariant finger curl detection using relative joint distances
              </li>
            </ul>
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handlePlayAgain}
              className="px-6 py-3 rounded-lg text-sm font-medium border border-primary-500/40 text-primary-300 hover:bg-primary-500/10 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
            >
              Play Again
            </button>
            <button
              onClick={handleBack}
              className="px-6 py-3 rounded-lg text-sm font-medium border border-neutral-700 text-neutral-300 hover:bg-neutral-800 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
            >
              Exit to Hub
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  const isLoading = state.phase === 'loading'
  const isCountdown = state.phase === 'countdown'
  const isPlaying = state.phase === 'playing'
  const isResult = state.phase === 'result'

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <button
          onClick={handleBack}
          className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 rounded px-2 py-1"
        >
          ← Back to Hub
        </button>
        <span className="text-sm text-neutral-500 font-mono tracking-wider uppercase">
          Vision Arena
        </span>
        <div className="w-20" />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pb-8">
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-8 h-8 rounded-full border-2 border-neutral-700 border-t-primary-500 animate-spin" />
              <p className="text-sm text-neutral-500 font-mono">Loading hand model...</p>
            </motion.div>
          )}

          {isCountdown && (
            <CountDown
              key="countdown"
              onDone={() => dispatch({ type: 'COUNTDOWN_DONE' })}
            />
          )}

          {(isPlaying || isResult) && (
            <motion.div
              key="game"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-5xl"
            >
              <div className="relative aspect-video max-w-md mx-auto mb-6 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800/60">
                <WebcamFeed stream={stream} onVideoReady={handleVideoReady} />
                <HandOverlay
                  landmarks={landmarks}
                  width={640}
                  height={480}
                />
              </div>

              <GameBoard
                playerGesture={state.playerGesture}
                computerGesture={state.computerGesture}
                result={state.result}
                score={state.score}
                round={state.round}
                status={state.phase}
                onEndGame={handleEndGame}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

function CountDown({ onDone }) {
  const [step, setStep] = useState(3)

  useEffect(() => {
    if (step === 0) {
      const t = setTimeout(onDone, 400)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setStep((s) => s - 1), 700)
    return () => clearTimeout(t)
  }, [step, onDone])

  const label = step === 0 ? 'GO!' : String(step)

  return (
    <motion.div
      key={step}
      initial={{ scale: 2, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.5, opacity: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="text-6xl sm:text-8xl font-bold text-primary-300 select-none"
    >
      {label}
    </motion.div>
  )
}
