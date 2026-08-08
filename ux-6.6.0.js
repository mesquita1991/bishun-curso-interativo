(() => {
  'use strict';

  const VERSION = '6.6.0';
  const STORAGE_KEY = 'bishunGuidedV66';
  const UX63_KEY = 'bishunUxV63';
  const PATH = [
    ['fundamentos','Fundamentos'],['tracos-fundamentais','Traços fundamentais'],['regras','Ordem dos traços'],['estruturas','Estruturas'],['pronuncia','Pronúncia'],['treinador','Treinador'],['jornada','Jornada Base 300'],['vocabulario','Vocabulário Base 300'],['gramatica-300','Gramática Base 300'],['escuta','Escuta Base 300'],['revisao','Revisão Base 300'],['prova-300','Prova Base 300'],['proporcao','Proporção'],['variantes','Variantes'],['erros-comuns','Erros comuns'],['metodo-estudo','Método de estudo'],['pratica','Prática'],
    ['programa-integral','Programa integral'],['mapa-etapas','Mapa das etapas'],['unidades-integrais','Unidades integrais'],['atlas-integral','Atlas integral'],['laboratorio-integral','Laboratório integral'],['vocabulario-integral','Vocabulário integral'],['silabas-integral','Sílabas integrais'],['gramatica-integral','Gramática integral'],['competencias-integral','Competências integrais'],['revisao-integral','Revisão integral'],['prova-integral','Prova integral'],
    ['pos-padrao','Pós-padrão'],['imersao-aberta','Imersão aberta'],['lexico-pos','Léxico em contexto'],['expressoes-pos','Expressões'],['pragmatica-pos','Pragmática'],['leituras-pos','Leituras'],['missoes-pos','Missões'],
    ['validacao-v6','Validação longitudinal'],['benchmark-v6','Benchmark'],['matriz-v6','Matriz de domínio'],['plano-v6','Plano adaptativo'],['dominio-real','Domínio real']
  ];
  const PHASES = [
    { id:'base', label:'1 · Base', from:0, to:16, note:'Aprenda a lógica da escrita, som, vocabulário e prática fundamental.' },
    { id:'integral', label:'2 · Integral', from:17, to:27, note:'Amplie para o programa integral e consolide competências.' },
    { id:'imersao', label:'3 · Imersão', from:28, to:34, note:'Passe do currículo para textos e uso real.' },
    { id:'dominio', label:'4 · Domínio', from:35, to:39, note:'Meça, corrija lacunas e prove domínio longitudinal.' }
  ];
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  let tick=0;

  function defaults(){ return { active:false, paused:true, current:0, completed:[], elapsedMs:0, startedAt:null, opened:false }; }
  function load(){
    try {
      const raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
      const state={...defaults(),...raw};
      state.completed=Array.isArray(raw.completed)?raw.completed.filter(id=>PATH.some(([x])=>x===id)):[];
      state.current=Math.max(0,Math.min(PATH.length-1,Number(raw.current)||0));
      if(state.active && !state.paused && !state.startedAt) state.startedAt=Date.now();
      return state;
    } catch { return defaults(); }
  }
  const state=load();
  function save(){ localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); }
  function ux63Last(){ try { return JSON.parse(localStorage.getItem(UX63_KEY)||'{}').lastSection||null; } catch { return null; } }
  function indexFor(id){ return PATH.findIndex(([x])=>x===id); }
  function titleAt(i){ return PATH[i]?.[1]||''; }
  function phaseAt(i){ return PHASES.find(p=>i>=p.from&&i<=p.to)||PHASES[0]; }
  function elapsed(){ return state.elapsedMs + ((!state.paused&&state.startedAt)?Date.now()-state.startedAt:0); }
  function clock(ms){ const total=Math.floor(ms/1000),m=Math.floor(total/60),s=total%60; return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; }
  function escapeHtml(v){ return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  function routeTo(i, {focus=true}={}){
    i=Math.max(0,Math.min(PATH.length-1,i));
    state.current=i; state.active=true;
    if(state.paused){ state.paused=false; state.startedAt=Date.now(); }
    save(); render();
    const a=$(`#ux66Guide a[data-guide-index="${i}"]`);
    if(a){ a.click(); }
    else {
      const target=document.getElementById(PATH[i][0]);
      target?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
      if(focus) setTimeout(()=>target?.focus({preventScroll:true}),400);
    }
  }
  function startFresh(){ state.completed=[]; state.current=0; state.elapsedMs=0; state.startedAt=Date.now(); state.active=true; state.paused=false; state.opened=true; save(); render(); routeTo(0); }
  function resume(){
    const last=ux63Last(), idx=indexFor(last);
    if(!state.active && idx>=0 && state.completed.length===0) state.current=idx;
    state.active=true;
    if(state.paused || !state.startedAt) state.startedAt=Date.now();
    state.paused=false; state.opened=true; save(); render(); routeTo(state.current);
  }
  function pause(){ if(!state.paused&&state.startedAt) state.elapsedMs+=Date.now()-state.startedAt; state.startedAt=null; state.paused=true; save(); render(); }
  function completeAndNext(){
    const id=PATH[state.current][0];
    if(!state.completed.includes(id)) state.completed.push(id);
    if(state.current<PATH.length-1) routeTo(state.current+1);
    else { pause(); state.active=false; save(); render(); }
  }
  function goBack(){ if(state.current>0) routeTo(state.current-1); }
  function toggleGuide(){ state.opened=!state.opened; save(); render(); }

  function syncInitialLocation(){
    if(!state.active || !location.hash) return;
    const raw=location.hash.slice(1);
    let id=raw;
    try { id=decodeURIComponent(raw); } catch { /* malformed fragments are non-matches */ }
    const i=indexFor(id);
    if(i>=0) state.current=i;
  }

  function build(){
    if($('#ux66Guide')) return;
    document.documentElement.dataset.ux66Runtime=VERSION;
    document.documentElement.classList.add('ux66-ready');
    const shell=document.createElement('section');
    shell.id='ux66Guide'; shell.className='ux66-guide'; shell.setAttribute('aria-label','Trilha guiada de estudo');
    const hero=$('#inicio');
    (hero||document.querySelector('main'))?.insertAdjacentElement(hero?'afterend':'afterbegin',shell);
    const dock=document.createElement('div'); dock.id='ux66Dock'; dock.className='ux66-dock'; document.body.appendChild(dock);
    const syncExplicitTarget=id=>{
      if(!state.active) return;
      const i=indexFor(id);
      if(i>=0 && i!==state.current){ state.current=i; save(); render(); }
    };
    document.addEventListener('click',e=>{
      const plainPrimary=e.button===0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
      const guidedStep=e.target.closest('a[data-guide-index]');
      if(guidedStep && plainPrimary){
        const i=Number(guidedStep.dataset.guideIndex);
        if(Number.isInteger(i) && i>=0 && i<PATH.length){ state.current=i; state.active=true; save(); render(); }
        return;
      }
      const phaseButton=e.target.closest('[data-guide-phase]');
      if(phaseButton){ const phase=PHASES.find(p=>p.id===phaseButton.dataset.guidePhase); if(phase) routeTo(phase.from); return; }
      const action=e.target.closest('[data-guide-action]')?.dataset.guideAction;
      if(action){
        if(action==='start') startFresh(); if(action==='resume') resume(); if(action==='pause') pause(); if(action==='next') completeAndNext(); if(action==='prev') goBack(); if(action==='toggle') toggleGuide(); if(action==='explore') document.getElementById('uxMapButton')?.click(); if(action==='search') document.getElementById('uxCommandButton')?.click();
        return;
      }
      // Mirror only deliberate navigation signals already handled by UX 6.3.
      const route=e.target.closest('[data-ux-route]')?.dataset.uxRoute;
      const jump=e.target.closest('[data-ux-jump]')?.dataset.uxJump;
      const hashLink=e.target.closest('a[href^="#"]');
      const hashTarget=plainPrimary && hashLink && (!hashLink.target || hashLink.target==='_self') && !hashLink.hasAttribute('download') ? hashLink.getAttribute('href')?.slice(1) : null;
      if(route || jump || hashTarget){ syncExplicitTarget(route || jump || hashTarget); return; }
      if(e.target.closest('[data-ux-command-index]')) queueMicrotask(()=>syncExplicitTarget(ux63Last()));
    });
    window.addEventListener('pagehide',()=>{ if(!state.paused&&state.startedAt){ state.elapsedMs+=Date.now()-state.startedAt; state.startedAt=null; state.paused=true; save(); } });
    window.addEventListener('pageshow',()=>render());
    window.addEventListener('hashchange',()=>{
      const raw=location.hash.slice(1); let id=raw; try{id=decodeURIComponent(raw)}catch{}
      const i=indexFor(id); if(i>=0 && state.active){ state.current=i; save(); render(); }
    });
    tick=window.setInterval(()=>{ const el=$('[data-guide-clock]'); if(el) el.textContent=clock(elapsed()); },1000);
    syncInitialLocation();
    save();
    render();
  }

  function progressPct(){ return Math.round(state.completed.length/PATH.length*100); }
  function phaseMarkup(){
    return PHASES.map(p=>{
      const done=PATH.slice(p.from,p.to+1).filter(([id])=>state.completed.includes(id)).length;
      const total=p.to-p.from+1;
      const current=state.current>=p.from&&state.current<=p.to;
      return `<button type="button" class="ux66-phase${current?' is-current':''}" data-guide-phase="${p.id}" aria-label="${escapeHtml(p.label)}: ${done} de ${total} concluídos"><span>${escapeHtml(p.label)}</span><small>${done}/${total}</small></button>`;
    }).join('');
  }
  function stepsMarkup(){
    return PHASES.map(p=>`<div class="ux66-phase-block"><div class="ux66-phase-heading"><strong>${escapeHtml(p.label)}</strong><span>${escapeHtml(p.note)}</span></div><ol start="${p.from+1}">${PATH.slice(p.from,p.to+1).map(([id,title],j)=>{const i=p.from+j,done=state.completed.includes(id),cur=i===state.current;return `<li class="${done?'is-done ':''}${cur?'is-current':''}"><a href="#${id}" data-guide-index="${i}" aria-current="${cur?'step':'false'}"><span class="ux66-step-mark" aria-hidden="true">${done?'✓':i+1}</span><span><b>${escapeHtml(title)}</b><small>${done?'Concluído':cur?'Agora':'Depois'}</small></span></a></li>`}).join('')}</ol></div>`).join('');
  }
  function render(){
    const shell=$('#ux66Guide'), dock=$('#ux66Dock'); if(!shell||!dock) return;
    const legacyIndex=indexFor(ux63Last());
    const phase=phaseAt(state.current),pct=progressPct(),hasProgress=state.completed.length>0||state.current>0||legacyIndex>=0;
    shell.classList.toggle('is-open',state.opened);
    shell.innerHTML=`
      <div class="ux66-home">
        <div class="ux66-home-copy"><span class="ux66-kicker">TRILHA GUIADA · 40 PASSOS</span><h2>Não escolha para onde ir. Siga o próximo passo.</h2><p>Uma sequência única organiza o curso do fundamento ao domínio. Você pode pausar a qualquer momento e continuar exatamente de onde parou.</p></div>
        <div class="ux66-start-card">
          <div class="ux66-status-line"><span>${state.active&&!state.paused?'Sessão em andamento':hasProgress?'Sua trilha está salva':'Primeiro acesso'}</span><strong data-guide-clock>${clock(elapsed())}</strong></div>
          <div class="ux66-current"><small>${escapeHtml(phase.label)} · passo ${state.current+1} de ${PATH.length}</small><strong>${escapeHtml(titleAt(state.current))}</strong><span>${pct}% concluído</span></div>
          <div class="ux66-start-actions">${!hasProgress?'<button class="ux66-primary" data-guide-action="start">Começar do início</button>':`<button class="ux66-primary" data-guide-action="resume">${state.paused?'Continuar daqui':'Ir para o passo atual'}</button>`}<button class="ux66-secondary" data-guide-action="toggle">${state.opened?'Fechar trilha':'Ver trilha completa'}</button></div>
        </div>
      </div>
      <div class="ux66-progress" role="progressbar" aria-label="Progresso da trilha principal" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><span style="width:${pct}%"></span></div>
      <nav class="ux66-support" aria-label="Apoio fora da trilha"><span>Apoio:</span><a href="#progresso">Progresso</a><a href="#painel">Painel</a><a href="#cobertura">Cobertura</a><a href="#fontes">Fontes</a><a href="#novidades">Versões</a><button type="button" data-guide-action="search">Buscar</button><button type="button" data-guide-action="explore">Explorar mapa</button></nav>
      <div class="ux66-phases">${phaseMarkup()}</div>
      <div class="ux66-details" ${state.opened?'':'hidden'}><div class="ux66-details-head"><div><span>Rota completa</span><h3>Do início ao fim, sem saltos</h3></div><p>Os painéis, fontes, histórico e busca continuam disponíveis como apoio, mas não interrompem esta sequência.</p></div>${stepsMarkup()}</div>`;
    dock.hidden=!state.active;
    if(state.active){
      dock.innerHTML=`<div class="ux66-dock-inner"><button type="button" data-guide-action="prev" ${state.current===0?'disabled':''} aria-label="Passo anterior">←</button><div class="ux66-dock-current"><small>${escapeHtml(phase.label)} · ${state.current+1}/${PATH.length}</small><strong>${escapeHtml(titleAt(state.current))}</strong></div><button type="button" class="ux66-pause" data-guide-action="${state.paused?'resume':'pause'}">${state.paused?'▶ Continuar':'■ Parar e salvar'}</button><button type="button" class="ux66-next" data-guide-action="next">${state.current===PATH.length-1?'Concluir trilha':'Concluir e continuar →'}</button></div>`;
    }
    document.documentElement.classList.toggle('ux66-guided-active',state.active);
    document.documentElement.classList.toggle('ux66-guided-paused',state.paused);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',build,{once:true}); else build();
})();
