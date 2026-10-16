
(()=>{'use strict';
const $=q=>document.querySelector(q);
const progress=$('#portalResume');
if(progress){try{const saved=JSON.parse(localStorage.getItem('bishunFullV4')||'{}');const n=Math.max(1,Math.min(9,Number(saved.stage)||1));const unit=Number(saved.unitsByStage?.[n]??saved.unit)||1;progress.textContent='Retomar etapa '+n+' · unidade '+unit;progress.href='etapa-'+n+'.html';}catch{progress.textContent='Abrir meu estudo';}}

if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost')){window.addEventListener('load',()=>{const run=()=>navigator.serviceWorker.register('./sw.js?v=6.9.1',{updateViaCache:'none'}).catch(e=>console.warn('Cache offline indisponível:',e));if('requestIdleCallback' in window)requestIdleCallback(run,{timeout:2500});else setTimeout(run,0)},{once:true})}
})();
