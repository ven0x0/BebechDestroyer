'use strict';
const test = require('node:test'),
  assert = require('node:assert/strict');
const fs = require('node:fs'),
  path = require('node:path');
const app = fs.existsSync(path.resolve(__dirname, '../app/routines.js'))
  ? '../app/'
  : '../app/src/main/assets/';
const M = require(app + 'model.js'),
  atlas = require(app + 'atlas.js'),
  R = require(app + 'routines.js');
const importPlan = (state, row) => R.read(JSON.stringify({ name: 'Nowy plan', exercises: [row] }), state);
test('exact legacy targets, practical ranges and invalid boundaries', () => {
  assert.deepEqual(R.target({ reps: 10 }), { reps: 10 });
  for (const row of [{ reps: '5-8' }, { reps: '5 – 8' }, { repsMin: 5, repsMax: 8 }])
    assert.deepEqual(R.target(row), { reps: 5, repsMin: 5, repsMax: 8 });
  for (const row of [
    { reps: '5–4' },
    { reps: 0 },
    { reps: 1.5 },
    { repsMin: 4 },
    { repsMin: '5', repsMax: 1001 },
    { reps: '2x4' }
  ])
    assert.equal(R.target(row), null);
});
test('import preview resolves an exercise in Polish, English or by stable id', () => {
  const state = M.createState(),
    ex = state.exercises.find((e) => e.id === 'chest-press');
  for (const name of [ex.name, atlas.aliases(state, ex).find((n) => n !== ex.name && n !== ex.id), ex.id]) {
    assert.equal(importPlan(state, { name, sets: 3, reps: '5–8' }).plans[0].exercises[0].exerciseId, ex.id);
  }
  assert.equal(state.plans.length, 3);
  const raw = R.read('\uFEFF' + R.example, state);
  assert.equal(raw.plans[0].exercises.length, 2);
});
test('multiple imports append, never reuse supplied plan ids or change session references', () => {
  const s = M.createState(),
    src = s.plans[0];
  const raw = R.write(s, [src, src]),
    result = R.read(raw, s);
  assert.deepEqual(
    result.plans.map((p) => p.name),
    [src.name, src.name]
  );
  assert.notEqual(result.plans[0].id, src.id);
  assert.notEqual(result.plans[1].id, result.plans[0].id);
  assert.deepEqual(result.plans[0].exercises, src.exercises);
  assert.equal(s.plans.length, 3);
});
test('custom exercise definitions, muscle roles, language, ranges and supersets travel with plan', () => {
  const state = M.createState(),
    custom = {
      id: 'user-row',
      name: 'Moje wiosło',
      nameEn: 'My row',
      group: 'Plecy',
      type: 'machine',
      pattern: 'horizontal-pull',
      instructions: 'Oprzyj mostek na poduszce.\nProwadź łokcie w tył.',
      techniqueId: 'machine-row',
      muscles: { primary: ['chest'], secondary: ['triceps'], stabilizer: [] }
    };
  state.exercises.push(custom);
  const source = {
    id: 'power',
    name: 'Plecy',
    notes: 'Wtorek',
    exercises: [
      { exerciseId: 'user-row', sets: 3, reps: 6, repsMin: 6, repsMax: 9, supersetId: 'pair' },
      { exerciseId: 'seated-row', sets: 2, reps: 8, supersetId: 'pair' }
    ]
  };
  const dest = M.createState(),
    batch = R.read(R.write(state, [source]), dest);
  assert.deepEqual(batch.customExercises, [custom]);
  assert.equal(batch.plans[0].notes, 'Wtorek');
  assert.equal(batch.plans[0].exercises[0].repsMax, 9);
  assert.equal(batch.plans[0].exercises[1].supersetId, batch.plans[0].exercises[0].supersetId);
  dest.exercises.push(...batch.customExercises);
  dest.plans.push(...batch.plans);
  assert.ok(M.validateState(dest));
  assert.equal(R.read(R.write(dest, batch.plans), dest).customExercises.length, 0);
});
test('a custom-id collision creates an independent local exercise', () => {
  const s = M.createState();
  s.exercises.push({
    id: 'custom1',
    name: 'Istniejące',
    group: 'Plecy',
    pattern: 'custom1',
    type: 'machine'
  });
  const raw = {
    plans: [{ name: 'Plan', exercises: [{ exerciseId: 'custom1', sets: 4, reps: 12 }] }],
    customExercises: [
      { id: 'custom1', name: 'Pracujące inaczej', group: 'Uda', pattern: 'custom1', type: 'machine' }
    ]
  };
  const batch = R.read(JSON.stringify(raw), s),
    item = batch.customExercises[0];
  assert.notEqual(item.id, 'custom1');
  assert.equal(item.id, item.pattern);
  assert.equal(item.id, batch.plans[0].exercises[0].exerciseId);
});
test('same-ID imports preserve each explicit guide variation and reuse the same local exercise on retry', () => {
  const state = M.createState();
  const base = {
    id: 'wlasny-ruch',
    name: 'Mój ruch',
    group: 'Plecy',
    pattern: 'wlasny-ruch',
    type: 'machine',
    instructions: 'Pierwsza wskazówka',
    techniqueId: 'machine-row'
  };
  state.exercises.push(base);
  const variants = [
    { ...base, instructions: 'Druga wskazówka\nDrugi krok' },
    { ...base, techniqueId: 'seated-row' },
    { ...base, instructions: '', techniqueId: '' }
  ];
  const makePlan = (def) =>
    JSON.stringify({
      customExercises: [def],
      plans: [{ name: 'Plan', exercises: [{ exerciseId: base.id, sets: 2, reps: 8 }] }]
    });
  for (const variant of variants) {
    const raw = makePlan(variant);
    const batch = R.read(raw, state);
    assert.equal(batch.customExercises.length, 1);
    const added = batch.customExercises[0];
    assert.notEqual(added.id, base.id);
    assert.equal(added.pattern, added.id);
    assert.equal(batch.plans[0].exercises[0].exerciseId, added.id);
    assert.equal(added.instructions || '', variant.instructions);
    assert.equal(added.techniqueId || '', variant.techniqueId);
    state.exercises.push(added);
    const again = R.read(raw, state);
    assert.equal(again.customExercises.length, 0);
    assert.equal(again.plans[0].exercises[0].exerciseId, added.id);
  }
  const legacy = { ...base };
  delete legacy.instructions;
  delete legacy.techniqueId;
  assert.equal(R.read(makePlan(legacy), state).plans[0].exercises[0].exerciseId, base.id);
});
test('invalid custom technique is rejected before matching an existing exercise', () => {
  const state = M.createState();
  const ex = {
    id: 'uz',
    name: 'Moje ćwiczenie',
    group: 'Plecy',
    pattern: 'horizontal-pull',
    type: 'machine'
  };
  state.exercises.push(ex);
  for (const fields of [
    { instructions: {} },
    { instructions: 'x'.repeat(4001) },
    { techniqueId: 'uz' },
    { techniqueId: 1 }
  ]) {
    const raw = JSON.stringify({
      customExercises: [{ ...ex, ...fields }],
      plans: [{ name: 'P', exercises: [{ exerciseId: 'uz', sets: 1, reps: 5 }] }]
    });
    assert.throws(() => R.read(raw, state), /instrukcję/);
  }
});
test('an invalid exercise, malformed range, backup, ambiguous name or a broken second plan commits nothing', () => {
  const s = M.createState(),
    prior = JSON.stringify(s);
  for (const row of [
    { name: 'Nieznane', sets: 3, reps: 10 },
    { name: 'chest-press', sets: 0, reps: 10 },
    { name: 'chest-press', sets: 2, reps: '10–5' }
  ])
    assert.throws(() => importPlan(s, row));
  assert.throws(() => R.read(JSON.stringify(s), s));
  assert.throws(() => R.read('{"name"', s));
  assert.throws(() => R.read(JSON.stringify([s.plans[0], { name: 'broken', exercises: [] }]), s));
  assert.equal(JSON.stringify(s), prior);
  s.exercises.push({ ...s.exercises[0], id: 'another' });
  assert.throws(() => importPlan(s, { name: s.exercises[0].name, sets: 3, reps: 5 }), /kilku/);
});
