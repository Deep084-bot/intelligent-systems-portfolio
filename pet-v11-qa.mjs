// DeepPet v1.1 — reactive companion QA. Node script, no test framework.
//   node pet-v11-qa.mjs
import assert from 'node:assert/strict'

import { pet, usePetStore, resetPetForTest } from './src/modules/deepverse/components/DeepPet/store.js'
import { on, off, emit, listenerCount, resetListeners, PET_EVENTS } from './src/modules/deepverse/components/DeepPet/events.js'
import * as S from './src/modules/deepverse/components/DeepPet/petState.js'
import * as CMD from './src/modules/deepverse/components/DeepPet/petCommands.js'
import * as PERSONA from './src/modules/deepverse/components/DeepPet/petPersona.js'
import * as ROUTES from './src/modules/deepverse/components/DeepPet/worldRoutes.js'
import * as REG from './src/modules/deepverse/components/DeepPet/actionRegistry.js'
import * as ACTIONS from './src/modules/deepverse/components/DeepPet/petActions.js'
import { executeProposal } from './src/modules/deepverse/components/DeepPet/actionRunner.js'
import { getReply } from './src/modules/deepverse/components/DeepPet/petBrain.js'
import brainStore from './src/modules/deepverse/pages/InsideMyMind/store.js'

const results = []
const check = (name, fn) => {
  try {
    fn()
    results.push([true, name])
  } catch (err) {
    results.push([false, `${name} -> ${err.message}`])
  }
}
const checkAsync = async (name, fn) => {
  try { await fn(); results.push([true, name]) }
  catch (err) { results.push([false, `${name} -> ${err.message}`]) }
}

const st = () => usePetStore.getState()
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const reset = () => {
  resetPetForTest()
  resetListeners()
  usePetStore.setState({ world: 'portal', baseline: 'curious', state: 'curious', override: null, hovering: false, line: null, burstId: 0 })
}

// ---------------------------------------------------------------- on / off / emit
check('on/emit delivers payload to a listener', () => {
  reset()
  let seen = null
  on('success', (p) => { seen = p })
  emit('success', { scenarioId: 'x' })
  assert.deepEqual(seen, { scenarioId: 'x' })
})

check('on supports multiple listeners, all receive the event', () => {
  reset()
  const hits = []
  on('achievement', () => hits.push('a'))
  on('achievement', () => hits.push('b'))
  on('achievement', () => hits.push('c'))
  emit('achievement', {})
  assert.deepEqual(hits, ['a', 'b', 'c'])
})

check('the same handler registered twice is one subscription (Set)', () => {
  reset()
  let n = 0
  const h = () => n++
  on('poke', h)
  on('poke', h)
  assert.equal(listenerCount('poke'), 1)
  emit('poke', {})
  assert.equal(n, 1)
})

check('off() unsubscribes and stops delivery', () => {
  reset()
  let n = 0
  const h = () => n++
  on('poke', h)
  emit('poke', {})
  off('poke', h)
  emit('poke', {})
  assert.equal(n, 1)
  assert.equal(listenerCount('poke'), 0)
})

check('on() returns an unsubscribe closure', () => {
  reset()
  let n = 0
  const off1 = on('greet', () => n++)
  emit('greet', {})
  off1()
  emit('greet', {})
  assert.equal(n, 1)
})

check('off() for an unknown handler returns false, no throw', () => {
  reset()
  assert.equal(off('success', () => {}), false)
  assert.equal(off('never-used', () => {}), false)
})

check('a throwing listener does not block the others', () => {
  reset()
  let reached = false
  on('error', () => { throw new Error('boom') })
  on('error', () => { reached = true })
  emit('error', {})
  assert.equal(reached, true)
})

check('a listener may unsubscribe during dispatch', () => {
  reset()
  let n = 0
  const h = () => { n++; off('poke', h) }
  on('poke', h)
  emit('poke', {})
  assert.equal(n, 1)
  assert.equal(listenerCount('poke'), 0)
})

check('emit() with no listeners returns 0 and does not throw', () => {
  reset()
  assert.equal(emit('success', {}), 0)
})

check('all 8 required events are supported', () => {
  const required = ['greet', 'world-enter', 'success', 'error', 'discovery', 'achievement', 'poke', 'idle']
  for (const e of required) assert.ok(PET_EVENTS.includes(e), `missing event ${e}`)
  assert.equal(PET_EVENTS.length, 8)
})

check('pet.on/pet.off/pet.emit are exposed on the plain API', () => {
  assert.equal(typeof pet.on, 'function')
  assert.equal(typeof pet.off, 'function')
  assert.equal(typeof pet.emit, 'function')
  let n = 0
  const h = () => n++
  pet.on('poke', h)
  pet.emit('poke', {})
  pet.off('poke', h)
  pet.emit('poke', {})
  assert.equal(n, 1)
})

check('v1 plain API is preserved', () => {
  for (const fn of ['setState', 'react', 'burst', 'setWorld', 'getState']) {
    assert.equal(typeof pet[fn], 'function', `pet.${fn} missing`)
  }
})

// ---------------------------------------------------------------- priority
check('priority ladder is ordered as specified', () => {
  const p = S.REACTION_PRIORITY
  assert.ok(p.achievement > p.discovery, 'achievement > discovery')
  assert.ok(p.discovery > p.success, 'discovery > success')
  assert.ok(p.success === p.error, 'success === error')
  assert.ok(p.error > p.poke, 'error > poke')
  assert.ok(p.poke > p['world-enter'], 'poke > world-enter')
  assert.ok(p['world-enter'] > p.idle, 'world-enter > idle')
  assert.ok(p.hover === 0, 'hover is the floor')
})

check('a higher-priority reaction replaces a lower one', () => {
  reset()
  pet.react('world-enter')
  assert.equal(pet.getState(), S.REACTIONS.greet.state)
  pet.react('achievement', { force: true })
  assert.equal(pet.getState(), S.REACTIONS.achievement.state)
})

