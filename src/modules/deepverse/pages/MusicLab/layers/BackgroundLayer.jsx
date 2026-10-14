/**
 * BackgroundLayer — warm dark stage, radial instrument glow, soft vignette.
 * ViewBox: 1600 × 560
 *
 * The instrument is dark wood on a dark background, so the scene needs a lit
 * "stage" behind it for the body, neck and fretboard to read against. Keep the
 * overall tone dark and warm — lift the base just enough to separate the guitar
 * from the void and add a halo where the instrument sits.
 */

export default function BackgroundLayer() {
  return (
    <svg
      viewBox="0 0 1600 560"
      className="w-full h-full absolute inset-0 pointer-events-none"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Base warm charcoal fill — lifted just off black so the dark woods
            (fretboard, headstock) don't disappear into the background. */}
        <linearGradient id="bg-base" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#241B12" />
          <stop offset="55%"  stopColor="#1A130D" />
          <stop offset="100%" stopColor="#100B07" />
        </linearGradient>

        {/* Warm amber instrument glow — centered on the guitar body */}
        <radialGradient id="bg-warm-glow" cx="62%" cy="52%" r="58%">
          <stop offset="0%"   stopColor="rgba(190,125,60,0.30)" />
          <stop offset="45%"  stopColor="rgba(150,95,42,0.16)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)"         />
        </radialGradient>

        {/* Stage light halo directly behind the body, keeps the silhouette
            readable without washing out the rest of the scene. */}
        <radialGradient id="bg-stage" cx="63%" cy="52%" r="34%">
          <stop offset="0%"   stopColor="rgba(230,180,110,0.20)" />
          <stop offset="70%"  stopColor="rgba(180,120,55,0.06)"  />
          <stop offset="100%" stopColor="rgba(0,0,0,0)"          />
        </radialGradient>

        {/* Vignette — keep edges dark, but softer than before so the neck and
            headstock on the left are not crushed to black. */}
        <radialGradient id="bg-vignette" cx="50%" cy="50%" r="75%">
          <stop offset="0%"   stopColor="rgba(0,0,0,0)"    />
          <stop offset="70%"  stopColor="rgba(0,0,0,0.10)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.34)" />
        </radialGradient>

        {/* Very subtle top-left cool highlight (studio lighting) */}
        <radialGradient id="bg-cool-spec" cx="12%" cy="10%" r="40%">
          <stop offset="0%"   stopColor="rgba(190,205,225,0.06)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)"          />
        </radialGradient>
      </defs>

      {/* Base plate */}
      <rect width="1600" height="560" fill="url(#bg-base)" />

      {/* Warm instrument glow */}
      <rect width="1600" height="560" fill="url(#bg-warm-glow)" />

      {/* Stage halo behind the body */}
      <rect width="1600" height="560" fill="url(#bg-stage)" />

      {/* Studio cool spec */}
      <rect width="1600" height="560" fill="url(#bg-cool-spec)" />

      {/* Vignette — keep edges dark */}
      <rect width="1600" height="560" fill="url(#bg-vignette)" />
    </svg>
  )
}
