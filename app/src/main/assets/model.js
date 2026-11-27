/* Local workout data and comparisons between personally calibrated machines. */
(function (root) {
  'use strict';
  const L = (typeof window !== 'undefined' ? window : globalThis).GymI18n || require('./i18n.js');

  const DAY = 86400000;
  const PAIR_DAYS = 14;
  const CALIBRATION_DAYS = 180;
  const SOURCE_DAYS = 42;
  const groups = [
    [
      'Klatka piersiowa',
      'horizontal-press',
      [
        ['chest-press', 'Wyciskanie na maszynie', 'machine'],
        ['bench-press', 'Wyciskanie sztangi leżąc', 'barbell'],
        ['dumbbell-press', 'Wyciskanie hantli leżąc', 'dumbbell'],
        ['push-up', 'Pompki', 'bodyweight']
      ]
    ],
    [
      'Klatka piersiowa',
      'chest-fly',
      [
        ['pec-deck', 'Rozpiętki na maszynie', 'machine'],
        ['cable-fly', 'Rozpiętki na bramie', 'cable'],
        ['dumbbell-fly', 'Rozpiętki z hantlami', 'dumbbell']
      ]
    ],
    [
      'Plecy',
      'vertical-pull',
      [
        ['lat-pulldown', 'Ściąganie drążka wyciągu', 'cable'],
        ['pulldown-machine', 'Ściąganie na maszynie', 'machine'],
        ['pull-up', 'Podciąganie na drążku', 'bodyweight']
      ]
    ],
    [
      'Plecy',
      'horizontal-pull',
      [
        ['seated-row', 'Wiosłowanie na wyciągu', 'cable'],
        ['machine-row', 'Wiosłowanie na maszynie', 'machine'],
        ['dumbbell-row', 'Wiosłowanie hantlem', 'dumbbell'],
        ['barbell-row', 'Wiosłowanie sztangą', 'barbell']
      ]
    ],
    [
      'Barki',
      'overhead-press',
      [
        ['shoulder-press', 'Wyciskanie na maszynie siedząc', 'machine'],
        ['dumbbell-shoulder-press', 'Wyciskanie hantli nad głowę', 'dumbbell'],
        ['overhead-press', 'Wyciskanie sztangi nad głowę', 'barbell']
      ]
    ],
    [
      'Barki',
      'lateral-raise',
      [
        ['lateral-raise', 'Unoszenie hantli bokiem', 'dumbbell'],
        ['cable-lateral-raise', 'Unoszenie ramienia na wyciągu', 'cable'],
        ['machine-lateral-raise', 'Unoszenie ramion na maszynie', 'machine']
      ]
    ],
    [
      'Barki',
      'reverse-fly',
      [
        ['rear-delt-fly', 'Odwrotne rozpiętki na maszynie', 'machine'],
        ['reverse-cable-fly', 'Odwrotne rozpiętki na bramie', 'cable']
      ]
    ],
    [
      'Biceps',
      'elbow-flexion',
      [
        ['dumbbell-curl', 'Uginanie ramion z hantlami', 'dumbbell'],
        ['cable-curl', 'Uginanie ramion na wyciągu', 'cable'],
        ['preacher-curl', 'Uginanie na modlitewniku', 'machine'],
        ['barbell-curl', 'Uginanie ramion ze sztangą', 'barbell']
      ]
    ],
    [
      'Triceps',
      'elbow-extension',
      [
        ['triceps-pushdown', 'Prostowanie ramion na wyciągu', 'cable'],
        ['overhead-extension', 'Prostowanie ramion z hantlem', 'dumbbell'],
        ['triceps-machine', 'Prostowanie ramion na maszynie', 'machine']
      ]
    ],
    [
      'Uda',
      'knee-dominant',
      [
        ['leg-press', 'Wypychanie na suwnicy', 'machine'],
        ['hack-squat', 'Przysiad na hack-maszynie', 'machine'],
        ['squat', 'Przysiad ze sztangą', 'barbell'],
        ['goblet-squat', 'Przysiad z hantlem', 'dumbbell']
      ]
    ],
    [
      'Uda',
      'knee-extension',
      [
        ['leg-extension', 'Prostowanie nóg na maszynie', 'machine'],
        ['cable-leg-extension', 'Prostowanie nogi na wyciągu', 'cable']
      ]
    ],
    [
      'Tył uda',
      'knee-flexion',
      [
        ['leg-curl', 'Uginanie nóg siedząc', 'machine'],
        ['lying-leg-curl', 'Uginanie nóg leżąc', 'machine'],
        ['cable-leg-curl', 'Uginanie nogi na wyciągu', 'cable']
      ]
    ],
    [
      'Tył uda',
      'hip-hinge',
      [
        ['romanian-deadlift', 'Rumuński martwy ciąg', 'barbell'],
        ['dumbbell-rdl', 'Rumuński martwy ciąg z hantlami', 'dumbbell']
      ]
    ],
    [
      'Pośladki',
      'hip-thrust',
      [
        ['hip-thrust', 'Hip thrust ze sztangą', 'barbell'],
        ['glute-drive', 'Wypychanie bioder na maszynie', 'machine'],
        ['glute-bridge', 'Most biodrowy', 'bodyweight']
      ]
    ],
    [
      'Łydki',
      'calf-raise',
      [
        ['calf-raise', 'Wspięcia na palce stojąc', 'machine'],
        ['seated-calf', 'Wspięcia na palce siedząc', 'machine'],
        ['dumbbell-calf', 'Wspięcia na palce z hantlami', 'dumbbell']
      ]
    ],
    [
      'Brzuch',
      'trunk-flexion',
      [
        ['cable-crunch', 'Spięcia brzucha na wyciągu', 'cable'],
        ['machine-crunch', 'Spięcia brzucha na maszynie', 'machine'],
        ['crunch', 'Spięcia brzucha na macie', 'bodyweight']
      ]
    ]
  ];
  const library = root.ExerciseLibrary || require('./library.js');
  const catalogueIds = new Set(groups.flatMap(([, , entries]) => entries.map(([id]) => id)));
  for (const ex of library.additions) catalogueIds.add(ex.id);
  const instructionsLimit = 4000;

  function validTechniqueFields(ex) {
    return (
      (ex.instructions == null ||
        (typeof ex.instructions === 'string' && ex.instructions.length <= instructionsLimit)) &&
      (ex.techniqueId == null || ex.techniqueId === '' || catalogueIds.has(ex.techniqueId))
    );
  }

  function uid() {
    if (root.crypto && typeof root.crypto.randomUUID === 'function') return root.crypto.randomUUID();
    return (
      Date.now().toString(36) +
      '-' +
      Math.random().toString(36).slice(2) +
      Math.random().toString(36).slice(2)
    );
  }

  function parseNumber(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value !== 'string') return null;
    const trimmed = value.trim().replace(',', '.');
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(trimmed)) return null;
    const number = Number(trimmed);
    return Number.isFinite(number) ? number : null;
  }

  function dateValue(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return new Date(value).getTime();
    return typeof value === 'string' && value.trim() ? Date.parse(value) : NaN;
  }

  function createState() {
    const exercises = [];
    for (const [group, pattern, entries] of groups) {
      for (const [id, name, type] of entries) exercises.push({ id, name, group, pattern, type });
    }
    exercises.push(...library.additions.map(({id, name, group, pattern, type}) => ({id, name, group, pattern, type})));
    return {
      version: 1,
      language: 'pl',
      sex: 'male',
      gyms: [],
      exercises,
      plans: [],
      equipment: [],
      sessions: [],
      active: null
    };
  }

  function upgradeState(state) {
    state.language = state.language || state.exerciseLanguage || 'pl';
    delete state.exerciseLanguage;
    const ids = new Set(state.exercises.map(ex => ex.id));
    for (const {id, name, group, pattern, type} of library.additions)
      if (!ids.has(id)) state.exercises.push({id, name, group, pattern, type});
    return state;
  }

  function getEquipment(state, gymId, exerciseId) {
    return state.equipment.filter((profile) => profile.gymId === gymId && profile.exerciseId === exerciseId);
  }

  function ensureEquipment(state, gymId, exerciseId, name, step) {
    const exercise = state.exercises.find((item) => item.id === exerciseId);
    if (!exercise || !state.gyms.some((gym) => gym.id === gymId))
      throw new Error(L.t('Nieznana siłownia lub ćwiczenie.'));
    const label = String(name || '').trim();
    const profiles = getEquipment(state, gymId, exerciseId);
    const existing = label
      ? profiles.find((profile) => profile.name.toLocaleLowerCase(L.locale) === label.toLocaleLowerCase(L.locale))
      : profiles[0];
    if (existing) return existing;
    const increment = step == null ? (exercise.type === 'dumbbell' ? 1 : 2.5) : parseNumber(step);
    if (!(increment > 0 && increment <= 1000)) throw new Error(L.t('Podaj dodatni skok obciążenia w kg.'));
    const result = { id: uid(), gymId, exerciseId, name: label || exercise.name, step: increment };
    state.equipment.push(result);
    return result;
  }

  function substitutes(state, exerciseId, gymId) {
    const base = state.exercises.find((item) => item.id === exerciseId);
    if (!base || !base.pattern) return [];
    const known = new Set(
      state.equipment.filter((profile) => profile.gymId === gymId).map((profile) => profile.exerciseId)
    );
    return state.exercises
      .filter((item) => item.id !== exerciseId && item.pattern === base.pattern)
      .sort(
        (a, b) =>
          Number(known.has(b.id)) - Number(known.has(a.id)) ||
          Number(b.type === base.type) - Number(a.type === base.type) ||
          a.name.localeCompare(b.name, L.locale)
      );
  }

  function median(numbers) {
    const sorted = numbers.slice().sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  }

  // Only use finished working sets on the named machine. Each workout gets one
  // vote, even if the exercise occurs more than once in the same workout.
  function observations(state, exerciseId, reps, now) {
    const byProfile = new Map();
    const profiles = new Map(state.equipment.map((profile) => [profile.id, profile]));
    for (const session of state.sessions) {
      const time = dateValue(session.finishedAt);
      if (!Number.isFinite(time) || time > now) continue;
      const bySession = new Map();
      for (const row of session.exercises) {
        const profile = profiles.get(row.equipmentId);
        if (
          row.exerciseId !== exerciseId ||
          !profile ||
          profile.gymId !== session.gymId ||
          profile.exerciseId !== exerciseId
        )
          continue;
        const results = bySession.get(profile.id) || [];
        for (const set of row.sets) {
          const weight = parseNumber(set.weight);
          const count = parseNumber(set.reps);
          if (
            set.done !== true ||
            set.type === 'warmup' ||
            set.type === 'drop' ||
            !(weight > 0) ||
            !Number.isInteger(count) ||
            count < 1
          )
            continue;
          // Match exact rep counts at any range. A small rep adjustment is
          // permitted only for nearby sets in the working range of 3–15.
          if (
            count !== reps &&
            (Math.min(count, reps) < 3 || Math.max(count, reps) > 15 || Math.abs(count - reps) > 5)
          )
            continue;
          const rir = set.type === 'failure' ? 0 : parseNumber(set.rir);
          results.push({ weight: (weight * (30 + count)) / (30 + reps), gap: Math.abs(count - reps), rir });
        }
        if (results.length) bySession.set(profile.id, results);
      }
      for (const [id, results] of bySession) {
        const closest = Math.min(...results.map((result) => result.gap));
        const similar = results.filter((result) => result.gap === closest);
        const weight = median(similar.map((result) => result.weight));
        const efforts = similar.map((result) => result.rir).filter((value) => value !== null);
        const effort = efforts.length === similar.length ? median(efforts) : null;
        if (!byProfile.has(id)) byProfile.set(id, []);
        byProfile.get(id).push({ time, weight, effort });
      }
    }
    for (const history of byProfile.values()) history.sort((a, b) => b.time - a.time);
    return byProfile;
  }

  function matchPairs(targets, sources, now) {
    const options = [];
    // Records are descending. Stop before the cutoff even in a multiyear log.
    for (const target of targets) {
      if (now - target.time > CALIBRATION_DAYS * DAY) break;
      for (const source of sources) {
        if (now - source.time > CALIBRATION_DAYS * DAY || source.time < target.time - PAIR_DAYS * DAY) break;
        const gap = Math.abs(target.time - source.time);
        if (target.effort !== null && source.effort !== null && Math.abs(target.effort - source.effort) > 1)
          continue;
        if (gap <= PAIR_DAYS * DAY) options.push({ target, source, gap });
      }
    }
    options.sort((a, b) => a.gap - b.gap || b.target.time - a.target.time);
    const usedTargets = new Set();
    const usedSources = new Set();
    const pairs = [];
    for (const pair of options) {
      if (usedTargets.has(pair.target) || usedSources.has(pair.source)) continue;
      pairs.push(pair);
      usedTargets.add(pair.target);
      usedSources.add(pair.source);
    }
    return pairs;
  }

  function calibrated(targets, history, now) {
    const latest = history[0];
    if (latest.time <= targets[0].time || now - latest.time > SOURCE_DAYS * DAY) return null;
    // Hold out the newest result if older sessions already calibrate the two
    // machines. The new result can then express progress independently.
    const similarEffort = history.filter(
      (item) => latest.effort === null || item.effort === null || Math.abs(item.effort - latest.effort) <= 1
    );
    let pairs = matchPairs(targets, similarEffort.slice(1), now);
    if (!pairs.length) pairs = matchPairs(targets, similarEffort, now);
    if (!pairs.length) return null;
    const logs = pairs.map((pair) => Math.log(pair.target.weight / pair.source.weight));
    const center = median(logs);
    const retained = logs.filter((value) => Math.abs(value - center) <= Math.log(1.18));
    if (retained.length < Math.ceil((logs.length * 2) / 3)) return null;
    const ratio = Math.exp(median(retained));
    const spread = Math.max(...retained) - Math.min(...retained);
    if (spread > Math.log(1.35)) return null;
    const fresh = now - latest.time <= 21 * DAY;
    const confidence =
      retained.length >= 3 && spread <= Math.log(1.12) && fresh
        ? 'high'
        : retained.length >= 2 && fresh
          ? 'medium'
          : 'low';
    return {
      ratio,
      sourceWeight: latest.weight,
      weight: latest.weight * ratio,
      pairs: retained.length,
      confidence,
      time: latest.time
    };
  }

  function roundToProfile(weight, profile) {
    const step = parseNumber(profile.step);
    const minimum = Math.max(0, parseNumber(profile.minWeight) || 0);
    if (!(step > 0)) return Math.round(weight * 100) / 100;
    // Round to the closest selectable load. For exact ties use the lighter one.
    const units = Math.max(0, Math.ceil((weight - minimum) / step - 0.5 - 1e-9));
    return Number((minimum + units * step).toFixed(4));
  }

  function recommend(state, options) {
    const { exerciseId, gymId, equipmentId } = options;
    const reps = parseNumber(options.reps ?? 10);
    const now = options.now == null ? Date.now() : dateValue(options.now);
    const empty = (reason) => ({ weight: null, source: 'none', confidence: 'none', pairs: 0, reason });
    if (!Number.isInteger(reps) || reps < 1 || reps > 1000 || !Number.isFinite(now))
      return empty(L.t("Podaj prawidłową liczbę powtórzeń."));
    const exercise = state.exercises.find((item) => item.id === exerciseId);
    if (!exercise) return empty(L.t("Wybierz ćwiczenie."));
    if (exercise.type === 'bodyweight')
      return empty(L.t("Śledź liczbę powtórzeń. Dodatkowe obciążenie możesz wpisać ręcznie."));
    const profiles = getEquipment(state, gymId, exerciseId);
    const target = equipmentId
      ? profiles.find((profile) => profile.id === equipmentId)
      : profiles.length === 1
        ? profiles[0]
        : null;
    if (!target)
      return empty(
        profiles.length > 1
          ? L.t("Wybierz konkretną maszynę.")
          : L.t("Zapisz pierwszą serię na tym sprzęcie, aby rozpocząć kalibrację.")
      );
    const results = observations(state, exerciseId, reps, now);
    const targets = results.get(target.id);
    if (!targets || !targets.length)
      return empty(
        L.t("Brakuje serii porównawczej na tym sprzęcie. Zapisz serię roboczą o zbliżonej liczbie powtórzeń.")
      );
    const candidates = [];
    for (const [profileId, history] of results) {
      if (profileId === target.id) continue;
      const estimate = calibrated(targets, history, now);
      if (estimate) candidates.push({ ...estimate, profileId });
    }
    candidates.sort((a, b) => b.time - a.time || b.pairs - a.pairs);
    const best = candidates[0];
    if (best) {
      const source = state.equipment.find((profile) => profile.id === best.profileId);
      const gym = state.gyms.find((item) => item.id === source.gymId);
      const sourceName = gym ? gym.name : source.name;
      return {
        weight: roundToProfile(best.weight, target),
        source: 'transfer',
        confidence: best.confidence,
        pairs: best.pairs,
        ratio: best.ratio,
        sourceWeight: best.sourceWeight,
        sourceGymId: source.gymId,
        sourceEquipmentId: source.id,
        reason:
          (L.t("Ostatni wynik z") + " ") +
          sourceName +
          ' × ' +
          best.ratio.toLocaleString(L.locale, { maximumFractionDigits: 3 }) +
          (L.t(". Liczba par porównawczych:") + " ") +
          best.pairs +
          '.'
      };
    }
    const recent = now - targets[0].time <= SOURCE_DAYS * DAY;
    return {
      weight: roundToProfile(targets[0].weight, target),
      source: 'local',
      confidence: recent ? 'medium' : 'low',
      pairs: 0,
      reason: recent
        ? L.t("Na podstawie ostatnich serii roboczych na tym sprzęcie.")
        : L.t("Na podstawie serii sprzed ponad 6 tygodni. Sprawdź obciążenie na dzisiejszym treningu.")
    };
  }

  // Reject corrupt backups before replacing the current log. Optional UI
  // metadata is preserved so an interrupted session can resume after import.
  function validateState(value) {
    const record = (item) => item !== null && typeof item === 'object' && !Array.isArray(item);
    const id = (item) => typeof item === 'string' && item.trim().length > 0 && item.length <= 180;
    const label = (item) => typeof item === 'string' && item.trim().length > 0 && item.length <= 500;
    const note = (item) => item == null || (typeof item === 'string' && item.length <= 20000);
    const numberIn = (item, lo, hi, integer) => {
      const n = parseNumber(item);
      return n !== null && n >= lo && n <= hi && (!integer || Number.isInteger(n));
    };
    const rows = (items) => Array.isArray(items) && items.every(record);
    const repRange = (row) =>
      (row.repsMin == null && row.repsMax == null) ||
      (numberIn(row.repsMin, 1, 1000, true) && numberIn(row.repsMax, Number(row.repsMin), 1000, true));
    const muscleMap = (mapping) =>
      mapping == null ||
      (record(mapping) &&
        ['primary', 'secondary', 'stabilizer'].every(
          (role) => mapping[role] == null || (Array.isArray(mapping[role]) && mapping[role].every(id))
        ));
    const indexed = (items) =>
      rows(items) &&
      items.every((item) => id(item.id)) &&
      new Set(items.map((item) => item.id)).size === items.length;
    if (
      !record(value) ||
      value.version !== 1 ||
      !indexed(value.gyms) ||
      !indexed(value.exercises) ||
      !indexed(value.equipment) ||
      !indexed(value.plans) ||
      !indexed(value.sessions)
    )
      return false;
    if (value.sex !== undefined && !['male','female'].includes(value.sex)) return false;
    if (value.language != null && !['en', 'pl'].includes(value.language)) return false;
    if (value.exerciseLanguage != null && !['en', 'pl'].includes(value.exerciseLanguage)) return false;
    if (
      value.measurements !== undefined &&
      (!indexed(value.measurements) ||
        !value.measurements.every(
          (m) =>
            ['weight', 'waist', 'chest', 'hips', 'arm', 'thigh'].includes(m.kind) &&
            typeof m.value === 'number' &&
            numberIn(m.value, 0.001, 1500) &&
            typeof m.at === 'string' &&
            /^\d{4}-\d{2}-\d{2}$/.test(m.at) &&
            Number.isFinite(Date.parse(m.at)) &&
            new Date(m.at).toISOString().slice(0, 10) === m.at
        ))
    )
      return false;
    const gyms = new Set(value.gyms.map((gym) => gym.id));
    const exercises = new Set(value.exercises.map((exercise) => exercise.id));
    const profiles = new Map(value.equipment.map((profile) => [profile.id, profile]));
    if (
      !value.gyms.every((gym) => label(gym.name)) ||
      !value.exercises.every(
        (item) =>
          label(item.name) &&
          label(item.group) &&
          label(item.pattern) &&
          label(item.type) &&
          (item.nameEn == null || item.nameEn === '' || label(item.nameEn)) &&
          validTechniqueFields(item) &&
          muscleMap(item.muscles)
      )
    )
      return false;
    if (
      !value.equipment.every(
        (profile) =>
          gyms.has(profile.gymId) &&
          exercises.has(profile.exerciseId) &&
          label(profile.name) &&
          numberIn(profile.step, 0.0001, 1000) &&
          (profile.minWeight == null || numberIn(profile.minWeight, 0, 10000))
      )
    )
      return false;
    if (
      !value.plans.every(
        (plan) =>
          label(plan.name) &&
          note(plan.notes) &&
          rows(plan.exercises) &&
          plan.exercises.every(
            (row) =>
              exercises.has(row.exerciseId) &&
              numberIn(row.sets, 1, 1000, true) &&
              numberIn(row.reps, 1, 1000, true) &&
              repRange(row)
          )
      )
    )
      return false;
    function validSession(session, active) {
      if (
        !record(session) ||
        !id(session.id) ||
        !gyms.has(session.gymId) ||
        !label(session.name) ||
        !note(session.notes) ||
        (session.planId != null && !id(session.planId)) ||
        !Number.isFinite(dateValue(session.startedAt)) ||
        !rows(session.exercises)
      )
        return false;
      if (session.restSeconds != null && !numberIn(session.restSeconds, 0, 86400, true)) return false;
      if (session.restUntil != null && !numberIn(session.restUntil, 0, 8640000000000000)) return false;
      if (
        !active &&
        (!Number.isFinite(dateValue(session.finishedAt)) ||
          dateValue(session.finishedAt) < dateValue(session.startedAt))
      )
        return false;
      return session.exercises.every((row) => {
        if (!exercises.has(row.exerciseId) || !rows(row.sets) || !note(row.notes) || !repRange(row))
          return false;
        if (row.targetReps != null && !numberIn(row.targetReps, 1, 1000, true)) return false;
        if (row.equipmentId) {
          const profile = profiles.get(row.equipmentId);
          if (!profile || profile.gymId !== session.gymId || profile.exerciseId !== row.exerciseId)
            return false;
        }
        return row.sets.every((set) => {
          if (typeof set.done !== 'boolean') return false;
          if (set.prediction != null) {
            const p = set.prediction;
            if (
              !record(p) ||
              !id(p.sourceSessionId) ||
              !id(p.sourceEquipmentId) ||
              !id(p.targetEquipmentId) ||
              !numberIn(p.weight, 0, 100000) ||
              !numberIn(p.sourceWeight, 0, 100000) ||
              !numberIn(p.reps, 1, 1000, true)
            )
              return false;
          }
          if (set.type != null && !['normal', 'warmup', 'failure', 'drop'].includes(set.type)) return false;
          if (set.rir != null && set.rir !== '' && !numberIn(set.rir, 0, 10, true)) return false;
          const draft = active && !set.done;
          // In-progress inputs are saved on every keystroke, including a lone
          // decimal separator and typos. Completed sets always need numbers.
          const pending = (item) => item == null || (typeof item === 'string' && item.length <= 4096);
          return (
            ((draft && pending(set.weight)) || numberIn(set.weight, 0, 10000)) &&
            ((draft && pending(set.reps)) || numberIn(set.reps, 1, 1000, true))
          );
        });
      });
    }
    return (
      value.sessions.every((session) => validSession(session, false)) &&
      (value.active === null ||
        (validSession(value.active, true) &&
          !value.sessions.some((session) => session.id === value.active.id)))
    );
  }

  const api = {
    createState,
    upgradeState,
    validateState,
    validTechniqueFields,
    instructionsLimit,
    parseNumber,
    uid,
    recommend,
    getEquipment,
    ensureEquipment,
    substitutes
  };
  root.GymModel = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
