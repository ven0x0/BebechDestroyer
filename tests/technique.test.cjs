const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const dir = fs.existsSync(path.resolve(__dirname, '../app/technique.js'))
  ? '../app'
  : '../app/src/main/assets';
const model = require(dir + '/model.js');
const technique = require(dir + '/technique.js');

test('every catalogue exercise has three distinct phases and its own technique cue', () => {
  const state = model.createState(),
    steps = new Set(),
    cues = new Set();
  assert.equal(state.exercises.length, 250);
  for (const ex of state.exercises) {
    assert.ok(technique.has(ex.id), ex.id);
    const guide = technique.get(state, ex.id);
    assert.equal(guide.kind, 'catalogue');
    assert.equal(guide.modelId, ex.id);
    assert.equal(guide.steps.length, 3);
    for (const line of guide.steps) {
      assert.equal(typeof line, 'string');
      assert.ok(line.length > 20, ex.id);
      if (!ex.id.startsWith("atlas-")) assert.ok(!steps.has(line), ex.id);
      steps.add(line);
    }
    assert.ok(!cues.has(guide.cue));
    cues.add(guide.cue);
    const html = technique.render(state, ex.id);
    assert.match(html, /<h2>Jak wykonać ćwiczenie<\/h2>/);
    assert.equal((html.match(/<li>/g) || []).length, 3);
    assert.ok(html.includes('Powrót'));
  }
});
test('similar-looking leg exercises use the correct seated, lying and cable setups', () => {
  const s = model.createState();
  assert.match(technique.get(s, 'leg-curl').steps[0], /Usiądź/);
  assert.match(technique.get(s, 'lying-leg-curl').steps[0], /Połóż się przodem/);
  assert.match(technique.get(s, 'cable-leg-curl').steps[0], /Stań przodem do bloczka/);
  assert.match(technique.get(s, 'cable-leg-extension').steps[0], /Usiądź tyłem do bloczka/);
  assert.match(technique.get(s, 'triceps-machine').steps[0], /podparciem ramion/);
});
test('custom text is escaped, newlines survive, explicit model works and arbitrary patterns are not inferred', () => {
  const s = model.createState();
  const own = {
    id: 'x',
    name: 'Wariant',
    pattern: 'horizontal-press',
    techniqueId: 'chest-press',
    instructions: '<img src=x onerror="oops">\nPowrót & reset'
  };
  s.exercises.push(own);
  let html = technique.render(s, 'x');
  assert.equal(technique.get(s, 'x').kind, 'custom');
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /&lt;img/);
  assert.match(html, /<p>Powrót &amp; reset<\/p>/);
  delete own.instructions;
  html = technique.render(s, 'x');
  assert.equal(technique.get(s, 'x').kind, 'linked');
  assert.match(html, /Ruch wzorcowy/);
  assert.deepEqual(technique.get(s, 'x').steps, technique.get(s, 'chest-press').steps);
  delete own.techniqueId;
  assert.equal(technique.get(s, 'x'), null);
  assert.match(technique.render(s, 'x'), /własnego ćwiczenia/);
  for (const key of ['missing', 'constructor', '__proto__', 'toString']) {
    own.techniqueId = key;
    assert.equal(technique.get(s, 'x'), null);
    assert.equal(technique.has(key), false);
  }
});
test('backup validation preserves legacy exercises, explicit models and multiline custom instructions', () => {
  const state = model.createState();
  const own = { id: 'own', name: 'Moje ćwiczenie', group: 'Plecy', pattern: 'own', type: 'machine' };
  state.exercises.push(own);
  assert.equal(model.validateState(state), true);
  own.instructions = 'Dosuń siedzisko.\nZapisz wybrane ustawienie.';
  own.techniqueId = 'machine-row';
  const copy = JSON.parse(JSON.stringify(state));
  assert.equal(model.validateState(copy), true);
  assert.deepEqual(copy.exercises.at(-1), own);
  assert.equal(technique.get(copy, 'own').kind, 'custom');
  for (const fields of [
    { instructions: false },
    { instructions: 'x'.repeat(4001) },
    { techniqueId: 'own' },
    { techniqueId: ['machine-row'] }
  ]) {
    copy.exercises[copy.exercises.length - 1] = { ...own, ...fields };
    assert.equal(model.validateState(copy), false);
  }
});
