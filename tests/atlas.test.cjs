'use strict';
const test = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path');
const root = fs.existsSync(path.resolve(__dirname, '../app/atlas.js'))
  ? '../app/'
  : '../app/src/main/assets/';
const M = require(root + 'model.js'),
  A = require(root + 'atlas.js');
test('every built-in has a distinct English name and one or more primary muscles', () => {
  const s = M.createState(),
    unique = new Set();
  for (const e of s.exercises) {
    const info = A.describe(s, e),
      names = A.aliases(s, e);
    assert.equal(info.source, 'catalogue', e.id);
    assert.equal(A.name(s, e.id), e.name);
    assert.ok(
      info.muscles.some((m) => m.role === 'primary'),
      e.id
    );
    assert.equal(new Set(info.muscles.map((m) => m.id)).size, info.muscles.length);
    assert.ok(names.includes(e.name));
    assert.ok(names.length >= 2);
    const english = A.name({ ...s, exerciseLanguage: 'en' }, e.id);
    assert.notEqual(english, e.name);
    unique.add(english);
  }
  assert.equal(unique.size, s.exercises.length);
});
test('every highlighted region in the list has a matching body-map target', () => {
  const s = M.createState();
  for (const e of s.exercises) {
    const html = A.render(s, e.id);
    assert.match(html, /Przód sylwetki/);
    assert.match(html, /Tył sylwetki/);
    for (const { id } of A.describe(s, e.id).muscles) {
      assert.ok(html.includes(`data-atlas-region="${id}"`), `${e.id} ${id} diagram`);
      assert.ok(html.includes(`data-atlas-pick="${id}"`), `${e.id} ${id} accessible target`);
    }
  }
});
test('equipment position changes the profile of calf, press and unsupported row variants', () => {
  const s = M.createState(),
    role = (ex, id) => A.describe(s, ex).muscles.find((m) => m.id === id)?.role;
  assert.equal(role('seated-calf', 'gastrocnemius'), 'secondary');
  assert.equal(role('calf-raise', 'gastrocnemius'), 'primary');
  assert.equal(role('barbell-row', 'erectors'), 'stabilizer');
  assert.equal(role('machine-row', 'erectors'), undefined);
  assert.equal(role('push-up', 'serratus'), 'secondary');
});
test('custom names, patterns, role overrides and truly unknown movements behave independently', () => {
  const s = M.createState(),
    ex = { id: 'own', name: 'Moje ćwiczenie', nameEn: 'My exercise', pattern: 'horizontal-press' };
  s.exercises.push(ex);
  s.exerciseLanguage = 'en';
  assert.equal(A.name(s, 'own'), 'My exercise');
  assert.deepEqual(A.aliases(s, ex), [ex.name, ex.nameEn]);
  assert.equal(A.describe(s, ex).source, 'pattern');
  assert.match(A.render(s, ex), /na podstawie wzorca/);
  ex.muscles = { primary: ['quad'], secondary: ['quad', 'hams', '<svg>'], stabilizer: ['bad'] };
  const own = A.describe(s, ex);
  assert.equal(own.source, 'custom');
  assert.deepEqual(
    own.muscles.map((m) => m.id),
    ['quad', 'hams']
  );
  delete ex.muscles;
  delete ex.nameEn;
  ex.pattern = 'unknown';
  assert.equal(A.name(s, ex), ex.name);
  assert.equal(A.describe(s, ex).source, 'unmapped');
  assert.ok(!A.render(s, ex).includes('atlas-pair'));
});
test('prototype keys are never interpreted as catalogue exercises, patterns or muscle ids', () => {
  const s = M.createState(),
    ex = { id: '__proto__', name: '<svg>', pattern: 'constructor', muscles: { primary: ['__proto__'] } };
  assert.equal(A.describe(s, ex).source, 'unmapped');
  assert.ok(!A.render(s, ex).includes('<svg>'));
});
test('read-only thumbnails can select the side where a primary muscle is visible', () => {
  const s = M.createState(),
    thumb = A.figure(s, 'leg-curl', 'auto');
  assert.match(thumb, /^<svg class="atlas-thumbnail" aria-hidden="true"/);
  assert.match(thumb, /data-atlas-region="hams"/);
  assert.doesNotMatch(thumb, /<button|<figcaption/);
  assert.equal(A.figure(s, 'unknown'), '');
  assert.ok(A.aliases(s, 'bench-press').includes('Bench Press'));
});
