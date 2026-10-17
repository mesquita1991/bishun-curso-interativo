import fs from 'node:fs';import assert from 'node:assert/strict';
const read=f=>fs.readFileSync(f,'utf8'),pkg=JSON.parse(read('package.json'));
assert.equal(pkg.version,'9.0.0');
for(let stage=1;stage<=9;stage++){const d=JSON.parse(read('data/stage-'+stage+'.json'));assert.equal(d.stage,stage);assert.equal(d.units.length,stage<=6?30:40);assert.equal(d.units.reduce((n,u)=>n+u.characters.length,0),d.characters.length)}
const m=JSON.parse(read('manual-catalogo.json'));
assert.deepEqual([m.pdfPageCount,m.atlasCount,m.characterCount,m.strokeSteps],[198,410,164,1157]);
for(const file of ['app.js','course.js','curriculum-data.js','full-course.js','post-standard.js','mastery-v6.js'])assert.ok(fs.existsSync(file));
const study=read('estudar.js');
for(const fragment of ['learning.review(previous,q)','learning.objective(prev,score,exam.length,now)','correctPair=pairScore===pairQuestions.length','learning.writing(p,char,errors)'])assert.ok(study.includes(fragment),fragment);
assert.ok(!study.includes('updates.retentionCheckedAt=Date.now()'));
assert.ok(read('laboratorio.js').includes('learning.writing(previous,char,mistakes)'));
for(const f of ['index.html','estudar.html','laboratorio.html','avaliacao.html'])assert.ok(read(f).includes('aprendizagem-v8.js?v=8.0.0'));
for(const f of ['avancado.html','docs/arquivo-curso-6.8.1.html'])for(const id of ['id="imersao-aberta"','id="validacao-v6"'])assert.ok(read(f).includes(id));
for(const f of ['post-standard.js','mastery-v6.js','full-course.js'])assert.ok(read('avancado.html').includes(f));
assert.ok(read('sw.js').includes('bishun-offline-9.0.0'));
assert.ok(read('manual-web.js').includes('bishunManualV8'));
console.log('v8: currículo integral, roteamento, ferramentas e interoperabilidade verificados');
