export const COLORS = {
  bg: '#0a0a0a',
  bgDeep: '#050505',
  star: 'rgba(210, 220, 255, %a)',
  earthGlow: 'rgba(41, 182, 246, %a)',
  sunGlow: 'rgba(255, 200, 100, %a)',
  moonGray: 'rgba(200, 200, 210, %a)',
  orbitLine: 'rgba(255, 255, 255, %a)',
  textPrimary: 'rgba(255, 255, 255, 0.85)',
  textSubtle: 'rgba(255, 255, 255, 0.3)',
  accent: 'rgba(41, 182, 246, 0.3)',
  warmAccent: 'rgba(255, 200, 100, 0.3)',
}

export function withAlpha(color, alpha) {
  return color.replace('%a', alpha.toString())
}
