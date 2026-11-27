'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const assets = fs.existsSync(path.join(__dirname, '../app/model.js')) ? '../app' : '../app/src/main/assets';
const M = require(assets + '/model.js');
const A = require(assets + '/analytics.js');
const L = require(assets + '/live.js');
const { seedLegacyDiary } = require('./legacy-diary.cjs');
const day = 86400000;
const start = Date.UTC(2025, 0, 1, 12);
const work = (weight, reps = 10, type = 'normal', done = true) => ({ weight, reps, type, done });
const row = (profile, ...sets) => ({ exerciseId: profile.exerciseId, equipmentId: profile.id, sets });

function fixture(offset = 9) {
  const state = seedLegacyDiary(M.createState());
  const a = M.ensureEquipment(state, 'alchemia', 'chest-press', 'Maszyna A', 0.5);
  const b = M.ensureEquipment(state, 'suchanino', 'chest-press', 'Maszyna B', 1);
  function save(id, offset, profile, set) {
    const t = start + offset * day;
    state.sessions.push({
      id,
      name: id,
      startedAt: t - 1800000,
      finishedAt: t,
      planId: 'upper-a',
      gymId: profile.gymId,
      exercises: [row(profile, set)]
    });
  }
  save('first', 0, a, work(35));
  save('second', 1, b, work(70));
  const now = start + offset * day;
  state.active = {
    id: 'active',
    name: 'Aktywny',
    startedAt: now - 3600000,
    planId: 'upper-a',
    gymId: b.gymId,
    exercises: [row(b)]
  };
  return { state, a, b, active: state.active, save, now };
}

test('live calibrated tonnage equals the saved chart, including drop sets but excluding pending and warmup sets', () => {
  const { state, active, now } = fixture();
  active.exercises[0].sets = [
    work(80),
    work(60, 6, 'drop'),
    work(99, 15, 'warmup'),
    work(500, 30, 'normal', false)
  ];
  const snapshot = JSON.stringify(state);
  const live = A.sessionSummary(state, active, now);
  assert.deepEqual(L.volumeReadout(live), { amount: '580', workingSets: 2, note: '' });
  assert.equal(live.translatedSets, 2);
  assert.equal(JSON.stringify(state), snapshot);
  assert.equal(A.planSeries(state, 'upper-a').points.length, 2);
  const saved = { ...active, finishedAt: now };
  state.sessions.push(saved);
  const point = A.planSeries(state, active.planId).points.at(-1);
  assert.deepEqual(live, A.sessionSummary(state, saved));
  for (const key of Object.keys(live)) assert.deepEqual(point[key], live[key], key);
});

test('undo, changing split equipment rows and restoring an active workout recalculate immediately', () => {
  const { state, active, now, b } = fixture();
  const c = M.ensureEquipment(state, b.gymId, b.exerciseId, 'Inne stanowisko', 1);
  active.exercises = [row(b, work(80)), row(c, work(160, 10, 'normal', false))];
  const stats = () => A.sessionSummary(state, active, now);
  assert.equal(stats().volume, 400);
  active.exercises[1].sets[0].done = true;
  const withBoth = { ...state, sessions: [...state.sessions, { ...active, finishedAt: now }] };
  assert.equal(stats().volume, A.planSeries(withBoth, active.planId).points.at(-1).value);
  assert.equal(stats().translatedSets, 2);
  assert.ok(stats().volume > 400 && stats().volume < 2400);
  assert.equal(active.exercises[0].equipmentId, b.id);
  assert.equal(active.exercises[1].equipmentId, c.id);
  active.exercises[1].sets[0].done = false;
  assert.equal(stats().volume, 400);
  const restored = JSON.parse(JSON.stringify(state));
  assert.deepEqual(A.sessionSummary(restored, restored.active, now), stats());
  active.exercises[0].sets[0].done = false;
  assert.deepEqual(L.volumeReadout(stats()), { amount: '0', workingSets: 0, note: '' });
});

test('uncalibrated sets stay visible as missing and mixed partial totals keep a bodyweight note', () => {
  const { state, active, now, b } = fixture(250);
  active.exercises = [row(b, work(80))];
  let report = L.volumeReadout(A.sessionSummary(state, active, now));
  assert.equal(report.amount, '—');
  assert.equal(report.workingSets, 1);
  assert.match(report.note, /kalibracji/);
  const push = M.ensureEquipment(state, b.gymId, 'push-up');
  active.exercises.push(row(push, work(0, 12), work(5, 7)), row(b, work(0, 6)));
  report = L.volumeReadout(A.sessionSummary(state, active, now));
  assert.equal(report.amount, '35');
  assert.equal(report.workingSets, 4);
  assert.match(report.note, /częściowa/);
  assert.match(report.note, /masą ciała/);
  active.exercises = [row(push, work(0, 12))];
  assert.equal(L.volumeReadout(A.sessionSummary(state, active, now)).amount, '0');
});

test('batch calendar summaries learn from earlier nonselected workouts and exclude future sessions', () => {
  const { state, save, b, now } = fixture();
  save('selected', 8, b, work(80));
  save('future', 12, b, work(90));
  const selected = state.sessions.slice(2);
  const batch = A.sessionSummaries(state, selected, now);
  assert.deepEqual([...batch.keys()], ['selected']);
  assert.equal(batch.get('selected').volume, 400);
  const expected = A.planSeries(state, 'upper-a').points;
  for (const [id, stats] of A.sessionSummaries(state))
    assert.equal(stats.volume, expected.find((p) => p.id === id).volume);
  assert.equal(A.sessionSummaries(state, []).size, 0);
});

