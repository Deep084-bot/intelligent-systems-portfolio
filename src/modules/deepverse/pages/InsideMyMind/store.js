import { create } from 'zustand'
import { MODULES } from './nodes.config'

export const DEBUG_EASTER_EGGS = true

const STORAGE_KEY = 'brainos_progress'

const DISCOVERY_IDS = ['curiosity', 'shooting-star', 'developer-mode', 'constellation', 'long-hover', 'quote']
const CONSTELLATION_ORDER = ['learning', 'problem-solving', 'architecture', 'ai', 'performance']
const CURIOSITY_TRIGGER = 7
const TRADEOFF_IDS = ['rest-grpc', 'sql-nosql', 'redis-memcached']
const DEBUGGING_IDS = ['memory-leak', 'database-slowdown', 'api-timeout']
const REVIEW_IDS = ['auth-middleware', 'react-dashboard', 'database-repository']

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
      scenarioProgress: state.scenarioProgress,
      tradeoffProgress: state.tradeoffProgress,
      debuggingProgress: state.debuggingProgress,
      reviewProgress: state.reviewProgress,
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
  scenarioProgress: saved?.scenarioProgress || {},
  tradeoffProgress: saved?.tradeoffProgress || {},
  debuggingProgress: saved?.debuggingProgress || {},
  reviewProgress: saved?.reviewProgress || {},
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
    const { visitedModules, recentOpens } = get()
    const isNew = !visitedModules.includes(moduleId)
    const nextVisited = isNew ? [...visitedModules, moduleId] : visitedModules
    const nextRecent = [...recentOpens, moduleId].slice(-CONSTELLATION_ORDER.length)

    if (DEBUG_EASTER_EGGS) {
      const label = MODULES.find((m) => m.id === moduleId)?.label || moduleId
      console.log(`[brainos] Visited: ${label}`)
      const progressing = recentOpens.every((r, i) => r === CONSTELLATION_ORDER[i])
      const expectedNext = CONSTELLATION_ORDER[recentOpens.length]
      if (progressing && moduleId !== expectedNext) {
        console.log('[brainos] Sequence reset')
      }
      console.log(`[brainos] Current sequence: ${nextRecent.map((r) => MODULES.find((m) => m.id === r)?.label || r).join(', ')}`)
      if (isNew) console.log(`[brainos] Explored: ${label} (${nextVisited.length}/${CURIOSITY_TRIGGER})`)
    }

    let curiosityVisible = get().curiosityVisible
    if (!curiosityVisible && nextVisited.length >= CURIOSITY_TRIGGER) {
      curiosityVisible = true
      if (DEBUG_EASTER_EGGS) console.log('[brainos] Unlocking Curiosity...')
      get().notify('Curiosity Found')
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

  recordScenarioResult: (scenarioId, score) => {
    const { scenarioProgress, achievements } = get()
    const prev = scenarioProgress[scenarioId]
    const nextProgress = {
      ...scenarioProgress,
      [scenarioId]: {
        bestScore: prev ? Math.max(prev.bestScore, score) : score,
        completed: true,
        attempts: (prev?.attempts || 0) + 1,
      },
    }
    let nextAchievements = achievements
    const firstCompletion = Object.values(nextProgress).filter((p) => p.completed).length === 1
    if (firstCompletion && !achievements.includes('problem-solver')) {
      nextAchievements = [...achievements, 'problem-solver']
    }
    set({ scenarioProgress: nextProgress, achievements: nextAchievements })
    saveProgress(get())
  },

  recordTradeoffResult: (scenarioId, score) => {
    const { tradeoffProgress, achievements } = get()
    const prev = tradeoffProgress[scenarioId]
    const nextProgress = {
      ...tradeoffProgress,
      [scenarioId]: {
        bestScore: prev ? Math.max(prev.bestScore, score) : score,
        completed: true,
        attempts: (prev?.attempts || 0) + 1,
      },
    }
    let nextAchievements = achievements
    const allComplete = TRADEOFF_IDS.every((id) => nextProgress[id]?.completed)
    if (allComplete && !achievements.includes('tradeoff-master')) {
      nextAchievements = [...achievements, 'tradeoff-master']
      get().notify('Tradeoff Master unlocked')
    }
    set({ tradeoffProgress: nextProgress, achievements: nextAchievements })
    saveProgress(get())
  },

  recordDebuggingResult: (scenarioId, score) => {
    const { debuggingProgress, achievements } = get()
    const prev = debuggingProgress[scenarioId]
    const nextProgress = {
      ...debuggingProgress,
      [scenarioId]: {
        bestScore: prev ? Math.max(prev.bestScore, score) : score,
        completed: true,
        attempts: (prev?.attempts || 0) + 1,
      },
    }
    let nextAchievements = achievements
    const allComplete = DEBUGGING_IDS.every((id) => nextProgress[id]?.completed)
    if (allComplete && !achievements.includes('incident-commander')) {
      nextAchievements = [...achievements, 'incident-commander']
      get().notify('Incident Commander unlocked')
    }
    set({ debuggingProgress: nextProgress, achievements: nextAchievements })
    saveProgress(get())
  },

  recordReviewResult: (scenarioId, score) => {
    const { reviewProgress, achievements } = get()
    const prev = reviewProgress[scenarioId]
    const nextProgress = {
      ...reviewProgress,
      [scenarioId]: {
        bestScore: prev ? Math.max(prev.bestScore, score) : score,
        completed: true,
        attempts: (prev?.attempts || 0) + 1,
      },
    }
    let nextAchievements = achievements
    const allComplete = REVIEW_IDS.every((id) => nextProgress[id]?.completed)
    if (allComplete && !achievements.includes('principal-reviewer')) {
      nextAchievements = [...achievements, 'principal-reviewer']
      get().notify('Principal Reviewer unlocked')
    }
    set({ reviewProgress: nextProgress, achievements: nextAchievements })
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
      scenarioProgress: {},
      tradeoffProgress: {},
      debuggingProgress: {},
      reviewProgress: {},
      recentOpens: [],
      curiosityVisible: false,
    })
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
  },
}))

export default useBrainStore
