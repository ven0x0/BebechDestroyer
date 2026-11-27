(function anatomyModule(root) {
  'use strict';
  // Positions fit the visible anatomy in each cropped texture, expressed as percentages.
  const front = {
    lat: 'M8 29Q11 34 15 36L21 49Q13 44 11 39ZM94 29Q94 42 83 49L88 35Z',
    glutes: 'M10 80Q16 76 25 78L21 90L7 91ZM86 80Q91 78 94 83L94 89L87 90Z',
    gluteMed: 'M15 73Q24 72 30 76L24 81L11 83ZM86 73Q91 75 92 79L87 81L80 76Z',
    chest: 'M13 14Q27 9 53 12Q60 20 59 31Q46 38 26 33Q16 30 13 25ZM61 12Q77 11 88 15L91 28Q80 37 62 31Z',
    trap: 'M12 11Q29 7 38 2L44 9L28 12ZM66 3L85 10L73 10Z',
    abs: 'M37 36Q47 33 59 33L60 43L42 46ZM62 35L78 34L75 45L61 44ZM42 47L59 45L60 54L44 56ZM62 46L75 46L72 55L61 55ZM44 57L59 56L60 66L49 66ZM62 56L72 56L70 65L61 66ZM49 68L70 67L63 77L54 77Z',
    obliques: 'M13 38Q20 44 33 49L42 64L48 77L25 72Q19 61 21 53ZM81 42L89 38L84 69L73 76L77 58Z',
    serratus:
      'M12 33L32 40L18 37ZM13 38L35 45L20 42ZM17 43L36 50L23 47ZM86 34L94 31L85 39ZM84 40L91 36L82 46Z',
    hipFlex: 'M21 66L30 71L46 78L36 76ZM83 65L83 71L71 77Z'
  };
  const back = {
    trap: 'M39 1Q45 2 48 2Q49 18 52 29Q44 23 39 21Q27 13 12 13Q30 8 39 1ZM53 2L62 1Q72 8 89 13Q75 14 62 22Q57 25 53 29Z',
    midBack:
      'M23 17Q31 17 39 23Q47 29 50 34L50 49Q44 39 32 34Q25 26 23 17ZM77 17Q68 17 63 23Q58 29 54 34L54 49Q60 39 70 34Q76 26 77 17Z',
    lat: 'M9 31Q20 35 29 32Q39 39 46 45Q48 51 49 56Q41 61 32 67Q30 58 23 50Q15 42 9 31ZM92 31Q81 35 72 32Q62 39 56 45Q54 51 53 56Q61 61 68 67Q71 58 78 50Q87 41 92 31Z',
    cuff: 'M13 18L29 16L37 23L23 31L13 29ZM85 18L70 16L63 23L77 31L87 28Z',
    erectors: 'M45 44L50 51L49 73L34 69ZM56 44L52 51L54 73L67 69Z',
    gluteMed: 'M18 75L36 74L46 80L29 83L13 89ZM82 75L65 74L55 80L72 83L88 89Z',
    glutes: 'M18 80Q32 73 48 81L49 94Q34 102 9 95L13 87ZM53 81Q69 73 81 80L91 95Q67 102 52 95Z'
  };
  const frontArm = {
    frontDelt: 'M38 2Q80 -3 93 10Q99 18 82 26L47 37L37 44Q38 29 30 20Z',
    sideDelt: 'M35 3Q12 5 5 16Q-2 33 22 44L38 49L34 35L47 17L62 3Z',
    biceps: 'M47 40L76 27Q97 34 84 59Q79 73 51 84L40 90Q45 68 42 58Z',
    brachialis: 'M26 43L44 50L39 74L36 86Q16 73 14 60Z',
    triceps: 'M13 40L23 46L17 60L24 71L24 81Q5 70 6 51Z'
  };
  const rearArm = {
    rearDelt: 'M36 1Q74 1 94 15L97 30L75 38L49 32L17 25Q4 14 19 6Z',
    sideDelt: 'M75 8Q91 10 98 19L97 33L84 43L77 35L83 25Z',
    triceps: 'M12 30Q25 26 52 34L49 47L61 35L83 40L93 55Q87 71 65 82L56 90L51 75L37 83Q16 70 12 55Z',
    brachialis: 'M84 44L96 41L92 60L82 74L75 76Z'
  };
  const foreFront = {
    brachioradialis: 'M4 11Q14 10 31 6L50 13L44 31L18 63L13 77L8 56Z',
    grip: 'M37 8L81 6L93 20Q78 41 52 66L36 93L29 91L40 61L60 31L48 26L27 47Z',
    wristExt: 'M78 14L95 10L97 26L81 45L62 69L68 45Z'
  };
  const foreBack = {
    wristExt: 'M26 9L76 6L88 16L76 34L51 54L33 85L27 91L34 58L45 36L29 45L16 56Z',
    brachioradialis: 'M76 8L94 10L98 27L83 48L62 72L57 84L59 59Z',
    grip: 'M12 10L24 14L15 44L12 62L8 77L3 54Z'
  };
  const thighFront = {
    quad: 'M7 2L33 1Q24 22 41 46L49 70L42 86Q19 66 9 42ZM39 1L69 2L70 23L60 58L51 74L42 51Q29 27 39 1ZM76 27L93 15Q99 43 84 69Q75 82 62 86L62 74Z',
    adductors: 'M79 1L96 2L91 22L71 40Z',
    hipFlex: 'M12 0L46 1L36 13L19 18Z'
  };
  const thighBack = {
    hams: 'M9 17Q23 18 47 14L45 42L29 71L25 87Q8 66 8 47ZM52 16L84 13L94 25L86 61L65 88L65 68L54 47Z',
    adductors: 'M84 14L96 6L99 42L91 57Z',
    glutes: 'M4 1L93 0L89 11L48 17L13 20Z'
  };
  const shin = {
    soleus: 'M15 28L31 43L34 58L26 71L19 67Z',
    gastrocnemius: 'M73 15L91 20L94 39L78 56L72 62L73 45Z'
  };
  const calf = {
    gastrocnemius: 'M16 5Q40 4 45 17L49 35L40 49L25 53Q4 48 5 31ZM54 11L75 7L89 14Q102 32 85 47L65 54L53 48Z',
    soleus: 'M7 42L21 50L36 55L46 73L46 85L32 75L17 61ZM86 45L94 38L90 55L68 73L54 84L59 67L67 55Z'
  };
  const parts = [
    ['torso', front],
    ['back', back],
    [
      'torso-f',
      { ...front, chest: 'M16 13L35 10L48 25L56 27L66 23L73 10L87 14L92 31Q85 39 62 37L46 36Q23 41 13 35Z' }
    ],
    ['back-f', back],
    ['head'],
    ['nape'],
    ['head-f'],
    ['nape-f'],
    ['arm', frontArm],
    ['arm-back', rearArm],
    ['fore', foreFront],
    ['fore-back', foreBack],
    ['thigh', thighFront],
    ['thigh-back', thighBack],
    ['shin', shin],
    ['calf', calf]
  ];
  function definitions() {
    return parts
      .map(([name, regions], index) => {
        const tile =
          '<svg id="dm-tile-' +
          name +
          '" width="100" height="100" viewBox="' +
          (index % 4) * 100 +
          ' ' +
          Math.floor(index / 4) * 100 +
          ' 100 100"><use href="#dm-texture"/></svg>';
        const layers = { muscle: [], cloth: [] };
        for (const [id, d] of Object.entries(regions || {})) {
          const layer = id === 'glutes' || id === 'gluteMed' ? layers.cloth : layers.muscle;
          layer.push('<path d="' + d + '" fill="var(--dm-' + id + ', transparent)"/>');
        }
        const mask = regions
          ? '<mask id="dm-mask-' +
            name +
            '" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100" style="mask-type:alpha"><use href="#dm-tile-' +
            name +
            '"/></mask>'
          : '';
        const clip =
          index < 4 ? ' clip-path="url(#dm-hips)"' : index >= 8 ? ' clip-path="url(#dm-limb-edge)"' : '';
        const overlay = (paths, style) =>
          paths.length
            ? '<g mask="url(#dm-mask-' +
              name +
              ')" style="' +
              style +
              '"><g filter="url(#dm-soft-edge)">' +
              paths.join('') +
              '</g></g>'
            : '';
        return (
          tile +
          mask +
          '<g id="dm-part-' +
          name +
          '"' +
          clip +
          '><use href="#dm-tile-' +
          name +
          '"/>' +
          overlay(layers.muscle, 'mix-blend-mode:multiply') +
          overlay(layers.cloth, 'opacity:.76') +
          '</g>'
        );
      })
      .join('');
  }
  const num = (n) => Number(n.toFixed(3));
  function place(piece, a, b, width, from, to, flip = false, shear = 0) {
    const dx = b[0] - a[0],
      dy = b[1] - a[1],
      len = Math.hypot(dx, dy);
    const sign = flip ? -1 : 1;
    const ux = len ? dx / len : 0,
      uy = len ? dy / len : 1;
    const x = sign * width * (uy + ux * shear),
      y = sign * width * (-ux + uy * shear);
    // A limb pointing at the camera still shows the round end of the joint.
    const span = Math.max(len * (to - from), width * 0.65),
      center = (from + to) / 2;
    const matrix = [
      x / 100,
      y / 100,
      (ux * span) / 100,
      (uy * span) / 100,
      a[0] + center * dx - (x + ux * span) / 2,
      a[1] + center * dy - (y + uy * span) / 2
    ];
    return '<use href="#dm-part-' + piece + '" transform="matrix(' + matrix.map(num).join(' ') + ')"/>';
  }
  function figure({ s, h, head, near, far, scale, facing, shear = 0, flipHead = false, female = false }) {
    const rear = facing < 0,
      suffix = female ? '-f' : '';
    const size = scale * (female ? 0.92 : 1);
    function leg(o, flip) {
      return (
        place(rear ? 'calf' : 'shin', o.k, o.a, size * 0.225, -0.08, 1.015, flip) +
        place(rear ? 'thigh-back' : 'thigh', o.h, o.k, size * 0.39, -0.07, 1.065, flip) +
        place('shorts', o.h, o.k, size * 0.405, -0.08, 0.28, flip) +
        place('foot', o.a, o.f, size * 0.15, -0.28, 1.06, flip)
      );
    }
    function arm(o, flip) {
      return (
        place(rear ? 'fore-back' : 'fore', o.e, o.w, size * 0.178, -0.085, 0.97, flip) +
        place(rear ? 'arm-back' : 'arm', o.s, o.e, size * 0.267, -0.19, 1.055, flip) +
        place('hand', o.e, o.w, size * 0.139, 0.9, 1.14, flip)
      );
    }
    const torsoWidth = scale * (0.57 + 0.26 * Math.min(1, Math.abs(facing)));
    return (
      leg(far, true) +
      arm(far, true) +
      leg(near, false) +
      place(rear ? 'back' + suffix : 'torso' + suffix, s, h, torsoWidth, -0.18, 1.32, false, shear) +
      place(
        (rear ? 'nape' : 'head') + suffix,
        head,
        s,
        size * (female ? 0.34 : 0.33),
        -0.64,
        0.96,
        flipHead
      ) +
      arm(near, false)
    );
  }
  const defs = root.document?.querySelector?.('#dm-art');
  if (defs) defs.insertAdjacentHTML('beforeend', definitions());
  const api = { figure, definitions };
  root.ExerciseAnatomy = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);
