const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { seedLegacyDiary } = require('./legacy-diary.cjs');
const assets = path.join(__dirname, '../app/src/main/assets');

function app(saved) {
  const window = { localStorage: { getItem: () => JSON.stringify(saved) } };
  const context = vm.createContext(window);
  context.window = context;
  for (const file of ['i18n', 'library', 'model', 'atlas', 'technique', 'routines'])
    vm.runInContext(fs.readFileSync(path.join(assets, file + '.js'), 'utf8'), context);
  return window;
}

test('migrating a 49-exercise diary preserves recorded sets, profiles, custom plans and a live workout', () => {
  const { GymModel: M } = app();
  const s = seedLegacyDiary(M.createState());
  s.exercises = s.exercises.filter((e) => !e.id.startsWith('atlas-'));
  assert.equal(s.exercises.length, 49);
  delete s.language;
  s.exerciseLanguage = 'en';
  s.exercises.push({
    id: 'my-lift',
    name: 'Moje ćwiczenie',
    type: 'machine',
    group: 'Plecy',
    pattern: 'my-pattern'
  });
  s.plans.push({
    id: 'personal',
    name: 'Historia',
    notes: 'Mój plan',
    exercises: [{ exerciseId: 'my-lift', sets: 2, reps: 8 }]
  });
  const station = M.ensureEquipment(s, 'alchemia', 'chest-press', 'Stanowisko przy oknie', 2.5);
  const row = {
    exerciseId: 'chest-press',
    equipmentId: station.id,
    sets: [{ done: true, reps: 8, weight: 35, type: 'normal' }]
  };
  s.sessions.push({
    id: 'logged',
    name: 'Sesja',
    planId: 'upper-a',
    gymId: 'alchemia',
    startedAt: 1000,
    finishedAt: 2000,
    exercises: [row]
  });
  s.active = {
    id: 'ongoing',
    name: 'Dziś',
    planId: 'upper-a',
    gymId: 'alchemia',
    startedAt: 3000,
    exercises: [row]
  };
  const records = JSON.stringify([s.plans, s.equipment, s.sessions, s.active, s.exercises]);
  assert.ok(M.validateState(s));
  M.upgradeState(s);
  assert.equal(s.language, 'en');
  assert.ok(!Object.hasOwn(s, 'exerciseLanguage'));
  assert.equal(s.exercises.length, 271);
  assert.equal(
    JSON.stringify([s.plans, s.equipment, s.sessions, s.active, s.exercises.slice(0, 50)]),
    records
  );
  const once = JSON.stringify(s);
  M.upgradeState(s);
  assert.equal(JSON.stringify(s), once);
  assert.ok(M.validateState(s));
  assert.equal(M.validateState({ ...s, language: 'de' }), false);
  assert.equal(M.validateState({ ...s, exerciseLanguage: 22 }), false);
});

test('both languages provide named equipment, muscle roles, three coaching steps and bilingual imports for every exercise', () => {
  const pl = app({}),
    en = app({ exerciseLanguage: 'en' });
  assert.equal(en.GymI18n.language, 'en');
  const a = pl.GymModel.createState(),
    b = seedLegacyDiary(en.GymModel.createState());
  b.language = 'en';
  assert.equal(a.exercises.length, 270);
  const names = new Set(),
    englishNames = new Set();
  for (const ex of a.exercises) {
    const id = ex.id;
    const name = pl.ExerciseAtlas.name(a, id),
      english = en.ExerciseAtlas.name(b, id);
    names.add(name);
    englishNames.add(english);
    const guidePl = pl.ExerciseTechnique.get(a, id),
      guideEn = en.ExerciseTechnique.get(b, id);
    assert.equal(guideEn.steps.length, 3, id);
    for (let i = 0; i < 3; i++) assert.notEqual(guidePl.steps[i], guideEn.steps[i], id);
    assert.notEqual(guidePl.cue, guideEn.cue, id);
    assert.deepEqual(
      [...pl.ExerciseAtlas.describe(a, id).muscles].map((m) => m.id),
      [...en.ExerciseAtlas.describe(b, id).muscles].map((m) => m.id)
    );
    for (const alias of new Set([ex.name, name, english])) {
      const raw = JSON.stringify({ name: 'Historia', exercises: [{ name: alias, sets: 1, reps: 8 }] });
      assert.equal(en.Routines.read(raw, b).plans[0].exercises[0].exerciseId, id, alias);
    }
  }
  assert.equal(names.size, 270);
  assert.equal(englishNames.size, 270);
  assert.equal(pl.ExerciseAtlas.name(a, 'bench-press'), 'Wyciskanie leżąc (sztanga)');
  assert.equal(en.ExerciseAtlas.name(b, 'bench-press'), 'Bench Press (Barbell)');
  assert.equal(en.ExerciseAtlas.name(b, 'atlas-bb-skull'), 'Skullcrusher (Barbell)');
  const exported = JSON.parse(en.Routines.write(b, [b.plans[0]]));
  assert.equal(exported.plans[0].name, 'Upper Body A');
  assert.equal(exported.plans[0].exercises[0].name, 'Chest Press (Machine)');
  assert.equal(pl.Routines.read(JSON.stringify(exported), a).plans[0].exercises[0].exerciseId, 'chest-press');
  assert.equal(en.GymI18n.routine({ id: 'personal', name: 'Historia' }), 'Historia');
  assert.equal(en.GymI18n.group({ id: 'personal', group: 'Plecy' }), 'Plecy');
});

test('an existing 250-exercise diary gets the new movements once and both languages resolve Dragon Flag',()=>{
  const w=app({}), m=w.GymModel, s=m.createState();
  s.exercises=s.exercises.slice(0,250);
  const own={id:'personal-flag',name:'Mój dragon flag',type:'bodyweight',pattern:'own',group:'Brzuch'};
  s.exercises.push(own);
  s.plans.push({id:'old',name:'Old plan',exercises:[{exerciseId:own.id,sets:2,reps:5}]});
  const existing=s.exercises.map(e=>e.id).join('|'), plans=JSON.stringify(s.plans);
  m.upgradeState(s);m.upgradeState(s);
  assert.ok(m.validateState(s));
  assert.equal(s.exercises.length,271);
  assert.equal(s.exercises.slice(0,251).map(e=>e.id).join('|'),existing);
  assert.equal(JSON.stringify(s.plans),plans);
  for(const code of ['dragon_flag','DragonFlag','Dragon Flags','Smocza flaga','Flaga smoka']) {
    const batch=w.Routines.read(JSON.stringify({name:'Core',exercises:[{name:code,sets:2,reps:4}]}),s);
    assert.equal(batch.plans[0].exercises[0].exerciseId,'atlas-dragon-flag');
  }
  const en=app({language:'en'}), detail=en.ExerciseAtlas.render(s,'atlas-dragon-flag');
  assert.ok(detail.includes('<strong>Abs</strong>') && detail.includes('<strong>Lats</strong>'));
});
