(function live(global) {
  'use strict';
  const L = (typeof window !== 'undefined' ? window : globalThis).GymI18n || require('./i18n.js');

  const atlas = global.ExerciseAtlas || (typeof require === 'function' && require('./atlas.js'));
  const num = new Intl.NumberFormat(L.locale, { maximumFractionDigits: 1 });
  const setNumber = new Intl.NumberFormat(L.locale, { maximumFractionDigits: 3 });
  const roleWeights = { primary: 1, secondary: 0.5, stabilizer: 0.125 };
  const roleLabels = { primary: L.t("Główna"), secondary: L.t("Wspomagająca"), stabilizer: L.t("Stabilizująca") };
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
      ? L.t("Serie z masą ciała uwzględniają tylko zapisany dodatkowy ciężar.")
      : '';
    if (stats.missingSets) {
      const amount = stats.coveredSets ? num.format(stats.volume) : '—';
      const note = stats.coveredSets
        ? `${L.t("Suma częściowa. Przeliczono")} ${stats.coveredSets} z ${stats.totalSets} ${L.t("obciążonych serii.")}`
        : L.t("Brakuje kalibracji dla wykonanych serii z obciążeniem.");
      return { amount, note: [note, bodyweight].filter(Boolean).join(' '), workingSets };
    }
    return { amount: num.format(stats.volume || 0), note: bodyweight, workingSets };
  }

  function muscleProfile(state, session, requestedMode) {
    const mode = requestedMode === 'planned' ? 'planned' : 'performed';
    const selected = new Map();
    for (const row of session.exercises) {
      const sets = row.sets.filter(s =>
        s.type !== 'warmup' && (mode === 'planned' ||
          (s.done === true && Number.isInteger(Number(s.reps)) && Number(s.reps) > 0))
      ).length;
      if (sets) selected.set(row.exerciseId, (selected.get(row.exerciseId) || 0) + sets);
    }
    const muscles = new Map();
    const setsByGroup = new Map();
    let unmapped = 0;
    for (const [id, sets] of selected) {
      const profile = atlas.describe(state, id);
      if (!profile.muscles.length) unmapped++;
      for (const {name, members} of atlas.groupMuscles(profile.muscles)) {
        // The atlas orders muscles by role. Credit only the strongest role per group in this exercise.
        setsByGroup.set(name, (setsByGroup.get(name) || 0) + sets * roleWeights[members[0].role]);
      }
      for (const m of profile.muscles) {
        const weightedSets = sets * roleWeights[m.role];
        const prev = muscles.get(m.id);
        if (prev) {
          prev.sets += sets;
          prev.weightedSets += weightedSets;
          if (roleWeights[m.role] > roleWeights[prev.role]) prev.role = m.role;
        } else muscles.set(m.id, { ...m, sets, weightedSets });
      }
    }
    return {
      mode,
      unmapped,
      setsByGroup,
      exerciseCount: selected.size,
      setCount: [...selected.values()].reduce((sum, n) => sum + n, 0),
      muscles: [...muscles.values()].sort(
        (a, b) => roleWeights[b.role] - roleWeights[a.role] || b.weightedSets - a.weightedSets || a.label.localeCompare(b.label, L.locale)
      )
    };
  }

  function muscleIcon(state, session) {
    return atlas.figures(muscleProfile(state, session).muscles, state.sex, true);
  }

  function distributionRows(data) {
    const groups = atlas.groupMuscles(data.muscles).sort((a, b) => data.setsByGroup.get(b.name) - data.setsByGroup.get(a.name));
    const largest = data.setsByGroup.get(groups[0].name);
    return groups.map(({name, members}) => {
      const total = data.setsByGroup.get(name);
      const rows = members.map(m => `<button type="button" class="atlas-muscle" data-atlas-pick="${m.id}" data-atlas-role="${m.role}" aria-pressed="false">
        <i class="atlas-key atlas-${m.role}" aria-hidden="true"></i><span>${esc(m.label)}<small>${roleLabels[m.role]}</small></span>
        <span class="dist-value">${setNumber.format(m.weightedSets)}</span></button>`).join('');
      return `<details class="dist-group"><summary><span class="dist-name">${esc(name)}</span>
        <span class="dist-track" aria-hidden="true"><i class="dist-bar" style="width:${100 * total / largest}%"></i></span>
        <strong class="dist-total">${setNumber.format(total)}</strong></summary>${rows}</details>`;
    }).join('');
  }

  function musclePanel(state, session, requestedMode) {
    const data = muscleProfile(state, session, requestedMode);
    const showPerformed = data.mode === 'performed';
    const buttons = [
      ['performed', L.t("Wykonane")],
      ['planned', L.t("Plan treningu")]
    ]
      .map(
        ([value, name]) =>
          `<button type="button" data-action="muscle-mode" data-mode="${value}" aria-pressed="${value === data.mode}">${name}</button>`
      )
      .join('');
    const emptyText = showPerformed ? L.t("Zalicz serię roboczą, aby zaznaczyć jej mięśnie.") : L.t("Dodaj ćwiczenie, aby zobaczyć jego mięśnie.");
    return `<section class="distribution" data-live-map data-atlas-card>
      <div class="dist-switch" role="group" aria-label="${L.t("Zakres mapy mięśni")}">${buttons}</div>
      <div class="atlas-pair tr-map-pair">${atlas.figures(data.muscles, state.sex)}</div>${atlas.mapKey(data.muscles)}
      ${data.muscles.length ? `<div class="dist-head"><span>${L.t("Partia mięśniowa")}</span><span>${L.t("Serie ważone")}</span></div>
        ${distributionRows(data)}
        <details class="dist-method"><summary>${L.t("Szacowane serie według roli mięśnia")}</summary>
          <dl>${Object.entries(roleWeights).map(([role, weight]) => `<div><dt>${roleLabels[role]}</dt><dd>${setNumber.format(weight)}</dd></div>`).join('')}</dl>
          <p>${L.t("Każda seria liczy się dla partii według najbardziej zaangażowanego mięśnia.")} ${L.t("Dla stabilizacji przyjęto orientacyjnie ⅛ serii.")}</p></details>` : ''}
      ${!data.setCount ? `<p class="dist-empty">${emptyText}</p>` : ''}
      ${data.unmapped ? `<p class="tr-map-missing">${L.t("Ćwiczenia bez przypisanej mapy:")} ${data.unmapped}.</p>` : ''}
      </section>`;
  }
  const api = { clock, volumeReadout, muscleProfile, musclePanel, muscleIcon };
  global.WorkoutLive = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
