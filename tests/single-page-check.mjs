import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(p,'utf8');
const html=read('index.html'),js=read('single-page.js'),library=read('library-lite.js'),css=read('app-lite.css');
assert.deepEqual(fs.readdirSync('.').filter(p=>p.endsWith('.html')),['index.html'],'Deve existir uma única página HTML');
assert.ok(!fs.existsSync('docs/arquivo-curso-6.8.1.html'),'Os HTMLs históricos foram arquivados como JSON');
assert.equal((html.match(/<h1\b/g)||[]).length,1,'Cabeçalho principal único');
for(const id of ['curso','weekList','lesson','restante','remainingSummary','remainderItems','remainderStage','remainderQuery','biblioteca','libraryKind','libraryOpen','libraryContent'])
 assert.ok(html.includes('id="'+id+'"'),'Elemento ausente: '+id);
for(const src of ['single-page.js?v=1','library-lite.js?v=1','app-lite.css?v=1'])
 assert.ok(html.includes(src),'Dependência ausente: '+src);
assert.ok(!/href="[^"#]+\.html(?:[?"#]|")/.test(html),'Não criar páginas secundárias');
assert.ok(css.includes('@media(max-width:540px)')&&css.includes(':focus-visible')&&html.includes('aria-label'),'Acessibilidade e responsividade');
for(const fragment of ['aria-current','aria-pressed','localStorage','renderQuiz','renderPractice','selected[kind]','remainingPage'])
 assert.ok(js.includes(fragment),'Fluxo funcional ausente: '+fragment);
for(const fragment of ['manual-catalogo.json','data/post/lex-','trilha-v9.json','archive/legacy-','data/mastery-v6.json','visual-mnemonics-6.2.1.json','data/post/search-index-'])
 assert.ok(library.includes(fragment),'Fonte não acessível pela biblioteca: '+fragment);
for(const file of ['plataforma.js','estudar.js','trilha-v9.js','manual-web.js','app.js','full-course.js'])
 assert.ok(fs.existsSync(file),'Motor original perdido: '+file);
const plan=JSON.parse(read('programa-12-semanas.json'));
assert.equal(plan.weeks.length,12);assert.equal(plan.closing.length,6);
const stages=Array.from({length:9},(_,i)=>JSON.parse(read('data/stage-'+(i+1)+'.json')));
assert.deepEqual(stages.map(s=>s.stage),[1,2,3,4,5,6,7,8,9]);
assert.equal(stages.reduce((a,s)=>a+s.units.length,0),300);
assert.equal(stages.reduce((a,s)=>a+s.characters.length,0),3000);
assert.equal(stages.reduce((a,s)=>a+s.vocabulary.length,0),11092);
assert.equal(stages.reduce((a,s)=>a+s.grammar.length,0),573);
const words=new Set(stages.flatMap(s=>s.vocabulary.map(x=>x.hanzi))),chars=new Set(stages.flatMap(s=>s.characters.map(x=>x.char))),rules=new Set(stages.flatMap(s=>s.grammar.map(x=>Number(x.no))));
const applied={vocabulary:new Set(),characters:new Set(),grammar:new Set()};
for(const [i,w] of plan.weeks.entries()){
 assert.equal(w.week,i+1);assert.equal(w.manualPage,i+6);assert.deepEqual(w.days,[i*7+1,i*7+7]);
 assert.equal(w.tasks.length,3);assert.equal(w.models.length,3);
 for(const x of w.words){assert.ok(words.has(x),'Vocabulário não localizado: '+x);applied.vocabulary.add(x)}
 for(const x of w.characters){assert.ok(chars.has(x),'Caractere não localizado: '+x);applied.characters.add(x)}
 for(const x of w.grammar){assert.ok(rules.has(x),'Gramática não localizada: '+x);applied.grammar.add(x)}
}
assert.deepEqual(plan.closing.map(x=>x.day),[85,86,87,88,89,90]);
const remaining={vocabulary:stages.flatMap(x=>x.vocabulary).filter(x=>!applied.vocabulary.has(x.hanzi)).length,characters:stages.flatMap(x=>x.characters).filter(x=>!applied.characters.has(x.char)).length,grammar:stages.flatMap(x=>x.grammar).filter(x=>!applied.grammar.has(Number(x.no))).length};
assert.ok(remaining.vocabulary>10000&&remaining.characters>2800&&remaining.grammar>500,'Itens ainda não ensinados devem continuar disponíveis');
const c=JSON.parse(read('manual-catalogo.json'));
assert.equal(c.pdfPageCount,198);assert.equal(c.pageParts.flatMap(x=>x.pages).length,198);
assert.equal(c.visualParts.flatMap(x=>x.pages).length,85);
assert.equal(c.atlas.length,410);assert.equal(c.characters.length,164);
assert.equal(c.characters.reduce((sum,x)=>sum+x.n,0),1157);
for(const part of [...c.pageParts,...c.visualParts])assert.ok(fs.existsSync(part.file),'Falta arquivo do manual: '+part.file);
assert.equal(JSON.parse(read('trilha-v9.json')).lessons.length,302);
assert.equal(JSON.parse(read('visual-mnemonics-6.2.1.json')).items.length,48);
const post=JSON.parse(read('data/post/curriculum.json'));
assert.deepEqual([post.readings.length,post.pragmatics.length,post.missions.length],[52,100,120]);
assert.equal(JSON.parse(read('data/mastery-v6.json')).benchmarks.length,36);
const meta=JSON.parse(read('data/post/meta.json'));
assert.equal(meta.inventory.entryCount,124370);assert.equal(meta.shards.length,128);
for(const shard of meta.shards)assert.ok(fs.existsSync(shard.file),'Falta fragmento lexical: '+shard.file);
for(const file of meta.files.searchIndexParts)assert.ok(fs.existsSync(file),'Falta índice lexical: '+file);
assert.equal(JSON.parse(read('data/post/idioms.json')).length,5295);
let archived=0;
for(let i=1;i<=3;i++){
 const originals=JSON.parse(read('archive/legacy-'+i+'.json'));archived+=Object.keys(originals).length;
 for(const [name,body] of Object.entries(originals))assert.ok(body.includes('<html'),'Histórico incompleto: '+name);
}
assert.equal(archived,24);
assert.equal((read('sitemap.xml').match(/<loc>/g)||[]).length,1);
console.log(JSON.stringify({ok:true,publicPages:1,weeks:12,days:90,stages:9,units:300,characters:3000,vocabulary:11092,grammar:573,unused:remaining,manualPages:198,atlas:410,strokes:1157,lessons:302,lexicon:124370,archivedPages:24}));
