import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const get=(file)=>fs.readFileSync(path.join(root,file),'utf8');
const data=JSON.parse(get('curso101/conteudo/modulos-01-04.json'));
const roadmap=JSON.parse(get('curso101/conteudo/roteiro-101.json'));
assert.equal(roadmap.totalModules,101);
assert.equal(roadmap.totalRadicals,201);
assert.equal(roadmap.implementedModules,4);
assert.equal(roadmap.modules.filter(m=>m.status==='planejado').length,97);
assert.deepEqual(roadmap.modules.flatMap(m=>m.radicalIds),Array.from({length:201},(_,i)=>i+1));
assert.equal(data.schemaVersion,1);
assert.equal(data.progressKey,'bishun-course101-v1');
assert.deepEqual(data.modules.map(x=>x.id),['001','002','003','004']);
const expected=['一','丨','丿','丶','乛','十','厂','匚'];
assert.deepEqual(data.modules.flatMap(m=>m.radicals.map(r=>r.hanzi)),expected);
assert.deepEqual(data.modules.flatMap(m=>m.radicals.map(r=>r.id)),[1,2,3,4,5,6,7,8]);
const questionIds=[];
for(const m of data.modules){
 assert.equal(m.radicals.length,2);
 assert.equal(m.quizzes.length,10,'Cada módulo precisa de 10 questões');
 assert.equal(m.quizzes.filter(q=>q.area==='radical').length,2);
 assert.equal(m.quizzes.filter(q=>q.type==='audio').length,2);
 assert.equal(m.quizzes.filter(q=>q.type==='input').length,2);
 assert.ok(m.dialogue.length>=3);
 assert.ok(m.oralTask.length>35);
 assert.ok(m.characters.length>=2);
 for(const q of m.quizzes){
  assert.ok(q.id&&q.explanation&&q.prompt);
  questionIds.push(q.id);
  if(q.type==='input')assert.ok(q.accepted.some(x=>/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ\d]/.test(x)));
  else assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<q.options.length);
  if(q.type==='audio')assert.ok(q.audio);
 }
}
assert.equal(new Set(questionIds).size,40);
const js=get('curso101/curso101.mjs'),html=get('curso-101.html'),css=get('curso101/curso101.css');
for(const token of ['speechSynthesis','SpeechSynthesisUtterance','MediaRecorder','localStorage','getUserMedia','importProgress','exportProgress','updateReviewRecord','correct(q,response)','normaliz'])assert.ok(js.includes(token),`Recurso ausente: ${token}`);
assert.ok(js.includes('now>=item.dueAt'),'Revisão antecipada não pode elevar o intervalo.');
assert.ok(!js.includes("'bishun-autoaula-01-v1'"),'Não misturar progressos de autoaulas antigas.');
assert.ok(html.includes('lang="pt-BR"')&&html.includes('type="module"')&&html.includes('aria-live'));
assert.ok(css.includes(':focus-visible')&&css.includes('prefers-reduced-motion')&&css.includes('max-width:720px'));
console.log('✓ Trilha 101: 201 radicais em ordem; 4 módulos interativos; 40 questões; 97 módulos previstos.');
