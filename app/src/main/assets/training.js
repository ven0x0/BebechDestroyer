(function () {
  'use strict';

  const paths = {
    back: '<path d="m14.5 5-7 7 7 7M8 12h13"/>',
    next: '<path d="m9 5 7 7-7 7"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    up: '<path d="m6 15 6-6 6 6"/>',
    add: '<path d="M12 5v14M5 12h14"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    play: '<path d="m7 4 13 8-13 8Z" fill="currentColor" stroke="none"/>',
    check: '<path d="m4.5 12 4.8 5L20 6.8"/>',
    list: '<path d="M8 6h13M8 12h10M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    clock: '<circle cx="12" cy="13" r="8"/><path d="M12 9v5l3 1M9 2h6"/>',
    edit: '<path d="m14 5 5 5M4 20l4.4-1 12-12a2 2 0 0 0-4-4l-12 12Z"/>',
    bin: '<path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7"/>',
    bar: '<path d="m6 18 12-12M3 12l9 9M12 3l9 9M2 16l6 6M16 2l6 6"/>',
    swap: '<path d="M3 7h16m-4-4 4 4-4 4M21 17H5m4-4-4 4 4 4"/>',
    dots: '<circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.4"/>',
    chart: '<path d="M3 4v16h18M6 15l4-5 4 2 6-7"/>',
    spark: '<path d="m13 2-8 12h6l-1 8 9-13h-6z"/>',
    copy: '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12h5"/>',
    link: '<path d="m9 15 6-6m-5 6-2 2a3.5 3.5 0 0 1-5-5l4-4a3.5 3.5 0 0 1 5 0m0 8a3.5 3.5 0 0 0 5 0l4-4a3.5 3.5 0 0 0-5-5l-2 2"/>',
    note: '<path d="M4 4h16v12l-4 4H4zM8 9h8M8 13h6"/>'
  };
  const svg = (name, size = 21) =>
    `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name] || ''}</svg>`;
  const esc = (value) =>
    String(value == null ? '' : value).replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
    );
  const number = (value) =>
    value == null || value === '' ? '–' : Number(value).toLocaleString('pl-PL', { maximumFractionDigits: 2 });
  const plural = (n, a, b, c) =>
    n === 1 ? a : n % 10 >= 2 && n % 10 <= 4 && !(n % 100 >= 12 && n % 100 <= 14) ? b : c;
  const counted = (n, a, b, c) => n + ' ' + plural(n, a, b, c);
  const exerciseCount = (n) => counted(n, 'ćwiczenie', 'ćwiczenia', 'ćwiczeń');
  const setCount = (n) => counted(n, 'seria', 'serie', 'serii');
  const typeNames = {
    machine: 'Maszyna',
    cable: 'Wyciąg',
    barbell: 'Sztanga',
    dumbbell: 'Hantle',
    bodyweight: 'Masa ciała',
    other: 'Inne'
  };
  const kindNames = { normal: 'Robocza', warmup: 'Rozgrzewkowa', drop: 'Drop set', failure: 'Do upadku' };
  const labels = { home: 'Pulpit', plans: 'Plany', plan: 'Plan', history: 'Historia' };
  const model = () => window.GymModel;
  let root,
    context,
    route,
    args,
    modal,
    draft,
    dirty = false,
    timer,
    listeners,
    lastFocus,
    muscleMode,
    pendingNavigation;
  const state = () => context.state;
  const exercise = (id) => state().exercises.find((e) => e.id === id);
  const gym = (id) => state().gyms.find((g) => g.id === id);
  const equipment = (id) => state().equipment.find((e) => e.id === id);
  const plan = (id) => state().plans.find((p) => p.id === id);
  const byId = (value, fallback) => (value && typeof value === 'object' ? value.id : value || fallback);
  const active = () => state().active;
  const selectedGym = (ctx) =>
    byId(typeof ctx.gymId === 'function' ? ctx.gymId() : ctx.gymId, ctx.state.gyms[0]?.id);
  const persist = () => context.save();
  const notify = (message) => context?.toast?.(message);
  const go = (page, params = {}) => context.go(page, params);
  const duration = (seconds) => {
    const total = Math.max(0, Math.floor(seconds || 0));
    const minutes = Math.floor(total / 60);
    if (minutes >= 60) return Math.floor(minutes / 60) + ' godz. ' + (minutes % 60) + ' min';
    return minutes ? minutes + ' min' : total + ' s';
  };
  const elapsed = (start, finish = Date.now()) => (new Date(finish) - new Date(start)) / 1000;
  const time = (ts) => new Date(ts).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  const date = (ts) =>
    new Date(ts).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
  const button = (act, label, icon, variant = 'secondary', attrs = '') =>
    `<button type="button" class="tr-btn tr-${variant}" data-action="${act}" ${attrs}>${icon ? svg(icon, 18) : ''}<span>${esc(label)}</span></button>`;
  const iconBtn = (act, label, icon, attrs = '') =>
    `<button type="button" class="tr-iconbtn" data-action="${act}" aria-label="${esc(label)}" title="${esc(label)}" ${attrs}>${svg(icon, 18)}</button>`;
  const attrId = (id) => `data-id="${esc(id)}"`;
  const backLink = (where, id) =>
    `<button type="button" class="tr-back" data-action="navigate" data-page="${where}" ${id ? attrId(id) : ''}>${svg('back', 17)}${labels[where]}</button>`;
  const planSets = (p) => p.exercises.reduce((n, e) => n + Number(e.sets || 0), 0);
  const nameOf = (id) => window.ExerciseAtlas?.name(state(), id) || exercise(id)?.name || 'Ćwiczenie';
  const rangeFields = (row) =>
    row.repsMin && row.repsMax ? { repsMin: row.repsMin, repsMax: row.repsMax } : {};
  const equipmentName = (profile, exId) =>
    profile?.name === exercise(exId)?.name ? nameOf(exId) : profile?.name;
  const openExerciseTitle = (id) =>
    `<button type="button" data-action="navigate" data-page="exercise" ${attrId(id)} class="tr-ex-link">${esc(nameOf(id))}${svg('next', 14)}</button>`;
  const sessionSets = (session) =>
    session.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0);

  function groupAt(rows, i) {
    const id = rows[i]?.supersetId;
    if (!id) return null;
    let first = i,
      last = i;
    while (first > 0 && rows[first - 1].supersetId === id) first--;
    while (last + 1 < rows.length && rows[last + 1].supersetId === id) last++;
    return first === last ? null : { first, last };
  }
  function tidyGroups(rows) {
    const used = new Set();
    for (let i = 0; i < rows.length;) {
      const id = rows[i].supersetId;
      if (!id) {
        i++;
        continue;
      }
      let end = i + 1;
      while (end < rows.length && rows[end].supersetId === id) end++;
      if (end === i + 1) delete rows[i].supersetId;
      else {
        const nextId = used.has(id) ? model().uid() : id;
        for (let n = i; n < end; n++) rows[n].supersetId = nextId;
        used.add(nextId);
      }
      i = end;
    }
  }
  function toggleGroup(rows, i) {
    if (i < 0 || i + 1 >= rows.length) return;
    const left = groupAt(rows, i),
      right = groupAt(rows, i + 1);
    if (left && rows[i].supersetId === rows[i + 1].supersetId) {
      const split = model().uid();
      for (let n = i + 1; n <= left.last; n++) rows[n].supersetId = split;
    } else {
      const id = model().uid();
      for (let n = left?.first ?? i; n <= (right?.last ?? i + 1); n++) rows[n].supersetId = id;
    }
    tidyGroups(rows);
  }
  function groupLabel(rows, i) {
    const group = groupAt(rows, i);
    return group
      ? `<span class="tr-group-label">${svg('link', 13)}Superseria · ${i - group.first + 1}/${group.last - group.first + 1}</span>`
      : '';
  }
  function groupControl(rows, i, action) {
    if (i + 1 >= rows.length) return '';
    const joined = !!rows[i].supersetId && rows[i].supersetId === rows[i + 1].supersetId;
    const text = joined ? 'Rozłącz z następnym ćwiczeniem' : 'Superseria z następnym ćwiczeniem';
    return button(
      action,
      text,
      'link',
      joined ? 'group-btn tr-linked' : 'group-btn',
      `data-row="${i}" aria-pressed="${joined}"`
    );
  }

  function recentRows(data, exId, gymId, equipId) {
    return data.sessions
      .filter((s) => s.gymId === gymId)
      .sort((a, b) => new Date(b.finishedAt) - new Date(a.finishedAt))
      .flatMap((s) =>
        s.exercises
          .filter(
            (e) =>
              e.exerciseId === exId && (!equipId || e.equipmentId === equipId) && e.sets.some((t) => t.done)
          )
          .map((row) => ({ row, session: s }))
      );
  }

  function newRow(data, gymId, entry) {
    const profiles = model().getEquipment(data, gymId, entry.exerciseId);
    const last = recentRows(data, entry.exerciseId, gymId)[0];
    const equipmentId = profiles.find((p) => p.id === last?.row.equipmentId)?.id || profiles[0]?.id || '';
    return {
      exerciseId: entry.exerciseId,
      equipmentId,
      targetReps: entry.reps || 10,
      ...rangeFields(entry),
      notes: '',
      ...(entry.supersetId ? { supersetId: entry.supersetId } : {}),
      sets: Array.from({ length: entry.sets || 3 }, () => ({
        weight: '',
        reps: entry.repsMin && entry.repsMin !== entry.repsMax ? '' : entry.reps || 10,
        done: false,
        type: 'normal'
      }))
    };
  }

  function start(ctx, planId) {
    const data = ctx.state;
    if (!data.active) {
      const chosen = data.plans.find((p) => p.id === planId);
      if (planId && !chosen) {
        ctx.toast?.('Nie znaleziono planu.');
        return;
      }
      const gymId = selectedGym(ctx);
      if (!data.gyms.some((g) => g.id === gymId)) {
        ctx.toast?.('Najpierw wybierz siłownię.');
        return;
      }
      data.active = {
        id: model().uid(),
        gymId,
        planId: chosen?.id || null,
        name: chosen?.name || 'Trening własny',
        startedAt: new Date().toISOString(),
        exercises: (chosen?.exercises || []).map((e) => newRow(data, gymId, e)),
        notes: '',
        restSeconds: 90,
        restUntil: 0
      };
      if (ctx.save() === false) {
        data.active = null;
        return;
      }
    }
    ctx.go('workout', {});
  }

  function planList() {
    const data = state();
    return `<header class="tr-section-head"><div><h1>Plany treningowe</h1><p>${counted(data.plans.length, 'zapisany plan', 'zapisane plany', 'zapisanych planów')}</p></div></header>
      <div class="tr-plan-actions">${button('new-plan', 'Utwórz plan', 'add', 'primary')}${button('import-plans', 'Importuj JSON', 'list', 'secondary')}</div>
      <div class="tr-stack">${data.plans
        .map(
          (p) => `<article class="tr-plan-card">
        <button class="tr-plan-main" type="button" data-action="open-plan" ${attrId(p.id)}><span class="tr-tile">${svg('list', 23)}</span><span><strong>${esc(p.name)}</strong><small>${exerciseCount(p.exercises.length)} · ${setCount(planSets(p))}</small></span>${svg('next', 17)}</button>
        <div class="tr-chips">${p.exercises
          .slice(0, 3)
          .map((e) => `<span>${esc(nameOf(e.exerciseId))}</span>`)
          .join('')}${p.exercises.length > 3 ? `<span>+${p.exercises.length - 3}</span>` : ''}</div>
      </article>`
        )
        .join('')}</div>
      ${!data.plans.length ? '<div class="tr-empty"><h2>Twój pierwszy plan</h2><p>Wybierz ćwiczenia i zapisz liczbę serii oraz powtórzeń.</p></div>' : ''}
      ${button('start-free', data.active ? 'Wróć do treningu' : 'Trening bez planu', 'play', 'secondary tr-full')}
      ${data.plans.length ? button('export-all-plans', 'Eksportuj moje plany', 'copy', 'plain tr-full') : ''}`;
  }

  function planView() {
    const p = plan(args.id);
    if (!p) return missing('Planu już tu nie ma.', 'plans');
    const prior = state()
      .sessions.filter((s) => s.planId === p.id)
      .sort((a, b) => new Date(b.finishedAt) - new Date(a.finishedAt))[0];
    return `${backLink('plans')}<header class="tr-section-head"><div><h1>${esc(p.name)}</h1><p>${exerciseCount(p.exercises.length)} · ${setCount(planSets(p))}</p></div>${iconBtn('plan-menu', 'Opcje planu', 'dots')}</header>
      ${p.notes ? `<p class="tr-text-note">${esc(p.notes)}</p>` : ''}
      ${button('start-plan', active() ? 'Wróć do trwającego treningu' : 'Rozpocznij trening', 'play', 'primary tr-full', attrId(p.id))}
      <div class="tr-subhead"><h2>Ćwiczenia</h2>${button('edit-plan', 'Edytuj', 'edit', 'plain', attrId(p.id))}</div>
      <div class="tr-panel tr-rows">${p.exercises.map((e, i) => `<button type="button" class="tr-info-row tr-plan-exercise" data-action="navigate" data-page="exercise" ${attrId(e.exerciseId)}><span class="tr-index">${String(i + 1).padStart(2, '0')}</span><span class="tr-ex-copy">${groupLabel(p.exercises, i)}<strong>${esc(nameOf(e.exerciseId))}</strong><small>${esc(exercise(e.exerciseId)?.group)}</small></span><b>${e.sets} × ${esc(window.Routines.label(e))}</b>${svg('next', 14)}</button>`).join('')}</div>
      ${window.ProgressUI?.planCard(state(), p.id) || ''}
      ${prior ? `<div class="tr-subhead"><h2>Ostatni trening</h2></div><button type="button" data-action="open-session" ${attrId(prior.id)} class="tr-list-button"><span class="tr-tile">${svg('clock')}</span><span><strong>${esc(date(prior.finishedAt))}</strong><small>${esc(gym(prior.gymId)?.name)} · ${setCount(sessionSets(prior))}</small></span>${svg('next', 17)}</button>` : ''}`;
  }

  function missing(message, page) {
    return `${backLink(page)}<div class="tr-empty"><p>${esc(message)}</p></div>`;
  }

  function editorView() {
    if (!draft) return missing('Planu już tu nie ma.', 'plans');
    return `<button type="button" data-action="leave-editor" class="tr-back">${svg('back', 17)}${draft.id ? 'Plan' : 'Plany'}</button>
      <header class="tr-section-head"><div><h1>${draft.id ? 'Edytuj plan' : 'Nowy plan'}</h1></div></header>
      <label class="tr-field">Nazwa planu<input maxlength="100" data-input="plan-name" value="${esc(draft.name)}" placeholder="np. Góra ciała A" required></label>
      <label class="tr-field">Notatka do planu <small>(opcjonalna)</small><textarea data-input="plan-notes" maxlength="1000" rows="2" placeholder="Na czym chcesz się skupić?">${esc(draft.notes)}</textarea></label>
      <div class="tr-subhead"><h2>Ćwiczenia</h2><small>${exerciseCount(draft.exercises.length)}</small></div>
      <div class="tr-stack">${draft.exercises
        .map(
          (e, i) => `<div class="tr-panel tr-edit-card">
        ${groupLabel(draft.exercises, i)}<div class="tr-line"><strong>${esc(nameOf(e.exerciseId))}</strong><div class="tr-tools">
          ${i > 0 ? iconBtn('move-up', 'Przesuń ćwiczenie w górę', 'up', `data-row="${i}"`) : ''}
          ${i < draft.exercises.length - 1 ? iconBtn('move-down', 'Przesuń ćwiczenie w dół', 'down', `data-row="${i}"`) : ''}
          ${iconBtn('remove-plan-row', 'Usuń ćwiczenie z planu', 'close', `data-row="${i}"`)}</div></div>
        <div class="tr-pair tr-range-edit"><label class="tr-field">Serie<input data-row="${i}" data-input="plan-sets" inputmode="numeric" value="${esc(e.sets)}"></label>
          <label class="tr-field">Powt. od<input data-row="${i}" data-input="plan-reps" inputmode="numeric" value="${esc(e.reps)}"></label>
          <label class="tr-field">Powt. do<input data-row="${i}" data-input="plan-max" inputmode="numeric" placeholder="Tyle samo" value="${esc(e.repsMax ?? '')}"></label></div>${groupControl(draft.exercises, i, 'plan-group')}</div>`
        )
        .join('')}</div>
      ${button('pick-plan', 'Dodaj ćwiczenie', 'add', 'secondary tr-full')}${button('save-plan', 'Zapisz plan', 'check', 'primary tr-full')}`;
  }

  function previous(row) {
    const last = recentRows(state(), row.exerciseId, active().gymId, row.equipmentId)[0];
    if (!last) return null;
    return {
      when: date(last.session.finishedAt),
      sets: last.row.sets.filter((s) => s.done && s.type !== 'warmup')
    };
  }

  function recommendation(row) {
    const pending = row.sets.find((s) => !s.done && s.type !== 'warmup');
    if (!pending) return null;
    const reps = model().parseNumber(pending.reps) || row.targetReps || 10;
    return model().recommend(state(), {
      exerciseId: row.exerciseId,
      equipmentId: row.equipmentId,
      gymId: active().gymId,
      reps
    });
  }

  function recBlock(row, index) {
    const rec = recommendation(row);
    if (!rec) return '';
    const known = Number.isFinite(rec.weight);
    const confidence = {
      none: '',
      low: 'mało danych',
      medium: 'umiarkowana pewność',
      high: 'wysoka pewność'
    }[rec.confidence];
    return `<div class="tr-rec ${known ? '' : 'tr-rec-empty'}"><span class="tr-rec-icon">${svg('spark', 16)}</span><div><strong>${known ? (rec.source === 'transfer' ? 'Przeliczenie między maszynami' : 'Sugerowany ciężar') : 'Podpowiedź ciężaru'}${known ? ' · ' + number(rec.weight) + ' kg' : ''}</strong><small>${esc(rec.reason)}${known && confidence ? ' · ' + esc(confidence) : ''}</small></div>${known ? `<button type="button" data-action="apply-rec" data-row="${index}" class="tr-small-link">Wpisz</button>` : ''}</div>`;
  }

  function setRow(set, rowIndex, i, bodyweight, targetLabel) {
    const key = `data-row="${rowIndex}" data-set="${i}"`;
    const tag =
      { normal: String(i + 1), warmup: 'R', drop: 'D', failure: 'F' }[set.type || 'normal'] || String(i + 1);
    return `<div class="tr-set ${set.done ? 'tr-done' : ''}"><button type="button" class="tr-set-num" data-action="set-options" ${key} aria-label="Opcje serii ${i + 1}, ${esc(kindNames[set.type || 'normal'])}">${tag}</button>
      <input type="text" inputmode="decimal" autocomplete="off" data-input="weight" ${key} aria-label="Ciężar w kilogramach, seria ${i + 1}" value="${esc(set.weight)}" placeholder="${bodyweight ? '0' : '–'}"${set.done ? ' readonly' : ''}>
      <input type="text" inputmode="numeric" autocomplete="off" data-input="reps" ${key} aria-label="Wykonane powtórzenia, seria ${i + 1}" value="${esc(set.reps)}" placeholder="${esc(targetLabel || '–')}"${set.done ? ' readonly' : ''}>
      <button type="button" class="tr-mark" data-action="toggle-set" ${key} aria-label="${set.done ? 'Odznacz' : 'Zalicz'} serię ${i + 1}" aria-pressed="${!!set.done}">${svg('check', 18)}</button></div>`;
  }

  function exerciseCard(row, index) {
    const ex = exercise(row.exerciseId);
    const last = previous(row);
    return `<article class="tr-work-card" data-exercise-card="${index}">${groupLabel(active().exercises, index)}
      <div class="tr-ex-head"><div><small>${esc(ex?.group)}</small><h2>${openExerciseTitle(row.exerciseId)}</h2></div>${iconBtn('exercise-menu', 'Opcje ćwiczenia', 'dots', `data-row="${index}"`)}</div>
      <div class="tr-ex-links"><button type="button" class="tr-equipment" data-action="equipment" data-row="${index}">${svg('pin', 14)}${esc(equipmentName(equipment(row.equipmentId), row.exerciseId) || 'Wybierz sprzęt')}${svg('down', 12)}</button>
      <button type="button" class="tr-guide-link" data-action="exercise-section" data-section="technique" ${attrId(row.exerciseId)}>${svg('play', 12)}Technika</button>
      <button type="button" class="tr-guide-link" data-action="exercise-section" data-section="muscles" ${attrId(row.exerciseId)}>Mięśnie</button></div>
      ${row.repsMin ? `<p class="tr-goal">Cel serii <b>${esc(window.Routines.label(row))} powt.</b></p>` : ''}
      ${recBlock(row, index)}
      ${last?.sets.length ? `<p class="tr-previous">Ostatnio tutaj · ${esc(last.when)}<br><b>${last.sets.map((s) => number(s.weight) + ' kg × ' + number(s.reps)).join('  /  ')}</b></p>` : ''}
      <div class="tr-sets"><div class="tr-set tr-set-head"><span>Seria</span><span>${ex?.type === 'bodyweight' ? '+ kg' : 'kg'}</span><span>Powt.</span><span>${svg('check', 14)}</span></div>
      ${row.sets.map((s, i) => setRow(s, index, i, ex?.type === 'bodyweight', row.repsMin && window.Routines.label(row))).join('')}</div>
      <div class="tr-card-actions">${button('add-set', 'Dodaj serię', 'add', 'plain', `data-row="${index}"`)}${button('pick-swap', 'Zamień', 'swap', 'plain', `data-row="${index}"`)}</div>
      ${row.notes ? `<p class="tr-text-note tr-note-in-card">${svg('note', 15)}${esc(row.notes)}</p>` : ''}</article>`;
  }

  function workoutView() {
    const w = active();
    if (!w)
      return `${backLink('home')}<header class="tr-section-head"><h1>Trening</h1></header><div class="tr-empty"><p>Rozpocznij sesję od wybranego planu lub dobierz ćwiczenia w trakcie.</p></div>${button('start-free', 'Trening bez planu', 'play', 'primary tr-full')}${button('navigate', 'Wybierz plan', 'list', 'secondary tr-full', 'data-page="plans"')}`;
    const totals = window.WorkoutLive.volumeReadout(window.GymAnalytics.sessionSummary(state(), w));
    return `<header class="tr-section-head"><div><span class="tr-live"><i></i>Trening w toku</span><h1>${esc(w.name)}</h1><p>${svg('pin', 14)}${esc(gym(w.gymId)?.name || 'Siłownia')}</p></div>${iconBtn('workout-menu', 'Opcje treningu', 'dots')}</header>
      <section class="tr-live-metrics" aria-label="Podsumowanie trwającego treningu">
        <div><small>Czas</small><strong data-elapsed role="timer">${window.WorkoutLive.clock(elapsed(w.startedAt))}</strong></div>
        <div><small>Objętość norm.</small><strong><span data-live-volume>${totals.amount}</span> <em>kg</em></strong></div>
        <div><small>Serie robocze</small><strong data-live-sets>${totals.workingSets}</strong></div>
        ${totals.note ? `<p class="tr-live-metric-note">${esc(totals.note)}</p>` : ''}
      </section>
      <div class="tr-rest"><span class="tr-tile">${svg('clock', 21)}</span><button type="button" data-action="timer-menu"><strong>Przerwa</strong><small data-rest-info></small></button><button type="button" class="tr-rest-toggle" data-action="toggle-timer" data-rest-button></button></div>
      ${window.WorkoutLive.musclePanel(state(), w, muscleMode)}
      <div class="tr-stack">${w.exercises.map(exerciseCard).join('')}</div>
      ${button('pick-workout', 'Dodaj ćwiczenie', 'add', 'secondary tr-full')}
      ${button('finish', 'Zakończ trening', 'check', 'primary tr-full')}`;
  }

  function historyView() {
    const session = state().sessions.find((s) => s.id === args.id);
    if (!session) return missing('Nie znaleziono treningu.', 'history');
    const sets = session.exercises.flatMap((e) => e.sets.filter((s) => s.done));
    const totals = window.WorkoutLive.volumeReadout(window.GymAnalytics.sessionSummary(state(), session));
    const previous = args.fromCalendar
      ? `<button class="tr-back" type="button" data-action="return-calendar">${svg('back', 17)}Kalendarz</button>`
      : backLink('history');
    return `${previous}<header class="tr-section-head"><div>${args.summary ? `<span class="tr-live">${svg('check', 14)}Trening zapisany</span>` : ''}<h1>${esc(session.name)}</h1><p>${esc(date(session.startedAt))} · ${time(session.startedAt)}</p></div>${iconBtn('history-menu', 'Opcje zapisanego treningu', 'dots')}</header>
      <div class="tr-location">${svg('pin', 16)}${esc(gym(session.gymId)?.name || 'Siłownia')}</div>
      <div class="tr-stats"><div><small>Czas</small><strong>${duration(elapsed(session.startedAt, session.finishedAt))}</strong></div><div><small>Serie</small><strong>${sets.length}</strong></div><div><small>Objętość norm.</small><strong>${totals.amount} <em>kg</em></strong></div></div>
      ${totals.note ? `<p class="tr-summary-note">${esc(totals.note)}</p>` : ''}
      ${session.notes ? `<p class="tr-text-note">${esc(session.notes)}</p>` : ''}
      <div class="tr-subhead"><h2>Ćwiczenia</h2></div><div class="tr-stack">${session.exercises
        .map(
          (
            row,
            i
          ) => `<article class="tr-work-card">${groupLabel(session.exercises, i)}<div class="tr-ex-head"><div><small>${esc(exercise(row.exerciseId)?.group)}</small><h2>${openExerciseTitle(row.exerciseId)}</h2></div></div><p class="tr-hist-machine">${esc(equipmentName(equipment(row.equipmentId), row.exerciseId) || gym(session.gymId)?.name)}</p>
        ${row.sets
          .filter((s) => s.done)
          .map(
            (s, i) =>
              `<div class="tr-hist-set"><span>${s.type && s.type !== 'normal' ? esc(kindNames[s.type] || 'Seria') : 'Seria'} ${i + 1}</span><strong>${number(s.weight)} kg × ${number(s.reps)}</strong>${s.rir != null && s.rir !== '' ? `<small>RIR ${esc(s.rir)}</small>` : ''}</div>`
          )
          .join('')}
        ${row.notes ? `<p class="tr-text-note">${esc(row.notes)}</p>` : ''}</article>`
        )
        .join('')}</div>`;
  }

  const option = (action, title, description, icon, attrs = '', danger = false) =>
    `<button type="button" class="tr-option${danger ? ' tr-danger' : ''}" data-action="${action}" ${attrs}>${svg(icon, 20)}<span><strong>${esc(title)}</strong>${description ? `<small>${esc(description)}</small>` : ''}</span>${svg('next', 15)}</button>`;
  const normalize = (text) =>
    String(text || '')
      .toLocaleLowerCase('pl')
      .replace(/ł/g, 'l')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  const errorMessage = (message) => {
    const inline = root.querySelector('[data-error]');
    if (inline) inline.textContent = message;
    else notify(message);
  };

  function pickerData() {
    const w = active();
    const row = modal.mode === 'swap' && w?.exercises[modal.row];
    const list =
      row && !modal.all ? model().substitutes(state(), row.exerciseId, w.gymId) : state().exercises;
    const query = normalize(modal.query);
    return list.filter(
      (ex) =>
        (!row || ex.id !== row.exerciseId) &&
        (!query ||
          normalize(
            [...window.Routines.aliases(state(), ex), ex.group, typeNames[ex.type]].join(' ')
          ).includes(query))
    );
  }

  function pickerList() {
    const result = pickerData();
    const currentGym = active()?.gymId || selectedGym(context);
    return (
      result
        .map((ex) => {
          const registered = model().getEquipment(state(), currentGym, ex.id).length;
          return `<button class="tr-picker-option" type="button" data-action="choose-exercise" ${attrId(ex.id)}><span><strong>${esc(nameOf(ex.id))}</strong><small>${esc(ex.group)} · ${esc(typeNames[ex.type] || ex.type)}${registered ? ' · sprzęt zapisany tutaj' : ''}</small></span>${svg('add', 18)}</button>`;
        })
        .join('') || '<p class="tr-modal-hint">Brak pasujących ćwiczeń.</p>'
    );
  }

  function sheetContent() {
    const w = active();
    const row = w?.exercises[modal.row];
    const p = plan(args.id);
    const set = row?.sets[modal.set];
    switch (modal.kind) {
      case 'picker': {
        const swap = modal.mode === 'swap';
        const info = swap
          ? row.sets.some((s) => s.done)
            ? 'Zaliczone serie zostaną przy pierwotnym ćwiczeniu. Kolejne zapiszesz pod wybranym zamiennikiem.'
            : 'Zamienniki wykorzystują podobny ruch. Każde ćwiczenie ma własną historię ciężarów.'
          : '';
        return [
          swap ? 'Zamień ćwiczenie' : 'Dodaj ćwiczenie',
          `${info ? `<p class="tr-modal-hint">${info}</p>` : ''}
          ${swap ? `<div class="tr-segments"><button type="button" data-action="picker-related" aria-pressed="${!modal.all}">Podobny ruch</button><button type="button" data-action="picker-all" aria-pressed="${!!modal.all}">Wszystkie</button></div>` : ''}
          <label class="tr-search">${svg('search', 18)}<input data-input="search" autocomplete="off" aria-label="Szukaj ćwiczenia" placeholder="Szukaj ćwiczenia lub partii" value="${esc(modal.query || '')}"></label>
          <div class="tr-picker" data-picker-list>${pickerList()}</div>`
        ];
      }
      case 'plan-menu':
        return [
          p?.name || 'Plan',
          option('edit-plan', 'Edytuj plan', '', 'edit', attrId(p.id)) +
            option('copy-plan', 'Powiel plan', '', 'copy') +
            option('export-one-plan', 'Eksportuj plan jako JSON', '', 'copy', attrId(p.id)) +
            option('import-plans', 'Importuj plan z JSON', '', 'list') +
            option('ask-delete-plan', 'Usuń plan', 'Zapisane treningi pozostaną w historii.', 'bin', '', true)
        ];
      case 'import-plans':
        return [
          'Importuj plany',
          `<p class="tr-modal-hint">Wybierz plik lub wklej JSON z nazwą planu i ćwiczeniami. Podaj exerciseId albo polską lub angielską nazwę ćwiczenia.</p>
          <div class="tr-plan-actions">${button('plan-file-open', 'Otwórz plik', 'list')}${button('plan-example', 'Wstaw przykład', 'note')}</div>
          <input data-plan-file type="file" accept="application/json,.json" hidden>
          <label class="tr-field">Treść JSON<textarea data-value="json" class="tr-json" rows="7" spellcheck="false" autocomplete="off" placeholder='{ "name": "Trening A", "exercises": […] }'>${esc(modal.text || '')}</textarea></label>
          ${button('review-import', 'Sprawdź plan', 'next', 'primary tr-full')}`
        ];
      case 'review-import': {
        const incoming = modal.batch;
        return [
          'Sprawdź import',
          `<div class="tr-import-preview">${incoming.plans
            .map(
              (p) =>
                `<section><strong>${esc(p.name)}</strong><ol>${p.exercises
                  .map((row) => {
                    const ex =
                      exercise(row.exerciseId) ||
                      incoming.customExercises.find((e) => e.id === row.exerciseId);
                    return `<li>${esc(exercise(row.exerciseId) ? nameOf(row.exerciseId) : ex?.name)} <b>${row.sets} × ${esc(window.Routines.label(row))}</b></li>`;
                  })
                  .join('')}</ol></section>`
            )
            .join('')}</div>
          ${incoming.customExercises.length ? `<p class="tr-modal-hint">Nowe ćwiczenia w bazie: ${incoming.customExercises.map((e) => esc(e.name)).join(', ')}.</p>` : ''}
          ${button('commit-import', incoming.plans.length === 1 ? 'Dodaj do moich planów' : `Dodaj plany (${incoming.plans.length})`, 'add', 'primary tr-full')}
          ${button('edit-import', 'Edytuj JSON', 'edit', 'plain tr-full')}`
        ];
      }
      case 'export-plans':
        return [
          'Eksport planu do JSON',
          `<label class="tr-field">Treść do skopiowania<textarea data-value="json" class="tr-json" rows="8" readonly spellcheck="false">${esc(modal.text)}</textarea></label>
          <div class="tr-plan-actions">${button('plan-json-save', 'Zapisz plik', 'note', 'primary')}${button('plan-json-copy', 'Kopiuj JSON', 'copy')}</div>`
        ];
      case 'delete-plan':
        return [
          'Usunąć plan?',
          `<p class="tr-modal-hint">Plan „${esc(p.name)}” zniknie z listy. Treningi wykonane na jego podstawie pozostaną w historii.</p>${button('delete-plan', 'Usuń plan', 'bin', 'destructive tr-full')}`
        ];
      case 'leave-editor':
        return [
          'Odrzucić zmiany?',
          `<p class="tr-modal-hint">W planie są niezapisane zmiany.</p>${button('save-plan', 'Zapisz plan', 'check', 'primary tr-full')}${button('discard-editor', 'Odrzuć zmiany', '', 'secondary tr-full')}`
        ];
      case 'workout-menu':
        return [
          'Opcje treningu',
          option('session-notes', 'Nazwa i notatka', '', 'note') +
            option('timer-menu', 'Ustawienia przerwy', '', 'clock') +
            option('ask-cancel', 'Anuluj trening', 'Usuń tę niezakończoną sesję.', 'bin', '', true)
        ];
      case 'cancel':
        return [
          'Anulować trening?',
          `<p class="tr-modal-hint">Zaliczone serie z tej sesji zostaną usunięte.</p>${button('cancel-workout', 'Anuluj trening', 'bin', 'destructive tr-full')}`
        ];
      case 'session-notes':
        return [
          'Nazwa i notatka',
          `<label class="tr-field">Nazwa treningu<input data-value="title" value="${esc(w.name)}" maxlength="100"></label><label class="tr-field">Notatka<textarea rows="3" data-value="note" maxlength="2000">${esc(w.notes)}</textarea></label>${button('save-session-notes', 'Zapisz', 'check', 'primary tr-full')}`
        ];
      case 'timer':
        return [
          'Przerwa po serii',
          `<p class="tr-modal-hint">Licznik uruchamia się po zaliczeniu serii.</p><div class="tr-segments tr-wrap">${[0, 30, 60, 90, 120, 180, 300].map((s) => `<button type="button" data-action="set-timer" data-seconds="${s}" aria-pressed="${(w.restSeconds ?? 90) === s}">${s ? duration(s) + (s === 90 ? ' 30 s' : '') : 'Wyłącz'}</button>`).join('')}</div>`
        ];
      case 'exercise-menu':
        return [
          nameOf(row.exerciseId),
          option('equipment', 'Wybierz sprzęt', gym(w.gymId)?.name, 'bar') +
            option('pick-swap', 'Zamień ćwiczenie', '', 'swap') +
            groupControl(w.exercises, modal.row, 'workout-group') +
            option('exercise-notes', 'Notatka do ćwiczenia', '', 'note') +
            option('ask-remove-row', 'Usuń ćwiczenie z treningu', '', 'bin', '', true)
        ];
      case 'exercise-notes':
        return [
          'Notatka do ćwiczenia',
          `<label class="tr-field">${esc(nameOf(row.exerciseId))}<textarea rows="3" data-value="note" maxlength="1000">${esc(row.notes)}</textarea></label>${button('save-row-note', 'Zapisz', 'check', 'primary tr-full')}`
        ];
      case 'remove-row':
        return [
          'Usunąć ćwiczenie?',
          `<p class="tr-modal-hint">Usuniesz „${esc(nameOf(row.exerciseId))}” i wszystkie jego serie z tego treningu.</p>${button('remove-row', 'Usuń ćwiczenie', 'bin', 'destructive tr-full')}`
        ];
      case 'equipment': {
        const profiles = model().getEquipment(state(), w.gymId, row.exerciseId);
        return [
          'Sprzęt na tej siłowni',
          `<p class="tr-modal-hint">${esc(gym(w.gymId)?.name)} · ${esc(nameOf(row.exerciseId))}${row.sets.some((s) => s.done) ? '<br>Zaliczone serie pozostaną przypisane do dotychczasowego sprzętu.' : ''}</p>
          ${profiles.map((e) => option('choose-equipment', equipmentName(e, row.exerciseId), 'Skok ciężaru ' + number(e.step) + ' kg', e.id === row.equipmentId ? 'check' : 'bar', attrId(e.id))).join('')}
          ${button('new-equipment', 'Dodaj sprzęt', 'add', 'secondary tr-full')}`
        ];
      }
      case 'new-equipment':
        return [
          'Nowy sprzęt',
          `<label class="tr-field">Nazwa sprzętu<input data-value="equipment-name" maxlength="100" placeholder="np. Wyciąg przy oknie"></label><label class="tr-field">Skok ciężaru w kg<input data-value="equipment-step" inputmode="decimal" value="${exercise(row.exerciseId)?.type === 'dumbbell' ? 1 : '2,5'}"></label>${button('create-equipment', 'Zapisz i wybierz', 'check', 'primary tr-full')}`
        ];
      case 'set-options':
        return [
          'Seria ' + (modal.set + 1),
          `<label class="tr-field">Rodzaj serii<select data-value="type">${Object.entries(kindNames)
            .map(
              ([key, name]) =>
                `<option value="${key}" ${key === (set.type || 'normal') ? 'selected' : ''}>${name}</option>`
            )
            .join('')}</select></label>
        <label class="tr-field">Powtórzenia w zapasie (RIR)<input data-value="rir" inputmode="numeric" value="${esc(set.rir)}" placeholder="Opcjonalnie, od 0 do 10"></label>
        ${button('save-set-options', 'Zapisz', 'check', 'primary tr-full')}${button('ask-remove-set', 'Usuń serię', 'bin', 'plain tr-full')}`
        ];
      case 'remove-set':
        return [
          'Usunąć zaliczoną serię?',
          `<p class="tr-modal-hint">Seria ${modal.set + 1} · ${number(set.weight)} kg × ${number(set.reps)}</p>${button('remove-set', 'Usuń serię', 'bin', 'destructive tr-full')}`
        ];
      case 'finish': {
        const recorded = sessionSets(w);
        const pending = w.exercises.reduce((n, e) => n + e.sets.filter((s) => !s.done).length, 0);
        return [
          'Zakończyć trening?',
          `<p class="tr-modal-hint">W historii zapiszesz ${setCount(recorded)}.${pending ? ' Pominiesz ' + setCount(pending) + ' bez zaznaczenia.' : ''}</p><label class="tr-field">Notatka do treningu <small>(opcjonalna)</small><textarea rows="2" data-value="note" maxlength="2000">${esc(w.notes)}</textarea></label>${button('save-workout', 'Zapisz trening', 'check', 'primary tr-full')}`
        ];
      }
      case 'history-menu':
        return [
          'Opcje treningu',
          option('plan-from-session', 'Utwórz plan z treningu', '', 'list') +
            option('ask-delete-session', 'Usuń trening', '', 'bin', '', true)
        ];
      case 'delete-session':
        return [
          'Usunąć zapisany trening?',
          `<p class="tr-modal-hint">Trening i jego serie znikną z historii oraz z obliczeń progresu.</p>${button('delete-session', 'Usuń trening', 'bin', 'destructive tr-full')}`
        ];
      default:
        return ['', ''];
    }
  }

  function sheet() {
    if (!modal) return '';
    const [title, content] = sheetContent();
    return `<div class="tr-overlay" data-backdrop><section class="tr-dialog" role="dialog" aria-modal="true" aria-labelledby="tr-dialog-title" tabindex="-1">
      <div class="tr-sheet-head"><h2 id="tr-dialog-title">${esc(title)}</h2>${iconBtn('close-sheet', 'Zamknij okno', 'close')}</div>
      <div class="tr-sheet-content">${content}<p class="tr-error" aria-live="polite" data-error></p></div></section></div>`;
  }
  function displaySheet(next) {
    if (!modal && next) lastFocus = document.activeElement;
    if (!next) pendingNavigation = null;
    modal = next;
    const outlet = root.querySelector('[data-sheet-outlet]');
    if (!outlet) return;
    outlet.innerHTML = sheet();
    const body = root.querySelector('[data-tr-body]');
    if (body) body.inert = !!next;
    if (next) root.querySelector('.tr-dialog')?.focus({ preventScroll: true });
    else if (lastFocus?.isConnected) lastFocus.focus({ preventScroll: true });
  }
  function updateClock() {
    const w = active();
    if (route !== 'workout' || !w || !root) return;
    const elapsedNode = root.querySelector('[data-elapsed]');
    if (elapsedNode) elapsedNode.textContent = window.WorkoutLive.clock(elapsed(w.startedAt));
    const remaining = Math.max(0, Math.ceil(((w.restUntil || 0) - Date.now()) / 1000));
    const timerNode = root.querySelector('[data-rest-info]');
    if (timerNode) {
      const seconds = w.restSeconds ?? 90;
      timerNode.textContent = remaining
        ? `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`
        : w.restUntil
          ? 'Przerwa zakończona'
          : seconds
            ? `Po serii · ${seconds} s`
            : 'Licznik wyłączony';
      timerNode.classList.toggle('tr-ticking', remaining > 0);
    }
    const toggle = root.querySelector('[data-rest-button]');
    if (toggle) toggle.textContent = remaining ? 'Pomiń' : w.restSeconds === 0 ? 'Ustaw' : 'Start';
  }
  function render() {
    const views = {
      plans: planList,
      plan: planView,
      editPlan: editorView,
      workout: workoutView,
      historyDetail: historyView
    };
    if (!root || !views[route]) return;
    root.innerHTML = `<div class="tr-screen"><div data-tr-body>${views[route]()}</div><div data-sheet-outlet>${sheet()}</div></div>`;
    if (modal) root.querySelector('[data-tr-body]').inert = true;
    updateClock();
  }
  function refresh(save = true) {
    if (save) persist();
    modal = null;
    render();
  }
  const fieldValue = (name) => root.querySelector(`[data-value="${name}"]`)?.value.trim() || '';
  const dialog = (kind, extra = {}) => displaySheet({ kind, ...extra });
  function finishPlan() {
    if (!draft?.name.trim()) {
      displaySheet(null);
      root.querySelector('[data-input="plan-name"]')?.focus();
      notify('Podaj nazwę planu.');
      return;
    }
    if (!draft.exercises.length) {
      displaySheet(null);
      notify('Dodaj do planu przynajmniej jedno ćwiczenie.');
      return;
    }
    const rows = [];
    for (const [i, e] of draft.exercises.entries()) {
      const sets = model().parseNumber(e.sets);
      const range = e.repsMax != null && e.repsMax !== '';
      const goal = window.Routines.target(range ? { repsMin: e.reps, repsMax: e.repsMax } : { reps: e.reps });
      if (!Number.isInteger(sets) || sets < 1 || sets > 1000 || !goal) {
        displaySheet(null);
        root.querySelector(`[data-input="plan-sets"][data-row="${i}"]`)?.focus();
        notify('Wpisz liczby całkowite od 1 do 1000. Koniec zakresu musi być równy lub wyższy od początku.');
        return;
      }
      rows.push({
        exerciseId: e.exerciseId,
        sets,
        ...goal,
        ...(e.supersetId ? { supersetId: e.supersetId } : {})
      });
    }
    const result = { ...draft, id: draft.id || model().uid(), name: draft.name.trim(), exercises: rows };
    const before = state().plans;
    state().plans = before.some((p) => p.id === result.id)
      ? before.map((p) => (p.id === result.id ? result : p))
      : [...before, result];
    if (persist() === false) {
      state().plans = before;
      return;
    }
    dirty = false;
    notify('Plan zapisany.');
    const follow = pendingNavigation;
    pendingNavigation = null;
    if (follow) follow();
    else go('plan', { id: result.id });
  }
  function exitEditor() {
    const id = draft?.id;
    dirty = false;
    const follow = pendingNavigation;
    pendingNavigation = null;
    if (follow) follow();
    else go(id ? 'plan' : 'plans', id ? { id } : {});
  }
  function chooseExercise(exId) {
    if (!exercise(exId)) return;
    const entry = { exerciseId: exId, sets: 3, reps: 10 };
    if (modal.mode === 'plan') {
      draft.exercises.push({ ...entry, reps: 5, repsMin: 5, repsMax: 8 });
      dirty = true;
      refresh(false);
      return;
    }
    const w = active();
    if (modal.mode === 'swap') {
      const old = w.exercises[modal.row];
      const remaining = old.sets.filter((s) => !s.done);
      const done = old.sets.filter((s) => s.done);
      const params = {
        ...entry,
        ...rangeFields(old),
        supersetId: old.supersetId,
        sets: remaining.length || 1,
        reps: old.targetReps || Number(remaining[0]?.reps) || 10
      };
      const replacement = newRow(state(), w.gymId, params);
      if (remaining.length)
        replacement.sets.forEach((s, i) => {
          s.reps = remaining[i].reps || (old.repsMin ? '' : params.reps);
          s.type = remaining[i].type || 'normal';
        });
      if (done.length) {
        old.sets = done;
        w.exercises.splice(modal.row + 1, 0, replacement);
      } else w.exercises[modal.row] = replacement;
    } else w.exercises.push(newRow(state(), w.gymId, entry));
    refresh();
  }
  function chooseEquipment(i, id) {
    const w = active(),
      row = w.exercises[i],
      profile = equipment(id);
    if (!profile || profile.gymId !== w.gymId || profile.exerciseId !== row.exerciseId) return;
    if (id !== row.equipmentId) {
      const done = row.sets.filter((s) => s.done);
      const pending = row.sets.filter((s) => !s.done).map((s) => ({ ...s, weight: '' }));
      if (done.length) {
        row.sets = done;
        const split = {
          ...row,
          equipmentId: id,
          notes: '',
          sets: pending.length
            ? pending
            : [{ weight: '', reps: row.repsMin ? '' : row.targetReps || 10, type: 'normal', done: false }]
        };
        w.exercises.splice(i + 1, 0, split);
      } else {
        row.equipmentId = id;
        row.sets = pending;
      }
    }
    refresh();
  }
  function toggleSet(rowIndex, setIndex) {
    const w = active(),
      row = w.exercises[rowIndex],
      set = row.sets[setIndex];
    if (set.done) {
      set.done = false;
      delete set.prediction;
      refresh();
      return;
    }
    const rowKeys = `[data-row="${rowIndex}"][data-set="${setIndex}"]`;
    const weightField = root.querySelector('[data-input="weight"]' + rowKeys);
    const repField = root.querySelector('[data-input="reps"]' + rowKeys);
    const bodyweight = exercise(row.exerciseId)?.type === 'bodyweight';
    const weight = bodyweight && !weightField.value.trim() ? 0 : model().parseNumber(weightField.value);
    const reps = model().parseNumber(repField.value);
    if (weight == null || weight < 0 || weight > 10000) {
      weightField.focus();
      notify('Wpisz ciężar w kilogramach od 0 do 10 000.');
      return;
    }
    if (!Number.isInteger(reps) || reps < 1 || reps > 1000) {
      repField.focus();
      notify('Wpisz liczbę powtórzeń od 1 do 1000.');
      return;
    }
    // The card displays one suggestion at a time. Compare only a matching target
    // and rep count, even when the user records sets out of display order.
    const pending = row.sets.find((s) => !s.done && s.type !== 'warmup');
    const pendingReps = model().parseNumber(pending?.reps) || row.targetReps || 10;
    delete set.prediction;
    if (row.equipmentId && ['normal', 'failure'].includes(set.type || 'normal') && pendingReps === reps) {
      const prediction = window.GymAnalytics?.snapshot(recommendation(row), reps);
      if (prediction) set.prediction = prediction;
    }
    if (!row.equipmentId) row.equipmentId = model().ensureEquipment(state(), w.gymId, row.exerciseId).id;
    Object.assign(set, { weight, reps, done: true });
    const rest = w.restSeconds ?? 90;
    const group = set.type === 'warmup' ? null : groupAt(w.exercises, rowIndex);
    let next = -1;
    if (group) {
      for (let offset = 1; offset <= group.last - group.first; offset++) {
        const candidate = group.first + ((rowIndex - group.first + offset) % (group.last - group.first + 1));
        if (w.exercises[candidate].sets.some((s) => !s.done)) {
          next = candidate;
          break;
        }
      }
    }
    w.restUntil = rest > 0 && (next < 0 || next < rowIndex) ? Date.now() + rest * 1000 : 0;
    refresh();
    if (next >= 0)
      root
        .querySelector(`[data-exercise-card="${next}"]`)
        ?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
  function saveSession() {
    const w = active();
    if (!w || !sessionSets(w)) return;
    const finishedAt = new Date(Math.max(Date.now(), new Date(w.startedAt).getTime())).toISOString();
    const result = {
      id: w.id,
      gymId: w.gymId,
      planId: w.planId,
      name: w.name,
      startedAt: w.startedAt,
      finishedAt,
      notes: fieldValue('note'),
      exercises: w.exercises
        .map((row) => ({
          exerciseId: row.exerciseId,
          equipmentId: row.equipmentId,
          ...rangeFields(row),
          notes: row.notes || '',
          ...(row.supersetId ? { supersetId: row.supersetId } : {}),
          sets: row.sets
            .filter((s) => s.done)
            .map((s) => ({ ...s, weight: Number(s.weight), reps: Number(s.reps) }))
        }))
        .filter((row) => row.sets.length)
    };
    tidyGroups(result.exercises);
    state().sessions.push(result);
    state().active = null;
    if (persist() === false) {
      state().sessions.pop();
      state().active = w;
      errorMessage('Nie udało się zapisać treningu. Sesja pozostaje otwarta.');
      return;
    }
    go('historyDetail', { id: result.id, summary: true });
  }

  function handleClick(event) {
    if (event.target.hasAttribute('data-backdrop')) {
      displaySheet(null);
      return;
    }
    const target = event.target.closest('[data-action]');
    if (!target || !root.contains(target)) return;
    const action = target.dataset.action,
      id = target.dataset.id;
    const rowIndex = target.dataset.row == null ? modal?.row : Number(target.dataset.row);
    const setIndex = target.dataset.set == null ? modal?.set : Number(target.dataset.set);
    const w = active(),
      row = w?.exercises[rowIndex],
      set = row?.sets[setIndex];
    const rowArgs = { row: rowIndex, set: setIndex };
    switch (action) {
      case 'close-sheet':
        displaySheet(null);
        return;
      case 'navigate':
        go(target.dataset.page, id ? { id } : {});
        return;
      case 'exercise-section':
        go('exercise', { id, section: target.dataset.section });
        return;
      case 'return-calendar':
        window.appBack();
        return;
      case 'muscle-mode': {
        muscleMode = target.dataset.mode;
        const panel = root.querySelector('[data-live-map]');
        if (panel && w) {
          panel.outerHTML = window.WorkoutLive.musclePanel(state(), w, muscleMode);
          root
            .querySelector(`[data-action="muscle-mode"][data-mode="${muscleMode}"]`)
            ?.focus({ preventScroll: true });
        }
        return;
      }
      case 'open-plan':
        go('plan', { id });
        return;
      case 'import-plans':
        dialog('import-plans');
        return;
      case 'plan-file-open':
        if (window.AndroidBackup?.openPlan) window.AndroidBackup.openPlan();
        else root.querySelector('[data-plan-file]').click();
        return;
      case 'plan-example': {
        const field = root.querySelector('[data-value="json"]');
        field.value = window.Routines.example;
        field.focus();
        return;
      }
      case 'review-import':
        reviewImport(fieldValue('json'));
        return;
      case 'edit-import':
        dialog('import-plans', { text: modal.text });
        return;
      case 'commit-import': {
        const data = state(),
          { plans, customExercises } = modal.batch;
        const oldPlans = data.plans,
          oldExercises = data.exercises;
        data.plans = oldPlans.concat(plans);
        data.exercises = oldExercises.concat(customExercises);
        if (persist() === false) {
          data.plans = oldPlans;
          data.exercises = oldExercises;
          errorMessage('Zapis się nie powiódł. Zwolnij miejsce i spróbuj ponownie.');
          return;
        }
        if (plans.length === 1) go('plan', { id: plans[0].id });
        else go('plans');
        notify('Dodano do biblioteki.');
        return;
      }
      case 'export-one-plan':
      case 'export-all-plans': {
        const list = action === 'export-all-plans' ? state().plans : [plan(id)];
        dialog('export-plans', { text: window.Routines.write(state(), list) });
        return;
      }
      case 'plan-json-save': {
        if (window.AndroidBackup?.savePlan) {
          window.AndroidBackup.savePlan(modal.text);
          return;
        }
        const url = URL.createObjectURL(new Blob([modal.text], { type: 'application/json' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = 'BebechDestroyer-plany.json';
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 15000);
        return;
      }
      case 'plan-json-copy': {
        const field = root.querySelector('[data-value="json"]');
        field.focus();
        field.select();
        const copyFallback = () => {
          try {
            if (document.execCommand('copy')) {
              notify('Skopiowano JSON.');
              return;
            }
          } catch {}
          notify('Zaznaczono JSON. Wybierz Kopiuj w menu urządzenia.');
        };
        if (navigator.clipboard?.writeText)
          navigator.clipboard.writeText(modal.text).then(() => notify('Skopiowano JSON.'), copyFallback);
        else copyFallback();
        return;
      }
      case 'new-plan':
        go('editPlan', {});
        return;
      case 'edit-plan':
        go('editPlan', { id });
        return;
      case 'open-session':
        go('historyDetail', { id });
        return;
      case 'start-free':
        start(context);
        return;
      case 'start-plan':
        start(context, id);
        return;
      case 'plan-menu':
        dialog('plan-menu');
        return;
      case 'copy-plan': {
        const src = plan(args.id);
        const copy = {
          ...src,
          id: model().uid(),
          name: src.name.slice(0, 90) + ' (kopia)',
          exercises: src.exercises.map((e) => ({ ...e }))
        };
        state().plans.push(copy);
        persist();
        go('editPlan', { id: copy.id });
        return;
      }
      case 'ask-delete-plan':
        dialog('delete-plan');
        return;
      case 'delete-plan':
        state().plans = state().plans.filter((p) => p.id !== args.id);
        persist();
        go('plans');
        return;
      case 'leave-editor':
        if (dirty) dialog('leave-editor');
        else exitEditor();
        return;
      case 'discard-editor':
        exitEditor();
        return;
      case 'save-plan':
        finishPlan();
        return;
      case 'plan-group':
        toggleGroup(draft.exercises, rowIndex);
        dirty = true;
        refresh(false);
        return;
      case 'workout-group':
        toggleGroup(w.exercises, rowIndex);
        refresh();
        return;
      case 'pick-plan':
        dialog('picker', { mode: 'plan' });
        return;
      case 'move-up':
      case 'move-down': {
        const next = rowIndex + (action === 'move-up' ? -1 : 1);
        if (next < 0 || next >= draft.exercises.length) return;
        const [item] = draft.exercises.splice(rowIndex, 1);
        draft.exercises.splice(next, 0, item);
        tidyGroups(draft.exercises);
        dirty = true;
        refresh(false);
        return;
      }
      case 'remove-plan-row':
        draft.exercises.splice(rowIndex, 1);
        tidyGroups(draft.exercises);
        dirty = true;
        refresh(false);
        return;
      case 'choose-exercise':
        chooseExercise(id);
        return;
      case 'picker-related':
      case 'picker-all':
        displaySheet({ ...modal, all: action === 'picker-all' });
        return;
      case 'workout-menu':
        dialog('workout-menu');
        return;
      case 'session-notes':
        dialog('session-notes');
        return;
      case 'save-session-notes': {
        const title = fieldValue('title');
        if (!title) {
          errorMessage('Podaj nazwę treningu.');
          return;
        }
        w.name = title;
        w.notes = fieldValue('note');
        refresh();
        return;
      }
      case 'timer-menu':
        dialog('timer');
        return;
      case 'set-timer': {
        const seconds = Number(target.dataset.seconds);
        const running = w.restUntil > Date.now();
        w.restSeconds = seconds;
        w.restUntil = running && seconds > 0 ? Date.now() + seconds * 1000 : 0;
        refresh();
        return;
      }
      case 'toggle-timer': {
        if (w.restUntil > Date.now()) w.restUntil = 0;
        else if (w.restSeconds === 0) {
          dialog('timer');
          return;
        } else w.restUntil = Date.now() + (w.restSeconds || 90) * 1000;
        persist();
        updateClock();
        return;
      }
      case 'ask-cancel':
        dialog('cancel');
        return;
      case 'cancel-workout':
        state().active = null;
        persist();
        notify('Trening anulowany.');
        go('home');
        return;
      case 'pick-workout':
        dialog('picker', { mode: 'workout' });
        return;
      case 'pick-swap':
        dialog('picker', { mode: 'swap', row: rowIndex });
        return;
      case 'exercise-menu':
        dialog('exercise-menu', rowArgs);
        return;
      case 'exercise-notes':
        dialog('exercise-notes', rowArgs);
        return;
      case 'save-row-note':
        row.notes = fieldValue('note');
        refresh();
        return;
      case 'ask-remove-row':
        dialog('remove-row', rowArgs);
        return;
      case 'remove-row':
        w.exercises.splice(rowIndex, 1);
        tidyGroups(w.exercises);
        refresh();
        return;
      case 'equipment':
        dialog('equipment', rowArgs);
        return;
      case 'new-equipment':
        dialog('new-equipment', rowArgs);
        return;
      case 'create-equipment': {
        const name = fieldValue('equipment-name'),
          step = model().parseNumber(fieldValue('equipment-step'));
        if (!name) {
          errorMessage('Podaj nazwę sprzętu.');
          return;
        }
        if (!(step >= 0.0001 && step <= 1000)) {
          errorMessage('Podaj dodatni skok ciężaru od 0,0001 do 1000 kg.');
          return;
        }
        const chosen = model().ensureEquipment(state(), w.gymId, row.exerciseId, name, step);
        chooseEquipment(rowIndex, chosen.id);
        return;
      }
      case 'choose-equipment':
        chooseEquipment(rowIndex, id);
        return;
      case 'set-options':
        dialog('set-options', rowArgs);
        return;
      case 'save-set-options': {
        const rir = fieldValue('rir'),
          value = model().parseNumber(rir);
        if (rir && (!Number.isInteger(value) || value < 0 || value > 10)) {
          errorMessage('Podaj całkowitą wartość RIR od 0 do 10.');
          return;
        }
        set.type = fieldValue('type');
        if (rir) set.rir = value;
        else delete set.rir;
        refresh();
        return;
      }
      case 'ask-remove-set': {
        if (set.done) dialog('remove-set', rowArgs);
        else {
          row.sets.splice(setIndex, 1);
          refresh();
        }
        return;
      }
      case 'remove-set':
        row.sets.splice(setIndex, 1);
        refresh();
        return;
      case 'toggle-set':
        toggleSet(rowIndex, setIndex);
        return;
      case 'apply-rec': {
        const rec = recommendation(row);
        const next = row.sets.find((s) => !s.done && s.type !== 'warmup');
        if (next && Number.isFinite(rec?.weight)) {
          next.weight = rec.weight;
          refresh();
        }
        return;
      }
      case 'add-set': {
        const prev = row.sets[row.sets.length - 1];
        row.sets.push({
          weight: prev?.weight ?? '',
          reps: prev?.reps || (row.repsMin ? '' : row.targetReps || 10),
          done: false,
          type: 'normal'
        });
        refresh();
        return;
      }
      case 'finish': {
        if (sessionSets(w)) dialog('finish');
        else notify('Zaznacz przynajmniej jedną wykonaną serię.');
        return;
      }
      case 'save-workout':
        saveSession();
        return;
      case 'history-menu':
        dialog('history-menu');
        return;
      case 'plan-from-session': {
        const src = state().sessions.find((s) => s.id === args.id);
        const id = model().uid();
        state().plans.push({
          id,
          name: src.name.slice(0, 100),
          exercises: src.exercises.map((e) => {
            const work = e.sets.filter((s) => s.done && s.type !== 'warmup');
            return {
              exerciseId: e.exerciseId,
              sets: work.length || 1,
              reps: e.repsMin || work[0]?.reps || e.sets[0]?.reps || 10,
              ...rangeFields(e),
              ...(e.supersetId ? { supersetId: e.supersetId } : {})
            };
          })
        });
        persist();
        go('editPlan', { id });
        notify('Utworzono plan z treningu.');
        return;
      }
      case 'ask-delete-session':
        dialog('delete-session');
        return;
      case 'delete-session':
        state().sessions = state().sessions.filter((s) => s.id !== args.id);
        persist();
        go('history');
        return;
    }
  }

  function reviewImport(text) {
    try {
      const batch = window.Routines.read(text, state());
      dialog('review-import', { batch, text });
    } catch (error) {
      dialog('import-plans', { text });
      errorMessage(error.message || 'Nie udało się odczytać planu.');
    }
  }
  window.receivePlanJSON = function (text) {
    if (!root || (route !== 'plans' && route !== 'plan')) window.Rozstaw?.go('plans');
    if (root && (route === 'plans' || route === 'plan')) reviewImport(text);
  };
  async function fileChanged(event) {
    if (!event.target.matches('[data-plan-file]')) return;
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 16 * 1024 * 1024) {
      errorMessage('Wybierz plik do 16 MB.');
      return;
    }
    const request = modal;
    try {
      const text = await file.text();
      if (modal === request && request?.kind === 'import-plans') reviewImport(text);
    } catch {
      if (modal === request) errorMessage('Nie udało się odczytać pliku.');
    }
  }
  function handleInput(event) {
    const el = event.target,
      key = el.dataset.input;
    if (!key) return;
    if (key === 'search') {
      modal.query = el.value;
      root.querySelector('[data-picker-list]').innerHTML = pickerList();
      return;
    }
    if (key.startsWith('plan-')) {
      if (key === 'plan-name') draft.name = el.value;
      else if (key === 'plan-notes') draft.notes = el.value;
      else
        draft.exercises[Number(el.dataset.row)][
          { 'plan-sets': 'sets', 'plan-reps': 'reps', 'plan-max': 'repsMax' }[key]
        ] = el.value;
      dirty = true;
      return;
    }
    if (key === 'weight' || key === 'reps') {
      const row = active().exercises[Number(el.dataset.row)];
      const set = row.sets[Number(el.dataset.set)],
        n = model().parseNumber(el.value);
      if (set.done) return;
      const valid =
        key === 'weight' ? n !== null && n >= 0 && n <= 10000 : Number.isInteger(n) && n >= 1 && n <= 1000;
      // Allow intermediate keyboard input in the field, and persist only valid drafts.
      set[key] = valid ? n : '';
      persist();
      if (key === 'reps') {
        const rec = el.closest('[data-exercise-card]')?.querySelector('.tr-rec');
        if (rec) rec.outerHTML = recBlock(row, Number(el.dataset.row));
      }
    }
  }
  function back() {
    if (!root) return false;
    if (modal) {
      displaySheet(null);
      return true;
    }
    if (route === 'editPlan' && dirty) {
      dialog('leave-editor');
      return true;
    }
    return false;
  }
  function beforeNavigate(callback) {
    if (!root || route !== 'editPlan' || !dirty) return false;
    pendingNavigation = callback;
    dialog('leave-editor');
    return true;
  }
  function keys(event) {
    if (event.key === 'Escape' && modal) {
      event.preventDefault();
      event.stopImmediatePropagation();
      displaySheet(null);
      return;
    }
    if (event.key !== 'Tab' || !modal) return;
    const dlg = root.querySelector('.tr-dialog');
    const all = [...dlg.querySelectorAll('button:not([disabled]),input,select,textarea')];
    if (!all.length) return;
    if (event.shiftKey && (document.activeElement === all[0] || document.activeElement === dlg)) {
      event.preventDefault();
      all[all.length - 1].focus();
    } else if (!event.shiftKey && document.activeElement === all[all.length - 1]) {
      event.preventDefault();
      all[0].focus();
    }
  }
  function unmount() {
    if (timer) clearInterval(timer);
    if (listeners && root) {
      root.removeEventListener('click', handleClick);
      root.removeEventListener('input', handleInput);
      root.removeEventListener('change', fileChanged);
      document.removeEventListener('keydown', keys, true);
    }
    root = null;
    context = null;
    modal = null;
    draft = null;
    dirty = false;
    timer = null;
    listeners = false;
    lastFocus = null;
    pendingNavigation = null;
    muscleMode = null;
  }
  function mount(view, container, ctx, params = {}) {
    unmount();
    root = container;
    context = ctx;
    route = view;
    args = typeof params === 'string' ? { id: params } : params || {};
    if (view === 'editPlan') {
      const src = plan(args.id);
      draft = src
        ? { ...src, exercises: src.exercises.map((e) => ({ ...e })) }
        : !args.id
          ? { name: '', notes: '', exercises: [] }
          : null;
    }
    render();
    root.addEventListener('click', handleClick);
    root.addEventListener('input', handleInput);
    root.addEventListener('change', fileChanged);
    document.addEventListener('keydown', keys, true);
    listeners = true;
    if (view === 'workout') timer = setInterval(updateClock, 1000);
  }
  window.Training = {
    mount,
    unmount,
    start,
    back,
    beforeNavigate,
    makePlan: (ctx) => ctx.go('editPlan', {})
  };
})();
