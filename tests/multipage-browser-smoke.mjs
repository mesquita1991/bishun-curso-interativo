import { chromium } from 'playwright';
import { spawn } from 'node:child_process';import assert from 'node:assert/strict';
const port=4173,url='http://127.0.0.1:'+port,server=spawn('python3',['-m','http.server',String(port)],{stdio:'ignore'});
let browser;
try{
 let reachable=false;for(let i=0;i<80;i++){try{const r=await fetch(url+'/');if(r.ok){reachable=true;break}}catch{}await new Promise(r=>setTimeout(r,125))}assert.ok(reachable,'HTTP local não iniciou');
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:850},serviceWorkers:'block'}),page=await context.newPage();const failures=[],requests=[];
  page.on('pageerror',e=>failures.push(e.message));page.on('request',r=>requests.push(new URL(r.url()).pathname));
  await page.goto(url+'/',{waitUntil:'domcontentloaded',timeout:30000});
  assert.match(await page.locator('h1').innerText(),/Aprenda mandarim/);
  assert.equal(await page.locator('nav.topnav a').count(),6);
  assert.equal(requests.filter(x=>/stage-\d+\.json|full-course\.js|post-standard\.js|mastery-v6\.js|hanzi-writer/.test(x)).length,0,'Heavy modules must not load at home');
  assert.ok((await page.evaluate(()=>document.body.scrollWidth))<=width+2,'Home horizontal overflow '+width);
  assert.deepEqual(failures,[],'Home errors');
  const stage=await context.newPage(),stageReq=[];stage.on('request',r=>stageReq.push(new URL(r.url()).pathname));
  await stage.goto(url+'/etapa-1.html',{waitUntil:'domcontentloaded'});
  assert.equal(stageReq.filter(x=>x.endsWith('/data/stage-1.json')).length,0,'Stage data requested before click');
  await stage.locator('#loadStageButton').click();
  await stage.locator('#stageLoaded').waitFor({state:'visible',timeout:20000});
  assert.match(await stage.locator('#unitContent').innerText(),/Caracteres desta unidade/);
  assert.ok((await stage.locator('.hanzi-card').count())>=10);
  assert.equal(stageReq.filter(x=>x.endsWith('/data/stage-1.json')).length,1,'Only selected stage must download');
  await stage.locator('#stageUnitSelect').selectOption('2');
  assert.equal(await stage.evaluate(()=>JSON.parse(localStorage.getItem('bishunFullV4')).unitsByStage['1']),2);
  assert.ok((await stage.evaluate(()=>document.body.scrollWidth))<=width+2,'Stage horizontal overflow '+width);
  if(width===1440){const advanced=await context.newPage();await advanced.goto(url+'/etapa-9.html',{waitUntil:'domcontentloaded'});await advanced.locator('#loadStageButton').click();await advanced.locator('#stageLoaded').waitFor({state:'visible',timeout:20000});assert.ok((await advanced.locator('.hanzi-card').count())>=10,'Advanced stage must render a unit');await advanced.close();}
  const lab=await context.newPage(),labFailures=[];lab.on('pageerror',e=>labFailures.push(e.message));
  await lab.goto(url+'/laboratorio.html?etapa=1&unidade=2',{waitUntil:'domcontentloaded'});
  await lab.locator('#carregar').click();await lab.locator('#laboratorio').waitFor({state:'visible',timeout:12000});
  assert.ok((await lab.locator('.mini-result').count())>0,'Writing lab should contain characters');
  assert.ok((await lab.locator('#writer').innerText()).length>0,'Writer fallback should show a character');
  assert.deepEqual(labFailures,[],'Independent lab must initialize without JS errors');
  await lab.goto(url+'/catalogo.html?etapa=1#palavras',{waitUntil:'domcontentloaded'});
  await lab.locator('#carregar').click();await lab.locator('#catalogo').waitFor({state:'visible',timeout:12000});assert.ok((await lab.locator('.tool-card').count())>0,'Vocabulary catalog');
  await lab.goto(url+'/avaliacao.html?etapa=1',{waitUntil:'domcontentloaded'});
  await lab.locator('#carregar').click();await lab.locator('#avaliacao').waitFor({state:'visible',timeout:12000});
  await lab.locator('#provar').click();assert.equal(await lab.locator('.quiz-option').count(),4,'Exam must offer four answers');
  await lab.goto(url+'/aulas.html#fontes',{waitUntil:'domcontentloaded'});
  await lab.locator('#material h2').waitFor({state:'visible',timeout:12000});
  await stage.goto(url+'/index.html#treinador',{waitUntil:'commit',timeout:30000});
  await stage.waitForURL('**/laboratorio.html',{waitUntil:'commit',timeout:12000});
  await stage.goto(url+'/curso.html#laboratorio-integral',{waitUntil:'commit',timeout:30000});
  await stage.waitForURL('**/laboratorio.html',{waitUntil:'commit',timeout:12000});
  await lab.close();
  await context.close();
 }
 console.log(JSON.stringify({ok:true,viewports:[390,1440],initialHeavyAssets:0,lazyStageFetch:true,unitPersistence:true,legacyHashRouting:true,oldCourseRedirect:true,independentTools:true}));
}finally{await browser?.close();server.kill('SIGTERM')}
