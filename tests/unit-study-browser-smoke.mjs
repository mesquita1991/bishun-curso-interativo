import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const port=4178,url='http://127.0.0.1:'+port,server=spawn('python3',['-m','http.server',String(port)],{stdio:'ignore'});
let browser;
try{
 let online=false;for(let i=0;i<80;i++){try{if((await fetch(url+'/')).ok){online=true;break}}catch{}await new Promise(r=>setTimeout(r,125))}
 assert.ok(online,'local web server unavailable');
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const width of [390,1440]){
  const ctx=await browser.newContext({viewport:{width,height:850},serviceWorkers:'block'});
  await ctx.addInitScript(()=>{window.HanziWriter={create(el,char){el.dataset.written=char;return{animateCharacter(){},quiz(opts){opts.onComplete({totalMistakes:0})}}}}});
  const page=await ctx.newPage(),errors=[],reqs=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>reqs.push(new URL(r.url()).pathname));
  await page.goto(url+'/estudar.html?etapa=1&unidade=1&modo=aprender',{waitUntil:'domcontentloaded'});
  await page.locator('#studyContent').waitFor({state:'visible',timeout:18000});
  assert.equal(await page.locator('#learnCharacters .character-tile').count(),10);
  assert.match(await page.locator('#unitTitle').innerText(),/001/);
  assert.equal(reqs.filter(p=>p.includes('/data/stage-1.json')).length,1);
  assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth))<=width+2,'study page horizontal overflow width '+width);
  await page.locator('#finishLearn').click();assert.equal(await page.locator('#tab-escrever').getAttribute('aria-selected'),'true');
  await page.locator('#quizWriting').click();
  await page.waitForFunction(()=>document.getElementById('unitProgressLabel').textContent.includes('2 de 4'));
  await page.locator('#skipToReview').click();await page.locator('#startReview').click();
  for(let i=0;i<12;i++){await page.locator('#revealAnswer').click();await page.locator('[data-grade="2"]').click()}
  assert.match(await page.locator('#unitProgressLabel').innerText(),/3 de 4/);
  await page.locator('#reviewToTest').click();await page.locator('#startTest').click();
  const data=JSON.parse(fs.readFileSync('data/stage-1.json','utf8')),definitions=Object.fromEntries(data.characters.map(c=>[c.char,c.meaning]));
  for(let i=0;i<10;i++){
   const char=await page.locator('#testCard h4 span').innerText(),answers=await page.locator('.quiz-options button').allTextContents();
   const idx=answers.findIndex(x=>x===definitions[char]);assert.ok(idx>=0,'correct option unavailable');
   await page.locator('.quiz-options button').nth(idx).click();await page.locator('#advanceQuestion').click();
  }
  assert.match(await page.locator('#unitProgressLabel').innerText(),/4 de 4/);
  assert.match(await page.locator('#completionLabel').innerText(),/concluída/);
  assert.equal(reqs.filter(p=>p.includes('/data/stage-1.json')).length,1,'mode switches must not refetch data');
  const saved=await page.evaluate(()=>({legacy:JSON.parse(localStorage.getItem('bishunFullV4')),flow:JSON.parse(localStorage.getItem('bishunUnitJourneyV70'))}));
  assert.ok(saved.legacy.records.char);assert.ok(saved.flow.units['1:1'].completedAt);
  await page.locator('#studyUnit').selectOption('2');
  assert.match(await page.locator('#unitTitle').innerText(),/002/);
  assert.equal(await page.locator('#unitProgressBar').getAttribute('aria-valuenow'),'0');
  assert.equal(reqs.filter(p=>p.includes('/data/stage-1.json')).length,1);
  await page.reload({waitUntil:'domcontentloaded'});await page.locator('#studyContent').waitFor({state:'visible'});
  assert.equal(await page.locator('#studyUnit').inputValue(),'2','resume via URL and storage');
  await page.locator('#studyStage').selectOption('9');
  await page.locator('#studyContent').waitFor({state:'visible',timeout:18000});
  assert.match(await page.locator('#unitEyebrow').innerText(),/Etapa 9/);
  assert.equal(reqs.filter(p=>p.includes('/data/stage-9.json')).length,1);
  assert.deepEqual(errors,[],'page errors');
  await ctx.close();
 }
 console.log(JSON.stringify({ok:true,viewports:[390,1440],unit1FourActivities:true,stageChanges:true,persistence:true,singleStageFetch:true,noBrowserErrors:true}));
}finally{await browser?.close();server.kill('SIGTERM')}
