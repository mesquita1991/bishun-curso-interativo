(()=>{
'use strict';
const resume=document.getElementById('portalResume');
if(resume){
 let stage=1,unit=1,hasProgress=false,flow={};
 try{
  const saved=JSON.parse(localStorage.getItem('bishunFullV4')||'{}');flow=JSON.parse(localStorage.getItem('bishunUnitJourneyV70')||'{}');const last=flow.last||{};
  hasProgress=Boolean(last.stage||saved.stage);
  stage=Math.max(1,Math.min(9,Number(last.stage||saved.stage)||1));
  const limits=[30,30,30,30,30,30,40,40,40];
  unit=Math.max(1,Math.min(limits[stage-1],Number(last.unit||saved.unitsByStage?.[stage]||saved.unit)||1));
 }catch{}
 const r=flow.units?.[stage+':'+unit]||{};const reviewDue=Boolean(window.BishunLearning&&window.BishunLearning.retentionStatus(r).phase==='due');
 resume.href='estudar.html?etapa='+stage+'&unidade='+unit+(reviewDue?'&modo=avaliar':'');
 resume.textContent=reviewDue?'Rever o que aprendi na unidade '+unit:hasProgress?'Continuar: etapa '+stage+', unidade '+unit:'Abrir minha primeira unidade';
}
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost')){
 window.addEventListener('load',()=>{
  const run=()=>navigator.serviceWorker.register('./sw.js?v=9.0.0',{updateViaCache:'none'}).catch(e=>console.warn('Cache indisponível',e));
  if('requestIdleCallback'in window)requestIdleCallback(run,{timeout:2500});else setTimeout(run,0)
 },{once:true})
}
})();