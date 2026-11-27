(function demoModule(root) {
  'use strict';
  const L = (typeof window !== 'undefined' ? window : globalThis).GymI18n || require('./i18n.js');
  // World coordinates are centimetres. X points forwards, Y upwards and Z to the athlete's right.
  // Explicit camera angles and attachments keep each drawing independent of the UI language.
  const exercises = {
    'chest-press': ['press', 'chest-lever', 32, 9, L.t("Uchwyty przy klatce"), L.t("Uchwyty przed tułowiem")],
    'bench-press': ['bench', 'bar', 44, 31, L.t("Sztanga przy klatce"), L.t("Sztanga nad klatką")],
    'dumbbell-press': ['bench', 'db', 57, 14, L.t("Hantle po bokach klatki"), L.t("Hantle nad barkami")],
    'push-up': ['pushup', 'mat', 40, 3, L.t("Klatka blisko podłogi"), L.t("Tułów w podporze")],
    'pec-deck': ['fly', 'fly-lever', 58, 28, L.t("Uchwyty po bokach"), L.t("Uchwyty przed klatką")],
    'cable-fly': ['fly', 'fly-cable', 56, 29, L.t("Ramiona rozstawione"), L.t("Dłonie przed klatką")],
    'dumbbell-fly': ['fly', 'fly-db', 66, 23, L.t("Hantle po bokach"), L.t("Hantle nad klatką")],
    'lat-pulldown': ['pulldown', 'lat-cable', -57, 7, L.t("Drążek nad głową"), L.t("Drążek przy górze klatki")],
    'pulldown-machine': ['pulldown', 'lat-lever', -52, 10, L.t("Uchwyty wysoko"), L.t("Łokcie obok żeber")],
    'pull-up': ['pullup', 'fixed-bar', -59, 7, L.t("Zwis na drążku"), L.t("Broda na wysokości drążka")],
    'seated-row': ['row', 'row-cable', -42, 16, L.t("Ramiona wysunięte"), L.t("Uchwyt przy brzuchu")],
    'machine-row': ['row', 'row-lever', -28, 9, L.t("Klatka oparta o pad"), L.t("Uchwyty przy tułowiu")],
    'dumbbell-row': ['row', 'row-db', -18, 13, L.t("Hantel pod barkiem"), L.t("Łokieć przy biodrze")],
    'barbell-row': ['row', 'row-bar', -31, 11, L.t("Sztanga pod barkami"), L.t("Sztanga przy brzuchu")],
    'shoulder-press': ['overpress', 'over-lever', 50, 10, L.t("Uchwyty przy barkach"), L.t("Uchwyty nad głową")],
    'dumbbell-shoulder-press': ['overpress', 'over-db', 62, 8, L.t("Hantle przy barkach"), L.t("Hantle nad głową")],
    'overhead-press': ['overpress', 'over-bar', 35, 7, L.t("Sztanga przy obojczykach"), L.t("Sztanga nad barkami")],
    'lateral-raise': ['abduct', 'raise-db', 72, 8, L.t("Hantle przy udach"), L.t("Ramiona na wysokości barków")],
    'cable-lateral-raise': [
      'abduct',
      'raise-cable',
      89,
      8,
      L.t("Uchwyt przy biodrze"),
      L.t("Ramię uniesione bokiem")
    ],
    'machine-lateral-raise': [
      'abduct',
      'raise-lever',
      53,
      15,
      L.t("Łokcie przy tułowiu"),
      L.t("Ramiona uniesione bokiem")
    ],
    'rear-delt-fly': ['reverse', 'rear-lever', -56, 31, L.t("Uchwyty przed tułowiem"), L.t("Ramiona rozłożone")],
    'reverse-cable-fly': [
      'reverse',
      'rear-cable',
      -68,
      26,
      L.t("Dłonie przed klatką"),
      L.t("Ramiona otwarte na boki")
    ],
    'dumbbell-curl': ['curl', 'curl-db', 38, 8, L.t("Hantle przy udach"), L.t("Przedramiona zgięte")],
    'cable-curl': ['curl', 'curl-cable', 28, 10, L.t("Uchwyt nisko"), L.t("Uchwyt przy górze tułowia")],
    'preacher-curl': ['curl', 'preacher', 24, 12, L.t("Ramiona na podpórce"), L.t("Uchwyt przy barkach")],
    'barbell-curl': ['curl', 'curl-bar', 34, 9, L.t("Sztanga przy udach"), L.t("Sztanga przed klatką")],
    'triceps-pushdown': ['extend', 'triceps-cable', 23, 8, L.t("Łokcie zgięte"), L.t("Dłonie przy biodrach")],
    'overhead-extension': ['extend', 'triceps-db', 32, 8, L.t("Hantel za głową"), L.t("Hantel nad głową")],
    'triceps-machine': ['extend', 'triceps-lever', 26, 12, L.t("Łokcie na podpórce"), L.t("Uchwyty wysunięte")],
    'leg-press': ['legpress', 'sled', 19, 10, L.t("Kolana zgięte"), L.t("Platforma wypchnięta")],
    'hack-squat': ['squat', 'hack', 22, 10, L.t("Pozycja stojąca na platformie"), L.t("Kolana i biodra ugięte")],
    squat: ['squat', 'squat-bar', 28, 9, L.t("Pozycja stojąca"), L.t("Dolna pozycja przysiadu")],
    'goblet-squat': ['squat', 'goblet', 37, 9, L.t("Hantel przy klatce"), L.t("Dolna pozycja przysiadu")],
    'leg-extension': ['knee', 'quad-lever', 24, 10, L.t("Kolana zgięte"), L.t("Podudzia uniesione")],
    'cable-leg-extension': ['knee', 'quad-cable', 24, 10, L.t("Mankiet nad kostką"), L.t("Jedna noga wyprostowana")],
    'leg-curl': ['knee', 'ham-lever', -24, 10, L.t("Podudzia wysunięte"), L.t("Pięty pod siedziskiem")],
    'lying-leg-curl': ['knee', 'ham-lying', 17, 11, L.t("Nogi wyprostowane"), L.t("Pięty uniesione")],
    'cable-leg-curl': ['knee', 'ham-cable', -26, 10, L.t("Pozycja stojąca"), L.t("Pięta za udem")],
    'romanian-deadlift': ['hinge', 'hinge-bar', -27, 9, L.t("Sztanga przy udach"), L.t("Biodra cofnięte")],
    'dumbbell-rdl': ['hinge', 'hinge-db', -31, 10, L.t("Hantle przy udach"), L.t("Hantle blisko podudzi")],
    'hip-thrust': ['bridge', 'hip-bar', 29, 11, L.t("Biodra opuszczone"), L.t("Biodra wyprostowane")],
    'glute-drive': ['bridge', 'hip-lever', 25, 12, L.t("Pas na biodrach"), L.t("Pas uniesiony")],
    'glute-bridge': ['bridge', 'floor', 18, 12, L.t("Biodra na macie"), L.t("Biodra uniesione")],
    'calf-raise': ['calf', 'calf-lever', 20, 9, L.t("Pięty opuszczone"), L.t("Wspięcie na palce")],
    'seated-calf': ['calf', 'calf-seated', 23, 12, L.t("Pięty opuszczone"), L.t("Kolana unoszą pad")],
    'dumbbell-calf': ['calf', 'calf-db', 43, 9, L.t("Stopy na podłożu"), L.t("Pięty uniesione")],
    'cable-crunch': ['crunch', 'ab-cable', 21, 10, L.t("Klęk przy wyciągu"), L.t("Żebra zbliżone do miednicy")],
    'machine-crunch': ['crunch', 'ab-lever', 25, 11, L.t("Plecy przy oparciu"), L.t("Tułów zgięty")],
    crunch: ['crunch', 'ab-mat', 14, 12, L.t("Łopatki na macie"), L.t("Łopatki uniesione")]
  };
  const library = root.ExerciseLibrary || require('./library.js');
  const anatomy = root.ExerciseAnatomy || require('./anatomy.js');
  const atlas = root.ExerciseAtlas || require('./atlas.js');
  const movement = root.ExerciseMovement || require('./movement.js');
  for (const ex of library.additions) {
    const front = movement.frontView(ex);
    exercises[ex.id] = ['library', ex.gear, front ? 90 : 0, 0, L.t('Pozycja wyjściowa'), L.t('Pozycja końcowa'), ex];
  }
  exercises['atlas-face-pull'] = ['face','face-rope',-34,13,L.t('Pozycja wyjściowa'),L.t('Pozycja końcowa')];
  exercises['atlas-reverse-curl'] = ['curl','reverse-bar',66,9,L.t('Sztanga przy udach'),L.t('Sztanga przed klatką')];
  const ids = Object.freeze(Object.keys(exercises));
  const hasKey = (obj, k) => Object.prototype.hasOwnProperty.call(obj, k);
  const radians = (d) => (d * Math.PI) / 180,
    sin = (d) => Math.sin(radians(d)),
    cos = (d) => Math.cos(radians(d));
  const add = (a, b) => a.map((v, i) => v + b[i]),
    sub = (a, b) => a.map((v, i) => v - b[i]),
    mul = (a, k) => a.map((v) => v * k);
  const dot = (a, b) => a.reduce((n, v, i) => n + v * b[i], 0),
    length = (a) => Math.hypot(...a),
    unit = (a) => mul(a, 1 / (length(a) || 1));
  const mix = (a, b, t) => a + (b - a) * t;
  const vector = (angle, plane, side = 1) => [
    sin(angle) * cos(plane),
    -cos(angle),
    side * sin(angle) * sin(plane)
  ];
  const point = (base, angle, dist, plane = 0, side = 1) =>
    add(base, mul(vector(angle, plane, side), dist));
  function joint(start, end, first, second, hint) {
    const delta = sub(end, start),
      distance = length(delta),
      axis = unit(delta);
    const d = Math.min(first + second - 0.01, Math.max(0.1, distance));
    const along = (first * first - second * second + d * d) / (2 * d);
    const ortho = unit(sub(hint, mul(axis, dot(hint, axis))));
    return add(
      add(start, mul(axis, along)),
      mul(ortho, Math.sqrt(Math.max(0, first * first - along * along)))
    );
  }
  function artist(config, t) {
    const [mode, gear] = config;
    const supine = mode === 'bench' || gear === 'fly-db';
    const lyingProne = gear === 'ham-lying',
      kneeling = gear === 'ab-cable';
    const supportedBridge = mode === 'bridge' && gear !== 'floor';
    const seated = [
      'chest-lever',
      'fly-lever',
      'lat-cable',
      'lat-lever',
      'row-cable',
      'row-lever',
      'over-lever',
      'over-db',
      'raise-lever',
      'rear-lever',
      'preacher',
      'triceps-lever',
      'quad-lever',
      'quad-cable',
      'ham-lever',
      'calf-seated',
      'ab-lever'
    ].includes(gear);
    let hip = [0, seated ? 48 : 91, 0],
      lean = seated ? -7 : 0;
    let spineLength = 45,
      footRise = 0,
      headAngle,
      neckFlex = 0;
    if (supine) {
      hip = [0, 51, 0];
      lean = -90;
    }
    if (gear === 'fly-cable') lean = 11;
    if (gear === 'rear-cable') lean = 8;
    if (mode === 'pulldown') lean = gear === 'lat-cable' ? -13 : -8;
    if (gear === 'row-cable') {
      hip = [0, 34, 0];
      lean = mix(6, -3, t);
    }
    if (gear === 'row-lever' || gear === 'rear-lever') lean = 12;
    if (gear === 'row-db') {
      hip = [-5, 83, 0];
      lean = 75;
    }
    if (gear === 'row-bar') {
      hip = [-13, 81, 0];
      lean = 55;
    }
    if (gear === 'triceps-cable') lean = 9;
    if (gear === 'triceps-lever' || gear === 'preacher') lean = 7;
    if (gear === 'triceps-db') {
      hip = [0, 48, 0];
      lean = -5;
    }
    if (mode === 'pullup') {
      hip = [0, 90 + 38 * t, 0];
      lean = -3 - 8 * t;
    }
    if (mode === 'pushup') {
      hip = [-2 + 2 * t, 15 + 23 * t, 0];
      lean = mix(82, 64, t);
    }
    if (mode === 'legpress') {
      hip = [-26, 36, 0];
      lean = -50;
    }
    if (mode === 'squat') {
      if (gear === 'hack') {
        hip = [-21 + 21 * t, 94 - 42 * t, 0];
        lean = -23;
      } else {
        hip = [-16 * t, 91 - 42 * t, 0];
        lean = mix(0, gear === 'goblet' ? 22 : 30, t);
      }
    }
    if (mode === 'hinge') {
      hip = [-25 * t, 91 - 16 * t, 0];
      lean = 67 * t;
    }
    if (lyingProne) {
      hip = [0, 49, 0];
      lean = 94;
    }
    if (mode === 'bridge') {
      lean = supportedBridge ? mix(-52, -90, t) : mix(-90, -122, t);
      const shoulder = [-34, supportedBridge ? 49 : 10, 0];
      hip = sub(shoulder, [sin(lean) * 45, cos(lean) * 45, 0]);
      headAngle = supportedBridge ? mix(-57, -72, t) : -92;
    }
    if (mode === 'calf') {
      footRise = 9 * t;
      hip[1] =
        (gear === 'calf-seated' ? 53 : gear === 'calf-lever' ? 95 : 91) +
        (gear === 'calf-seated' ? 0 : footRise);
    }
    if (mode === 'crunch') {
      if (kneeling) {
        hip = [0, 45, 0];
        lean = mix(8, 58, t);
        neckFlex = 10 + 15 * t;
      } else if (gear === 'ab-lever') {
        lean = mix(-8, 32, t);
        neckFlex = 8 + 13 * t;
      } else {
        hip = [0, 12, 0];
        lean = mix(-90, -62, t);
        neckFlex = mix(0, 23, t);
      }
    }
    if (gear === 'ham-cable') lean = 7;
    const spine = [sin(lean), cos(lean), 0],
      forward = [cos(lean), -sin(lean), 0];
    const shoulder = add(hip, mul(spine, spineLength)),
      neck = add(shoulder, mul(spine, 4));
    const hangle = headAngle ?? lean + neckFlex;
    const head = add(neck, [sin(hangle) * 11, cos(hangle) * 11, 0]);
    const limbs = {};
    for (const side of [-1, 1]) {
      const S = add(shoulder, [0, 0, side * 15]),
        H = add(hip, [0, 0, side * 8]);
      let E, W, K, A, F;
      let ankle = [0, 7, side * 13];
      if (seated || gear === 'triceps-db') ankle = [38, 7, side * 15];
      if (supine) ankle = [33, 7, side * 24];
      if (gear === 'row-cable') ankle = [72, 12, side * 15];
      if (gear === 'fly-cable') ankle = [side * 17, 7, side * 14];
      if (gear === 'row-db' && side < 0) {
        K = [-1, 45, -14];
        ankle = [-39, 45, -16];
      }
      if (gear === 'row-db' && side > 0) ankle = [-10, 7, 20];
      if (mode === 'hinge') ankle = [0, 7, side * 12];
      if (mode === 'pullup') {
        K = add(H, [-5, -42, side * 2]);
        ankle = add(K, [-21, -35, 0]);
      }
      if (mode === 'pushup') {
        ankle = [-78, 9, side * 10];
        K = add(ankle, mul(sub(H, ankle), 0.49));
      }
      if (mode === 'legpress') ankle = [18 + 28 * t, 64 + 27 * t, side * 15];
      if (gear === 'hack') ankle = [17, 12, side * 15];
      if (mode === 'bridge') ankle = [48, 7, side * 13];
      if (mode === 'calf')
        ankle = [gear === 'calf-seated' ? 43 : 0, (gear === 'calf-db' ? 7 : 13) + footRise, side * 12];
      if (gear === 'ab-mat') ankle = [57, 7, side * 13];
      if (kneeling) {
        K = [-2, 7, side * 12];
        ankle = [-42, 5, side * 12];
      }
      if (lyingProne) {
        K = [-41, 48, side * 11];
        ankle = point(K, mix(-90, -178, t), 40);
      }
      if (['quad-lever', 'quad-cable', 'ham-lever'].includes(gear)) {
        K = [41, 47, side * 10];
        let angle = gear === 'ham-lever' ? mix(79, -19, t) : mix(-7, 78, t);
        if (gear === 'quad-cable' && side < 0) angle = -4;
        ankle = point(K, angle, 40);
      }
      if (gear === 'ham-cable' && side === 1) {
        K = add(H, [-1, -42, 2]);
        ankle = point(K, -85 * t, 41);
      }
      A = ankle;
      K = K || joint(H, A, 43, 42, [1, 0.45, side * 0.08]);
      F = add(A, [12, -6, side * 0.8]);
      if (mode === 'calf') F = [A[0] + 13, gear === 'calf-db' ? 1 : 7, A[2]];
      if (mode === 'legpress') F = add(A, [-7, 11, 0]);
      if (lyingProne || kneeling || mode === 'pullup') F = add(A, [7, -5, side]);
      if (gear === 'quad-lever' || gear === 'ham-lever' || gear === 'quad-cable') {
        const shin = unit(sub(A, K));
        F = add(A, [-shin[1] * 12, shin[0] * 12 - 2, side]);
      }
      const dirs = (a, plane, b, lowerPlane) => {
        E = point(S, a, 29, plane, side);
        W = point(E, b, 27, lowerPlane, side);
      };
      const reach = (w, hint) => {
        W = w;
        E = joint(S, W, 29, 27, hint);
      };
      if (mode === 'press') {
        reach(add(S, [mix(8, 53, t), mix(-4, 0, t), side * mix(15, 6, t)]), [-1, -0.65, side * 0.85]);
      } else if (mode === 'bench') {
        reach(add(S, [mix(11, 1, t), mix(10, 54, t), side * (gear === 'db' ? mix(20, 3, t) : 17)]), [
          0.35,
          -0.85,
          side
        ]);
      } else if (mode === 'fly') {
        if (gear === 'fly-db') dirs(mix(87, 164, t), 85, mix(106, 180, t), 92);
        else dirs(83, mix(89, 6, t), 90, mix(55, -32, t));
      } else if (mode === 'reverse') dirs(84, mix(7, 101, t), 93, mix(-29, 76, t));
      else if (mode === 'pulldown') {
        const x = gear === 'lat-cable' ? 16 : 12;
        reach(add(S, [x, mix(50, -4, t), side * mix(18, 21, t)]), [-0.15, -1, side]);
      } else if (mode === 'pullup') {
        reach([6, 189, side * 32], [-0.15, -0.8, side]);
      } else if (mode === 'row') {
        const bent = gear === 'row-db' || gear === 'row-bar';
        if (gear === 'row-db' && side < 0) {
          reach([46, 44, -16], [0.3, -1, -0.5]);
        } else if (bent) {
          reach(add(S, [mix(0, gear === 'row-db' ? -24 : -21, t), mix(-55, -13, t), side * 3]), [
            -1,
            0.2,
            side * 0.15
          ]);
        } else {
          reach(add(S, [mix(53, 13, t), mix(-9, -18, t), side * mix(-4, 1, t)]), [-1, -0.6, side * 0.33]);
        }
      } else if (mode === 'overpress') {
        reach(
          add(S, [
            mix(gear === 'over-bar' ? 22 : 8, 2, t),
            mix(2, 54, t),
            side * mix(18, gear === 'over-db' ? 6 : 11, t)
          ]),
          [0.25, -1, side]
        );
      } else if (mode === 'face') {
        reach(add(S, [mix(52, 6, t), mix(5, 14, t), side * mix(-9, 3, t)]), [-0.45, 0, side]);
      } else if (mode === 'abduct') {
        const armT = gear === 'raise-cable' && side < 0 ? 0 : t;
        const a = mix(10, 84, armT);
        if (gear === 'raise-lever') {
          E = point(S, a, 29, 85, side);
          W = add(E, [25, mix(-6, 1, t), side * 3]);
        } else dirs(a, 79, a + 7, 67);
      } else if (mode === 'curl') {
        const preacher = gear === 'preacher';
        dirs(preacher ? 46 : 5, 0, preacher ? mix(50, 149, t) : mix(8, 143, t), 0);
      } else if (mode === 'extend') {
        if (gear === 'triceps-db') {
          E = point(S, 166, 29, 180);
          reach(add(E, [mix(-23, 3, t), mix(-12, 26, t), -side * 10]), [0, 1, side]);
        } else if (gear === 'triceps-lever') dirs(57, 0, mix(148, 43, t), 0);
        else dirs(5, 0, mix(96, 4, t), 0);
      } else if (mode === 'squat') {
        if (gear === 'squat-bar') reach(add(S, [-6, 0, side * 25]), [-1, -1, side * 0.5]);
        else if (gear === 'goblet') reach(add(S, [16, -1, -side * 7]), [0.6, -1, side * 0.15]);
        else reach(add(S, [12, 3, side * 5]), [0.6, -1, side * 0.1]);
      } else if (mode === 'hinge') dirs(1, 0, 2, 0);
      else if (mode === 'legpress') reach(add(H, [8, 0, side * 10]), [-1, -0.7, side * 0.15]);
      else if (mode === 'crunch') {
        if (kneeling) {
          reach(add(head, [6, -5, side * 7]), [1, -0.5, side * 0.3]);
        } else if (gear === 'ab-mat') {
          reach(
            add(S, mul(forward, 11)).map((v, i) => (i === 2 ? v - side * 21 : v)),
            [1, -1, side]
          );
        } else reach(add(S, [12, 9, side * 3]), [1, -1, side * 0.3]);
      } else if (mode === 'pushup') {
        reach([43, 3, side * 19], [-1, 0.1, side * 0.3]);
      } else if (mode === 'bridge') {
        if (supportedBridge) reach(add(H, [0, 4, side * 11]), [-0.3, -1, side * 0.3]);
        else {
          E = add(S, [26, -3, side * 5]);
          W = add(E, [24, -1, side * 2]);
        }
      } else if (mode === 'calf') {
        if (gear === 'calf-db') dirs(2, 0, 4, 0);
        else if (gear === 'calf-seated') reach(add(K, [0, 6, side * 2]), [-1, -0.8, side]);
        else reach(add(S, [15, 3, side * 2]), [0.1, -1, side]);
      } else if (lyingProne) {
        E = add(S, [8, -22, side * 2]);
        W = add(E, [24, 3, 0]);
      } else if (gear === 'ham-cable') {
        reach([41, 102, side * 12], [-0.4, -1, side * 0.2]);
      } else {
        reach(add(H, [-1, 2, side * 11]), [-0.7, -0.5, side * 0.2]);
      }
      limbs[side] = { S, H, E, W, K, A, F };
    }
    return {
      hip,
      lean,
      head,
      hangle,
      shoulder,
      spine,
      forward,
      limbs,
      seated,
      supine,
      supportedBridge,
      kneeling,
      lyingProne
    };
  }
  const n = (v) => Number(v.toFixed(2));
  const col = {
    metal: '#a7a9a8',
    edge: '#757875',
    pad: '#363733',
    padEdge: '#62635e',
    load: '#323330',
    cable: '#5e605d'
  };
  function painter(config) {
    const a = config[2],
      b = config[3],
      out = [],
      extent = [];
    function project(p) {
      const depth = p[0] * sin(a) + p[2] * cos(a);
      return [p[0] * cos(a) - p[2] * sin(a), -p[1] * cos(b) + depth * sin(b)];
    }
    const xy = (p) => {
      const v = project(p);
      extent.push(v);
      return v.map(n).join(',');
    };
    function line(p, q, w, color, extra = '') {
      out.push(
        `<path d="M${xy(p)}L${xy(q)}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" ${extra}/>`
      );
    }
    function path(pts, w, color) {
      out.push(
        `<polyline points="${pts.map(xy).join(' ')}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`
      );
    }
    function polygon(pts, color, stroke = 'none', width = 0.7) {
      out.push(
        `<polygon points="${pts.map(xy).join(' ')}" fill="${color}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round"/>`
      );
    }
    function pin(p, r, color, outline = 'none', width = 0.9) {
      const [x, y] = project(p);
      extent.push([x - r, y - r], [x + r, y + r]);
      out.push(
        `<circle cx="${n(x)}" cy="${n(y)}" r="${r}" fill="${color}" stroke="${outline}" stroke-width="${width}"/>`
      );
    }
    function tube(p, q, w = 4) {
      line(p, q, w + 1.2, '#717370');
      line(p, q, w, col.metal);
    }
    function box(p, q, w = 6) {
      line(p, q, w + 2, '#24303c');
      line(p, q, w, col.pad);
      line(add(p, [0, 1.4, 0]), add(q, [0, 1.4, 0]), 0.7, col.padEdge);
    }
    function plate(c, r = 7) {
      const [x, y] = project(c);
      extent.push([x - r, y - r], [x + r, y + r]);
      const rx = n(r * (0.34 + 0.59 * Math.abs(cos(a))));
      out.push(
        '<g transform="translate(' +
          n(x) +
          ' ' +
          n(y) +
          ')"><ellipse cx="1" rx="' +
          rx +
          '" ry="' +
          r +
          '" fill="#64645f"/><ellipse rx="' +
          rx +
          '" ry="' +
          r +
          '" fill="#333431" stroke="#565752" stroke-width=".7"/><ellipse rx="' +
          n(rx * 0.76) +
          '" ry="' +
          n(r * 0.78) +
          '" fill="none" stroke="#484945" stroke-width=".6"/><ellipse rx="1.2" ry="1.6" fill="#c2c2bb"/></g>'
      );
    }
    function bar(c, span, weight = true, radius = 8) {
      const l = add(c, [0, 0, -span]),
        r = add(c, [0, 0, span]);
      line(l, r, 2.9, '#737572');
      line(l, r, 1.3, '#c4c5bf');
      if (weight) {
        plate(add(c, [0, 0, -span + 3]), radius);
        plate(add(c, [0, 0, span - 3]), radius);
      }
    }
    function dumbbell(p, axis = [0, 0, 1], r = 4) {
      const u = unit(axis),
        a = sub(p, mul(u, 6)),
        b = add(p, mul(u, 6));
      line(a, b, 2.3, '#cad6d9');
      pin(a, r, '#526674', '#b7d1ca', 1);
      pin(b, r, '#526674', '#b7d1ca', 1);
    }
    function stack(x, z, h) {
      tube([x-7, 2, z], [x-7, h, z], 2.6);
      tube([x+7, 2, z], [x+7, h, z], 2.6);
      tube([x-7, h, z], [x+7, h, z], 3.8);
      line([x-2, 4, z],[x-2,h-1,z],.85,'#8a8a84');
      line([x+2, 4, z],[x+2,h-1,z],.85,'#8a8a84');
      tube([x - 8, 1, z - 7], [x + 13, 1, z + 4], 3);
      for (let i = 0; i < 8; i++) {
        line([x - 4, 5 + i * 3.3, z], [x + 4, 5 + i * 3.3, z], 2.8, '#383936');
      }
      pin([x, h, z], 3.3, '#263440', '#7f929d');
    }
    function platform(x1, x2, z, y = 0) {
      const v = [
        [x1, y, -z],
        [x2, y, -z],
        [x2, y, z],
        [x1, y, z]
      ];
      polygon(v, '#263442', '#40505f', 0.85);
    }
    function bench(x1, x2, y, z = 0) {
      for (const x of [x1 + 4, x2 - 4]) {
        tube([x, y - 2, z], [x, 1, z]);
        tube([x, 1, z - 10], [x, 1, z + 10], 3);
      }
      const top = [
        [x1, y, z - 13],
        [x2, y, z - 13],
        [x2, y, z + 13],
        [x1, y, z + 13]
      ];
      const bottom = top.map(([x, h, depth]) => [x, h - 3.8, depth]);
      for (let i = 0; i < 4; i++) {
        const next = (i + 1) % 4;
        polygon([top[i], top[next], bottom[next], bottom[i]], '#252826');
      }
      polygon(top, '#464a47', '#626562', 0.55);
    }
    function seat(back, forward, hip) {
      const start = add(hip, [-7, -4, -2]);
      bench(start[0], hip[0] + forward, hip[1] - 5, -2);
      if (back) box(start, add(start, [sin(back) * 35, cos(back) * 35, 0]), 7);
    }
    return {
      out,
      extent,
      project,
      xy,
      line,
      path,
      polygon,
      pin,
      tube,
      box,
      plate,
      bar,
      dumbbell,
      stack,
      platform,
      bench,
      seat
    };
  }
  function structures(p, config, body) {
    const [mode, g] = config,
      { hip, shoulder, limbs } = body;
    const { line, path, pin, tube, box, stack, platform, bench, seat } = p;
    const l = limbs[-1],
      r = limbs[1];
    if (body.supine) {
      bench(-66, 23, 44, 0);
      if (g === 'bar')
        for (const side of [-1, 1]) {
          tube([-59, 0, side * 31], [-59, 94, side * 31], 3);
          tube([-68, 0, side * 31], [-49, 0, side * 31], 4);
          tube([-59, 91, side * 31], [-53, 91, side * 31], 2.5);
        }
    }
    if (body.seated && g !== 'row-cable') {
      const back = [
        'chest-lever',
        'over-db',
        'over-lever',
        'quad-lever',
        'ham-lever',
        'quad-cable',
        'ab-lever',
        'raise-lever'
      ].includes(g)
        ? -9
        : 0;
      seat(back, 24, hip);
    }
    if (g === 'triceps-db') seat(-7, 24, hip);
    if (mode === 'pushup' || g === 'floor' || g === 'ab-mat')
      platform(mode === 'pushup' ? -88 : -63, mode === 'pushup' ? 61 : 76, 23, 1);
    if (g === 'chest-lever') {
      stack(-32, -14, 115);
      for (const s of [-1, 1]) {
        const pivot = [-20, 117, s * 25];
        tube([-32, 115, -14], pivot, 3);
        tube(pivot, add(limbs[s].W, [0, 0, s * 5]), 3);
        pin(pivot, 2.8, col.edge);
      }
    }
    if (g === 'fly-lever' || g === 'rear-lever') {
      const x = g === 'fly-lever' ? -21 : 37;
      stack(x, -7, 132);
      if (g === 'rear-lever') box([14, 62, 0], [18, 87, 0], 8);
      for (const s of [-1, 1]) {
        const w = limbs[s].W,
          h = [w[0], 127, w[2]],
          pivot = [x, 127, s * 13];
        tube(pivot, h, 3);
        tube(h, w, 2.4);
        pin(pivot, 3, col.edge);
      }
    }
    if (g === 'fly-cable' || g === 'rear-cable') {
      for (const s of [-1, 1]) {
        const x = g === 'fly-cable' ? -24 : 38,
          z = s * 72,
          h = 132;
        stack(x, z, 149);
        pin([x, h, z], 2.6, '#253240', col.edge);
        const arm = g === 'rear-cable' ? limbs[-s] : limbs[s];
        line([x, h, z], arm.W, 1.2, col.cable);
      }
    }
    if (g === 'lat-cable' || g === 'lat-lever') {
      stack(g === 'lat-cable' ? 49 : -28, -9, 165);
      box([16, 51, -10], [16, 51, 10], 7);
      if (g === 'lat-cable') {
        const top = [15, 166, 0];
        tube([49, 165, -9], top, 3);
        pin(top, 3, col.edge);
        line(top, [l.W[0], l.W[1] + 3, 0], 1.2, col.cable);
      } else
        for (const s of [-1, 1]) {
          const pivot = [-25, 144, s * 24];
          tube([-28, 165, -9], pivot, 3);
          tube(pivot, limbs[s].W, 3);
          pin(pivot, 3, col.edge);
        }
    }
    if (g === 'fixed-bar') {
      for (const s of [-1, 1]) {
        tube([-14, 0, s * 58], [-14, 193, s * 58], 4);
        tube([-14, 193, s * 58], [6, 189, s * 48], 3);
        tube([-26, 0, s * 58], [-2, 0, s * 58], 3);
      }
      tube([6, 189, -51], [6, 189, 51], 4);
    }
    if (g === 'row-cable') {
      bench(-24, 31, 29);
      stack(98, -7, 83);
      tube([-14,3,0],[98,3,-7],3.5);
      for (const side of [-1,1]) {
        const z=side*15;
        p.polygon([[74,6,z-6],[80,24,z-6],[80,24,z+6],[74,6,z+6]],'#4c504c', '#777a75');
      }
      line([98, 53, -7], [l.W[0], l.W[1], 0], 1.1, col.cable);
    }
    if (g === 'row-lever') {
      box([16, 59, 0], [18, 86, 0], 8);
      stack(72, -9, 80);
      for (const s of [-1, 1]) {
        const pivot = [59, 19, s * 15];
        tube([72, 4, -9], pivot, 3);
        tube(pivot, limbs[s].W, 3);
        pin(pivot, 3, col.edge);
      }
    }
    if (g === 'row-db') bench(-45, 58, 41, -16);
    if (g === 'over-lever') {
      stack(-22, -12, 132);
      for (const s of [-1, 1]) {
        const pivot = [-22, 117, s * 25];
        tube([-22, 130, -12], pivot, 3);
        tube(pivot, limbs[s].W, 3);
        pin(pivot, 3, col.edge);
      }
    }
    if (g === 'face-rope') {
      const anchor = [81, 148, 0], fork = add(mul(add(l.W,r.W), .5), [14,2,0]);
      stack(85, -5, 163);
      pin(anchor,2.6,col.load);
      line(anchor,fork,1,col.cable);
      for (const hand of [r.W,l.W]) { line(fork,hand,1.8,col.load); pin(hand,1.9,col.pad); }
    }
    if (g === 'raise-cable') {
      stack(-7, -51, 73);
      pin([-7, 8, -51], 3, col.edge);
      line([-7, 8, -51], r.W, 1.2, col.cable);
    }
    if (g === 'raise-lever') {
      stack(-34, 13, 109);
      tube([-34,3,13],[0,3,0],3);
      for (const s of [-1, 1]) {
        const pivot = [-5, 91, s * 20];
        tube([-34, 90, 13], pivot, 3);
        tube(pivot, limbs[s].E, 2.4);
        box(limbs[s].E, add(limbs[s].E, [4, -2, s * 2]), 6);
      }
    }
    if (g === 'curl-cable' || g === 'triceps-cable') {
      const hi = g === 'triceps-cable';
      stack(57, -5, hi ? 154 : 86);
      const pulley = [54, hi ? 150 : 7, -5];
      pin(pulley, 3, col.edge);
      line(pulley, [r.W[0], r.W[1], 0], 1.3, col.cable);
    }
    if (g === 'preacher' || g === 'triceps-lever') {
      const mid = [(r.E[0] + r.S[0]) * 0.5, (r.E[1] + r.S[1]) * 0.5 - 3, 0];
      box([mid[0] - 9, mid[1] + 8, 0], [mid[0] + 10, mid[1] - 8, 0], 7);
      tube([mid[0], 0, 0], mid, 4);
      stack(55, -13, 64);
      const pivot = [r.E[0], r.E[1], -14];
      tube([55, 46, -13], pivot, 3);
      tube(pivot, l.W, 2.8);
      pin(pivot, 3, col.edge);
    }
    if (g === 'sled') {
      box([-61, 59, 0], [-28, 34, 0], 8);
      tube([-46, 0, 0], [-39, 39, 0], 4);
      for (const s of [-1, 1]) {
        tube([8, 44, s * 23], [86, 118, s * 23], 3);
        tube([8, 0, s * 23], [8, 44, s * 23], 3);
        tube([85, 0, s * 23], [85, 116, s * 23], 3);
      }
      const sole = [r.A[0] + 1, r.A[1] + 4, 0];
      p.polygon(
        [add(sole, [7, -7, -25]), add(sole, [-8, 9, -25]), add(sole, [-8, 9, 25]), add(sole, [7, -7, 25])],
        '#465c6d',
        col.edge
      );
      p.plate(add(sole, [7, -5, -28]), 8);
    }
    if (g === 'hack') {
      platform(-11, 38, 25, 5);
      for (const s of [-1, 1]) {
        tube([-42, 138, s * 21], [33, 0, s * 21], 3);
        tube([-44, 0, s * 21], [-42, 137, s * 21], 3);
      }
      box(add(hip, [-8, -2, -2]), add(shoulder, [-8, 1, -2]), 8);
      for (const s of [-1, 1]) box(add(shoulder, [-8, 4, s * 13]), add(shoulder, [6, 4, s * 13]), 5);
      p.plate(add(shoulder, [-13, -9, -22]), 8);
    }
    if (['quad-lever', 'ham-lever', 'quad-cable'].includes(g)) {
      if (g === 'quad-cable') {
        stack(-37, -8, 56);
        line([-34, 6, -8], add(r.A, [0, 4, 0]), 1.3, col.cable);
      } else {
        const k = [r.K[0], r.K[1], -16],
          a = add(l.A, [-1, 5, -4]);
        tube([26, 14, -12], k, 3);
        tube(k, a, 4);
        pin(k, 3.3, col.edge);
        box(add(a, [0, 0, -2]), add(a, [0, 0, 35]), 7);
        if (g === 'ham-lever') box([24, 51, -15], [24, 51, 15], 6);
      }
    }
    if (g === 'ham-lying') {
      bench(-55, 48, 40);
      const k = add(l.K, [3, -5, -5]);
      tube(k, add(l.A, [0, 3, -4]), 3);
      pin(k, 3, col.edge);
      box(add(l.A, [2, 5, -2]), add(r.A, [2, 5, 2]), 6);
    }
    if (g === 'ham-cable') {
      stack(51, -7, 116);
      tube([51, 103, -7], [41, 102, 14], 3);
      line([50, 7, -7], add(r.A, [0, 4, 0]), 1.2, col.cable);
    }
    if (g === 'hip-bar' || g === 'hip-lever') {
      bench(-60, -29, 41);
      if (g === 'hip-lever') {
        platform(32, 69, 17, 1);
        tube([-38, 2, -18], [2, 28, -18], 3);
        tube([2, 28, -18], add(hip, [0, 4, -14]), 4);
        pin([2, 28, -18], 3, col.edge);
      }
    }
    if (g === 'calf-lever') {
      platform(7, 25, 20, 7);
      stack(-30, -8, 147);
      for (const s of [-1, 1]) {
        const pad = add(shoulder, [1, 6, s * 12]);
        tube([-30, 137, -8], pad, 3);
        box(add(pad, [-7, 0, 0]), add(pad, [7, 0, 0]), 6);
      }
    }
    if (g === 'calf-seated') {
      platform(48, 67, 20, 7);
      box(add(l.K, [0, 4, -3]), add(r.K, [0, 4, 3]), 7);
      tube([7, 12, -12], add(l.K, [0, 4, -3]), 3);
      pin([7, 12, -12], 3, col.edge);
      p.plate(add(l.K, [2, 4, -7]), 6);
    }
    if (g === 'ab-cable') {
      platform(-54, 16, 18, 1);
      stack(54, -7, 155);
      const ropeEnd = add(body.head, [4, 10, 0]);
      path([[54, 150, -7], ropeEnd, r.W], 1.1, col.cable);
      line(ropeEnd, l.W, 1.1, col.cable);
    }
    if (g === 'ab-lever') {
      stack(-20, -15, 98);
      const pivot = [-3, 57, -17];
      tube([-20, 50, -15], pivot, 3);
      tube(pivot, l.W, 3);
      pin(pivot, 3, col.edge);
      box(l.W, r.W, 6);
    }
  }
  function human(p, b, config, female) {
    const near = b.limbs[1],
      far = b.limbs[-1],
      s = p.project(b.shoulder),
      h = p.project(b.hip);
    const limb = (o) =>
      Object.fromEntries(Object.entries(o).map(([key, value]) => [key.toLowerCase(), p.project(value)]));
    const head = p.project(b.head);
    for (const o of [near, far]) for (const pt of Object.values(o)) p.extent.push(p.project(pt));
    p.extent.push([head[0] - 12, head[1] - 13], [head[0] + 12, head[1] + 13]);
    const yaw = config[2],
      pitch = config[3];
    const facing = b.forward[0] * sin(yaw) * cos(pitch) + b.forward[1] * sin(pitch);
    const axis = sub(h, s),
      across = sub(p.project(far.S), p.project(near.S));
    const det = across[0] * axis[1] - across[1] * axis[0];
    const shear = Math.max(-0.62, Math.min(0.62, dot(axis, across) / (Math.abs(det) < 1 ? 1 : det)));
    const gaze = p.project(add(b.head, [cos(b.hangle), -sin(b.hangle), 0])),
      neck = sub(s, head);
    const flipHead = (gaze[0] - head[0]) * neck[1] - (gaze[1] - head[1]) * neck[0] < 0;
    p.out.push(
      anatomy.figure({
        s,
        h,
        head,
        near: limb(near),
        far: limb(far),
        scale: 45,
        facing,
        shear,
        flipHead,
        female
      })
    );
  }
  function handheld(p, conf, b) {
    const [mode, g] = conf,
      { hip, limbs } = b;
    const l = limbs[-1],
      r = limbs[1],
      mid = mul(add(l.W, r.W), 0.5);
    const bars = ['bar', 'row-bar', 'over-bar', 'curl-bar', 'reverse-bar', 'hinge-bar'];
    const dbs = ['db', 'fly-db', 'over-db', 'raise-db', 'curl-db', 'hinge-db', 'calf-db'];
    if (bars.includes(g)) p.bar(mid, mode === 'bench' ? 72 : Math.abs(r.W[2]) + 18, true, mode === 'curl' ? 9 : 15);
    if (g === 'squat-bar') p.bar(add(b.shoulder, [-5, 2, 0]), 44, true, 9);
    if (g === 'hip-bar') p.bar(add(hip, [0, 7, 0]), 38, true, 10);
    if (g === 'hip-lever') p.box(add(hip, [0, 6, -12]), add(hip, [0, 6, 12]), 5);
    if (dbs.includes(g))
      for (const o of [l, r])
        p.dumbbell(o.W, g === 'fly-db' || g === 'hinge-db' ? [1, 0, 0.3] : [0.15, 0, 1]);
    if (g === 'row-db') p.dumbbell(r.W, [1, 0, 0.2], 4.7);
    if (g === 'goblet') p.dumbbell(mid, [0, 1, 0], 5.6);
    if (g === 'triceps-db') p.dumbbell(mid, [0, 1, 0], 4.8);
    if (g === 'lat-cable') {
      p.path(
        [
          add(l.W, [0, -1, -6]),
          add(l.W, [0, 1, 3]),
          add(mid, [0, 4, 0]),
          add(r.W, [0, 1, -3]),
          add(r.W, [0, -1, 6])
        ],
        2.6,
        '#d6e5de'
      );
    }
    if (g === 'row-cable') {
      const tip=add(mid,[4,2,0]);
      p.path([l.W,tip,r.W],2.2,'#646660');
    }
    if (g === 'raise-lever') {
      for (const [side,arm] of [[-1,l],[1,r]]) {
        const pad=add(arm.E,[0,0,side*3]);
        p.box(pad,add(pad,[7,0,0]),4.8);
        p.path([pad,add(arm.W,[0,-3,side*3]),arm.W],1.8,'#676b67');
      }
    }
    if (['curl-cable', 'triceps-cable', 'preacher', 'triceps-lever'].includes(g))
      p.bar(mid, Math.abs(r.W[2]) + 2, false);
    if (
      [
        'chest-lever',
        'fly-lever',
        'fly-cable',
        'rear-lever',
        'rear-cable',
        'row-lever',
        'lat-lever',
        'over-lever'
      ].includes(g)
    )
      for (const o of [l, r]) p.line(add(o.W, [0, -2.8, 0]), add(o.W, [0, 2.8, 0]), 2.3, col.load);
    if (g === 'raise-cable') p.line(add(r.W, [-2, 0, 0]), add(r.W, [2, 0, 0]), 2.4, col.load);
    if (g === 'quad-cable' || g === 'ham-cable')
      p.line(add(r.A, [0, 2, -2]), add(r.A, [0, 4, 2]), 3.4, col.load);
  }
  function frame(config, progress, returning = false, female = false) {
    if (config[0] === 'library') return movement.frame(config[6], progress, returning, female);
    const p = painter(config),
      b = artist(config, progress);
    p.angle = config[2];
    structures(p, config, b);
    const foot = b.limbs[1].F;
    p.line(
      [Math.min(-25, b.hip[0] - 15, foot[0] - 17), 0, 0],
      [Math.max(30, b.hip[0] + 16, foot[0] + 15), 0, 0],
      0.7,
      '#cdcec9'
    );
    human(p, b, config, female);
    handheld(p, config, b);
    return { drawing: p.out.join(''), extent: p.extent };
  }
  const boxes = new Map();
  function viewBox(id) {
    if (exercises[id][0] === 'library') return '3 -9 176 155';
    if (boxes.has(id)) return boxes.get(id);
    const pts = [];
    for (const phase of [0, 0.25, 0.5, 0.75, 1]) pts.push(...frame(exercises[id], phase).extent);
    const left = Math.min(...pts.map((p) => p[0])) - 8,
      right = Math.max(...pts.map((p) => p[0])) + 8;
    const top = Math.min(...pts.map((p) => p[1])) - 8,
      bottom = Math.max(...pts.map((p) => p[1])) + 6;
    const result = [left, top, right - left, bottom - top].map(n).join(' ');
    boxes.set(id, result);
    return result;
  }
  function resolve(state, id) {
    const e = typeof id === 'object' ? id : state?.exercises?.find((e) => e.id === id);
    const key = e?.id ?? id;
    if (typeof key === 'string' && hasKey(exercises, key)) return key;
    return typeof e?.techniqueId === 'string' && hasKey(exercises, e.techniqueId) ? e.techniqueId : null;
  }
  const escape = (value) =>
    String(value ?? '').replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
    );
  const playIcon =
    '<svg aria-hidden="true" viewBox="0 0 20 20"><path d="M6 3.6a.6.6 0 0 1 .9-.5l9.6 6.4a.6.6 0 0 1 0 1L6.9 16.9a.6.6 0 0 1-.9-.5z" fill="currentColor"/></svg>';
  const pauseIcon =
    '<svg aria-hidden="true" viewBox="0 0 20 20"><path d="M5 3h3.8v14H5zm6.2 0H15v14h-3.8z" fill="currentColor"/></svg>';
  const roleNames = {
    primary: L.t('Główne'),
    secondary: L.t('Wspomagające'),
    stabilizer: L.t('Stabilizujące')
  };
  function profile(state, id, key) {
    const exercise = typeof id === 'object' ? id : state.exercises.find((item) => item.id === id);
    return atlas.describe(state, exercise?.muscles?.primary?.length ? exercise : key).muscles;
  }
  function colors(muscles) {
    return muscles.map((m) => '--dm-' + m.id + ':var(--dm-' + m.role + ')').join(';');
  }
  function legend(muscles) {
    const groups = atlas.groupMuscles(muscles);
    return (
      '<dl class="dm-legend">' +
      Object.entries(roleNames)
        .map(([role, label]) => {
          const names = groups.flatMap((group) => {
            if (group.members[0].role === role) return [group.name];
            return group.members.filter((m) => m.role === role).map((m) => m.label);
          });
          return names.length
            ? '<div><dt><i class="dm-key-' +
                role +
                '"></i>' +
                label +
                '</dt><dd>' +
                names.map(escape).join(', ') +
                '</dd></div>'
            : '';
        })
        .join('') +
      '</dl>'
    );
  }
  function render(state, id) {
    const key = resolve(state, id);
    if (!key)
      return ("<section class=\"panel dm-card dm-empty\"><h2>" + L.t("Demonstracja ruchu") + "</h2><p>" + L.t("Wybierz wzorzec techniki dla tego własnego ćwiczenia, aby zobaczyć jego animację.") + "</p></section>");
    const muscles=profile(state,id,key), female=state.sex==='female';
    const cfg = exercises[key],
      angle = cfg[2];
    const camera =
      Math.abs(angle) < 31
        ? L.t("Z boku")
        : angle < 0
          ? L.t("Od tyłu, ukośnie")
          : angle > 75
            ? L.t("Z przodu")
            : L.t("Ukośnie");
    const title = state?.exercises?.find((e) => e.id === key);
    const name = root.ExerciseAtlas?.name?.(state, title || key) || title?.name || key;
    return `<section class="panel dm-card" data-demo-card="${key}" data-demo-sex="${female ? 'female' : 'male'}"><header class="dm-heading"><h2>${L.t("Demonstracja ruchu")}</h2><span>${camera}</span></header><div class="dm-stage"><svg class="dm-scene" role="img" aria-label="${escape(name)} ${L.t("— demonstracja ruchu")}" viewBox="${viewBox(key)}" style="${colors(muscles)}"><g data-demo-frame>${frame(cfg, 0, false, female).drawing}</g></svg></div><div class="dm-tools"><button class="dm-play" type="button" data-demo-action="play" aria-pressed="false" aria-label="${L.t("Odtwórz animację")}">${playIcon}<span>${L.t("Odtwórz")}</span></button><input data-demo-seek type="range" min="0" max="100" value="0" step="1" aria-label="${L.t("Przebieg powtórzenia")}" aria-valuetext="${escape(cfg[4])}"><button class="dm-speed" type="button" data-demo-action="speed" aria-label="${L.t("Zmień tempo animacji, obecnie 1×")}">1×</button></div><div class="dm-phases"><button type="button" data-demo-action="start" aria-pressed="true"><i aria-hidden="true"></i>${escape(cfg[4])}</button><button type="button" data-demo-action="end" aria-pressed="false"><i aria-hidden="true"></i>${escape(cfg[5])}</button></div>${legend(muscles)}</section>`;
  }
  const players = new WeakMap();
  let activeCard = null;
  function model(card) {
    if (!players.has(card))
      players.set(card, { fraction: 0, speed: 1, running: false, last: 0, request: 0, nextPaint: 0 });
    return players.get(card);
  }
  function setRunning(card, running) {
    const data = model(card),
      btn = card.querySelector('[data-demo-action="play"]');
    data.running = running;
    btn.innerHTML = running ? `${pauseIcon}<span>${L.t("Pauza")}</span>` : `${playIcon}<span>${L.t("Odtwórz")}</span>`;
    btn.setAttribute('aria-label', running ? L.t("Wstrzymaj animację") : L.t("Odtwórz animację"));
    btn.setAttribute('aria-pressed', String(running));
    if (!running) {
      root.cancelAnimationFrame?.(data.request);
      if (activeCard === card) activeCard = null;
    }
  }
  function draw(card, data) {
    const cfg = exercises[card.dataset.demoCard];
    const phase = (1 - Math.cos(2 * Math.PI * data.fraction)) / 2;
    card.querySelector('[data-demo-frame]').innerHTML = frame(cfg, phase, data.fraction > 0.5, card.dataset.demoSex === 'female').drawing;
    const seek = card.querySelector('[data-demo-seek]');
    seek.value = String(Math.round(data.fraction * 100));
    const label =
      phase < 0.01 ? cfg[4] : phase > 0.99 ? cfg[5] : Math.round(data.fraction * 100) + L.t("% powtórzenia");
    seek.setAttribute('aria-valuetext', label);
    card.querySelector('[data-demo-action="start"]').setAttribute('aria-pressed', String(phase < 0.01));
    card.querySelector('[data-demo-action="end"]').setAttribute('aria-pressed', String(phase > 0.99));
  }
  function start(card) {
    if (activeCard && activeCard !== card) setRunning(activeCard, false);
    activeCard = card;
    const data = model(card);
    setRunning(card, true);
    data.last = 0;
    data.nextPaint = 0;
    const tick = (now) => {
      if (!data.running) return;
      if (!card.isConnected || root.document.hidden) {
        setRunning(card, false);
        return;
      }
      if (data.last) data.fraction = (data.fraction + ((now - data.last) * data.speed) / 4200) % 1;
      data.last = now;
      if (now >= data.nextPaint) {
        draw(card, data);
        data.nextPaint = now + 32;
      }
      data.request = root.requestAnimationFrame(tick);
    };
    data.request = root.requestAnimationFrame(tick);
  }
  if (root.document) {
    root.document.addEventListener('click', (e) => {
      const button = e.target.closest?.('[data-demo-action]'),
        card = button?.closest('[data-demo-card]');
      if (!card) return;
      const data = model(card),
        action = button.dataset.demoAction;
      if (action === 'play') {
        if (data.running) setRunning(card, false);
        else start(card);
      } else if (action === 'speed') {
        data.speed = data.speed === 1 ? 0.5 : 1;
        button.textContent = data.speed === 1 ? '1×' : L.t('0,5×');
        button.setAttribute('aria-label', (L.t("Zmień tempo animacji, obecnie") + " ") + button.textContent);
      } else if (action === 'start' || action === 'end') {
        setRunning(card, false);
        data.fraction = action === 'start' ? 0 : 0.5;
        draw(card, data);
      }
    });
    root.document.addEventListener('input', (e) => {
      if (!e.target.matches?.('[data-demo-seek]')) return;
      const card = e.target.closest('[data-demo-card]');
      if (!card) return;
      const data = model(card);
      setRunning(card, false);
      data.fraction = Number(e.target.value) / 100;
      draw(card, data);
    });
    root.document.addEventListener('visibilitychange', () => {
      if (root.document.hidden && activeCard) setRunning(activeCard, false);
    });
  }
  const api = {
    ids,
    has: (state, id) => !!resolve(state, id),
    render,
    thumbnail(state, id) {
      const key = resolve(state, id);
      if (!key) return '';
      return `<svg aria-hidden="true" focusable="false" viewBox="${viewBox(key)}" style="${colors(profile(state,id,key))}">${frame(exercises[key], 0.45, false, state.sex==='female').drawing}</svg>`;
    },
    frameAt(id, phase) {
      if (!hasKey(exercises, id) || !Number.isFinite(phase)) return null;
      return frame(exercises[id], Math.max(0, Math.min(1, phase))).drawing;
    }
  };
  root.ExerciseDemos = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);
