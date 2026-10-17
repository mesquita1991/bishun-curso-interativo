import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
const cwd=process.cwd();
const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const didactics=json('didatica-12-semanas.json');
const stages=Array.from({length:9},(_,i)=>json('data/stage-'+(i+1)+'.json'));
const meanings=new Map();
for(const stage of stages)for(const x of stage.vocabulary)if(!meanings.has(x.hanzi))meanings.set(x.hanzi,x.meaning);
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
const localDate=(d)=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const shift=(s,n)=>{const [y,m,d]=s.split('-').map(Number),date=new Date(y,m-1,d);date.setDate(date.getDate()+n);return localDate(date)};
async function editProgress(page,fn){
 const data=await page.evaluate(()=>JSON.parse(localStorage.getItem('bishun-curso90-v1')));
 fn(data.learning['2']);
 await page.evaluate(x=>localStorage.setItem('bishun-curso90-v1',JSON.stringify(x)),data);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('.phase-bar button').first().waitFor({state:'visible'});
}
async function answerWords(page){
 for(let i=0;i<5;i++){
  const quiz=page.locator('.quiz-card'),term=await quiz.locator('.hanzi').innerText(),correct=meanings.get(term);
  assert.ok(correct,'Palavra desconhecida: '+term);
  await quiz.locator('.recall-input').fill('tentei recordar antes das alternativas');
  await quiz.getByRole('button',{name:'Conferir alternativas'}).click();
  const all=await quiz.locator('.choices button').allTextContents();
  const index=all.indexOf(correct);
  assert.notEqual(index,-1,'Resposta correta não apresentada: '+term);
  await quiz.locator('.choices button').nth(index).click();
  await quiz.getByRole('button',{name:'Próxima questão →'}).click();
 }
 assert.match(await page.locator('.quiz-card h3').innerText(),/5\/5/);
 await page.locator('.quiz-card').getByRole('button',{name:'Continuar →'}).click();
}
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
  await page.locator('.phase-bar button').first().waitFor({state:'visible'});
  assert.equal(await page.locator('#weekList button').count(),13);
  assert.equal(await page.locator('.phase-bar button').count(),6);
  assert.equal(await page.locator('.phase-bar button').nth(1).isDisabled(),true,'Exemplos precisam aguardar explicação');
  assert.equal(await page.locator('#remainingSummary span').count(),3);
  assert.ok(!requests.some(p=>/post\/lex-\d+\.json|archive\/legacy-/.test(p)),'Acervo pesado não pode carregar na abertura');
  await page.locator('#weekList button[data-week="2"]').click();
  await page.getByRole('button',{name:/Li a explicação/}).click();
  await page.locator('.example-cards .example-card').first().waitFor();
  assert.equal(await page.locator('.example-cards .example-card').count(),3);
  await page.getByRole('button',{name:/Verificar compreensão/}).click();
  for(const example of didactics.weeks[1].examples){
   const opts=await page.locator('.quiz-card .choices button').allTextContents();
   assert.ok(opts.includes(example.zh),'Exemplo correto ausente');
   await page.locator('.quiz-card .choices button').nth(opts.indexOf(example.zh)).click();
   await page.locator('.quiz-card').getByRole('button',{name:'Próxima questão →'}).click();
  }
  await page.locator('.quiz-card').getByRole('button',{name:'Continuar →'}).click();
  await page.getByRole('button',{name:'Iniciar prática (5 questões)'}).click();
  await answerWords(page);
  await page.getByRole('button',{name:/Conferi o gabarito/}).click();
  const reviewButtons=page.getByRole('button',{name:'Verificar lembrança (5 itens)'});
  assert.equal(await reviewButtons.first().isDisabled(),true,'Revisão D+1 não deve acontecer no mesmo dia');
  await editProgress(page,r=>{r.correction.date=shift(localDate(new Date()),-8)});
  await page.getByRole('button',{name:'Verificar lembrança (5 itens)'}).first().click();
  await answerWords(page);
  assert.equal(await page.getByRole('button',{name:'Verificar lembrança (5 itens)'}).first().isDisabled(),true,'Revisão D+3 não pode ocorrer no dia da primeira');
  await editProgress(page,r=>{r.review1.date=shift(r.correction.date,3)});
  await page.getByRole('button',{name:'Verificar lembrança (5 itens)'}).first().click();
  await answerWords(page);
  await page.getByRole('button',{name:'Abrir avaliação de retenção →'}).click();
  assert.equal(await page.getByRole('button',{name:'Fazer teste diferido (5 questões)'}).isDisabled(),true,'Retenção não pode ocorrer na mesma data da última revisão');
  await editProgress(page,r=>{r.review2.date=shift(localDate(new Date()),-1)});
  await page.getByRole('button',{name:'Fazer teste diferido (5 questões)'}).click();
  await answerWords(page);
  assert.match(await page.locator('#progressStatus').innerText(),/1 de 12/);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('.phase-bar button').first().waitFor();
  assert.match(await page.locator('#progressStatus').innerText(),/1 de 12/);
  await page.locator('#remainderKind').selectOption('grammar');
  assert.ok(await page.locator('#remainderItems .entry').count()>0);
  await page.locator('#libraryOpen').click();
  await page.locator('#libraryContent pre').first().waitFor({state:'visible',timeout:20000});
  await page.locator('#libraryKind').selectOption('atlas');
  await page.locator('#libraryContent .entry').first().waitFor({state:'visible',timeout:20000});
  assert.ok(await page.locator('#libraryContent .entry').count()>0);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'Transbordamento em '+width+'px');
  assert.deepEqual(errors,[],'Erros JS em '+width+'px');
  await context.close();
 }
 console.log(JSON.stringify({ok:true,viewports:[390,1440],weeks:12,phases:6,spacedReviewGates:true,retentionGate:true,progressPersistence:true,searchableRemainder:true,lazyLibrary:true}));
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
