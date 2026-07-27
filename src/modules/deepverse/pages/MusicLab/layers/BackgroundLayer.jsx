/**
 * BackgroundLayer — warm dark ambient, subtle radial glow, vignette.
 * ViewBox: 1600 × 560
 */

export default function BackgroundLayer() {
  return (
    <svg
      viewBox="0 0 1600 560"
      className="w-full h-full absolute inset-0 pointer-events-none"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Base warm dark fill */}
        <linearGradient id="bg-base" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#100E0A" />
          <stop offset="100%" stopColor="#0A0806" />
        </linearGradient>

        {/* Warm amber instrument glow — centered slightly right */}
        <radialGradient id="bg-warm-glow" cx="55%" cy="52%" r="52%">
          <stop offset="0%"   stopColor="rgba(140,90,40,0.14)" />
          <stop offset="50%"  stopColor="rgba(120,75,30,0.07)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)"        />
        </radialGradient>

        {/* Vignette — darken edges */}
        <radialGradient id="bg-vignette" cx="50%" cy="50%" r="70%">
          <stop offset="0%"   stopColor="rgba(0,0,0,0)"    />
          <stop offset="75%"  stopColor="rgba(0,0,0,0.15)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.45)" />
        </radialGradient>

        {/* Very subtle top-left cool highlight (studio lighting) */}
        <radialGradient id="bg-cool-spec" cx="12%" cy="10%" r="35%">
          <stop offset="0%"   stopColor="rgba(180,200,220,0.04)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)"          />
        </radialGradient>
      </defs>

      {/* Base plate */}
      <rect width="1600" height="560" fill="url(#bg-base)" />

      {/* Warm instrument glow */}
      <rect width="1600" height="560" fill="url(#bg-warm-glow)" />

      {/* Studio cool spec */}
      <rect width="1600" height="560" fill="url(#bg-cool-spec)" />

      {/* Vignette — keep edges dark */}
      <rect width="1600" height="560" fill="url(#bg-vignette)" />
    </svg>
  )
}
