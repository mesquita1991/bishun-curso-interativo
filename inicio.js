(()=>{
 'use strict';
 const units=[
  ['01','bishun-autoaula-01-v1'],
  ['02','bishun-autoaula-02-v1'],
  ['03','bishun-autoaula-03-v1'],
  ['04','bishun-autoaula-04-v1'],
  ['05','bishun-autoaula-05-v1']
 ];
 const readProgress=key=>{try{const state=JSON.parse(localStorage.getItem(key)||'{}');const completed=state.completed||{};return ['dialogue','practice','task','key'].filter(step=>completed[step]).length}catch{return 0}};
 document.querySelectorAll('[data-progress]').forEach(card=>{
  const unit=units.find(([number])=>number===card.dataset.progress);
  if(!unit)return;
  const completed=readProgress(unit[1]);
  card.textContent=completed===4?'Aula concluída neste aparelho · revisite quando quiser':`${completed} de 4 etapas concluídas neste aparelho`;
 });
})();
