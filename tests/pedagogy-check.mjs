import fs from 'node:fs';import assert from 'node:assert/strict';import '../pedagogia.js';
const p=globalThis.BishunPedagogy,meta=JSON.parse(fs.readFileSync('data/meta.json','utf8'));
let count=0;
for(let stage=1;stage<=9;stage++){
 const data=JSON.parse(fs.readFileSync('data/stage-'+stage+'.json','utf8')),lookup=new Map(data.characters.map(c=>[String(c.id),c]));
 for(const unit of data.units){
  count++;const chars=unit.characters.map(id=>lookup.get(String(id)));
  assert.ok(chars.every(Boolean));
  assert.equal(p.chunks(chars,2).flat().length,chars.length);
  const questions=p.assessment(chars,data.characters,()=>0.43);
  assert.equal(questions.length,chars.length,'Must quiz each distinct character');
  assert.equal(new Set(questions.map(x=>x.char)).size,chars.length);
  for(const q of questions){assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);assert.ok(q.options.includes(q.correct))}
  const needed=p.writingTarget(chars),writtenChars=chars.slice(0,needed).map(x=>x.char);
  assert.equal(p.writingCompletion({writtenChars},chars).complete,true);
  assert.equal(p.writingCompletion({writtenChars:[chars[0].char,chars[0].char]},chars).complete,false);
  assert.equal(p.completePractice({learned:true,reviewed:true,reviewCount:chars.length,evaluated:true,examTotal:chars.length,score:7,writtenChars},chars).completed,3);
  assert.equal(p.completePractice({learned:true,reviewed:true,reviewCount:chars.length,evaluated:true,examTotal:chars.length,score:8,writtenChars},chars).completed,4);
 }
}
assert.equal(count,meta.totalUnits);
assert.equal(p.retentionStatus({retentionDueAt:2000},1000).phase,'scheduled');
assert.equal(p.retentionStatus({retentionDueAt:2000},3000).phase,'due');
assert.equal(p.retentionStatus({retentionDueAt:2000,retentionCheckedAt:3000,retentionTotal:10,retentionRemembered:8},4000).phase,'observed');
assert.equal(p.reviewItems([{char:'你',pinyin:'nǐ',meaning:'você'}],[],{},false,3000).length,0);
console.log('Pedagogia verificada em '+count+' unidades.');
