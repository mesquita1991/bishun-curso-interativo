import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const port=4180,host='http://127.0.0.1:'+port;
const server=spawn('python3',['-m','http.server',String(port)],{stdio:'ignore'});
let browser;
try{
 let live=false;for(let i=0;i<100;i++){try{if((await fetch(host+'/manual.html')).ok){live=true;break}}catch{}await new Promise(r=>setTimeout(r,120))}
 assert.ok(live,'Servidor local indisponível');
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const width of [390,1440]){
  const ctx=await browser.newContext({viewport:{width,height:840},serviceWorkers:'block'});
  const page=await ctx.newPage(),errors=[],requested=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>requested.push(new URL(r.url()).pathname));
  await page.goto(host+'/manual.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.getElementById('manualResultSummary').textContent.includes('Digite um termo'),{timeout:15000});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'Transbordamento no manual '+width);
  await page.locator('#manualTocDetails summary').click();
  assert.equal(await page.locator('#manualToc li').count(),176,'176 links do sumário presentes');
  await page.locator('#manualSearch').fill('cânhamo');
  assert.match(await page.locator('#manualResultSummary').innerText(),/página\(s\) encontrada/);
  assert.ok(await page.locator('#manualSearchResults li').count()>0,'Pesquisa integral do PDF');
  await page.locator('[data-page="28"]').click();
  await page.waitForFunction(()=>!document.getElementById('manualDownload').disabled,{timeout:45000});
  assert.match(await page.locator('#manualStatus').innerText(),/original validado/);
  assert.match(await page.locator('#manualFrame').getAttribute('src'),/blob:.*#page=28/);
  assert.equal(await page.locator('#manualPage').inputValue(),'28');
  await page.locator('#manualNext').click();
  assert.equal(await page.locator('#manualPage').inputValue(),'29');
  await page.locator('#manualPage').fill('198');await page.locator('#manualPage').press('Tab');
  await page.waitForFunction(()=>document.getElementById('manualPage').value==='198');
  assert.match(await page.locator('#manualFrame').getAttribute('src'),/#page=198/);
  assert.equal(requested.filter(x=>x.endsWith('.bin')).length,8,'Oito fragmentos carregados uma única vez');
  assert.deepEqual(errors,[],'Erros Javascript');
  await ctx.close();
 }
 console.log(JSON.stringify({ok:true,viewports:[390,1440],fullPdf:true,indexSearch:true,bookmarks:176,sha256Validated:true}));
}finally{await browser?.close();server.kill('SIGTERM')}
