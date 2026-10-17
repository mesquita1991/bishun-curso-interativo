import {chromium} from 'playwright';import http from 'node:http';import path from 'node:path';import assert from 'node:assert/strict';
import fs from 'node:fs';
const server=http.createServer((req,res)=>{
 const location=new URL(req.url,'http://127.0.0.1'),target=path.resolve(process.cwd(),'.'+decodeURIComponent(location.pathname));
 if(!target.startsWith(process.cwd()+path.sep)||!fs.existsSync(target)||!fs.statSync(target).isFile()){res.writeHead(404);res.end('Arquivo não encontrado');return}
 const type=target.endsWith('.json')?'application/json':target.endsWith('.js')?'text/javascript':target.endsWith('.css')?'text/css':'text/html';
 res.writeHead(200,{'Content-Type':type+'; charset=utf-8','Cache-Control':'no-store'});fs.createReadStream(target).pipe(res);
});
let browser;try{
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
 const origin='http://127.0.0.1:'+server.address().port;
 assert.ok((await fetch(origin+'/trilha-v9.json')).ok,'Servidor de teste não iniciou');
 const data=JSON.parse(fs.readFileSync('trilha-v9.json','utf8'));
browser=await chromium.launch({headless:true,args:['--no-sandbox']});
for(const width of [390,1440]){const context=await browser.newContext({viewport:{width,height:850},serviceWorkers:'block'}),page=await context.newPage(),errors=[],requests=[];
page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(new URL(r.url()).pathname));
await page.goto(origin+'/trilha.html',{waitUntil:'domcontentloaded'});
await page.locator('#pathContent').waitFor({state:'visible',timeout:15000});
assert.match(await page.locator('#pathTitle').innerText(),/Dizer olá/);
assert.equal(await page.locator('#pathLessonSelect option').count(),302);
assert.equal(await page.locator('.path-char').count(),2);
assert.equal(await page.locator('#pathSteps .current').count(),1);
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'Transbordamento na tela '+width);
assert.equal(requests.filter(p=>/data\/stage-\d+\.json/.test(p)).length,0,'A entrada deve abrir sem baixar as etapas originais');
await page.locator('[data-phase-go="3"]').click();
assert.equal(await page.locator('#pathStepLabel').innerText(),'Conhecer','A avaliação ainda não pode substituir o primeiro contato');
await page.locator('[data-action="start-pair"]').click();
for(const ch of data.lessons[0].characters.slice(0,2)){
 const options=await page.locator('#pathActivity [data-choice]').allTextContents(),i=options.findIndex(x=>x===ch.meaning);
 assert.ok(i>=0,'Resposta fonte ausente para '+ch.char);await page.locator('#pathActivity [data-choice]').nth(i).click();
 await page.locator('[data-action="next-question"]').click();
}
assert.match(await page.locator('.path-result').innerText(),/2 de 2/);
assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem('bishunTrilhaV90')).lessons['1'].pairDone.includes(0)));
await page.locator('#pathHelp summary').click();
await page.locator('.path-help-char').first().waitFor({state:'visible',timeout:15000});
assert.ok(await page.locator('#pathHelpBody a[href^="manual.html"]').count()>0,'Material original não integrado à lição');
await page.locator('#pathLessonSelect').selectOption('33');
await page.waitForFunction(()=>document.querySelector('#pathTitle').textContent.includes('Ampliar a leitura'),{timeout:10000});
assert.match(await page.locator('#pathPosition').innerText(),/Etapa 2/);
assert.equal(await page.locator('.path-char').count(),2);
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
assert.deepEqual(errors,[],'Erro JavaScript em '+width+'px');
await context.close()}
console.log(JSON.stringify({ok:true,viewports:[390,1440],lessons:302,stageFetches:0,coreNavigation:true,inContextHelp:true,semanticProgress:true}))
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
