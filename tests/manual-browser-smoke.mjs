import {chromium} from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const server=http.createServer((req,res)=>{
 const location=new URL(req.url,'http://127.0.0.1'),target=path.resolve(process.cwd(),'.'+decodeURIComponent(location.pathname));
 if(!target.startsWith(process.cwd()+path.sep)||!fs.existsSync(target)||!fs.statSync(target).isFile()){res.writeHead(404);res.end('Arquivo não encontrado');return}
 const type=target.endsWith('.json')?'application/json':target.endsWith('.js')?'text/javascript':target.endsWith('.css')?'text/css':'text/html';
 res.writeHead(200,{'Content-Type':type+'; charset=utf-8','Cache-Control':'no-store'});fs.createReadStream(target).pipe(res);
});
let browser;
try{
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
 const port=server.address().port,host='http://127.0.0.1:'+port;
 assert.ok((await fetch(host+'/manual.html')).ok,'Servidor HTTP de teste indisponível');
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:840},serviceWorkers:'block'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(host+'/manual.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.getElementById('manualReady').textContent.includes('198 páginas'),{timeout:20000});
  assert.ok((await page.locator('.manual-document-text').innerText()).includes('O que fazer todos os dias'),'A leitura HTML integral não foi carregada');
  assert.equal(await page.locator('iframe,object[type="application/pdf"]').count(),0,'Leitor PDF encontrado');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'Transbordamento na entrada '+width);
  assert.equal(await page.locator('#manualToc li').count(),176);
  await page.locator('[data-manual-view="atlas"]').first().click();
  assert.equal(await page.locator('.manual-atlas-card').count(),12);
  assert.match(await page.locator('.manual-atlas-card').first().innerText(),/#001 · ba/);
  assert.match(await page.locator('.manual-atlas-card').first().locator('a').first().getAttribute('href'),/define=ba/);
  await page.locator('[data-manual-view="escrita"]').first().click();
  assert.equal(await page.locator('.manual-character-card').count(),164);
  const filter=page.locator('#manualContent input[type="search"]');await filter.fill('我');
  assert.equal(await page.locator('.manual-character-card').count(),1);
  await page.locator('.manual-character-card a').first().click();
  await page.waitForFunction(()=>document.querySelector('#manualContent .manual-figure img')?.complete,{timeout:15000});
  assert.match(await page.locator('.manual-document-text').innerText(),/我/);
  assert.equal(await page.locator('.manual-original-links').count(),1);
  await page.locator('[data-manual-view="matriz"]').first().click();
  assert.equal(await page.locator('.manual-matrix-pinyin').count(),410);
  assert.equal(await page.locator('.manual-matrix-audio').count(),410);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'Matriz causou transbordamento na tela '+width);
  await page.locator('#manualSearch').fill('cânhamo');
  await page.waitForFunction(()=>document.querySelector('#manualSearchStatus').textContent.includes('encontrada(s)'),{timeout:15000});
  assert.ok(await page.locator('#manualSearchResults li').count()>=1,'Busca integral sem resultados');
  assert.deepEqual(errors,[],'Erros JS na versão '+width);await context.close();
 }
 console.log(JSON.stringify({ok:true,viewports:[390,1440],nativeHtml:true,atlas:410,characters:164,search:true,matrix:410,links:true,PDF:false}));
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
