'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const M = require(require('node:fs').existsSync(require('node:path').resolve(__dirname,'../app/model.js')) ? '../app/model.js' : '../app/src/main/assets/model.js')
const DAY = 86400000
const START = Date.UTC(2026, 0, 1, 14)

function setup(exerciseId = 'chest-press') {
  const state = M.createState()
  const x = M.ensureEquipment(state, 'alchemia', exerciseId, 'Maszyna X', 2.5)
  const y = M.ensureEquipment(state, 'suchanino', exerciseId, 'Maszyna Y', 5)
  function session(day, profile, weight, reps = 10, extras = {}) {
    const time = START + day * DAY
    const set = { weight, reps, done: true, ...extras }
    const item = {
      id: M.uid(), name: 'Trening', gymId: profile.gymId, planId: null,
      startedAt: time - 3600000, finishedAt: time,
      exercises: [{ exerciseId: profile.exerciseId, equipmentId: profile.id, sets: [set] }]
    }
    state.sessions.push(item)
    return item
  }
  function recommend(profile, day, reps = 10) {
    return M.recommend(state, {
      gymId: profile.gymId, equipmentId: profile.id, exerciseId: profile.exerciseId,
      reps, now: START + day * DAY
    })
  }
  return { state, x, y, session, recommend }
}

test('fresh install has genuine empty history and independent seed plans', () => {
  const original = M.createState()
  assert.equal(M.validateState(original), true)
  assert.equal(original.sessions.length, 0)
  assert.equal(original.equipment.length, 0)
  original.plans[0].exercises[0].reps = 99
  assert.equal(M.createState().plans[0].exercises[0].reps, 10)
})

test('incompatible reported effort does not produce a machine ratio', () => {
  const {x,y,session,recommend}=setup()
  session(0,x,35,10,{rir:5})
  session(1,y,70,10,{rir:0})
  session(20,y,80,10,{rir:0})
  assert.equal(recommend(x,21).source,'local')
})

test('body measurement imports use real dates and numeric values', () => {
  const value=M.createState()
  value.measurements=[{id:'weigh-in',kind:'weight',value:83.2,at:'2026-06-15'}]
  assert.ok(M.validateState(value))
  value.measurements[0].at='2026-02-31'
  assert.equal(M.validateState(value),false)
})

test('Polish decimal parser rejects partial numbers and coerced objects', () => {
  assert.equal(M.parseNumber(' 17,5 '), 17.5)
  for (const input of ['', null, [], NaN, Infinity, '3kg', '1,2,3', '0x12', '1e5']) {
    assert.equal(M.parseNumber(input), null)
  }
})

test('newer Y result transfers to X on a personal 35:70 calibration', () => {
  const { state, x, y, session, recommend } = setup()
  session(0, x, 35)
  session(1, y, 70)
  session(11, y, 80)
  const result = recommend(x, 12)
  assert.equal(result.source, 'transfer')
  assert.equal(result.confidence, 'low')
  assert.equal(result.weight, 40)
  assert.equal(result.pairs, 1)
  assert.equal(result.ratio, 0.5)
  assert.equal(M.validateState(JSON.parse(JSON.stringify(state))), true)
})

test('calibration works in both directions and prefers the freshest local training', () => {
  const { x, y, session, recommend } = setup()
  session(0, x, 35)
  session(1, y, 70)
  session(8, x, 40)
  assert.equal(recommend(y, 12).weight, 80)
  assert.equal(recommend(x, 12).source, 'local')
  assert.equal(recommend(x, 12).weight, 40)
})

test('absent equipment reference never borrows a load from another gym or exercise', () => {
  const { state, x, y, session, recommend } = setup()
  const similar = M.ensureEquipment(state, x.gymId, 'dumbbell-press')
  session(0, similar, 35)
  session(1, y, 70)
  assert.equal(recommend(x, 5).weight, null)
  const x2 = M.ensureEquipment(state, x.gymId, x.exerciseId, 'Druga maszyna')
  session(2, x2, 25)
  assert.equal(recommend(x, 5).weight, null)
  assert.equal(M.recommend(state, { gymId: x.gymId, exerciseId: x.exerciseId, reps: 10 }).weight, null)
})

test('replacement options preserve movement and put registered gym equipment first', () => {
  const { state, x } = setup()
  const alt = M.ensureEquipment(state, x.gymId, 'dumbbell-press')
  const options = M.substitutes(state, x.exerciseId, x.gymId)
  assert.equal(options[0].id, alt.exerciseId)
  assert.equal(options.some(ex => ex.id === 'leg-press' || ex.id === x.exerciseId), false)
})

