'use strict'

const fs = require('node:fs/promises')
const path = require('node:path')
const http = require('node:http')
const { spawn } = require('node:child_process')
const assert = require('node:assert/strict')

const assetRoot = require('node:fs').existsSync(path.resolve(__dirname,'../app/model.js')) ? '../app' : '../app/src/main/assets'
const app = path.resolve(__dirname, assetRoot)
const qa = path.resolve(__dirname, '../qa')
const edge = process.env.ROZSTAW_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const mime = { '.js':'text/javascript', '.html':'text/html', '.css':'text/css', '.jpg':'image/jpeg', '.ttf':'font/ttf', '.png':'image/png' }

async function until(predicate, description, timeout = 12000) {
  const end = Date.now() + timeout
  while (Date.now() < end) {
    const result = await predicate()
    if (result) return result
    await sleep(100)
  }
  throw new Error('Timed out waiting for ' + description)
}

function staticServer() {
  return http.createServer(async (req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname)
    if (pathname.startsWith('/__qa/')) {
      if (pathname === '/__qa/report' && req.method === 'POST') {
        let report = ''
        for await (const chunk of req) if (report.length < 64000) report += chunk
        await fs.writeFile(path.join(qa, 'browser-report.json'), report)
        console.log(report.slice(-2500))
        res.writeHead(204); res.end(); return
      }
      const mode = pathname.slice('/__qa/'.length)
      const html = '<!doctype html><meta charset="utf-8"><title>Rozstaw · Test</title><style>body{background:#272a28;color:white;font:15px system-ui;margin:0}iframe{border:0;display:block;margin:0 auto}pre{position:fixed;left:4px;top:0;max-width:24vw;white-space:pre-wrap}</style><iframe id="frame" width="390" height="844" src="/"></iframe><pre id="trace"></pre><script>(' +
        frameRunner.toString() + ')(' + JSON.stringify(mode) + ',' + scenarios.toString() + ')</script>'
      res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});res.end(html);return
    }
    if (pathname === '/favicon.ico') { res.writeHead(204); res.end(); return }
    const file = path.resolve(app, '.' + (pathname === '/' ? '/index.html' : pathname))
    if (!file.startsWith(app + path.sep)) { res.writeHead(403); res.end(); return }
    try {
      const data = await fs.readFile(file)
      res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store',
        'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'none'; object-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'" })
      res.end(data)
    } catch { res.writeHead(404); res.end() }
  })
}

async function connect(socketUrl) {
  const socket = new WebSocket(socketUrl)
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, {once:true})
    socket.addEventListener('error', reject, {once:true})
  })
  const pending = new Map()
  const events = []
  let next = 0
  socket.addEventListener('message', ({data}) => {
    const record = JSON.parse(data)
    if (record.id) {
      const p = pending.get(record.id)
      if (!p) return
      pending.delete(record.id)
      if (record.error) p.reject(new Error(record.error.message))
      else p.resolve(record.result)
    } else events.push(record)
  })
  return {
    events,
    send(method, params = {}) {
      return new Promise((resolve, reject) => {
        pending.set(++next, {resolve, reject})
        socket.send(JSON.stringify({id:next, method, params}))
      })
    },
    close() { socket.close() }
  }
}

