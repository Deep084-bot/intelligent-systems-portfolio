/**
 * GuitarContextLayer - Simplified guitar body as visual context
 *
 * Independent visual layer showing recognizable guitar elements:
 * - Short fretboard segment (20-25% of neck)
 * - Cropped body (upper bout, sound hole, bridge)
 * - Subtle premium details (20% opacity)
 *
 * No interaction logic - purely visual foundation.
 */

export default function GuitarContextLayer() {
  return (
    <svg
      viewBox="0 0 1200 800"
      className="w-full h-full absolute inset-0 pointer-events-none"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Subtle wood grain - 20% opacity */}
        <pattern id="subtle-grain" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
          <rect width="200" height="200" fill="#C49B6E" />
          <path
            d="M0,10 Q50,8 100,10 T200,10 M0,25 Q50,23 100,25 T200,25 M0,45 Q50,44 100,45 T200,45 M0,70 Q50,68 100,70 T200,70 M0,95 Q50,93 100,95 T200,95"
            stroke="#B88A5F"
            strokeWidth="0.5"
            opacity="0.15"
            fill="none"
          />
        </pattern>

        {/* Body gradient - subtle */}
        <linearGradient id="body-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#D4A574" />
          <stop offset="50%" stopColor="#C49B6E" />
          <stop offset="100%" stopColor="#A0885C" />
        </linearGradient>

        {/* Fretboard gradient */}
        <linearGradient id="fretboard-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4A3E2B" />
          <stop offset="100%" stopColor="#3D2817" />
        </linearGradient>

        {/* Sound hole depth */}
        <radialGradient id="soundhole-depth" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1A1410" />
          <stop offset="70%" stopColor="#0D0A08" />
          <stop offset="100%" stopColor="#000000" />
        </radialGradient>

        {/* Soft shadow filter */}
        <filter id="soft-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="8" />
          <feOffset dx="0" dy="4" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.2" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* FRETBOARD SEGMENT - Short, recognizable */}
      <g filter="url(#soft-shadow)">
        {/* Neck base */}
        <rect
          x="80"
          y="250"
          width="80"
          height="200"
          rx="4"
          fill="#8B6842"
          opacity="0.9"
        />

        {/* Fretboard */}
        <rect
          x="85"
          y="255"
          width="70"
          height="190"
          rx="3"
          fill="url(#fretboard-gradient)"
        />

        {/* Nut (where strings start) */}
        <rect
          x="158"
          y="255"
          width="2"
          height="190"
          fill="#E8DCC8"
          opacity="0.8"
        />

        {/* Frets - minimal, evenly spaced */}
        {[0, 40, 75, 105, 130, 150, 165].map((offset, i) => (
          <rect
            key={i}
            x="85"
            y={255 + offset}
            width="70"
            height="1"
            fill="#D4D2CE"
            opacity="0.4"
          />
        ))}
      </g>

      {/* GUITAR BODY - Cropped, context only */}
      <g filter="url(#soft-shadow)">
        {/* Body outline - simplified dreadnought shape */}
        <path
          d="M 160,450
             C 160,420 180,400 210,400
             L 390,400
             C 420,400 440,420 440,450
             C 440,480 435,510 440,540
             C 445,570 445,600 440,630
             C 435,660 420,685 395,700
             C 370,715 340,720 310,720
             L 260,720
             C 230,720 200,715 175,700
             C 150,685 135,660 130,630
             C 125,600 125,570 130,540
             C 135,510 140,480 140,450
             C 140,435 150,425 160,450 Z"
          fill="url(#body-gradient)"
          stroke="rgba(139, 104, 66, 0.2)"
          strokeWidth="1"
        />

        {/* Wood grain overlay - subtle */}
        <path
          d="M 160,450
             C 160,420 180,400 210,400
             L 390,400
             C 420,400 440,420 440,450
             C 440,480 435,510 440,540
             C 445,570 445,600 440,630
             C 435,660 420,685 395,700
             C 370,715 340,720 310,720
             L 260,720
             C 230,720 200,715 175,700
             C 150,685 135,660 130,630
             C 125,600 125,570 130,540
             C 135,510 140,480 140,450
             C 140,435 150,425 160,450 Z"
          fill="url(#subtle-grain)"
          opacity="0.2"
        />

        {/* Binding - cream edge, subtle */}
        <path
          d="M 160,450
             C 160,420 180,400 210,400
             L 390,400
             C 420,400 440,420 440,450
             C 440,480 435,510 440,540
             C 445,570 445,600 440,630
             C 435,660 420,685 395,700
             C 370,715 340,720 310,720
             L 260,720
             C 230,720 200,715 175,700
             C 150,685 135,660 130,630
             C 125,600 125,570 130,540
             C 135,510 140,480 140,450
             C 140,435 150,425 160,450 Z"
          fill="none"
          stroke="#E8DCC8"
          strokeWidth="1.5"
          opacity="0.3"
        />
      </g>

      {/* SOUND HOLE - Recognizable detail */}
      <g filter="url(#soft-shadow)">
        <circle cx="300" cy="540" r="35" fill="url(#soundhole-depth)" />

        {/* Rosette ring - single, subtle */}
        <circle
          cx="300"
          cy="540"
          r="40"
          fill="none"
          stroke="#B88A5F"
          strokeWidth="1"
          opacity="0.4"
        />
      </g>

      {/* BRIDGE - Grounds the strings */}
      <g filter="url(#soft-shadow)">
        {/* Bridge base */}
        <rect
          x="250"
          y="655"
          width="100"
          height="10"
          rx="2"
          fill="#3D2817"
          opacity="0.9"
        />

        {/* Saddle */}
        <rect
          x="252"
          y="653"
          width="96"
          height="3"
          rx="1"
          fill="#E8DCC8"
          opacity="0.7"
        />
      </g>
    </svg>
  )
}
