/* Bǐshùn 8.0 — evidência temporal compartilhada. Compatível com registros v4/v7. */
(function(root){
'use strict';
const DAY=86400000,INTERVALS=[1,3,7,14,30,60,120,240];
const asNum=(v,fallback=0)=>Number.isFinite(Number(v))?Number(v):fallback;
const stamp=n=>Math.max(0,Math.floor(asNum(n)));
const passed=(n,total)=>total>0&&asNum(n)>=Math.ceil(total*.8);
function review(record,rating,time=Date.now()){
 const now=stamp(time),prior=record&&typeof record==='object'?record:{};
 const grade=Math.max(0,Math.min(2,Math.floor(asNum(rating))));
 let evidence=Array.isArray(prior.spacedEvidence)?prior.spacedEvidence.filter(n=>Number.isFinite(n)&&n>0).slice(-16):[];
 const last=evidence[evidence.length-1]||0;
 const eligible=grade===2&&(!last||now-last>=DAY)&&(!last||now>=asNum(prior.due));
 if(eligible)evidence=[...evidence,now].slice(-16);
 if(grade===0)evidence=[];
 const verifiedLevel=evidence.length;
 let due;
 if(grade===0)due=now;
 else if(eligible)due=now+DAY*INTERVALS[Math.min(verifiedLevel-1,INTERVALS.length-1)];
 else due=last?Math.max(asNum(prior.due),last+DAY):Math.max(asNum(prior.due),now+DAY);
 const next={...prior,attempts:Math.max(0,asNum(prior.attempts))+1,correct:Math.max(0,asNum(prior.correct))+(grade===2?1:0),
 last:now,due,verifiedLevel,spacedEvidence:evidence,
 historicalLevel:prior.historicalLevel??asNum(prior.level),
 level:asNum(prior.level),lastRating:grade};
 return{record:next,promoted:eligible,verifiedLevel,due,reason:eligible?'spaced':grade===0?'needs-relearning':'practice-only'};
}
function category(record,now=Date.now()){
 if(!record||!asNum(record.attempts))return'new';
 return asNum(record.due)<=now?'due':'learning';
}
function partition(items,records={},now=Date.now()){
 const out={new:[],due:[],learning:[]};
 for(const x of items){const id=x.id??x.char??x.x?.char??x.x?.id;
  const r=records?.[x.type]?.[id];out[category(r,now)].push(x);
 }
 return out;
}
function writing(record,char,mistakes,time=Date.now(),maximumMistakes=1){
 const prior=record&&typeof record==='object'?record:{},results={...(prior.writingResults||{})};
 if(!prior.writingResults&&Array.isArray(prior.writtenChars))
  for(const c of prior.writtenChars)if(typeof c==='string'&&!results[c])results[c]={attempts:0,passed:true,legacy:true};
 const errors=Math.max(0,Math.floor(asNum(mistakes))),old=results[char]||{},success=errors<=maximumMistakes;
 results[char]={attempts:Math.max(0,asNum(old.attempts))+1,bestMistakes:Math.min(asNum(old.bestMistakes,Infinity),errors),
 passed:Boolean(old.passed)||success,last:stamp(time)};
 const oldChars=Array.isArray(prior.writtenChars)?prior.writtenChars:[];
 return{writingResults:results,writtenChars:success?[...new Set([...oldChars,char])]:oldChars,
 writingMistakes:errors,writingCharacter:char,writingAttempts:Math.max(0,asNum(prior.writingAttempts))+1};
}
function retentionStatus(progress={},now=Date.now()){
 const originalDue=asNum(progress.retentionNextDueAt||progress.retentionDueAt);
 if(!originalDue)return{phase:'not-scheduled'};
 const initialAt=asNum(progress.initialPassedAt),due=Math.max(originalDue,initialAt?initialAt+DAY:0);
 const checks=Array.isArray(progress.objectiveChecks)?progress.objectiveChecks.filter(x=>passed(x.score,x.total)&&Number.isFinite(x.at)):[];
 if(checks.length>=2)return{phase:'consolidated',checks:checks.length};
 if(now>=due)return{phase:'due',checks:checks.length};
 return{phase:checks.length?'observed':'scheduled',dueAt:due,checks:checks.length};
}
function objective(progress={},score,total,time=Date.now()){
 const now=stamp(time),checks=Array.isArray(progress.objectiveChecks)?progress.objectiveChecks.slice(-10):[];
 const due=asNum(progress.retentionNextDueAt||progress.retentionDueAt),first=asNum(progress.initialPassedAt);
 if(!due||now<due||(first&&now-first<DAY))return{objectiveChecks:checks,recorded:false};
 const ok=passed(score,total),latest=checks[checks.length-1];
 if(ok&&(!latest||now-asNum(latest.at)>=DAY)){
  const next=[...checks,{at:now,score,total}].slice(-10);
  return{objectiveChecks:next,retentionNextDueAt:next.length>=2?null:now+3*DAY,
   retentionLastAttemptAt:now,recorded:true,consolidated:next.length>=2};
 }
 return{objectiveChecks:checks,retentionNextDueAt:ok?due:now+DAY,
  retentionLastAttemptAt:now,recorded:false,consolidated:false};
}
const api=Object.freeze({DAY,INTERVALS,review,category,partition,writing,retentionStatus,objective,passed});
root.BishunLearning=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
