'use strict';
const test = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path');
const app = fs.existsSync(path.resolve(__dirname, '../app/calendar.js'))
  ? '../app/'
  : '../app/src/main/assets/';
const C = require(app + 'calendar.js');
const ms = (d, h) => +new Date(2024, 1, d, h);
const row = (id, ...reps) => ({
  exerciseId: id,
  sets: reps.map((r) => ({ done: r > 0, reps: Math.abs(r), weight: 35 }))
});
function session(id, day, h, ...exercises) {
  const end = ms(day, h);
  return { id, exercises, startedAt: end - 45 * 60000, finishedAt: end };
}
test('Gregorian month uses Monday as first column and includes leap days and year rollover', () => {
  const cells = C.monthCells('2024-02');
  assert.deepEqual(cells.slice(0, 4), [null, null, null, '2024-02-01']);
  assert.equal(cells.length, 35);
  assert.equal(cells.filter(Boolean).at(-1), '2024-02-29');
  assert.equal(C.monthCells('2025-02').filter(Boolean).length, 28);
  assert.equal(C.monthCells('2021-02').length, 28);
  assert.equal(C.monthCells('2026-08').length, 42);
  assert.equal(C.shiftMonth('2024-01', -1), '2023-12');
  assert.equal(C.shiftMonth('2025-12', 1), '2026-01');
  assert.deepEqual(C.monthCells('2024-13'), []);
  assert.equal(C.localDay(null), '');
  assert.equal(C.localDay(ms(1, 0)), '2024-02-01');
});
test('Calendar retains multiple workouts in local day order, original sets and filter totals', () => {
  const sessions = [
    session('late', 29, 20, row('press', 3, 4), row('row', 6)),
    session('early', 29, 7, row('press', 8, -9)),
    session('yesterday', 28, 17, row('row', 7)),
    session('next', 30, 12, row('curl', 9)),
    session('empty', 3, 6, row('empty', -10))
  ];
  sessions[0].exercises[0].sets[0].type = 'warmup';
  const result = C.activity(sessions, '2024-02');
  assert.equal(result.days.size, 2);
  const day = result.days.get('2024-02-29');
  assert.deepEqual(
    day.sessions.map((x) => x.session.id),
    ['early', 'late']
  );
  assert.equal(day.sessions[1].entries[0].sets[0].type, 'warmup');
  assert.deepEqual(result.totals, { sessions: 3, sets: 5, reps: 28 });
  assert.deepEqual(result.movements.get('row').dates, new Set(['2024-02-28', '2024-02-29']));
  assert.equal(result.options.has('curl'), true);
  assert.equal(result.options.has('empty'), false);
  const filtered = C.activity(sessions, '2024-02', 'press');
  assert.deepEqual(filtered.totals, { sessions: 2, sets: 3, reps: 15 });
  assert.equal(filtered.latest, '2024-02-29');
  assert.equal(filtered.days.size, 1);
  assert.equal(filtered.days.get('2024-02-29').sessions[0].entries[0].sets.length, 1);
});
test('Cross-midnight session belongs to local completion date; default selects an available day', () => {
  const s = session('midnight', 20, 0, row('squat', 9));
  const data = C.activity([s], '2024-02');
  assert.equal(C.localDay(s.startedAt), '2024-02-19');
  assert.equal(data.days.has('2024-02-20'), true);
  assert.equal(C.selectedDay(data.days, '2024-02', '', '2024-02-22'), '2024-02-20');
  assert.equal(C.selectedDay(data.days, '2024-02', '2024-02-14', '2024-02-22'), '2024-02-14');
  assert.equal(C.selectedDay(new Map(), '2024-02', '2024-02-30', '2024-02-22'), '2024-02-22');
  assert.equal(C.selectedDay(new Map(), '2024-03', '', '2024-02-22'), '2024-03-01');
});
