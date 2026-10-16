
(()=>{'use strict';
const $=q=>document.querySelector(q);
const progress=$('#portalResume');
if(progress){try{const saved=JSON.parse(localStorage.getItem('bishunFullV4')||'{}');const n=Math.max(1,Math.min(9,Number(saved.stage)||1));const unit=Number(saved.unitsByStage?.[n]??saved.unit)||1;progress.textContent='Retomar etapa '+n+' · unidade '+unit;progress.href='curso.html#programa-integral';}catch{progress.textContent='Abrir meu estudo';}}
})();