test('unconfirmed, future, warmup, and drop sets cannot alter a suggestion', () => {
  const { x, y, session, recommend } = setup()
  session(0, x, 35)
  session(1, y, 400, 10, { done: false })
  session(2, y, 500, 10, { type: 'warmup' })
  session(3, y, 600, 10, { type: 'drop' })
  session(20, y, 1000)
  assert.equal(recommend(x, 8).source, 'local')
  assert.equal(recommend(x, 8).weight, 35)
})

test('only one nearby workout on X cannot yield several independent pairs', () => {
  const { x, y, session, recommend } = setup()
  session(0, x, 35)
  session(1, y, 70)
  session(2, y, 70)
  session(3, y, 70)
  session(4, y, 80)
  assert.equal(recommend(x, 5).pairs, 1)
})

test('accumulated consistent pairs raise confidence and ignore isolated outliers', () => {
  const { x, y, session, recommend } = setup()
  for (const [i, load] of [70, 70, 70, 130].entries()) {
    session(21 * i, x, 35)
    session(21 * i + 1, y, load)
  }
  session(70, y, 80)
  const result = recommend(x, 72)
  assert.equal(result.pairs, 3)
  assert.equal(result.confidence, 'high')
  assert.equal(result.weight, 40)
})

test('contradictory independent ratios give local fallback', () => {
  const { x, y, session, recommend } = setup()
  session(0, x, 35)
  session(1, y, 70)
  session(21, x, 35)
  session(22, y, 140)
  session(30, y, 90)
  assert.equal(recommend(x, 32).source, 'local')
})

test('sessions weeks apart and stale sources cannot calibrate the machines', () => {
  const { x, y, session, recommend } = setup()
  session(0, x, 35)
  session(20, y, 70)
  assert.equal(recommend(x, 21).source, 'local')
  session(21, x, 35)
  session(30, y, 80)
  assert.equal(recommend(x, 90).source, 'local')
  assert.equal(recommend(x, 90).confidence, 'low')
})

test('rep conversion is bounded, exact reps preferred, and plates use the configured steps', () => {
  const { x, session, recommend } = setup()
  const entry = session(0, x, 30, 12)
  assert.equal(recommend(x, 2, 10).weight, 32.5)
  assert.equal(recommend(x, 2, 25).weight, null)
  entry.exercises[0].sets.push({ weight: 26.25, reps: 10, done: true })
  assert.equal(recommend(x, 2, 10).weight, 25)
  x.minWeight = 1.25
  assert.equal(recommend(x, 2, 10).weight, 26.25)
})

test('bodyweight movements keep reps and never convert fictitious kilograms', () => {
  const { x, y, session, recommend } = setup('push-up')
  session(0, x, 15)
  session(1, y, 30)
  assert.equal(recommend(x, 3).weight, null)
})

test('backup roundtrip includes active drafts, deleted plan references and custom exercises', () => {
  const { state, x, session } = setup()
  const newExercise = { id: M.uid(), name: 'Moje ćwiczenie', group: 'Barki', pattern: 'lateral-raise', type: 'machine' }
  state.exercises.push(newExercise)
  const saved = session(0, x, 30)
  saved.planId = 'deleted-plan'
  state.active = { id: M.uid(), name: 'Rozpoczęty', gymId: x.gymId, planId: null, startedAt: START + DAY,
    exercises: [{ exerciseId: newExercise.id, equipmentId: '', sets: [{ weight: '', reps: '12', done: false }]}] }
  assert.equal(M.validateState(JSON.parse(JSON.stringify(state))), true)
  state.active.exercises[0].sets[0].weight = ','
  assert.equal(M.validateState(state), true)
  state.active.exercises[0].sets[0].done = true
  assert.equal(M.validateState(state), false)
})

test('backup rejects cross-gym equipment, duplicated indices and malformed top-level input', () => {
  const { state, x, y, session } = setup()
  for (const value of [null, [], 'text', {}, { version: 1 }]) assert.equal(M.validateState(value), false)
  assert.equal(M.validateState({...M.createState(), gyms:[]}), false)
  const s = session(0, x, 40)
  s.exercises[0].equipmentId = y.id
  assert.equal(M.validateState(state), false)
  s.exercises[0].equipmentId = x.id
  state.gyms.push(state.gyms[0])
  assert.equal(M.validateState(state), false)
})
