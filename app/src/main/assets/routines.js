(function routines(global) {
  'use strict';
  const M = global.GymModel || (typeof module !== 'undefined' && require('./model.js'));
  const isRecord = (value) => !!value && typeof value === 'object' && !Array.isArray(value);
  const clean = (value) => (typeof value === 'string' ? value.trim() : '');
  const instructionText = (value) => clean(value).replace(/\r\n?/g, '\n');
  const normalize = (value) =>
    clean(value)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ł/g, 'l')
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  const boundedInt = (value) => {
    const n = M.parseNumber(value);
    return Number.isInteger(n) && n >= 1 && n <= 1000 ? n : null;
  };
  const builtinIds = new Set(M.createState().exercises.map((x) => x.id));
  const knownTypes = new Set(['barbell', 'machine', 'cable', 'dumbbell', 'bodyweight', 'other']);
  function target(row) {
    if (!isRecord(row)) return null;
    let min = row.repsMin,
      max = row.repsMax;
    if (min == null && max == null) {
      const match = typeof row.reps === 'string' && row.reps.trim().match(/^(\d+)\s*[-–—]\s*(\d+)$/);
      if (match) {
        min = match[1];
        max = match[2];
      } else {
        const exact = boundedInt(row.reps);
        return exact ? { reps: exact } : null;
      }
    }
    min = boundedInt(min);
    max = boundedInt(max);
    if (!min || !max || max < min) return null;
    return { reps: min, repsMin: min, repsMax: max };
  }
  function label(row) {
    const t = target(row) || { reps: row?.targetReps || 10 };
    return t.repsMin && t.repsMin !== t.repsMax ? `${t.repsMin}–${t.repsMax}` : String(t.reps);
  }
  function aliases(state, ex) {
    return [
      ...new Set(
        [ex.name, ex.nameEn, ...(global.ExerciseAtlas?.aliases(state, ex) || []), ex.id].filter(Boolean)
      )
    ];
  }
  function indexNames(state) {
    const byName = new Map(),
      byId = new Map();
    function add(ex) {
      byId.set(ex.id, ex);
      for (const a of aliases(state, ex)) {
        const key = normalize(a),
          ids = byName.get(key) || new Set();
        ids.add(ex.id);
        byName.set(key, ids);
      }
    }
    state.exercises.forEach(add);
    return { byName, byId, add };
  }
  function textValue(value, label, limit, optional = false) {
    if (optional && value == null) return '';
    const result = clean(value);
    if (typeof value !== 'string' || (!optional && !result) || result.length > limit)
      throw Error(`Sprawdź pole „${label}”.`);
    return result;
  }
  function muscleRoles(value) {
    if (value == null) return undefined;
    if (!isRecord(value)) throw Error('Sprawdź mięśnie własnego ćwiczenia.');
    const valid = new Set((global.ExerciseAtlas?.regions || []).map((region) => region.id)),
      used = new Set(),
      result = {};
    for (const role of ['primary', 'secondary', 'stabilizer']) {
      const list = value[role] ?? [];
      if (
        !Array.isArray(list) ||
        list.some((id) => typeof id !== 'string' || id.length > 80 || (valid.size && !valid.has(id)))
      )
        throw Error('Nieznana grupa mięśni w definicji własnego ćwiczenia.');
      result[role] = [...new Set(list)].filter((id) => !used.has(id));
      result[role].forEach((id) => used.add(id));
    }
    if (!result.primary.length) throw Error('Podaj co najmniej jeden główny mięsień własnego ćwiczenia.');
    return result;
  }
  function read(raw, state) {
    if (typeof raw !== 'string' || raw.length > 16 * 1024 * 1024)
      throw Error('Wybierz plik JSON o rozmiarze do 16 MB.');
    let doc;
    try {
      doc = JSON.parse(raw.replace(/^\uFEFF/, ''));
    } catch {
      throw Error('Nie można odczytać JSON. Sprawdź cudzysłowy, przecinki i nawiasy.');
    }
    if (isRecord(doc) && (doc.sessions || doc.gyms || doc.equipment))
      throw Error('To kopia dziennika. Do planów wybierz plik wyeksportowany z zakładki Plany.');
    if (isRecord(doc) && doc.format && (doc.format !== 'rozstaw-plans' || doc.version !== 1))
      throw Error('Nieobsługiwana wersja pliku z planami.');
    const plans = Array.isArray(doc) ? doc : (doc?.plans ?? (doc?.plan ? [doc.plan] : [doc]));
    if (!Array.isArray(plans) || !plans.length) throw Error('Plik musi zawierać co najmniej jeden plan.');
    const index = indexNames(state),
      customExercises = [],
      customMap = new Map();
    if (doc?.customExercises != null && !Array.isArray(doc.customExercises))
      throw Error('Sprawdź listę własnych ćwiczeń.');
    for (const def of doc?.customExercises || []) {
      if (!isRecord(def)) throw Error('Nieprawidłowa definicja własnego ćwiczenia.');
      const sourceId = textValue(def.id, 'id ćwiczenia', 180);
      if (customMap.has(sourceId) || builtinIds.has(sourceId))
        throw Error('Powtórzony lub zastrzeżony identyfikator własnego ćwiczenia.');
      const name = textValue(def.name, 'nazwa ćwiczenia', 500);
      const group = textValue(def.group, 'partia mięśniowa', 500),
        pattern = textValue(def.pattern, 'wzorzec ruchu', 500);
      const muscles = muscleRoles(def.muscles);
      const nameEn = textValue(def.nameEn, 'angielska nazwa ćwiczenia', 500, true);
      if (!M.validTechniqueFields(def))
        throw Error(`Sprawdź instrukcję i identyfikator animacji wzorcowej dla „${name}”.`);
      const instructions = instructionText(def.instructions);
      const techniqueId = def.techniqueId || '';
      if (!knownTypes.has(def.type)) throw Error(`Nieznany typ sprzętu dla „${name}”.`);
      const same = (e) =>
        e &&
        !builtinIds.has(e.id) &&
        normalize(e.name) === normalize(name) &&
        e.type === def.type &&
        e.group === group &&
        (pattern === sourceId ? e.pattern === e.id : e.pattern === pattern) &&
        (!Object.hasOwn(def, 'instructions') || instructionText(e.instructions) === instructions) &&
        (!Object.hasOwn(def, 'techniqueId') || (e.techniqueId || '') === techniqueId);
      const original = index.byId.get(sourceId);
      const duplicate = same(original) ? original : Array.from(index.byId.values()).find(same);
      if (duplicate) {
        customMap.set(sourceId, duplicate.id);
        continue;
      }
      const id = original ? M.uid() : sourceId;
      const entry = {
        id,
        name,
        group,
        pattern: pattern === sourceId ? id : pattern,
        type: def.type,
        ...(nameEn ? { nameEn } : {}),
        ...(instructions ? { instructions } : {}),
        ...(techniqueId ? { techniqueId } : {}),
        ...(muscles ? { muscles } : {})
      };
      customMap.set(sourceId, id);
      customExercises.push(entry);
      index.add(entry);
    }
    function resolve(row, where) {
      const id = clean(row.exerciseId),
        name = clean(row.name || row.exercise);
      if (id && customMap.has(id)) return customMap.get(id);
      if (id && index.byId.has(id)) return id;
      const found = index.byName.get(normalize(name || id));
      if (found?.size === 1) return [...found][0];
      if (found?.size > 1)
        throw Error(`${where}: nazwa „${name || id}” pasuje do kilku ćwiczeń. Podaj exerciseId.`);
      throw Error(
        `${where}: nie znaleziono ćwiczenia „${name || id || 'bez nazwy'}”. Podaj nazwę z bazy lub exerciseId.`
      );
    }
    const imported = plans.map((p, i) => {
      if (!isRecord(p)) throw Error(`Plan ${i + 1} musi mieć nazwę i listę ćwiczeń.`);
      const name = textValue(p.name, 'nazwa planu', 500);
      if (!Array.isArray(p.exercises) || !p.exercises.length)
        throw Error(`Plan „${name}” wymaga co najmniej jednego ćwiczenia.`);
      const notes = textValue(p.notes, 'notatka do planu', 20000, true);
      const groups = new Map();
      const rows = p.exercises.map((r, j) => {
        const where = `${name}, ćwiczenie ${j + 1}`;
        if (!isRecord(r)) throw Error(`${where}: podaj nazwę, serie i powtórzenia.`);
        const exerciseId = resolve(r, where),
          sets = boundedInt(r.sets),
          goal = target(r);
        if (!sets || !goal)
          throw Error(`${where}: wpisz serie oraz powtórzenia 1–1000. Zakres może mieć postać „5-8”.`);
        const result = { exerciseId, sets, ...goal };
        if (r.supersetId != null) {
          const group = textValue(r.supersetId, 'superseria', 180);
          if (!groups.has(group)) groups.set(group, M.uid());
          result.supersetId = groups.get(group);
        }
        return result;
      });
      return { id: M.uid(), name, exercises: rows, ...(notes ? { notes } : {}) };
    });
    return { plans: imported, customExercises };
  }
  function write(state, plans) {
    const referenced = new Set(),
      byId = new Map(state.exercises.map((e) => [e.id, e]));
    const list = plans.map((p) => ({
      name: p.name,
      ...(p.notes ? { notes: p.notes } : {}),
      exercises: p.exercises.map((row) => {
        const ex = byId.get(row.exerciseId);
        referenced.add(row.exerciseId);
        return {
          exerciseId: row.exerciseId,
          name: ex?.name,
          sets: row.sets,
          reps: label(row),
          ...(row.supersetId ? { supersetId: row.supersetId } : {})
        };
      })
    }));
    const customExercises = state.exercises
      .filter((ex) => referenced.has(ex.id) && !builtinIds.has(ex.id))
      .map(({ id, name, nameEn, group, pattern, type, muscles, instructions, techniqueId }) => ({
        id,
        name,
        ...(nameEn ? { nameEn } : {}),
        group,
        pattern,
        type,
        ...(instructions ? { instructions } : {}),
        ...(techniqueId ? { techniqueId } : {}),
        ...(muscles ? { muscles } : {})
      }));
    return JSON.stringify(
      {
        format: 'rozstaw-plans',
        version: 1,
        plans: list,
        ...(customExercises.length ? { customExercises } : {})
      },
      null,
      2
    );
  }
  const example = JSON.stringify(
    {
      name: 'Trening A',
      exercises: [
        { exerciseId: 'chest-press', sets: 3, reps: '5-8' },
        { exerciseId: 'lat-pulldown', sets: 3, reps: '8-12' }
      ]
    },
    null,
    2
  );
  const api = { target, label, read, write, example, aliases };
  global.Routines = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis === 'undefined' ? window : globalThis);
