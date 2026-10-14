import { useRef, useEffect } from 'react'

const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
]

export default function HandOverlay({ landmarks, width, height }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1

    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, width, height)

    if (!landmarks) return

    const toX = (x) => x * width
    const toY = (y) => y * height

    ctx.strokeStyle = 'rgba(41, 182, 246, 0.35)'
    ctx.lineWidth = 1.5

    for (const [i, j] of CONNECTIONS) {
      ctx.beginPath()
      ctx.moveTo(toX(landmarks[i].x), toY(landmarks[i].y))
      ctx.lineTo(toX(landmarks[j].x), toY(landmarks[j].y))
      ctx.stroke()
    }

    for (const lm of landmarks) {
      ctx.beginPath()
      ctx.arc(toX(lm.x), toY(lm.y), 2.5, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(41, 182, 246, 0.7)'
      ctx.fill()
    }
  }, [landmarks, width, height])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      aria-hidden="true"
    />
  )
}
