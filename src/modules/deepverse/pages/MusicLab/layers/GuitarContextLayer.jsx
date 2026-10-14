/**
 * GuitarContextLayer - Full horizontal acoustic guitar, visual only.
 * ViewBox: 1600 × 560. All pointer-events: none.
 *
 * Layout zones:
 *  Headstock  x 0–140,   y 140–420
 *  Nut        x 140–148, y 160–400
 *  Neck       x 148–610, y 165–395  (tapers slightly)
 *  Body       x 590–1570, y 60–500  (dreadnought)
 *  Sound hole cx 920, cy 280, r 105
 *  Bridge     x 1055–1295, y 290–320
 *  Strings    x 148–1175, y 224–314 (6 strings, real spacing)
 */

const FRET_MARKER_POSITIONS = [3, 5, 7, 9, 15, 17]
const FRET_MARKER_DOUBLE = [12]

// Pythagorean fret positions: x = neckStart + neckLen * (1 - 1/2^(n/12))
function computeFretX(fretNum, neckStart = 148, neckLen = 462) {
  return neckStart + neckLen * (1 - 1 / Math.pow(2, fretNum / 12))
}

// String y positions (index 0 = low E / thickest, index 5 = high E / thinnest)
const STRING_YS = [224, 242, 260, 278, 296, 314]