async function run() {
  await fs.mkdir(qa, {recursive:true})
  const profile = await fs.mkdtemp(path.join(qa, 'edge-'))
  const server = staticServer()
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const previewFlag = process.argv.indexOf('--preview');
  const url = previewFlag >= 0
    ? require('node:url').pathToFileURL(path.resolve(process.argv[previewFlag+1])).href
    : 'http://127.0.0.1:' + server.address().port + '/';
  const args = ['--headless=new', '--disable-gpu', '--remote-debugging-port=0', '--no-first-run',
    '--disable-background-networking', '--disable-sync', '--disable-component-update', '--disable-extensions',
    '--disable-breakpad', '--disable-crash-reporter', '--disable-crashpad-for-testing',
    '--user-data-dir=' + profile, 'about:blank']
  if (process.argv.includes('--log')) args.unshift('--enable-logging=stderr','--v=1')
  // The portable test engine serves this process's loopback-only test fixture.
  if (process.argv.includes('--portable-shell')) args.unshift('--no-sandbox')
  const localTemp = path.join(profile,'temp')
  await fs.mkdir(localTemp)
  const browser = spawn(edge, args, { windowsHide:true, stdio:['ignore','ignore','pipe'],
    env:{...process.env, TEMP:localTemp, TMP:localTemp} })
  let errors = ''
  let cdp
  browser.stderr.on('data', chunk => { errors = (errors + chunk).slice(-4000) })
  try {
    const port = await until(async () => {
      if (browser.exitCode != null) throw new Error('Edge exit ' + browser.exitCode + ' ' + errors)
      try { return (await fs.readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')).split(/\r?\n/)[0] } catch { return false }
    }, 'Edge debugging port. ' + profile, 25000)
    const tabs = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json()
    const tab = tabs.find(x => x.type === 'page')
    cdp = await connect(tab.webSocketDebuggerUrl)
    await cdp.send('Page.enable')
    await cdp.send('Runtime.enable')
    await cdp.send('Log.enable')
    const evaluate = async expression => {
      const result = await cdp.send('Runtime.evaluate', {expression, returnByValue:true, awaitPromise:true})
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text)
      return result.result.value
    }
    async function setSize(width,height) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {width,height,deviceScaleFactor:1,mobile:width<700})
    }
    const action = async selector => {
      const q = JSON.stringify(selector)
      await until(() => evaluate('Boolean(document.querySelector(' + q + '))'), selector)
      await evaluate('document.querySelector(' + q + ').click()')
    }
    const input = async (selector, value) => {
      const q = JSON.stringify(selector)
      await until(() => evaluate('Boolean(document.querySelector(' + q + '))'), selector)
      await evaluate('(()=>{const el=document.querySelector(' + q + ');el.value=' + JSON.stringify(value) + ';el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}))})()')
    }
    const waitText = text => until(() => evaluate('document.body.innerText.includes(' + JSON.stringify(text) + ')'), text)
    async function shot(name) {
      await evaluate('document.fonts.ready.then(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))')
      const image = await cdp.send('Page.captureScreenshot', {format:'png'})
      await fs.writeFile(path.join(qa, name + '.png'), Buffer.from(image.data, 'base64'))
    }
    async function fits(label) {
      const sizes = await evaluate('({scroll:document.documentElement.scrollWidth, viewport:innerWidth, client:document.documentElement.clientWidth})')
      assert.ok(sizes.scroll <= sizes.client + 1, label + ': horizontal overflow ' + JSON.stringify(sizes))
    }
    async function reload() {
      await cdp.send('Page.reload', {ignoreCache:true})
      await until(() => evaluate('document.readyState === "complete" && Boolean(document.querySelector("#content h1"))'), 'render after reload')
    }
    const helpers = {cdp, evaluate, setSize, action, input, waitText, shot, fits, reload}
    if (process.argv.includes('--probe')) {
      console.log('Headless Edge connected with the browser sandbox enabled.')
      return
    }
    await setSize(390,844)
    await cdp.send('Page.navigate', {url})
    await until(() => evaluate('document.readyState === "complete" && Boolean(document.querySelector("#content h1"))'), 'render home')
    await scenarios(helpers)
    assert.ok(await evaluate('(' + extendedChecks.toString() + ')()'))
    const learning = await evaluate('(' + v11scenarios.toString() + ')()');
    console.log('Verified integrated correction', learning);
    await setSize(390,844); await fits('Exercise detail mobile'); await shot('exercise-v11-mobile');
    await setSize(1366,900); await fits('Exercise detail desktop'); await shot('exercise-v11-desktop');
    await v12Checks(helpers);
    await updateControls(helpers);
    const exceptions = cdp.events.filter(e => e.method === 'Runtime.exceptionThrown' ||
      e.method === 'Log.entryAdded' && e.params.entry.level === 'error')
    assert.deepEqual(exceptions, [], JSON.stringify(exceptions, null, 2))
    console.log('Headless browser checks passed. Screenshots in ' + qa)
  } catch (error) {
    if (cdp) {
      const result = await cdp.send('Runtime.evaluate', { expression:'document.body?.innerText.slice(0,4500)',returnByValue:true }).catch(() => null)
      console.error('Last visible screen:', result?.result?.value)
      console.error('Runtime errors:', cdp.events.filter(e => e.method === 'Runtime.exceptionThrown' || e.method === 'Log.entryAdded').slice(-6))
    }
    if (errors) console.error('Edge stderr:', errors)
    throw error
  } finally {
    if (cdp) {
      cdp.send('Browser.close').catch(()=>{})
      cdp.close()
    }
    if (browser.exitCode == null) browser.kill()
    server.close()
  }
}