check('a lower-priority reaction is dropped while a reaction is live', () => {
  reset()
  pet.react('achievement', { force: true })
  assert.equal(pet.getState(), S.REACTIONS.achievement.state)
  const before = st().override
  const returned = pet.react('poke', { force: true })
  assert.equal(returned, null, 'dropped reaction reports null')
  assert.equal(st().override, before, 'achievement override untouched')
  assert.equal(pet.getState(), S.REACTIONS.achievement.state)
})

check('world-enter does not stomp an in-flight poke', () => {
  reset()
  pet.react('poke', { force: true })
  assert.equal(pet.getState(), S.REACTIONS.achievement.state)
  pet.react('rest', { force: true, priority: S.REACTION_PRIORITY['world-enter'] })
  assert.equal(st().override !== null, true)
})

check('identical events inside the debounce window do not stack', () => {
  reset()
  const a = pet.react('success', { force: true })
  assert.ok(a)
  const b = pet.react('success')
  assert.equal(b, null, 'second success within 250ms dropped')
})

check('poke bursts the particle system, world-enter does not', () => {
  reset()
  const before = st().burstId
  pet.react('poke', { force: true })
  assert.equal(st().burstId, before + 1, 'poke bursts')
  const mid = st().burstId
  pet.react('rest', { force: true, priority: S.REACTION_PRIORITY['world-enter'] })
  assert.equal(st().burstId, mid, 'world-enter is silent')
})

// ---------------------------------------------------------------- overrides
check('a temporary reaction expires back to the world baseline', async () => {
  reset()
  pet.setWorld('music-lab')
  assert.equal(st().baseline, 'happy')
  pet.react('success', { force: true })
  assert.equal(pet.getState(), 'happy')
  pet.react('discovery', { force: true })
  assert.equal(pet.getState(), S.REACTIONS.discovery.state)
  assert.notEqual(st().baseline, S.REACTIONS.discovery.state, 'baseline not overwritten')
})

check('hold timer restores the baseline', async () => {
  reset()
  pet.setWorld('system-design')
  pet.react('error', { force: true })
  assert.equal(pet.getState(), S.REACTIONS.error.state)
  await sleep(3100)
  assert.equal(pet.getState(), 'idle', 'expired back to system-design baseline')
  assert.equal(st().override, null)
})

check('hold timer restores baseline for a world entered mid-reaction', async () => {
  reset()
  pet.setWorld('portal')
  pet.react('achievement', { force: true })
  pet.setWorld('reading-room')
  assert.equal(st().baseline, 'sleepy', 'baseline follows the new world')
  assert.equal(pet.getState(), S.REACTIONS.achievement.state, 'reaction still playing')
  await sleep(3500)
  assert.equal(pet.getState(), 'sleepy', 'lands on the NEW world baseline')
})

check('world-enter emits once per real world change, not per render', () => {
  reset()
  const seen = []
  on('world-enter', (p) => seen.push(p))
  pet.setWorldFromRoute('/deepverse')
  pet.setWorldFromRoute('/deepverse')
  pet.setWorldFromRoute('/deepverse')
  assert.equal(seen.length, 0, 'no change on portal -> portal')
  pet.setWorldFromRoute('/deepverse/cosmos')
  assert.equal(seen.length, 1)
  pet.setWorldFromRoute('/deepverse/cosmos')
  assert.equal(seen.length, 1, 'same world again -> no emit')
  pet.setWorldFromRoute('/deepverse/music-lab')
  assert.equal(seen.length, 2)
})

check('world-enter payload carries route + world metadata', () => {
  reset()
  let payload = null
  on('world-enter', (p) => { payload = p })
  pet.setWorldFromRoute('/deepverse/vision-arena')
  assert.deepEqual(payload, { world: 'vision-arena', from: 'portal', route: '/deepverse/vision-arena' })
})

check('world baseline mood is applied when no override is active', () => {
  reset()
  for (const [world, mood] of Object.entries(S.WORLD_MOODS)) {
    reset()
    pet.setWorld(world)
    assert.equal(pet.getState(), mood, `${world} -> ${mood}`)
  }
})

check('hover is not torn down by a live reaction and vice versa', () => {
  reset()
  st().setHovering(true)
  assert.equal(st().hovering, true)
  pet.react('achievement', { force: true })
  st().setHovering(false)
  assert.equal(pet.getState(), S.REACTIONS.achievement.state, 'achievement survives pointer-out')
  st().setHovering(true)
  st().setHovering(false)
})

check('hover cannot stomp a live reaction or clear its hold timer', () => {
  reset()
  pet.react('achievement', { force: true })
  assert.equal(pet.getState(), S.REACTIONS.achievement.state)
  st().setHovering(true)
  assert.equal(pet.getState(), S.REACTIONS.achievement.state, 'hover must not replace the reaction')
  assert.ok(st().override, 'reaction override kept, hover never installed')
  st().setHovering(false)
  assert.equal(pet.getState(), S.REACTIONS.achievement.state, 'reaction still owns the pet after leave')
})

check('hover resumes after a reaction expires while the pointer is inside', async () => {
  reset()
  pet.setWorld('portal')
  assert.equal(pet.getState(), 'curious')
  st().setHovering(true)
  pet.react('poke', { force: true })
  assert.equal(pet.getState(), S.REACTIONS.poke.state)
  await sleep(2500)
  assert.equal(st().hovering, true)
  assert.equal(pet.getState(), S.REACTIONS.hover.state, 'face returns to hover while pointer stays inside')
  st().setHovering(false)
  assert.equal(pet.getState(), 'curious', 'pointer-out drops hover back to the portal baseline')
})

check('a cold world load lands on that world baseline', () => {
  reset()
  // Arriving directly in a non-default world (DeepPet subscriptions not yet
  // mounted) must still route to that world's mood so the visit never starts
  // on the wrong face.
  pet.setWorldFromRoute('/deepverse/cosmos')
  assert.equal(pet.getState(), 'idle', 'cosmos cold load rests on idle')
  pet.setWorldFromRoute('/deepverse/music-lab')
  assert.equal(pet.getState(), 'happy', 'music-lab cold load rests on happy')
  pet.setWorldFromRoute('/deepverse/reading-room')
  assert.equal(pet.getState(), 'sleepy', 'reading-room cold load rests on sleepy')
})

