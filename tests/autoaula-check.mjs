import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('index.html','utf8');
const js=fs.readFileSync('autoaula.js','utf8');
const css=fs.readFileSync('autoaula.css','utf8');
assert.equal((html.match(/<h1\b/g)||[]).length,1,'A auto-aula deve ter um título principal.');
assert.ok(html.includes('autoaula.js?v=2')&&html.includes('autoaula.css?v=2'),'A página deve carregar apenas a interface dedicada.');
for(const retired of ['single-page.js','pedagogia-semanal.js','library-lite.js','curriculum-data.js','manual-catalogo.json','didatica-12-semanas.json','remainingSummary','weekList','libraryKind'])assert.ok(!html.includes(retired),'Conteúdo legado referenciado na página: '+retired);
for(const id of ['dialogo','pratique','tarefa','gabarito','revisao','listenTwice','showDialogue','checkListening','listeningStatus','checkBlanks','sortableConversation','togglePinyin','pausePractice','recordStart','recordStop','rubric','answerKey','progressBar','toneSelfCheck','toneStatus'])assert.ok(html.includes(`id="${id}"`),'Elemento da auto-aula ausente: '+id);
for(const zh of ['你好','我叫安娜','你呢','很高兴认识你','我也很高兴认识你','安娜','大卫'])assert.ok(html.includes(zh),'Conteúdo da Unidade 1 ausente: '+zh);
for(const key of ['listenTwice','checkListening','checkBlanks','checkOrder','togglePinyin','pausePractice','getUserMedia','MediaRecorder','criterion3','criterion4','completedAt','days={today:0,tomorrow:1,threeDays:3,week:7}','D+3–4'])assert.ok(js.includes(key)||html.includes(key),'Interação ou revisão ausente: '+key);
assert.equal((html.match(/class="tone-item"/g)||[]).length,4,'A aula deve ensinar visualmente os quatro tons lexicais.');
for(const phrase of ['mā','má','mǎ','mà','tom neutro','não mede a precisão acústica'])assert.ok(html.includes(phrase)||js.includes(phrase),'Exemplo ou limite pedagógico de tom ausente: '+phrase);
for(const feature of ['@media(max-width:640px)',':focus-visible','prefers-reduced-motion','aria-live','skip-link'])assert.ok(css.includes(feature)||html.includes(feature),'Acessibilidade/responsividade ausente: '+feature);
for(const file of ['single-page.js','pedagogia-semanal.js','library-lite.js','curriculum-data.js','didatica-12-semanas.json','data/stage-1.json','manual-catalogo.json','archive/legacy-1.json','programa-12-semanas.json'])assert.ok(fs.existsSync(file),'Legado não preservado no repositório: '+file);
const workflow=fs.readFileSync('.github/workflows/deploy-autoaula.yml','utf8');
assert.ok(workflow.includes('path: dist'),'A publicação deve partir do pacote filtrado.');
console.log(JSON.stringify({ok:true,activeLesson:'autoaula-01',legacyPreserved:true,legacyNotLoaded:true,practiceSections:5,recording:true,spacedReviews:3,outputWhitelist:true}));