async function scenarios({evaluate, setSize, action, input, waitText, shot, fits, reload}) {
  function check(value, message) { if (!value) throw new Error(message) }
  const act = (name, suffix = '') => action('[data-action="' + name + '"]' + suffix)
  const root = (name,suffix='') => action('[data-r="' + name + '"]' + suffix)
  await waitText('Rozpocznij trening')
  await fits('Home 390')
  await shot('home-mobile')
  await setSize(1280,900)
  await fits('Home 1280')
  await shot('home-desktop')
  await setSize(360,780)
  await fits('Home 360')
  await root('go','[data-v="plans"]')
  await waitText('Plany treningowe')
  await act('open-plan','[data-id="upper-a"]')
  await waitText('Góra ciała A')
  await act('start-plan')
  await waitText('Trening w toku')
  await shot('active-mobile')
  await fits('Workout 360')
  await input('[data-input="weight"][data-row="0"][data-set="0"]','35')
  await act('toggle-set','[data-row="0"][data-set="0"]')
  check(await evaluate('Rozstaw.state.active.exercises[0].sets[0].done'), 'Set was not confirmed')
  await reload()
  await root('start')
  await waitText('Trening w toku')
  check(await evaluate('document.querySelector("[data-input=weight]").value === "35"'), 'Lost set on reload')
  await act('finish')
  await act('save-workout')
  await waitText('Trening zapisany')
  check(await evaluate('Rozstaw.state.sessions.length === 1 && !Rozstaw.state.active'), 'Missing finished session')
  await reload()
  await root('go','[data-v="history"]')
  await waitText('Góra ciała A')
  await root('historyDetail')
  await waitText('35 kg × 10')
  const calibration = await evaluate('(' + function() {
    const M = window.GymModel, data = window.Rozstaw.state
    const x = M.getEquipment(data,'alchemia','chest-press')[0]
    const y = M.ensureEquipment(data,'suchanino','chest-press','Porównawcza maszyna',5)
    const now = Date.now()
    const first = data.sessions[0]
    first.startedAt = now - 10 * 86400000 - 3600000
    first.finishedAt = now - 10 * 86400000
    for (const [age,kg] of [[9,70],[1,80]]) {
      data.sessions.push({id:M.uid(),name:'Porównanie',gymId:'suchanino',planId:null,
        startedAt:now-age*86400000-3600000, finishedAt:now-age*86400000,
        exercises:[{exerciseId:'chest-press',equipmentId:y.id,sets:[{done:true,weight:kg,reps:10,type:'normal'}]}]})
    }
    Rozstaw.save()
    return M.recommend(data,{gymId:'alchemia',exerciseId:'chest-press',equipmentId:x.id,reps:10})
  }.toString() + ')()')
  check(calibration.weight === 40 && calibration.source === 'transfer', 'Wrong transfer estimate')
  await root('go','[data-v="home"]')
  await root('start')
  await waitText('Przeliczenie między maszynami')
  await act('apply-rec','[data-row="0"]')
  check(await evaluate('Number(document.querySelector("[data-input=weight]").value) === 40'), 'Suggestion not applied')
  await root('go','[data-v="progress"]')
  await fits('Progress 360')
  await shot('progress-mobile')
  await root('go','[data-v="settings"]')
  await waitText('Kopia')
  const roundtrip = await evaluate('(' + function() {
    const current = JSON.parse(localStorage.getItem(Rozstaw.key))
    if (!GymModel.validateState(current)) return false
    Rozstaw.restore(current)
    return Rozstaw.state.sessions.length === 3 && Number(Rozstaw.state.active.exercises[0].sets[0].weight) === 40
  }.toString() + ')()')
  check(roundtrip, 'Backup restore did not preserve history and active session')
}

