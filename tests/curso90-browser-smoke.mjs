import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {chromium} from 'playwright';
const root=path.resolve('dist');
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://127.0.0.1').pathname;
 const target=path.resolve(root,'.'+decodeURIComponent(pathname==='/'?'/index.html':pathname));
 if(!target.startsWith(root+path.sep)||!fs.existsSync(target)||!fs.statSync(target).isFile()){res.writeHead(404);res.end();return}
 const ext=path.extname(target);const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml'}[ext]||'application/octet-stream';
 res.writeHead(200,{'Content-Type':mime+'; charset=utf-8','Cache-Control':'no-store'});fs.createReadStream(target).pipe(res);
});
let browser;
try{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const width of [390,1440]){
  const ctx=await browser.newContext({viewport:{width,height:850},serviceWorkers:'block'}),page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#weekList .week-choice').first().waitFor({timeout:30000});
  assert.equal(await page.locator('#weekList .week-choice').count(),13,'Semanas e fechamento');
  await page.locator('#lesson .phase-bar .phase-button').first().waitFor({timeout:20000});
  assert.equal(await page.locator('#lesson .phase-bar .phase-button').count(),6);
  assert.match(await page.locator('#lesson h2').first().innerText(),/Cumprimentar/);
  assert.equal(await page.locator('.unit-grid .unit-card').count(),6,'Autoaulas preservadas');
  assert.match(await page.locator('#remainingSummary').innerText(),/Vocabulário/);
  assert.ok(await page.locator('#remainderItems .entry').count()>0,'Acervo não selecionado');
  await page.locator('#weekList [data-week="2"]').click();
  await page.locator('#lesson h2').waitFor();
  assert.match(await page.locator('#lesson h2').innerText(),/Pessoas/);
  await page.locator('#libraryKind').selectOption('manual');
  await page.locator('#libraryOpen').click();
  await page.locator('#libraryContent .reader pre').first().waitFor({timeout:20000});
  assert.match(await page.locator('#libraryContent .reader h3').first().innerText(),/Página 1/);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'Rolagem horizontal '+width);
  assert.deepEqual(errors,[],'Erro JS '+width);
  await ctx.close();
 }
 console.log(JSON.stringify({ok:true,viewports:[390,1440],weeks:12,phases:6,untaught:true,manualReader:true,legacyAutoLessons:6}));
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
