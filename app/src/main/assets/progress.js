(function progressUI() {
  'use strict';
  const A = window.Rozstaw,
    { esc, icon, num, labelDate } = A;
  const ranges = new Map(),
    metrics = new Map();
  const words = {
    machine: 'Maszyna',
    cable: 'Wyciąg',
    barbell: 'Sztanga',
    dumbbell: 'Hantle',
    bodyweight: 'Masa ciała',
    other: 'Inny sprzęt'
  };
  const exName = (s, ex) => window.ExerciseAtlas.name(s, ex);
  const format = (n) => num(Math.round(n * 10) / 10);
  const date = (ts) => labelDate(ts, { day: 'numeric', month: 'short', year: 'numeric' });
  function safeSelect(id, op, selected) {
    return `<select id="${id}">${op.map((o) => `<option value="${esc(o.id)}"${o.id === selected ? ' selected' : ''}>${esc(o.title)}</option>`).join('')}</select>`;
  }
  function rangeButtons(key) {
    return `<div class="pg-period" role="group" aria-label="Okres wykresu">${[
      ['30', '30 dni'],
      ['90', '90 dni'],
      ['all', 'Całość']
    ]
      .map(
        ([id, text]) =>
          `<button type="button" data-pg="range" data-val="${id}" aria-pressed="${(ranges.get(key) || 'all') === id}">${text}</button>`
      )
      .join('')}</div>`;
  }
  function figure(points, unit) {
    const good = points.filter((p) => Number.isFinite(p.y));
    if (!good.length)
      return `<div class="pg-empty"><span>${icon('progress', 25)}</span><p>${points.length ? 'Brak porównywalnego wyniku w tym okresie.' : 'Pierwszy zapisany wynik pojawi się tutaj.'}</p></div>`;
    const lower = Math.min(...good.map((p) => p.y)),
      upper = Math.max(...good.map((p) => p.y));
    const delta = upper - lower || Math.max(1, upper / 8);
    const step = Math.pow(10, Math.floor(Math.log10(delta / 2 || 1)));
    const gridStep = Math.max(0.1, Math.ceil(delta / 2 / step) * step);
    const lo = Math.max(0, Math.floor((lower - gridStep * 0.15) / gridStep) * gridStep),
      hi = Math.max(lo + gridStep * 2, Math.ceil((upper + gridStep * 0.15) / gridStep) * gridStep);
    const W = 540,
      H = 154,
      xStart = 55,
      xEnd = W - 12,
      top = 10,
      base = H - 14;
    const start = Number(points[0].when),
      end = Number(points.at(-1).when);
    const x = (p, i) =>
      end === start
        ? points.length === 1
          ? (xStart + xEnd) / 2
          : xStart + ((xEnd - xStart) * i) / Math.max(1, points.length - 1)
        : xStart + ((xEnd - xStart) * (Number(p.when) - start)) / (end - start);
    const y = (v) => base - ((base - top) * (v - lo)) / (hi - lo);
    const segments = [];
    let seg = [];
    const circles = [];
    points.forEach((p, i) => {
      if (!Number.isFinite(p.y)) {
        if (seg.length) segments.push(seg);
        seg = [];
        return;
      }
      const xy = [x(p, i).toFixed(1), y(p.y).toFixed(1)];
      seg.push(xy);
      circles.push(
        `<circle cx="${xy[0]}" cy="${xy[1]}" r="${points.length > 80 ? 1.7 : 3.6}"><title>${esc(date(p.when))} · ${esc(format(p.y))} ${unit}</title></circle>`
      );
    });
    if (seg.length) segments.push(seg);
    const grid = [lo, (lo + hi) / 2, hi]
      .map(
        (v) =>
          `<line x1="${xStart}" x2="${xEnd}" y1="${y(v)}" y2="${y(v)}"/><text x="${xStart - 7}" y="${y(v) + 4}" text-anchor="end">${esc(format(v))}</text>`
      )
      .join('');
    const paths = segments
      .map((s) => {
        const str = s.map((v) => v.join(',')).join(' ');
        return `<polygon points="${s[0][0]},${base} ${str} ${s.at(-1)[0]},${base}"/><polyline points="${str}"/>`;
      })
      .join('');
    return `<figure class="pg-figure"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc('Wykres. ' + date(good[0].when) + ' – ' + date(good.at(-1).when) + '. Ostatni wynik ' + format(good.at(-1).y) + ' ' + unit)}"><g class="pg-grid">${grid}</g><g class="pg-line">${paths}${circles.join('')}</g></svg><figcaption><span>${date(points[0].when)}</span><span>${date(points.at(-1).when)}</span></figcaption></figure>`;
  }
  function chartCard(s, id, kind) {
    const plan = kind === 'plan',
      key = kind + ':' + id;
    const ex = plan ? null : s.exercises.find((e) => e.id === id);
    const data = plan ? GymAnalytics.planSeries(s, id) : GymAnalytics.exerciseSeries(s, id);
    const defaultMetric =
      ex?.type !== 'bodyweight' &&
      !data.points.some((p) => Number.isFinite(p.value)) &&
      data.points.some((p) => Number.isFinite(p.maxWeight))
        ? 'maxWeight'
        : 'strength';
    const metric = plan ? 'volume' : metrics.get(key) || defaultMetric;
    const volume = metric === 'volume',
      reps = !volume && ex?.type === 'bodyweight';
    const unit = volume ? 'kg' : reps ? 'powt.' : 'kg';
    const range = ranges.get(key) || 'all';
    const since = range === 'all' ? -Infinity : Date.now() - Number(range) * 86400000;
    const points = data.points
      .filter((p) => Number(p.when) >= since)
      .map((p) => ({
        ...p,
        y: volume
          ? p.missingSets || !p.coveredSets
            ? null
            : plan
              ? p.value
              : p.volume
          : metric === 'maxWeight'
            ? p.maxWeight
            : p.value
      }));
    const good = points.filter((p) => Number.isFinite(p.y)),
      last = good.at(-1),
      max = good.length ? Math.max(...good.map((p) => p.y)) : null;
    const anchor = s.equipment.find((eq) => eq.id === data.anchorEquipmentId);
    const gym = (gymId) => s.gyms.find((g) => g.id === gymId)?.name || 'Siłownia';
    const rangesUI = rangeButtons(key);
    const rowTitle = plan
      ? 'Objętość planu'
      : volume
        ? 'Objętość ćwiczenia'
        : reps
          ? 'Najwięcej powtórzeń'
          : metric === 'maxWeight'
            ? 'Największy ciężar'
            : 'Ciężar na 10 powtórzeń';
    const tabs =
      ex?.type === 'bodyweight'
        ? [
            ['strength', 'Powtórzenia'],
            ['volume', 'Objętość']
          ]
        : [
            ['strength', 'Siła'],
            ['maxWeight', 'Ciężar'],
            ['volume', 'Objętość']
          ];
    const metricTabs = plan
      ? ''
      : `<div class="pg-pills" role="group" aria-label="Miara postępu">${tabs.map(([v, n]) => `<button data-pg="metric" data-val="${v}" aria-pressed="${metric === v}">${n}</button>`).join('')}</div>`;
    const reference = anchor
      ? ' Skala odniesienia: ' +
        esc(anchor.name === ex?.name ? exName(s, ex) : anchor.name) +
        ' · ' +
        esc(gym(anchor.gymId)) +
        '.'
      : '';
    const description = volume
      ? 'Objętość to suma iloczynów ciężaru zewnętrznego i liczby powtórzeń. Ciężar każdego ćwiczenia przeliczamy na jego własne stanowisko odniesienia.'
      : reps
        ? 'Największa liczba powtórzeń w jednej serii.'
        : (metric === 'maxWeight'
            ? 'Największy porównywalny ciężar w serii roboczej.'
            : 'Szacunek na 10 powtórzeń z najlepszej serii w zakresie 3–15 powtórzeń.') + reference;
    const gaps = points.filter((p) => !Number.isFinite(p.y)).length;
    const sessionRows = points
      .slice()
      .reverse()
      .map((p) => {
        const label = Number.isFinite(p.y)
          ? `${format(p.y)} ${unit}`
          : p.coveredSets && volume && Number.isFinite(p.volume)
            ? `${format(p.volume)} kg częściowo`
            : 'Brak przeliczenia';
        return `<button class="pg-session" data-r="historyDetail" data-id="${esc(p.id)}"><span><b>${esc(date(p.when))}</b><small>${esc(gym(p.gymId))}${volume ? ` · serie z ciężarem ${p.coveredSets}/${p.totalSets}` : ''}</small></span><strong>${esc(label)}</strong>${icon('right', 14)}</button>`;
      })
      .join('');
    return `<section class="pg-card panel" data-pg-kind="${kind}" data-pg-id="${esc(id)}"><header class="pg-card-head"><div><p class="pg-eyebrow">${icon('progress', 14)}${volume || !reps ? 'Po normalizacji' : 'Wszystkie siłownie'}</p><h2>${rowTitle}</h2></div>${metricTabs}</header><div class="pg-values"><div><small>Ostatni pełny wynik</small><strong>${last ? format(last.y) : '—'} <em>${unit}</em></strong></div><div><small>Rekord w okresie</small><b>${max == null ? '—' : format(max)} <em>${unit}</em></b></div></div>${rangesUI}${figure(points, unit)}<p class="pg-note">${description}</p>${gaps ? `<p class="pg-incomplete">${icon('info', 15)}<span>Sesje bez pełnego wyniku: ${gaps}. Szczegóły pokazują dostępne serie i częściowe sumy.</span></p>` : ''}${points.length ? `<details class="pg-log"><summary>Wyniki sesji <span>${points.length}</span></summary>${sessionRows}</details>` : ''}</section>`;
  }
  function selection(s, kind, requested) {
    const sorted = [...s.sessions].sort((a, b) => new Date(b.finishedAt) - new Date(a.finishedAt));
    if (kind === 'plan') {
      return (
        s.plans.find((p) => p.id === requested) ||
        s.plans.find((p) => p.id === sorted.find((x) => s.plans.some((y) => y.id === x.planId))?.planId) ||
        s.plans[0]
      );
    }
    const id = sorted.find((x) => x.exercises.length)?.exercises[0]?.exerciseId;
    return (
      s.exercises.find((e) => e.id === requested) || s.exercises.find((e) => e.id === id) || s.exercises[0]
    );
  }
  function dashboard() {
    const s = A.state,
      params = A.params,
      kind = params.kind === 'plan' ? 'plan' : 'exercise',
      item = selection(s, kind, params.id),
      plan = kind === 'plan';
    const options = (plan ? s.plans : s.exercises)
      .map((e) => ({ id: e.id, title: plan ? e.name : exName(s, e) }))
      .sort((a, b) => a.title.localeCompare(b.title, s.exerciseLanguage || 'pl'));
    const header = A.top('Postępy', '', A.action('showmeasures', 'Pomiary ciała', 'list'));
    const tabs = `<div class="pg-tabs" role="group" aria-label="Rodzaj postępów"><button data-pg="view" data-val="exercise" aria-pressed="${!plan}">${icon('bar', 18)}Ćwiczenia</button><button data-pg="view" data-val="plan" aria-pressed="${plan}">${icon('plans', 18)}Plany</button></div>`;
    if (!item) {
      A.page.innerHTML =
        header +
        tabs +
        `<div class="panel block"><p>${plan ? 'Dodaj plan, aby śledzić jego objętość.' : 'Dodaj pierwsze ćwiczenie w atlasie.'}</p></div>`;
      return;
    }
    const label = plan ? 'Plan treningowy' : 'Ćwiczenie';
    const itemSelect = `<label class="pg-choose"><span class="pg-tile">${icon(plan ? 'plans' : 'bar', 24)}</span><span><small>${label}</small>${safeSelect('pg-select', options, item.id)}</span>${icon('down', 16)}</label>`;
    const volume = s.sessions.filter((x) => x.planId === item.id),
      patternSets = plan
        ? 0
        : s.sessions.reduce(
            (total, se) =>
              total +
              se.exercises
                .filter((r) => A.exercise(r.exerciseId)?.pattern === item.pattern)
                .flatMap((r) => r.sets)
                .filter((t) => t.done && t.type !== 'warmup').length,
            0
          );
    const summary = plan
      ? `${A.count(volume.length, 'zapisana sesja', 'zapisane sesje', 'zapisanych sesji')} tego planu.`
      : `Serie tego wzorca ruchu, razem z zamiennikami: ${patternSets}.`;
    const detail = plan ? `data-r="plan"` : `data-r="exdetail"`;
    A.page.innerHTML =
      header +
      tabs +
      itemSelect +
      chartCard(s, item.id, kind) +
      `<div class="pg-tail"><span>${esc(summary)}</span><button class="textbtn" ${detail} data-id="${esc(item.id)}">${plan ? 'Zobacz plan' : 'Karta ćwiczenia'} ${icon('right', 14)}</button></div>`;
  }
  function exercisePage() {
    const state = A.state;
    const ex = A.exercise(A.params.id);
    if (!ex) {
      A.page.innerHTML = A.top('Ćwiczenie') + '<p>To ćwiczenie jest niedostępne.</p>';
      return;
    }
    const id = ex.id;
    const tabs = {
      overview: 'Przegląd',
      technique: 'Technika',
      muscles: 'Mięśnie',
      substitutes: 'Zamienniki'
    };
    const section = Object.hasOwn(tabs, A.params.section) ? A.params.section : 'overview';
    const language = state.exerciseLanguage === 'en' ? 'English' : 'Polski';
    const header = A.top(
      exName(state, ex),
      [ex.group, words[ex.type] || ex.type].join(' · '),
      `<button class="linebtn lang-open" data-r="language" aria-label="Język nazw ćwiczeń">${language} ${icon('down', 14)}</button>`
    );
    const navigation = `<div class="exercise-sections" role="group" aria-label="Sekcje ćwiczenia">${Object.entries(
      tabs
    )
      .map(
        ([key, label]) =>
          `<button type="button" data-pg="section" data-val="${key}" aria-pressed="${section === key}">${label}</button>`
      )
      .join('')}</div>`;
    let body;
    if (section === 'technique') {
      body = `<div class="technique-grid" id="pg-technique">${ExerciseDemos.render(state, id)}${ExerciseTechnique.render(state, id)}</div>`;
    } else if (section === 'muscles') {
      body = `<section id="pg-muscles" class="exercise-panel">${ExerciseAtlas.render(state, id)}</section>`;
    } else if (section === 'substitutes') {
      const alternatives = GymModel.substitutes(state, id, A.gymId);
      const rows = alternatives
        .map(
          (r) =>
            `<button class="listrow" data-r="exdetail" data-id="${esc(r.id)}"><span class="tile sky">${icon('bar', 18)}</span><span class="rowtext"><b>${esc(exName(state, r))}</b><small>${esc(r.group)} · ${esc(words[r.type] || r.type)}</small></span>${icon('right', 15)}</button>`
        )
        .join('');
      body = `<section class="pg-replacements standalone" id="pg-subs"><h2>Zamienniki</h2><div class="panel list">${rows || '<div class="emptyline">Brak innych ćwiczeń o tym wzorcu ruchu.</div>'}</div></section>`;
    } else {
      body = `<div class="pg-detail-grid"><div id="pg-stats">${chartCard(state, id, 'exercise')}<button class="pg-raw" data-r="raw" data-id="${esc(id)}">${icon('history', 17)} Wyniki na wybranym stanowisku ${icon('right', 15)}</button></div><div id="pg-muscles">${ExerciseAtlas.render(state, id)}</div></div>`;
    }
    const edit = ExerciseTechnique.has(id)
      ? ''
      : `<button class="pg-raw technique-edit" data-r="editCustomMeta" data-id="${esc(id)}">${icon('edit', 15)} Edytuj własne ćwiczenie</button>`;
    A.page.innerHTML =
      `<button class="pg-back" data-pg="back">${icon('left', 15)}Wróć</button>` +
      header +
      navigation +
      body +
      edit;
  }
  document.addEventListener('change', (e) => {
    if (e.target.id === 'pg-select') {
      A.go('progress', { kind: A.params.kind === 'plan' ? 'plan' : 'exercise', id: e.target.value }, true);
    }
  });
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-pg]');
    if (!btn) return;
    const act = btn.dataset.pg;
    if (act === 'view') {
      A.go('progress', { kind: btn.dataset.val }, true);
      return;
    }
    if (act === 'back') {
      window.appBack();
      return;
    }
    if (act === 'section') {
      A.go('exercise', { id: A.params.id, section: btn.dataset.val }, true);
      return;
    }
    const card = btn.closest('[data-pg-kind]');
    if (!card) return;
    const kind = card.dataset.pgKind,
      id = card.dataset.pgId,
      key = kind + ':' + id;
    if (act === 'range') ranges.set(key, btn.dataset.val);
    else if (act === 'metric') metrics.set(key, btn.dataset.val);
    else return;
    card.outerHTML = chartCard(A.state, id, kind);
  });
  window.ProgressUI = {
    dashboard,
    exercisePage,
    planCard: (s, id) => chartCard(s, id, 'plan'),
    exerciseCard: (s, id) => chartCard(s, id, 'exercise')
  };
})();