check('idle behaviour ponder resolves to the confused face', () => {
  reset()
  pet.react('ponder', { force: true })
  assert.equal(pet.getState(), S.REACTIONS.ponder.state)
  assert.equal(S.REACTIONS.ponder.state, 'confused')
  assert.ok(S.FLOAT_LINES.ponder, 'ponder has a quiet line')
})

check('pet.setState stays sticky until released', () => {
  reset()
  pet.setState('sleepy')
  assert.equal(pet.getState(), 'sleepy')
  st().releaseOverride()
  assert.equal(pet.getState(), 'curious')
})

check('unknown reaction falls back to greet', () => {
  reset()
  const p = pet.react('not-a-real-event', { force: true })
  assert.equal(p.state, S.REACTIONS.greet.state)
})

// ---------------------------------------------------------------- v1 regression
check('all ten reactions still resolve', () => {
  for (const e of S.REACTION_EVENTS) assert.ok(S.REACTIONS[e], `missing reaction ${e}`)
  assert.equal(S.REACTION_EVENTS.length, 10)
})

check('all six states stay reachable through setState and idle behaviour', () => {
  reset()
  for (const s of S.PET_STATE_LIST) {
    pet.setState(s)
    assert.equal(pet.getState(), s)
    assert.ok(S.getProfile(s), `profile missing for ${s}`)
  }
  assert.equal(S.PET_STATE_LIST.length, 6)
  // the autonomous heartbeat can now reach every state: poke/excited,
  // rest/idle, sleep/sleepy, ponder/confused — plus curious is the portal mood
  const picks = new Set()
  for (let i = 0; i < 800; i++) picks.add(S.pickIdleBehavior())
  for (const p of picks) assert.ok(S.REACTIONS[p], `idle picked unknown behaviour ${p}`)
  for (const target of ['excited', 'idle', 'sleepy', 'confused']) {
    const hit = picks.has('poke') || picks.has('rest') || picks.has('sleep') || picks.has('ponder')
    assert.ok(hit, 'behaviour set covers the four non-curious faces')
  }
})

check('world moods and route mapping cover all 8 worlds', () => {
  assert.equal(Object.keys(S.WORLD_MOODS).length, 8)
  assert.equal(S.worldFromRoute('/deepverse'), 'portal')
  assert.equal(S.worldFromRoute('/deepverse/inside-my-mind'), 'inside-my-mind')
  assert.equal(S.worldFromRoute('/deepverse/deeppet'), 'deeppet')
  assert.equal(S.worldFromRoute('/elsewhere'), 'portal')
})

check('the DeepPet home world rests on the curious baseline', () => {
  reset()
  pet.setWorldFromRoute('/deepverse/deeppet')
  assert.equal(pet.getState(), 'curious', 'deeppet home settles on curious')
  assert.equal(S.worldEnterResponse('deeppet'), 'greet')
})

check('every world has an enter response', () => {
  for (const w of Object.keys(S.WORLD_MOODS)) assert.ok(S.worldEnterResponse(w), `no response for ${w}`)
  assert.equal(S.worldEnterResponse('reading-room'), 'rest', 'quiet worlds settle silently')
  assert.equal(S.worldEnterResponse('nope'), 'greet')
})

check('idle behaviours unchanged and inside the 17-31s band', () => {
  assert.ok(S.IDLE_BEHAVIORS.length > 0)
  const picks = new Set()
  for (let i = 0; i < 400; i++) picks.add(S.pickIdleBehavior())
  assert.ok(picks.size > 1, 'idle must vary')
  for (const p of picks) assert.ok(S.REACTIONS[p], `idle picked unknown behaviour ${p}`)
})

// ---------------------------------------------------------------- Brain OS hooks
const brain = () => brainStore.getState()

check('completing a lab emits success exactly once per completion', () => {
  reset()
  const hits = []
  on('success', (p) => hits.push(p))
  brainStore.setState({ scenarioProgress: {}, achievements: [] })
  brain().recordScenarioResult('overloaded-cart', 90)
  assert.equal(hits.length, 1)
  assert.deepEqual(hits[0], { scenarioId: 'overloaded-cart' })
  // a second, genuinely new completion is a real event
  brain().recordScenarioResult('retry-idempotency', 80)
  assert.equal(hits.length, 2)
})

check('a lab achievement emits achievement exactly once', () => {
  reset()
  const hits = []
  on('achievement', (p) => hits.push(p))
  brainStore.setState({ scenarioProgress: {}, achievements: [] })
  brain().recordScenarioResult('overloaded-cart', 90)
  assert.equal(hits.length, 1, 'first completion unlocks problem-solver')
  assert.deepEqual(hits[0], { achievementId: 'problem-solver' })
  // replaying every scenario again must not re-fire
  brain().recordScenarioResult('retry-idempotency', 70)
  assert.equal(hits.length, 1, 'achievement not duplicated')
})

check('all four labs emit achievement on unlock, and never twice', () => {
  reset()
  const ids = []
  on('achievement', (p) => ids.push(p.achievementId))
  const progress = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [`s${i}`, { bestScore: 9, completed: true, attempts: 1 }]))

  brainStore.setState({ tradeoffProgress: {}, achievements: [] })
  brain().recordTradeoffResult('rest-grpc', 9)
  brain().recordTradeoffResult('sql-nosql', 9)
  assert.equal(ids.length, 0, 'no achievement until all three are done')
  brain().recordTradeoffResult('redis-memcached', 9)
  assert.deepEqual(ids, ['tradeoff-master'])
  brain().recordTradeoffResult('rest-grpc', 10)
  assert.equal(ids.length, 1, 'no duplicate on replay')

  brainStore.setState({ debuggingProgress: {}, achievements: [] })
  for (const id of ['memory-leak', 'database-slowdown', 'api-timeout']) brain().recordDebuggingResult(id, 9)
  assert.deepEqual(ids, ['tradeoff-master', 'incident-commander'])

  brainStore.setState({ reviewProgress: {}, achievements: [] })
  for (const id of ['auth-middleware', 'react-dashboard', 'database-repository']) brain().recordReviewResult(id, 9)
  assert.deepEqual(ids, ['tradeoff-master', 'incident-commander', 'principal-reviewer'])
  brain().recordReviewResult('auth-middleware', 10)
  assert.equal(ids.length, 3, 'review achievement not duplicated')
})

