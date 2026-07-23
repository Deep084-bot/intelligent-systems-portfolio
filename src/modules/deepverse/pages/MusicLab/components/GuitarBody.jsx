export default function GuitarBody() {
  return (
    <svg viewBox="0 0 1200 800" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        {/* Wood Grain Pattern - Spruce Top */}
        <pattern id="spruceGrain" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
          <rect width="200" height="200" fill="#C49B6E" />
          <path
            d="M0,10 Q50,8 100,10 T200,10 M0,25 Q50,23 100,25 T200,25 M0,45 Q50,44 100,45 T200,45 M0,70 Q50,68 100,70 T200,70 M0,95 Q50,93 100,95 T200,95 M0,125 Q50,123 100,125 T200,125 M0,155 Q50,154 100,155 T200,155 M0,180 Q50,178 100,180 T200,180"
            stroke="#B88A5F"
            strokeWidth="0.5"
            opacity="0.15"
            fill="none"
          />
        </pattern>

        {/* Wood Grain Pattern - Rosewood */}
        <pattern id="rosewoodGrain" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
          <rect width="100" height="100" fill="#3D2817" />
          <path
            d="M0,15 Q25,12 50,15 T100,15 M0,35 Q25,32 50,35 T100,35 M0,58 Q25,55 50,58 T100,58 M0,78 Q25,75 50,78 T100,78 M0,92 Q25,90 50,92 T100,92"
            stroke="#2A1810"
            strokeWidth="0.8"
            opacity="0.3"
            fill="none"
          />
        </pattern>

        {/* Gradients - Body Top */}
        <linearGradient id="bodyTopGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E8D4B8" />
          <stop offset="35%" stopColor="#C49B6E" />
          <stop offset="75%" stopColor="#B88A5F" />
          <stop offset="100%" stopColor="#8B6842" />
        </linearGradient>

        {/* Gradients - Body Highlight */}
        <radialGradient id="bodyHighlight" cx="45%" cy="30%" r="50%">
          <stop offset="0%" stopColor="rgba(232, 212, 184, 0.4)" />
          <stop offset="50%" stopColor="rgba(232, 212, 184, 0.15)" />
          <stop offset="100%" stopColor="rgba(232, 212, 184, 0)" />
        </radialGradient>

        {/* Gradients - Neck */}
        <linearGradient id="neckGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8B6842" />
          <stop offset="50%" stopColor="#A0885C" />
          <stop offset="100%" stopColor="#8B6842" />
        </linearGradient>

        {/* Gradients - Fretboard */}
        <linearGradient id="fretboardGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#5A3E2B" />
          <stop offset="100%" stopColor="#3D2817" />
        </linearGradient>

        {/* Gradients - Sound Hole */}
        <radialGradient id="soundHoleGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1A1410" />
          <stop offset="70%" stopColor="#0D0A08" />
          <stop offset="100%" stopColor="#000000" />
        </radialGradient>

        {/* Gradients - Pickguard */}
        <linearGradient id="pickguardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(42, 32, 24, 0.6)" />
          <stop offset="100%" stopColor="rgba(26, 20, 16, 0.7)" />
        </linearGradient>

        {/* Shadow Filter */}
        <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="12" />
          <feOffset dx="0" dy="8" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.25" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Contact Shadow Filter */}
        <filter id="contactShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dx="0" dy="2" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.15" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Ambient Background Glow */}
      <ellipse
        cx="600"
        cy="400"
        rx="400"
        ry="300"
        fill="rgba(212, 165, 116, 0.08)"
        style={{ filter: 'blur(60px)' }}
      />

      {/* Guitar Body - Dreadnought Shape */}
      <g filter="url(#softShadow)">
        {/* Body Outline with Proper Curves */}
        <path
          d="M 420,240
             C 420,200 450,180 490,180
             L 710,180
             C 750,180 780,200 780,240
             C 780,280 770,320 770,360
             C 770,380 775,400 780,420
             C 785,450 785,480 780,510
             C 775,540 760,565 735,580
             C 710,595 680,600 650,600
             L 550,600
             C 520,600 490,595 465,580
             C 440,565 425,540 420,510
             C 415,480 415,450 420,420
             C 425,400 430,380 430,360
             C 430,320 420,280 420,240 Z"
          fill="url(#bodyTopGradient)"
          stroke="rgba(139, 104, 66, 0.3)"
          strokeWidth="1"
        />

        {/* Wood Grain Overlay */}
        <path
          d="M 420,240
             C 420,200 450,180 490,180
             L 710,180
             C 750,180 780,200 780,240
             C 780,280 770,320 770,360
             C 770,380 775,400 780,420
             C 785,450 785,480 780,510
             C 775,540 760,565 735,580
             C 710,595 680,600 650,600
             L 550,600
             C 520,600 490,595 465,580
             C 440,565 425,540 420,510
             C 415,480 415,450 420,420
             C 425,400 430,380 430,360
             C 430,320 420,280 420,240 Z"
          fill="url(#spruceGrain)"
          opacity="0.3"
        />

        {/* Highlight - Soft Gloss */}
        <path
          d="M 420,240
             C 420,200 450,180 490,180
             L 710,180
             C 750,180 780,200 780,240
             C 780,280 770,320 770,360
             C 770,380 775,400 780,420
             C 785,450 785,480 780,510
             C 775,540 760,565 735,580
             C 710,595 680,600 650,600
             L 550,600
             C 520,600 490,595 465,580
             C 440,565 425,540 420,510
             C 415,480 415,450 420,420
             C 425,400 430,380 430,360
             C 430,320 420,280 420,240 Z"
          fill="url(#bodyHighlight)"
        />

        {/* Body Binding - Cream Edge */}
        <path
          d="M 420,240
             C 420,200 450,180 490,180
             L 710,180
             C 750,180 780,200 780,240
             C 780,280 770,320 770,360
             C 770,380 775,400 780,420
             C 785,450 785,480 780,510
             C 775,540 760,565 735,580
             C 710,595 680,600 650,600
             L 550,600
             C 520,600 490,595 465,580
             C 440,565 425,540 420,510
             C 415,480 415,450 420,420
             C 425,400 430,380 430,360
             C 430,320 420,280 420,240 Z"
          fill="none"
          stroke="#E8DCC8"
          strokeWidth="2"
          opacity="0.6"
        />
      </g>

      {/* Sound Hole */}
      <g filter="url(#contactShadow)">
        <circle cx="600" cy="340" r="45" fill="url(#soundHoleGradient)" />

        {/* Rosette - Decorative Ring */}
        <circle
          cx="600"
          cy="340"
          r="52"
          fill="none"
          stroke="#B88A5F"
          strokeWidth="1.5"
          opacity="0.7"
        />
        <circle
          cx="600"
          cy="340"
          r="56"
          fill="none"
          stroke="#8B6842"
          strokeWidth="1"
          opacity="0.5"
        />
        <circle
          cx="600"
          cy="340"
          r="58"
          fill="none"
          stroke="#B88A5F"
          strokeWidth="0.5"
          opacity="0.4"
        />
      </g>

      {/* Pickguard */}
      <path
        d="M 640,290
           C 670,295 690,310 700,330
           C 705,345 705,360 700,375
           C 690,395 675,410 655,420
           C 640,427 625,425 615,415
           C 605,405 600,385 600,365
           C 600,340 610,310 630,295
           C 633,292 636,291 640,290 Z"
        fill="url(#pickguardGradient)"
        opacity="0.7"
        filter="url(#contactShadow)"
      />

      {/* Bridge */}
      <g filter="url(#contactShadow)">
        {/* Bridge Base */}
        <rect
          x="550"
          y="500"
          width="100"
          height="12"
          rx="2"
          fill="#3D2817"
        />

        {/* Saddle */}
        <rect
          x="552"
          y="497"
          width="96"
          height="4"
          rx="1"
          fill="#E8DCC8"
          opacity="0.9"
        />

        {/* Bridge Pins */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <circle
            key={i}
            cx={565 + i * 14}
            cy="506"
            r="2.5"
            fill="#2A1810"
            stroke="#8B6842"
            strokeWidth="0.5"
          />
        ))}
      </g>

      {/* Neck */}
      <rect
        x="340"
        y="280"
        width="80"
        height="240"
        rx="6"
        fill="url(#neckGradient)"
        filter="url(#contactShadow)"
      />

      {/* Nut */}
      <rect
        x="417"
        y="280"
        width="3"
        height="240"
        rx="0.5"
        fill="#E8DCC8"
        opacity="0.9"
      />

      {/* Fretboard */}
      <rect
        x="350"
        y="285"
        width="67"
        height="230"
        rx="4"
        fill="url(#fretboardGradient)"
      />

      {/* Rosewood Grain on Fretboard */}
      <rect
        x="350"
        y="285"
        width="67"
        height="230"
        rx="4"
        fill="url(#rosewoodGrain)"
        opacity="0.25"
      />

      {/* Frets - Logarithmic Spacing */}
      {[
        0, 22, 41, 58, 73, 87, 100, 112, 123, 133, 142, 151, 159, 166
      ].map((offset, i) => (
        <rect
          key={i}
          x="350"
          y={285 + offset}
          width="67"
          height="1.2"
          fill="#D4D2CE"
          opacity="0.6"
        />
      ))}

      {/* Fret Inlay Markers */}
      <circle cx="383" cy="341" r="3" fill="#C0BDB8" opacity="0.4" />
      <circle cx="383" cy="385" r="3" fill="#C0BDB8" opacity="0.4" />
      <circle cx="383" cy="420" r="3" fill="#C0BDB8" opacity="0.4" />
      <circle cx="383" cy="449" r="3" fill="#C0BDB8" opacity="0.4" />

      {/* Double dots at 12th fret */}
      <circle cx="375" cy="473" r="2.5" fill="#C0BDB8" opacity="0.4" />
      <circle cx="391" cy="473" r="2.5" fill="#C0BDB8" opacity="0.4" />

      {/* Tuning Pegs */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const y = 295 + i * 38
        return (
          <g key={i} filter="url(#contactShadow)">
            {/* Machine Head Back */}
            <circle cx="330" cy={y} r="9" fill="#3D2817" />

            {/* Machine Head Front */}
            <circle cx="330" cy={y} r="7" fill="#6B6560" />

            {/* Center Post */}
            <circle cx="330" cy={y} r="3" fill="#4A4540" />

            {/* Tuning Key */}
            <rect
              x="330"
              y={y - 1}
              width="14"
              height="2"
              rx="1"
              fill="#6B6560"
            />
          </g>
        )
      })}

      {/* Rim Light - Right Edge Highlight */}
      <path
        d="M 780,240
           C 780,280 770,320 770,360
           C 770,380 775,400 780,420
           C 785,450 785,480 780,510
           C 775,540 760,565 735,580"
        fill="none"
        stroke="rgba(232, 212, 184, 0.15)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}
