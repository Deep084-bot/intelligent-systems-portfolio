/**
 * BackgroundLayer - Ambient background with subtle depth cues
 *
 * Independent layer that provides visual foundation without interaction logic.
 */

export default function BackgroundLayer() {
  return (
    <svg
      viewBox="0 0 1200 800"
      className="w-full h-full absolute inset-0 pointer-events-none"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Ambient glow - centered */}
      <ellipse
        cx="600"
        cy="400"
        rx="450"
        ry="320"
        fill="rgba(212, 165, 116, 0.06)"
        style={{ filter: 'blur(80px)' }}
      />

      {/* Subtle depth gradient - darker at edges */}
      <radialGradient id="depth-gradient">
        <stop offset="0%" stopColor="rgba(0, 0, 0, 0)" />
        <stop offset="100%" stopColor="rgba(0, 0, 0, 0.3)" />
      </radialGradient>
      <rect
        width="1200"
        height="800"
        fill="url(#depth-gradient)"
      />
    </svg>
  )
}
