const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const dir = fs.existsSync(path.join(__dirname, '../app/demos.js')) ? '../app' : '../app/src/main/assets';
const demos = require(dir + '/demos.js');
const model = require(dir + '/model.js');

test('all catalogue entries have animated finite geometry, stable framing and manual controls', () => {
  const state = model.createState();
  assert.equal(state.exercises.length, 270);
  assert.deepEqual([...demos.ids].sort(), state.exercises.map((ex) => ex.id).sort());
  const distinct = new Set();
  for (const ex of state.exercises) {
    assert.ok(demos.has(state, ex.id), ex.id);
    const html = demos.render(state, ex.id);
    assert.ok(html.includes(`data-demo-card="${ex.id}"`), ex.id);
    const box = html
      .match(/class="dm-scene"[^>]*viewBox="([^"]+)"/)[1]
      .split(' ')
      .map(Number);
    assert.ok(box.every(Number.isFinite) && box.length === 4 && box[2] > 40 && box[3] > 40, ex.id);
    for (const action of ['play', 'speed', 'start', 'end'])
      assert.ok(html.includes(`data-demo-action="${action}"`), ex.id);
    assert.match(html, /data-demo-seek[^>]*type="range"/);
    assert.doesNotMatch(html, /<animate|<video|https?:\/\//);
    const phases = new Set();
    for (const t of [0, 0.38, 1]) {
      const frame = demos.frameAt(ex.id, t);
      assert.match(frame, /<polygon points=/, ex.id);
      assert.match(frame, /<ellipse /, ex.id);
      assert.doesNotMatch(frame, /NaN|undefined|Infinity/, ex.id);
      phases.add(frame);
      if (!ex.id.startsWith("atlas-")) assert.ok(!distinct.has(frame), `identical anatomy and equipment for ${ex.id} at ${t}`);
      distinct.add(frame);
    }
    assert.equal(phases.size, 3, ex.id);
  }
});

test('own exercises use an explicit known model and ignore pattern-only matches', () => {
  const state = model.createState();
  const own = { id: 'own', name: 'Moje', pattern: 'horizontal-press', techniqueId: 'bench-press' };
  state.exercises.push(own);
  assert.equal(demos.render(state, own.id), demos.render(state, 'bench-press'));
  assert.equal(demos.thumbnail(state, own.id), demos.thumbnail(state, 'bench-press'));
  assert.match(demos.thumbnail(state, own.id), /^<svg aria-hidden="true"[^>]+viewBox=/);
  own.techniqueId = '__proto__';
  assert.equal(demos.thumbnail(state, own.id), '');
  assert.equal(demos.has(state, 'own'), false);
  assert.equal(demos.frameAt('constructor', 0), null);
  assert.equal(demos.frameAt('bench-press', NaN), null);
  delete own.techniqueId;
  assert.doesNotMatch(demos.render(state, 'own'), /data-demo-frame/);
  assert.match(demos.render(state, 'own'), /Wybierz wzorzec techniki/);
  assert.equal(demos.frameAt('bench-press', -1), demos.frameAt('bench-press', 0));
  assert.equal(demos.frameAt('bench-press', 2), demos.frameAt('bench-press', 1));
});

test('the player starts paused, steps, scrubs, slows down, pauses and releases detached views', () => {
  const listeners = new Map(),
    pending = new Map();
  let next = 1;
  const window = {
    document: { hidden: false, addEventListener: (type, cb) => listeners.set(type, cb) },
    requestAnimationFrame: (fn) => {
      const id = next++;
      pending.set(id, fn);
      return id;
    },
    cancelAnimationFrame: (id) => pending.delete(id)
  };
  for (const file of ['i18n','library','movement','demos'])
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, dir, file + '.js'), 'utf8'), { window });
  const nodes = new Map();
  const card = {
    dataset: { demoCard: 'lat-pulldown' },
    isConnected: true,
    querySelector: (s) => nodes.get(s)
  };
  function element(select, action) {
    const node = {
      dataset: { demoAction: action },
      attrs: {},
      setAttribute(k, v) {
        this.attrs[k] = v;
      },
      closest: (s) => (s === '[data-demo-card]' ? card : node),
      matches: (s) => s === select
    };
    nodes.set(select, node);
    return node;
  }
  const controls = Object.fromEntries(
    ['play', 'start', 'end', 'speed'].map((action) => [
      action,
      element(`[data-demo-action="${action}"]`, action)
    ])
  );
  const seek = element('[data-demo-seek]'),
    frame = element('[data-demo-frame]');
  const click = (key) => listeners.get('click')({ target: controls[key] });
  const tick = (now) => {
    const [key, fn] = pending.entries().next().value;
    pending.delete(key);
    fn(now);
  };
  assert.equal(pending.size, 0);
  click('end');
  assert.equal(seek.value, '50');
  assert.equal(controls.end.attrs['aria-pressed'], 'true');
  assert.equal(frame.innerHTML, demos.frameAt('lat-pulldown', 1));
  click('start');
  assert.equal(seek.value, '0');
  assert.equal(frame.innerHTML, demos.frameAt('lat-pulldown', 0));
  click('speed');
  assert.equal(controls.speed.textContent, '0,5×');
  click('play');
  tick(100);
  tick(2200);
  assert.equal(seek.value, '25');
  assert.equal(controls.play.attrs['aria-pressed'], 'true');
  seek.value = '70';
  listeners.get('input')({ target: seek });
  assert.equal(pending.size, 0);
  assert.equal(seek.value, '70');
  assert.equal(controls.play.attrs['aria-pressed'], 'false');
  click('play');
  window.document.hidden = true;
  listeners.get('visibilitychange')();
  assert.equal(pending.size, 0);
  window.document.hidden = false;
  click('play');
  card.isConnected = false;
  tick(2400);
  assert.equal(pending.size, 0);
  assert.equal(controls.play.attrs['aria-pressed'], 'false');
});

test('Dragon Flag progressions use distinct legs and a tucked reset for the negative rep', () => {
  const library = require(dir + '/library.js');
  const movement = require(dir + '/movement.js');
  const render = (id, returning) => movement.frame(library.byId['atlas-' + id], 0.5, returning).drawing;
  const full = render('dragon-flag', false);
  assert.notEqual(full, render('tuck-dragon-flag', false));
  assert.notEqual(full, render('one-leg-dragon-flag', false));
  assert.equal(full, render('negative-dragon-flag', false));
  assert.notEqual(full, render('negative-dragon-flag', true));
  assert.equal(full, render('dragon-flag', true));
});
