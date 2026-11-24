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
  // Reproject the outline and muscle layers together so every highlighted region stays aligned.
  const profileWidths = [
    [4, 0.98],
    [32, 0.92],
    [48, 0.81],
    [70, 0.85],
    [94, 0.79],
    [110, 1.04],
    [128, 1.18],
    [146, 1.12],
    [175, 1.02],
    [243, 0.97]
  ];
  const femalePaths = new Map();
  function femalePath(path) {
    if (femalePaths.has(path)) return femalePaths.get(path);
    const result = path.replace(/(-?[\d.]+)\s+(-?[\d.]+)/g, (_, x, y) => {
      const end = profileWidths.findIndex(([height]) => height >= Number(y));
      const [lo, from] = profileWidths[end < 0 ? profileWidths.length - 1 : Math.max(0, end - 1)];
      const [hi, to] = profileWidths[end < 0 ? profileWidths.length - 1 : end];
      const scale = hi === lo ? from : from + ((to - from) * (Number(y) - lo)) / (hi - lo);
      // Hands and forearms alongside the hips follow the narrower shoulder line.
      const width = Number(y) > 90 && Number(y) < 150 && Number(x) < 29 ? 0.9 : scale;
      return Number((60 + (Number(x) - 60) * width).toFixed(2)) + ' ' + y;
    });
    femalePaths.set(path, result);
    return result;
  }
  function anatomyFigure(view, muscles, thumbnail = false, sex = 'male') {
    const pathFor = sex === 'female' ? femalePath : d => d;
    const frontView = view === 'front',
      caption = frontView ? L.t("Przód") : L.t("Tył");
    const shapes = frontView ? front : back;
    const activity = new Map(muscles.map((m) => [m.id, m.role]));
    const layers = Object.entries(shapes)
      .map(([id, d]) => {
        const role = activity.get(id);
        const outline = sex === 'female' && id === 'chest'
          ? 'M57.5 48 Q49 46 41 50 Q36.5 54 33 62 Q33 70 39 73 Q47 77 55 69 Q59 65 58.3 56 Z'
          : d;
        return `<g class="atlas-shape${role ? ' atlas-' + role : ''}"${role ? ` data-atlas-region="${id}"` : ''}>${role ? `<title>${labels[id]} · ${roleLabels[role].toLowerCase()}</title>` : ''}${mirrored(pathFor(outline))}</g>`;
      })
      .join('');
    const attributes = thumbnail
      ? 'class="atlas-thumbnail" aria-hidden="true" focusable="false"'
      : `aria-label="${frontView ? L.t("Przód sylwetki") : L.t("Tył sylwetki")}" role="img"`;
    const svg = `<svg ${attributes} data-figure="${sex === 'female' ? 'female' : 'male'}" viewBox="0 0 120 250"><ellipse class="atlas-ground" cx="60" cy="245" rx="37" ry="2"/><g class="atlas-base">${mirrored(pathFor(bodyHalf))}<path d="${pathFor(head)}"/></g>${layers}<g class="atlas-details">${mirrored(pathFor(details[view]))}</g></svg>`;
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

  const roleOrder = ['primary', 'secondary', 'stabilizer'];
  function muscleItem(m) {
    return `<button class="atlas-muscle" type="button" data-atlas-pick="${m.id}" aria-pressed="false"><span class="atlas-key atlas-${m.role}" aria-hidden="true"></span><span>${esc(m.label)}</span><span class="atlas-role">${roleLabels[m.role]}</span></button>`;
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
    const list = roleOrder
      .flatMap((role) => info.muscles.filter((m) => m.role === role))
      .map(muscleItem)
      .join('');
    return `<section class="atlas-card panel" data-atlas-card><header class="atlas-title"><h2>${L.t("Zaangażowanie mięśni")}</h2></header><div class="atlas-layout"><div class="atlas-scene"><div class="atlas-pair">${figures(info.muscles, state.sex)}</div></div><div class="atlas-list"><div class="atlas-table-head"><span>${L.t("Mięsień")}</span><span>${L.t("Rola")}</span></div>${list}</div></div><p class="atlas-note">${explanation}</p></section>`;
  }
  function highlight(card, id) {
    const picked = card.dataset.atlasSelected === id ? '' : id;
    card.dataset.atlasSelected = picked;
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
      if (card) highlight(card, hit.dataset.atlasPick || hit.dataset.atlasRegion);
    });
  // The live workout uses the same anatomical regions and role colors as the
  // single-exercise atlas, combining roles from its confirmed exercises.
  function figures(muscles, sex) {
    return anatomyFigure('front', muscles, false, sex) + anatomyFigure('back', muscles, false, sex);
  }
  const api = { name, aliases, describe, render, figure, figures, regions };
  root.ExerciseAtlas = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);
