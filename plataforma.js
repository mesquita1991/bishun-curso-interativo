/* Bǐshùn — superfície pública de versão e acessos comuns, sem dependências. */
(()=>{'use strict';
const FALLBACK='9.0.0';
const add=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt)e.textContent=txt;return e};
function init(){
 const header=document.querySelector('.site-header'),footer=document.querySelector('.site-footer-inner');
 if(header){const tools=add('div','site-utility');const wrap=add('div','wrap site-utility-inner');
 const manual=add('a','site-utility-link','Manual de estudos');manual.href='manual.html';
 const changes=add('a','site-utility-link','O que mudou');changes.href='historico.html';
 const version=add('a','site-utility-version','Versão '+FALLBACK);version.href='historico.html';version.dataset.bishunVersionLabel='';
 wrap.append(manual,changes,version);tools.append(wrap);header.after(tools);
 const here=location.pathname.split('/').pop()||'index.html';if(here==='manual.html')manual.setAttribute('aria-current','page');if(here==='historico.html')changes.setAttribute('aria-current','page');
 }
 if(footer){const note=add('div','site-release-footer');const label=add('span',null,'Bǐshùn ');const version=add('strong',null,FALLBACK);version.dataset.bishunVersion='';const a=add('a',null,'Histórico de atualizações');a.href='historico.html';note.append(label,version,' · ',a);footer.append(note);}
 function setVersion(version){if(!/^\d+\.\d+\.\d+$/.test(version))return;document.querySelectorAll('[data-bishun-version]').forEach(x=>x.textContent=version);document.querySelectorAll('[data-bishun-version-label]').forEach(x=>x.textContent='Versão '+version)}
 setVersion(FALLBACK);
 fetch('atualizacoes.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()}).then(data=>{
  if(!data||!Array.isArray(data.entries)||!data.entries.length||data.current!==FALLBACK)throw Error('Versão do histórico incompatível');
  setVersion(data.current);const target=document.getElementById('releaseHistory');if(!target)return;target.replaceChildren();
  for(const entry of data.entries){
   const article=add('article','release-entry'),head=add('div','release-entry-head'),h=add('h2',null,entry.title),meta=add('span','release-version','v'+entry.version+(entry.date?' · '+new Date(entry.date+'T12:00:00').toLocaleDateString('pt-BR'):''));
   head.append(meta,h);article.append(head);const ul=add('ul');for(const item of entry.changes||[])ul.append(add('li',null,item));article.append(ul);if(entry.scope)article.append(add('p','release-scope',entry.scope));target.append(article)
  }
 }).catch(err=>{const target=document.getElementById('releaseHistory');if(target){target.replaceChildren(add('p',null,'O histórico detalhado não pôde ser carregado. Consulte o arquivo de atualizações.'));const a=add('a',null,'Abrir histórico em JSON');a.href='atualizacoes.json';target.append(a)}console.warn('Histórico de versões indisponível:',err)});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();