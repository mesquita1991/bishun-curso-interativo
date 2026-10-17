import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
const cwd=process.cwd();
function mime(file){return file.endsWith('.json')?'application/json':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.svg')?'image/svg+xml':'text/html'}
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost'),pathname=decodeURIComponent(url.pathname);
 const target=path.resolve(cwd,'.'+(pathname==='/'?'/index.html':pathname));
 if(!target.startsWith(cwd+path.sep)||!fs.existsSync(target)||!fs.statSync(target).isFile()){
  res.writeHead(404);res.end('Não encontrado');return
 }
 res.writeHead(200,{'Content-Type':mime(target)+'; charset=utf-8','Cache-Control':'no-store'});
 fs.createReadStream(target).pipe(res);
});
let browser;
try{
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
 const origin='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:850},serviceWorkers:'block'});
  const page=await context.newPage(),errors=[],requests=[];
  page.on('pageerror',err=>errors.push(err.message));
  page.on('request',request=>requests.push(new URL(request.url()).pathname));
  await page.goto(origin,{waitUntil:'domcontentloaded'});
  await page.locator('#weekList button[data-week="13"]').waitFor({state:'visible',timeout:30000});
  assert.equal(await page.locator('#weekList button').count(),13,'12 semanas mais encerramento');
  assert.match(await page.locator('#lesson h2').innerText(),/Cumprimentar/);
  assert.equal(await page.locator('#remainingSummary span').count(),3);
  assert.ok(!requests.some(p=>/post\/lex-\d+\.json|archive\/legacy-/.test(p)),'O léxico e o arquivo histórico não podem carregar inicialmente');
  await page.locator('#weekList button[data-week="2"]').click();
  assert.match(await page.locator('#lesson h2').innerText(),/Pessoas, família e profissão/);
  await page.locator('#lesson .tabs button').filter({hasText:'Vocabulário'}).click();
  assert.ok(await page.locator('#lessonBody .entry').count()>=10,'Vocabulário da semana indisponível');
  await page.locator('#lesson .tabs button').filter({hasText:'Praticar'}).click();
  const tasks=page.locator('#lessonBody input[type="checkbox"]');
  assert.equal(await tasks.count(),3);
  for(let i=0;i<3;i++)await tasks.nth(i).check();
  await page.locator('#lessonBody button').filter({hasText:'Marcar semana como realizada'}).click();
  assert.match(await page.locator('#progressStatus').innerText(),/1 de 13/);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#weekList button[data-week="13"]').waitFor({state:'visible',timeout:30000});
  assert.match(await page.locator('#progressStatus').innerText(),/1 de 13/);
  await page.locator('#remainderKind').selectOption('grammar');
  assert.ok(await page.locator('#remainderItems .entry').count()>0,'Gramática não selecionada não acessível');
  assert.match(await page.locator('#remainderCount').innerText(),/registro/);
  await page.locator('#libraryOpen').click();
  await page.locator('#libraryContent pre').first().waitFor({state:'visible',timeout:20000});
  assert.match(await page.locator('#libraryContent h3').first().innerText(),/Página 1/);
  await page.locator('#libraryKind').selectOption('atlas');
  await page.locator('#libraryContent .entry').first().waitFor({state:'visible',timeout:20000});
  assert.ok(await page.locator('#libraryContent .entry').count()>0);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'Transbordamento de layout na tela '+width);
  assert.deepEqual(errors,[],'Erros JavaScript em '+width+'px');
  await context.close();
 }
 console.log(JSON.stringify({ok:true,viewports:[390,1440],weeks:12,closingDays:6,progressPersistence:true,searchableRemainder:true,lazyLibrary:true,initialLexicalShards:0}));
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
