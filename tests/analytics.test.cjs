'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const path = require('node:path'), fs = require('node:fs');
const assets = fs.existsSync(path.join(__dirname,'../app/model.js')) ? '../app' : '../app/src/main/assets';
const M = require(assets + '/model.js'), A = require(assets + '/analytics.js');
const DAY = 86400000;
const start = Date.UTC(2025,0,1,12);
function fixture(exerciseId='chest-press') {
  const state = require('./legacy-diary.cjs').seedLegacyDiary(M.createState());
  const a = M.ensureEquipment(state,'alchemia',exerciseId,'Stanowisko A',0.25);
  const b = M.ensureEquipment(state,'suchanino',exerciseId,'Stanowisko B',0.25);
  function add(day,eq,kg,reps=10,extras={},planId='upper-a') {
    const when = start + day*DAY;
    const session = {id:'s-'+state.sessions.length, name:'Trening testowy',planId,gymId:eq.gymId,startedAt:when-3600000,
      finishedAt:when,exercises:[{exerciseId:eq.exerciseId,equipmentId:eq.id,sets:[{weight:kg,reps,done:true,...extras}]}]};
    state.sessions.push(session);
    return session;
  }
  function rec(eq,day,reps=10) {
    return M.recommend(state,{exerciseId:eq.exerciseId,equipmentId:eq.id,gymId:eq.gymId,reps,now:start+day*DAY});
  }
  return {state,a,b,add,rec,exerciseId};
}
const close = (actual,expected,tolerance=0.0001) => assert.ok(Math.abs(actual-expected) <= tolerance,`${actual} != ${expected}`);

