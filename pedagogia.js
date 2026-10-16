/* Pedagogia Bǐshùn 7.2: funções puras e testáveis, sem dependência de framework. */
(function(root){
'use strict';
const DAY=86400000;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const norm=x=>String(x??'').trim().normalize('NFKC').replace(/\s+/g,' ').toLocaleLowerCase('pt-BR');
function chunks(items,size=2){const list=Array.isArray(items)?items:[],part=Math.max(1,Math.floor(size));return Array.from({length:Math.ceil(list.length/part)},(_,i)=>list.slice(i*part,i*part+part))}
function writingTarget(characters){return Math.min(3,characters.length)}
function writingCompletion(record,characters){const permitted=new Set(characters.map(x=>x.char)),practiced=new Set((record?.writtenChars||[]).filter(x=>permitted.has(x)));return{count:practiced.size,needed:writingTarget(characters),complete:practiced.size>=writingTarget(characters)}}
function shuffle(input,random=Math.random){const a=[...input];for(let i=a.length-1;i>0;i--){const j=clamp(Math.floor(random()*(i+1)),0,i);[a[i],a[j]]=[a[j],a[i]]}return a}
function assessment(unitCharacters,stageCharacters,random=Math.random){
 const chars=shuffle(unitCharacters.filter(c=>c.char&&norm(c.meaning)),random);
 const stage=stageCharacters.filter(c=>c.char&&norm(c.meaning));
 return chars.map(c=>{
  const seen=new Set([norm(c.meaning)]),choices=[c.meaning];
  for(const candidate of shuffle([...unitCharacters,...stage],random)){
   const normalized=norm(candidate.meaning);
   if(!normalized||seen.has(normalized))continue;
   seen.add(normalized);choices.push(candidate.meaning);
   if(choices.length===4)break
  }
  return {char:c.char,correct:c.meaning,options:shuffle(choices,random)};
 }).filter(x=>x.options.length===4)
}
function reviewItems(chars,words,records={},initial=true,now=Date.now()){
 const charItems=chars.map(x=>({type:'char',id:x.char,char:x.char,pinyin:x.pinyin,meaning:x.meaning})),
 wordItems=words.slice(0,4).map(x=>({type:'word',id:x.id,char:x.hanzi,pinyin:x.pinyin,meaning:x.meaning}));
 const items=[...charItems,...wordItems].map(x=>{
  const r=records?.[x.type]?.[x.id];return{...x,isNew:!r?.attempts,isDue:!!r?.attempts&&(Number(r.due)||0)<=now,dueAt:Number(r?.due)||0}
 });
 return initial?items:items.filter(x=>x.isDue)
}
function completePractice(state,characters){const required=writingTarget(characters),writing=writingCompletion(state,characters),reviewed=Boolean(state.reviewed&&state.reviewCount>=characters.length),tested=Boolean(state.evaluated&&state.examTotal===characters.length&&state.score>=Math.ceil(characters.length*.8));return {learned:Boolean(state.learned),written:writing.complete,reviewed,evaluated:tested,writingNeeded:required,writingDone:writing.count,completed:[Boolean(state.learned),writing.complete,reviewed,tested].filter(Boolean).length}}
function retentionStatus(state,now=Date.now()){
 if(!state?.retentionDueAt)return {phase:'not-scheduled'};
 if(state.retentionCheckedAt&&state.retentionCheckedAt>=state.retentionDueAt&&state.retentionRemembered>=state.retentionTotal*.8)return {phase:'observed',remembered:state.retentionRemembered,total:state.retentionTotal};
 return now>=state.retentionDueAt?{phase:'due'}:{phase:'scheduled',dueAt:state.retentionDueAt}
}
const api=Object.freeze({chunks,writingTarget,writingCompletion,shuffle,assessment,reviewItems,completePractice,retentionStatus,DAY});
root.BishunPedagogy=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
