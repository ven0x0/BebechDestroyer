'use strict'

const fs = require('node:fs/promises')
const path = require('node:path')
const http = require('node:http')
const { spawn } = require('node:child_process')
const assert = require('node:assert/strict')
const { seedLegacyDiary } = require('./legacy-diary.cjs')

const assetRoot = require('node:fs').existsSync(path.resolve(__dirname,'../app/model.js')) ? '../app' : '../app/src/main/assets'
const app = path.resolve(__dirname, assetRoot)
const qa = path.resolve(__dirname, '../qa')
const edge = process.env.ROZSTAW_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const legacyState = '(' + seedLegacyDiary.toString() + ')(GymModel.createState())'
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
        frameRunner.toString() + ')(' + JSON.stringify(mode) + ',' + scenarios.toString() + ',' + JSON.stringify(legacyState) + ')</script>'
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
    '--disable-breakpad', '--disable-crash-reporter',
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
    await firstLaunchChecks(helpers)
    await scenarios(helpers, legacyState)
    assert.ok(await evaluate('(' + extendedChecks.toString() + ')()'))
    const learning = await evaluate('(' + v11scenarios.toString() + ')(' + legacyState + ')');
    console.log('Verified integrated correction', learning);
    await setSize(390,844); await fits('Exercise detail mobile'); await shot('exercise-v11-mobile');
    await setSize(1366,900); await fits('Exercise detail desktop'); await shot('exercise-v11-desktop');
    await v12Checks(helpers);
    await updateControls(helpers);
    await languageChecks(helpers);
    await importAndFigureChecks(helpers);
    await groupedMuscleChecks(helpers);
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

async function firstLaunchChecks({evaluate, action, input, waitText, reload}) {
  const records = () => evaluate('({gyms:Rozstaw.state.gyms.map(g=>g.name), plans:Rozstaw.state.plans.map(p=>p.name), sessions:Rozstaw.state.sessions.length})')
  const empty = { gyms: [], plans: [], sessions: 0 }
  assert.deepEqual(await records(), empty)
  assert.ok(await evaluate('!!document.querySelector("#topbar [data-r=addgym]")'))
  assert.equal(await evaluate('Rozstaw.state.active'), null)
  await action('[data-r=newplan]')
  await input('[data-input=plan-name]', 'Pierwszy plan')
  await action('[data-action=pick-plan]')
  await action('[data-action=choose-exercise][data-id=bench-press]')
  await action('[data-action=save-plan]')
  await action('[data-action=start-plan]')
  await input('#gym-name', 'Pierwsza siłownia')
  await action('#gym-form button')
  await waitText('Trening w toku')
  assert.equal(await evaluate('Rozstaw.state.active.planId === Rozstaw.state.plans[0].id && Rozstaw.state.active.gymId === Rozstaw.state.gyms[0].id'), true)
  await input('[data-input=weight][data-row="0"][data-set="0"]', '20')
  await input('[data-input=reps][data-row="0"][data-set="0"]', '6')
  await action('[data-action=toggle-set][data-row="0"][data-set="0"]')
  await action('[data-action=finish]')
  await action('[data-action=save-workout]')
  await waitText('Trening zapisany')
  await reload()
  assert.deepEqual(await records(), { gyms: ['Pierwsza siłownia'], plans: ['Pierwszy plan'], sessions: 1 })
  assert.equal(await evaluate('Rozstaw.state.sessions[0].exercises[0].sets[0].reps'), 6)
  await evaluate('window.receiveBackup(JSON.stringify(GymModel.createState()))')
  await action('[data-r=restore]')
  await reload()
  assert.deepEqual(await records(), empty, 'Restoring and reopening an empty diary must keep it empty')
}