check('easter egg discoveries emit discovery exactly once', () => {
  reset()
  const hits = []
  on('discovery', (p) => hits.push(p.discoveryId))
  brainStore.setState({ discoveries: [], achievements: [] })
  brain().recordDiscovery('shooting-star')
  assert.deepEqual(hits, ['shooting-star'])
  brain().recordDiscovery('shooting-star')
  brain().recordDiscovery('shooting-star')
  assert.equal(hits.length, 1, 'repeat discovery is deduped upstream')
})

check('mind-explorer achievement fires on the last discovery only', () => {
  reset()
  const ach = []
  on('achievement', (p) => ach.push(p.achievementId))
  const all = ['curiosity', 'shooting-star', 'developer-mode', 'constellation', 'long-hover', 'quote']
  brainStore.setState({ discoveries: [], achievements: [] })
  for (const d of all.slice(0, 5)) brain().recordDiscovery(d)
  assert.equal(ach.length, 0)
  brain().recordDiscovery(all[5])
  assert.deepEqual(ach, ['mind-explorer'])
  brain().recordDiscovery(all[0])
  assert.equal(ach.length, 1, 'no duplicate')
})

check('a full achievement reaction resolves to excited + burst', () => {
  reset()
  let burstAt = -1
  on('achievement', () => pet.react('achievement'))
  brainStore.setState({ scenarioProgress: {}, achievements: [] })
  burstAt = st().burstId
  brain().recordScenarioResult('auth-middleware', 95)
  assert.equal(pet.getState(), S.REACTIONS.achievement.state, 'pet is excited')
  assert.equal(st().burstId, burstAt + 1, 'particles burst')
  assert.ok(st().line, 'a quiet line is shown')
})

check('no pet event is emitted for unrelated store activity', () => {
  reset()
  const hits = []
  for (const e of ['greet', 'world-enter', 'success', 'error', 'discovery', 'achievement', 'poke', 'idle']) {
    on(e, () => hits.push(e))
  }
  brainStore.setState({ toast: null, developerMode: false, curiosityOpen: false, showAchievements: false })
  brain().notify('Curiosity Found')
  brain().toggleSettings()
  brain().closeModule()
  brain().closeCuriosity()
  brain().setParticlesEnabled(false)
  assert.deepEqual(hits, [], 'navigation/toggles are silent for the pet')
})

// ---------------------------------------------------------------- PR3: parser -> proposal
check('parser turns a trigger phrase into a navigate proposal', () => {
  const p = CMD.parseActionProposal('take me to Cosmos')
  assert.deepEqual(p, { actionId: 'navigate_to_world', args: { world: 'cosmos' } })
})

check('parser accepts a bare place mention', () => {
  assert.equal(CMD.parseActionProposal('your home').args.world, 'deeppet')
  assert.equal(CMD.parseActionProposal('the reading room').args.world, 'reading-room')
})

check('parser prefers the longest alias', () => {
  assert.equal(CMD.parseActionProposal('take me to the music lab').args.world, 'music-lab')
  assert.equal(CMD.parseActionProposal('open the system design playground').args.world, 'system-design')
})

check('parser never proposes an action for small talk', () => {
  assert.equal(CMD.parseActionProposal('what can you do?'), null)
  assert.equal(CMD.parseActionProposal('hello there'), null)
  assert.equal(CMD.parseActionProposal('where is the moon'), null)
  assert.equal(CMD.parseActionProposal(''), null)
})

check('parser rejects external URLs and arbitrary paths', () => {
  assert.equal(CMD.parseActionProposal('open an unrelated website'), null)
  assert.equal(CMD.parseActionProposal('go to http://evil.example.com'), null)
  assert.equal(CMD.parseActionProposal('navigate to /etc/passwd'), null)
  assert.equal(CMD.parseActionProposal('open www.google.com'), null)
})

check('every destination maps to a real DeepVerse path (allowlist holds)', () => {
  const seen = new Set()
  for (const d of CMD.listDestinations()) {
    assert.ok(d.path.startsWith('/deepverse'), `${d.path} escapes DeepVerse`)
    assert.ok(d.label && d.world, 'descriptor is complete')
    seen.add(d.path)
  }
  assert.equal(seen.size, Object.keys(ROUTES.WORLD_ROUTES).length, 'routes are unique')
})

check('looksLikeNavigation distinguishes intent from chatter', () => {
  assert.equal(CMD.looksLikeNavigation('take me to narnia'), true)
  assert.equal(CMD.looksLikeNavigation('open the pod bay doors'), true)
  assert.equal(CMD.looksLikeNavigation('go somewhere'), true)
  assert.equal(CMD.looksLikeNavigation('hello there'), false)
  assert.equal(CMD.looksLikeNavigation('what can you do'), false)
  assert.equal(CMD.looksLikeNavigation('nice weather today'), false)
})

// ---------------------------------------------------------------- PR3: action registry
function freshRegistry() {
  REG.resetActionRegistry()
  ACTIONS.ensurePetActions()
}

check('a valid action can be registered and listed', () => {
  freshRegistry()
  REG.registerAction({ id: 'demo_action', name: 'Demo', handler: () => ({ ok: true }) })
  const ids = REG.listActions().map((a) => a.id)
  assert.ok(ids.includes('demo_action'))
  assert.ok(ids.includes('navigate_to_world'))
})