export default function GuitarContextLayer() {
  const frets = Array.from({ length: 19 }, (_, i) => i + 1)
  const fretXs = frets.map(n => computeFretX(n))

  return (
    <svg
      viewBox="0 0 1600 560"
      className="w-full h-full absolute inset-0 pointer-events-none"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Wood body gradient — warm spruce top (lifted so the instrument
            reads clearly against the dark stage) */}
        <linearGradient id="gcl-body-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F2C88E" />
          <stop offset="30%" stopColor="#E0A46E" />
          <stop offset="65%" stopColor="#CC8E58" />
          <stop offset="100%" stopColor="#B07446" />
        </linearGradient>

        {/* Body highlight — soft top-left light source */}
        <radialGradient id="gcl-body-highlight" cx="24%" cy="16%" r="58%">
          <stop offset="0%" stopColor="rgba(255,235,190,0.34)" />
          <stop offset="55%" stopColor="rgba(255,205,145,0.12)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>

        {/* Top edge rim light — catches the upper contour so the silhouette
            separates from the background */}
        <linearGradient id="gcl-rim" x1="600" y1="150" x2="1200" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="rgba(255,240,210,0.10)" />
          <stop offset="45%"  stopColor="rgba(255,245,220,0.55)" />
          <stop offset="100%" stopColor="rgba(255,225,180,0.15)" />
        </linearGradient>

        {/* Neck gradient — rosewood-like (lifted for contrast on the dark stage) */}
        <linearGradient id="gcl-neck-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#76502F" />
          <stop offset="50%" stopColor="#5E3E26" />
          <stop offset="100%" stopColor="#472C1A" />
        </linearGradient>

        {/* Fretboard gradient */}
        <linearGradient id="gcl-fb-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#573A24" />
          <stop offset="100%" stopColor="#3E2815" />
        </linearGradient>

        {/* Headstock gradient */}
        <linearGradient id="gcl-head-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5E3E28" />
          <stop offset="100%" stopColor="#3A2412" />
        </linearGradient>

        {/* Sound hole depth */}
        <radialGradient id="gcl-hole-depth" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#1A120A" />
          <stop offset="60%" stopColor="#0D0806" />
          <stop offset="100%" stopColor="#000000" />
        </radialGradient>

        {/* Body shadow — underneath guitar */}
        <filter id="gcl-body-shadow" x="-8%" y="-8%" width="116%" height="130%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="14" />
          <feOffset dx="0" dy="18" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.45" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Neck shadow */}
        <filter id="gcl-neck-shadow" x="-5%" y="-10%" width="110%" height="130%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="8" />
          <feOffset dx="0" dy="10" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.35" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Subtle wood grain pattern */}
        <pattern id="gcl-grain" x="0" y="0" width="400" height="560" patternUnits="userSpaceOnUse">
          <rect width="400" height="560" fill="none" />
          {[8,22,38,55,72,91,112,134,158,183,210,239,270,303,338,375,414,455,498,543].map((y, i) => (
            <path
              key={i}
              d={`M590,${y} Q790,${y - 2} 990,${y + 1} T1570,${y}`}
              stroke={i % 3 === 0 ? 'rgba(90,50,20,0.12)' : 'rgba(70,38,15,0.07)'}
              strokeWidth={i % 5 === 0 ? 0.8 : 0.4}
              fill="none"
            />
          ))}
        </pattern>

        {/* Tuning peg chrome */}
        <radialGradient id="gcl-peg-chrome" cx="35%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#E8E4DC" />
          <stop offset="50%" stopColor="#C8C4BC" />
          <stop offset="100%" stopColor="#908C84" />
        </radialGradient>

        {/* Binding gradient */}
        <linearGradient id="gcl-binding" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(240,228,210,0.7)" />
          <stop offset="100%" stopColor="rgba(220,200,175,0.4)" />
        </linearGradient>

        {/* Fret metal */}
        <linearGradient id="gcl-fret-metal" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#D8D4CC" />
          <stop offset="50%" stopColor="#E8E4DC" />
          <stop offset="100%" stopColor="#C0BCBA" />
        </linearGradient>
      </defs>

      {/* ═══════════ GUITAR BODY ═══════════ */}
      <g filter="url(#gcl-body-shadow)">
        {/* Dreadnought body — proper acoustic shape */}
        {/* Lower bout wider (~420px), upper bout narrower (~340px), waist pinch */}
        <path
          d="
            M 610,165
            C 640,160 680,155 720,152
            C 780,148 840,150 880,155
            C 920,160 950,165 970,168
            C 1010,172 1060,168 1100,165
            C 1160,160 1230,158 1300,162
            C 1380,167 1460,178 1510,195
            C 1548,208 1568,228 1572,255
            C 1576,282 1570,312 1560,338
            C 1548,366 1528,386 1505,398
            C 1478,412 1448,418 1418,422
            C 1380,427 1340,428 1300,428
            C 1260,428 1220,426 1185,420
            C 1148,414 1115,402 1090,388
            C 1068,376 1052,360 1040,342
            C 1024,320 1016,296 1016,272
            C 1016,248 1022,226 1030,208
            C 1040,186 1055,172 1072,168
            C 1052,165 1030,168 1008,172
            C 972,178 935,188 900,190
            C 864,192 826,188 794,182
            C 762,176 732,168 710,168
            C 680,168 650,170 620,172
            C 606,173 598,170 610,165 Z
          "
          fill="url(#gcl-body-grad)"
          stroke="none"
        />

        {/* Wood grain overlay */}
        <path
          d="
            M 610,165
            C 640,160 680,155 720,152
            C 780,148 840,150 880,155
            C 920,160 950,165 970,168
            C 1010,172 1060,168 1100,165
            C 1160,160 1230,158 1300,162
            C 1380,167 1460,178 1510,195
            C 1548,208 1568,228 1572,255
            C 1576,282 1570,312 1560,338
            C 1548,366 1528,386 1505,398
            C 1478,412 1448,418 1418,422
            C 1380,427 1340,428 1300,428
            C 1260,428 1220,426 1185,420
            C 1148,414 1115,402 1090,388
            C 1068,376 1052,360 1040,342
            C 1024,320 1016,296 1016,272
            C 1016,248 1022,226 1030,208
            C 1040,186 1055,172 1072,168
            C 1052,165 1030,168 1008,172
            C 972,178 935,188 900,190
            C 864,192 826,188 794,182
            C 762,176 732,168 710,168
            C 680,168 650,170 620,172
            C 606,173 598,170 610,165 Z
          "
          fill="url(#gcl-grain)"
          opacity="0.6"
        />

        {/* Top light bloom */}
        <path
          d="
            M 610,165
            C 640,160 680,155 720,152
            C 780,148 840,150 880,155
            C 920,160 950,165 970,168
            C 1010,172 1060,168 1100,165
            C 1160,160 1230,158 1300,162
            C 1380,167 1460,178 1510,195
            C 1548,208 1568,228 1572,255
            C 1576,282 1570,312 1560,338
            C 1548,366 1528,386 1505,398
            C 1478,412 1448,418 1418,422
            C 1380,427 1340,428 1300,428
            C 1260,428 1220,426 1185,420
            C 1148,414 1115,402 1090,388
            C 1068,376 1052,360 1040,342
            C 1024,320 1016,296 1016,272
            C 1016,248 1022,226 1030,208
            C 1040,186 1055,172 1072,168
            C 1052,165 1030,168 1008,172
            C 972,178 935,188 900,190
            C 864,192 826,188 794,182
            C 762,176 732,168 710,168
            C 680,168 650,170 620,172
            C 606,173 598,170 610,165 Z
          "
          fill="url(#gcl-body-highlight)"
        />

        {/* Cream binding */}
        <path
          d="
            M 610,165
            C 640,160 680,155 720,152
            C 780,148 840,150 880,155
            C 920,160 950,165 970,168
            C 1010,172 1060,168 1100,165
            C 1160,160 1230,158 1300,162
            C 1380,167 1460,178 1510,195
            C 1548,208 1568,228 1572,255
            C 1576,282 1570,312 1560,338
            C 1548,366 1528,386 1505,398
            C 1478,412 1448,418 1418,422
            C 1380,427 1340,428 1300,428
            C 1260,428 1220,426 1185,420
            C 1148,414 1115,402 1090,388
            C 1068,376 1052,360 1040,342
            C 1024,320 1016,296 1016,272
            C 1016,248 1022,226 1030,208
            C 1040,186 1055,172 1072,168
            C 1052,165 1030,168 1008,172
            C 972,178 935,188 900,190
            C 864,192 826,188 794,182
            C 762,176 732,168 710,168
            C 680,168 650,170 620,172
            C 606,173 598,170 610,165 Z
          "
          fill="none"
          stroke="rgba(248,236,214,0.72)"
          strokeWidth="2"
        />

        {/* Inner binding shadow line */}
        <path
          d="
            M 614,169
            C 642,164 680,159 720,156
            C 780,152 840,154 880,159
            C 920,164 950,169 970,172
            C 1010,176 1060,172 1100,169
            C 1160,164 1230,162 1300,166
            C 1380,171 1460,182 1508,198
            C 1544,210 1563,229 1567,255
            C 1571,282 1565,310 1556,336
            C 1544,364 1525,382 1502,394
            C 1476,408 1446,414 1416,418
            C 1379,423 1339,424 1299,424
            C 1259,424 1219,422 1184,416
            C 1148,410 1116,398 1092,385
            C 1070,374 1055,358 1044,340
            C 1028,318 1020,294 1020,270
            C 1020,246 1026,225 1034,208
            C 1044,186 1058,173 1074,170
          "
          fill="none"
          stroke="rgba(160,120,80,0.15)"
          strokeWidth="1"
        />

        {/* Top edge rim light — separates the instrument from the dark stage */}
        <path
          d="M 610,165
             C 640,160 680,155 720,152
             C 780,148 840,150 880,155
             C 920,160 950,165 970,168
             C 1010,172 1060,168 1100,165
             C 1160,160 1230,158 1300,162
             C 1380,167 1460,178 1510,195"
          fill="none"
          stroke="url(#gcl-rim)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </g>

      {/* ═══════════ NECK ═══════════ */}
      <g filter="url(#gcl-neck-shadow)">
        {/* Neck base (maple-like) — slight trapezoid */}
        <path
          d="M 148,170 L 610,170 L 610,390 L 148,390 Z"
          fill="#8E6740"
          opacity="0.95"
        />

        {/* Fretboard (rosewood) — on top of neck */}
        <path
          d="M 148,184 L 610,178 L 610,382 L 148,376 Z"
          fill="url(#gcl-fb-grad)"
        />

        {/* Fretboard edge highlight */}
        <path
          d="M 148,184 L 610,178"
          stroke="rgba(180,130,80,0.3)"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M 148,376 L 610,382"
          stroke="rgba(30,15,5,0.4)"
          strokeWidth="1.5"
          fill="none"
        />

        {/* Frets */}
        {fretXs.map((x, i) => (
          <g key={i}>
            {/* Fret wire */}
            <line
              x1={x}
              y1={180}
              x2={x}
              y2={380}
              stroke="url(#gcl-fret-metal)"
              strokeWidth={i === 0 ? 2.5 : i < 5 ? 1.8 : 1.4}
              opacity={0.85}
            />
            {/* Fret edge highlight */}
            <line
              x1={x + 0.5}
              y1={180}
              x2={x + 0.5}
              y2={380}
              stroke="rgba(255,250,240,0.25)"
              strokeWidth="0.5"
            />
          </g>
        ))}

        {/* Fret markers (inlays) */}
        {FRET_MARKER_POSITIONS.map(pos => {
          const x1 = pos === 1 ? 148 : fretXs[pos - 2]
          const x2 = fretXs[pos - 1]
          const cx = (x1 + x2) / 2
          return (
            <circle
              key={pos}
              cx={cx}
              cy={280}
              r={6}
              fill="rgba(235,220,195,0.55)"
              stroke="rgba(200,175,140,0.3)"
              strokeWidth="0.5"
            />
          )
        })}
        {/* 12th fret double-dot */}
        {FRET_MARKER_DOUBLE.map(pos => {
          const x1 = fretXs[pos - 2]
          const x2 = fretXs[pos - 1]
          const cx = (x1 + x2) / 2
          return (
            <g key={`d${pos}`}>
              <circle cx={cx} cy={245} r={6} fill="rgba(235,220,195,0.55)" stroke="rgba(200,175,140,0.3)" strokeWidth="0.5" />
              <circle cx={cx} cy={315} r={6} fill="rgba(235,220,195,0.55)" stroke="rgba(200,175,140,0.3)" strokeWidth="0.5" />
            </g>
          )
        })}

        {/* Side dots (small, on neck edge) */}
        {[...FRET_MARKER_POSITIONS, ...FRET_MARKER_DOUBLE].map(pos => {
          const x1 = pos === 1 ? 148 : fretXs[pos - 2]
          const x2 = fretXs[pos - 1]
          const cx = (x1 + x2) / 2
          return (
            <circle key={`side${pos}`} cx={cx} cy={178} r={3} fill="rgba(200,180,148,0.4)" />
          )
        })}
      </g>

      {/* ═══════════ HEADSTOCK ═══════════ */}
      <g filter="url(#gcl-neck-shadow)">
        {/* Headstock shape — classic Fender-style 3+3 */}
        <path
          d="
            M 148,175
            L 148,385
            L 60,385
            C 40,385 20,370 12,350
            L 8,310
            C 5,295 8,278 16,265
            L 20,255
            C 10,245 5,228 8,210
            L 12,185
            C 16,165 28,155 45,152
            L 148,152
            Z
          "
          fill="url(#gcl-head-grad)"
        />

        {/* Headstock face plate (slightly lighter) */}
        <path
          d="
            M 148,175
            L 148,385
            L 62,385
            C 42,385 24,371 16,352
            L 12,312
            C 9,297 12,280 20,267
            L 24,257
            C 14,247 9,230 12,212
            L 16,187
            C 20,167 32,157 48,154
            L 148,154
            Z
          "
          fill="rgba(80,52,28,0.5)"
        />

        {/* Headstock logo area */}
        <rect x="30" y="250" width="90" height="60" rx="4" fill="rgba(255,220,150,0.04)" />

        {/* Tuning peg posts — top 3 (strings 4,5,6 = D,A,E2) */}
        {[210, 260, 310].map((y, i) => (
          <g key={`top${i}`}>
            {/* Peg slot in headstock */}
            <rect x="3" y={y - 12} width="20" height="24" rx="3" fill="rgba(20,12,5,0.6)" />
            {/* Peg shaft */}
            <rect x="22" y={y - 4} width="28" height="8" rx="2" fill="url(#gcl-peg-chrome)" />
            {/* Tuning button */}
            <ellipse cx="52" cy={y} rx="9" ry="12" fill="url(#gcl-peg-chrome)" stroke="rgba(100,90,80,0.5)" strokeWidth="0.8" />
            {/* String post hole */}
            <circle cx="8" cy={y} r="3" fill="rgba(5,3,1,0.8)" />
          </g>
        ))}

        {/* Tuning peg posts — bottom 3 (strings 1,2,3 = E4,B3,G3) */}
        {[220, 270, 320].map((y, i) => (
          <g key={`bot${i}`}>
            {/* Peg slot */}
            <rect x="3" y={y - 12} width="20" height="24" rx="3" fill="rgba(20,12,5,0.6)" />
            {/* Peg shaft */}
            <rect x="22" y={y - 4} width="28" height="8" rx="2" fill="url(#gcl-peg-chrome)" />
            {/* Tuning button */}
            <ellipse cx="52" cy={y} rx="9" ry="12" fill="url(#gcl-peg-chrome)" stroke="rgba(100,90,80,0.5)" strokeWidth="0.8" />
            {/* String post hole */}
            <circle cx="8" cy={y} r="3" fill="rgba(5,3,1,0.8)" />
          </g>
        ))}
      </g>

      {/* ═══════════ NUT ═══════════ */}
      <rect
        x="146"
        y="182"
        width="4"
        height="196"
        rx="1"
        fill="#EDE0C8"
        opacity="0.9"
      />
      {/* Nut edge highlight */}
      <rect
        x="146"
        y="182"
        width="1.5"
        height="196"
        rx="0.5"
        fill="rgba(255,245,230,0.6)"
      />

      {/* ═══════════ NECK-BODY JOIN ═══════════ */}
      <path
        d="M 600,170 L 625,165 L 625,395 L 600,390 Z"
        fill="rgba(60,35,15,0.4)"
      />

      {/* ═══════════ SOUND HOLE ═══════════ */}
      {/* Drop shadow behind hole */}
      <circle cx="920" cy="282" r="108" fill="rgba(0,0,0,0.25)" />

      {/* Hole depth */}
      <circle cx="920" cy="280" r="105" fill="url(#gcl-hole-depth)" />

      {/* Rosette rings — alternating warm/ivory */}
      {[
        { r: 106, stroke: 'rgba(180,140,80,0.7)', w: 1.5 },
        { r: 109, stroke: 'rgba(240,220,180,0.4)', w: 1 },
        { r: 112, stroke: 'rgba(160,120,65,0.6)', w: 1.5 },
        { r: 115, stroke: 'rgba(220,195,155,0.35)', w: 0.8 },
        { r: 118, stroke: 'rgba(180,140,80,0.5)', w: 1.2 },
        { r: 121, stroke: 'rgba(200,170,120,0.3)', w: 0.8 },
        { r: 124, stroke: 'rgba(160,120,70,0.4)', w: 1 },
        { r: 127, stroke: 'rgba(240,215,170,0.25)', w: 0.6 },
      ].map(({ r, stroke, w }, i) => (
        <circle key={i} cx="920" cy="280" r={r} fill="none" stroke={stroke} strokeWidth={w} />
      ))}

      {/* Rosette decorative dots (inner ring of 24 dots) */}
      {Array.from({ length: 24 }, (_, i) => {
        const angle = (i / 24) * Math.PI * 2
        const r = 108
        return (
          <circle
            key={`rd${i}`}
            cx={920 + r * Math.cos(angle)}
            cy={280 + r * Math.sin(angle)}
            r={1.8}
            fill={i % 2 === 0 ? 'rgba(200,160,90,0.6)' : 'rgba(240,220,180,0.4)'}
          />
        )
      })}

      {/* ═══════════ PICKGUARD (optional small one below sound hole) ═══════════ */}
      <path
        d="M 940,330 C 955,328 980,330 995,340 L 1000,380 C 1000,390 990,395 980,393 L 945,388 C 930,385 922,375 922,362 Z"
        fill="rgba(20,14,8,0.35)"
        stroke="rgba(80,60,30,0.2)"
        strokeWidth="0.8"
      />

      {/* ═══════════ BRIDGE ═══════════
          In this horizontal front view the six strings run parallel across the
          body at STRING_YS, so the bridge is a plate that SPANS that band with
          one pin per string — not a flat bar pinned at a single point. */}
      <g>
        {/* Bridge plate — dark rosewood, spanning the string band */}
        <rect
          x="1140"
          y="210"
          width="78"
          height="120"
          rx="5"
          fill="#2C1A0C"
          stroke="rgba(80,50,20,0.4)"
          strokeWidth="1"
        />
        {/* Plate top bevel */}
        <rect x="1140" y="210" width="78" height="5" rx="2.5" fill="rgba(60,35,12,0.55)" />
        {/* Saddle — bone strip along the neck-side edge of the plate */}
        <rect
          x="1143"
          y="214"
          width="9"
          height="112"
          rx="3"
          fill="#EDE0C8"
          stroke="rgba(180,160,130,0.5)"
          strokeWidth="0.5"
        />
        {/* Saddle highlight */}
        <rect x="1143" y="214" width="3" height="112" rx="1.5" fill="rgba(255,248,235,0.6)" />

        {/* Bridge pins — one per string, spread along the plate and aligned to
            each string's y (STRING_YS) as it terminates at the bridge */}
        {STRING_YS.map((sy, i) => (
          <g key={i}>
            {/* Pin body */}
            <ellipse cx={1184} cy={sy} rx={4.6} ry={5} fill="#1A0E06" stroke="rgba(100,70,35,0.5)" strokeWidth="0.8" />
            {/* Pin dot */}
            <circle cx={1184} cy={sy - 1} r={1.7} fill="rgba(240,225,200,0.7)" />
          </g>
        ))}
      </g>

      {/* ═══════════ STRAP PIN (end of body) ═══════════ */}
      <circle cx="1568" cy="292" r="8" fill="rgba(160,140,120,0.7)" stroke="rgba(200,180,150,0.4)" strokeWidth="1" />
      <circle cx="1568" cy="292" r="4" fill="rgba(100,85,70,0.8)" />

      {/* ═══════════ NECK STRAP PIN ═══════════ */}
      <circle cx="148" cy="180" r="5" fill="rgba(140,120,100,0.6)" stroke="rgba(180,160,130,0.3)" strokeWidth="0.8" />

      {/* ═══════════ STRING GUIDES ON HEADSTOCK ═══════════ */}
      {/* Subtle lines showing strings going to tuning pegs */}
      {STRING_YS.map((sy, i) => (
        <line
          key={`guide${i}`}
          x1={148}
          y1={sy}
          x2={10}
          y2={i < 3 ? [310, 260, 210][i] : [320, 270, 220][i - 3]}
          stroke="rgba(180,160,120,0.08)"
          strokeWidth="0.5"
        />
      ))}
    </svg>
  )
}
