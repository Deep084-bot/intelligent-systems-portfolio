// DeepPet — the DeepVerse route allowlist.
//
// Single source of truth for "where can DeepPet send the visitor". Paths and
// labels mirror the real application: the routes come from
// `src/modules/deepverse/index.jsx` and the labels from the hub cards in
// `src/modules/deepverse/pages/Hub.jsx`. Nothing outside this map may ever be
// navigated to, which is what keeps free text from escaping into arbitrary URLs.
//
// Pure data + pure lookups: no React, no router, no side effects.

export const WORLD_ROUTES = {
  portal: {
    path: '/deepverse',
    label: 'DeepVerse',
    aliases: ['deepverse home', 'the portal', 'portal', 'the hub', 'main menu', 'entrance', 'deepverse', 'home'],
  },
  deeppet: {
    path: '/deepverse/deeppet',
    label: 'DeepPet',
    aliases: ['deeppet', 'deep pet', 'your world', 'your place', 'your room', 'your home'],
  },
  cosmos: {
    path: '/deepverse/cosmos',
    label: 'Cosmos',
    aliases: ['the cosmos', 'cosmos', 'outer space', 'deep space', 'the stars', 'universe'],
  },
  'vision-arena': {
    path: '/deepverse/vision-arena',
    label: 'Vision Arena',
    aliases: ['vision arena', 'computer vision', 'the arena', 'vision', 'camera'],
  },
  'music-lab': {
    path: '/deepverse/music-lab',
    label: 'Music Lab',
    aliases: ['music lab', 'music room', 'listen to music', 'some music', 'the music', 'music', 'air guitar', 'guitar'],
  },
  'inside-my-mind': {
    path: '/deepverse/inside-my-mind',
    label: 'Inside My Mind',
    aliases: ['inside my mind', 'my mind', 'the mind', 'brain lab'],
  },
  'reading-room': {
    path: '/deepverse/reading-room',
    label: 'The Reading Room',
    aliases: ['the reading room', 'reading room', 'library', 'the library', 'books', 'reading'],
  },
  'system-design': {
    path: '/deepverse/system-design',
    label: 'System Design Playground',
    aliases: ['system design playground', 'system design', 'design playground', 'systems'],
  },
}

export const WORLD_KEYS = Object.keys(WORLD_ROUTES)

export function isKnownWorld(world) {
  return typeof world === 'string' && Object.prototype.hasOwnProperty.call(WORLD_ROUTES, world)
}

export function worldLabel(world) {
  return isKnownWorld(world) ? WORLD_ROUTES[world].label : 'there'
}

// Longest aliases first so "your home" beats "home" and "music lab" beats "music".
export const ALIAS_INDEX = WORLD_KEYS
  .flatMap((world) => WORLD_ROUTES[world].aliases.map((alias) => ({ alias, world })))
  .sort((a, b) => b.alias.length - a.alias.length)

export function destinationList() {
  return WORLD_KEYS.map((world) => ({
    world,
    path: WORLD_ROUTES[world].path,
    label: WORLD_ROUTES[world].label,
  }))
}