check('invalid action ids are rejected at registration', () => {
  freshRegistry()
  for (const bad of ['', 'Bad ID', '1leading', 'has-dash', 'x'.repeat(80), null]) {
    assert.throws(() => REG.registerAction({ id: bad, name: 'n', handler: () => ({ ok: true }) }), `accepted ${String(bad)}`)
  }
})

check('missing name or handler is rejected at registration', () => {
  freshRegistry()
  assert.throws(() => REG.registerAction({ id: 'no_name', handler: () => ({ ok: true }) }))
  assert.throws(() => REG.registerAction({ id: 'no_handler', name: 'n' }))
})

check('duplicate action ids are rejected', () => {
  freshRegistry()
  REG.registerAction({ id: 'dupe', name: 'One', handler: () => ({ ok: true }) })
  assert.throws(() => REG.registerAction({ id: 'dupe', name: 'Two', handler: () => ({ ok: true }) }))
})

await checkAsync('unknown action ids are rejected and never run', async () => {
  freshRegistry()
  let ran = false
  const res = await REG.runAction('does_not_exist', {}, { navigate: () => { ran = true } })
  assert.equal(res.ok, false)
  assert.equal(res.status, REG.ACTION_STATUS.REJECTED)
  assert.equal(res.errorCode, 'UNKNOWN_ACTION')
  assert.equal(ran, false)
})

await checkAsync('arguments are validated before the handler runs', async () => {
  freshRegistry()
  let ran = false
  REG.registerAction({
    id: 'needs_token',
    name: 'Needs token',
    validate: (a) => (a && a.token ? { ok: true, args: { token: a.token } } : { ok: false, errorCode: 'NO_TOKEN', message: 'token required' }),
    handler: () => { ran = true; return { ok: true } },
  })
  const bad = await REG.runAction('needs_token', {})
  assert.equal(bad.ok, false)
  assert.equal(bad.errorCode, 'NO_TOKEN')
  assert.equal(ran, false, 'handler must not run on invalid args')
  const good = await REG.runAction('needs_token', { token: 'abc' })
  assert.equal(good.ok, true)
  assert.equal(ran, true)
})

await checkAsync('a throwing handler becomes a failed result, not a crash', async () => {
  freshRegistry()
  REG.registerAction({ id: 'boom', name: 'Boom', handler: () => { throw new Error('nope') } })
  const res = await REG.runAction('boom', {})
  assert.equal(res.ok, false)
  assert.equal(res.status, REG.ACTION_STATUS.FAILED)
  assert.equal(res.errorCode, 'HANDLER_ERROR')
})

await checkAsync('a handler that returns nothing useful becomes a failed result', async () => {
  freshRegistry()
  REG.registerAction({ id: 'empty', name: 'Empty', handler: () => undefined })
  const res = await REG.runAction('empty', {})
  assert.equal(res.ok, false)
  assert.equal(res.errorCode, 'BAD_HANDLER_RESULT')
})

await checkAsync('a hanging handler times out without crashing', async () => {
  freshRegistry()
  REG.registerAction({ id: 'slow', name: 'Slow', timeoutMs: 25, handler: () => new Promise(() => {}) })
  const res = await REG.runAction('slow', {})
  assert.equal(res.ok, false)
  assert.equal(res.status, REG.ACTION_STATUS.TIMEOUT)
  assert.equal(res.errorCode, 'TIMEOUT')
})

// ---------------------------------------------------------------- PR3: navigation action
await checkAsync('navigate_to_world maps every destination to its real path', async () => {
  freshRegistry()
  for (const [world, meta] of Object.entries(ROUTES.WORLD_ROUTES)) {
    let got = null
    const res = await REG.runAction('navigate_to_world', { world }, { navigate: (p) => { got = p } })
    assert.equal(res.ok, true, `${world} should succeed`)
    assert.equal(got, meta.path, `${world} -> ${meta.path}`)
    assert.equal(res.data.label, meta.label)
  }
})

await checkAsync('navigate_to_world ignores a smuggled path and uses the allowlist', async () => {
  freshRegistry()
  let got = null
  const res = await REG.runAction('navigate_to_world', { world: 'cosmos', path: 'https://evil.example.com' }, { navigate: (p) => { got = p } })
  assert.equal(res.ok, true)
  assert.equal(got, '/deepverse/cosmos')
})

await checkAsync('navigate_to_world rejects an unknown world without navigating', async () => {
  freshRegistry()
  let got = null
  const res = await REG.runAction('navigate_to_world', { world: 'narnia' }, { navigate: (p) => { got = p } })
  assert.equal(res.ok, false)
  assert.equal(res.errorCode, 'UNKNOWN_WORLD')
  assert.equal(got, null, 'must not navigate to an unknown place')
})

await checkAsync('navigate_to_world fails safely when no navigator is provided', async () => {
  freshRegistry()
  const res = await REG.runAction('navigate_to_world', { world: 'cosmos' }, {})
  assert.equal(res.ok, false)
  assert.equal(res.errorCode, 'NO_NAVIGATOR')
})

// ---------------------------------------------------------------- PR3: execution safety
await checkAsync('a required confirmation blocks execution until approved', async () => {
  freshRegistry()
  let ran = 0
  REG.registerAction({
    id: 'confirmed',
    name: 'Confirmed',
    requiresConfirmation: true,
    handler: () => { ran++; return { ok: true, message: 'done' } },
  })
  const proposal = { actionId: 'confirmed', args: {} }
  const denied = await executeProposal(proposal, { confirm: async () => false })
  assert.equal(denied.status, REG.ACTION_STATUS.CANCELLED)
  assert.equal(ran, 0, 'cancellation must prevent execution')

  const proposal2 = { actionId: 'confirmed', args: {} }
  const approved = await executeProposal(proposal2, { confirm: async () => true })
  assert.equal(approved.ok, true)
  assert.equal(ran, 1)
})