test('35/70 example produces a single cross-gym timeline and volume on the same scale',()=>{
 const {state,a,b,add,exerciseId}=fixture();
 add(0,a,35); add(1,b,70); add(9,b,80);
 const series=A.exerciseSeries(state,exerciseId), plan=A.planSeries(state,'upper-a');
 assert.equal(series.anchorEquipmentId,a.id);
 assert.deepEqual(series.points.map(p=>Math.round(p.value)),[35,35,40]);
 assert.deepEqual(plan.points.map(p=>Math.round(p.value)),[350,350,400]);
 assert.equal(plan.coveredSets,3);
});
test('normalized tonnage sums actual repetitions and handles drop sets separately from strength',()=>{
 const {state,a,b,add}=fixture();add(0,a,40);add(1,b,80);
 const s=add(8,b,88,8);
 s.exercises[0].sets.push({done:true,type:'drop',weight:56,reps:15},
   {done:true,type:'warmup',weight:500,reps:20},{done:false,weight:400,reps:30});
 const p=A.planSeries(state,'upper-a').points.at(-1);
 close(p.value,0.5*(88*8+56*15)); assert.equal(p.totalSets,2);
 close(A.exerciseSeries(state,a.exerciseId).points.at(-1).value,44*38/40);
});
test('all history calibrates plan points, without joining unrelated plans or moving earlier values',()=>{
 const {state,a,b,add}=fixture();
 add(0,a,35,10,{},null);add(1,b,70,10,{},'full-body');add(10,b,80);
 const snapshot=JSON.stringify(A.planSeries(state,'upper-a').points);
 add(11,a,47.5,10,{},'full-body');add(18,b,90);
 assert.deepEqual(JSON.parse(snapshot),A.planSeries(state,'upper-a').points.slice(0,1));
 assert.equal(A.planSeries(state,'upper-a').points.length,2);
});
test('strict coverage: unknown machine yields a gap, partial session retains its subtotal',()=>{
 const {state,a,b,add}=fixture();
 add(0,a,35);add(40,b,70);
 const row=M.ensureEquipment(state,'suchanino','seated-row');
 const mixed=add(41,row,20,5);
 mixed.exercises.push({exerciseId:a.exerciseId,equipmentId:b.id,sets:[{done:true,weight:72.5,reps:10}]});
 const points=A.planSeries(state,'upper-a').points;
 assert.equal(points[1].value,null);assert.equal(points[1].missingSets,1);
 assert.equal(points[2].value,null);assert.equal(points[2].volume,100);assert.equal(points[2].partial,true);
 assert.equal(points[2].totalSets,2);assert.equal(points[2].coveredSets,1);
});
test('bodyweight progress uses reps, only added physical load enters plan tonnage',()=>{
 const {state,a,b,add}=fixture('push-up');
 add(0,a,0,12);add(1,b,0,15);const s=add(2,a,10,8);
 s.exercises[0].sets.push({done:true,weight:0,reps:10});
 const e=A.exerciseSeries(state,a.exerciseId),p=A.planSeries(state,'upper-a');
 assert.equal(e.unit,'powt.');assert.deepEqual(e.points.map(x=>x.value),[12,15,10]);
 assert.equal(p.points[0].bodyweightSets,1);assert.equal(p.points[0].value,null);
 assert.equal(p.points[2].value,80);assert.equal(p.points[2].bodyweightSets,1);
});
test('corrections recorded when user types own outcome improve later predictions, survive backup',()=>{
 const {state,a,b,add,rec}=fixture();
 add(0,a,35);add(1,b,70);add(7,b,80);
 const before=rec(a,8);
 assert.equal(before.weight,40);const guess=A.snapshot(before,10);
 assert.equal(guess.sourceSessionId,state.sessions[2].id);
 assert.equal(A.snapshot(before,8),null);
 add(8,a,45,10,{prediction:guess});add(12,b,82);
 const after=rec(a,13);
 assert.ok(after.weight>41&&after.weight<=82*(45/80));
 assert.equal(after.correctionCount,1);
 assert.equal(after.pairs,2);
 close(A.recommend(JSON.parse(JSON.stringify(state)),{exerciseId:a.exerciseId,equipmentId:a.id,gymId:a.gymId,reps:10,now:start+13*DAY}).weight,after.weight);
});
test('one bad input produces only a bounded correction and cannot multiply independent votes',()=>{
 const {state,a,b,add,rec}=fixture(); add(0,a,35);add(1,b,70);add(7,b,80);
 const guess=A.snapshot(rec(a,7.2),10);
 const s=add(8,a,9000,10,{prediction:guess});
 for(let i=0;i<9;i++)s.exercises[0].sets.push({...s.exercises[0].sets[0]});
 add(9,b,80);
 const result=rec(a,10);
 assert.ok(result.weight>40&&result.weight<=49);
 assert.equal(result.pairs,2);assert.equal(result.correctionCount,1);
 assert.equal(A.exerciseSeries(state,a.exerciseId).corrections,1);
});
test('older states learn from manually recorded workouts without a suggestion snapshot',()=>{
 const {a,b,add,rec}=fixture();add(0,a,35);add(1,b,70);add(9,b,80);assert.equal(rec(a,10).weight,40);
 add(10,a,45);add(20,b,80);
 const next=rec(a,21);assert.ok(next.weight>40);assert.equal(next.correctionCount,0);
});
test('forged, mismatched and warmup prediction snapshots cannot alter feedback counts',()=>{
 const {a,b,add,rec}=fixture();add(0,a,35);add(1,b,70);add(7,b,80);
 const snapshot=A.snapshot(rec(a,7.5),10);
 const s=add(8,a,45,10,{prediction:{...snapshot,sourceSessionId:'missing'}});
 s.exercises[0].sets.push({done:true,weight:42,reps:10,type:'warmup',prediction:snapshot},
   {done:true,weight:45,reps:8,prediction:snapshot});
 add(11,b,85);assert.equal(rec(a,12).correctionCount,0);
});
test('an intermediate machine may connect two gyms with no near-date direct calibration',()=>{
 const {state,a,b,add}=fixture();
 state.gyms.push({id:'gym-c',name:'Trzecia siłownia'});const c=M.ensureEquipment(state,'gym-c',a.exerciseId);
 add(0,a,40);add(1,b,80);add(29,b,88);add(30,c,110);add(39,c,125);
 const s=A.exerciseSeries(state,a.exerciseId);close(s.points.at(-1).value,50);
});
test('incompatible sets, users switching exercise and legacy unknown machine IDs retain a gap',()=>{
 const {state,a,b,add}=fixture();add(0,a,35,8,{rir:5});add(1,b,70,10,{rir:0});
 const prior=add(2,b,80,10);prior.exercises[0].equipmentId='';
 const ps=A.exerciseSeries(state,a.exerciseId).points;
 assert.equal(ps[1].value,null);assert.equal(ps[2].value,null);
});
test('calibration expires while retaining the previously measured points',()=>{
 const {state,a,b,add}=fixture();add(0,a,35);add(1,b,70);add(250,b,90);
 const ps=A.exerciseSeries(state,a.exerciseId).points;
 close(ps[1].value,35);assert.equal(ps[2].value,null);
});
test('same-session profiles have independent histories, and unfinished live session is excluded',()=>{
 const {state,a,add}=fixture();
 const c=M.ensureEquipment(state,a.gymId,a.exerciseId,'Inna maszyna',2.5);
 const s=add(0,a,30);s.exercises.push({exerciseId:a.exerciseId,equipmentId:c.id,sets:[{weight:60,reps:10,done:true}]});
 state.active={...s,id:'not-finished',finishedAt:undefined};const result=A.planSeries(state,'upper-a');
 assert.equal(result.points.length,1);close(result.points[0].value,600);
});
