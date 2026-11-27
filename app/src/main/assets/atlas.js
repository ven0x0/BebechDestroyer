(function Atlas(root) {
  'use strict';
  const L = (typeof window !== 'undefined' ? window : globalThis).GymI18n || require('./i18n.js');

  // Region labels describe the projected location of muscle groups on the two figures.
  const library = root.ExerciseLibrary || require('./library.js');
  const labels = {
    wristExt: L.t('Prostowniki nadgarstka'), hipFlex: L.t('Zginacze biodra'),
    chest: L.t("Piersiowy większy"),
    frontDelt: L.t("Przednia część naramiennego"),
    sideDelt: L.t("Boczna część naramiennego"),
    rearDelt: L.t("Tylna część naramiennego"),
    trap: L.t("Górna część czworobocznego"),
    midBack: L.t("Środkowy grzbiet (czworoboczny i równoległoboczne)"),
    lat: L.t("Najszerszy grzbietu"),
    cuff: L.t("Stożek rotatorów"),
    serratus: L.t("Zębaty przedni"),
    biceps: L.t("Dwugłowy ramienia"),
    brachialis: L.t("Ramienny"),
    triceps: L.t("Trójgłowy ramienia"),
    brachioradialis: L.t("Ramienno-promieniowy"),
    grip: L.t("Zginacze palców i nadgarstka"),
    abs: L.t("Prosty brzucha"),
    obliques: L.t("Skośne brzucha"),
    erectors: L.t("Prostowniki grzbietu"),
    glutes: L.t("Pośladkowy wielki"),
    gluteMed: L.t("Pośladkowy średni"),
    quad: L.t("Czworogłowy uda"),
    adductors: L.t("Przywodziciele uda"),
    hams: L.t("Grupa kulszowo-goleniowa (tył uda)"),
    gastrocnemius: L.t("Brzuchaty łydki"),
    soleus: L.t("Płaszczkowaty")
  };
  const regions = Object.entries(labels).map(([id, label]) => ({ id, label }));
  const roleLabels = { primary: L.t("Główna"), secondary: L.t("Wspomagająca"), stabilizer: L.t("Stabilizująca") };
  const roles = Object.keys(roleLabels);
  const muscleGroups = [
    [L.t('Klata'), ['chest', 'serratus']],
    [L.t('Barki'), ['frontDelt', 'sideDelt', 'rearDelt', 'cuff']],
    [L.t('Górne plecy'), ['trap', 'midBack']],
    ['Lats', ['lat']],
    ['Biceps', ['biceps', 'brachialis']],
    ['Triceps', ['triceps']],
    [L.t('Przedramiona'), ['brachioradialis', 'grip', 'wristExt']],
    [L.t('Brzuch'), ['abs', 'obliques']],
    [L.t('Dolne plecy'), ['erectors']],
    [L.t('Pośladki'), ['glutes', 'gluteMed']],
    [L.t('Przód ud'), ['quad']],
    [L.t('Tył ud'), ['hams']],
    [L.t('Wewnętrzna strona ud'), ['adductors']],
    [L.t('Przód bioder'), ['hipFlex']],
    [L.t('Łydki'), ['gastrocnemius', 'soleus']]
  ];

  // Roles refer to joint actions in the standard movement. They are qualitative.
  // Variant checks included bench press/fly (PMID 33239937), rows/pulldowns
  // (15228624), shoulder exercises (33312291), hip extension (31356511)
  // and standing versus seated calf raises (38156065).
  const movements = {
    'horizontal-press': [['chest'], ['triceps', 'frontDelt'], ['cuff']],
    'chest-fly': [['chest'], ['frontDelt'], ['cuff']],
    'vertical-pull': [['lat'], ['biceps', 'brachialis', 'midBack'], ['grip']],
    'horizontal-pull': [['lat', 'midBack'], ['rearDelt', 'biceps', 'brachialis'], ['grip']],
    'overhead-press': [['frontDelt', 'sideDelt'], ['triceps', 'trap', 'serratus'], ['cuff']],
    'lateral-raise': [['sideDelt'], ['trap', 'serratus'], ['cuff']],
    'reverse-fly': [['rearDelt'], ['midBack'], ['cuff']],
    'elbow-flexion': [['biceps', 'brachialis'], ['brachioradialis'], ['grip']],
    'elbow-extension': [['triceps'], [], []],
    'knee-dominant': [['quad', 'glutes'], ['adductors'], []],
    'knee-extension': [['quad'], [], []],
    'knee-flexion': [['hams'], ['gastrocnemius'], []],
    'hip-hinge': [['hams', 'glutes'], ['adductors'], ['erectors', 'grip', 'obliques']],
    'hip-thrust': [['glutes'], ['hams', 'adductors'], ['obliques']],
    'calf-raise': [['gastrocnemius', 'soleus'], [], []],
    'trunk-flexion': [['abs'], ['obliques'], []]
  };

  // Catalogue entries are keyed to stable exercise IDs; overrides reflect positional differences.
  const entries = {
    'chest-press': ['Machine Chest Press', 'horizontal-press'],
    'bench-press': ['Barbell Bench Press', 'horizontal-press'],
    'dumbbell-press': ['Dumbbell Bench Press', 'horizontal-press'],
    'push-up': [
      'Push-Up',
      'horizontal-press',
      { secondary: ['triceps', 'frontDelt', 'serratus'], stabilizer: ['abs', 'obliques', 'cuff'] }
    ],
    'pec-deck': ['Pec Deck Fly', 'chest-fly'],
    'cable-fly': ['Cable Fly', 'chest-fly', { stabilizer: ['cuff', 'obliques'] }],
    'dumbbell-fly': ['Dumbbell Fly', 'chest-fly', { stabilizer: ['cuff', 'biceps'] }],
    'lat-pulldown': ['Lat Pulldown', 'vertical-pull'],
    'pulldown-machine': ['Machine Lat Pulldown', 'vertical-pull'],
    'pull-up': [
      'Pull-Up',
      'vertical-pull',
      { secondary: ['biceps', 'brachialis', 'midBack', 'rearDelt'], stabilizer: ['grip', 'abs'] }
    ],
    'seated-row': ['Seated Cable Row', 'horizontal-pull', { stabilizer: ['grip', 'erectors'] }],
    'machine-row': ['Machine Row', 'horizontal-pull'],
    'dumbbell-row': [
      'One-Arm Dumbbell Row',
      'horizontal-pull',
      { stabilizer: ['grip', 'erectors', 'obliques'] }
    ],
    'barbell-row': [
      'Bent-Over Barbell Row',
      'horizontal-pull',
      { stabilizer: ['grip', 'erectors', 'hams', 'obliques'] }
    ],
    'shoulder-press': ['Seated Machine Shoulder Press', 'overhead-press'],
    'dumbbell-shoulder-press': ['Dumbbell Shoulder Press', 'overhead-press'],
    'overhead-press': [
      'Barbell Overhead Press',
      'overhead-press',
      { stabilizer: ['cuff', 'abs', 'obliques'] }
    ],
    'lateral-raise': ['Dumbbell Lateral Raise', 'lateral-raise'],
    'cable-lateral-raise': ['Cable Lateral Raise', 'lateral-raise'],
    'machine-lateral-raise': ['Machine Lateral Raise', 'lateral-raise'],
    'rear-delt-fly': ['Reverse Pec Deck Fly', 'reverse-fly'],
    'reverse-cable-fly': ['Reverse Cable Fly', 'reverse-fly', { stabilizer: ['cuff', 'obliques'] }],
    'dumbbell-curl': ['Dumbbell Biceps Curl', 'elbow-flexion'],
    'cable-curl': ['Cable Biceps Curl', 'elbow-flexion'],
    'preacher-curl': ['Machine Preacher Curl', 'elbow-flexion'],
    'barbell-curl': ['Barbell Biceps Curl', 'elbow-flexion'],
    'triceps-pushdown': ['Cable Triceps Pushdown', 'elbow-extension', { stabilizer: ['grip'] }],
    'overhead-extension': [
      'Overhead Dumbbell Triceps Extension',
      'elbow-extension',
      { stabilizer: ['cuff', 'grip'] }
    ],
    'triceps-machine': ['Machine Triceps Extension', 'elbow-extension'],
    'leg-press': ['Leg Press', 'knee-dominant'],
    'hack-squat': ['Hack Squat', 'knee-dominant'],
    squat: ['Barbell Back Squat', 'knee-dominant', { stabilizer: ['erectors', 'abs', 'obliques'] }],
    'goblet-squat': ['Goblet Squat', 'knee-dominant', { stabilizer: ['erectors', 'abs', 'biceps'] }],
    'leg-extension': ['Leg Extension', 'knee-extension'],
    'cable-leg-extension': ['Cable Knee Extension', 'knee-extension'],
    'leg-curl': ['Seated Leg Curl', 'knee-flexion'],
    'lying-leg-curl': ['Lying Leg Curl', 'knee-flexion'],
    'cable-leg-curl': ['Cable Leg Curl', 'knee-flexion'],
    'romanian-deadlift': ['Barbell Romanian Deadlift', 'hip-hinge'],
    'dumbbell-rdl': ['Dumbbell Romanian Deadlift', 'hip-hinge'],
    'hip-thrust': ['Barbell Hip Thrust', 'hip-thrust'],
    'glute-drive': ['Machine Hip Thrust', 'hip-thrust'],
    'glute-bridge': ['Glute Bridge', 'hip-thrust', { stabilizer: ['obliques', 'gluteMed'] }],
    'calf-raise': ['Standing Calf Raise', 'calf-raise'],
    'seated-calf': ['Seated Calf Raise', 'calf-raise', { primary: ['soleus'], secondary: ['gastrocnemius'] }],
    'dumbbell-calf': ['Standing Dumbbell Calf Raise', 'calf-raise', { stabilizer: ['grip'] }],
    'cable-crunch': ['Cable Crunch', 'trunk-flexion'],
    'machine-crunch': ['Machine Crunch', 'trunk-flexion'],
    crunch: ['Floor Crunch', 'trunk-flexion']
  };

  for (const ex of library.additions) {
    const f = library.families[ex.family];
    if (!Object.hasOwn(movements, ex.pattern)) movements[ex.pattern] = [f.primary, f.secondary, f.stabilizer];
    entries[ex.id] = [ex.nameEn, ex.pattern, {primary:f.primary, secondary:f.secondary, stabilizer:f.stabilizer}];
  }
  const commonNames = {
    'atlas-dragon-flag': ['Dragon Flag', 'Dragonflag', 'Dragon Flags', 'Flaga smoka'],
    'atlas-negative-dragon-flag': ['Dragon Flag Negative', 'Eccentric Dragon Flag', 'Negatyw smoczej flagi'],
    'atlas-tuck-dragon-flag': ['Tucked Dragon Flag', 'Dragon Flag Tuck'],
    'atlas-one-leg-dragon-flag': ['One Leg Dragon Flag', 'Dragon Flag One Leg'],
    'atlas-v-up': ['V Ups', 'Scyzoryk'],
    'atlas-scapular-pull-up': ['Scap Pull Up', 'Scapular Pullup'],
    'atlas-pike-push-up': ['Pike Pushup', 'Pompki pike'],
    'chest-press': ['Chest Press'],
    'bench-press': ['Bench Press'],
    'dumbbell-press': ['Dumbbell Chest Press'],
    'push-up': ['Push Up', 'Push Ups', 'Pompka'],
    'pec-deck': ['Pec Deck', 'Chest Fly Machine'],
    'lat-pulldown': ['Lat Pull Down'],
    'pull-up': ['Pull Up', 'Pull Ups'],
    'dumbbell-row': ['Dumbbell Row', 'Single Arm Dumbbell Row'],
    'barbell-row': ['Barbell Row', 'Bent Over Row'],
    'shoulder-press': ['Machine Shoulder Press'],
    'overhead-press': ['Overhead Press', 'Military Press'],
    'rear-delt-fly': ['Reverse Pec Deck', 'Rear Delt Fly Machine'],
    'dumbbell-curl': ['Dumbbell Curl'],
    'barbell-curl': ['Barbell Curl'],
    'triceps-pushdown': ['Triceps Pushdown'],
    squat: ['Back Squat', 'Barbell Squat'],
    'romanian-deadlift': ['Romanian Deadlift', 'RDL'],
    'dumbbell-rdl': ['Dumbbell RDL'],
    'hip-thrust': ['Hip Thrust'],
    'glute-drive': ['Glute Drive'],
    crunch: ['Crunch', 'Crunches']
  };

  function exercise(state, idOrExercise) {
    if (idOrExercise && typeof idOrExercise === 'object') return idOrExercise;
    return state?.exercises?.find((item) => item.id === idOrExercise);
  }
  function entryFor(ex) {
    return ex && Object.hasOwn(entries, ex.id) ? entries[ex.id] : null;
  }
  function name(state, idOrExercise) {
    const ex = exercise(state, idOrExercise);
    if (!ex) return '';
    const localized = library.names[ex.id];
    if (localized) return localized[state?.language === 'en' ? 1 : 0];
    return (state?.language === 'en' && ex.nameEn) || ex.name || ex.nameEn || '';
  }
  function aliases(state, idOrExercise) {
    const ex = exercise(state, idOrExercise);
    const synonyms = ex && Object.hasOwn(commonNames, ex.id) ? commonNames[ex.id] : [];
    return ex
      ? [
          ...new Set(
            [ex.name, ex.nameEn, ...(library.names[ex.id] || []), entryFor(ex)?.[0], ...synonyms].filter(
              (x) => typeof x === 'string' && x.trim()
            )
          )
        ]
      : [];
  }

  function describe(state, idOrExercise) {
    const ex = exercise(state, idOrExercise),
      entry = entryFor(ex);
    const pattern = entry?.[1] || ex?.pattern;
    const base = typeof pattern === 'string' && Object.hasOwn(movements, pattern) ? movements[pattern] : [];
    const custom =
      ex?.muscles &&
      Array.isArray(ex.muscles.primary) &&
      ex.muscles.primary.some((id) => typeof id === 'string' && Object.hasOwn(labels, id));
    const seen = new Set(),
      muscles = [];
    roles.forEach((role, index) => {
      const regionIds = custom ? ex.muscles[role] : entry?.[2]?.[role] || base[index];
      for (const id of Array.isArray(regionIds) ? regionIds : []) {
        if (typeof id !== 'string' || seen.has(id) || !Object.hasOwn(labels, id)) continue;
        seen.add(id);
        muscles.push({ id, label: labels[id], role });
      }
    });
    return {
      name: name(state, ex),
      source: custom ? 'custom' : entry ? 'catalogue' : base.length ? 'pattern' : 'unmapped',
      muscles
    };
  }

  const esc = (value) =>
    String(value ?? '').replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
    );
  // Each path is the left half of a paired group, around the figure center x=60.
  const front = {
    hipFlex: 'M42 112 Q46 114 51 121 L52 133 L47 124 Z',
    trap: 'M51 39 Q47 43 37 46 L47 46 L54 43Z',
    frontDelt: 'M38 47 Q30 48 27 58 L31 66 Q34 59 42 51Z',
    sideDelt: 'M31 48 Q23 49 21 60 L20 68 Q23 67 27 63 Q26 56 31 48Z',
    chest:
      'M41.4 49.2 Q49 47.6 58.7 49.8 L58.9 63.4 Q58.4 68.8 51.5 70.2 Q44.8 71.2 39 66.2 L33.2 61 Q37 54.5 41.4 49.2Z',
    biceps: 'M28.5 65 Q32.7 64 32.2 72 Q30.8 81.9 22.2 88.7 Q19.2 81.6 23.3 72.2Z',
    brachialis: 'M31.6 75.8 Q31.7 83.5 24.8 90.5 L22 92.4 L23 89.8 Q28.6 84 31.6 75.8Z',
    brachioradialis: 'M20.5 87.5 Q20.3 93.6 22.8 95.2 Q18.1 106.9 13 115.5 L14.7 101.8Q15.3 94.5 20.5 87.5Z',
    grip: 'M23.8 96.4 Q24.5 100.6 21.6 107 L14.4 122.9 L11.7 123 Q17 109.2 23.8 96.4Z',
    serratus:
      'M35.2 67.1 L42.1 72.6 L35.1 71.5ZM35.2 72.2L43.2 77.3L36.1 76.5ZM36.4 77.2L44.1 81.8L37.6 81.2Z',
    obliques:
      'M36.8 82.3 Q40.3 82.9 45 85.5 L45.5 102.5 Q46.6 109.8 51.6 117.2 L47.3 115.9 L38.6 105 Q40 94.8 36.8 82.3Z',
    abs: 'M46.2 72.8 Q51.6 71.4 58.4 72.1 L58.5 79.2 L47.5 80.1Z M47.2 82Q52.2 80.6 58.6 81.2L58.5 87.9L47.4 89Z M47.6 90.6Q53.1 88.9 58.5 89.8L58.5 97.3L48.5 98Z M48.9 99.8L58.3 99L58.6 121Q52.6 116.7 50 108.4Z',
    quad: 'M38.5 117.6Q34.1 125.9 35.5 140.3Q35.5 151.3 40.1 161.8L43.5 168.2L44 155Q39.8 137.5 38.5 117.6Z M40.4 118.4Q46.3 123.4 48.7 138.5Q50.6 151 47.3 163.9L44.5 154.6Q40.5 139.5 40.4 118.4Z M52 146Q54 152.1 52 162.2Q51 170 47 172L47.5 165.7Q50.4 156.5 52 146Z',
    adductors: 'M44.2 117.6Q52.4 120 57.5 129.6L55.2 144L52.5 151.2Q52 136.8 44.2 117.6Z'
  };
  const back = {
    wristExt: 'M17 98 Q20 95 21 97 Q19 109 13 120 L12 119 Z',
    trap: 'M54 34.5Q54.1 39.7 48.7 42.1L34.1 47.3Q44 48.3 49.8 51.8L58.7 62.7L59.1 45.9Z',
    midBack: 'M47.1 52Q53 55.5 58.9 64.3L58.9 86.4Q54.8 74 49.1 66.4L43.4 61Q47.3 58.3 47.1 52Z',
    sideDelt: 'M30.8 48Q22.2 49.2 20.7 59.6L20.3 68.8Q24.4 65.2 26 61Q26 53.5 30.8 48Z',
    rearDelt: 'M32.2 48.3Q37.6 47.5 43.5 51.4Q37.7 57.3 32 63.4L26.5 67.2Q27.1 54.6 32.2 48.3Z',
    cuff: 'M43.9 52.7Q46.1 56.8 42.6 60L35.3 64L33.8 63.3Z M35 65.3L43 61.5L47.5 65.9L42.4 67.7Z',
    lat: 'M33.8 67L41.1 69Q47.5 67.7 49.5 69.3L55.8 83.7Q53 91.2 48.7 97L42.5 106.6Q40.9 95.4 37.4 84.7Z',
    erectors: 'M56.8 86Q58.1 92 58.5 104.1L58.6 119.7Q54.2 112.8 48 109.8L45 108.6Q51.2 97.2 56.8 86Z',
    triceps: 'M25.8 67.7L31 65.2Q33.1 76.2 27.4 85.4L22.1 91Q21.7 85.8 22.9 81.2Q18.9 81.3 20.1 76.4Z',
    brachioradialis: 'M20.4 88.4L21.7 94.2Q19.5 104.6 12.3 117.2L14.9 102.2Z',
    gluteMed: 'M40.3 108.4Q45.6 108.8 51.5 112.8Q44.7 112.2 36.4 123.5Q37 115.3 40.3 108.4Z',
    glutes:
      'M50.3 114.3Q55.2 114.3 58.8 120.9L58.7 133.5Q54.9 139.3 46.8 138.4Q40.1 138.5 35.7 134.6L36.7 125.6Q42.1 117.3 50.3 114.3Z',
    hams: 'M35.9 137Q40 140.6 45.6 140.2Q44.6 148.5 44.4 156.3L42.2 170.4Q40.8 161.1 37.6 154.8Z M47.4 140.4Q53.5 140.2 56.1 137.4Q54 151.8 50.4 163.3L47.9 171.9Q45.3 163.2 46 154.6Z',
    gastrocnemius:
      'M42.2 178Q44.2 180.5 44.9 187.7Q46.2 196.8 42.7 205.1Q40.9 207.9 39.8 205.1Q36.6 195.5 39.3 186.2Z M46.2 178.3Q50.6 180.9 51.6 188.1Q53 196.3 49.2 204.1Q47.3 207.8 45.1 206.3L46.1 193.3Z',
    soleus:
      'M38.5 192.6Q38.6 204.7 41.9 209.3L43.6 212.2L42.9 221.3Q39.3 212.9 38.1 205.6Z M50.7 204.7Q53.3 199.9 52.6 190.3Q55 199.6 51.9 208.2L47.3 221.9L46.3 216.1Z'
  };

  const bodyHalf =
    'M60 31 L54.9 31 Q55.2 38.7 51.5 40.6 Q47 43.1 37.7 45 Q31.8 45 28.3 47.4 Q21 50.4 19.8 59.7 L18.5 71.3 Q17.1 78 16.8 84.7 L15.3 92.4 Q11.7 98.1 11.6 105.6 L8.4 123.3 L5.2 129.5 L4.5 135.7 Q4.5 138.2 6.1 136.9 L8 133.6 L6.2 141.9 Q6 144.1 7.7 143.3 L10.2 137.8 L8.3 144.4 Q8.6 146.4 10.2 144.8 L12.6 138.8 L11.7 143 Q12 145 13.5 142.4 L16 134.6 L16.3 128 L16.1 124.2 L23.1 110.5 Q27.4 104.4 27.9 97.8 L29 91.9 Q33.3 85.7 34.8 76.6 L35.5 81 Q40 95.5 37.2 105.8 Q33.2 119.2 33.6 132.1 Q33.3 146.2 37.6 158.7 L40.3 172.5 Q40 177.7 38.7 183.3 Q35 195.8 37.5 207.3 L40.7 222.3 L40.4 230.7 Q38.2 235.2 34.5 239.4 Q32.4 242.3 35.1 243.1 L46.9 243.2 Q50.8 243.2 50.9 240.3 L49.5 232 Q48.6 225.8 50.2 218.6 L53.1 206.8 Q55.4 193.8 52.6 183.6 L51.7 175.3 L54 162.8 Q57.4 149.4 59.6 138.4 L60 137Z';
  const head =
    'M60 4 Q51.5 4 50.8 12.8 L50.9 16.4 Q48.5 15.8 49.4 20.2 Q49.8 22.8 51.7 23.4 L53.5 28.1 Q55.2 31.5 58.5 33.3 Q60 34.1 61.5 33.3 Q64.8 31.5 66.5 28.1 L68.3 23.4 Q70.2 22.8 70.6 20.2 Q71.5 15.8 69.1 16.4 L69.2 12.8 Q68.5 4 60 4Z';
  const details = {
    front:
      'M52.5 36.3Q54.2 43.8 58.7 46.4 M53 44.7Q48 45.4 43.8 47 M39.4 174Q42.8 177.3 47.2 175 Q49.8 178.5 47.6 182.6 M41 184.1Q40.4 187.6 41.9 193 Q43.2 201.1 43.7 213.3 M47.7 184Q50.9 190.3 50.1 197.3 M41.8 225.3L42.1 231.3 M37.3 236.6Q43.8 238.3 47.3 236',
    back: 'M52.3 36.1Q56.6 39.9 58.5 44.4 M56.5 106.7Q53.2 103.7 52.3 100.3 M41.3 172.3Q45.4 174.9 48.5 172.3 M42.6 224.8Q42.2 230.7 41.3 233.5 M46.4 223.8Q46.1 230.2 47.6 233.8'
  };
  const mirror = 'translate(120 0) scale(-1 1)';
  function mirrored(d) {
    return `<path d="${d}"/><path d="${d}" transform="${mirror}"/>`;
  }
  // The women's regions use the same landmarks as their outline (x=60 is the midline).
  const femaleBodyHalf =
    'M60 31 L55.8 31 Q56.4 38.8 52.4 41.6 Q48.6 44 40.3 45.8 Q31.8 46.5 28.1 52.2 Q25.6 56.4 24.9 63.1 Q24.1 73.9 20.9 84 Q19.3 88.2 19.7 93 Q16 99.1 15 106 Q14.2 112.2 11.9 120.7 L10.8 125 Q8 129.5 7.1 133.7 Q6.6 135.9 7.5 136.3 L10.1 132.9 L8.4 140 Q8.2 141.8 9.5 141.1 L11.4 136.8 L10.1 142 Q10.1 143.6 11.2 142.7 L13.1 137.7 L12.3 141.2 Q12.4 142.7 13.5 141 L16.2 133.6 Q17.5 130.3 16.5 126.1 Q17.7 120.7 22.9 110.2 Q26.1 103.7 26.8 96 Q29.5 90.7 31.5 84.6 Q34.2 78 35.4 70.2 Q36.5 80.7 38.3 86.2 Q40.7 93.4 38.9 99.5 Q37.9 104.2 34.6 112.1 Q30.2 121.8 30.7 133.5 Q31.1 145.7 35 156.8 Q38.2 166.6 39.5 171.8 Q40.2 176.8 38.3 183.4 Q34.5 195.4 37.5 208.9 Q39.5 219.3 40.3 225.6 L40.1 232 Q37.4 236.8 33.9 239.5 Q31.9 241.9 35.2 242.7 Q41.7 243.6 48 242.4 Q50.1 241.7 49.8 239.2 L48.6 232.2 Q48 226.7 50.1 217.2 Q53.5 204.1 53.2 192.1 Q53.2 182.7 51.2 176.5 Q51.2 169.2 54.4 157.1 Q58.1 143.3 59.6 135.5 L60 134.5Z';
  const femaleHead =
    'M60 6.9 C54.6 6.9 50.9 11 50.8 17.2 L51.3 21.5 Q49.7 20.3 50.3 23.3 Q50.7 26 52.3 26.5 Q53.4 30.9 57.1 33.6 Q60 35.9 62.9 33.6 Q66.6 30.9 67.7 26.5 Q69.3 26 69.7 23.3 Q70.3 20.3 68.7 21.5 L69.2 17.2 C69.1 11 65.4 6.9 60 6.9Z';
  const femaleBun = 'M54.7 9.3 C53 5.5 55.9 2.6 60 2.6 C64.1 2.6 67 5.5 65.3 9.3 Q60 13.2 54.7 9.3Z';
  const femaleFront = {
    trap: 'M54.9 38.8 Q52.8 43.4 42.5 46.4 Q48.2 46.8 53.2 43.5Z',
    frontDelt: 'M39.7 47 Q32.9 48.2 30.1 55.1 Q29 59.6 31.2 64 Q34.1 57.2 41.5 50.3Z',
    sideDelt: 'M32 49.5 Q25.8 53.8 25.8 64.8 L25.7 68.2 Q28.1 65.8 29.3 61.5 Q28.3 55.2 32 49.5Z',
    chest: 'M42 49.9 Q50.3 47.9 58.7 50.1 L58.5 64.4 Q57.3 70.2 51 71.8 Q42.6 73.8 36.5 68.3 L34.4 63.3 Q37.2 56.4 42 49.9Z',
    biceps: 'M30.6 65.8 Q33.9 64.1 33.8 69.8 Q33.1 79 24.9 87.8 Q22.3 82.7 25.2 74.6Z',
    brachialis: 'M32.4 78.7 Q31.1 85.3 26 91.2 L24 92.2 L25.5 88.9Z',
    brachioradialis: 'M22.3 88.1 L24.2 94.4 Q22 102.9 15.4 114.1 Q15.6 105.8 18.1 98.7Z',
    grip: 'M25.2 96.1 Q25.4 103.7 20.3 112.6 L15.5 122.6 L13.2 122.4 Q18.6 107.1 25.2 96.1Z',
    serratus: 'M36.1 70.3 Q39.1 73 44.9 73.9 L37.1 75.4Z M37.4 76.1 L45.8 76.7 L38.5 80Z',
    obliques: 'M38.6 81.6 Q42.5 81.8 46.5 85.5 L47.1 99.3 Q47.2 106.8 51.4 114.5 Q44.9 111.8 38.1 104.8 Q41.4 94.2 38.6 81.6Z',
    abs: 'M47.2 75.1 Q52.1 73.1 58.6 73.7 L58.6 81.1 Q52.9 80.6 47.8 82.3Z M47.9 83.8 Q52.4 82 58.6 82.6 L58.6 90.2 Q52.7 89.6 47.9 91.2Z M48.1 92.9 Q53 90.9 58.6 91.7 L58.6 99.1 L48.8 99.8Z M49.1 101.2 L58.6 100.6 L58.6 119.2 Q51.2 113.4 49.1 101.2Z',
    hipFlex: 'M36.1 108.4 Q42 112.4 47.9 119.3 L49.9 128.2 Q45.4 120.5 35.6 114Z',
    quad: 'M34.3 117.4 Q30.4 130.9 33.3 144.6 Q35.5 157.1 42.7 168.8 Q43.5 161.1 40.7 151.1 Q35.6 133.4 34.3 117.4Z M36.5 118.1 Q43.4 120.9 47.2 135.5 Q51.4 151.9 45.5 165.8 Q43.5 155.2 40.6 143.1 Q37.4 130.8 36.5 118.1Z M51.4 149 Q54 157.2 49.3 169.4 L46.3 171.7 Q46.4 168.2 48.2 164.6Z',
    adductors: 'M41 117.4 Q49.4 121.1 57.1 130.4 Q55.9 139.4 52.2 147.4 Q49.3 128.7 41 117.4Z'
  };
  const femaleBack = {
    trap: 'M55 36 Q54.4 41.8 49.3 44 L39 47.2 Q47.2 49.1 50.3 53.5 L58.8 63.2 L58.8 45.5Z',
    midBack: 'M48.5 53.1 Q54.6 58.3 58.6 64.6 L58.6 84 Q55.6 74 50.4 67.9 L44.9 62.5 Q48.1 58.4 48.5 53.1Z',
    rearDelt: 'M33.8 49.2 Q38.2 47.5 44.1 51.8 Q38.2 57.9 33.7 63 L29.5 66.4 Q29.8 55.2 33.8 49.2Z',
    sideDelt: femaleFront.sideDelt,
    cuff: 'M45.9 53.5 Q47.7 57.9 43.6 61.8 L36.4 64.7Z M36.3 66 L43.9 63.1 L48.2 67.1 L42.9 68.6Z',
    lat: 'M35.8 68.7 Q42.1 71.1 49.6 69.8 L55.9 84.3 Q54.3 91.7 48.6 98 L41 105.8 Q42.6 96.9 39.2 85.7Z',
    erectors: 'M56.4 87.8 Q58 94.1 58.6 102.4 L58.6 118.1 Q53.9 111.2 47.2 109.9 Q53.7 101.1 56.4 87.8Z',
    triceps: 'M26.5 69.1 L32.7 65.7 Q34.9 75.1 29.5 84 L24.6 90 Q21.8 84.5 23.5 79 Q23.3 74.1 26.5 69.1Z',
    brachioradialis: femaleFront.brachioradialis,
    wristExt: 'M20.9 97.4 Q23.5 95.7 25 97.2 Q22.5 108.9 15 120 L13.5 119.7Z',
    gluteMed: 'M37.3 107.7 Q43.4 109.4 49.3 113.4 Q40.1 114.8 32.5 126 Q33.4 115.1 37.3 107.7Z',
    glutes: 'M48.2 115.6 Q54.7 113.7 58.6 120.1 L58.6 132.3 Q57 139.2 49.4 140 Q39.8 140.1 32.4 134.5 Q31.5 123.2 40.4 118.4 Q44 116.3 48.2 115.6Z',
    hams: 'M32.8 137.2 Q38.1 140.9 44.3 141.4 Q44.1 151.4 43.7 158.5 L42.1 170.3 Q38.2 161 35.8 151.9 Q33.5 144.3 32.8 137.2Z M46 141.5 Q52 142.6 57.2 137.5 Q54.9 148.3 52.5 156.3 L47.2 170.8 Q45.6 156.9 46 141.5Z',
    gastrocnemius: 'M42.1 178.6 Q45.4 180.6 45.4 188.1 Q45.3 198.4 41.2 206.3 Q38.9 208.2 38.2 204.2 Q35.7 191.3 42.1 178.6Z M46.8 178.9 Q51.1 181 51.8 189.5 Q52.8 200.2 48.5 206.5 Q45.5 209.3 44.3 204.9 Q46.7 193.8 46.8 178.9Z',
    soleus: 'M37.7 201.8 Q38.8 210.8 42.8 211.1 L43.8 221.3 Q39.5 216.5 37.7 201.8Z M51.3 201.3 Q50.5 211.1 45.1 221.5 L44.9 212.6 Q48.2 209.7 51.3 201.3Z'
  };
  const femaleDetails = {
    front: 'M51.5 20 Q52 15.2 55 13.5 Q57.7 12.6 60 11.5 M54.1 39.7 Q54.6 43.5 58.7 46.4 M55.4 46.3 Q48.2 45.7 42.1 48 M40.3 172.4 Q43.2 173.8 46.6 173.1 Q49.5 174.8 47.5 179.9 M41.7 183 Q44 194 43.6 213.5 M41.8 224.8 L42 231.1',
    back: 'M51.6 18 Q51.4 28.2 56.6 31.4 Q58.4 32.3 60 32.5 M53 40.7 Q55.4 43.1 58.4 44.7 M41.1 172.6 Q45 174.5 48.9 172.1 M43.2 223.8 Q43.7 228 42.2 231.4'
  };
  function anatomyFigure(view, muscles, thumbnail = false, sex = 'male') {
    const female = sex === 'female';
    const frontView = view === 'front',
      caption = frontView ? L.t("Przód") : L.t("Tył");
    const shapes = frontView ? (female ? femaleFront : front) : (female ? femaleBack : back);
    const activity = new Map(muscles.map((m) => [m.id, m.role]));
    const layers = Object.entries(shapes)
      .map(([id, d]) => {
        const role = activity.get(id);
        return `<g class="atlas-shape${role ? ' atlas-' + role : ''}"${role ? ` data-atlas-region="${id}"` : ''}>${role ? `<title>${labels[id]} · ${roleLabels[role].toLowerCase()}</title>` : ''}${mirrored(d)}</g>`;
      })
      .join('');
    const attributes = thumbnail
      ? 'class="atlas-thumbnail" aria-hidden="true" focusable="false"'
      : `aria-label="${frontView ? L.t("Przód sylwetki") : L.t("Tył sylwetki")}" role="img"`;
    const svg = `<svg ${attributes} data-figure="${female ? 'female' : 'male'}" viewBox="0 0 120 250"><ellipse class="atlas-ground" cx="60" cy="245" rx="37" ry="2"/><g class="atlas-base">${mirrored(female ? femaleBodyHalf : bodyHalf)}${female ? `<path d="${femaleBun}"/>` : ''}<path d="${female ? femaleHead : head}"/></g>${layers}<g class="atlas-details">${mirrored((female ? femaleDetails : details)[view])}</g></svg>`;
    return thumbnail
      ? svg
      : `<figure class="atlas-figure">${svg}<figcaption>${caption}</figcaption></figure>`;
  }
  function figure(state, id, side = 'front') {
    const { muscles } = describe(state, id);
    if (!muscles.length) return '';
    if (side === 'auto') {
      const counts = (shapes) =>
        muscles.filter((m) => m.role === 'primary' && Object.hasOwn(shapes, m.id)).length;
      side = counts(back) > counts(front) ? 'back' : 'front';
    }
    return anatomyFigure(side === 'back' ? 'back' : 'front', muscles, true, state?.sex);
  }

  function groupMuscles(muscles) {
    return muscleGroups
      .map(([name, ids]) => ({ name, members: muscles.filter(m => ids.includes(m.id)) }))
      .filter(group => group.members.length)
      .sort((a, b) => roles.indexOf(a.members[0].role) - roles.indexOf(b.members[0].role));
  }
  function roleText(role, sets) {
    return sets === undefined ? roleLabels[role] : `${roleLabels[role]} · ${sets}`;
  }
  const mapHint = L.t("Dotknij zaznaczonego mięśnia, aby zobaczyć jego nazwę i rolę.");
  const legendLabels = { primary: L.t("Główne"), secondary: L.t("Wspomagające"), stabilizer: L.t("Stabilizujące") };
  function mapKey(muscles) {
    if (!muscles.length) return '';
    const items = roles.filter(role => muscles.some(m => m.role === role)).map(role =>
      `<li><i class="atlas-key atlas-${role}" aria-hidden="true"></i>${legendLabels[role]}</li>`
    ).join('');
    return `<div class="atlas-map-key"><ul aria-label="${L.t("Role mięśni")}">${items}</ul><p class="atlas-readout" aria-live="polite" aria-atomic="true">${mapHint}</p></div>`;
  }
  function muscleItem(m) {
    return `<button class="atlas-muscle" type="button" data-atlas-pick="${m.id}" data-atlas-role="${m.role}" aria-pressed="false"><span class="atlas-key atlas-${m.role}" aria-hidden="true"></span><span>${esc(m.label)}</span><span class="atlas-role">${roleText(m.role, m.sets)}</span></button>`;
  }
  function renderGroups(groups, setsByGroup) {
    return groups.map(({name, members}) => {
      const role = members[0].role;
      return `<details class="atlas-group"><summary><i class="atlas-key atlas-${role}" aria-hidden="true"></i><strong>${esc(name)}</strong><span class="atlas-role">${roleText(role, setsByGroup?.get(name))}</span><i class="atlas-chevron" aria-hidden="true"></i></summary>${members.map(muscleItem).join('')}</details>`;
    }).join('');
  }
  function render(state, id) {
    const info = describe(state, id);
    const explanation =
      info.source === 'pattern'
        ? L.t("Profil przybliżony na podstawie wzorca ruchu.")
        : info.source === 'custom'
          ? L.t("Profil przypisany do Twojego ćwiczenia.")
          : L.t("Typowe role mięśni przy standardowym wykonaniu. Ustawienie i technika wpływają na ich udział.");
    if (!info.muscles.length)
      return ("<section class=\"atlas-card panel\"><h2>" + L.t("Zaangażowanie mięśni") + "</h2><p>" + L.t("To ćwiczenie nie ma jeszcze przypisanego profilu mięśni.") + "</p></section>");
    const list = renderGroups(groupMuscles(info.muscles));
    return `<section class="atlas-card panel" data-atlas-card><header class="atlas-title"><h2>${L.t("Zaangażowanie mięśni")}</h2></header><div class="atlas-layout"><div class="atlas-scene"><div class="atlas-pair">${figures(info.muscles, state.sex)}</div>${mapKey(info.muscles)}</div><div class="atlas-list"><div class="atlas-table-head"><span>${L.t("Partia mięśniowa")}</span><span>${L.t("Rola")}</span></div>${list}</div></div><p class="atlas-note">${L.t("Przy partii pokazujemy jej najważniejszą rolę. Rozwiń ją, aby zobaczyć poszczególne mięśnie.")} ${explanation}</p></section>`;
  }
  function highlight(card, button) {
    const id = button.dataset.atlasPick;
    const picked = card.dataset.atlasSelected === id ? '' : id;
    card.dataset.atlasSelected = picked;
    const readout = card.querySelector('.atlas-readout');
    readout.textContent = picked ? `${labels[id]} · ${roleLabels[button.dataset.atlasRole]}` : mapHint;
    for (const region of card.querySelectorAll('[data-atlas-region]')) {
      region.classList.toggle('atlas-muted', Boolean(picked) && region.dataset.atlasRegion !== picked);
      region.classList.toggle('atlas-picked', region.dataset.atlasRegion === picked);
    }
    for (const button of card.querySelectorAll('[data-atlas-pick]')) {
      button.setAttribute('aria-pressed', String(button.dataset.atlasPick === picked));
    }
  }
  if (root.document)
    root.document.addEventListener('click', (event) => {
      const hit = event.target.closest?.('[data-atlas-pick],[data-atlas-region]');
      const card = hit?.closest('[data-atlas-card]');
      if (card) {
        const id = hit.dataset.atlasPick || hit.dataset.atlasRegion;
        const button = card.querySelector(`[data-atlas-pick="${id}"]`);
        if (!button) return;
        for (let section = button.closest('details'); section; section = section.parentElement.closest('details')) {
          section.open = true;
        }
        highlight(card, button);
      }
    });
  // The live workout uses the same anatomical regions and role colors as the
  // single-exercise atlas, combining roles from its confirmed exercises.
  function figures(muscles, sex, thumbnail = false) {
    return anatomyFigure('front', muscles, thumbnail, sex) + anatomyFigure('back', muscles, thumbnail, sex);
  }
  const api = { name, aliases, describe, render, figure, figures, regions, groupMuscles, renderGroups, mapKey };
  root.ExerciseAtlas = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);
