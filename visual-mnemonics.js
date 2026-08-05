(() => {
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)]; let data=null;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function card(x){return `<article class="visual-char-card" data-visual-char="${x.char}"><div class="visual-char-image">${x.svg}</div><div class="visual-char-copy"><div class="visual-char-head"><strong lang="zh-Hans">${x.char}</strong><span>${esc(x.type)}</span></div><h3>${esc(x.titlePt)}</h3><p>${esc(x.hintPt)}</p><button type="button" class="button ghost" data-open-visual-char="${x.char}">Treinar ${x.char}</button></div></article>`}
function render(){if(!data)return; const q=($('#visualMnemonicSearch')?.value||'').trim().toLowerCase(); const type=$('#visualMnemonicType')?.value||'all'; const list=data.items.filter(x=>(type==='all'||x.type===type)&&(!q||`${x.char} ${x.titlePt} ${x.hintPt}`.toLowerCase().includes(q))); $('#visualMnemonicGrid').innerHTML=list.map(card).join('')||'<p class="full-notice">Nenhum caractere encontrado.</p>'; $('#visualMnemonicCount').textContent=`${list.length} / ${data.items.length}`;}
function openTrainer(ch){const select=$('#characterSelect'); if(select){select.value=ch;select.dispatchEvent(new Event('change',{bubbles:true}))} location.hash='treinador';}
document.addEventListener('input',e=>{if(e.target.matches('#visualMnemonicSearch'))render()});document.addEventListener('change',e=>{if(e.target.matches('#visualMnemonicType'))render()});document.addEventListener('click',e=>{const b=e.target.closest('[data-open-visual-char]');if(b)openTrainer(b.dataset.openVisualChar)});
fetch('data/visual-mnemonics.json').then(r=>r.json()).then(d=>{data=d;render();}).catch(()=>{$('#visualMnemonicGrid').innerHTML='<p class="full-notice">Falha ao carregar as ilustrações.</p>'});
})();