await checkAsync('the same proposal cannot execute twice', async () => {
  freshRegistry()
  let ran = 0
  REG.registerAction({ id: 'once', name: 'Once', handler: () => { ran++; return { ok: true } } })
  const proposal = { actionId: 'once', args: {} }
  const first = await executeProposal(proposal)
  const second = await executeProposal(proposal)
  assert.equal(first.ok, true)
  assert.equal(second.status, REG.ACTION_STATUS.DUPLICATE)
  assert.equal(ran, 1, 'handler ran exactly once')
})

await checkAsync('an unknown proposal is rejected without executing anything', async () => {
  freshRegistry()
  let ran = false
  const res = await executeProposal({ actionId: 'ghost', args: {} }, { navigate: () => { ran = true } })
  assert.equal(res.status, REG.ACTION_STATUS.REJECTED)
  assert.equal(ran, false)
})

check('navigation requires no confirmation (low friction)', () => {
  freshRegistry()
  assert.equal(REG.getAction('navigate_to_world').requiresConfirmation, false)
})

check('music actions are registered and executable', () => {
  freshRegistry()
  for (const id of ACTIONS.MUSIC_ACTION_IDS) {
    assert.equal(REG.hasAction(id), true, `${id} must be registered`)
    assert.ok(REG.getAction(id).name, `${id} has a display name`)
  }
})

check('ensurePetActions is idempotent for the music actions', () => {
  freshRegistry()
  assert.doesNotThrow(() => ACTIONS.ensurePetActions())
  assert.doesNotThrow(() => ACTIONS.ensurePetActions())
  assert.equal(REG.listActions().filter((a) => a.id === 'play_track').length, 1)
})

// ---------------------------------------------------------------- PR3: full command flow
await checkAsync('getReply proposes navigation without executing it', async () => {
  freshRegistry()
  const r = await getReply('take me to cosmos', { aiEnabled: false })
  assert.equal(r.kind, 'action')
  assert.equal(r.proposal.actionId, 'navigate_to_world')
  assert.equal(r.proposal.args.world, 'cosmos')
  assert.equal(r.reaction, 'greet')
})

await checkAsync('a proposed navigation executes only through the runner', async () => {
  freshRegistry()
  const r = await getReply('open the music lab', { aiEnabled: false })
  let got = null
  const res = await executeProposal(r.proposal, { navigate: (p) => { got = p } })
  assert.equal(res.ok, true)
  assert.equal(got, '/deepverse/music-lab')
})

await checkAsync('an AI-style freeform reply can never become an action', async () => {
  freshRegistry()
  // Simulate what happens when the provider is enabled: the model only ever
  // contributes display text. It cannot inject a proposal.
  const r = await getReply('navigate to http://evil.example.com', { aiEnabled: false })
  assert.notEqual(r.kind, 'action')
  assert.ok(!r.proposal, 'a URL must not produce a proposal')
})

// ---------------------------------------------------------------- PR2: persona (kept)
check('classifyIntent covers the persona vocabulary', () => {
  assert.equal(PERSONA.classifyIntent('hello'), 'greeting')
  assert.equal(PERSONA.classifyIntent('tell me about yourself'), 'about')
  assert.equal(PERSONA.classifyIntent('what can you do'), 'capabilities')
  assert.equal(PERSONA.classifyIntent('thanks!'), 'thanks')
  assert.equal(PERSONA.classifyIntent('bye'), 'farewell')
  assert.equal(PERSONA.classifyIntent('yes please'), 'affirm')
  assert.equal(PERSONA.classifyIntent('play some music'), 'music')
  assert.equal(PERSONA.classifyIntent('asdfghjkl'), 'unknown')
})

check('intent -> reaction keeps face and words in agreement', () => {
  assert.equal(PERSONA.reactionForIntent('greeting'), 'greet')
  assert.equal(PERSONA.reactionForIntent('thanks'), 'success')
  assert.equal(PERSONA.reactionForIntent('affirm'), 'success')
  assert.equal(PERSONA.reactionForIntent('farewell'), 'rest')
  assert.equal(PERSONA.reactionForIntent('unknown'), 'greet')
})