function extendedChecks(){
 const w=window,d=document,s=Rozstaw.state,M=GymModel;
 const check=(condition,message)=>{if(!condition)throw Error(message)};
 const find=q=>{const el=d.querySelector(q);if(!el)throw Error('Missing UI '+q);return el};
 const act=(a,tail='')=>find('[data-action="'+a+'"]'+tail).click();
 const cmd=(a,tail='')=>find('[data-r="'+a+'"]'+tail).click();
 const set=(q,v,ev='input')=>{const el=find(q);el.value=v;el.dispatchEvent(new Event(ev,{bubbles:true}))};
 const row='[data-row="0"]',row2='[data-row="1"]',first=row+'[data-set="0"]';
 // Continue a live workout on a second machine, then substitute a different exercise.
 Rozstaw.go('workout');act('toggle-set',first);const before=s.active.exercises[0].equipmentId;
 act('equipment',row);act('new-equipment');set('[data-value="equipment-name"]','Przy oknie');act('create-equipment');
 check(s.active.exercises[0].equipmentId===before&&s.active.exercises[0].sets.length===1,'History moved to a new machine');
 check(s.active.exercises[1].equipmentId!==before&&s.active.exercises[1].sets[0].weight==='','Pending load leaked to other equipment');
 act('pick-swap',row2);act('choose-exercise','[data-id="dumbbell-press"]');
 check(s.active.exercises[1].exerciseId==='dumbbell-press'&&s.active.exercises[0].sets[0].weight===40,'Replacement changed original set');
 act('exercise-menu',row);act('workout-group',row);check(s.active.exercises[0].supersetId===s.active.exercises[1].supersetId&&s.active.exercises[0].supersetId,'Group missing');
 set('[data-input="weight"]'+row2+'[data-set="0"]','16');act('toggle-set',row2+'[data-set="0"]');act('finish');act('save-workout');
 check(s.sessions.at(-1).exercises.length===2&&s.sessions.at(-1).exercises.every(x=>x.supersetId),'Superset lost in history');
 // Create a fourth plan, group movements, preserve discard protection across root navigation.
 Rozstaw.go('editPlan');set('[data-input="plan-name"]','Nowy plan testowy');act('pick-plan');act('choose-exercise','[data-id="chest-press"]');act('pick-plan');act('choose-exercise','[data-id="seated-row"]');act('plan-group',row);act('save-plan');check(s.plans.length===4&&s.plans.at(-1).exercises[0].supersetId,'Plan not saved');
 act('edit-plan');set('[data-input="plan-name"]','Zmiana do odrzucenia');Rozstaw.go('catalogue');find('[data-action="discard-editor"]').click();check(Rozstaw.view==='catalogue'&&s.plans.at(-1).name==='Nowy plan testowy','Discard redirection failed');
 // Add custom movement and body measurement.
 cmd('custom');set('#custom-name','Wiosłowanie test');set('#custom-related','seated-row','change');find('#custom-form').requestSubmit();check(s.exercises.at(-1).pattern==='horizontal-pull','Custom substitution group missing');
 Rozstaw.go('progress');cmd('showmeasures');cmd('addmeasure');set('#measure-value','82,5');find('#measure-form').requestSubmit();check(s.measurements[0].value===82.5,'Body measurement missing');
 // Invalid restore leaves current data in place. A valid native-bridge payload shows a confirmation.
 const base=JSON.stringify(s);w.receiveBackup('{"version":1}');check(JSON.stringify(s)===base&&find('#overlay').hidden,'Invalid backup modified state');
 let exported='';w.AndroidBackup={save:raw=>{exported=raw},open:()=>w.receiveBackup(exported)};
 Rozstaw.go('settings');cmd('export');check(M.validateState(JSON.parse(exported)),'Exported state fails validation');
 cmd('import');check(!find('#overlay').hidden,'Restore missing confirmation');cmd('close');check(s.sessions.length===4,'Cancel replaced data');
 cmd('import');cmd('restore');check(Rozstaw.state.measurements[0].value===82.5&&Rozstaw.state.plans.length===4,'Successful restore lost records');
 // Backdated three-session calibration, entered through the actual form, for a fresh custom lift.
 const custom=Rozstaw.state.exercises.at(-1);Rozstaw.go('calc');set('#calc-ex',custom.id,'change');
 for(const [gym,kg,ago] of [['alchemia','35',18],['suchanino','70',17],['suchanino','80',1]]){
  set('#calc-gym',gym,'change');cmd('manual');set('#manual-kg',kg);const t=new Date(Date.now()-ago*86400000);set('#manual-at',new Date(t.getTime()-t.getTimezoneOffset()*60000).toISOString().slice(0,16));find('#manual-form').requestSubmit();check(find('#overlay').hidden,'Manual record rejected');
 }
 set('#calc-gym','alchemia','change');check(find('.result .weight').textContent.includes('40'),'No transfer for manually entered history');
 cmd('example');set('#demo-kg','90','change');check(find('#overlay .info').textContent.includes('45 kg'),'Live example incorrect');cmd('close');
 Rozstaw.go('progress',{kind:'exercise',id:custom.id});check(!d.querySelector('#prog-gym'),'Normalized view asks for a gym');check(find('#content').textContent.includes('40 kg'),'Normalized chart missing latest increase');
 check(M.validateState(Rozstaw.state),'End-of-test state fails model validation');
 return true;
}
function v11scenarios(){
const A=Rozstaw,M=GymModel,s=M.createState(),d=document;
const add=(s,id,p,kg,reps,days)=>{const t=Date.now()-days*86400000;s.sessions.push({id,name:'Plan porównawczy',gymId:p.gymId,planId:'upper-a',startedAt:t-1000,finishedAt:t,exercises:[{exerciseId:'chest-press',equipmentId:p.id,sets:[{weight:kg,reps,done:true,type:'normal'}]}]})};
const check=(c,msg)=>{if(!c)throw Error(msg)},find=q=>{const el=d.querySelector(q);check(el,'Missing '+q);return el};
const set=(q,v,event='input')=>{const el=find(q);el.value=v;el.dispatchEvent(new Event(event,{bubbles:true}))};
const act=(a,tail='')=>find('[data-action="'+a+'"]'+tail).click(),cmd=(r,tail='')=>find('[data-r="'+r+'"]'+tail).click();
const a=M.ensureEquipment(s,'alchemia','chest-press','Stanowisko przy oknie',2.5),b=M.ensureEquipment(s,'suchanino','chest-press','Stanowisko przy lustrze',5);
add(s,'a',a,35,10,12);add(s,'b',b,70,10,11);add(s,'c',b,80,10,3);
A.restore(s);A.go('progress',{kind:'plan',id:'upper-a'});
check(d.querySelectorAll('.pg-line circle').length===3,'Plan missing comparable sessions');
check(find('.pg-values strong').textContent.trim()==='400 kg','Plan failed to normalize gym totals');
A.go('plan',{id:'upper-a'});check(find('[data-pg-kind=plan] .pg-values strong').textContent.trim()==='400 kg','No chart on plan card');
find('[data-action=navigate][data-page=exercise][data-id=chest-press]').click();
check(find('[data-pg-kind=exercise] .pg-values strong').textContent.trim()==='40 kg','Exercise failed to normalize');
find('.atlas-muscle').click();check(find('.atlas-muscle').getAttribute('aria-pressed')==='true','Map did not highlight');
cmd('language');cmd('setLanguage','[data-id=en]');check(find('.pagehead h1').textContent==='Machine Chest Press','Name not translated');
A.go('catalogue');set('#ex-query','Wyciskanie na maszynie');check(find('#ex-rows').textContent.includes('Machine Chest Press'),'Search Polish alias when displaying English');
A.go('plans');act('import-plans');const json=JSON.stringify({name:'Test JSON 5–8',exercises:[{name:'Chest Press',sets:2,reps:'5-8'}]});set('[data-value=json]',json);act('review-import');act('commit-import');
const p=s.plans.at(-1);check(p.exercises[0].repsMin===5&&p.exercises[0].repsMax===8,'Imported range lost');const backup=JSON.parse(JSON.stringify(s));check(M.validateState(backup)&&backup.exerciseLanguage==='en','Backup missing new fields');
A.go('plan',{id:p.id});act('start-plan');const row='[data-row="0"][data-set="0"]';set('[data-input=weight]'+row,'45');set('[data-input=reps]'+row,'10');act('toggle-set',row);
const logged=s.active.exercises[0].sets[0];check(logged.prediction?.weight===40&&logged.weight===45,'Actual and suggested weights not captured independently');
act('finish');act('save-workout');const corrected=s.sessions.at(-1);check(corrected.exercises[0].sets[0].prediction?.weight===40,'Logged correction lost');
const now=Date.now(),recent=s.sessions.at(-1);recent.startedAt=now-2*86400000-1000;recent.finishedAt=now-2*86400000;add(s,'fresh-y',b,80,10,1);
const revised=M.recommend(s,{exerciseId:'chest-press',gymId:'alchemia',equipmentId:a.id,reps:10});
check(revised.correctionCount>0&&revised.weight>40&&revised.weight<=45,'Recommendation did not learn actual result: '+JSON.stringify(revised));
A.go('exercise',{id:'chest-press'});check(s.exerciseLanguage==='en','Language preference lost');
return {old:40,actual:45,next:revised.weight};
}
async function v12Checks({evaluate,setSize,action,input,shot,fits}) {
  const seed = function () {
    const M=GymModel,s=M.createState();
    const a=M.ensureEquipment(s,'alchemia','chest-press','Maszyna A',2.5),b=M.ensureEquipment(s,'suchanino','chest-press','Maszyna B',5);
    function save(id,date,profile,kg,extra=false){
      const rows=[{exerciseId:'chest-press',equipmentId:profile.id,sets:[{weight:kg,reps:10,done:true,type:'normal'}]}];
      if(extra)rows.push({exerciseId:'push-up',equipmentId:null,sets:[{weight:0,reps:12,done:true,type:'normal'}]});
      s.sessions.push({id,planId:'upper-a',gymId:profile.gymId,name:'Trening '+id,startedAt:+date-30*60e3,finishedAt:+date,exercises:rows});
    }
    save('A',new Date(2024,1,20,10),a,35);save('B',new Date(2024,1,21,10),b,70);save('rano',new Date(2024,1,22,7),b,80,true);save('wieczór',new Date(2024,1,22,20),a,35);
    const now=Date.now();
    save('nowa-A',new Date(now-9*864e5),a,35);save('nowa-B',new Date(now-8*864e5),b,70);
    s.uiGym='suchanino';Rozstaw.restore(s);
  };
  await setSize(390,844);
  await evaluate('('+seed.toString()+')()');
  await action('.cal-home-actions [data-v="calendar"]');
  await input('#cal-month','2024-02');
  await action('[data-cal-day="2024-02-22"]');
  assert.equal(await evaluate('document.querySelectorAll(".cal-session").length'),2);
  assert.equal(await evaluate('document.querySelector(".cal-volume b").textContent'),'750 kg');
  assert.equal(await evaluate('document.querySelector(".cal-set").textContent'),'80 kg × 10');
  assert.ok(await evaluate('document.querySelector("#cal-detail").textContent.includes("12 powt.")'));
  await fits('Calendar on phone');await evaluate('window.scrollTo(0,0)');await shot('calendar-v12-mobile');
  await setSize(1280,900);await fits('Calendar on desktop');await shot('calendar-v12-desktop');
  await input('#cal-filter','push-up');
  assert.equal(await evaluate('document.querySelectorAll(".cal-session").length'),1);
  assert.equal(await evaluate('document.querySelector(".cal-volume b").textContent'),'0 kg');
  assert.deepEqual(await evaluate('[...document.querySelectorAll(".cal-summary b")].map(x=>x.textContent)'),['1','1','12']);
  await action('.cal-session-head');await action('[data-action="return-calendar"]');
  assert.equal(await evaluate('document.querySelector("#cal-filter").value'),'push-up');
  await action('.cal-ex [data-r="exdetail"]');await action('[data-pg="section"][data-val="technique"]');
  await action('[data-pg="back"]');assert.equal(await evaluate('document.querySelector("#cal-filter").value'),'push-up');
  await action('[data-cal="prev"]');assert.equal(await evaluate('document.querySelector("#cal-month").value'),'2024-01');
  await action('[data-cal="latest"]');assert.equal(await evaluate('document.querySelector("#cal-month").value'),'2024-02');
  await setSize(390,844);
  await evaluate("Rozstaw.go('plan',{id:'upper-a'})");
  await action('[data-action="start-plan"]');
  await input('[data-input="weight"][data-row="0"][data-set="0"]','80');
  await input('[data-input="reps"][data-row="0"][data-set="0"]','10');
  await action('[data-action="toggle-set"][data-row="0"][data-set="0"]');
  assert.equal(await evaluate('document.querySelector("[data-live-volume]").textContent'),'400');
  assert.equal(await evaluate('document.querySelector("[data-live-sets]").textContent'),'1');
  await evaluate('window.scrollTo(0,650)');
  await until(()=>evaluate('Math.abs(document.querySelector(".tr-live-metrics").getBoundingClientRect().top)<2'),'pinned workout metrics');
  await evaluate('window.scrollTo(0,0)');
  const initialClock=await evaluate('document.querySelector("[data-elapsed]").textContent');
  await until(()=>evaluate(`document.querySelector('[data-elapsed]').textContent!==${JSON.stringify(initialClock)}`),'live clock',4000);
  await action('[data-action="muscle-mode"][data-mode="performed"]');
  assert.ok(await evaluate('document.querySelector("[data-live-map] .atlas-muscle")!==null'));
  await evaluate('window.scrollTo(0,0)');await fits('Workout stats and body map');await shot('active-v12-mobile');
  await action('[data-action="toggle-set"][data-row="0"][data-set="0"]');
  assert.equal(await evaluate('document.querySelector("[data-live-volume]").textContent'),'0');
  await action('[data-action="toggle-set"][data-row="0"][data-set="0"]');
  await action('[data-section="technique"][data-id="chest-press"]');
  assert.equal(await evaluate('document.querySelectorAll(".guide-steps li").length'),3);
  const pose=()=>evaluate('document.querySelector(".dm-scene").innerHTML');
  await action('[data-demo-action="start"]');const beginning=await pose();await action('[data-demo-action="end"]');assert.notEqual(await pose(),beginning);
  await action('[data-demo-action="speed"]');await action('[data-demo-action="play"]');
  const old=await pose();await until(async()=>old!==await pose(),'animated pose',2500);await action('[data-demo-action="play"]');
  await input('[data-demo-seek]','33');const still=await pose();await sleep(140);assert.equal(await pose(),still);
  await evaluate('window.scrollTo(0,0)');await fits('Technique on phone');await shot('technique-v12-mobile');
  await setSize(1280,900);await fits('Technique on desktop');await shot('technique-v12-desktop');
  await action('[data-pg="back"]');assert.equal(await evaluate('document.querySelector("[data-live-volume]").textContent'),'400');
  await action('[data-action="finish"]');await action('[data-action="save-workout"]');
  assert.ok(await evaluate('document.querySelector(".tr-stats").textContent.includes("400")'));
  console.log('Verified calendar, multiple sessions/day, live calibrated load, clock, working-set undo, muscle map, demonstration controls and return to workout.');
}