test('session maps distinguish planned and completed sets and group shared muscles by their strongest role', () => {
  const { state, active, b } = fixture();
  const triceps = M.ensureEquipment(state, b.gymId, 'triceps-pushdown');
  active.exercises = [
    row(b, work(80, 5, 'normal', false), work(75, 9, 'warmup')),
    row(triceps, work(20, 8, 'drop', false)),
    row(b, work(35, 8, 'failure', false))
  ];
  const planned = L.muscleProfile(state, active, 'planned');
  assert.equal(planned.mode, 'planned');
  assert.equal(planned.exerciseCount, 2);
  assert.equal(planned.setCount, 3);
  assert.deepEqual(
    planned.muscles.find((m) => m.id === 'triceps'),
    {
      id: 'triceps',
      label: 'Trójgłowy ramienia',
      role: 'primary',
      sets: 3,
      weightedSets: 2
    }
  );
  const empty = L.muscleProfile(state, active);
  assert.equal(empty.mode, 'performed');
  assert.equal(empty.setCount, 0);
  assert.deepEqual(empty.muscles, []);
  assert.match(L.musclePanel(state, active), /class="dist-empty"/);
  active.exercises[0].sets[0].done = true;
  const performed = L.muscleProfile(state, active);
  assert.equal(performed.mode, 'performed');
  assert.equal(performed.setCount, 1);
  assert.equal(performed.muscles.find((m) => m.id === 'triceps').role, 'secondary');
  assert.ok(!performed.muscles.some((m) => m.id === 'grip'));
  assert.equal(L.muscleProfile(state, active, 'planned').setCount, 3);
  active.exercises[1].sets[0].done = true;
  assert.equal(L.muscleProfile(state, active).muscles.find((m) => m.id === 'triceps').sets, 2);
  assert.deepEqual(Object.fromEntries(L.muscleProfile(state, active).setsByGroup), {
    Klata: 1, Barki: 0.5, Triceps: 1.5, Przedramiona: 0.125
  });
  const panel = L.musclePanel(state, active);
  const names = [...panel.matchAll(/class="dist-name">([^<]+)</g)].map(match => match[1]);
  assert.deepEqual(names, ['Triceps', 'Klata', 'Barki', 'Przedramiona']);
  assert.match(panel, /class="dist-total">1,5</);
  assert.match(panel, /class="dist-total">0,125</);
  assert.match(panel, /class="dist-value">0,5</);
});

test('a group counts each working set once even when exercises use overlapping or different muscles', () => {
  const { state, active } = fixture();
  state.exercises.push(
    { id: 'front-and-side', muscles: { primary: ['frontDelt'], secondary: ['sideDelt'] } },
    { id: 'rear-only', muscles: { primary: ['rearDelt'] } }
  );
  active.exercises = [
    { exerciseId: 'front-and-side', sets: [work(5), work(5, 8, 'warmup')] },
    { exerciseId: 'rear-only', sets: [work(5), work(5, 8, 'normal', false)] },
    { exerciseId: 'front-and-side', sets: [work(6, 8, 'drop')] }
  ];
  const done = L.muscleProfile(state, active, 'performed');
  assert.deepEqual([...done.setsByGroup], [['Barki', 3]]);
  assert.deepEqual(Object.fromEntries(done.muscles.map(m => [m.id, m.sets])), { frontDelt: 2, sideDelt: 2, rearDelt: 1 });
  assert.deepEqual(Object.fromEntries(done.muscles.map(m => [m.id, m.weightedSets])), { frontDelt: 2, sideDelt: 1, rearDelt: 1 });
  assert.equal(L.muscleProfile(state, active, 'planned').setsByGroup.get('Barki'), 4);
  assert.match(L.musclePanel(state, active), /class="dist-total">3</);
  active.exercises[2].sets[0].done = false;
  assert.equal(L.muscleProfile(state, active, 'performed').setsByGroup.get('Barki'), 2);
});

test('two labeled silhouettes, accessible map controls, unmapped movements and long workout durations', () => {
  const { state, active, b } = fixture();
  active.exercises = [row(b, work(80))];
  let html = L.musclePanel(state, active);
  assert.match(html, /aria-label="Przód sylwetki"/);
  assert.match(html, /aria-label="Tył sylwetki"/);
  assert.match(html, /data-mode="performed" aria-pressed="true"/);
  assert.match(html, /data-atlas-region="chest"/);
  state.exercises.push({ id: 'custom-no-map', name: 'Własny ruch' });
  active.exercises = [{ exerciseId: 'custom-no-map', sets: [work(20)] }];
  html = L.musclePanel(state, active);
  assert.match(html, /bez przypisanej mapy/);
  assert.doesNotMatch(html, /data-atlas-region=/);
  assert.doesNotMatch(html, /class="dist-group"/);
  assert.deepEqual([0, -3, 59.9, 3599, 3600, 40025].map(L.clock), [
    '00:00',
    '00:00',
    '00:59',
    '59:59',
    '1:00:00',
    '11:07:05'
  ]);
});
