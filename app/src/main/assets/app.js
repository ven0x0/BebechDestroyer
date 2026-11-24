(function core() {
  'use strict';
  const L = (typeof window !== 'undefined' ? window : globalThis).GymI18n || require('./i18n.js');
  const M = window.GymModel,
    key = 'rozstaw.training.v1',
    page = document.querySelector('#content');
  const overlay = document.querySelector('#overlay'),
    historyStack = [];
  const icons = {
    home: '<rect x="3" y="3" width="7" height="8" rx="1.3"/><rect x="14" y="3" width="7" height="5" rx="1.3"/><rect x="3" y="15" width="7" height="6" rx="1.3"/><rect x="14" y="12" width="7" height="9" rx="1.3"/>',
    plans: '<path d="m3 8 9-5 9 5-9 5-9-5Zm0 5 9 5 9-5M3 17l9 5 9-5"/>',
    progress: '<path d="M3 3v17h18M6 15l4-5 4 2 6-8"/>',
    history: '<path d="M3 11a9 9 0 1 1 2 7M3 5v6h6M12 7v5l4 2"/>',
    calc: '<path d="M3 7h16m-4-4 4 4-4 4M21 17H5m4-4-4 4 4 4"/>',
    catalogue: '<path d="M3 5a3 3 0 0 1 3-2h12v16H6a3 3 0 0 0-3 2V5Zm0 15a2 2 0 0 1 3-2h13M7 7h7M7 10h4"/>',
    gyms: '<path d="M3 21h18M5 21V6l7-3 7 3v15M9 8v2m6-2v2m-6 3v2m6-2v2m-4 6v-3h2v3"/>',
    settings:
      '<path d="M4 7h7m5 0h4M4 17h3m5 0h8"/><circle cx="13" cy="7" r="2.5"/><circle cx="9.5" cy="17" r="2.5"/>',
    more: '<circle cx="4.5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19.5" cy="12" r="1.2"/>',
    pin: '<path d="M19 9c0 5-7 12-7 12S5 14 5 9a7 7 0 1 1 14 0Z"/><circle cx="12" cy="9" r="2.2"/>',
    down: '<path d="m7 10 5 5 5-5"/>',
    left: '<path d="m14 6-6 6 6 6"/>',
    right: '<path d="m9 6 6 6-6 6"/>',
    arrow: '<path d="M3 12h17m-6-6 6 6-6 6"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 10h18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    dumbbell:
      '<path d="m6 5-2 2 4 4 2-2-4-4Zm10 8-2 2 4 4 2-2-4-4ZM7.5 7.5 5 10l-2-2m13.5 8.5L19 14l2 2m-12-6 5 5"/>',
    bar: '<path d="M2 10v4m3-7v10m3-12v14m8-14v14m3-12v10m3-7v4M8 12h8"/>',
    lower: '<path d="m3 15 5-8h5l3 5 4-5M3 18h9l4-6h5M7 7l-2-2m13 14h3"/>',
    full: '<path d="M5 4v15m14-15v15M2 19h20M5 7h14M8 7v3m8-3v3M3 12h4m10 0h4"/>',
    stack: '<path d="m4 7 8-4 8 4-8 4-8-4Zm0 5 8 4 8-4M4 17l8 4 8-4"/>',
    play: '<path fill="currentColor" stroke="none" d="M6 3.7c0-.7.8-1.1 1.4-.7l13 8.3a.9.9 0 0 1 0 1.4L7.4 21c-.6.4-1.4 0-1.4-.7Z"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    check: '<path d="m4 12 5 5L20 6"/>',
    list: '<path d="M9 6h12M9 12h12M9 18h12M3 6h1m-1 6h1m-1 6h1"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
    upload: '<path d="M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5"/>',
    trophy: '<path d="M8 3h8v6a4 4 0 0 1-8 0V3Zm8 2h4v2a4 4 0 0 1-4 4M8 5H4v2a4 4 0 0 0 4 4m4 2v6m-5 2h10"/>',
    edit: '<path d="m4 16-1 5 5-1L21 7l-4-4L4 16Z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/>'
  };
  function icon(name, size = 20) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.bar}</svg>`;
  }
  function esc(value) {
    return String(value ?? '').replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
    );
  }
  function brand() {
    return `<svg width="32" height="29" viewBox="0 0 33 28" aria-hidden="true" fill="currentColor"><path d="m1 24 6-13h6L7 24zm9 0L19 5h6l-9 19zm10 0L30 2h3L24 24z"/></svg><strong>BebechDestroyer</strong>`;
  }
  let state = M.createState(),
    bootError = false;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!M.validateState(parsed)) throw Error();
      state = M.upgradeState(parsed);
    }
  } catch {
    bootError = true;
  }
  let currentGym = state.gyms.find((g) => g.id === state.uiGym)?.id || state.gyms[0].id;
  let view = 'home',
    params = {},
    weekOffset = 0,
    toastTimer,
    lastFocus = null;
  const trainViews = new Set(['plans', 'plan', 'editPlan', 'workout', 'historyDetail']);
  const titles = {
    home: L.t("Pulpit"),
    plans: L.t("Plany treningowe"),
    plan: L.t("Plan treningowy"),
    editPlan: L.t("Edytor planu"),
    workout: L.t("Aktywny trening"),
    historyDetail: L.t("Zapis treningu"),
    history: L.t("Historia"),
    calendar: L.t("Kalendarz treningów"),
    progress: L.t("Postępy"),
    exercise: L.t("Szczegóły ćwiczenia"),
    localProgress: L.t("Wyniki stanowiska"),
    measurements: L.t("Pomiary ciała"),
    calc: L.t("Przelicznik maszyn"),
    catalogue: L.t("Ćwiczenia"),
    gyms: L.t("Moje siłownie"),
    settings: L.t("Kopia zapasowa"),
    more: L.t("Więcej")
  };
  function toast(msg) {
    const el = document.querySelector('#toast');
    el.textContent = msg;
    el.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('on'), 3200);
  }
  function save() {
    if (bootError) {
      toast(L.t("Najpierw odzyskaj lub przywróć dane w Kopii zapasowej."));
      return false;
    }
    try {
      state.uiGym = currentGym;
      localStorage.setItem(key, JSON.stringify(state));
      return true;
    } catch {
      toast(L.t("Brak miejsca na zapis. Wyeksportuj kopię danych."));
      return false;
    }
  }
  function ctx() {
    return { state, save, go, gymId: currentGym, toast, icon };
  }
  function go(next, data = {}, replace = false) {
    if (window.Training?.beforeNavigate?.(() => go(next, data, replace))) return;
    if (!titles[next]) next = 'home';
    closeSheet();
    if (!replace && (view !== next || JSON.stringify(params) !== JSON.stringify(data)))
      historyStack.push({ view, params, y: window.scrollY });
    window.Training?.unmount?.();
    view = next;
    params = data || {};
    render();
    window.scrollTo(0, 0);
  }
  function appBack() {
    if (!overlay.hidden) {
      closeSheet();
      return true;
    }
    if (window.Training?.back?.()) return true;
    const prior = historyStack.pop();
    if (prior) {
      go(prior.view, prior.params, true);
      window.scrollTo(0, prior.y);
      return true;
    }
    if (view !== 'home') {
      go('home', {}, true);
      return true;
    }
    return false;
  }
  window.appBack = appBack;
  function closeSheet() {
    if (!overlay.hidden) {
      overlay.hidden = true;
      overlay.innerHTML = '';
      lastFocus?.focus?.({ preventScroll: true });
      lastFocus = null;
    }
  }
  function sheet(title, html) {
    if (overlay.hidden) lastFocus = document.activeElement;
    overlay.innerHTML = `<section role="dialog" aria-modal="true" aria-labelledby="sheet-title" class="sheet"><header class="sheetheader"><h2 id="sheet-title">${esc(title)}</h2><button class="iconbtn" data-r="close" aria-label="${L.t("Zamknij")}">${icon('close', 17)}</button></header>${html}</section>`;
    overlay.hidden = false;
    overlay.querySelector('button')?.focus({ preventScroll: true });
  }
  function labelDate(d, opts) {
    return new Intl.DateTimeFormat(L.locale, opts).format(new Date(d));
  }
  function num(n) {
    return new Intl.NumberFormat(L.locale, { maximumFractionDigits: 2 }).format(n);
  }
  function formN(n, one, few, many) {
    return n === 1 ? one : L.language === 'en' ? many : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? few : many;
  }
  function count(n, ...words) {
    return `${n} ${formN(n, ...words)}`;
  }
  function dateKey(d) {
    return [d.getFullYear(), d.getMonth() + 1, d.getDate()].join('-');
  }
  function gymName(id) {
    return state.gyms.find((g) => g.id === id)?.name || L.t("Siłownia");
  }
  function exercise(id) {
    return state.exercises.find((e) => e.id === id);
  }
  function sessions() {
    return [...state.sessions].sort((a, b) => new Date(b.finishedAt) - new Date(a.finishedAt));
  }
  function totalSets(s) {
    return s.exercises.reduce((n, e) => n + e.sets.filter((st) => st.done).length, 0);
  }
  function duration(s) {
    return Math.max(0, Math.round((new Date(s.finishedAt) - new Date(s.startedAt)) / 60000)) || 0;
  }
  function top(title, desc = '', extra = '') {
    return `<header class="pagehead"><div><h1>${esc(title)}</h1>${desc ? `<p>${esc(desc)}</p>` : ''}</div>${extra}</header>`;
  }
  function action(r, label, i = 'plus', cls = 'linebtn') {
    return `<button type="button" class="${cls}" data-r="${r}">${icon(i, 16)}${esc(label)}</button>`;
  }
  function navbutton(n, short = false) {
    let active =
      view === n ||
      (n === 'plans' && ['plan', 'editPlan', 'workout'].includes(view)) ||
      (n === 'history' && view === 'historyDetail') ||
      (n === 'catalogue' && view === 'exercise') ||
      (n === 'progress' && ['localProgress', 'measurements'].includes(view)) ||
      (short &&
        n === 'more' &&
        ['more', 'calendar', 'history', 'historyDetail', 'gyms', 'settings', 'calc'].includes(view));
    const labels = {
      home: L.t("Trening"),
      plans: short ? L.t("Plany") : L.t("Moje plany"),
      history: L.t("Historia"),
      calendar: L.t("Kalendarz"),
      progress: L.t("Postępy"),
      more: L.t("Więcej"),
      calc: L.t("Przelicznik maszyn"),
      catalogue: short ? L.t("Ćwiczenia") : L.t("Atlas ćwiczeń"),
      gyms: L.t("Moje siłownie"),
      settings: L.t("Kopia zapasowa")
    };
    return `<button data-r="go" data-v="${n}" class="${short ? 'bottomitem' : 'navbtn'}${active ? ' active' : ''}" ${active ? 'aria-current="page"' : ''} aria-label="${esc(labels[n])}">${icon(n, 19)}<span>${labels[n]}</span></button>`;
  }
  function shell() {
    document.querySelector('#rail').innerHTML =
      `<button class="brand" data-r="go" data-v="home" aria-label="${L.t("BebechDestroyer, pulpit")}">${brand()}</button><div class="navcap">${L.t("Dziennik")}</div><nav class="navgroup" aria-label="${L.t("Dziennik")}">${['home', 'plans', 'calendar', 'history', 'progress'].map((x) => navbutton(x)).join('')}</nav><div class="navcap">${L.t("Narzędzia")}</div><nav class="navgroup" aria-label="${L.t("Narzędzia")}">${['calc', 'catalogue', 'gyms'].map((x) => navbutton(x)).join('')}</nav><div class="railfoot">${navbutton('settings')}<div class="localtag"><i class="dot"></i>${L.t("Zapis na urządzeniu")}</div></div>`;
    document.querySelector('#topbar').innerHTML =
      `<button class="brand mobilebrand" data-r="go" data-v="home" aria-label="${L.t("BebechDestroyer, pulpit")}">${brand()}</button><div class="toplabel">${icon('bar', 18)} ${L.t("Dziennik treningowy")}</div><button class="gymsel" data-r="gymsel" aria-label="${L.t("Zmień siłownię.")} ${esc(gymName(currentGym))}">${icon('pin', 15)}<span>${esc(gymName(currentGym))}</span>${icon('down', 14)}</button>`;
    if (['progress', 'exercise', 'catalogue', 'calendar', 'measurements'].includes(view)) {
      document.querySelector('.gymsel').outerHTML =
        '<span class="allgyms">' + icon('stack', 15) + (" " + L.t("Wszystkie siłownie") + "</span>");
    }
    document.querySelector('#bottom').innerHTML = ['home', 'plans', 'progress', 'catalogue', 'more']
      .map((x) => navbutton(x, true))
      .join('');
  }
  function planRow(p, i) {
    const tones = ['lime', 'lilac', 'sky', 'sand'],
      shapes = ['bar', 'lower', 'full'];
    return `<button class="planrow" data-r="plan" data-id="${esc(p.id)}"><span class="tile ${tones[i % 4]}">${icon(shapes[i % 3], 23)}</span><span class="rowtext"><b>${esc(L.routine(p))}</b><small>${count(p.exercises.length, L.t("ćwiczenie"), L.t("ćwiczenia"), L.t("ćwiczeń"))} · ${count(
      p.exercises.reduce((s, r) => s + Number(r.sets), 0),
      L.t("seria"),
      L.t("serie"),
      L.t("serii")
    )}</small></span>${icon('right', 16)}</button>`;
  }
  function historyRow(s) {
    return `<button data-r="historyDetail" data-id="${esc(s.id)}" class="listrow"><span class="tile lime">${icon('bar', 20)}</span><span class="rowtext"><b>${esc(L.routine(s))}</b><small>${esc(gymName(s.gymId))} · ${labelDate(s.finishedAt, { day: 'numeric', month: 'short' })} · ${count(totalSets(s), L.t("seria"), L.t("serie"), L.t("serii"))}</small></span>${icon('right', 16)}</button>`;
  }
  function weekCard() {
    const today = new Date(),
      mon = new Date(today);
    mon.setHours(0, 0, 0, 0);
    mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7) + 7 * weekOffset);
    const end = new Date(mon);
    end.setDate(end.getDate() + 7);
    const wk = sessions().filter((s) => new Date(s.finishedAt) >= mon && new Date(s.finishedAt) < end);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(mon);
      d.setDate(d.getDate() + i);
      const key = dateKey(d),
        isToday = key === dateKey(today),
        same = wk.filter((s) => dateKey(new Date(s.finishedAt)) === key);
      return `<button class="day${isToday ? ' today' : ''}${same.length ? ' logged' : ''}" data-r="day" data-id="${d.getTime()}" aria-label="${labelDate(d, { dateStyle: 'full' })}${L.t(", treningi")} ${same.length}"><span>${[L.t("Pn"), L.t("Wt"), L.t("Śr"), L.t("Cz"), L.t("Pt"), L.t("So"), L.t("Nd")][i]}</span><strong>${d.getDate()}</strong></button>`;
    }).join('');
    const last = new Date(end);
    last.setDate(last.getDate() - 1);
    const monthEq = mon.getMonth() === last.getMonth(),
      range = `${labelDate(mon, monthEq ? { day: 'numeric' } : { day: 'numeric', month: 'short' })} – ${labelDate(last, { day: 'numeric', month: 'long' })}`;
    return `<section class="week panel"><div class="panelheading"><h2>${weekOffset === 0 ? L.t("Ten tydzień") : L.t("Aktywność tygodnia")}</h2><div class="pager"><button data-r="prevweek" aria-label="${L.t("Poprzedni tydzień")}">${icon('left', 16)}</button><button data-r="nextweek" ${weekOffset >= 0 ? 'disabled' : ''} aria-label="${L.t("Następny tydzień")}">${icon('right', 16)}</button></div></div><div class="weekrange">${range}</div><div class="days">${days}</div><div class="weekstats"><div class="stat"><b>${wk.length}</b><small>${L.t("Treningi")}</small></div><div class="stat"><b>${wk.reduce((n, s) => n + totalSets(s), 0)}</b><small>${L.t("Serie")}</small></div><div class="stat"><b>${wk.reduce((n, s) => n + duration(s), 0)}<em>min</em></b><small>${L.t("Czas")}</small></div></div></section>`;
  }
  function home() {
    const plan = state.plans.find((p) => p.id === state.uiPlan) || state.plans[0],
      active = state.active;
    const rows = active?.exercises || plan?.exercises || [],
      setCount = rows.reduce((s, r) => s + (Array.isArray(r.sets) ? r.sets.length : Number(r.sets)), 0);
    const log = sessions(),
      featured = exercise(rows[0]?.exerciseId) || exercise('chest-press') || state.exercises[0];
    const from = state.gyms[0],
      to = state.gyms[1];
    let live;
    for (const eq of state.equipment.filter((eq) => eq.gymId === currentGym)) {
      const rec = M.recommend(state, {
        gymId: currentGym,
        exerciseId: eq.exerciseId,
        equipmentId: eq.id,
        reps: 10
      });
      if (rec.source === 'transfer') {
        live = { rec, eq };
        break;
      }
    }
    const atlas = featured
      ? `<button class="home-atlas" data-r="musclepage" data-id="${esc(featured.id)}"><span class="ha-text"><span class="ha-type">${esc(L.group(featured))}</span><strong>${esc(ExerciseAtlas.name(state, featured))}</strong><span class="ha-link">${L.t("Zobacz mięśnie")} ${icon('arrow', 15)}</span></span><span class="ha-diagram" aria-hidden="true">${ExerciseAtlas.figure?.(state, featured.id, 'auto') || ''}</span></button>`
      : '';
    const hero = `<section class="hero"><div class="herotop"><span class="herotag">${icon(active ? 'clock' : 'plans', 14)}${active ? L.t("W trakcie") : L.t("Wybrany plan")}</span>${!active && plan ? `<button class="herochg" data-r="pickplan" aria-label="${L.t("Zmień wybrany plan")}">${icon('calc', 16)}</button>` : ''}</div><div><h2 class="heroname">${esc(L.routine(active) || L.routine(plan) || L.t("Pusty trening"))}</h2><div class="heroinfo"><span>${icon('bar', 15)}${count(rows.length, L.t("ćwiczenie"), L.t("ćwiczenia"), L.t("ćwiczeń"))}</span><i></i><span>${icon('stack', 15)}${count(setCount, L.t("seria"), L.t("serie"), L.t("serii"))}</span></div><button class="solidbtn" data-r="start" data-id="${esc(plan?.id || '')}">${icon('play', 12)} ${active ? L.t("Wróć do treningu") : L.t("Rozpocznij trening")} ${icon('arrow', 16)}</button></div></section>`;
    const converter = `<button class="conversion-shortcut panel" data-r="openCalc" data-id="${esc(live?.eq.id || '')}"><span class="tile lilac">${icon('calc', 22)}</span><span class="rowtext"><b>${L.t("Przelicznik maszyn")}</b><small>${live ? `${esc(gymName(live.rec.sourceGymId))} → ${esc(gymName(currentGym))}` : `${esc(from?.name || L.t("Siłownia"))} ${to ? '↔ ' + esc(to.name) : ''}`}</small></span>${live ? `<strong>${num(live.rec.weight)} kg</strong>` : ''}${icon('right', 16)}</button>`;
    page.innerHTML = `<header class="pagehead homehead"><div><div class="datecap">${esc(labelDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long' }))}</div><h1>${L.t("Trening")}</h1></div><div class="cal-home-actions"><button class="linebtn" data-r="go" data-v="calendar" aria-label="${L.t("Kalendarz treningów")}">${icon('calendar', 16)} ${L.t("Kalendarz")}</button><button class="linebtn" data-r="quick" aria-label="${active ? L.t("Wróć do treningu") : L.t("Rozpocznij pusty trening")}">${icon(active ? 'play' : 'plus', 16)} ${active ? L.t("Wróć do treningu") : L.t("Pusty trening")}</button></div></header><div class="majorgrid">${hero}${weekCard()}</div><div class="lowergrid"><section><div class="sectionhead"><h2>${L.t("Moje plany")}</h2><button class="textbtn" data-r="go" data-v="plans">${L.t("Wszystkie")} ${icon('right', 14)}</button></div><div class="panel planlist">${state.plans.slice(0, 3).map(planRow).join('') || `<div class="emptyline">${action('newplan', L.t("Utwórz plan"))}</div>`}</div></section><section><div class="sectionhead"><h2>${L.t("Atlas ćwiczeń")}</h2><button class="textbtn" data-r="go" data-v="catalogue">${L.t("Otwórz atlas")} ${icon('right', 14)}</button></div>${atlas}</section></div><div class="homehistory"><div class="sectionhead"><h2>${L.t("Ostatni trening")}</h2><button class="textbtn" data-r="go" data-v="history">${L.t("Historia")} ${icon('right', 14)}</button></div><div class="panel">${log[0] ? historyRow(log[0]) : `<div class="emptyline">${icon('history', 20)} ${L.t("Tutaj pojawi się Twój pierwszy ukończony trening.")}</div>`}</div></div>${converter}`;
  }
  function historyView() {
    const filtered = sessions().filter((s) => !params.day || dateKey(new Date(s.finishedAt)) === params.day);
    let prev = '';
    const body = filtered
      .map((s) => {
        const group = labelDate(s.finishedAt, { month: 'long', year: 'numeric' }),
          newGroup = group !== prev;
        prev = group;
        return `${newGroup ? `<div class="histgroup">${group}</div>` : ''}<div class="panel">${historyRow(s)}</div>`;
      })
      .join('');
    page.innerHTML =
      top(
        L.t("Historia treningów"),
        params.day ? params.title : L.t("Twoje zakończone sesje ze wszystkich siłowni."),
        `<button class="linebtn" data-r="go" data-v="calendar" aria-label="${L.t("Kalendarz treningów")}">${icon('calendar', 16)} ${L.t("Kalendarz")}</button>`
      ) +
      (params.day ? action('allhistory', L.t("Pokaż całą historię"), 'list') : '') +
      (body ||
        `<section class="block panel"><h2>${params.day ? L.t("Dzień bez zapisanego treningu") : L.t("Pierwszy trening przed Tobą")}</h2><p>${L.t("Ukończ trening, aby zobaczyć tutaj ćwiczenia, serie i wyniki.")}</p><div class="actionbar">${action('toPlans', L.t("Wybierz plan"), 'plans', 'solidbtn')}</div></section>`);
  }
  function render() {
    shell();
    page.classList.toggle('home-layout', view === 'home');
    document.title = `${titles[view]} · BebechDestroyer`;
    if (trainViews.has(view)) {
      window.Training.mount(view, page, ctx(), params);
    } else if (view === 'home') home();
    else if (view === 'history') historyView();
    else if (view === 'calendar') window.WorkoutCalendar.render();
    else window.RozstawScreens.render(view, params);
  }
  function choices(items, r, selected) {
    return items
      .map(
        (item) =>
          `<button class="choice${item.id === selected ? ' chosen' : ''}" data-r="${r}" data-id="${esc(item.id)}">${icon(item.id === selected ? 'check' : 'right', 16)}<b>${esc(item.name)}</b></button>`
      )
      .join('');
  }
  function switchGym(id) {
    if (!state.gyms.some((g) => g.id === id)) return;
    currentGym = id;
    window.RozstawScreens?.gymChanged(id);
    save();
    closeSheet();
    if (trainViews.has(view)) {
      if (view === 'workout' && state.active && state.active.gymId !== id)
        toast(`${L.t("Trwający trening pozostaje w")} ${gymName(state.active.gymId)}.`);
      if (view !== 'workout' && view !== 'editPlan') go(view, params, true);
      else shell();
    } else render();
  }
  document.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeSheet();
      return;
    }
    const btn = e.target.closest('[data-r]');
    if (!btn) return;
    const { r, id, v } = btn.dataset;
    switch (r) {
      case 'openCalc':
        go('calc', id ? { profile: id } : {});
        break;
      case 'go':
        go(v);
        break;
      case 'close':
        closeSheet();
        break;
      case 'start':
      case 'quick':
        window.Training.start(ctx(), r === 'quick' ? null : id || null);
        break;
      case 'toPlans':
        go('plans');
        break;
      case 'allhistory':
        go('history');
        break;
      case 'newplan':
        go('editPlan');
        break;
      case 'plan':
      case 'historyDetail':
        go(r, view === 'calendar' ? { id, fromCalendar: true } : { id });
        break;
      case 'gymsel':
        sheet(
          L.t("Wybierz siłownię"),
          choices(state.gyms, 'selgym', currentGym) +
            `<div class="actionbar">${action('managegyms', L.t("Zarządzaj siłowniami"), 'gyms')}</div>`
        );
        break;
      case 'selgym':
        switchGym(id);
        break;
      case 'managegyms':
        go('gyms');
        break;
      case 'pickplan':
        sheet(L.t("Plan na pulpicie"), choices(state.plans.map(p => ({id:p.id, name:L.routine(p)})), 'selplan', state.uiPlan || state.plans[0]?.id));
        break;
      case 'selplan':
        state.uiPlan = id;
        save();
        closeSheet();
        home();
        break;
      case 'prevweek':
      case 'nextweek':
        weekOffset += r === 'prevweek' ? -1 : 1;
        home();
        break;
      case 'day': {
        const d = new Date(Number(id));
        go('calendar', { day: WorkoutCalendar.localDay(d) });
        break;
      }
      default:
        window.RozstawScreens.action(r, id, btn);
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (appBack()) e.preventDefault();
    }
    if (e.key === 'Tab' && !overlay.hidden) {
      const opts = [
        ...overlay.querySelectorAll('button:not([disabled]),input,select,textarea,[tabindex="0"]')
      ];
      if (!opts.length) return;
      if (e.shiftKey && document.activeElement === opts[0]) {
        opts.at(-1).focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === opts.at(-1)) {
        opts[0].focus();
        e.preventDefault();
      }
    }
  });
  window.Rozstaw = {
    get state() {
      return state;
    },
    get gymId() {
      return currentGym;
    },
    get view() {
      return view;
    },
    get params() {
      return params;
    },
    get bootError() {
      return bootError;
    },
    page,
    key,
    icon,
    esc,
    toast,
    save,
    go,
    render,
    sheet,
    closeSheet,
    top,
    action,
    choices,
    num,
    count,
    dateKey,
    labelDate,
    exercise,
    gymName,
    totalSets,
    duration,
    sessions,
    historyRow,
    switchGym,
    setLanguage(language) {
      if (!['en','pl'].includes(language) || bootError) return;
      const prior = state.language;
      state.language = language;
      if (!save()) {state.language = prior; return;}
      window.AndroidBackup?.setLanguage?.(language);
      closeSheet();
      if (language !== L.language) window.location.reload();
    },
    restore(obj) {
      M.upgradeState(obj);
      const nextGym = obj.gyms.some((g) => g.id === obj.uiGym) ? obj.uiGym : obj.gyms[0].id;
      try {
        localStorage.setItem(key, JSON.stringify(obj));
      } catch {
        toast(L.t("Brak miejsca. Przywrócenie kopii nie powiodło się."));
        return;
      }
      state = obj;
      currentGym = nextGym;
      bootError = false;
      historyStack.length = 0;
      if (obj.language !== L.language) {
        window.AndroidBackup?.setLanguage?.(obj.language);
        window.location.reload();
        return;
      }
      go('home', {}, true);
      toast(L.t("Przywrócono kopię danych."));
    },
    start() {
      document.documentElement.lang = L.language;
      document.querySelector('.skip').textContent = L.language === 'en' ? 'Skip to content' : 'Przejdź do treści';
      document.querySelector('#bottom').setAttribute('aria-label', L.language === 'en' ? 'Bottom navigation' : 'Dolna nawigacja');
      window.AndroidBackup?.setLanguage?.(L.language);
      render();
      if (bootError)
        sheet(
          L.t("Problem z odczytem danych"),
          `<p>${L.t("Zapis w pamięci urządzenia wymaga odzyskania. Możesz pobrać jego oryginał lub wczytać swoją kopię.")}</p><div class="actionbar">${action('backupPage', L.t("Otwórz kopię zapasową"), 'download', 'solidbtn')}</div>`
        );
    }
  };
})();