async function scenarios({evaluate, setSize, action, input, waitText, shot, fits, reload}, fixture) {
  function check(value, message) { if (!value) throw new Error(message) }
  const act = (name, suffix = '') => action('[data-action="' + name + '"]' + suffix)
  const root = (name,suffix='') => action('[data-r="' + name + '"]' + suffix)
  await evaluate('Rozstaw.restore(' + fixture + ')')
  await reload()
  check(await evaluate('Rozstaw.state.gyms.length === 2 && Rozstaw.state.plans.length === 3'), 'An existing diary must keep its original gyms and plans')
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
function v11scenarios(s){
const A=Rozstaw,M=GymModel,d=document;
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
find('.atlas-group summary').click();find('.atlas-muscle').click();check(find('.atlas-muscle').getAttribute('aria-pressed')==='true','Map did not highlight');
check(!d.querySelector('[data-r=language]'),'Exercise-only language control still present');
A.go('catalogue');set('#ex-query','Wyciskanie na maszynie');check(find('#ex-rows').textContent.includes('Wyciskanie na klatkę (maszyna)'),'Historical Polish alias did not find canonical exercise');
A.go('plans');act('import-plans');const json=JSON.stringify({name:'Test JSON 5–8',exercises:[{name:'Chest Press',sets:2,reps:'5-8'}]});set('[data-value=json]',json);act('review-import');act('commit-import');
const p=s.plans.at(-1);check(p.exercises[0].repsMin===5&&p.exercises[0].repsMax===8,'Imported range lost');const backup=JSON.parse(JSON.stringify(s));check(M.validateState(backup)&&backup.language==='pl','Backup missing new fields');
A.go('plan',{id:p.id});act('start-plan');const row='[data-row="0"][data-set="0"]';set('[data-input=weight]'+row,'45');set('[data-input=reps]'+row,'10');act('toggle-set',row);
const logged=s.active.exercises[0].sets[0];check(logged.prediction?.weight===40&&logged.weight===45,'Actual and suggested weights not captured independently');
act('finish');act('save-workout');const corrected=s.sessions.at(-1);check(corrected.exercises[0].sets[0].prediction?.weight===40,'Logged correction lost');
const now=Date.now(),recent=s.sessions.at(-1);recent.startedAt=now-2*86400000-1000;recent.finishedAt=now-2*86400000;add(s,'fresh-y',b,80,10,1);
const revised=M.recommend(s,{exerciseId:'chest-press',gymId:'alchemia',equipmentId:a.id,reps:10});
check(revised.correctionCount>0&&revised.weight>40&&revised.weight<=45,'Recommendation did not learn actual result: '+JSON.stringify(revised));
A.go('exercise',{id:'chest-press'});check(s.language==='pl','Language preference lost');
return {old:40,actual:45,next:revised.weight};
}
async function v12Checks({cdp,evaluate,setSize,action,input,shot,fits}) {
  const seed = function (s) {
    const M=GymModel;
    const a=M.ensureEquipment(s,'alchemia','chest-press','Maszyna A',2.5),b=M.ensureEquipment(s,'suchanino','chest-press','Maszyna B',5);
    function save(id,date,profile,kg,extra=false){
      const rows=[{exerciseId:'chest-press',equipmentId:profile.id,sets:[{weight:kg,reps:10,done:true,type:'normal'}]}];
      if(extra)rows.push({exerciseId:'push-up',equipmentId:null,sets:[{weight:0,reps:12,done:true,type:'normal'}]});
      s.sessions.push({id,planId:'upper-a',gymId:profile.gymId,name:'Trening '+id,startedAt:+date-30*60e3,finishedAt:+date,exercises:rows});
    }
    save('A',new Date(2024,1,20,10),a,35);save('B',new Date(2024,1,21,10),b,70);save('rano',new Date(2024,1,22,7),b,80,true);save('wieczór',new Date(2024,1,22,20),a,35);
    const now=Date.now();
    save('nowa-A',new Date(now-9*864e5),a,35);save('nowa-B',new Date(now-8*864e5),b,70);
    const last = s.sessions.at(-1).exercises[0].sets;
    last.unshift({weight:20,reps:15,done:true,type:'warmup'});
    last.push({weight:60,reps:8,done:true,type:'drop'});
    s.uiGym='suchanino';Rozstaw.restore(s);
  };
  await setSize(390,844);
  await evaluate('('+seed.toString()+')('+legacyState+')');
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
  const distributionButton = '[data-action=muscle-summary]';
  assert.ok(await evaluate('!document.querySelector("[data-live-map]")'), 'The large muscle map should open on demand');
  assert.deepEqual(await evaluate('Array.from(document.querySelectorAll("[data-exercise-card=\\"0\\"] .tr-set-prev"), cell => cell.textContent.trim())'),
    ['70 kg × 10', '60 kg × 8', '—']);
  await input('[data-input="weight"][data-row="0"][data-set="0"]','80');
  await input('[data-input="reps"][data-row="0"][data-set="0"]','10');
  await action('[data-action="toggle-set"][data-row="0"][data-set="0"]');
  assert.equal(await evaluate('document.querySelector("[data-live-volume]").textContent'),'400');
  assert.equal(await evaluate('document.querySelector("[data-live-sets]").textContent'),'1');
  assert.ok(await evaluate(`(() => {
    const [r,g,b] = getComputedStyle(document.querySelector('.tr-set.tr-done')).backgroundColor.match(/[0-9]+/g).map(Number);
    return g > r && g > b;
  })()`), 'The completed set should have a green row background');
  await evaluate('window.scrollTo(0,650)');
  await until(()=>evaluate('Math.abs(document.querySelector(".tr-live-metrics").getBoundingClientRect().top)<2'),'pinned workout metrics');
  await evaluate('window.scrollTo(0,0)');
  const initialClock=await evaluate('document.querySelector("[data-elapsed]").textContent');
  await until(()=>evaluate(`document.querySelector('[data-elapsed]').textContent!==${JSON.stringify(initialClock)}`),'live clock',4000);
  await shot('workout-log-mobile');
  await action(distributionButton);
  assert.ok(await evaluate('document.activeElement.matches("[role=dialog][data-dialog=muscle-summary]")'));
  assert.equal(await evaluate('document.querySelector("[data-mode=performed]").getAttribute("aria-pressed")'), 'true');
  for (const width of [320, 390, 1280]) {
    await setSize(width, 844);
    await fits('Workout muscle map at ' + width);
    const heights = await evaluate('Array.from(document.querySelectorAll(".tr-map-pair svg"), svg => svg.getBoundingClientRect().height)');
    assert.equal(heights.length, 2);
    assert.ok(heights.every(h => h >= 210), 'Both workout silhouettes must be readable at ' + width);
  }
  await setSize(390, 844);
  const displayedTotals = () => evaluate(`Object.fromEntries(Array.from(document.querySelectorAll('.dist-group > summary'),
    row => [row.querySelector('.dist-name').textContent, row.querySelector('.dist-total').textContent]))`);
  assert.deepEqual(await displayedTotals(), { Klata:'1', Barki:'0,5', Triceps:'0,5' });
  assert.equal(await evaluate('document.querySelectorAll(".dist-group[open]").length'), 0);
  await shot('muscle-distribution-mobile');
  const mapHint = await evaluate('document.querySelector(".atlas-readout").textContent');
  assert.match(mapHint, /Dotknij/);
  await tapRegion(cdp, evaluate, 'chest');
  assert.equal(await evaluate('document.querySelector(".dist-group[open] .dist-name").textContent'), 'Klata');
  assert.equal(await evaluate('document.querySelector(".dist-group[open] [data-atlas-pick=chest] .dist-value").textContent'), '1');
  assert.equal(await evaluate('document.querySelector("[data-atlas-pick=chest]").getAttribute("aria-pressed")'), 'true');
  assert.equal(await evaluate('document.querySelector(".atlas-readout").textContent'), 'Piersiowy większy · Główna');
  await fits('Expanded workout muscle groups');
  await tapRegion(cdp, evaluate, 'chest');
  assert.equal(await evaluate('document.querySelector(".atlas-readout").textContent'), mapHint);
  await tapRegion(cdp, evaluate, 'cuff');
  assert.equal(await evaluate('document.querySelector("[data-atlas-pick=cuff] .dist-value").textContent'), '0,125');
  assert.equal(await evaluate('window.appBack()'), true);
  assert.ok(await evaluate('!document.querySelector("[role=dialog]") && document.activeElement.matches("[data-action=muscle-summary]")'));
  await action('[data-action="toggle-set"][data-row="0"][data-set="0"]');
  assert.equal(await evaluate('document.querySelector("[data-live-volume]").textContent'),'0');
  assert.ok(await evaluate('!document.querySelector(".tr-set.tr-done")'));
  await action(distributionButton);
  assert.ok(await evaluate('!!document.querySelector(".dist-empty")'));
  assert.deepEqual(await displayedTotals(), {});
  await action('[data-action="muscle-mode"][data-mode="planned"]');
  assert.ok(Object.hasOwn(await displayedTotals(), 'Barki'));
  await action('[data-action=close-sheet]');
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

async function languageChecks({ cdp, evaluate, action, input, waitText, fits, reload, shot, setSize }) {
  const go = (view, params = {}) =>
    evaluate('Rozstaw.go(' + JSON.stringify(view) + ',' + JSON.stringify(params) + ')');
  async function selectLanguage(code) {
    await go('more');
    await action('[data-r="language"]');
    await action('[data-r="setLanguage"][data-id="' + code + '"]');
    await until(
      () =>
        evaluate(
          'document.documentElement?.lang === ' +
            JSON.stringify(code) +
            ' && Boolean(document.querySelector("#content h1"))'
        ),
      'reloaded ' + code + ' interface'
    );
  }
  await evaluate(
    'Rozstaw.state.plans.push({id:"personal",name:"Historia",notes:"Moja notatka",exercises:[]}); Rozstaw.save()'
  );
  await selectLanguage('en');
  await waitText('Start workout');
  assert.equal(await evaluate('document.querySelector(".skip").textContent'), 'Skip to content');
  await go('plans');
  await waitText('Upper Body A');
  await waitText('Historia');
  await go('catalogue');
  await waitText('Exercise library');
  await input('#ex-query', 'Wyciskanie na maszynie');
  await waitText('Chest Press (Machine)');
  await setSize(390, 844);
  await input('#ex-query', 'Bench Press');
  await waitText('Incline Bench Press (Dumbbell)');
  await shot('catalogue-en-mobile');
  await input('#ex-query', 'Skullcrusher');
  await waitText('Skullcrusher (Barbell)');
  assert.ok(await evaluate(`(() => {
    const frame = document.querySelector('.atlas-result-figure');
    const tile = frame.getBoundingClientRect(), figure = frame.querySelector('svg').getBoundingClientRect();
    return figure.height >= 96 && figure.top >= tile.top && figure.bottom <= tile.bottom;
  })()`), 'The catalogue thumbnail must show the whole figure at a readable size');
  await action('[data-r=exdetail][data-id=atlas-bb-skull]');
  await action('[data-pg=section][data-val=technique]');
  await waitText('How to do this exercise');
  await fits('New technique screen');
  await shot('skullcrusher-en-mobile');
  assert.match(await evaluate('document.querySelector(".guide-cue").textContent'), /bar/i);
  await action('[data-demo-action=speed]');
  assert.equal(await evaluate('document.querySelector("[data-demo-action=speed]").textContent'), '0.5×');
  await go('exercise', { id: 'chest-press', section: 'technique' });
  assert.match(await evaluate('document.querySelector(".guide-steps").textContent'), /seat/i);
  await go('progress');
  await waitText('Progress');
  await go('calendar');
  await waitText('Workout calendar');
  assert.equal(await evaluate('document.querySelector(".cal-weekday").textContent'), 'Mon');
  await go('settings');
  await waitText('Backup');
  await go('plan', { id: 'upper-a' });
  await action('[data-action=start-plan]');
  await waitText('Workout in progress');
  await waitText('Previous');
  await action('[data-action=muscle-summary]');
  await action('[data-action=muscle-mode][data-mode=planned]');
  assert.ok(await evaluate('Array.from(document.querySelectorAll(".dist-name"), s => s.textContent).includes("Shoulders")'));
  await tapRegion(cdp, evaluate, 'chest');
  assert.equal(await evaluate('document.querySelector(".atlas-readout").textContent'), 'Pectoralis major · Primary');
  await tapRegion(cdp, evaluate, 'chest');
  assert.match(await evaluate('document.querySelector(".atlas-readout").textContent'), /^Tap a highlighted muscle/);
  await action('[data-action=close-sheet]');
  await waitText('Chest Press (Machine)');
  await fits('English workout');
  const active = await evaluate('JSON.stringify(Rozstaw.state.active)');
  await reload();
  await waitText('Upper Body A');
  await selectLanguage('pl');
  await waitText('Wróć do treningu');
  assert.equal(await evaluate('JSON.stringify(Rozstaw.state.active)'), active);
  assert.deepEqual(
    await evaluate('Rozstaw.state.plans.filter(p=>p.id==="personal").map(p=>[p.name,p.notes])'),
    [['Historia', 'Moja notatka']]
  );
}

async function importAndFigureChecks({ cdp, evaluate, action, input, waitText, shot, fits }) {
  await evaluate("Rozstaw.restore(" + legacyState + "); Rozstaw.go('plans')");
  const before = await evaluate('JSON.stringify(Rozstaw.state.plans)');
  const sample = JSON.stringify([
    {
      name: 'Upper test',
      exercises: [
        { codeName: 'incline dumbell pres', sets: 3, reps: '5-8' },
        { name: 'Xxxx unknown', sets: 2, reps: 10 }
      ]
    },
    {
      name: 'Lower test',
      exercises: [
        { codeName: 'incline dumbell pres', sets: 2, reps: 8 },
        { code: 'RDL_DB', sets: 3, reps: 8 }
      ]
    }
  ]);
  await action('[data-action=import-plans]');
  await input('[data-value=json]', sample);
  await action('[data-action=review-import]');
  await waitText('Dopasuj ćwiczenia');
  await fits('Import matching on mobile');
  assert.equal(await evaluate('document.querySelectorAll(".tr-match").length'), 2);
  assert.ok(await evaluate('document.querySelector("[data-action=commit-import]").disabled'));
  assert.equal(await evaluate('JSON.stringify(Rozstaw.state.plans)'), before);
  await input('[data-input=match-choice][data-index="0"]', 'atlas-incline-db');
  await action('[data-action=match-all][data-index="1"]');
  assert.equal(
    await evaluate('document.querySelectorAll(".tr-match:nth-of-type(2) select option").length'),
    271
  );
  await input('[data-input=match-search][data-index="1"]', 'Bench Press');
  await input('[data-input=match-choice][data-index="1"]', 'bench-press');
  await shot('routine-import-matches');
  await action('[data-action=commit-import]');
  assert.deepEqual(await evaluate('Rozstaw.state.plans.slice(-2).map(p=>p.exercises.map(e=>e.exerciseId))'), [
    ['atlas-incline-db', 'bench-press'],
    ['atlas-incline-db', 'dumbbell-rdl']
  ]);
  await evaluate("Rozstaw.go('more')");
  await action('[data-r=profile-sex]');
  await action('[data-r=set-sex][data-id=female]');
  await evaluate("Rozstaw.go('exercise',{id:'bench-press',section:'muscles'})");
  assert.equal(await evaluate('document.querySelectorAll(".atlas-pair [data-figure=female]").length'), 2);
  await shot('female-muscle-map');
  await tapRegion(cdp, evaluate, 'chest');
  assert.equal(await evaluate('document.querySelector(".atlas-readout").textContent'), 'Piersiowy większy · Główna');
  await tapRegion(cdp, evaluate, 'cuff');
  assert.equal(await evaluate('document.querySelector(".atlas-readout").textContent'), 'Stożek rotatorów · Stabilizująca');
  const blues = await evaluate(`['primary','secondary','stabilizer'].map(role => {
    const region = getComputedStyle(document.querySelector('.atlas-shape.atlas-' + role)).fill;
    const swatch = getComputedStyle(document.querySelector('.atlas-map-key .atlas-' + role)).backgroundColor;
    return {region,swatch};
  })`);
  assert.equal(new Set(blues.map(role => role.region)).size, 3);
  for (const {region,swatch} of blues) {
    assert.equal(region, swatch);
    const [r,g,b] = region.match(/\d+/g).map(Number);
    assert.ok(b > r && b > g, 'All highlighted roles should be blue');
  }
  const female = await evaluate('document.querySelector(".atlas-base path").getAttribute("d")');
  await evaluate("Rozstaw.go('catalogue')");
  assert.ok(await evaluate('!!document.querySelector(".atlas-thumbnail[data-figure=female]")'));
  await evaluate("Rozstaw.go('plan',{id:'upper-a'})");
  await action('[data-action=start-plan]');
  await action('[data-action=muscle-summary]');
  assert.ok(await evaluate('!!document.querySelector("[data-live-map] [data-figure=female]")'));
  await action('[data-action=close-sheet]');
  assert.equal(await evaluate('JSON.parse(localStorage.getItem(Rozstaw.key)).sex'), 'female');
  await evaluate("Rozstaw.go('more')");
  await action('[data-r=profile-sex]');
  await action('[data-r=set-sex][data-id=male]');
  await evaluate("Rozstaw.go('exercise',{id:'bench-press',section:'muscles'})");
  assert.notEqual(await evaluate('document.querySelector(".atlas-base path").getAttribute("d")'), female);
}

async function groupedMuscleChecks({cdp, evaluate, action, input, waitText, shot, fits}) {
  await evaluate("Rozstaw.go('catalogue')");
  await input('#ex-query','Dragon Flag');
  await waitText('Smocza flaga');
  assert.equal(await evaluate('document.querySelectorAll("#ex-rows .atlas-result").length'),4);
  await action('[data-r=exdetail][data-id=atlas-dragon-flag]');
  await action('[data-pg=section][data-val=muscles]');
  assert.equal(await evaluate('document.querySelectorAll(".atlas-list details[open]").length'),0);
  assert.ok(await evaluate('document.querySelector(".atlas-list").innerText.includes("Brzuch")'));
  assert.ok(await evaluate('document.querySelector(".atlas-list").innerText.includes("Lats")'));
  assert.ok(await evaluate('!document.querySelector(".atlas-list").innerText.includes("Prosty brzucha")'));
  await action('.atlas-group summary');
  assert.ok(await evaluate('document.querySelector(".atlas-list").innerText.includes("Prosty brzucha")'));
  await tapRegion(cdp, evaluate, 'lat');
  assert.equal(await evaluate('document.querySelector(".atlas-readout").textContent'), 'Najszerszy grzbietu · Wspomagająca');
  assert.ok(await evaluate('document.querySelector("[data-atlas-pick=lat]").closest("details").open'));
  await tapRegion(cdp, evaluate, 'lat');
  assert.match(await evaluate('document.querySelector(".atlas-readout").textContent'), /^Dotknij/);
  await action('[data-atlas-pick=abs]');
  assert.ok(await evaluate('document.querySelector("[data-atlas-region=abs]").classList.contains("atlas-picked")'));
  await fits('Grouped muscle roles'); await shot('dragon-flag-muscle-groups');
  await action('[data-pg=section][data-val=technique]');
  assert.equal(await evaluate('document.querySelectorAll(".guide-steps li").length'),3);
  await action('[data-demo-action=end]'); await shot('dragon-flag-technique');
}

async function tapRegion(cdp, evaluate, id) {
  const point = await evaluate(`(() => {
    const card = document.querySelector('[role=dialog] [data-atlas-card]') || document.querySelector('[data-atlas-card]');
    const path = card.querySelector('[data-atlas-region=${id}] path');
    path.scrollIntoView({block:'center'});
    const bounds = path.getBoundingClientRect();
    for(let y=Math.ceil(bounds.top);y<bounds.bottom;y++)
      for(let x=Math.ceil(bounds.left);x<bounds.right;x++)
        if(document.elementFromPoint(x,y)===path) return {x,y};
    return null;
  })()`);
  assert.ok(point, 'The highlighted ' + id + ' must be tappable on the figure');
  for(const type of ['mousePressed','mouseReleased'])
    await cdp.send('Input.dispatchMouseEvent',{type, ...point, button:'left', clickCount:1});
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

async function frameRunner(mode, runScenarios, fixture) {
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
    await runScenarios({evaluate,setSize,action,input,waitText,shot,fits,reload}, fixture)
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
