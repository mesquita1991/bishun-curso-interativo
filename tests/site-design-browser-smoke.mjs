import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const pages=['index.html','estudar.html','mapa.html','base.html','imersao.html','validacao.html','laboratorio.html','catalogo.html','avaliacao.html','aulas.html','historico.html',...Array.from({length:9},(_,i)=>'etapa-'+(i+1)+'.html')];
const port=4182,origin='http://127.0.0.1:'+port,server=spawn('python3',['-m','http.server',String(port)],{stdio:'ignore'});
let browser;
try{
 let reachable=false;
 for(let k=0;k<80;k++){try{if((await fetch(origin+'/')).ok){reachable=true;break}}catch{}await new Promise(ok=>setTimeout(ok,150))}
 assert.ok(reachable,'The local server must respond');
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const width of [390,768,1440]){
  const context=await browser.newContext({viewport:{width,height:860},serviceWorkers:'block'});
  const page=await context.newPage(),faults=[];
  page.on('pageerror',e=>faults.push(e.message));
  const all=width===768?['index.html','estudar.html','mapa.html','etapa-1.html','laboratorio.html']:pages;
  for(const path of all){
   faults.length=0;
   await page.goto(origin+'/'+path,{waitUntil:'load',timeout:30000});
   await assert.equal(await page.locator('header.site-header').count(),1,'Header on '+path);
   assert.equal(await page.locator('footer.site-footer').count(),1,'Footer on '+path);
   assert.equal(await page.locator('nav.topnav a').count(),7,'Desktop menu count on '+path);
   assert.equal(await page.locator('h1').count(),1,'Main heading on '+path);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2),'Horizontal overflow at '+width+'px on '+path);
   assert.deepEqual(faults,[],'JavaScript error at '+width+'px in '+path);
   if(width<=900){
    assert.ok(!(await page.locator('nav.topnav').isVisible()),'Desktop menu must be hidden on mobile '+path);
    const toggle=page.locator('.site-mobile-menu summary');
    assert.ok(await toggle.isVisible(),'Menu button missing '+path);
    await toggle.click();
    assert.equal(await page.locator('.site-mobile-menu nav a:visible').count(),7,'Mobile menu missing links '+path);
    assert.equal(await page.locator('.site-mobile-menu nav a[aria-current="page"]').count(),['index.html','estudar.html','mapa.html','laboratorio.html','catalogo.html','avaliacao.html','aulas.html'].includes(path)?1:0);
    await toggle.click();
   }else{
    assert.ok(await page.locator('nav.topnav').isVisible(),'Desktop menu must be visible '+path);
    assert.ok(!(await page.locator('.site-mobile-menu summary').isVisible()),'Mobile toggle must be hidden on desktop '+path);
   }
  }
  await context.close();
 }
 console.log(JSON.stringify({ok:true,checkedPages:pages.length,viewports:[390,768,1440],mobileMenu:true,desktopMenu:true,overflows:0,jsErrors:0}));
}finally{await browser?.close();server.kill('SIGTERM')}
