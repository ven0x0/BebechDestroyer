(function screens() {
  'use strict';
  const L = (typeof window !== 'undefined' ? window : globalThis).GymI18n || require('./i18n.js');
  const A = window.Rozstaw,
    M = window.GymModel,
    { page, esc, icon, top, sheet, closeSheet, action, toast, num, count, labelDate } = A;
  const state = () => A.state;
  const field = (name, content, wide = false) =>
    `<label class="field${wide ? ' full' : ''}">${esc(name)}${content}</label>`;
  const select = (id, opts, value, placeholder = '') =>
    `<select id="${id}">${placeholder ? `<option value="">${esc(placeholder)}</option>` : ''}${opts.map((o) => `<option value="${esc(o.id)}"${o.id === value ? ' selected' : ''}>${esc(o.exerciseId ? stationName(o) : o.name)}</option>`).join('')}</select>`;
  const input = (id, value = '', type = 'text', attrs = '') =>
    `<input id="${id}" type="${type}" value="${esc(value)}" ${attrs}>`;
  const val = (id) => document.getElementById(id)?.value ?? '';
  const number = (id) => M.parseNumber(val(id));
  const sorted = (a) => [...a].sort((x, y) => x.name.localeCompare(y.name, L.locale));
  const exerciseName = (ex) => ExerciseAtlas.name(state(), ex);
  const exerciseOptions = () => sorted(state().exercises.map((e) => ({ id: e.id, name: exerciseName(e) })));
  const stationName = p => p?.name === A.exercise(p.exerciseId)?.name ? exerciseName(p.exerciseId) : p.name;
  const builtInIds = new Set(M.createState().exercises.map((e) => e.id));
  const groupLabels = {
    band: L.t('Guma'), kettlebell: 'Kettlebell', plate: L.t('Talerz'), smith: L.t('Suwnica Smitha'), landmine: 'Landmine', roller: L.t('Roller nadgarstkowy'),
    machine: L.t("Maszyna"),
    cable: L.t("Wyciąg"),
    barbell: L.t("Sztanga"),
    dumbbell: L.t("Hantle"),
    bodyweight: L.t("Masa ciała"),
    other: L.t("Inny sprzęt")
  };
  const kinds = Object.entries(groupLabels).map(([id, name]) => ({ id, name }));
  let calcEx = 'chest-press',
    calcGym = '',
    calcEq = '',
    calcReps = 10,
    progressGym = '',
    progressEx = '',
    progressEq = '',
    metric = 'weight',
    simulate = 80,
    pendingBackup = null,
    query = '',
    catalogLimit = 16,
    filterGroup = '';
  function currentExercise() {
    return state().exercises.find((x) => x.id === calcEx) || state().exercises[0];
  }
  function availableGyms() {
    return state().gyms;
  }
  function chosenGym(id) {
    return availableGyms().find((g) => g.id === id)?.id || A.gymId;
  }
  function chooseEq(gym, exercise, id) {
    const ps = M.getEquipment(state(), gym, exercise);
    return { ps, selected: ps.find((p) => p.id === id)?.id || ps[0]?.id || '' };
  }
  function calc() {
    const ex = currentExercise();
    if (!ex) {
      page.innerHTML = top(L.t("Przelicznik maszyn")) + action('custom', L.t("Dodaj ćwiczenie"));
      return;
    }
    calcEx = ex.id;
    if (A.params.profile && !A.params.used) {
      const target = state().equipment.find((p) => p.id === A.params.profile);
      if (target) {
        calcEx = target.exerciseId;
        calcGym = target.gymId;
        calcEq = target.id;
      }
      A.params.used = true;
    }
    calcGym = chosenGym(calcGym);
    const { ps, selected } = chooseEq(calcGym, calcEx, calcEq);
    calcEq = selected;
    const r = M.recommend(state(), {
      gymId: calcGym,
      exerciseId: calcEx,
      equipmentId: calcEq,
      reps: calcReps
    });
    const source = { local: L.t("Wynik lokalny"), transfer: L.t("Przeliczenie z innego sprzętu"), none: L.t("Kalibracja") },
      conf = { none: '', low: L.t('niska'), medium: L.t('umiarkowana'), high: L.t('wysoka') };
    page.innerHTML =
      top(L.t("Przelicznik maszyn"), L.t("Wybierz sprzęt, na którym chcesz dziś ćwiczyć.")) +
      `<div class="toolgrid"><section class="panel block"><h2>${L.t("Sprzęt docelowy")}</h2><div class="formgrid">${field(L.t("Ćwiczenie"), select('calc-ex', exerciseOptions(), calcEx), true)}${field(L.t("Siłownia"), select('calc-gym', availableGyms(), calcGym))}${field(L.t("Powtórzenia"), input('calc-reps', calcReps, 'number', 'min="1" max="1000" inputmode="numeric"'))}${field(L.t("Maszyna lub stanowisko"), ps.length ? select('calc-eq', ps, calcEq) : ("<select disabled><option>" + L.t("Brak zapisanego sprzętu") + "</option></select>"), true)}</div></section><section class="panel block result"><div class="kicker">${icon('calc', 15)}${source[r.source]}</div>${r.weight != null ? `<div class="weight">${num(r.weight)} <small>kg × ${esc(calcReps)} ${L.t("powt.")}</small></div><div class="chip">${L.t("Pewność podpowiedzi ·")} ${conf[r.confidence]}</div>` : ("<h2>" + L.t("Potrzebna pierwsza seria") + "</h2>")}<p class="sectiongap">${esc(r.reason)}</p><div class="actionbar">${action('manual', L.t("Dodaj wcześniejszy wynik"), 'plus')}</div></section></div><section class="panel block"><h2>${L.t("Jak powstaje przelicznik?")}</h2><p>${L.t("Aplikacja porównuje serie robocze tego samego ćwiczenia na dwóch stanowiskach. Łączy treningi z odstępem do 14 dni i uwzględnia liczbę powtórzeń. Po zapisaniu rzeczywistego ciężaru aktualizuje współczynnik dla tej pary stanowisk. Podpowiedź zaokrągla do dostępnego skoku obciążenia.")}</p><div class="actionbar">${action('example', L.t("Sprawdź przykład 35 i 70 kg"), 'calc', 'tintbtn')}</div></section>`;
  }
  function demo() {
    const d = M.createState();
    const a = M.ensureEquipment(d, 'alchemia', 'chest-press', L.t("Stanowisko A"), 2.5),
      b = M.ensureEquipment(d, 'suchanino', 'chest-press', L.t("Stanowisko B"), 5);
    for (const [idx, days, profile, weight] of [
      [0, 21, a, 35],
      [1, 20, b, 70],
      [2, 1, b, simulate]
    ]) {
      const ts = Date.now() - days * 86400000;
      d.sessions.push({
        id: `test-${idx}`,
        name: L.t("Przykład"),
        gymId: profile.gymId,
        startedAt: ts,
        finishedAt: ts,
        exercises: [
          { exerciseId: 'chest-press', equipmentId: profile.id, sets: [{ weight, reps: 10, done: true }] }
        ]
      });
    }
    const r = M.recommend(d, { gymId: 'alchemia', exerciseId: 'chest-press', equipmentId: a.id, reps: 10 });
    sheet(
      L.t("Przykład przeliczenia"),
      `<p>${L.t("W przykładowej historii 35 kg × 10 w Alchemii odpowiadało 70 kg × 10 w Suchaninie. Wybierz kolejny wynik w Suchaninie.")}</p>${field(
        L.t("Nowy wynik w Suchaninie przy 10 powtórzeniach"),
        select(
          'demo-kg',
          [60, 65, 70, 75, 80, 85, 90, 95, 100].map((n) => ({ id: String(n), name: n + ' kg' })),
          String(simulate)
        )
      )}<div class="info"><b>${num(r.weight)} ${L.t("kg × 10 w Alchemii")}</b><br>${esc(r.reason)} ${L.t("Pewność jest niska przy jednej parze treningów.")}</div><p class="sectiongap">${L.t("Dane przykładowe są używane tylko w tej symulacji.")}</p>`
    );
  }
  function localTime() {
    const d = new Date(Date.now() - 1500);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }
  function manual() {
    const ex = currentExercise(),
      profiles = M.getEquipment(state(), calcGym, ex.id);
    sheet(
      L.t("Wcześniejszy wynik"),
      `<p>${esc(exerciseName(ex))} · ${esc(A.gymName(calcGym))}</p><form id="manual-form"><div class="formgrid">${field(L.t("Stanowisko"), select('manual-eq', [...profiles, { id: '__new', name: L.t("Nowe stanowisko") }], calcEq || '__new'), true)}<div class="full" id="manual-new"${profiles.length ? ' hidden' : ''}>${field(L.t("Nazwa stanowiska"), input('manual-name', exerciseName(ex), 'text', 'maxlength="100"'))}${field(L.t("Skok obciążenia (kg)"), input('manual-step', num(2.5), 'text', 'inputmode="decimal"'))}</div>${field(L.t("Ciężar (kg)"), input('manual-kg', '', 'text', ("required inputmode=\"decimal\" placeholder=\"" + L.t("np. 35") + "\"")))}${field(L.t("Powtórzenia"), input('manual-reps', calcReps, 'number', 'required min="1" max="1000"'))}${field(L.t("Data i godzina serii"), input('manual-at', localTime(), 'datetime-local', `required max="${localTime()}"`), true)}</div><div class="actionbar"><button class="solidbtn" type="submit">${icon('check', 16)}${L.t("Zapisz w historii")}</button></div></form>`
    );
  }
  function manualSubmit() {
    const weight = number('manual-kg'),
      reps = number('manual-reps'),
      dt = new Date(val('manual-at')).getTime();
    if (!(
      weight > 0 &&
      weight <= 10000 &&
      Number.isInteger(reps) &&
      reps >= 1 &&
      reps <= 1000 &&
      Number.isFinite(dt) &&
      dt <= Date.now()
    )) {
      toast(L.t("Sprawdź ciężar, powtórzenia i datę."));
      return;
    }
    const id = val('manual-eq');
    let profile = state().equipment.find(
      (p) => p.id === id && p.gymId === calcGym && p.exerciseId === calcEx
    );
    if (!profile) {
      const name = val('manual-name').trim(),
        step = number('manual-step');
      if (!name || !(step >= 0.0001 && step <= 1000)) {
        toast(L.t("Wpisz nazwę stanowiska i dodatni skok obciążenia."));
        return;
      }
      profile = M.ensureEquipment(state(), calcGym, calcEx, name, step);
    }
    const ts = new Date(dt).toISOString();
    state().sessions.push({
      id: M.uid(),
      gymId: calcGym,
      name: L.t("Wpis z dziennika"),
      planId: null,
      startedAt: ts,
      finishedAt: ts,
      exercises: [
        { exerciseId: calcEx, equipmentId: profile.id, sets: [{ weight, reps, type: 'normal', done: true }] }
      ]
    });
    calcEq = profile.id;
    A.save();
    closeSheet();
    calc();
    toast(L.t("Dodano serię do historii."));
  }
  function dataPoints(gymId, exId, eqId) {
    const points = [];
    for (const s of [...A.sessions()].reverse()) {
      if (s.gymId !== gymId) continue;
      const rows = s.exercises.filter((r) => r.exerciseId === exId && r.equipmentId === eqId),
        sets = rows.flatMap((r) => r.sets).filter((t) => t.done && t.type !== 'warmup');
      if (!sets.length) continue;
      points.push({
        when: new Date(s.finishedAt).getTime(),
        id: s.id,
        weight: Math.max(...sets.map((t) => Number(t.weight) || 0)),
        reps: Math.max(...sets.map((t) => Number(t.reps) || 0)),
        volume: sets.reduce((n, t) => n + Number(t.weight) * Number(t.reps), 0),
        sets: sets.length
      });
    }
    return points;
  }
  function chart(points, key, unit) {
    if (!points.length)
      return ("<p>" + L.t("Zapisz serię roboczą na wybranym stanowisku, aby zobaczyć pierwszy punkt wykresu.") + "</p>");
    const values = points.map((p) => p[key]),
      max = Math.max(...values),
      min = Math.min(...values),
      span = max - min || Math.max(1, max * 0.12),
      low = Math.max(0, min - span * 0.18),
      high = max + span * 0.18 || 1;
    const positions = points.map((p, i) => [
      points.length === 1
        ? 260
        : 16 + (492 * (p.when - points[0].when)) / (points.at(-1).when - points[0].when || 1),
      141 - (125 * (p[key] - low)) / (high - low)
    ]);
    const path = positions.map(([x, y], i) => (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1)).join(' ');
    return `<svg class="chart" viewBox="0 0 524 160" role="img" aria-label="${L.t("Wykres. Pierwszy wynik")} ${num(values[0])}${L.t(", ostatni")} ${num(values.at(-1))} ${unit}.">${[18, 61, 104, 147].map((y) => `<path d="M0 ${y}H524" stroke="#393e33" stroke-dasharray="4 5"/>`).join('')}<path d="${path}" fill="none" stroke="#d6fb73" stroke-width="3"/>${positions.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.6" fill="#d6fb73"/>`).join('')}</svg><div class="chartlabels"><span>${labelDate(points[0].when, { day: 'numeric', month: 'short' })}</span><span>${num(min)}–${num(max)} ${unit}</span><span>${labelDate(points.at(-1).when, { day: 'numeric', month: 'short' })}</span></div>`;
  }
  function localProgress() {
    const s = state(),
      ex = A.exercise(progressEx) || A.exercise(A.params.id) || s.exercises[0];
    if (!ex) {
      page.innerHTML = top(L.t("Wyniki stanowiska"));
      return;
    }
    progressEx = ex.id;
    progressGym = chosenGym(progressGym);
    const { ps, selected } = chooseEq(progressGym, ex.id, progressEq);
    progressEq = selected;
    const points = dataPoints(progressGym, ex.id, selected),
      unit = metric === 'reps' ? L.t("powt.") : 'kg';
    page.innerHTML =
      '<button class="pg-back" data-pg="back">' +
      icon('left', 15) +
      (L.t("Wróć") + "</button>") +
      top(L.t("Wyniki stanowiska"), exerciseName(ex)) +
      '<section class="panel block"><div class="formgrid">' +
      field(L.t("Siłownia"), select('prog-gym', availableGyms(), progressGym)) +
      field(
        L.t("Stanowisko"),
        ps.length
          ? select('prog-eq', ps, selected)
          : ("<select disabled><option>" + L.t("Brak zapisanego sprzętu") + "</option></select>")
      ) +
      '</div></section>' +
      ("<section class=\"panel block\"><div class=\"rowhead\"><h2>" + L.t("Wyniki lokalne") + "</h2>") +
      select(
        'prog-metric',
        [
          { id: 'weight', name: L.t("Ciężar") },
          { id: 'volume', name: L.t("Objętość") },
          { id: 'reps', name: L.t("Powtórzenia") }
        ],
        metric
      ) +
      '</div>' +
      chart(points, metric, unit) +
      '</section>';
  }
  let measureKind = 'weight';
  const measureKinds = {
    weight: { name: L.t("Masa ciała"), unit: 'kg' },
    waist: { name: L.t("Talia"), unit: 'cm' },
    chest: { name: L.t("Klatka piersiowa"), unit: 'cm' },
    hips: { name: L.t("Biodra"), unit: 'cm' },
    arm: { name: L.t("Ramię"), unit: 'cm' },
    thigh: { name: L.t("Udo"), unit: 'cm' }
  };
  function measureFieldSelect(id) {
    return select(
      id,
      Object.entries(measureKinds).map(([id, conf]) => ({ id, name: conf.name })),
      measureKind
    );
  }
  function measurements() {
    const conf = measureKinds[measureKind],
      entries = (state().measurements || [])
        .filter((m) => m.kind === measureKind)
        .sort((a, b) => a.at.localeCompare(b.at));
    const points = entries.map((m) => ({ when: new Date(m.at + 'T12:00:00').getTime(), value: m.value }));
    page.innerHTML =
      top(
        L.t("Pomiary ciała"),
        L.t("Zapisuj własne pomiary i sprawdzaj, jak zmieniają się z czasem."),
        action('addmeasure', L.t("Dodaj pomiar"))
      ) +
      `<section class="panel block">${field(L.t("Rodzaj pomiaru"), measureFieldSelect('measure-kind'))}<div class="sectiongap">${points.length ? chart(points, 'value', conf.unit) : ("<p>" + L.t("Dodaj pierwszy pomiar, aby rozpocząć historię.") + "</p>")}</div></section>${
        entries.length
          ? `<section class="panel block"><h2>${L.t("Historia pomiarów")}</h2>${[...entries]
              .reverse()
              .map(
                (m) =>
                  `<div class="recordrow"><span>${esc(labelDate(m.at + 'T12:00:00', { dateStyle: 'long' }))}</span><b>${num(m.value)} ${conf.unit}</b><button class="iconbtn" data-r="editmeasure" data-id="${esc(m.id)}" aria-label="${L.t("Edytuj pomiar")}">${icon('edit', 14)}</button></div>`
              )
              .join('')}</section>`
          : ''
      }`;
  }
  function measureForm(id) {
    const item = (state().measurements || []).find((m) => m.id === id);
    if (item) measureKind = item.kind;
    const date = localTime().slice(0, 10),
      conf = measureKinds[measureKind];
    sheet(
      item ? L.t("Edytuj pomiar") : L.t("Nowy pomiar"),
      `<form id="measure-form" data-id="${esc(id || '')}">${field(L.t("Rodzaj pomiaru"), measureFieldSelect('measure-new-kind'))}${field(L.t("Wartość (") + conf.unit + ')', input('measure-value', item ? num(item.value) : '', 'text', 'required inputmode="decimal"'))}${field(L.t("Data"), input('measure-date', item?.at || date, 'date', `required max="${date}"`))}<div class="actionbar"><button class="solidbtn">${L.t("Zapisz pomiar")}</button></div></form>`
    );
  }
  function saveMeasure(f) {
    const id = f.dataset.id,
      value = number('measure-value'),
      kind = val('measure-new-kind'),
      at = val('measure-date');
    if (
      !(value >= 0.001 && value <= 1500 && measureKinds[kind]) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(at) ||
      at > localTime().slice(0, 10)
    ) {
      toast(L.t("Sprawdź wartość i datę pomiaru."));
      return;
    }
    const all = state().measurements || (state().measurements = []),
      item = all.find((x) => x.id === id),
      dupe = all.find((x) => x.kind === kind && x.at === at && x.id !== id);
    if (dupe) {
      toast(L.t("W tym dniu masz już taki pomiar. Możesz go edytować w historii."));
      return;
    }
    if (item) Object.assign(item, { kind, value, at });
    else all.push({ id: M.uid(), kind, value, at });
    measureKind = kind;
    A.save();
    closeSheet();
    measurements();
  }
  const lookup = window.Routines.normalize;
  function exRows() {
    const list = [...state().exercises]
      .sort((a, b) => exerciseName(a).localeCompare(exerciseName(b), state().language || 'pl'))
      .filter(
        (e) =>
          (!filterGroup || e.group === filterGroup) &&
          lookup(ExerciseAtlas.aliases(state(), e).join(' ') + ' ' + e.group + ' ' + L.group(e)).includes(lookup(query))
      );
    return (
      list
        .slice(0, catalogLimit)
        .map(
          (e) =>
            `<button class="listrow atlas-result" data-r="exdetail" data-id="${esc(e.id)}"><span class="atlas-result-figure" aria-hidden="true">${ExerciseAtlas.figure(state(), e.id, 'auto')}</span><span class="rowtext"><b>${esc(exerciseName(e))}</b><small>${esc(L.group(e))} · ${esc(groupLabels[e.type] || e.type)}</small></span>${icon('right', 16)}</button>`
        )
        .join('') +
        (list.length > catalogLimit
          ? ("<button class=\"catalog-more\" data-r=\"moreExercises\">" + L.t("Pokaż więcej ćwiczeń (")) +
            (list.length - catalogLimit) +
            ')</button>'
          : '') || ("<div class=\"emptyline\">" + L.t("Brak pasujących ćwiczeń.") + "</div>")
    );
  }
  function catalogue() {
    page.innerHTML =
      top(
        L.t("Baza ćwiczeń"),
        count(state().exercises.length, L.t("ćwiczenie"), L.t("ćwiczenia"), L.t("ćwiczeń")),
        `<div class="pg-actions">${action('custom', L.t("Dodaj własne"), 'plus')}</div>`
      ) +
      `<div class="panel block formgrid">${field(L.t("Szukaj ćwiczenia"), input('ex-query', query, 'search', ("placeholder=\"" + L.t("Nazwa ćwiczenia lub partia") + "\"")))}${field(L.t("Partia mięśniowa"), select('ex-group', [{ id: '', name: L.t("Wszystkie partie") }, ...[...new Map(state().exercises.map(e => [e.group, {id:e.group, name:L.group(e)}])).values()].sort((a,b) => a.name.localeCompare(b.name,L.locale))], filterGroup))}</div><section class="panel list" id="ex-rows">${exRows()}</section>`;
  }
  function exdetail(id) {
    A.go('exercise', { id });
  }
  function language() {
    sheet(
      L.t("Język aplikacji"),
      ("<p>" + L.t("Wybierz język całej aplikacji.") + "</p>") +
        A.choices(
          [
            { id: 'pl', name: 'Polski' },
            { id: 'en', name: 'English' }
          ],
          'setLanguage',
          state().language || 'pl'
        )
    );
  }
  function muscleFields(saved = {}) {
    const roles = [
      ['', '—'],
      ['primary', L.t("Główny")],
      ['secondary', L.t("Wspomagający")],
      ['stabilizer', L.t("Stabilizujący")]
    ];
    return (
      ("<details class=\"pg-muscle-editor\"><summary>" + L.t("Ustaw zaangażowanie mięśni") + "</summary><div>") +
      ExerciseAtlas.regions
        .map((region) => {
          const role = roles.find(([id]) => saved[id]?.includes(region.id))?.[0] || '';
          return (
            '<label>' +
            esc(region.label) +
            '<select data-muscle="' +
            esc(region.id) +
            '">' +
            roles
              .map(
                ([id, n]) =>
                  '<option value="' + id + '" ' + (id === role ? 'selected' : '') + '>' + n + '</option>'
              )
              .join('') +
            '</select></label>'
          );
        })
        .join('') +
      '</div></details>'
    );
  }
  function readMuscles() {
    const out = { primary: [], secondary: [], stabilizer: [] };
    for (const el of document.querySelectorAll('#overlay select[data-muscle]')) {
      if (Object.hasOwn(out, el.value)) out[el.value].push(el.dataset.muscle);
    }
    return Object.values(out).some((a) => a.length) ? out : null;
  }
  function techniqueFields(ex = {}) {
    const models = exerciseOptions().filter((option) => builtInIds.has(option.id));
    return (
      field(L.t("Animacja wzorcowa"), select('custom-technique', models, ex.techniqueId, L.t("Bez animacji"))) +
      field(
        L.t("Własna instrukcja (opcjonalnie)"),
        `<textarea id="custom-instructions" maxlength="${M.instructionsLimit}" rows="4" placeholder="${L.t("Opisz ustawienie, ruch i powrót.")}">${esc(ex.instructions || '')}</textarea>`
      ) +
      ("<p>" + L.t("Gdy pole instrukcji jest puste, aplikacja pokaże opis wybranego ruchu wzorcowego.") + "</p>")
    );
  }
  function saveTechniqueFields(ex) {
    const techniqueId = val('custom-technique');
    const instructions = val('custom-instructions').trim();
    if (techniqueId) ex.techniqueId = techniqueId;
    else delete ex.techniqueId;
    if (instructions) ex.instructions = instructions;
    else delete ex.instructions;
  }
  function editCustomMeta(id) {
    const e = A.exercise(id);
    if (!e || builtInIds.has(id)) return;
    sheet(
      L.t("Dane własnego ćwiczenia"),
      '<form id="custom-meta-form" data-id="' +
        esc(id) +
        '">' +
        field(L.t("Nazwa angielska"), input('custom-en', e.nameEn || '', 'text', 'maxlength="100"')) +
        techniqueFields(e) +
        muscleFields(e.muscles || {}) +
        ("<div class=\"actionbar\"><button class=\"solidbtn\">" + L.t("Zapisz") + "</button></div></form>")
    );
  }
  function custom() {
    sheet(
      L.t("Własne ćwiczenie"),
      `<form id="custom-form">${field(L.t("Nazwa"), input('custom-name', '', 'text', ("required maxlength=\"100\" placeholder=\"" + L.t("np. Wiosłowanie jednorącz") + "\"")))}${field(L.t("Nazwa angielska (opcjonalnie)"), input('custom-en', '', 'text', 'maxlength="100"'))}${field(L.t("Sprzęt"), select('custom-type', kinds, 'machine'))}${field(L.t("Ćwiczenie o tym samym ruchu"), select('custom-related', exerciseOptions(), '', L.t("Osobny wzorzec ruchu")))}${field(L.t("Partia mięśniowa"), input('custom-group', '', 'text', ("maxlength=\"80\" placeholder=\"" + L.t("np. Plecy") + "\"")))}${techniqueFields()}${muscleFields()}<div class="actionbar"><button class="solidbtn">${L.t("Zapisz ćwiczenie")}</button></div></form>`
    );
  }
  function gyms() {
    const g = chosenGym(A.gymId),
      eq = state().equipment.filter((p) => p.gymId === g);
    page.innerHTML =
      top(
        L.t("Moje siłownie"),
        L.t("Każde stanowisko ma własną historię i skok obciążenia."),
        action('addgym', L.t("Dodaj siłownię"))
      ) +
      `<section class="panel block"><h2>${L.t("Aktywna siłownia")}</h2>${field(L.t("Lokalizacja"), select('gym-manage', availableGyms(), g))}</section><div class="sectionhead"><h2>${L.t("Stanowiska")}</h2>${action('addeq', L.t("Dodaj sprzęt"))}</div><section class="panel list">${eq.length ? eq.map((p) => `<button class="listrow" data-r="editeq" data-id="${esc(p.id)}"><span class="tile lilac">${icon('bar', 21)}</span><span class="rowtext"><b>${esc(stationName(p))}</b><small>${esc(exerciseName(p.exerciseId))} ${L.t("· skok")} ${num(p.step)} kg</small></span>${icon('edit', 15)}</button>`).join('') : `<div class="emptyline">${icon('gyms')}<span>${L.t("Dodaj maszynę lub zapisz na niej pierwszą serię.")}</span></div>`}</section>`;
  }
  function equipmentForm(id) {
    const p = state().equipment.find((p) => p.id === id);
    sheet(
      p ? L.t("Edytuj stanowisko") : L.t("Dodaj stanowisko"),
      `<p>${esc(A.gymName(A.gymId))}</p><form id="equipment-form" data-id="${esc(id || '')}">${p ? `<div class="subcap">${esc(exerciseName(p.exerciseId))}</div>` : field(L.t("Ćwiczenie"), select('eq-ex', exerciseOptions(), currentExercise()?.id))}${field(L.t("Nazwa stanowiska"), input('eq-name', p?.name || '', 'text', ("required maxlength=\"100\" placeholder=\"" + L.t("np. Wyciąg przy oknie") + "\"")))}${field(L.t("Skok obciążenia (kg)"), input('eq-step', p?.step ?? num(2.5), 'text', 'required inputmode="decimal"'))}${field(L.t("Pierwsze dostępne obciążenie (kg)"), input('eq-min', p?.minWeight ?? 0, 'text', 'required inputmode="decimal"'))}<div class="actionbar"><button class="solidbtn">${L.t("Zapisz stanowisko")}</button></div></form>`
    );
  }
  function settings() {
    const updateActions = window.AndroidUpdates?.check
      ? `<section class="panel block"><h2>${L.t("Aktualizacje aplikacji")}</h2><div class="actionbar">${action('checkUpdate', L.t("Sprawdź aktualizacje"), 'download')}${window.AndroidUpdates.configure ? action('updateChannel', L.t("Kanał aktualizacji"), 'settings') : ''}</div></section>`
      : '';
    page.innerHTML =
      top(L.t("Kopia zapasowa"), L.t("Twoje dane treningowe są przechowywane na tym urządzeniu.")) +
      `<section class="panel block"><h2>${L.t("Zapis do pliku")}</h2><p>${L.t("Kopia JSON zawiera plany, siłownie, stanowiska, historię i trwający trening. Zapisz ją przed zmianą telefonu lub usunięciem aplikacji.")}</p><div class="actionbar">${action('export', L.t("Zapisz kopię"), 'download', 'solidbtn')}</div></section><section class="panel block"><h2>${L.t("Przywracanie")}</h2><p>${L.t("Wybierz wcześniej zapisaną kopię. Przed zatwierdzeniem zobaczysz, ile zawiera treningów i planów.")}</p><div class="actionbar">${action('import', L.t("Wybierz plik kopii"), 'upload')}</div></section>`;
    if (updateActions) page.insertAdjacentHTML('beforeend', updateActions);
  }
  function more() {
    page.innerHTML =
      top(L.t("Więcej")) +
      `<div class="panel list"><button class="listrow" data-r="language"><span class="tile sky">${icon('settings', 20)}</span><span class="rowtext"><b>${L.t("Język aplikacji")}</b><small>${state().language === 'en' ? 'English' : 'Polski'}</small></span>${icon('right', 15)}</button>${[
        ['calendar', L.t("Kalendarz treningów")],
        ['history', L.t("Historia treningów")],
        ['measurements', L.t("Pomiary ciała")],
        ['calc', L.t("Przelicznik maszyn")],
        ['catalogue', L.t("Baza ćwiczeń")],
        ['gyms', L.t("Moje siłownie")],
        ['settings', L.t("Kopia zapasowa")]
      ]
        .map(
          ([v, label]) =>
            `<button class="listrow" data-r="go" data-v="${v}"><span class="tile ${v === 'calc' ? 'lilac' : 'lime'}">${icon(v, 20)}</span><span class="rowtext"><b>${label}</b></span>${icon('right', 16)}</button>`
        )
        .join('')}</div>`;
    if (window.AndroidUpdates?.check) {
      page.querySelector('.list').insertAdjacentHTML(
        'beforeend',
        `<button class="listrow" data-r="checkUpdate"><span class="tile sky">${icon('download', 20)}</span><span class="rowtext"><b>${L.t("Sprawdź aktualizacje")}</b></span>${icon('right', 15)}</button>`
      );
    }
  }
  function exportBackup() {
    let raw;
    if (A.bootError) {
      try {
        raw = localStorage.getItem(A.key);
      } catch {}
      if (!raw) {
        toast(L.t("Nie udało się odczytać zapisu."));
        return;
      }
    } else raw = JSON.stringify(state(), null, 2);
    if (window.AndroidBackup?.save) {
      window.AndroidBackup.save(raw);
      return;
    }
    const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' })),
      anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `BebechDestroyer-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 15000);
  }
  window.receiveBackup = function (raw) {
    try {
      const data = JSON.parse(raw);
      if (!M.validateState(data) || !data.gyms.length) throw Error();
      pendingBackup = data;
      sheet(
        L.t("Przywrócić dane?"),
        `<p>${L.t("Wybrany plik zawiera")} ${count(data.sessions.length, L.t("trening"), L.t("treningi"), L.t("treningów"))}, ${count(data.plans.length, 'plan', L.t("plany"), L.t("planów"))} i ${count(data.gyms.length, L.t("siłownię"), L.t("siłownie"), L.t("siłowni"))}. Przywrócenie zastąpi bieżący dziennik${state().active ? L.t(", w tym trwający trening") : ''}.</p><div class="actionbar">${action('restore', L.t("Przywróć kopię"), 'check', 'solidbtn')}${action('close', L.t("Anuluj"), 'close')}</div>`
      );
    } catch {
      pendingBackup = null;
      toast(L.t("Nieprawidłowy plik kopii. Bieżące dane są bez zmian."));
    }
  };
  document.querySelector('#backup-file').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try {
      window.receiveBackup(await f.text());
    } catch {
      toast(L.t("Nie udało się odczytać pliku."));
    }
  });
  document.addEventListener('change', (e) => {
    const el = e.target;
    switch (el.id) {
      case 'calc-gym':
        calcGym = el.value;
        calcEq = '';
        calc();
        break;
      case 'calc-ex':
        calcEx = el.value;
        calcEq = '';
        calc();
        break;
      case 'calc-eq':
        calcEq = el.value;
        calc();
        break;
      case 'calc-reps':
        calcReps = el.value;
        calc();
        break;
      case 'measure-kind':
        measureKind = el.value;
        measurements();
        break;
      case 'measure-new-kind': {
        const label = document.getElementById('measure-value').parentNode.firstChild;
        label.textContent = L.t("Wartość (") + measureKinds[el.value].unit + ')';
        break;
      }
      case 'demo-kg':
        simulate = Number(el.value);
        demo();
        break;
      case 'manual-eq':
        document.getElementById('manual-new').hidden = el.value !== '__new';
        break;
      case 'prog-gym':
        progressGym = el.value;
        progressEq = '';
        localProgress();
        break;
      case 'prog-eq':
        progressEq = el.value;
        localProgress();
        break;
      case 'prog-metric':
        metric = el.value;
        localProgress();
        break;
      case 'ex-group':
        filterGroup = el.value;
        catalogLimit = 16;
        document.getElementById('ex-rows').innerHTML = exRows();
        break;
      case 'gym-manage':
        A.switchGym(el.value);
        break;
      case 'custom-related': {
        const x = A.exercise(el.value);
        if (x) document.getElementById('custom-group').value = x.group;
        break;
      }
    }
  });
  document.addEventListener('input', (e) => {
    if (e.target.id === 'ex-query') {
      query = e.target.value;
      catalogLimit = 16;
      document.getElementById('ex-rows').innerHTML = exRows();
    }
  });
  document.addEventListener('submit', (e) => {
    const f = e.target;
    if (f.id === 'custom-meta-form') {
      e.preventDefault();
      const ex = A.exercise(f.dataset.id);
      if (!ex || builtInIds.has(ex.id)) return;
      const muscles = readMuscles();
      if (muscles && !muscles.primary.length) {
        toast(L.t("Wskaż przynajmniej jeden główny mięsień."));
        return;
      }
      ex.nameEn = val('custom-en').trim();
      saveTechniqueFields(ex);
      if (muscles) ex.muscles = muscles;
      else delete ex.muscles;
      A.save();
      closeSheet();
      A.render();
      return;
    }
    if (!['manual-form', 'equipment-form', 'gym-form', 'custom-form', 'measure-form'].includes(f.id)) return;
    e.preventDefault();
    if (f.id === 'measure-form') {
      saveMeasure(f);
      return;
    }
    if (f.id === 'manual-form') {
      manualSubmit();
      return;
    }
    if (f.id === 'gym-form') {
      const name = val('gym-name').trim();
      if (!name) return;
      if (state().gyms.some((g) => g.name.toLocaleLowerCase(L.locale) === name.toLocaleLowerCase(L.locale))) {
        toast(L.t("Taka siłownia już istnieje."));
        return;
      }
      const id = M.uid();
      state().gyms.push({ id, name });
      A.switchGym(id);
      return;
    }
    if (f.id === 'equipment-form') {
      const edit = state().equipment.find((p) => p.id === f.dataset.id),
        exId = edit?.exerciseId || val('eq-ex'),
        name = val('eq-name').trim(),
        step = number('eq-step'),
        min = number('eq-min');
      if (!name || !(step >= 0.0001 && step <= 1000) || min === null || min < 0 || min > 10000) {
        toast(L.t("Sprawdź nazwę, skok i pierwsze obciążenie."));
        return;
      }
      const duplicate = M.getEquipment(state(), A.gymId, exId).some(
        (p) => p.id !== edit?.id && p.name.toLocaleLowerCase(L.locale) === name.toLocaleLowerCase(L.locale)
      );
      if (duplicate) {
        toast(L.t("Stanowisko o tej nazwie już istnieje."));
        return;
      }
      const p = edit || M.ensureEquipment(state(), A.gymId, exId, name, step);
      Object.assign(p, { name, step, minWeight: min });
      A.save();
      closeSheet();
      gyms();
      return;
    }
    const related = A.exercise(val('custom-related')),
      name = val('custom-name').trim(),
      group = val('custom-group').trim() || related?.group;
    if (!name || !group) {
      toast(L.t("Podaj nazwę i partię mięśniową."));
      return;
    }
    const id = M.uid();
    const muscles = readMuscles();
    if ((muscles && !muscles.primary.length) || (!muscles && !related)) {
      toast(L.t("Wybierz podobne ćwiczenie lub wskaż główny mięsień w ustawieniach zaangażowania."));
      return;
    }
    const customExercise = {
      id,
      name,
      nameEn: val('custom-en').trim(),
      group,
      pattern: related?.pattern || id,
      type: val('custom-type'),
      ...(muscles ? { muscles } : {})
    };
    saveTechniqueFields(customExercise);
    state().exercises.push(customExercise);
    A.save();
    query = name;
    filterGroup = '';
    closeSheet();
    catalogue();
    toast(L.t("Zapisano własne ćwiczenie."));
  });
  window.RozstawScreens = {
    gymChanged(id) {
      calcGym = progressGym = id;
      progressEq = calcEq = '';
    },
    render(v) {
      (
        ({
          calc,
          catalogue,
          exercise: window.ProgressUI.exercisePage,
          progress: window.ProgressUI.dashboard,
          localProgress,
          measurements,
          gyms,
          settings,
          more
        })[v] || more
      )();
    },
    action(r, id) {
      switch (r) {
        case 'editmeasure':
          measureForm(id);
          break;
        case 'addmeasure':
          measureForm();
          break;
        case 'showmeasures':
          A.go('measurements');
          break;
        case 'example':
          demo();
          break;
        case 'manual':
          manual();
          break;
        case 'custom':
          custom();
          break;
        case 'musclepage':
          A.go('exercise', { id, section: 'muscles' });
          break;
        case 'moreExercises':
          catalogLimit += 24;
          document.getElementById('ex-rows').innerHTML = exRows();
          break;
        case 'exdetail':
          exdetail(id);
          break;
        case 'editCustomMeta':
          editCustomMeta(id);
          break;
        case 'language':
          language();
          break;
        case 'checkUpdate':
          window.AndroidUpdates?.check();
          break;
        case 'updateChannel':
          window.AndroidUpdates?.configure();
          break;
        case 'setLanguage':
          if (id === 'pl' || id === 'en') {
            A.setLanguage(id);
          }
          break;
        case 'raw':
          progressEx = id;
          progressEq = '';
          A.go('localProgress', { id });
          break;
        case 'exprogress':
          progressEx = id;
          progressEq = '';
          A.go('progress', { kind: 'exercise', id });
          break;
        case 'addgym':
          sheet(
            L.t("Dodaj siłownię"),
            `<form id="gym-form">${field(L.t("Nazwa siłowni"), input('gym-name', '', 'text', 'maxlength="100" required'))}<div class="actionbar"><button class="solidbtn">${L.t("Dodaj siłownię")}</button></div></form>`
          );
          break;
        case 'addeq':
          equipmentForm();
          break;
        case 'editeq':
          equipmentForm(id);
          break;
        case 'backupPage':
          A.go('settings');
          break;
        case 'export':
          exportBackup();
          break;
        case 'import':
          if (window.AndroidBackup?.open) window.AndroidBackup.open();
          else document.querySelector('#backup-file').click();
          break;
        case 'restore':
          if (pendingBackup) {
            const obj = pendingBackup;
            pendingBackup = null;
            A.restore(obj);
          }
          break;
      }
    }
  };
  A.start();
})();