async function updateControls({ evaluate, setSize, fits, action }) {
  await evaluate("Rozstaw.go('home')");
  for (const width of [320, 360]) {
    await setSize(width, 760);
    await fits('Brand and gym selector ' + width);
    assert.ok(await evaluate(`(() => {
      const brand = document.querySelector('.mobilebrand');
      const gym = document.querySelector('.gymsel');
      return brand.innerText === 'BebechDestroyer' &&
        brand.getBoundingClientRect().right <= gym.getBoundingClientRect().left &&
        gym.getBoundingClientRect().right <= innerWidth;
    })()`));
  }
  await evaluate("Rozstaw.go('more')");
  assert.equal(await evaluate("Boolean(document.querySelector('[data-r=checkUpdate]'))"), false);
  await evaluate(`window.updateCalls = []; window.AndroidUpdates = {
    check() { updateCalls.push('check') }, configure() { updateCalls.push('configure') }
  }; Rozstaw.render()`);
  await action('[data-r=checkUpdate]');
  await evaluate("Rozstaw.go('settings')");
  await action('[data-r=checkUpdate]');
  await action('[data-r=updateChannel]');
  assert.deepEqual(await evaluate('window.updateCalls'), ['check', 'check', 'configure']);
  await evaluate("delete window.AndroidUpdates; delete window.updateCalls; Rozstaw.render()");
  assert.equal(await evaluate("Boolean(document.querySelector('[data-r=checkUpdate], [data-r=updateChannel]'))"), false);
  console.log('Verified Android update controls and brand layout at 320 and 360 px.');
}

