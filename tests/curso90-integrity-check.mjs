import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(p,'utf8'),html=read('index.html'),build=read('scripts/build-site.mjs');
const ids=['estudo90','startStudy','speechHint','curso','weekList','lesson','progressStatus','restante','remainingSummary','remainderKind','remainderStage','remainderQuery','remainderItems','remainderPrev','remainderNext','remainderPage','biblioteca','libraryKind','libraryQuery','libraryOpen','libraryStatus','libraryContent'];
for(const id of ids)assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,'ID ausente/duplicado: '+id);
for(const s of ['curso90.css?v=1','pedagogia-semanal.js?v=2','single-page.js?v=2','library-lite.js?v=1'])
 assert.ok(html.includes(s),'Asset semanal não publicado: '+s);
assert.ok(html.includes('não selecionados')||html.includes('não selecionado'),'Inventário ainda não selecionado ausente');
assert.equal((html.match(/class="unit-card"/g)||[]).length,6,'Seis autoaulas continuam intactas');
for(let n=1;n<=6;n++)assert.ok(html.includes('unidade-0'+n+'.html'),'Autoaula perdida: '+n);
for(const file of ['single-page.js','library-lite.js','pedagogia-semanal.js','programa-12-semanas.json','didatica-12-semanas.json','manual-catalogo.json'])
 assert.ok(build.includes("'"+file+"'"),'A publicação não copia '+file);
assert.ok(build.includes("['data','archive']")&&build.includes('manualParts'),'Publicar a biblioteca completa, inclusive conteúdo não ensinado');
const plan=JSON.parse(read('programa-12-semanas.json')),ped=JSON.parse(read('didatica-12-semanas.json'));
assert.equal(plan.weeks.length,12);assert.equal(plan.closing.length,6);assert.equal(ped.weeks.length,12);
const src=read('single-page.js'),did=read('pedagogia-semanal.js'),library=read('library-lite.js');
assert.ok(src.includes('BishunWeekly.render')&&src.includes('function remain()')&&src.includes('function summary()'));
for(const word of ['explain','examples','practice','correction','review','retention'])assert.ok(did.includes(word),'Didática sem '+word);
for(const path of ['manual-catalogo.json','data/post/lex-','archive/legacy-','data/post/search-index-'])assert.ok(library.includes(path));
const stages=Array.from({length:9},(_,i)=>JSON.parse(read('data/stage-'+(i+1)+'.json')));
assert.equal(stages.reduce((n,x)=>n+x.units.length,0),300);
assert.equal(stages.reduce((n,x)=>n+x.characters.length,0),3000);
assert.equal(stages.reduce((n,x)=>n+x.vocabulary.length,0),11092);
const selected={words:new Set(),chars:new Set(),grammar:new Set()};
for(const w of plan.weeks){
 assert.ok(w.words.length>=8&&w.characters.length>=6&&w.models.length===3&&w.tasks.length===3);
 for(const word of w.words)selected.words.add(word);
 for(const c of w.characters)selected.chars.add(c);
 for(const g of w.grammar)selected.grammar.add(Number(g));
}
const total={words:stages.flatMap(x=>x.vocabulary),chars:stages.flatMap(x=>x.characters),grammar:stages.flatMap(x=>x.grammar)};
for(const word of selected.words)assert.ok(total.words.some(x=>x.hanzi===word),'Vocabulário sem fonte: '+word);
for(const c of selected.chars)assert.ok(total.chars.some(x=>x.char===c),'Caractere sem fonte: '+c);
for(const g of selected.grammar)assert.ok(total.grammar.some(x=>Number(x.no)===g),'Regra sem fonte: '+g);
assert.equal(JSON.parse(read('manual-catalogo.json')).pdfPageCount,198);
assert.equal(JSON.parse(read('trilha-v9.json')).lessons.length,302);
assert.equal(JSON.parse(read('data/post/meta.json')).inventory.entryCount,124370);
assert.equal(JSON.parse(read('visual-mnemonics-6.2.1.json')).items.length,48);
console.log(JSON.stringify({ok:true,courseWeeks:12,closingDays:6,retainedAutoLessons:6,unselected:{words:total.words.filter(w=>!selected.words.has(w.hanzi)).length,characters:total.chars.filter(c=>!selected.chars.has(c.char)).length,grammar:total.grammar.filter(g=>!selected.grammar.has(Number(g.no))).length},archive:true,manual:198}));
