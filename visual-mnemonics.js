(() => {
'use strict';
const VERSION='6.2.1';
const FEATURED=['山','川','水','火','木','林','森','日','月','雨','目','休'];
const $=(s,r=document)=>r.querySelector(s);
let data=null,expanded=false;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const label=t=>t==='pictograma'?'Pictograma':'Mnemônico';
function card(x){
  const description=`${x.char}: ${x.titlePt}. ${x.hintPt}`;
  return `<article class="visual-char-card" data-visual-char="${esc(x.char)}">
    <div class="visual-compare" role="img" aria-label="${esc(description)}">
      <span class="visual-glyph" lang="zh-Hans" aria-hidden="true">${esc(x.char)}</span>
      <span class="visual-connector" aria-hidden="true">≈</span>
      <span class="visual-drawing" aria-hidden="true">${x.svg}</span>
    </div>
    <div class="visual-char-copy">
      <span class="visual-type ${x.type==='pictograma'?'is-pictogram':'is-mnemonic'}">${label(x.type)}</span>
      <h3>${esc(x.titlePt)}</h3>
      <p>${esc(x.hintPt)}</p>
      <button type="button" class="button ghost" data-open-visual-char="${esc(x.char)}">Abrir treino de ${esc(x.char)}</button>
    </div>
  </article>`;
}
function ordered(items){return [...items].sort((a,b)=>{const ai=FEATURED.indexOf(a.char),bi=FEATURED.indexOf(b.char);if(ai>=0||bi>=0)return (ai<0?999:ai)-(bi<0?999:bi);return a.char.localeCompare(b.char,'zh-Hans');});}
function render(){
  const grid=$('#visualMnemonicGrid'); if(!data||!grid)return;
  const q=($('#visualMnemonicSearch')?.value||'').trim().toLowerCase();
  const type=$('#visualMnemonicType')?.value||'all';
  const matches=ordered(data.items.filter(x=>(type==='all'||x.type===type)&&(!q||`${x.char} ${x.titlePt} ${x.hintPt}`.toLowerCase().includes(q))));
  const searching=Boolean(q)||type!=='all';
  const limit=expanded||searching?matches.length:12;
  const visible=matches.slice(0,limit);
  grid.innerHTML=visible.map(card).join('')||'<p class="full-notice">Nenhum caractere encontrado.</p>';
  const count=$('#visualMnemonicCount'); if(count)count.textContent=`${visible.length} exibidos · ${matches.length} encontrados`;
  const more=$('#visualMnemonicMore'); if(more){more.hidden=searching||matches.length<=12;more.textContent=expanded?'Mostrar apenas os 12 essenciais':'Mostrar todos os 48';more.setAttribute('aria-expanded',String(expanded));}
}
function reset(){const q=$('#visualMnemonicSearch'),t=$('#visualMnemonicType');if(q)q.value='';if(t)t.value='all';expanded=false;render();}
function openTrainer(ch){const select=$('#characterSelect');if(select&&[...select.options].some(o=>o.value===ch)){select.value=ch;select.dispatchEvent(new Event('change',{bubbles:true}));location.hash='treinador';select.focus();}else{location.hash='atlas-integral';}}
document.addEventListener('input',e=>{if(e.target.matches('#visualMnemonicSearch'))render();});
document.addEventListener('change',e=>{if(e.target.matches('#visualMnemonicType'))render();});
document.addEventListener('click',e=>{const open=e.target.closest('[data-open-visual-char]');if(open){openTrainer(open.dataset.openVisualChar);return;}if(e.target.id==='visualMnemonicMore'){expanded=!expanded;render();}if(e.target.id==='visualMnemonicReset')reset();});
fetch('data/visual-mnemonics.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json();}).then(d=>{if(!Array.isArray(d.items))throw new Error('Formato inválido');data=d;render();}).catch(()=>{const grid=$('#visualMnemonicGrid');if(grid)grid.innerHTML='<p class="full-notice">Não foi possível carregar as ilustrações. Recarregue a página.</p>';});
})();
