(function movementDiagrams(root) {
  'use strict';
  const anatomy = root.ExerciseAnatomy || require('./anatomy.js');
  // Key poses are drawn in a common side or front elevation. Attached loads follow the working joint.
  const blend = (a, b, t) => a.map((n, i) => n + (b[i] - n) * t);
  const shift = (p, x, y) => [p[0] + x, p[1] + y];
  const lerp = (a, b, t) => a + (b - a) * t;
  const fmt = (n) => Number(n.toFixed(2));
  const point = (p) => p.map(fmt).join(',');
  const line = (a, b, color, w = 3) =>
    `<path d="M${point(a)} L${point(b)}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`;
  const dot = (p, r, color) =>
    `<ellipse cx="${fmt(p[0])}" cy="${fmt(p[1])}" rx="${r}" ry="${r}" fill="${color}"/>`;
  const pad = (a, b) => line(a, b, '#485a68', 6);
  const metal = '#81909a',
    load = '#393a36',
    joint = '#d5e1e6';
  const frontView = (ex) =>
    ['raise', 'rear', 'face', 'abduct', 'adduct', 'twist', 'pallof'].includes(ex.family) ||
    (ex.family === 'fly' && ex.gear !== 'db');
  function frame(ex, fraction, returning = false, female = false) {
    const f = ex.family,
      pos = ex.position,
      gear = ex.gear;
    const t = pos === 'pause' ? Math.min(1, fraction * 1.3) : fraction;
    const at = (a, b) => blend(a, b, t);
    const bench =
      ['bench', 'skull', 'larsen'].includes(f) ||
      (f === 'fly' && gear === 'db') ||
      (f === 'pullover' && pos === 'supine');
    const seated =
      pos.includes('seat') ||
      ['preacher', 'concentration', 'prone-curl'].includes(pos) ||
      ['quad', 'seatedcalf', 'wrist', 'wristext'].includes(f);
    const single = pos.includes('single') || ['concentration', 'lean', 'cross'].includes(pos);
    let h = [89, 78],
      s = [88, 40],
      k = [88, 107],
      a = [88, 134],
      e = [90, 62],
      w = [92, 84];
    let backK,
      backA,
      backE,
      backW,
      handLoad = true,
      scene = '',
      anchor = null,
      support = '';
    const front = frontView(ex);
    if (seated) {
      h = [82, 92];
      s = [83, 54];
      k = [111, 94];
      a = [110, 133];
      support = 'seat';
    }
    if (
      pos.includes('hinge') ||
      pos === 'prone' ||
      (f === 'row' && !seated && !pos.includes('seat')) ||
      f === 'kickback'
    ) {
      h = [76, 76];
      s = [108, 59];
      k = [85, 107];
      a = [78, 134];
    }
    let headPosition;
    if (ex.pattern === 'dragon-flag') {
      s = [56, 110];
      headPosition = [45, 109];
      const angle = (lerp(73, 8, t) * Math.PI) / 180;
      const extend = (from, length, tilt) => shift(from, length * Math.cos(tilt), -length * Math.sin(tilt));
      h = extend(s, 32, angle);
      const reset = pos === 'negative' && returning ? Math.sin(Math.PI * t) : 0;
      const tuck = pos === 'tuck' ? 1 : reset;
      k = extend(h, 25, angle + tuck * 1.25);
      a = extend(k, 25, angle - tuck * 0.85);
      if (pos === 'one-leg') {
        backK = extend(h, 25, angle + 1.25);
        backA = extend(backK, 25, angle - 0.85);
      }
      e = [34, 94];
      w = [28, 113];
      scene +=
        pad([27, 116], [149, 116]) + line([36, 119], [36, 138], metal) + line([138, 119], [138, 138], metal);
    } else if (f === 'vup' || f === 'floorraise') {
      h = [91, 129];
      s = f === 'vup' ? at([56, 125], [70, 99]) : [55, 124];
      const angle = (lerp(6, f === 'vup' ? 53 : 79, t) * Math.PI) / 180;
      k = shift(h, 25 * Math.cos(angle), -25 * Math.sin(angle));
      const bend = pos === 'tuck' ? (f === 'vup' ? t * 1.45 : Math.PI / 2) : 0;
      if (f === 'floorraise' && pos === 'tuck') k = at([108, 111], [91, 103]);
      a =
        pos === 'tuck' && f === 'floorraise'
          ? at([124, 131], [117, 103])
          : shift(k, 26 * Math.cos(angle - bend), -26 * Math.sin(angle - bend));
      e = f === 'vup' ? at([39, 121], [88, 102]) : [73, 130];
      w = f === 'vup' ? at([20, 123], [106, 96]) : [92, 131];
      support = 'mat';
    } else if (f === 'climber' || f === 'scappush') {
      s = [61, f === 'scappush' ? lerp(94, 100, t) : 94];
      h = [101, 110];
      w = [60, 135];
      e = blend(s, w, 0.5);
      k = f === 'climber' ? at([126, 122], [pos === 'cross' ? 62 : 75, 116]) : [127, 122];
      a = f === 'climber' ? at([149, 134], [pos === 'cross' ? 83 : 96, 129]) : [149, 134];
      backK = [126, 121];
      backA = [149, 133];
    } else if (f === 'pike') {
      const raised = pos === 'raised';
      a = [142, raised ? 103 : 134];
      w = [61, 135];
      h = at([94, raised ? 65 : 77], [91, raised ? 72 : 83]);
      s = at([66, 95], [60, 117]);
      k = blend(h, a, 0.5);
      e = at([64, 114], [77, 119]);
      if (raised) scene += pad([132, 106], [155, 106]) + line([148, 108], [148, 138], metal);
    } else if (f === 'scappull') {
      w = [89, 17];
      s = [89, 56];
      e = blend(s, w, 0.5);
      h = at([92, 91], [92, 85]);
      k = shift(h, 1, 24);
      a = shift(k, -1, 23);
      headPosition = at([89, 44], [89, 38]);
      scene += pad([67, 16], [109, 16]);
    } else if (bench) {
      const slope = pos === 'incline' ? -19 : pos === 'decline' ? 12 : 0;
      const base = pos === 'floor' ? 117 : 85;
      h = [117, base];
      s = [80, base + slope];
      k = [136, base + 8];
      a = [137, 138];
      e = at(shift(s, -15, 12), shift(s, -1, -23));
      w = at(shift(s, -16, -12), shift(s, -1, -46));
      support = pos === 'floor' ? 'mat' : 'bench';
      if (pos === 'larsen') {
        k = [141, 91];
        a = [165, 96];
      }
      if (pos === 'spoto') {
        const press = Math.max(0, (t - 0.18) / 0.82);
        e = blend(shift(s, -15, 8), shift(s, -1, -23), press);
        w = blend(shift(s, -16, -16), shift(s, -1, -46), press);
      }
      if (f === 'skull') {
        e = shift(s, -4, -21);
        w = at(shift(e, -3, -23), shift(e, -23, 4));
      }
      if (f === 'fly') {
        e = at(shift(s, -27, 1), shift(s, -8, -20));
        w = at(shift(s, -43, -8), shift(s, -7, -42));
      }
      if (f === 'pullover') {
        e = at(shift(s, -22, -5), shift(s, -2, -25));
        w = at(shift(s, -43, -9), shift(s, 2, -44));
      }
    } else if (f === 'pushup' || f === 'inverted' || (f === 'reach' && pos === 'plank')) {
      const pull = f === 'inverted',
        offset = pos === 'incline' ? 18 : pos === 'decline' ? -16 : 0;
      a = [153, pos === 'decline' ? 105 : 134];
      w = [57, pull ? 53 : pos === 'incline' ? 106 : 134];
      s = at([60, (pull ? 90 : 112) - offset], [62, (pull ? 64 : 90) - offset]);
      h = at([101, (pull ? 112 : 119) - offset / 2], [102, (pull ? 89 : 109) - offset / 2]);
      k = blend(h, a, 0.52);
      e = at([43, pull ? 70 : 119], [59, pull ? 78 : 111]);
      if (pos === 'knees') {
        k = [126, 133];
        a = [150, 121];
      }
      if (pos === 'incline' || pos === 'decline')
        scene += pad(pos === 'incline' ? [42, 109] : [143, 108], pos === 'incline' ? [73, 109] : [167, 108]);
      if (pos === 'plank') {
        s = [60, 90];
        h = [103, 110];
        k = [129, 122];
        e = at([63, 113], [78, 108]);
        w = at([62, 134], [66, 93]);
        backE = [52, 114];
        backW = [51, 134];
      }
      if (pull) {
        scene += pos === 'rings' ? line([57, 50], [57, 5], metal) : pad([43, 52], [75, 52]);
      }
      if (f === 'pushup' && pos === 'rings') {
        w = [57, 123];
        scene += line([57, 120], [57, 7], metal);
      }
      handLoad = false;
    } else if (f === 'dip' || f === 'pullup' || f === 'negative' || (f === 'legraise' && pos !== 'floor')) {
      const pulling = f === 'pullup' || f === 'negative',
        phase = f === 'negative' ? 1 - t : t;
      const y = pulling ? lerp(69, 43, phase) : f === 'dip' ? lerp(48, 66, t) : 58;
      s = [91, y];
      h = shift(s, 3, 34);
      k = shift(h, -2, 26);
      a = shift(k, -13, 15);
      if (pulling) {
        w = [93, 20];
        e = blend([91, 45], [111, 44], phase);
        scene += pad([69, 18], [117, 18]);
      } else if (f === 'dip') {
        w = [93, 93];
        e = at([92, 70], [73, 82]);
        scene += pad([77, 95], [112, 95]);
      } else {
        const chair = pos === 'chair';
        w = chair ? [112, 80] : [91, 13];
        e = chair ? [89, 82] : [92, 34];
        scene += chair ? pad([84, 85], [116, 85]) : pad([69, 12], [116, 12]);
        k = at(shift(h, 1, 23), shift(h, 23, -6));
        a = pos === 'hang' ? at(shift(h, 1, 46), shift(h, 49, -9)) : at(shift(h, -2, 42), shift(h, 25, 14));
      }
      handLoad = false;
    } else if (['squat', 'split', 'step', 'hinge', 'deadlift', 'backext'].includes(f)) {
      if (f === 'squat') {
        h = at([89, 77], [76, 106]);
        s = at([88, 39], [93, 71]);
        k = at([91, 106], [109, 104]);
        a = [94, 134];
        if (pos === 'box') scene += pad([45, 112], [81, 112]);
      }
      if (f === 'split') {
        h = at([85, 78], [83, 102]);
        s = shift(h, 5, -35);
        a = [110, 134];
        k = at([101, 102], [112, 103]);
        backK = at([70, 105], [60, 125]);
        backA = [47, pos === 'rear-up' ? 101 : 134];
        if (pos === 'rear-up') scene += pad([30, 104], [53, 104]);
      }
      if (f === 'step') {
        a = [111, 108];
        k = at([108, 80], [109, 81]);
        h = at([77, 83], [109, 56]);
        s = shift(h, 2, -34);
        backK = at([73, 106], [90, 79]);
        backA = at([65, 134], [85, 105]);
        scene += pad([98, 111], [134, 111]) + line([102, 113], [102, 138], metal);
      }
      if (f === 'hinge' || f === 'deadlift') {
        const p = f === 'deadlift' ? 1 - t : t;
        h = blend([89, 77], [70, f === 'deadlift' ? 94 : 80], p);
        s = blend([88, 39], [104, 68], p);
        k = blend([90, 105], [f === 'deadlift' ? 99 : 86, 105], p);
        a = [88, 134];
        if (pos === 'single-leg') {
          backK = at([83, 104], [45, 83]);
          backA = at([81, 132], [20, 85]);
        }
        if (pos === 'kickstand') backA = [67, 132];
      }
      if (f === 'backext') {
        h = [95, 89];
        s = at([76, 59], [64, 112]);
        k = [112, 108];
        a = [131, 129];
        scene += pad([97, 96], [115, 113]) + pad([122, 128], [138, 128]);
      }
      if (
        pos === 'back' ||
        (f === 'squat' && ['bb', 'smith'].includes(gear) && !['front', 'zercher'].includes(pos)) ||
        (f === 'split' && ['bb', 'smith'].includes(gear))
      ) {
        w = shift(s, 2, -1);
        e = shift(s, -11, 13);
      } else if (['front', 'zercher'].includes(pos) || f === 'backext') {
        w = shift(s, 7, 5);
        e = shift(s, 13, 18);
      } else if (pos === 'through') {
        e = shift(s, 0, 18);
        w = at([103, 83], [80, 101]);
        anchor = [31, 128];
      } else {
        e = shift(s, 0, 19);
        w = shift(s, 0, 39);
      }
    } else if (
      f === 'bridge' ||
      (f === 'crunch' && !['standing'].includes(pos)) ||
      (f === 'legraise' && pos === 'floor') ||
      (f === 'reach' && pos === 'supine')
    ) {
      const elevated = f === 'bridge' && pos.includes('bench');
      s = [58, elevated ? 92 : 124];
      h = f === 'bridge' ? at([91, 124], [94, elevated ? 86 : 100]) : [97, 125];
      k = [118, 97];
      a = [134, 132];
      e = shift(s, 14, 3);
      w = shift(h, 0, -2);
      if (elevated) scene += pad([39, 96], [65, 96]);
      else support = 'mat';
      if (pos.includes('single')) {
        backK = shift(h, 23, -13);
        backA = shift(backK, 20, 6);
      }
      if (f === 'crunch') {
        s = at([58, 122], [64, 107]);
        if (pos === 'decline') {
          s = shift(s, 0, 6);
          h = [93, 109];
          k = [111, 86];
          scene += pad([45, 137], [107, 105]);
        }
        if (pos === 'ball') {
          h = [97, 99];
          s = at([56, 96], [65, 82]);
          k = [124, 104];
          scene += dot([83, 116], 18, metal);
        }
        e = shift(s, 12, -5);
        w = shift(s, 8, 0);
      }
      if (f === 'legraise') {
        h = at([97, 125], [93, 116]);
        k = at([119, 109], [89, 91]);
        a = at([140, 116], [112, 83]);
      }
      if (f === 'reach') {
        e = at([57, 102], [43, 111]);
        w = at([57, 82], [22, 108]);
        k = at([105, 99], [122, 113]);
        a = at([128, 99], [146, 125]);
        backK = [94, 100];
        backA = [121, 100];
      }
      handLoad = f === 'crunch';
    } else if (f === 'glutekick' || (f === 'reach' && ['quadruped', 'roll'].includes(pos))) {
      if (pos === 'quadruped' || pos === 'roll') {
        h = [89, 95];
        s = [59, 94];
        e = [58, 113];
        w = [57, 133];
        k = [89, 133];
        a = [112, 135];
        if (pos === 'roll') {
          s = at([64, 89], [49, 110]);
          h = at([86, 96], [76, 115]);
          e = at([58, 110], [34, 120]);
          w = at([56, 130], [20, 130]);
          scene += dot(w, 8, load);
        } else {
          k = at([90, 130], [117, 98]);
          a = f === 'glutekick' ? at([112, 132], [119, 76]) : at([113, 132], [144, 100]);
          backK = [85, 132];
          backA = [107, 135];
          if (f === 'reach') {
            e = at([60, 113], [39, 92]);
            w = at([58, 133], [20, 92]);
            backE = [62, 113];
            backW = [63, 133];
          }
        }
      } else {
        h = [90, 81];
        s = [103, 47];
        e = [115, 61];
        w = [128, 62];
        k = at([88, 108], [71, 102]);
        a = at([87, 134], [49, 115]);
        backK = [95, 109];
        backA = [96, 134];
        scene += pad([123, 65], [143, 65]);
      }
      handLoad = false;
    } else if (['legpress', 'quad', 'ham', 'calf', 'seatedcalf', 'abduct', 'adduct'].includes(f)) {
      if (f === 'legpress' || pos === 'legpress') {
        h = [70, 103];
        s = [54, 73];
        k = at([91, 70], [101, 77]);
        a = at([110, 82], [125, 55]);
        if (pos === 'horizontal') a = at([105, 101], [134, 99]);
        if (f === 'calf') {
          k = [97, 82];
          a = at([116, 63], [121, 60]);
        }
        scene += pad([51, 72], [69, 107]) + pad(shift(a, -5, -7), shift(a, 6, 8));
      } else if (f === 'quad' || (f === 'ham' && pos.includes('seat'))) {
        h = [79, 91];
        s = [77, 56];
        k = [105, 93];
        a = f === 'quad' ? at([106, 127], [136, 96]) : at([136, 96], [99, 124]);
        support = 'seat';
        scene += dot(shift(a, 1, -3), 5, metal);
      } else if (f === 'ham' && pos === 'prone') {
        h = [88, 100];
        s = [57, 99];
        k = [116, 100];
        a = at([143, 102], [120, 75]);
        scene += pad([48, 106], [121, 106]);
      } else if (f === 'ham') {
        k = [87, 108];
        a = at([87, 134], [62, 108]);
        backA = [96, 134];
      } else if (f === 'abduct' || f === 'adduct') {
        const p = f === 'abduct' ? t : 1 - t;
        if (pos === 'seat') {
          h = [89, 87];
          s = [88, 50];
          k = blend([95, 103], [113, 99], p);
          a = shift(k, 0, 30);
          backK = [178 - k[0], k[1]];
          backA = shift(backK, 0, 30);
          support = 'seat';
        } else if (pos === 'side') {
          s = [54, 117];
          h = [89, 122];
          k = blend([115, 123], [112, 106], p);
          a = blend([141, 125], [134, 92], p);
          backK = [115, 125];
          backA = [142, 129];
          support = 'mat';
        } else {
          k = blend([93, 108], [106, 104], p);
          a = blend([91, 134], [124, 126], p);
          backK = [80, 105];
          backA = [80, 134];
        }
      } else {
        const dy = -7 * t;
        h = shift(h, 0, dy);
        s = shift(s, 0, dy);
        k = shift(k, 0, dy);
        a = shift(a, 0, dy);
        if (f === 'seatedcalf') {
          h = [81, 94];
          s = [80, 57];
          k = [110, 93 + dy];
          a = [109, 133 + dy];
          support = 'seat';
        }
      }
      e = shift(s, 2, 18);
      w = shift(e, 4, 16);
      if (f === 'seatedcalf') {
        e = shift(s, 8, 17);
        w = shift(k, -4, -3);
      }
      handLoad = ['db', 'bb'].includes(gear) && ['calf', 'seatedcalf'].includes(f);
    } else {
      if (pos === 'kneel' || pos === 'half-kneel') {
        h = [83, 101];
        s = [83, 66];
        k = [82, 132];
        a = [59, 134];
        if (pos === 'half-kneel') {
          backK = [105, 104];
          backA = [106, 134];
        }
      }
      if ((pos === 'incline' && f === 'curl') || (pos === 'prone' && f === 'curl')) {
        h = [82, 93];
        s = [pos === 'incline' ? 66 : 102, 60];
        k = [105, 98];
        a = [102, 134];
        support = 'seat';
      }
      if (pos === 'incline' && ['rear', 'row'].includes(f)) {
        h = [84, 92];
        s = [101, 62];
        scene += pad([79, 99], [103, 68]);
      }
      if (pos === 'concentration') s = shift(s, 12, 3);
      if (pos === 'lean') {
        h = [91, 78];
        s = [100, 41];
      }
      if (['curl', 'hammer'].includes(f)) {
        e = shift(s, pos === 'preacher' || pos === 'concentration' ? 14 : pos === 'behind' ? -9 : 1, 22);
        w = at(shift(e, 5, 21), shift(e, 13, -16));
        if (pos === 'preacher') scene += pad(shift(e, -12, -10), shift(e, 6, 3));
        if (pos === 'high') {
          e = shift(s, 24, 0);
          w = at(shift(e, 20, -3), shift(e, -4, -19));
        }
      }
      if (f === 'pressdown' || f === 'kickback' || f === 'extension') {
        e = f === 'extension' ? shift(s, 0, -20) : f === 'kickback' ? shift(s, -20, 3) : shift(s, 1, 23);
        w =
          f === 'extension'
            ? at(shift(e, -15, 13), shift(e, 2, -20))
            : f === 'kickback'
              ? at(shift(e, 0, 19), shift(e, -19, 5))
              : at(shift(e, 17, -9), shift(e, 1, 21));
      }
      if (f === 'overhead') {
        const d = pos === 'diagonal' || pos === 'half-kneel';
        e = at(shift(s, 12, 11), shift(s, d ? 19 : 3, -20));
        w = at(shift(s, 6, -3), shift(s, d ? 34 : 4, -37));
      }
      if (f === 'row') {
        e = at(shift(s, 16, 15), shift(s, -13, 14));
        w = at(shift(s, 34, 26), shift(s, 4, 20));
        if (!seated && !pos.includes('seat')) {
          e = at(shift(s, 1, 18), shift(s, -17, 1));
          w = at(shift(s, 2, 39), shift(s, -8, 18));
        }
      }
      if (f === 'pulldown') {
        if (!pos.includes('kneel')) {
          h = [82, 96];
          s = [82, 60];
          k = [106, 99];
          a = [106, 134];
          support = 'seat';
        }
        e = at(shift(s, 9, -18), shift(s, 15, 16));
        w = at(shift(s, 13, -36), shift(s, 11, -4));
      }
      if (f === 'raise' || f === 'rear' || f === 'fly') {
        e = at(shift(s, 5, 20), shift(s, 24, 0));
        w = at(shift(s, 7, 40), shift(s, 44, -2));
        if (f === 'fly') {
          e = at(shift(s, 25, 4), shift(s, 13, 6));
          w = at(shift(s, 42, pos === 'low' ? 16 : -5), shift(s, 1, pos === 'high' ? 14 : -2));
        }
      }
      if (f === 'front' || f === 'pullover') {
        e = at(shift(s, 4, 18), shift(s, 20, -1));
        w = at(shift(s, 5, 39), shift(s, 40, -2));
        if (f === 'pullover') {
          e = at(shift(s, 13, -16), shift(s, 5, 18));
          w = at(shift(s, 23, -30), shift(s, 7, 39));
        }
      }
      if (f === 'face') {
        e = at(shift(s, 12, 3), shift(s, 26, -2));
        w = at(shift(s, 18, 4), shift(s, 12, -10));
      }
      if (f === 'shrug') {
        s = shift(s, 0, -6 * t);
        e = shift(s, 3, 21);
        w = shift(e, 2, 22);
      }
      if (['wrist', 'wristext', 'roller'].includes(f)) {
        e = shift(s, 3, 24);
        w = shift(e, 24, 3);
        const tip = shift(w, 10, f === 'wristext' ? lerp(4, -6, t) : lerp(6, -4, t));
        scene += line(w, tip, joint, 3);
        w = tip;
        if (f === 'roller') {
          scene += line(w, shift(w, 0, 42 - 25 * t), metal, 1) + dot(shift(w, 0, 42 - 25 * t), 6, load);
        }
      }
      if (f === 'twist' || f === 'pallof') {
        const down = pos === 'low' ? 14 : pos === 'high' ? -11 : 5;
        e = at(shift(s, -9, 10), shift(s, 14, 9));
        w =
          f === 'pallof' ? at(shift(s, 4, 6), shift(s, 25, 3)) : at(shift(s, -25, down), shift(s, 27, -down));
      }
      if (f === 'crunch') {
        s = at([89, 40], [106, 53]);
        e = shift(s, 10, 8);
        w = shift(s, 1, -5);
      }
    }
    if (pos === 'long-seat') {
      const down = 35;
      h = shift(h, 0, down);
      s = shift(s, 0, down);
      e = shift(e, 0, down);
      w = shift(w, 0, down);
      k = shift(h, 28, 2);
      a = shift(k, 28, 2);
      support = 'mat';
    }
    const mirror = (p) => [2 * s[0] - p[0], p[1]];
    if (!backK) backK = shift(k, front ? -12 : -6, 0);
    if (!backA) backA = shift(a, front ? -17 : -7, 0);
    if (!backE) backE = single ? shift(s, -4, 21) : front ? mirror(e) : shift(e, -6, -1);
    if (!backW) backW = single ? shift(s, -5, 39) : front ? mirror(w) : shift(w, -6, -1);
    if (support === 'seat')
      scene += pad(shift(h, -12, 5), shift(h, 16, 5)) + line(shift(h, 2, 7), [h[0] + 2, 138], metal);
    if (support === 'bench')
      scene += pad(shift(s, -11, 6), shift(h, 9, 5)) + line(shift(h, 4, 6), [h[0] + 4, 138], metal);
    if (support === 'mat') scene += pad([35, 138], [155, 138]);
    if (gear === 'smith')
      scene +=
        line([w[0] - 5, 8], [w[0] - 5, 137], metal, 2) + line([w[0] + 5, 8], [w[0] + 5, 137], metal, 2);
    const ankleLoad = ['quad', 'ham', 'glutekick', 'abduct', 'adduct'].includes(f);
    const contact = ankleLoad ? a : w;
    if (gear === 'cable' || gear === 'band') {
      if (!anchor)
        anchor =
          gear === 'band' && ['pushup', 'curl', 'overhead', 'raise', 'shrug', 'hinge'].includes(f)
            ? a
            : [
                pos === 'behind' || f === 'glutekick' ? 39 : 160,
                ['face', 'pressdown', 'pulldown', 'pullover', 'crunch'].includes(f) || pos === 'high'
                  ? 26
                  : pos === 'standing' && ['pallof', 'fly', 'twist'].includes(f)
                    ? 67
                    : 131
              ];
      if (gear === 'cable')
        scene += line([anchor[0]-5,18],[anchor[0]-5,138],metal,2.5) + line([anchor[0]+5,18],[anchor[0]+5,138],metal,2.5) +
          pad([anchor[0]-5,18],[anchor[0]+5,18]) + pad([anchor[0]-8,138],[anchor[0]+8,138]) +
          '<rect x="'+(anchor[0]-3.5)+'" y="'+fmt(114-6*t)+'" width="7" height="21" rx="1" fill="#393a36"/>'+dot(anchor,2.5,metal);
      scene += line(anchor, contact, gear === 'band' ? '#9dcba2' : metal, gear === 'band' ? 2.4 : 1.3);
    }
    const head = headPosition || shift(s, (s[0] - h[0]) * 0.23, (s[1] - h[1]) * 0.25 - 1);
    const scale = 37;
    const dx = h[0] - s[0],
      dy = h[1] - s[1],
      len = Math.hypot(dx, dy) || 1;
    const offset = (joint, d) => shift(joint, (dy * d) / len, (-dx * d) / len);
    const armSpan = front ? 11 : 5,
      hipSpan = front ? 6 : 3;
    const rear =
      [
        'row',
        'rear',
        'face',
        'glutekick',
        'ham',
        'hinge',
        'abduct',
        'backext',
        'inverted',
        'shrug',
        'scappull',
        'pullup',
        'pulldown'
      ].includes(f) || pos === 'prone';
    const foot = (ankle, other) => shift(ankle, front ? (other ? -5 : 5) : 8, front ? 5 : 2);
    let drawing =
      scene +
      line([16, 139], [170, 139], '#cdcec9', 0.75) +
      anatomy.figure({
        s,
        h,
        head,
        scale,
        facing: (rear ? -1 : 1) * (front ? 0.96 : 0.45),
        female,
        near: { s: offset(s, armSpan), h: offset(h, hipSpan), e, w, k, a, f: foot(a, false) },
        far: {
          s: offset(s, -armSpan),
          h: offset(h, -hipSpan),
          e: backE,
          w: backW,
          k: backK,
          a: backA,
          f: foot(backA, true)
        }
      });
    if (gear === 'landmine') drawing += line([161, 137], w, metal, 3) + dot(w, 5, load);
    if (gear === 'plate') drawing += dot(f === 'pullup' || f === 'dip' ? shift(h, 0, 13) : w, 6, load);
    if (gear === 'kb') drawing += line(w, shift(w, 0, 5), load, 2) + dot(shift(w, 0, 8), 5, load);
    if (handLoad && ['db', 'bb', 'ez', 'smith', 'trap'].includes(gear)) {
      const weights = (p, size) =>
        line(shift(p, -size, 0), shift(p, size, 0), metal, 2) +
        line(shift(p, -size, -3), shift(p, -size, 3), load, 3) +
        line(shift(p, size, -3), shift(p, size, 3), load, 3);
      drawing += weights(w, gear === 'db' ? 4 : 10);
      if (gear === 'db' && !single) drawing += weights(backW, 3);
    }
    if (f === 'bridge' && gear !== 'bw') drawing += line(shift(h, -8, -3), shift(h, 8, -3), load, 4);
    if (gear === 'machine' && !['legpress', 'quad', 'seatedcalf', 'abduct', 'adduct'].includes(f))
      drawing +=
        line(contact, shift(contact, 13, 2), load, 3) + line(shift(contact, 13, 2), [143, 105], metal, 2);
    return {
      drawing,
      extent: [
        [3, -9],
        [179, 146]
      ]
    };
  }
  const api = { frame, frontView };
  root.ExerciseMovement = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);
