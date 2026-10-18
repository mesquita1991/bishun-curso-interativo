import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=path=>fs.readFileSync(path,'utf8');
const plan=JSON.parse(read('programa-12-semanas.json'));
const didactics=JSON.parse(read('didatica-12-semanas.json'));
const script=read('pedagogia-semanal.js');
const html=read('index.html');
const stages=Array.from({length:9},(_,i)=>JSON.parse(read('data/stage-'+(i+1)+'.json')));
const words=new Map(stages.flatMap(s=>s.vocabulary.map(x=>[x.hanzi,x])));
const chars=new Set(stages.flatMap(s=>s.characters.map(x=>x.char)));
assert.equal(didactics.weeks.length,12);
assert.equal(didactics.weeks[0].selfStudy.dialogue.length,5);
assert.match(didactics.weeks[0].selfStudy.pattern.pinyin,/wǒ jiào/);
assert.match(didactics.weeks[0].selfStudy.toneNote,/tons lexicais escritos/);
assert.ok(html.includes('<script defer src="pedagogia-semanal.js?v=2"></script>'));
assert.ok(html.indexOf('pedagogia-semanal.js')<html.indexOf('single-page.js'));
assert.ok(read('single-page.js').includes('window.BishunWeekly.render'));
for(const key of ['explain','examples','practice','correction','review','retention','review1','review2','retentionDue','failedDate','localStorage']){
 if(key==='localStorage')assert.ok(read('single-page.js').includes(key));
 else assert.ok(script.includes(key),'Estado ou fase ausente: '+key);
}
for(let i=0;i<12;i++){
 const x=didactics.weeks[i],w=plan.weeks[i];
 assert.equal(x.week,i+1);
 assert.ok(x.concept.length>=10&&x.explanation.length>=50&&x.pitfall.length>=30);
 assert.equal(x.examples.length,3);
 for(let j=0;j<3;j++){
  const s=x.examples[j];
  assert.equal(s.zh,w.models[j],'Exemplo desconectado da semana '+(i+1));
  assert.ok(s.pinyin.length>=4&&s.pt.length>=3,'Tradução ou pronúncia incompleta');
 }
 assert.ok(w.words.length>=5&&w.words.every(term=>words.has(term)));
 assert.ok(w.characters.every(term=>chars.has(term)));
}
assert.ok(script.includes('plus(anchor,1)')&&script.includes('plus(anchor,3)')&&script.includes('plus(r.correction.date,7)'),'Datas D+1, D+3 e D+7 ausentes');
assert.ok(script.includes('score>=need')&&script.includes('Math.ceil(total*.8)'),'Critérios objetivos não implementados');
assert.ok(script.includes('day()<due'),'O bloqueio temporal deve existir');
console.log(JSON.stringify({ok:true,weeklyLessons:12,comprehensibleExamples:36,phases:6,objectivePractice:5,spacedDays:[1,3,7],certification:false}));
