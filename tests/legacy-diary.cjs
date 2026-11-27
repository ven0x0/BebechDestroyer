'use strict';

function seedLegacyDiary(state) {
  function plan(id, name, rows) {
    return { id, name, exercises: rows.map(([exerciseId, sets, reps]) => ({ exerciseId, sets, reps })) };
  }
  state.gyms = [
    { id: 'alchemia', name: 'Zdrofit Alchemia' },
    { id: 'suchanino', name: 'Zdrofit Suchanino' }
  ];
  state.plans = [
    plan('upper-a', 'Góra ciała A', [
      ['chest-press', 3, 10],
      ['lat-pulldown', 3, 10],
      ['seated-row', 3, 10],
      ['lateral-raise', 3, 12],
      ['triceps-pushdown', 2, 12],
      ['dumbbell-curl', 2, 12]
    ]),
    plan('lower-a', 'Dół ciała A', [
      ['leg-press', 3, 10],
      ['romanian-deadlift', 3, 8],
      ['leg-curl', 3, 12],
      ['leg-extension', 2, 12],
      ['calf-raise', 3, 12]
    ]),
    plan('full-body', 'Całe ciało', [
      ['goblet-squat', 3, 10],
      ['dumbbell-press', 3, 10],
      ['seated-row', 3, 10],
      ['hip-thrust', 3, 10],
      ['cable-crunch', 3, 12]
    ])
  ];
  return state;
}

module.exports = { seedLegacyDiary };
