(() => {
  'use strict';
  const VERSION='6.8.0';
  const $=(s,r=document)=>r.querySelector(s);
  let returnFocus=null;
  let identityObserver=null;

  function promoteIdentity(){
    const badge=$('.ux65-badge');
    if(badge){
      badge.innerHTML='<strong>6.8</strong><small>visual</small>';
      badge.setAttribute('aria-label','UX 6.8 · 48 ilustrações restauradas');
    }
    document.querySelectorAll('.version-badge span[data-version],.release-pill span[data-version],.footer-version span[data-version]').forEach(el=>{el.textContent=VERSION;});
    return Boolean(badge);
  }

  function ensureIdentity(){
    if(promoteIdentity()) return;
    const root=$('.ux64-brand-cluster')||$('.topbar');
    if(!root||identityObserver) return;
    identityObserver=new MutationObserver(()=>{if(promoteIdentity()){identityObserver.disconnect();identityObserver=null;}});
    identityObserver.observe(root,{childList:true,subtree:true});
    requestAnimationFrame(promoteIdentity);
    setTimeout(()=>{identityObserver?.disconnect();identityObserver=null;},2500);
  }

  function ensureTrainerBridge(){
    const shell=$('#treinador .section-shell');
    const heading=shell?.querySelector('.section-heading');
    if(!shell||!heading) return null;
    let bridge=$('#ux68VisualBridge');
    if(!bridge){
      bridge=document.createElement('aside');
      bridge.id='ux68VisualBridge';
      bridge.className='ux68-visual-bridge';
      bridge.innerHTML=`<div><span>MEMÓRIA VISUAL · 48 ILUSTRAÇÕES</span><strong>Veja a ideia antes de repetir o traço.</strong><p>Os cartões vetoriais da versão 6.2.1 foram restaurados: 12 relações essenciais primeiro, busca e expansão até 48.</p></div><button type="button" class="button primary" data-ux68-open-visual>Ver as 48 ilustrações</button>`;
      heading.insertAdjacentElement('afterend',bridge);
    }
    return bridge;
  }

  function ensureModeHint(){
    const copy=$('#ux67ModeBar .ux67-mode-copy');
    if(!copy||$('#ux68ModeHint')) return;
    const hint=document.createElement('p');
    hint.id='ux68ModeHint';
    hint.className='ux68-mode-hint';
    hint.innerHTML='<strong>Passo 6 · Treinador:</strong> inclui 48 ilustrações vetoriais para comparar forma e ideia.';
    copy.appendChild(hint);
  }

  function ensureDialog(){
    let dialog=$('#ux68VisualDialog');
    if(dialog) return dialog;
    dialog=document.createElement('dialog');
    dialog.id='ux68VisualDialog';
    dialog.className='ux68-visual-dialog';
    dialog.setAttribute('aria-labelledby','ux68VisualDialogTitle');
    dialog.innerHTML=`<div class="ux68-dialog-frame"><header class="ux68-dialog-head"><div><span>RESTAURAÇÃO VISUAL · FONTE 6.2.1</span><h2 id="ux68VisualDialogTitle">48 ilustrações dos caracteres</h2><p>Compare caractere e imagem sem sair do passo atual.</p></div><button type="button" class="ux68-dialog-close" data-ux68-close aria-label="Fechar ilustrações">×</button></header><div class="ux68-dialog-mount"></div></div>`;
    document.body.appendChild(dialog);
    dialog.addEventListener('close',()=>restoreSection());
    dialog.addEventListener('cancel',()=>{setTimeout(()=>restoreSection(),0);});
    return dialog;
  }

  function ensureAnchor(){
    const section=$('#mnemonicos-visuais');
    if(!section) return null;
    let anchor=$('#ux68VisualAnchor');
    if(!anchor){anchor=document.createElement('span');anchor.id='ux68VisualAnchor';anchor.hidden=true;section.insertAdjacentElement('beforebegin',anchor);}
    return anchor;
  }

  function restoreSection(){
    const section=$('#mnemonicos-visuais');
    const anchor=ensureAnchor();
    if(section&&anchor&&section.parentElement?.closest('#ux68VisualDialog')) anchor.insertAdjacentElement('afterend',section);
    section?.classList.remove('ux68-dialog-mounted');
    document.body.classList.remove('ux68-visual-open');
    const focus=returnFocus; returnFocus=null;
    if(focus&&document.contains(focus)) requestAnimationFrame(()=>focus.focus({preventScroll:true}));
  }

  function openVisuals(trigger){
    const section=$('#mnemonicos-visuais');
    const dialog=ensureDialog();
    const mount=dialog?.querySelector('.ux68-dialog-mount');
    if(!section||!dialog||!mount) return;
    ensureAnchor();
    returnFocus=trigger||document.activeElement;
    mount.appendChild(section);
    section.classList.add('ux68-dialog-mounted');
    document.body.classList.add('ux68-visual-open');
    if(typeof dialog.showModal==='function') dialog.showModal(); else dialog.setAttribute('open','');
    requestAnimationFrame(()=>dialog.querySelector('#visualMnemonicSearch')?.focus({preventScroll:true}));
  }

  function closeVisuals({restore=true}={}){
    const dialog=$('#ux68VisualDialog');
    if(!dialog) return;
    if(restore===false) returnFocus=null;
    if(dialog.open&&typeof dialog.close==='function') dialog.close();
    else {dialog.removeAttribute('open');restoreSection();}
  }

  function syncMode(){
    const mode=document.documentElement.dataset.ux67Mode||'guided';
    if(mode==='explore'&&$('#ux68VisualDialog')?.open) closeVisuals();
    ensureModeHint();
  }

  function wire(){
    document.addEventListener('click',event=>{
      const open=event.target.closest('[data-ux68-open-visual]');
      if(open){event.preventDefault();openVisuals(open);return;}
      if(event.target.closest('[data-ux68-close]')){event.preventDefault();closeVisuals();return;}
      if(event.target.closest('[data-open-visual-char]')){
        setTimeout(()=>{
          const select=$('#characterSelect');
          closeVisuals({restore:false});
          if(select) requestAnimationFrame(()=>select.focus({preventScroll:true}));
        },0);
      }
      if(event.target.closest('[data-ux67-mode]')) queueMicrotask(syncMode);
    });
    window.addEventListener('pageshow',()=>{ensureTrainerBridge();ensureModeHint();ensureIdentity();syncMode();});
    window.addEventListener('storage',event=>{if(event.key==='bishunFocusV67') queueMicrotask(syncMode);});
  }

  function boot(){
    if(document.documentElement.dataset.ux68Runtime===VERSION) return;
    document.documentElement.dataset.ux68Runtime=VERSION;
    document.documentElement.classList.add('ux68-ready');
    ensureIdentity();
    ensureTrainerBridge();
    ensureModeHint();
    ensureDialog();
    ensureAnchor();
    wire();
    syncMode();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
