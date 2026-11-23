(function live(global) {
  'use strict';

  const atlas = global.ExerciseAtlas || (typeof require === 'function' && require('./atlas.js'));
  const num = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 1 });
  const rank = { primary: 3, secondary: 2, stabilizer: 1 };
  const roles = { primary: 'Główne', secondary: 'Wspomagające', stabilizer: 'Stabilizujące' };
  const esc = (value) =>
    String(value).replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
    );

  function clock(seconds) {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    const minutes = Math.floor(total / 60);
    const pad = (n) => String(n).padStart(2, '0');
    return minutes >= 60
      ? `${Math.floor(minutes / 60)}:${pad(minutes % 60)}:${pad(total % 60)}`
      : `${pad(minutes)}:${pad(total % 60)}`;
  }

  function volumeReadout(stats) {
    const workingSets = stats.totalSets + stats.bodyweightSets + stats.unloadedSets;
    const bodyweight = stats.bodyweightSets
      ? 'Serie z masą ciała uwzględniają tylko zapisany dodatkowy ciężar.'
      : '';
    if (stats.missingSets) {
      const amount = stats.coveredSets ? num.format(stats.volume) : '—';
      const note = stats.coveredSets
        ? `Suma częściowa. Przeliczono ${stats.coveredSets} z ${stats.totalSets} obciążonych serii.`
        : 'Brakuje kalibracji dla wykonanych serii z obciążeniem.';
      return { amount, note: [note, bodyweight].filter(Boolean).join(' '), workingSets };
    }
    return { amount: num.format(stats.volume || 0), note: bodyweight, workingSets };
  }

  function muscleProfile(state, session, requestedMode) {
    const planned = new Map(),
      performed = new Map();
    for (const row of session.exercises) {
      const targets = row.sets.filter((s) => s.type !== 'warmup');
      const done = targets.filter(
        (s) => s.done === true && Number.isInteger(Number(s.reps)) && Number(s.reps) > 0
      ).length;
      if (targets.length) planned.set(row.exerciseId, (planned.get(row.exerciseId) || 0) + targets.length);
      if (done) performed.set(row.exerciseId, (performed.get(row.exerciseId) || 0) + done);
    }
    const mode =
      requestedMode === 'planned' || requestedMode === 'performed'
        ? requestedMode
        : performed.size
          ? 'performed'
          : 'planned';
    const selected = mode === 'planned' ? planned : performed;
    const muscles = new Map();
    let unmapped = 0;
    for (const [id, sets] of selected) {
      const profile = atlas.describe(state, id);
      if (!profile.muscles.length) unmapped++;
      for (const m of profile.muscles) {
        const prev = muscles.get(m.id);
        if (prev) {
          prev.sets += sets;
          if (rank[m.role] > rank[prev.role]) prev.role = m.role;
        } else muscles.set(m.id, { id: m.id, label: m.label, role: m.role, sets });
      }
    }
    return {
      mode,
      unmapped,
      exerciseCount: selected.size,
      setCount: [...selected.values()].reduce((sum, n) => sum + n, 0),
      muscles: [...muscles.values()].sort(
        (a, b) => rank[b.role] - rank[a.role] || b.sets - a.sets || a.label.localeCompare(b.label, 'pl')
      )
    };
  }

  function musclePanel(state, session, requestedMode) {
    const data = muscleProfile(state, session, requestedMode);
    const showPerformed = data.mode === 'performed';
    const buttons = [
      ['performed', 'Wykonane'],
      ['planned', 'Plan treningu']
    ]
      .map(
        ([value, name]) =>
          `<button type="button" data-action="muscle-mode" data-mode="${value}" aria-pressed="${value === data.mode}">${name}</button>`
      )
      .join('');
    const muscleButtons = data.muscles
      .map(
        (m) =>
          `<button type="button" class="atlas-muscle" data-atlas-pick="${esc(m.id)}" aria-pressed="false"><span class="atlas-key atlas-${m.role}"></span><span>${esc(m.label)}</span><span class="atlas-role">${esc(roles[m.role])} · ${m.sets}</span></button>`
      )
      .join('');
    const note = showPerformed
      ? data.exerciseCount
        ? `Zaliczone serie robocze: ${data.setCount}.`
        : 'Zalicz serię roboczą, aby zaznaczyć jej mięśnie.'
      : data.exerciseCount
        ? `Ćwiczenia w tej sesji: ${data.exerciseCount}.`
        : 'Dodaj ćwiczenie, aby zobaczyć jego mięśnie.';
    return `<section class="atlas-card tr-muscle-card" data-live-map data-atlas-card>
      <div class="tr-map-main"><div class="tr-map-copy"><h2>Mięśnie treningu</h2>
      <div class="tr-map-switch" role="group" aria-label="Zakres mapy mięśni">${buttons}</div>
      <p>${esc(note)}</p><div class="tr-map-legend">${Object.entries(roles)
        .map(([id, label]) => `<span><i class="atlas-key atlas-${id}" aria-hidden="true"></i>${label}</span>`)
        .join('')}</div></div>
      <div class="atlas-pair tr-map-pair">${atlas.figures(data.muscles)}</div></div>
      ${muscleButtons ? `<details class="tr-map-list"><summary>Mięśnie i liczba serii</summary>${muscleButtons}</details>` : ''}
      ${data.unmapped ? `<p class="tr-map-missing">Ćwiczenia bez przypisanej mapy: ${data.unmapped}.</p>` : ''}
      </section>`;
  }
  const api = { clock, volumeReadout, muscleProfile, musclePanel };
  global.WorkoutLive = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
