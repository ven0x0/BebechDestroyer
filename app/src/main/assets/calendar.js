(function calendarModule(root) {
  'use strict';
  const dayFormat = new Intl.DateTimeFormat('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });
  const monthFormat = new Intl.DateTimeFormat('pl-PL', { month: 'long', year: 'numeric' });
  const clockFormat = new Intl.DateTimeFormat('pl-PL', { hour: '2-digit', minute: '2-digit' });
  const pad = (value) => String(value).padStart(2, '0');
  function localDay(value) {
    if (value == null || value === '') return '';
    const d = new Date(value);
    return Number.isNaN(+d) ? '' : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  function parseDay(value) {
    if (typeof value !== 'string' || !/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value)) return null;
    const [y, m, d] = value.split('-').map(Number);
    const date = new Date(y, m - 1, d, 12);
    return localDay(date) === value ? date : null;
  }
  function monthCells(month) {
    const first = parseDay(month + '-01');
    if (!first) return [];
    const days = new Date(first.getFullYear(), first.getMonth() + 1, 0, 12).getDate();
    const skip = (first.getDay() + 6) % 7;
    return Array.from({ length: Math.ceil((skip + days) / 7) * 7 }, (_, i) =>
      i >= skip && i < skip + days ? month + '-' + pad(i - skip + 1) : null
    );
  }
  function shiftMonth(month, delta) {
    const date = parseDay(month + '-01');
    if (!date) return null;
    date.setMonth(date.getMonth() + delta);
    const key = localDay(date).slice(0, 7);
    return parseDay(key + '-01') ? key : null;
  }
  function activity(sessions, month, exerciseId = '') {
    const days = new Map(),
      movements = new Map(),
      options = new Set(),
      totals = { sessions: 0, sets: 0, reps: 0 };
    let latest = '';
    for (const session of sessions) {
      const day = localDay(session.finishedAt);
      if (!day) continue;
      const inMonth = day.slice(0, 7) === month;
      const entries = [];
      for (const row of session.exercises) {
        const sets = row.sets.filter((s) => s.done === true);
        if (!sets.length) continue;
        options.add(row.exerciseId);
        if (inMonth) {
          const agg = movements.get(row.exerciseId) || { sets: 0, reps: 0, dates: new Set() };
          agg.sets += sets.length;
          agg.reps += sets.reduce((n, s) => n + Number(s.reps), 0);
          agg.dates.add(day);
          movements.set(row.exerciseId, agg);
        }
        if (exerciseId && row.exerciseId !== exerciseId) continue;
        if (day > latest) latest = day;
        if (inMonth) entries.push({ row, sets });
      }
      if (!entries.length) continue;
      let d = days.get(day);
      if (!d) {
        d = { sessions: [], sets: 0, reps: 0 };
        days.set(day, d);
      }
      const count = entries.reduce((n, r) => n + r.sets.length, 0);
      const reps = entries.reduce((n, r) => n + r.sets.reduce((v, s) => v + Number(s.reps), 0), 0);
      d.sessions.push({ session, entries });
      d.sets += count;
      d.reps += reps;
      totals.sessions++;
      totals.sets += count;
      totals.reps += reps;
    }
    for (const d of days.values())
      d.sessions.sort((a, b) => new Date(a.session.startedAt) - new Date(b.session.startedAt));
    return { days, movements, totals, options, latest };
  }
  function selectedDay(days, month, requested, today) {
    if (parseDay(requested) && requested.startsWith(month + '-')) return requested;
    if (days.has(today) && today.startsWith(month + '-')) return today;
    const recent = [...days.keys()].sort().at(-1);
    return recent || (today.startsWith(month + '-') ? today : month + '-01');
  }
  function normalized(s, day, filter) {
    if (!day?.sessions.length) return null;
    const ids = new Set(day.sessions.map((x) => x.session.id));
    const results = filter
      ? root.GymAnalytics.exerciseSeries(s, filter).points.filter((x) => ids.has(x.id))
      : [
          ...root.GymAnalytics.sessionSummaries(
            s,
            day.sessions.map((x) => x.session)
          ).values()
        ];
    let total = 0,
      missing = 0,
      covered = 0,
      body = 0;
    for (const stat of results) {
      total += stat.volume || 0;
      missing += stat.missingSets;
      covered += stat.coveredSets;
      body += stat.bodyweightSets || 0;
    }
    return { total, missing, covered, body };
  }
  function apply(params, focus) {
    const app = root.Rozstaw;
    Object.assign(app.params, params);
    render();
    if (focus) app.page.querySelector(focus)?.focus({ preventScroll: true });
  }
  function render() {
    const app = root.Rozstaw,
      state = app.state,
      p = app.params;
    const { esc, icon, num, count } = app;
    const today = localDay(new Date());
    const month = parseDay(p.month + '-01')
      ? p.month
      : parseDay(p.day)
        ? p.day.slice(0, 7)
        : today.slice(0, 7);
    const filter = state.exercises.some((x) => x.id === p.exerciseId) ? p.exerciseId : '';
    const activityData = activity(state.sessions, month, filter);
    const { days, movements, totals, options, latest } = activityData;
    const chosen = selectedDay(days, month, p.day, today);
    Object.assign(p, { month, day: chosen, exerciseId: filter });
    const exerciseName = (id) => root.ExerciseAtlas.name(state, id) || 'Ćwiczenie';
    const buttons = monthCells(month)
      .map((day) => {
        if (!day) return '<span class="cal-pad" aria-hidden="true"></span>';
        const n = Number(day.slice(-2)),
          group = days.get(day);
        return `<button type="button" data-cal-day="${day}" class="cal-day${group ? ' trained' : ''}${chosen === day ? ' picked' : ''}${day === today ? ' today' : ''}" aria-label="${esc(dayFormat.format(parseDay(day)))}, ${group ? count(group.sets, 'seria', 'serie', 'serii') : 'brak treningu'}" aria-pressed="${day === chosen}"${day === today ? ' aria-current="date"' : ''}><b>${n}</b><span class="cal-mark" aria-hidden="true"></span></button>`;
      })
      .join('');
    const picker = `<label class="cal-filter"><span>${icon('bar', 16)} Ćwiczenie</span><select id="cal-filter"><option value="">Wszystkie ćwiczenia</option>${[
      ...options
    ]
      .sort((a, b) => exerciseName(a).localeCompare(exerciseName(b), 'pl'))
      .map(
        (id) =>
          `<option value="${esc(id)}"${filter === id ? ' selected' : ''}>${esc(exerciseName(id))}</option>`
      )
      .join('')}</select></label>`;
    const monthTitle = monthFormat.format(parseDay(month + '-01'));
    const day = days.get(chosen),
      stats = normalized(state, day, filter);
    const setNames = { warmup: 'Rozgrzewka', failure: 'Do upadku', drop: 'Drop set' };
    const setTag = (set, bodyweight) => {
      const weight = Number(set.weight) || 0;
      const prefix =
        weight > 0 ? `${bodyweight ? '+' : ''}${num(weight)} kg × ` : bodyweight ? '' : `0 kg × `;
      return `<span class="cal-set${set.type === 'warmup' ? ' warm' : ''}">${setNames[set.type] ? `<small>${setNames[set.type]}</small>` : ''}${prefix}${esc(set.reps)}${weight === 0 && bodyweight ? ' powt.' : ''}${set.rir != null && set.rir !== '' ? ` <small>RIR ${esc(set.rir)}</small>` : ''}</span>`;
    };
    const details =
      day?.sessions
        .map(({ session, entries }) => {
          const header = `<button class="cal-session-head" data-r="historyDetail" data-id="${esc(session.id)}"><span class="tile sky">${icon('plans', 20)}</span><span><strong>${esc(session.name)}</strong><small>${clockFormat.format(new Date(session.startedAt))} · ${esc(app.gymName(session.gymId))}</small></span>${icon('right', 16)}</button>`;
          const body = entries
            .map(({ row, sets }) => {
              const eq = state.equipment.find((e) => e.id === row.equipmentId),
                ex = app.exercise(row.exerciseId);
              const equipment = eq && eq.name !== ex?.name ? ` · ${esc(eq.name)}` : '';
              return `<div class="cal-ex"><button data-r="exdetail" data-id="${esc(row.exerciseId)}">${esc(exerciseName(row.exerciseId))} ${icon('right', 12)}</button><small>${count(sets.length, 'seria', 'serie', 'serii')}${equipment}</small><div class="cal-sets">${sets.map((set) => setTag(set, ex?.type === 'bodyweight')).join('')}</div></div>`;
            })
            .join('');
          return `<article class="cal-session">${header}${body}</article>`;
        })
        .join('') ||
      `<div class="cal-empty">${icon('calendar', 24)}<p>${filter ? 'Brak zapisanych serii tego ćwiczenia.' : 'Brak zapisanego treningu w tym dniu.'}</p>${latest && latest !== chosen ? '<button class="textbtn" data-cal="latest">Ostatni dzień treningowy ' + icon('arrow', 14) + '</button>' : ''}</div>`;
    const volume = stats
      ? stats.missing && !stats.covered
        ? '—'
        : num(Math.round(stats.total * 10) / 10) + ' kg'
      : '';
    const volumeLine = stats
      ? `<div class="cal-volume"><span>${icon('stack', 15)} ${stats.missing ? 'Znana część objętości' : 'Objętość po normalizacji'}</span><b>${volume}</b></div>${stats.missing ? `<p class="cal-help">Brak przeliczenia dla ${count(stats.missing, 'serii', 'serii', 'serii')}.</p>` : ''}`
      : '';
    const ranked = [...movements].sort(
      (a, b) => b[1].sets - a[1].sets || exerciseName(a[0]).localeCompare(exerciseName(b[0]), 'pl')
    );
    const monthly = ranked.length
      ? `<details class="cal-month-log panel"><summary>Ćwiczenia w tym miesiącu <span>${ranked.length}</span></summary>${ranked.map(([id, v]) => `<button data-cal-filter="${esc(id)}"><span><b>${esc(exerciseName(id))}</b><small>${count(v.dates.size, 'dzień', 'dni', 'dni')} · ${count(v.reps, 'powtórzenie', 'powtórzenia', 'powtórzeń')}</small></span><strong>${count(v.sets, 'seria', 'serie', 'serii')}</strong>${icon('right', 14)}</button>`).join('')}</details>`
      : '';
    app.page.innerHTML =
      app.top(
        'Kalendarz treningów',
        '',
        `<button class="linebtn" data-r="go" data-v="history">${icon('list', 16)} Historia</button>`
      ) +
      `<div class="cal-layout"><section><div class="cal-month panel"><div class="cal-month-head"><label class="cal-month-label"><b>${esc(monthTitle)}</b>${icon('down', 14)}<input type="month" id="cal-month" value="${month}" aria-label="Wybierz miesiąc"></label><div class="cal-nav"><button data-cal="prev" class="iconbtn" aria-label="Poprzedni miesiąc">${icon('left', 17)}</button><button data-cal="today">Dziś</button><button data-cal="next" class="iconbtn" aria-label="Następny miesiąc">${icon('right', 17)}</button></div></div>${picker}<div class="cal-days">${['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'].map((n) => `<span class="cal-weekday">${n}</span>`).join('')}${buttons}</div><div class="cal-summary"><div><b>${totals.sessions}</b><span>Treningi</span></div><div><b>${totals.sets}</b><span>Serie</span></div><div><b>${totals.reps}</b><span>Powtórzenia</span></div></div></div>${monthly}</section><section class="cal-detail panel" id="cal-detail"><header><h2>${esc(dayFormat.format(parseDay(chosen)))}</h2>${day ? `<p>${count(day.sessions.length, 'trening', 'treningi', 'treningów')} · ${count(day.sets, 'seria', 'serie', 'serii')} · ${count(day.reps, 'powtórzenie', 'powtórzenia', 'powtórzeń')}</p>` : ''}</header>${volumeLine}${stats?.body ? '<p class="cal-help">W seriach z masą ciała do kilogramów wlicza się tylko dodatkowy ciężar.</p>' : ''}${details}</section></div>`;
    function pick(day) {
      apply({ day, month: day.slice(0, 7) }, `[data-cal-day="${day}"]`);
    }
    const container = app.page.querySelector('.cal-layout');
    container.addEventListener('click', (e) => {
      const button = e.target.closest('button');
      if (!button) return;
      if (button.dataset.calDay) {
        pick(button.dataset.calDay);
        if (root.matchMedia('(max-width:710px)').matches)
          document.getElementById('cal-detail').scrollIntoView({ block: 'nearest' });
        return;
      }
      if (button.dataset.calFilter) {
        apply({ exerciseId: button.dataset.calFilter, day: '' }, '#cal-filter');
        return;
      }
      switch (button.dataset.cal) {
        case 'today':
          pick(today);
          break;
        case 'latest':
          if (latest) pick(latest);
          break;
        case 'prev':
        case 'next': {
          const target = shiftMonth(month, button.dataset.cal === 'prev' ? -1 : 1);
          if (target) apply({ month: target, day: '' }, `[data-cal="${button.dataset.cal}"]`);
          break;
        }
      }
    });
    container.addEventListener('change', (e) => {
      if (e.target.id === 'cal-filter') apply({ exerciseId: e.target.value, day: '' }, '#cal-filter');
      if (e.target.id === 'cal-month' && parseDay(e.target.value + '-01'))
        apply({ month: e.target.value, day: '' }, '#cal-month');
    });
  }
  const api = { render, activity, localDay, monthCells, selectedDay, shiftMonth };
  root.WorkoutCalendar = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
