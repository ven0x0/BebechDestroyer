(function build(global) {
  'use strict';
  const L = (typeof window !== 'undefined' ? window : globalThis).GymI18n || require('./i18n.js');
  const M = global.GymModel || (typeof require === 'function' && require('./model.js'));
  const localRecommendation = M.recommend;
  const DAY = 86400000;
  const PAIR_WINDOW = 14 * DAY;
  const HISTORY_WINDOW = 180 * DAY;
  const SOURCE_WINDOW = 42 * DAY;
  const HALF_LIFE = 45 * DAY;
  const median = (values) => {
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  };
  const timeOf = (value) => new Date(value).getTime();
  const load = (set) => M.parseNumber(set.weight);
  const repetitions = (set) => M.parseNumber(set.reps);
  const validSet = (set) =>
    set.done === true && set.type !== 'warmup' && Number.isInteger(repetitions(set)) && repetitions(set) > 0;
  const effort = (set) => (set.type === 'failure' ? 0 : M.parseNumber(set.rir));
  const effortMatches = (a, b) =>
    effort(a) === null || effort(b) === null || Math.abs(effort(a) - effort(b)) <= 1;
  const workingLoad = (set) => validSet(set) && load(set) > 0 && set.type !== 'drop';
  function comparable(a, b) {
    return a === b || (Math.min(a, b) >= 3 && Math.max(a, b) <= 15 && Math.abs(a - b) <= 5);
  }
  function effortAtReps(sets, reps) {
    return sets.filter((set) => workingLoad(set) && comparable(repetitions(set), reps));
  }
  function weightAtReps(sets, reps) {
    const valid = effortAtReps(sets, reps);
    if (!valid.length) return null;
    const minGap = Math.min(...valid.map((set) => Math.abs(repetitions(set) - reps)));
    const close = valid.filter((set) => Math.abs(repetitions(set) - reps) === minGap);
    return median(close.map((set) => (load(set) * (30 + repetitions(set))) / (30 + reps)));
  }

  // Each pair of workouts contributes a single ratio, even when there are many sets.
  // Divide estimated strengths only for matched or nearby repetitions and comparable effort.
  function relativeLoad(targetSets, sourceSets) {
    let minGap = Infinity;
    let ratios = [];
    for (const target of targetSets) {
      if (!workingLoad(target)) continue;
      for (const source of sourceSets) {
        if (!workingLoad(source) || !effortMatches(target, source)) continue;
        const rt = repetitions(target),
          rs = repetitions(source);
        const gap = Math.abs(rt - rs);
        if (gap > minGap || !comparable(rt, rs)) continue;
        if (gap < minGap) {
          ratios = [];
          minGap = gap;
        }
        ratios.push(Math.log((load(target) * (30 + rt)) / (load(source) * (30 + rs))));
      }
    }
    return ratios.length ? median(ratios) : null;
  }

  function newModel() {
    return { anchor: null, histories: new Map(), edges: new Map(), neighbors: new Map() };
  }

  function getEdge(model, from, to) {
    const [a, b] = from < to ? [from, to] : [to, from];
    const key = JSON.stringify([a, b]);
    if (!model.edges.has(key)) {
      const edge = {
        a,
        b,
        records: [],
        corrections: 0,
        used: new Map([
          [a, new Map()],
          [b, new Map()]
        ])
      };
      model.edges.set(key, edge);
      for (const [one, other] of [
        [a, b],
        [b, a]
      ]) {
        if (!model.neighbors.has(one)) model.neighbors.set(one, new Map());
        model.neighbors.get(one).set(other, edge);
      }
    }
    return model.edges.get(key);
  }

  // The median rejects isolated discrepancies. Recent consistent pairs and verified manual
  // corrections have more influence on the estimate. All spread limits are symmetric in log space.
  function fit(edge, now) {
    if (!edge || !edge.records.length) return null;
    const fresh = edge.records.filter((r) => now >= r.when && now - r.when <= HISTORY_WINDOW);
    if (!fresh.length) return null;
    const center = median(fresh.map((r) => r.logRatio));
    const inside = fresh.filter((r) => Math.abs(r.logRatio - center) <= Math.log(1.23));
    if (!inside.length || inside.length < Math.ceil((fresh.length * 2) / 3)) return null;
    let sum = 0,
      weights = 0;
    for (const r of inside) {
      const weight =
        (Math.pow(0.5, (now - r.when) / HALF_LIFE) * (r.corrected ? 2.5 : 1)) / (1 + r.gap / PAIR_WINDOW);
      sum += r.logRatio * weight;
      weights += weight;
    }
    const spread = Math.max(...inside.map((r) => r.logRatio)) - Math.min(...inside.map((r) => r.logRatio));
    if (spread > Math.log(1.45)) return null;
    const last = Math.max(...inside.map((r) => r.when));
    let confidence = 'low';
    if (now - last <= 70 * DAY && inside.length >= 2 && spread <= Math.log(1.25)) confidence = 'medium';
    if (now - last <= 45 * DAY && inside.length >= 3 && spread <= Math.log(1.13)) confidence = 'high';
    return {
      logRatio: sum / weights,
      confidence,
      pairs: inside.length,
      corrections: inside.filter((r) => r.corrected).length
    };
  }

  function storePair(edge, target, source, logRatio, corrected) {
    const previous = edge.used.get(source.key).get(source.id);
    // A correction against the same source replaces its older comparison. It never
    // increases the count of independent observations by reusing that source workout.
    if (previous && !corrected) return;
    const isB = target.key === edge.b;
    let logAB = isB ? logRatio : -logRatio;
    if (corrected) {
      const prior = fit(edge, target.when);
      if (prior) {
        const delta = logAB - prior.logRatio;
        const limit = Math.log(1.22);
        logAB = prior.logRatio + Math.max(-limit, Math.min(limit, delta));
        // Retain some prior evidence if this feedback replaces the only earlier comparison.
        if (previous && prior.pairs === 1) logAB = (logAB + prior.logRatio) / 2;
      }
    }
    if (previous) {
      edge.records.splice(edge.records.indexOf(previous), 1);
      edge.used.get(edge.a).delete(previous.aId);
      edge.used.get(edge.b).delete(previous.bId);
    }
    const data = {
      aId: isB ? source.id : target.id,
      bId: isB ? target.id : source.id,
      when: target.when,
      gap: target.when - source.when,
      logRatio: logAB,
      corrected
    };
    edge.records.push(data);
    edge.used.get(edge.a).set(data.aId, data);
    edge.used.get(edge.b).set(data.bId, data);
    if (corrected) edge.corrections++;
  }

  function explicitCorrection(current, priorHistory) {
    const corrections = new Map();
    const otherKey = priorHistory[priorHistory.length - 1].key;
    for (const set of current.sets) {
      const p = set.prediction;
      if (
        !p ||
        !workingLoad(set) ||
        p.sourceEquipmentId !== otherKey ||
        p.targetEquipmentId !== current.key ||
        p.reps !== repetitions(set) ||
        !Number.isFinite(p.weight) ||
        !(p.weight > 0) ||
        !Number.isFinite(p.sourceWeight) ||
        !(p.sourceWeight > 0) ||
        Math.abs(load(set) - p.weight) < 0.0001
      )
        continue;
      let source;
      for (let i = priorHistory.length - 1; i >= 0; i--) {
        if (priorHistory[i].id === p.sourceSessionId) {
          source = priorHistory[i];
          break;
        }
      }
      if (!source || source.when >= current.when || current.when - source.when > SOURCE_WINDOW) continue;
      const actualSource = weightAtReps(source.sets, p.reps);
      if (
        actualSource === null ||
        Math.abs(actualSource - p.sourceWeight) > Math.max(0.002, actualSource * 0.001)
      )
        continue;
      if (!effortAtReps(source.sets, p.reps).some((other) => effortMatches(set, other))) continue;
      if (!corrections.has(source)) corrections.set(source, []);
      corrections.get(source).push(Math.log(load(set) / actualSource));
    }
    if (!corrections.size) return null;
    const source = [...corrections.keys()].sort((a, b) => b.when - a.when)[0];
    return { source, ratio: median(corrections.get(source)) };
  }

  function record(model, current) {
    if (!model.anchor) model.anchor = current.key;
    if (!current.sets.some(workingLoad)) return;
    for (const [other, history] of model.histories) {
      if (other === current.key) continue;
      const edge = getEdge(model, current.key, other);
      const corrected = explicitCorrection(current, history);
      if (corrected) {
        storePair(edge, current, corrected.source, corrected.ratio, true);
        continue;
      }
      for (let i = history.length - 1; i >= 0; i--) {
        const candidate = history[i];
        if (current.when - candidate.when > PAIR_WINDOW) break;
        if (edge.used.get(other).has(candidate.id)) continue;
        const ratio = relativeLoad(current.sets, candidate.sets);
        if (ratio !== null) {
          storePair(edge, current, candidate, ratio, false);
          break;
        }
      }
    }
    if (!model.histories.has(current.key)) model.histories.set(current.key, []);
    model.histories.get(current.key).push(current);
  }

  const levels = { low: 1, medium: 2, high: 3 };
  function conversion(model, from, to, now) {
    if (!from || !to) return null;
    if (from === to) return { ratio: 1, confidence: 'high', pairs: 0, corrections: 0, hops: 0 };
    const queue = [
      {
        key: from,
        ratio: 1,
        pairs: Infinity,
        corrections: 0,
        confidence: 'high',
        cost: 0,
        hops: 0,
        route: [from]
      }
    ];
    while (queue.length) {
      queue.sort((a, b) => a.cost - b.cost);
      const path = queue.shift();
      if (path.key === to) return path;
      if (path.hops >= 3) continue;
      for (const [next, edge] of model.neighbors.get(path.key) || []) {
        if (path.route.includes(next)) continue;
        const estimate = fit(edge, now);
        if (!estimate) continue;
        const hops = path.hops + 1;
        const level = Math.min(levels[estimate.confidence], levels[path.confidence], 4 - hops);
        const log = path.key === edge.a ? estimate.logRatio : -estimate.logRatio;
        queue.push({
          key: next,
          ratio: path.ratio * Math.exp(log),
          pairs: Math.min(path.pairs, estimate.pairs),
          corrections: path.corrections + estimate.corrections,
          confidence: ['', 'low', 'medium', 'high'][level],
          cost: path.cost + 1 + (3 - levels[estimate.confidence]) * 0.25,
          hops,
          route: [...path.route, next]
        });
      }
    }
    return null;
  }

  // Replay finished sessions chronologically. A later workout can change future factors,
  // but cannot alter a point that was already computed for an earlier workout.
  function replay(state, wanted, now, visit) {
    const exercises = new Map(state.exercises.map((ex) => [ex.id, ex]));
    const equipment = new Map(state.equipment.map((eq) => [eq.id, eq]));
    const models = new Map();
    const sessions = state.sessions
      .map((s, index) => ({ s, index, when: timeOf(s.finishedAt) }))
      .filter((item) => Number.isFinite(item.when) && item.when <= now)
      .sort((a, b) => a.when - b.when || a.index - b.index);
    for (const { s, when } of sessions) {
      const groups = new Map();
      const work = [];
      for (const row of s.exercises) {
        if (!wanted.has(row.exerciseId)) continue;
        const ex = exercises.get(row.exerciseId);
        if (!ex) continue;
        const profile = equipment.get(row.equipmentId);
        const key = profile && profile.exerciseId === ex.id && profile.gymId === s.gymId ? profile.id : null;
        for (const set of row.sets) {
          if (!validSet(set)) continue;
          work.push({ ex, key, set });
          if (ex.type === 'bodyweight' || !key || !(load(set) > 0)) continue;
          if (!groups.has(key)) groups.set(key, { id: s.id, key, exerciseId: ex.id, when, sets: [] });
          groups.get(key).sets.push(set);
        }
      }
      for (const obs of groups.values()) {
        if (!models.has(obs.exerciseId)) models.set(obs.exerciseId, newModel());
        record(models.get(obs.exerciseId), obs);
      }
      if (visit) visit(s, when, work, models);
    }
    return models;
  }

  function round(weight, profile) {
    const step = M.parseNumber(profile.step) || 0.01;
    const min = Math.max(0, M.parseNumber(profile.minWeight) || 0);
    const steps = Math.max(0, Math.ceil((weight - min) / step - 0.5 - 1e-9));
    return Number((min + steps * step).toFixed(4));
  }

  function recommend(state, options) {
    const { exerciseId, gymId, equipmentId } = options;
    const profiles = M.getEquipment(state, gymId, exerciseId);
    const target = equipmentId
      ? profiles.find((p) => p.id === equipmentId)
      : profiles.length === 1
        ? profiles[0]
        : null;
    const reps = M.parseNumber(options.reps ?? 10);
    const now = options.now == null ? Date.now() : timeOf(options.now);
    const local = localRecommendation({ ...state, equipment: target ? [target] : profiles }, options);
    if (
      !target ||
      !Number.isInteger(reps) ||
      reps < 1 ||
      reps > 1000 ||
      !Number.isFinite(now) ||
      state.exercises.find((ex) => ex.id === exerciseId)?.type === 'bodyweight'
    )
      return local;
    const model = replay(state, new Set([exerciseId]), now).get(exerciseId);
    if (!model) return local;
    const recent = new Map();
    for (const [key, history] of model.histories) {
      for (let i = history.length - 1; i >= 0; i--) {
        const obs = history[i],
          kg = weightAtReps(obs.sets, reps);
        if (kg !== null) {
          recent.set(key, { obs, kg });
          break;
        }
      }
    }
    const targetHistory = model.histories.get(target.id);
    if (!targetHistory?.length) return local;
    const lastLocal = recent.get(target.id)?.obs || targetHistory[targetHistory.length - 1];
    const sorted = [...recent.values()]
      .filter(({ obs }) => obs.when > lastLocal.when && now - obs.when <= SOURCE_WINDOW)
      .sort((a, b) => b.obs.when - a.obs.when);
    for (const { obs, kg } of sorted) {
      const factor = conversion(model, obs.key, target.id, now);
      if (!factor) continue;
      const source = state.equipment.find((p) => p.id === obs.key);
      const gym = state.gyms.find((g) => g.id === source.gymId);
      const confidence = now - obs.when > 21 * DAY ? 'low' : factor.confidence;
      return {
        weight: round(kg * factor.ratio, target),
        reps,
        source: 'transfer',
        confidence,
        pairs: factor.pairs,
        ratio: factor.ratio,
        sourceWeight: kg,
        sourceGymId: source.gymId,
        sourceEquipmentId: obs.key,
        targetEquipmentId: target.id,
        sourceSessionId: obs.id,
        correctionCount: factor.corrections,
        hops: factor.hops,
        reason:
          `${L.t("Ostatni wynik z")} ${gym?.name || source.name} × ${factor.ratio.toLocaleString(L.locale, { maximumFractionDigits: 3 })}${L.t(". Pary porównawcze:")} ${factor.pairs}.` +
          (factor.corrections ? ` ${L.t("Uwzględnione korekty:")} ${factor.corrections}.` : '')
      };
    }
    return local;
  }

  function snapshot(rec, reps) {
    if (
      !rec ||
      rec.source !== 'transfer' ||
      !Number.isFinite(rec.weight) ||
      !(rec.sourceWeight > 0) ||
      !rec.sourceSessionId ||
      !rec.targetEquipmentId ||
      M.parseNumber(reps) !== rec.reps
    )
      return null;
    return {
      weight: rec.weight,
      reps: rec.reps,
      sourceWeight: rec.sourceWeight,
      sourceSessionId: rec.sourceSessionId,
      sourceEquipmentId: rec.sourceEquipmentId,
      targetEquipmentId: rec.targetEquipmentId
    };
  }

  function summarize(work, models, when) {
    const scales = new Map();
    let totalSets = 0,
      coveredSets = 0,
      bodyweightSets = 0,
      unloadedSets = 0,
      subtotal = 0,
      translatedSets = 0;
    let strength = null,
      reps = null,
      maxWeight = null,
      missingStrength = false,
      confidence = 'high';
    for (const { ex, key, set } of work) {
      const weight = load(set),
        count = repetitions(set);
      if (set.type !== 'drop') reps = Math.max(reps || 0, count);
      if (ex.type === 'bodyweight') {
        if (!(weight > 0)) {
          bodyweightSets++;
          continue;
        }
      } else if (weight === 0) {
        unloadedSets++;
        continue;
      }
      totalSets++;
      const model = models.get(ex.id);
      let scale = ex.type === 'bodyweight' ? 1 : null;
      if (ex.type !== 'bodyweight' && model && key) {
        if (!scales.has(key)) scales.set(key, conversion(model, key, model.anchor, when));
        const calibrated = scales.get(key);
        scale = calibrated?.ratio ?? null;
        if (calibrated && key !== model.anchor) {
          translatedSets++;
          if (levels[calibrated.confidence] < levels[confidence]) confidence = calibrated.confidence;
        }
      }
      const usable = ex.type !== 'bodyweight' && set.type !== 'drop' && count >= 3 && count <= 15;
      if (scale === null || !(weight > 0)) {
        if (usable) missingStrength = true;
        continue;
      }
      coveredSets++;
      subtotal += weight * count * scale;
      if (set.type !== 'drop') maxWeight = Math.max(maxWeight || 0, weight * scale);
      if (usable) strength = Math.max(strength || 0, ((weight * (30 + count)) / 40) * scale);
    }
    const partialVolume = coveredSets ? subtotal : null;
    const complete = totalSets > 0 && coveredSets === totalSets;
    return {
      totalSets,
      coveredSets,
      missingSets: totalSets - coveredSets,
      partial: coveredSets > 0 && coveredSets < totalSets,
      complete,
      bodyweightSets,
      unloadedSets,
      volume: partialVolume,
      partialVolume,
      strength: missingStrength ? null : strength,
      reps,
      maxWeight: complete ? maxWeight : null,
      translatedSets,
      confidence: coveredSets ? confidence : 'none'
    };
  }

  // Units: exercise value = best estimated 10-rep kg, or best reps for bodyweight.
  // Plan value = sum of each movement's anchored external kg × repetitions, only if complete.
  // volume / partialVolume always carry the known subtotal (null if no known weighted set).
  function series(state, id, kind) {
    const exercise = kind === 'exercise' ? state.exercises.find((ex) => ex.id === id) : null;
    const wanted = new Set();
    if (kind === 'exercise') wanted.add(id);
    else
      for (const s of state.sessions)
        if (s.planId === id) for (const row of s.exercises) wanted.add(row.exerciseId);
    const points = [];
    let coveredSets = 0,
      totalSets = 0,
      bodyweightSets = 0;
    const models = replay(state, wanted, Date.now(), (s, when, work, models) => {
      if ((kind === 'plan' && s.planId !== id) || (kind === 'exercise' && !work.length)) return;
      const stats = summarize(work, models, when);
      let value = stats.complete ? stats.volume : null;
      if (kind === 'exercise') value = exercise?.type === 'bodyweight' ? stats.reps : stats.strength;
      points.push({ id: s.id, when, gymId: s.gymId, value, ...stats });
      totalSets += stats.totalSets;
      coveredSets += stats.coveredSets;
      bodyweightSets += stats.bodyweightSets;
    });
    const m = models.get(id);
    return {
      points,
      anchorEquipmentId: m?.anchor || null,
      unit: exercise?.type === 'bodyweight' ? L.t("powt.") : 'kg',
      coveredSets,
      totalSets,
      missingSets: totalSets - coveredSets,
      bodyweightSets,
      corrections: m ? [...m.edges.values()].reduce((n, e) => n + e.corrections, 0) : 0
    };
  }

  // Use exactly the same chronological replay and aggregation as the plan charts.
  // A calendar day can request several sessions in a single pass; the rest of
  // the log still contributes the machine calibrations available on each date.
  function sessionSummaries(state, selectedSessions = state.sessions, now = Date.now()) {
    const ids = new Set(selectedSessions.map((session) => session.id));
    const wanted = new Set();
    for (const session of selectedSessions) for (const row of session.exercises) wanted.add(row.exerciseId);
    const result = new Map();
    if (!ids.size) return result;
    replay(state, wanted, timeOf(now), (session, when, work, models) => {
      if (ids.has(session.id)) result.set(session.id, summarize(work, models, when));
    });
    return result;
  }

  function sessionSummary(state, session, now = Date.now()) {
    if (!session) return summarize([], new Map(), timeOf(now));
    let source = state;
    if (session.finishedAt == null) {
      // An immutable preview of finishing now includes today's confirmed sets
      // in the calibration. Undoing a set removes that observation on the next replay.
      const provisional = { ...session, finishedAt: now };
      source = { ...state, sessions: [...state.sessions, provisional] };
    }
    return sessionSummaries(source, [session], now).get(session.id) || summarize([], new Map(), timeOf(now));
  }

  const api = {
    recommend,
    snapshot,
    sessionSummary,
    sessionSummaries,
    exerciseSeries: (state, id) => series(state, id, 'exercise'),
    planSeries: (state, id) => series(state, id, 'plan')
  };
  M.recommend = recommend;
  global.GymAnalytics = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