async function frameRunner(mode, runScenarios) {
  const frame = document.querySelector('#frame'), trace = document.querySelector('#trace')
  const errors = [], steps = []
  const pause = ms => new Promise(resolve=>setTimeout(resolve,ms))
  const visible = () => frame.contentWindow
  const tick = () => pause(100)
  function checkErrors(){
    visible().addEventListener('error',e=>errors.push(e.message))
    visible().addEventListener('unhandledrejection',e=>errors.push(String(e.reason)))
  }
  async function waitFor(test,label) {
    for (let i=0;i<100;i++) {if (test()) return;await tick()}
    throw new Error('Timeout: ' + label + ' · ' + visible().document.body.innerText.slice(0,300))
  }
  const addStep = line => {steps.push(line); trace.textContent=steps.slice(-12).join('\n')}
  const evaluate = expr => visible().eval(expr)
  const setSize = async (w,h) => {frame.width=w;frame.height=h;await tick()}
  const selector = q => visible().document.querySelector(q)
  const action = async q => {await waitFor(()=>selector(q),q);selector(q).click();await tick()}
  const input = async(q,value)=>{const el=selector(q);el.value=value;el.dispatchEvent(new (visible().Event)('input',{bubbles:true}));await tick()}
  const waitText = async text=>{await waitFor(()=>visible().document.body.innerText.includes(text),text);addStep(text)}
  const fits = async label=>{const doc=visible().document.documentElement;if(doc.scrollWidth>doc.clientWidth+1)throw Error('Overflow '+label);addStep(label)}
  const reload = async()=>{const done=new Promise(r=>frame.addEventListener('load',r,{once:true}));visible().location.reload();await done;checkErrors();await waitFor(()=>selector('#content h1'),'load app')}
  const shot = async label=>{addStep(label)}
  let error = null
  try {
    if (mode==='desktop') await setSize(1280,900)
    await waitFor(()=>selector('#content h1'),'load app')
    checkErrors()
    if (mode!=='run') {trace.hidden=true;return}
    await runScenarios({evaluate,setSize,action,input,waitText,shot,fits,reload})
    if (errors.length) throw new Error(errors.join('\n'))
    addStep('PASS')
  } catch (e){error=String(e.stack||e); trace.textContent='FAIL\n'+error}
  await fetch('/__qa/report',{method:'POST',body:JSON.stringify({ok:!error,steps,errors,error})})
}

if (process.argv.includes('--serve')) {
  fs.mkdir(qa,{recursive:true}).then(()=>{
    const server=staticServer()
    server.listen(0,'127.0.0.1',()=>console.log('QA URL http://127.0.0.1:'+server.address().port+'/__qa/run'))
  })
} else run().catch(error => { console.error(error); process.exitCode = 1 })
