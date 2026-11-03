import assert from 'node:assert/strict';
import fs from 'node:fs';
const get=f=>fs.readFileSync(f,'utf8');
const pkg=JSON.parse(get('curso101/conteudo/modulos-001-101.json'));
const old=JSON.parse(get('curso101/conteudo/modulos-01-04.json'));
const road=JSON.parse(get('curso101/conteudo/roteiro-101.json'));
assert.equal(pkg.schemaVersion,1);assert.equal(pkg.progressKey,'bishun-course101-v1');
assert.equal(pkg.modules.length,101);assert.equal(road.totalModules,101);assert.equal(road.implementedModules,101);
assert.deepEqual(pkg.modules.slice(0,4),old.modules);
const radicals=pkg.modules.flatMap(m=>m.radicals);
assert.equal(radicals.length,201);assert.deepEqual(radicals.map(r=>r.id),Array.from({length:201},(_,i)=>i+1));assert.equal(new Set(radicals.map(r=>r.hanzi)).size,201);
assert.deepEqual(radicals.map(r=>r.hanzi),road.modules.flatMap(m=>m.radicais));
let ids=[];
for(let i=0;i<101;i++){const m=pkg.modules[i],n=Number(m.id);
 assert.equal(n,i+1);assert.equal(m.radicals.length,n===101?0:n===100?3:2);
 assert.equal(m.quizzes.length,n===101?211:n===100?11:10);
 assert.ok(m.dialogue.length>=1&&m.characters.length>=2&&m.grammar.length>=2&&m.oralTask.length>=30);
 assert.equal(m.quizzes.filter(q=>q.type==='audio').length,2);assert.equal(m.quizzes.filter(q=>q.type==='input').length,2);
 assert.equal(m.quizzes.filter(q=>q.area==='radical').length,n===101?201:n===100?3:2);
 for(const q of m.quizzes){ids.push(q.id);assert.ok(q.prompt&&q.explanation);if(q.type==='input')assert.ok(q.accepted?.length);else{assert.ok(q.correct>=0&&q.correct<q.options.length);assert.equal(new Set(q.options).size,q.options.length)}}
}
assert.equal(ids.length,1212);assert.equal(new Set(ids).size,1212);
const js=get('curso101/curso101.mjs'),html=get('curso-101.html'),build=get('scripts/build-site.mjs');
assert.ok(js.includes('modulos-001-101.json')&&js.includes('pack.modules.length!==101')&&js.includes('now>=item.dueAt'));
assert.ok(html.includes('101 módulos')&&build.includes('modulos-001-101.json'));
console.log('OK: 101 módulos, 201 radicais, 1212 questões, módulos 1–4 preservados.');
