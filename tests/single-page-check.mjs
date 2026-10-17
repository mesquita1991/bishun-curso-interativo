import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(p,'utf8');
assert.deepEqual(fs.readdirSync('.').filter(f=>f.endsWith('.html')),['index.html'],'Não deve haver outro HTML público');
assert.ok(!fs.existsSync('docs/arquivo-curso-6.8.1.html'),'Documento histórico HTML deve ter sido arquivado');
const html=read('index.html'),script=read('single-page.js');
assert.equal((html.match(/<h1\\b/g)||[]).length,1);
assert.ok(!/<nav\\b|<a\\b|<button\\b/i.test(html),'Sem navegação nem fluxos');
assert.ok(!/rel="stylesheet"/.test(html),'Não carregar estilos anteriores');
for(const f of ['manual-catalogo.json','data/stage-','trilha-v9.json','data/post/lex-','archive/legacy-','visual-mnemonics-6.2.1.json','conteudos.json'])assert.ok(script.includes(f),'Fonte não carregada: '+f);
for(const file of ['plataforma.js','estudar.js','trilha-v9.js','manual-web.js','app.js','full-course.js'])assert.ok(fs.existsSync(file),'Motores históricos preservados: '+file);
const catalog=JSON.parse(read('manual-catalogo.json'));
assert.equal(catalog.pdfPageCount,198);
assert.equal(catalog.pageParts.flatMap(x=>x.pages).length,198);
for(const p of [...catalog.pageParts,...catalog.visualParts])assert.ok(fs.existsSync(p.file),'Fragmento do manual ausente: '+p.file);
let totalUnits=0,characters=0,words=0;
for(let n=1;n<=9;n++){const d=JSON.parse(read('data/stage-'+n+'.json'));assert.equal(d.stage,n);totalUnits+=d.units.length;characters+=d.characters.length;words+=d.vocabulary.length}
assert.equal(totalUnits,300);assert.equal(characters,3000);assert.equal(words,11092);
assert.equal(JSON.parse(read('trilha-v9.json')).lessons.length,302);
assert.equal(JSON.parse(read('visual-mnemonics-6.2.1.json')).items.length,48);
let historical=0;
for(let n=1;n<=3;n++){const files=JSON.parse(read('archive/legacy-'+n+'.json'));historical+=Object.keys(files).length;for(const [name,html]of Object.entries(files))assert.ok(html.includes('<html'),'HTML original perdido: '+name)}
assert.equal(historical,24);
for(let n=0;n<128;n++)assert.ok(fs.existsSync('data/post/lex-'+String(n).padStart(3,'0')+'.json'));
for(let n=0;n<16;n++)assert.ok(fs.existsSync('data/post/search-index-'+String(n).padStart(2,'0')+'.json'));
assert.equal((read('sitemap.xml').match(/<loc>/g)||[]).length,1);
console.log(JSON.stringify({ok:true,publicPages:1,archivedPages:historical,manualPages:198,stages:9,units:300,characters:3000,vocabulary:11092,lessons:302,mnemonics:48,lexShards:128,searchShards:16}));