import { create } from 'zustand'

export const DEBUG_EASTER_EGGS = true

const STORAGE_KEY = 'brainos_progress'

const DISCOVERY_IDS = ['curiosity', 'shooting-star', 'developer-mode', 'constellation', 'long-hover', 'quote']
const CONSTELLATION_ORDER = ['learning', 'problem-solving', 'architecture', 'ai', 'performance']
const CURIOSITY_TRIGGER = 7

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

function saveProgress(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      visitedModules: state.visitedModules,
      achievements: state.achievements,
      sessionCount: state.sessionCount,
      discoveries: state.discoveries,
    }))
  } catch {}
}

const saved = loadProgress()

const useBrainStore = create((set, get) => ({
  booted: false,
  activeModule: null,
  visitedModules: saved?.visitedModules || [],
  achievements: saved?.achievements || [],
  sessionCount: saved?.sessionCount || 0,
  discoveries: saved?.discoveries || [],
  particlesEnabled: true,
  ambientGlow: true,
  reducedMotion: false,
  showHelp: false,
  showSettings: false,
  showAchievements: false,

  developerMode: false,
  curiosityVisible: false,
  curiosityOpen: false,
  constellationAt: 0,
  toast: null,

  moduleOpenCount: {},
  recentOpens: [],

  completeBoot: () => set({ booted: true }),

  notify: (text) => {
    const id = Date.now()
    if (DEBUG_EASTER_EGGS) console.log(`[brainos] Toast: ${text}`)
    set({ toast: { text, id } })
    setTimeout(() => {
      set((s) => (s.toast && s.toast.id === id ? { toast: null } : {}))
    }, 2600)
  },

  recordDiscovery: (id) => {
    const { discoveries, achievements } = get()
    if (discoveries.includes(id)) return
    if (DEBUG_EASTER_EGGS) console.log(`[brainos] Discovery: ${id}`)
    const next = [...discoveries, id]
    let nextAchievements = achievements
    if (DISCOVERY_IDS.every((d) => next.includes(d)) && !achievements.includes('mind-explorer')) {
      nextAchievements = [...achievements, 'mind-explorer']
      const id = Date.now()
      set({ toast: { text: 'Mind Explorer unlocked', id } })
      setTimeout(() => set((s) => (s.toast?.id === id ? { toast: null } : {})), 2600)
    }
    set({ discoveries: next, achievements: nextAchievements })
    saveProgress(get())
  },

  startDeveloperMode: () => {
    set({ developerMode: true })
  },
  endDeveloperMode: () => set({ developerMode: false }),

  openModule: (moduleId) => {
    const { visitedModules, moduleOpenCount, recentOpens } = get()
    const nextVisited = visitedModules.includes(moduleId) ? visitedModules : [...visitedModules, moduleId]
    const count = (moduleOpenCount[moduleId] || 0) + 1
    const nextCounts = { ...moduleOpenCount, [moduleId]: count }
    const nextRecent = [...recentOpens, moduleId].slice(-CONSTELLATION_ORDER.length)

    if (DEBUG_EASTER_EGGS) console.log(`[brainos] Visited: ${moduleId}`)
    if (DEBUG_EASTER_EGGS && moduleId === 'problem-solving') {
      console.log(`[brainos] Problem Solving clicks: ${count}/${CURIOSITY_TRIGGER}`)
    }

    let curiosityVisible = get().curiosityVisible
    if (moduleId === 'problem-solving' && count >= CURIOSITY_TRIGGER) {
      curiosityVisible = true
      if (DEBUG_EASTER_EGGS) console.log('[brainos] Curiosity unlocked (click 7)')
    }

    let constellationAt = get().constellationAt
    if (
      nextRecent.length === CONSTELLATION_ORDER.length &&
      nextRecent.every((r, i) => r === CONSTELLATION_ORDER[i])
    ) {
      constellationAt = Date.now() + 5200
      get().recordDiscovery('constellation')
      if (DEBUG_EASTER_EGGS) console.log('[brainos] Constellation unlocked')
    }

    set({
      activeModule: moduleId,
      visitedModules: nextVisited,
      moduleOpenCount: nextCounts,
      recentOpens: nextRecent,
      curiosityVisible,
      constellationAt,
    })
    saveProgress(get())
  },

  closeModule: () => set({ activeModule: null }),
  openCuriosity: () => {
    set({ curiosityOpen: true, activeModule: null })
    get().recordDiscovery('curiosity')
    get().notify('Curiosity Found')
  },
  closeCuriosity: () => set({ curiosityOpen: false }),

  toggleHelp: () => set((s) => ({ showHelp: !s.showHelp })),
  toggleSettings: () => set((s) => ({ showSettings: !s.showSettings })),
  toggleAchievements: () => set((s) => ({ showAchievements: !s.showAchievements })),

  setParticlesEnabled: (v) => set({ particlesEnabled: v }),
  setAmbientGlow: (v) => set({ ambientGlow: v }),
  setReducedMotion: (v) => set({ reducedMotion: v }),

  unlockAchievement: (id) => {
    const { achievements } = get()
    if (achievements.includes(id)) return
    const next = [...achievements, id]
    set({ achievements: next })
    saveProgress(get())
  },

  incrementSession: () => {
    const { sessionCount } = get()
    set({ sessionCount: sessionCount + 1 })
    saveProgress(get())
  },

  resetProgress: () => {
    set({
      visitedModules: [],
      achievements: [],
      sessionCount: 0,
      discoveries: [],
      moduleOpenCount: {},
      recentOpens: [],
      curiosityVisible: false,
    })
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
  },
}))

export default useBrainStore
