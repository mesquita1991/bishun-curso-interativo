import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(p,'utf8'),html=read('estudar.html'),script=read('estudar.js'),home=read('index.html');
const pkg=JSON.parse(read('package.json'));
assert.equal(pkg.version,'7.2.1');
for(const id of ['studyStage','studyUnit','studyContent','progressList','unitProgressBar','panel-aprender','panel-escrever','panel-revisar','panel-avaliar','finishLearn','quizWriting','startReview','startTest','prevUnit','nextUnit'])assert.ok(html.includes('id="'+id+'"'),'missing component '+id);
assert.ok(html.includes('role="tablist"')&&html.includes('role="tabpanel"'),'accessible tab structure');
assert.ok(html.includes('rel="canonical" href="https://mesquita1991.github.io/bishun-curso-interativo/estudar.html"'),'canonical');
assert.ok(home.includes('estudar.html?etapa=1&amp;unidade=1'),'home must lead directly to unit');
assert.ok(read('portal.js').includes("resume.href='estudar.html?etapa='"),'resume must restore study');
assert.ok(read('etapa.js').includes('Estudar esta unidade · 4 atividades'),'stage unit CTA missing');
for(const x of ['bishunFullV4','bishunUnitJourneyV70','unitsByStage','updateProgress','writerLoader','reviewQueue','quizQuestions','selectUnit','stageCache','popstate'])assert.ok(script.includes(x),'missing behavior '+x);
assert.ok(!html.includes('full-course.js')&&!html.includes('curriculum-data.js'),'no monolith on study page');
const map=JSON.parse(read('data/meta.json'));
assert.equal(map.totalUnits,300);assert.equal(map.stages.length,9);assert.equal(map.stages.reduce((n,s)=>n+s.unitCount,0),300);
for(let i=1;i<=9;i++){const data=JSON.parse(read('data/stage-'+i+'.json'));assert.equal(data.units.length,map.stages[i-1].unitCount);assert.ok(data.units.every(u=>Array.isArray(u.characters)&&u.characters.length));}
const sitemap=read('sitemap.xml');assert.ok(sitemap.includes('/estudar.html'));
assert.ok(read('sw.js').includes('bishun-offline-7.2.1'),'cache version must update');
console.log(JSON.stringify({ok:true,version:pkg.version,units:300,stages:9,studyModes:4,homeStudyLink:true,monolithNotLoaded:true}));