check('music reply describes real playback capability', () => {
  const r = PERSONA.localReply('play me some music')
  assert.equal(r.intent, 'music')
  assert.match(r.text, /(play|music|track|Cosmic Drift|Greenhouse|Night Drive|Focus Mode)/i)
  assert.doesNotMatch(r.text, /not built|not wired|isn't wired|no music engine/i)
})

check('greeting lines never repeat back-to-back', () => {
  let prev = null
  for (let i = 0; i < 24; i++) {
    const line = PERSONA.greetingLine()
    assert.notEqual(line, prev, 'two identical greetings in a row')
    prev = line
  }
})

check('preActionLine names the destination and leaves no template', () => {
  const text = PERSONA.preActionLine('cosmos')
  assert.match(text, /Cosmos/)
  assert.ok(!text.includes('{label}'))
})

check('actionResultLine reports success only for an ok result', () => {
  const ok = PERSONA.actionResultLine({ status: 'ok', data: { world: 'cosmos', label: 'Cosmos' } })
  assert.match(ok, /Cosmos/)
  const unsupported = PERSONA.actionResultLine({ status: 'unsupported', errorCode: 'UNKNOWN_WORLD' })
  assert.ok(unsupported.length > 0)
  const failed = PERSONA.actionResultLine({ status: 'failed', errorCode: 'HANDLER_ERROR' })
  assert.ok(failed.length > 0)
  assert.notEqual(ok, failed)
})

check('action result maps expressions truthfully', () => {
  assert.equal(PERSONA.reactionForActionResult({ status: 'ok' }), 'success')
  assert.equal(PERSONA.reactionForActionResult({ status: 'cancelled' }), 'rest')
  assert.equal(PERSONA.reactionForActionResult({ status: 'failed' }), 'error')
  assert.equal(PERSONA.reactionForActionResult({ status: 'timeout' }), 'error')
  assert.equal(PERSONA.reactionForActionResult({ status: 'unsupported' }), 'greet')
})

check('every world has a contextual line', () => {
  for (const w of ['portal', 'cosmos', 'music-lab', 'reading-room', 'vision-arena', 'system-design', 'inside-my-mind', 'deeppet']) {
    assert.equal(typeof PERSONA.worldLine(w), 'string')
    assert.ok(PERSONA.worldLine(w).length > 0)
  }
})

// ---------------------------------------------------------------- PR2: brain
await checkAsync('brain proposes navigation without executing it', async () => {
  const r = await getReply('take me to cosmos')
  assert.equal(r.kind, 'action')
  assert.equal(r.proposal.actionId, 'navigate_to_world')
  assert.equal(r.proposal.args.world, 'cosmos')
  assert.equal(r.reaction, 'greet')
})

await checkAsync('brain falls back to the local persona for chatter', async () => {
  const r = await getReply('hello there', { aiEnabled: false })
  assert.equal(r.kind, 'local')
  assert.equal(r.intent, 'greeting')
  assert.equal(r.reaction, 'greet')
  assert.ok(r.text.length > 0)
})

await checkAsync('brain maps thanks to the happy face locally', async () => {
  const r = await getReply('thank you!', { aiEnabled: false })
  assert.equal(r.kind, 'local')
  assert.equal(r.reaction, 'success')
})

await checkAsync('brain apologises for an unknown place without routing', async () => {
  const r = await getReply('take me to narnia', { aiEnabled: false })
  assert.equal(r.kind, 'local')
  assert.equal(r.intent, 'unknown')
  assert.equal(r.reaction, 'greet')
  assert.ok(!r.proposal, 'unknown place produced no proposal')
})

await checkAsync('brain degrades to local when the AI provider is unreachable', async () => {
  const r = await getReply('hello', { aiEnabled: true })
  assert.equal(r.kind, 'local', 'unreachable provider falls back, never throws')
})

// ---------------------------------------------------------------- PR2: dialogue overrides
await checkAsync('a dialogue line installs and then expires back to the baseline', async () => {
  reset()
  pet.setWorld('portal')
  pet.react('greet', { force: true, hold: 60, line: 'hello friend' })
  assert.equal(st().line, 'hello friend', 'custom line is shown')
  assert.equal(pet.getState(), S.REACTIONS.greet.state)
  await sleep(130)
  assert.equal(st().line, null, 'line cleared with the override')
  assert.equal(pet.getState(), 'curious', 'baseline restored after hold')
})

await checkAsync('a conversation override uses the success rung and is not sticky', async () => {
  reset()
  pet.setWorld('portal')
  pet.react('greet', { force: true, priority: S.REACTION_PRIORITY.success, hold: 50, line: 'thinking…' })
  assert.equal(st().override !== null, true)
  await sleep(120)
  assert.equal(st().override, null)
  assert.equal(pet.getState(), 'curious')
})

// ---------------------------------------------------------------- PR5: shared music engine
import { musicEngine, PRESETS as MUSIC_PRESETS } from './src/modules/deepverse/audio/MusicEngine.js'

class MockParam {
  constructor(v = 0) { this.value = v }
  setValueAtTime(v) { this.value = v; return this }
  linearRampToValueAtTime(v) { this.value = v; return this }
  exponentialRampToValueAtTime(v) { this.value = v; return this }
  cancelScheduledValues() { return this }
}
class MockNode {
  constructor() { this._connections = [] }
  connect(n) { this._connections.push(n); return n }
  disconnect() { this._connections = [] }
}
class MockOsc extends MockNode {
  constructor() { super(); this.type = 'sine'; this.frequency = new MockParam(440); this.detune = new MockParam(0) }
  start() { this._started = true }
  stop() { this._stopped = true; if (typeof this.onended === 'function') this.onended() }
}
class MockGain extends MockNode { constructor() { super(); this.gain = new MockParam(1) } }
class MockFilter extends MockNode { constructor() { super(); this.type = 'lowpass'; this.frequency = new MockParam(500); this.Q = new MockParam(1) } }
class MockAudioContext {
  constructor() { this.state = 'running'; this.currentTime = 0; this.destination = new MockNode(); this.sampleRate = 48000 }
  createGain() { return new MockGain() }
  createOscillator() { return new MockOsc() }
  createBiquadFilter() { return new MockFilter() }
  async resume() { this.state = 'running' }
  async suspend() { this.state = 'suspended' }
}

function withMockAudio() {
  globalThis.window = { AudioContext: MockAudioContext }
  musicEngine._reset()
}
function withoutAudio() {
  delete globalThis.window
  musicEngine._reset()
}

check('presets are distinct, declared four, and well formed', () => {
  assert.equal(MUSIC_PRESETS.length, 4)
  const ids = MUSIC_PRESETS.map((p) => p.id)
  assert.equal(new Set(ids).size, 4, 'preset ids are unique')
  for (const p of MUSIC_PRESETS) {
    assert.ok(p.name && p.description, `${p.id} is documented`)
    assert.ok(p.events && p.events.length > 0, `${p.id} has events`)
    assert.ok(p.bpm > 0 && p.root > 0, `${p.id} has a tempo and root`)
  }
  const bpmSig = new Set(MUSIC_PRESETS.map((p) => p.bpm))
  assert.ok(bpmSig.size >= 3, 'presets are not renamed copies (varied tempos)')
})

await checkAsync('engine reports unsupported rather than throwing without Web Audio', async () => {
  withoutAudio()
  const res = await musicEngine.play('cosmic-drift')
  assert.equal(res.ok, false)
  assert.equal(res.errorCode, 'AUDIO_UNSUPPORTED')
})

await checkAsync('engine rejects an unknown track id', async () => {
  withMockAudio()
  const res = await musicEngine.play('/etc/passwd')
  assert.equal(res.ok, false)
  assert.equal(res.errorCode, 'UNKNOWN_TRACK')
  withoutAudio()
})

await checkAsync('engine plays, pauses, resumes, skips and stops cleanly', async () => {
  withMockAudio()
  const start = await musicEngine.play('cosmic-drift')
  assert.equal(start.ok, true)
  assert.equal(musicEngine.status, 'playing')
  assert.ok(musicEngine._timer, 'a scheduler is running while playing')

  const paused = await musicEngine.pause()
  assert.equal(paused.ok, true)
  assert.equal(musicEngine._timer, null, 'scheduler stops on pause')

  const resumed = await musicEngine.resume()
  assert.equal(resumed.ok, true)
  assert.equal(musicEngine.status, 'playing')

  const next = await musicEngine.next()
  assert.equal(next.ok, true)
  assert.notEqual(musicEngine.presetId, 'cosmic-drift', 'next advances the preset')

  const stopped = musicEngine.stop()
  assert.equal(stopped.ok, true)
  assert.equal(musicEngine.status, 'idle')
  assert.equal(musicEngine._timer, null)
  withoutAudio()
})

await checkAsync('playing the same track twice does not start a second loop', async () => {
  withMockAudio()
  await musicEngine.play('greenhouse')
  const timer1 = musicEngine._timer
  const again = await musicEngine.play('greenhouse')
  assert.equal(again.ok, true)
  assert.equal(musicEngine._timer, timer1, 'same scheduler, not a duplicate loop')
  musicEngine.stop()
  withoutAudio()
})

await checkAsync('switching presets tears down the previous voices', async () => {
  withMockAudio()
  await musicEngine.play('cosmic-drift')
  const before = musicEngine._pads.size
  await musicEngine.play('night-drive')
  assert.equal(musicEngine.presetId, 'night-drive')
  assert.equal(musicEngine.status, 'playing')
  assert.ok(before > 0 && musicEngine._pads.size > 0, 'new pads built for the new preset')
  assert.ok(musicEngine._voices.size < 200, 'note queue is bounded')
  musicEngine.stop()
  withoutAudio()
})

check('engine clamps volume to [0,1] and rejects non-finite input', () => {
  withMockAudio()
  assert.equal(musicEngine.setVolume(0.3).ok, true)
  assert.equal(musicEngine.getSnapshot().volume, 0.3)
  assert.equal(musicEngine.setVolume(5).volume, 1)
  assert.equal(musicEngine.setVolume(-3).volume, 0)
  const bad = musicEngine.setVolume(Number.NaN)
  assert.equal(bad.ok, false)
  assert.equal(bad.errorCode, 'INVALID_VOLUME')
  withoutAudio()
})

await checkAsync('music actions execute through the registry with valid args', async () => {
  withMockAudio()
  freshRegistry()
  const play = await REG.runAction('play_track', { track: 'focus-mode' })
  assert.equal(play.ok, true, 'play_track runs')
  assert.equal(play.data.label, 'Focus Mode')
  const vol = await REG.runAction('set_volume', { level: 0.4 })
  assert.equal(vol.ok, true)
  assert.equal(vol.data.volumePercent, 40)
  musicEngine.stop()
  withoutAudio()
})

await checkAsync('music actions reject invalid arguments before the handler runs', async () => {
  withMockAudio()
  freshRegistry()
  const badTrack = await REG.runAction('play_track', { track: 'not-a-track' })
  assert.equal(badTrack.ok, false)
  assert.equal(badTrack.errorCode, 'UNKNOWN_TRACK')
  const badVol = await REG.runAction('set_volume', { level: 4 })
  assert.equal(badVol.ok, false)
  assert.equal(badVol.errorCode, 'INVALID_VOLUME')
  withoutAudio()
})

check('music command parsing is deterministic and never invents a preset', () => {
  assert.deepEqual(CMD.parseActionProposal('play cosmic drift'), { actionId: 'play_track', args: { track: 'cosmic-drift' } })
  assert.deepEqual(CMD.parseActionProposal('play something relaxing'), { actionId: 'play_track', args: { track: 'cosmic-drift' } })
  assert.deepEqual(CMD.parseActionProposal('put on some night drive'), { actionId: 'play_track', args: { track: 'night-drive' } })
  assert.deepEqual(CMD.parseActionProposal('pause the music'), { actionId: 'pause_playback', args: {} })
  assert.deepEqual(CMD.parseActionProposal('resume playback'), { actionId: 'resume_playback', args: {} })
  assert.deepEqual(CMD.parseActionProposal('play the next track'), { actionId: 'next_track', args: {} })
  assert.deepEqual(CMD.parseActionProposal('set the volume to 30 percent'), { actionId: 'set_volume', args: { level: 0.3 } })
  assert.deepEqual(CMD.parseActionProposal('play something heavy'), { actionId: 'play_track', args: { track: 'cosmic-drift' } }, 'unknown mood falls back to a safe default')
  assert.equal(CMD.parseActionProposal('play a board game'), null, 'non-music play is not hijacked')
})

check('navigation commands still win where they should', () => {
  assert.deepEqual(CMD.parseActionProposal('take me to cosmos'), { actionId: 'navigate_to_world', args: { world: 'cosmos' } })
  assert.deepEqual(CMD.parseActionProposal('open the music lab'), { actionId: 'navigate_to_world', args: { world: 'music-lab' } })
  assert.equal(CMD.parseActionProposal('play the guitar'), null, 'does not hijack the Music Lab')
  assert.equal(CMD.parseActionProposal('navigate to http://evil.example.com'), null)
})

await checkAsync('the brain proposes music actions but never executes them itself', async () => {
  withMockAudio()
  freshRegistry()
  const r = await getReply('play something relaxing', { aiEnabled: false })
  assert.equal(r.kind, 'action')
  assert.equal(r.proposal.actionId, 'play_track')
  assert.equal(r.proposal.args.track, 'cosmic-drift')
  musicEngine.stop()
  withoutAudio()
})

// ---------------------------------------------------------------- report
reset()
resetListeners()

let failed = 0
for (const [ok, name] of results) {
  if (!ok) failed++
  console.log(`${ok ? '  PASS' : '  FAIL'}  ${name}`)
}
console.log(`\n  ${results.length - failed}/${results.length} passed`)
process.exit(failed ? 1 : 0)