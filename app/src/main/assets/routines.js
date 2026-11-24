(function routines(global) {
  'use strict';
  const L = (typeof window !== 'undefined' ? window : globalThis).GymI18n || require('./i18n.js');
  const M = global.GymModel || (typeof module !== 'undefined' && require('./model.js'));
  const atlas = global.ExerciseAtlas || require('./atlas.js');
  const isRecord = (value) => !!value && typeof value === 'object' && !Array.isArray(value);
  const clean = (value) => (typeof value === 'string' ? value.trim() : '');
  const instructionText = (value) => clean(value).replace(/\r\n?/g, '\n');
  const normalize = (value) =>
    clean(value)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ł/g, 'l')
      .replace(/[-_()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  const boundedInt = (value) => {
    const n = M.parseNumber(value);
    return Number.isInteger(n) && n >= 1 && n <= 1000 ? n : null;
  };
  const builtinIds = new Set(M.createState().exercises.map((x) => x.id));
  const knownTypes = new Set(['barbell', 'machine', 'cable', 'dumbbell', 'bodyweight', 'other', 'band', 'kettlebell', 'plate', 'smith', 'landmine', 'roller']);
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
        [
          ...atlas.aliases(state, ex),
          ex.id,
          ...(ex.id.startsWith('atlas-') && builtinIds.has(ex.id) ? [ex.id.slice(6)] : []),
          ...(Object.hasOwn(nicknames, ex.id) ? nicknames[ex.id].split('|') : [])
        ].filter(Boolean)
      )
    ];
  }
  const nicknames = {
    'bench-press':
      'BB bench|flat bench press|flat barbell press|wyciskanie sztangi na płaskiej|wyciskanie sztangi na ławce poziomej|ławka płaska sztanga',
    'dumbbell-press':
      'DB bench|flat DB press|wyciskanie hantli na płaskiej|wyciskanie hantli na ławce poziomej',
    'atlas-incline-db':
      'incline DB press|wyciskanie hantli skos dodatni|wyciskanie hantli na ławce skośnej dodatniej',
    'atlas-incline-bench':
      'incline BB press|wyciskanie sztangi skos dodatni|wyciskanie sztangi na ławce skośnej dodatniej',
    'atlas-decline-db': 'decline DB press|wyciskanie hantli skos ujemny',
    'atlas-decline-bench': 'decline BB press|wyciskanie sztangi skos ujemny',
    'atlas-close-bench': 'CGBP|close grip bench|wyciskanie sztangi wąsko',
    'chest-press': 'machine chest press|wyciskanie na maszynie na klatkę',
    'pec-deck': 'pec deck fly|butterfly machine|butterfly|rozpiętki na maszynie butterfly',
    'cable-fly': 'cable crossover|rozpiętki na wyciągu',
    'dumbbell-fly': 'flat dumbbell fly|rozpiętki z hantlami na ławce płaskiej',
    'overhead-press': 'OHP|BB OHP|standing military press|wyciskanie żołnierskie|żołnierskie sztanga',
    'dumbbell-shoulder-press': 'DB OHP|DB shoulder press|wyciskanie hantli nad głowę',
    'lateral-raise': 'DB lat raise|DB side raise|wznosy bokiem z hantlami|unoszenie hantli bokiem',
    'cable-lateral-raise': 'cable side raise|wznosy bokiem na wyciągu',
    'rear-delt-fly': 'reverse butterfly|odwrotny butterfly',
    'atlas-face-pull': 'cable face pull|rope face pull|przyciąganie liny do twarzy',
    'lat-pulldown':
      'ściąganie drążka wyciągu górnego|wide grip lat pulldown|ściąganie drążka do klatki nachwytem',
    'atlas-underhand-lat': 'reverse grip lat pulldown|ściąganie drążka podchwytem',
    'pull-up': 'overhand pull up|podciąganie na drążku nachwytem',
    'atlas-chin-up': 'underhand pull up|podciąganie na drążku podchwytem',
    'seated-row': 'low cable row|seated cable row|przyciąganie linki wyciągu dolnego siedząc',
    'barbell-row': 'BB row|bent over BB row|wiosłowanie sztangą w opadzie',
    'dumbbell-row': 'one arm DB row|wiosłowanie hantlem jednorącz',
    'atlas-tbar-row': 'T bar row|wiosłowanie półsztangą',
    'barbell-curl': 'BB curl|uginanie ramion ze sztangą',
    'dumbbell-curl': 'DB curl|uginanie ramion z hantlami',
    'atlas-hammer-db': 'DB hammer curl|uginanie młotkowe hantlami|młotki hantlami',
    'atlas-ez-curl': 'EZ curl|uginanie ramion gryfem łamanym',
    'atlas-rope-pushdown': 'rope pushdown|triceps rope pressdown|prostowanie ramion z liną na wyciągu',
    'atlas-bb-skull': 'lying barbell triceps extension|wyciskanie francuskie sztangą leżąc',
    'atlas-ez-skull': 'EZ bar skull crusher|wyciskanie francuskie gryfem łamanym leżąc',
    squat: 'BB back squat|przysiad ze sztangą na plecach|przysiad tylny',
    'atlas-front-squat': 'BB front squat|przysiad przedni ze sztangą',
    'atlas-bulgarian-db':
      'DB Bulgarian split squat|DB rear foot elevated split squat|przysiad bułgarski z hantlami',
    'leg-press': 'sled leg press|wypychanie nóg na suwnicy',
    'leg-extension': 'machine leg extension|prostowanie nóg na maszynie',
    'leg-curl': 'seated hamstring curl|uginanie podudzi siedząc',
    'lying-leg-curl': 'prone leg curl|lying hamstring curl|uginanie podudzi leżąc',
    'romanian-deadlift': 'BB RDL|rumuński martwy ciąg ze sztangą',
    'dumbbell-rdl': 'DB RDL|rumuński martwy ciąg z hantlami',
    'hip-thrust': 'BB hip thrust|unoszenie bioder ze sztangą na ławce',
    'cable-crunch': 'kneeling cable crunch|allahy|spięcia brzucha na wyciągu w klęku',
    'atlas-back-extension': 'hyperextensions|wyprosty na ławce rzymskiej'
  };
  const tokenGroups = [
    ['barbell', 'bb', 'sztanga', 'sztangi'],
    ['dumbbell', 'db', 'dbs', 'dumbbells', 'hantel', 'hantle', 'hantli', 'hantlem', 'hantlami'],
    ['kettlebell', 'kb', 'kettlebells'],
    ['machine', 'maszyna', 'maszynie', 'maszyny'],
    ['cable', 'wyciag', 'wyciagu'],
    ['band', 'guma', 'gumy'],
    ['bodyweight', 'bw'],
    ['smith', 'smiths', 'smitha'],
    ['biceps', 'bicep'],
    ['triceps', 'tricep'],
    ['fly', 'flye', 'flyes', 'flies'],
    ['raise', 'raises', 'wznosy', 'wznos', 'unoszenie'],
    ['curl', 'curls'],
    ['row', 'rows', 'rowing', 'wioslo', 'wioslowanie'],
    ['squat', 'squats', 'przysiad', 'przysiady'],
    ['press', 'presses', 'wyciskanie'],
    ['extension', 'extensions'],
    ['deadlift', 'deadlifts'],
    ['lunge', 'lunges'],
    ['shrug', 'shrugs', 'szrugsy'],
    ['pushdown', 'pressdown', 'pushdowns'],
    ['pulldown', 'pulldowns'],
    ['seated', 'siedzac'],
    ['standing', 'stojac'],
    ['lying', 'lezac'],
    ['incline', 'dodatni'],
    ['decline', 'ujemny'],
    ['single', 'one'],
    ['arm', 'ramie'],
    ['leg', 'noga'],
    ['plate', 'talerz'],
    ['rope', 'lina', 'liny']
  ];
  const tokenNames = new Map(
    tokenGroups.flatMap(([canonical, ...forms]) => [canonical, ...forms].map((form) => [form, canonical]))
  );
  function words(value) {
    return normalize(value.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/([A-Z])([A-Z][a-z])/g, '$1 $2'))
      .replace(/[^a-z0-9 ]/g, ' ')
      .replace(/\brdl\b/g, 'romanian deadlift')
      .replace(/\bohp\b/g, 'overhead press')
      .replace(/\b(push|pull|chin)[ -]?(ups?)\b/g, '$1up')
      .replace(/\bpull down\b/g, 'pulldown')
      .replace(/\bpush down\b/g, 'pushdown')
      .replace(/\bskull crusher\b/g, 'skullcrusher')
      .replace(/\bdead lift\b/g, 'deadlift')
        .replace(/\b(low to high|high to low|up to down|down to up)\b/g, phrase => phrase.replaceAll(' ', ''))
      .split(/\s+/)
      .filter((w) => w && !['with', 'the', 'on', 'na', 'z', 'ze', 'w'].includes(w))
      .map((w) => tokenNames.get(w) || w);
  }
  function trigrams(text) {
    const padded = ' ' + text + ' ';
    return new Set(Array.from({ length: Math.max(0, padded.length - 2) }, (_, i) => padded.slice(i, i + 3)));
  }
  function indexNames(state) {
    const byName = new Map(),
      byTokens = new Map(),
      compact = new Map(),
      signatures = new Map(),
      byId = new Map();
    function index(map, key, id) {
      if (!key) return;
      if (!map.has(key)) map.set(key, new Set());
      map.get(key).add(id);
    }
    function add(ex) {
      byId.set(ex.id, ex);
      const variants = new Set();
      for (const a of aliases(state, ex)) {
        index(byName, normalize(a), ex.id);
        const tokens = words(a);
        index(compact, normalize(a).replace(/[^a-z0-9]/g, ''), ex.id);
        index(compact, tokens.join(''), ex.id);
        const signature = tokens.sort().join(' ');
        index(byTokens, signature, ex.id);
        if (signature) variants.add(signature);
      }
      signatures.set(ex.id, variants);
    }
    function lookup(value) {
      return (
        byName.get(normalize(value)) ||
          compact.get(normalize(value).replace(/[^a-z0-9]/g, '')) ||
          byTokens.get(words(value).sort().join(' '))
      );
    }
    function suggest(value) {
      const query = words(value).sort(),
        grams = trigrams(query.join(' ')),
        ranks = [];
      for (const [id, variants] of signatures) {
        let best = 0;
        for (const phrase of variants) {
          const tokens = phrase.split(' '),
            other = trigrams(phrase);
          const exact =
            query.filter((w) => tokens.includes(w)).length / Math.max(query.length, tokens.length);
          const similar =
            (2 * [...grams].filter((g) => other.has(g)).length) / (grams.size + other.size || 1);
          best = Math.max(best, 0.45 * exact + 0.55 * similar);
        }
        if (best >= 0.19) ranks.push({ id, score: best });
      }
      return ranks
        .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
        .slice(0, 5)
        .map((x) => x.id);
    }
    state.exercises.forEach(add);
    return { lookup, suggest, byId, add };
  }
  function textValue(value, label, limit, optional = false) {
    if (optional && value == null) return '';
    const result = clean(value);
    if (typeof value !== 'string' || (!optional && !result) || result.length > limit)
      throw Error(`${L.t("Sprawdź pole „")}${label}”.`);
    return result;
  }
  function muscleRoles(value) {
    if (value == null) return undefined;
    if (!isRecord(value)) throw Error(L.t("Sprawdź mięśnie własnego ćwiczenia."));
    const valid = new Set(atlas.regions.map((region) => region.id)),
      used = new Set(),
      result = {};
    for (const role of ['primary', 'secondary', 'stabilizer']) {
      const list = value[role] ?? [];
      if (
        !Array.isArray(list) ||
        list.some((id) => typeof id !== 'string' || id.length > 80 || (valid.size && !valid.has(id)))
      )
        throw Error(L.t("Nieznana grupa mięśni w definicji własnego ćwiczenia."));
      result[role] = [...new Set(list)].filter((id) => !used.has(id));
      result[role].forEach((id) => used.add(id));
    }
    if (!result.primary.length) throw Error(L.t("Podaj co najmniej jeden główny mięsień własnego ćwiczenia."));
    return result;
  }
  function parse(raw, state, review) {
    if (typeof raw !== 'string' || raw.length > 16 * 1024 * 1024)
      throw Error(L.t("Wybierz plik JSON o rozmiarze do 16 MB."));
    let doc;
    try {
      doc = JSON.parse(raw.replace(/^\uFEFF/, ''));
    } catch {
      throw Error(L.t("Nie można odczytać JSON. Sprawdź cudzysłowy, przecinki i nawiasy."));
    }
    if (isRecord(doc) && (doc.sessions || doc.gyms || doc.equipment))
      throw Error(L.t("To kopia dziennika. Do planów wybierz plik wyeksportowany z zakładki Plany."));
    if (isRecord(doc) && doc.format && (doc.format !== 'rozstaw-plans' || doc.version !== 1))
      throw Error(L.t("Nieobsługiwana wersja pliku z planami."));
    const plans = Array.isArray(doc) ? doc : (doc?.plans ?? (doc?.plan ? [doc.plan] : [doc]));
    if (!Array.isArray(plans) || !plans.length) throw Error(L.t("Plik musi zawierać co najmniej jeden plan."));
    const index = indexNames(state),
      customExercises = [],
      customMap = new Map();
    if (doc?.customExercises != null && !Array.isArray(doc.customExercises))
      throw Error(L.t("Sprawdź listę własnych ćwiczeń."));
    for (const def of doc?.customExercises || []) {
      if (!isRecord(def)) throw Error(L.t("Nieprawidłowa definicja własnego ćwiczenia."));
      const sourceId = textValue(def.id, L.t("id ćwiczenia"), 180);
      if (customMap.has(sourceId) || builtinIds.has(sourceId))
        throw Error(L.t("Powtórzony lub zastrzeżony identyfikator własnego ćwiczenia."));
      const name = textValue(def.name, L.t("nazwa ćwiczenia"), 500);
      const group = textValue(def.group, L.t("partia mięśniowa"), 500),
        pattern = textValue(def.pattern, L.t("wzorzec ruchu"), 500);
      const muscles = muscleRoles(def.muscles);
      const nameEn = textValue(def.nameEn, L.t("angielska nazwa ćwiczenia"), 500, true);
      if (!M.validTechniqueFields(def))
        throw Error(`${L.t("Sprawdź instrukcję i identyfikator animacji wzorcowej dla „")}${name}”.`);
      const instructions = instructionText(def.instructions);
      const techniqueId = def.techniqueId || '';
      if (!knownTypes.has(def.type)) throw Error(`${L.t("Nieznany typ sprzętu dla „")}${name}”.`);
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
    const issues = [],
      byReference = new Map();
    function resolve(row, where, planIndex, rowIndex) {
      const id = clean(
        row.exerciseId ||
          row.exercise_id ||
          row.codeName ||
          row.codename ||
          row.code_name ||
          row.exerciseCode ||
          row.exercise_code ||
          row.code ||
          row.slug ||
          row.id
      );
      const name = clean(row.name || row.exercise || row.exerciseName || row.exercise_name);
      if (id && customMap.has(id)) return customMap.get(id);
      if (id && index.byId.has(id)) return id;
      if (id.length > 500 || name.length > 500)
        throw Error(where + ' · ' + L.t('Nazwa ćwiczenia jest zbyt długa.'));
      const found = new Set([
        ...(id ? index.lookup(id) || [] : []),
        ...(name ? index.lookup(name) || [] : [])
      ]);
      if (found.size === 1) return [...found][0];
      if (review) {
        const key = JSON.stringify(id || name ? [id, name] : [planIndex, rowIndex]);
        if (!byReference.has(key)) {
          const title = [...new Set([id, name].filter(Boolean))].join(' · ') || L.t('bez nazwy');
          const issue = {
            title,
            suggestions: found.size ? [...found] : index.suggest(name || id),
            locations: []
          };
          issues.push(issue);
          byReference.set(key, issue);
        }
        byReference.get(key).locations.push({ planIndex, rowIndex, where });
        return null;
      }
      if (found.size > 1)
        throw Error(
          `${where}${L.t(': nazwa „')}${name || id}${L.t('” pasuje do kilku ćwiczeń. Podaj exerciseId.')}`
        );
      throw Error(
        `${where}${L.t(': nie znaleziono ćwiczenia „')}${name || id || L.t('bez nazwy')}${L.t('”. Podaj nazwę z bazy lub exerciseId.')}`
      );
    }
    const imported = plans.map((p, i) => {
      if (!isRecord(p)) throw Error(`${L.t("Plan")} ${i + 1} ${L.t("musi mieć nazwę i listę ćwiczeń.")}`);
      const name = textValue(p.name, L.t("nazwa planu"), 500);
      if (!Array.isArray(p.exercises) || !p.exercises.length)
        throw Error(`${L.t("Plan „")}${name}${L.t("” wymaga co najmniej jednego ćwiczenia.")}`);
      const notes = textValue(p.notes, L.t("notatka do planu"), 20000, true);
      const groups = new Map();
      const rows = p.exercises.map((r, j) => {
        const where = `${name}${L.t(", ćwiczenie")} ${j + 1}`;
        if (!isRecord(r)) throw Error(`${where}${L.t(": podaj nazwę, serie i powtórzenia.")}`);
        const exerciseId = resolve(r, where, i, j),
          sets = boundedInt(r.sets),
          goal = target(r);
        if (!sets || !goal)
          throw Error(`${where}${L.t(": wpisz serie oraz powtórzenia 1–1000. Zakres może mieć postać „5-8”.")}`);
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
    return { plans: imported, customExercises, ...(review ? {issues} : {}) };
  }
  const read = (raw,state) => parse(raw,state,false);
  const preview = (raw,state) => parse(raw,state,true);
  function write(state, plans) {
    const referenced = new Set(),
      byId = new Map(state.exercises.map((e) => [e.id, e]));
    const list = plans.map((p) => ({
      name: L.routine(p),
      ...(p.notes ? { notes: p.notes } : {}),
      exercises: p.exercises.map((row) => {
        const ex = byId.get(row.exerciseId);
        referenced.add(row.exerciseId);
        return {
          exerciseId: row.exerciseId,
          name: ex ? atlas.name(state, ex) : undefined,
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
      name: L.t("Trening A"),
      exercises: [
        { exerciseId: 'chest-press', sets: 3, reps: '5-8' },
        { exerciseId: 'lat-pulldown', sets: 3, reps: '8-12' }
      ]
    },
    null,
    2
  );
  const api = { target, label, read, preview, write, example, aliases, normalize, searchWords: words };
  global.Routines = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis === 'undefined' ? window : globalThis);
