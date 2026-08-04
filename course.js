(() => {
  'use strict';
  const C = window.BISHUN_CURRICULUM;
  if (!C) return;
  const KEY = 'bishunCourseV3';
  const DAY = 86400000;
  const intervals = [0, 1, 3, 7, 14, 30, 60];
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const escapeHTML = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const shuffle = list => [...list].sort(() => Math.random() - .5);
  const defaultState = () => ({records:{char:{},word:{},grammar:{},listening:{}}, selectedUnit:1, lastExam:null});
  let state;
  try { state = {...defaultState(), ...JSON.parse(localStorage.getItem(KEY) || '{}')}; } catch { state = defaultState(); }
  state.records ||= defaultState().records;
  ['char','word','grammar','listening'].forEach(k => state.records[k] ||= {});
  let vocabPage = 0;
  let listeningItem = null;
  let reviewQueue = [];
  let reviewIndex = 0;
  let examQuestions = [];

  function save(){ localStorage.setItem(KEY, JSON.stringify(state)); }
  function record(type,id){ return {level:0,due:0,attempts:0,correct:0,...(state.records[type]?.[id]||{})}; }
  function grade(type,id,quality){
    const r=record(type,id); r.attempts++;
    if(quality>=2){ r.correct++; r.level=Math.min(intervals.length-1,r.level+1); }
    else if(quality===1){ r.level=Math.max(1,r.level); }
    else { r.level=0; }
    r.due=Date.now()+intervals[r.level]*DAY; r.last=Date.now();
    state.records[type][id]=r; save(); renderAllStats();
  }
  function mastered(type,id){ return record(type,id).level>=4; }
  function due(type,id){ const r=record(type,id); return !r.due || r.due<=Date.now(); }
  function pct(done,total){ return total ? Math.round(done/total*100) : 0; }
  function speak(text,rate=.82){
    if(!('speechSynthesis' in window)) return;
    speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text); u.lang='zh-CN'; u.rate=rate;
    const voices=speechSynthesis.getVoices(); u.voice=voices.find(v=>/^zh(-|_)?CN/i.test(v.lang))||voices.find(v=>/^zh/i.test(v.lang))||null;
    speechSynthesis.speak(u);
  }
  function competenceData(){
    return [
      ['Escrita', C.characters.filter(x=>mastered('char',x.char)).length, C.characters.length],
      ['Vocabulário', C.vocabulary.filter(x=>mastered('word',x.id)).length, C.vocabulary.length],
      ['Gramática', C.grammar.filter(x=>mastered('grammar',x.no)).length, C.grammar.length],
      ['Escuta', C.sentences.filter(x=>mastered('listening',x.id)).length, C.sentences.length]
    ];
  }
  function renderAllStats(){
    const data=competenceData();
    $('#courseCompetencies').innerHTML=data.map(([name,d,t])=>`<article><span>${name}</span><strong>${d}/${t}</strong><div class="mini-progress"><i style="width:${pct(d,t)}%"></i></div><small>${pct(d,t)}% consolidado</small></article>`).join('');
    const weighted=Math.round(data.reduce((s,[,d,t])=>s+pct(d,t),0)/data.length);
    $('#overallCourseProgress').textContent=`${weighted}%`;
    $('#dueCount').textContent=String(buildReviewQueue().length);
    renderJourney();
  }
  function unitProgress(unit){
    const chars=C.characters.filter(x=>unit.characters.includes(x.id));
    const words=C.vocabulary.filter(x=>unit.words.includes(x.id));
    const grammar=C.grammar.filter(x=>unit.grammar.includes(x.no));
    const total=chars.length+words.length+grammar.length;
    const done=chars.filter(x=>mastered('char',x.char)).length+words.filter(x=>mastered('word',x.id)).length+grammar.filter(x=>mastered('grammar',x.no)).length;
    return pct(done,total);
  }
  function renderJourney(){
    const root=$('#unitMap'); if(!root) return;
    root.innerHTML=C.units.map(u=>{
      const p=unitProgress(u); const chars=C.characters.filter(c=>u.characters.includes(c.id)).map(c=>c.char).join('');
      return `<button class="unit-card ${state.selectedUnit===u.id?'active':''}" data-unit="${u.id}" type="button"><span class="unit-no">${String(u.id).padStart(2,'0')}</span><b>${chars}</b><small>${u.words.length} palavras · ${u.grammar.length} gramática</small><div class="mini-progress"><i style="width:${p}%"></i></div><em>${p}%</em></button>`;
    }).join('');
    renderUnit(state.selectedUnit||1);
  }
  function renderUnit(id){
    state.selectedUnit=Number(id); save();
    const u=C.units.find(x=>x.id===state.selectedUnit)||C.units[0];
    const chars=C.characters.filter(x=>u.characters.includes(x.id));
    const words=C.vocabulary.filter(x=>u.words.includes(x.id));
    const grammar=C.grammar.filter(x=>u.grammar.includes(x.no));
    const sentences=C.sentences.filter(x=>x.unit===u.id);
    $('#unitDetail').innerHTML=`
      <div class="unit-detail-head"><div><span class="eyebrow">Unidade ${String(u.id).padStart(2,'0')}</span><h3>${chars.map(x=>x.char).join(' · ')}</h3><p>${words.length} palavras, ${grammar.length} pontos gramaticais e ${sentences.length} exercícios de escuta.</p></div><strong>${unitProgress(u)}%</strong></div>
      <div class="unit-block"><h4>Caracteres</h4><div class="unit-char-grid">${chars.map(c=>`<button type="button" data-open-trainer="${c.char}" class="unit-char ${mastered('char',c.char)?'mastered':''}"><b>${c.char}</b><span>${c.pinyin}</span><small>${escapeHTML(c.meaning)}</small></button>`).join('')}</div></div>
      <div class="unit-block"><h4>Vocabulário liberado</h4><div class="compact-word-list">${words.map(w=>wordRow(w)).join('')}</div></div>
      ${grammar.length?`<div class="unit-block"><h4>Gramática</h4>${grammar.map(grammarCard).join('')}</div>`:''}
      ${sentences.length?`<div class="unit-block"><h4>Frases e escuta</h4><div class="sentence-list">${sentences.map(sentenceRow).join('')}</div></div>`:''}`;
    $$('.unit-card').forEach(b=>b.classList.toggle('active',Number(b.dataset.unit)===u.id));
  }
  function wordRow(w){ const r=record('word',w.id); return `<article class="word-row ${mastered('word',w.id)?'mastered':''}"><button class="sound-dot" type="button" data-speak-text="${w.hanzi}">🔊</button><div><b>${w.hanzi}</b><span>${w.pinyin}</span><small>${escapeHTML(w.meaning)} · ${escapeHTML(w.pos)}</small></div><div class="srs-level">N${r.level}</div><button class="tiny-action" type="button" data-grade-word="${w.id}" data-quality="2">✓</button></article>`; }
  function grammarCard(g){ const r=record('grammar',g.no); return `<details class="grammar-card ${mastered('grammar',g.no)?'mastered':''}"><summary><span><b>${g.no}. ${escapeHTML(g.title)}</b><small>${escapeHTML(g.pattern)}</small></span><em>N${r.level}</em></summary><p>${escapeHTML(g.explanation)}</p>${g.examples.map(e=>`<div class="grammar-example"><button type="button" data-speak-text="${e.zh}">🔊</button><div><b>${e.zh}</b><span>${e.pinyin}</span><small>${escapeHTML(e.pt)}</small></div></div>`).join('')}<div class="grade-strip"><button data-grade-grammar="${g.no}" data-quality="0">Rever</button><button data-grade-grammar="${g.no}" data-quality="2">Entendi</button></div></details>`; }
  function sentenceRow(s){ return `<article class="sentence-row"><button type="button" data-speak-text="${s.zh}">🔊</button><div><b>${s.zh}</b><span>${s.pinyin}</span><small>${escapeHTML(s.pt)}</small></div></article>`; }
  function openTrainer(char){ const select=$('#characterSelect'); if(select){ select.value=char; select.dispatchEvent(new Event('change',{bubbles:true})); } location.hash='treinador'; }

  function renderVocabulary(){
    const q=($('#vocabSearch')?.value||'').trim().toLowerCase(); const unit=$('#vocabUnit')?.value||'all'; const status=$('#vocabStatus')?.value||'all';
    let list=C.vocabulary.filter(w=>[w.hanzi,w.pinyin,w.meaning,w.pos].join(' ').toLowerCase().includes(q));
    if(unit!=='all') list=list.filter(w=>String(w.unit)===unit);
    if(status==='due') list=list.filter(w=>due('word',w.id));
    if(status==='mastered') list=list.filter(w=>mastered('word',w.id));
    const per=30, pages=Math.max(1,Math.ceil(list.length/per)); vocabPage=Math.min(vocabPage,pages-1); const shown=list.slice(vocabPage*per,(vocabPage+1)*per);
    $('#vocabCount').textContent=`${list.length} de ${C.vocabulary.length}`;
    $('#vocabGrid').innerHTML=shown.map(w=>`<article class="vocab-card ${mastered('word',w.id)?'mastered':''}"><div class="vocab-top"><b>${w.hanzi}</b><button type="button" data-speak-text="${w.hanzi}">🔊</button></div><span>${w.pinyin}</span><p>${escapeHTML(w.meaning)}</p><small>${escapeHTML(w.pos)} · unidade ${w.unit}</small><div class="grade-strip"><button data-grade-word="${w.id}" data-quality="0">Errei</button><button data-grade-word="${w.id}" data-quality="1">Difícil</button><button data-grade-word="${w.id}" data-quality="2">Acertei</button></div></article>`).join('')||'<p class="empty-state">Nenhum item encontrado.</p>';
    $('#vocabPager').innerHTML=`<button type="button" data-vocab-page="prev" ${vocabPage===0?'disabled':''}>←</button><span>Página ${vocabPage+1}/${pages}</span><button type="button" data-vocab-page="next" ${vocabPage>=pages-1?'disabled':''}>→</button>`;
  }
  function renderGrammar(){
    const q=($('#grammarSearch')?.value||'').trim().toLowerCase(); const unit=$('#grammarUnit')?.value||'all';
    let list=C.grammar.filter(g=>[g.title,g.explanation,g.pattern].join(' ').toLowerCase().includes(q)); if(unit!=='all') list=list.filter(g=>String(g.unit)===unit);
    $('#grammarCount').textContent=`${list.length} de ${C.grammar.length}`; $('#grammarGrid').innerHTML=list.map(grammarCard).join('');
  }
  function chooseListening(){
    const candidates=C.sentences.filter(x=>!mastered('listening',x.id)); listeningItem=candidates[Math.floor(Math.random()*candidates.length)]||C.sentences[Math.floor(Math.random()*C.sentences.length)]; renderListening();
  }
  function renderListening(){
    if(!listeningItem) return chooseListening();
    const distract=shuffle(C.sentences.filter(x=>x.id!==listeningItem.id)).slice(0,3).map(x=>x.pt); const options=shuffle([listeningItem.pt,...distract]);
    $('#listeningExercise').innerHTML=`<div class="listening-prompt"><span>Unidade ${listeningItem.unit}</span><button type="button" class="listen-main" data-speak-text="${listeningItem.zh}" data-rate=".78">🔊 Ouvir frase</button><button type="button" data-speak-text="${listeningItem.zh}" data-rate=".6">🐢 Lento</button></div><div class="listening-options">${options.map(o=>`<button type="button" data-listening-answer="${escapeHTML(o)}">${escapeHTML(o)}</button>`).join('')}</div><div id="listeningFeedback" class="listening-feedback" aria-live="polite"></div>`;
  }
  function answerListening(answer){
    const ok=answer===listeningItem.pt; grade('listening',listeningItem.id,ok?2:0); const f=$('#listeningFeedback');
    f.className=`listening-feedback ${ok?'ok':'bad'}`; f.innerHTML=`<strong>${ok?'Correto.':'Ainda não.'}</strong><b>${listeningItem.zh}</b><span>${listeningItem.pinyin}</span><p>${escapeHTML(listeningItem.pt)}</p><button type="button" data-new-listening>Próxima frase</button>`;
  }
  function buildReviewQueue(){
    const items=[]; C.characters.forEach(x=>{if(due('char',x.char))items.push({type:'char',id:x.char,item:x});}); C.vocabulary.forEach(x=>{if(due('word',x.id))items.push({type:'word',id:x.id,item:x});});
    return items.sort((a,b)=>(record(a.type,a.id).due||0)-(record(b.type,b.id).due||0));
  }
  function startReview(){ reviewQueue=buildReviewQueue(); if(!reviewQueue.length) reviewQueue=shuffle([...C.characters.slice(0,20).map(x=>({type:'char',id:x.char,item:x})),...C.vocabulary.slice(0,20).map(x=>({type:'word',id:x.id,item:x}))]).slice(0,12); reviewIndex=0; renderReviewCard(); }
  function renderReviewCard(){
    const root=$('#reviewCard'); if(!reviewQueue.length){root.innerHTML='<p>Nenhum item disponível.</p>';return;} const x=reviewQueue[reviewIndex%reviewQueue.length]; const i=x.item;
    root.innerHTML=`<article class="review-card"><span>${reviewIndex+1}/${reviewQueue.length} · ${x.type==='char'?'caractere':'palavra'}</span><button class="review-sound" data-speak-text="${x.type==='char'?i.char:i.hanzi}" type="button">🔊</button><b>${x.type==='char'?i.char:i.hanzi}</b><div id="reviewBack" hidden><strong>${i.pinyin}</strong><p>${escapeHTML(i.meaning)}</p>${x.type==='char'?`<button data-open-trainer="${i.char}" type="button">Treinar escrita</button>`:''}</div><button id="revealReview" type="button" class="button primary">Revelar</button><div id="reviewGrades" class="review-grades" hidden><button data-review-grade="0">Errei</button><button data-review-grade="1">Difícil</button><button data-review-grade="2">Acertei</button></div></article>`;
  }
  function gradeReview(q){ const x=reviewQueue[reviewIndex%reviewQueue.length]; grade(x.type,x.id,q); reviewIndex++; if(reviewIndex>=reviewQueue.length){ $('#reviewCard').innerHTML=`<div class="review-complete"><strong>Sessão concluída.</strong><p>${reviewQueue.length} itens revisados.</p><button type="button" data-start-review>Nova sessão</button></div>`;} else renderReviewCard(); }

  function makeOptions(correct,pool){ return shuffle([correct,...shuffle(pool.filter(x=>x!==correct)).slice(0,3)]); }
  function startExam(){
    examQuestions=[];
    shuffle(C.characters).slice(0,6).forEach(c=>examQuestions.push({type:'char',prompt:`Qual é o significado de ${c.char}?`,audio:c.char,correct:c.meaning,options:makeOptions(c.meaning,C.characters.map(x=>x.meaning))}));
    shuffle(C.vocabulary).slice(0,6).forEach(w=>examQuestions.push({type:'word',prompt:`O que significa ${w.hanzi} (${w.pinyin})?`,audio:w.hanzi,correct:w.meaning,options:makeOptions(w.meaning,C.vocabulary.map(x=>x.meaning))}));
    shuffle(C.characters).slice(0,4).forEach(c=>examQuestions.push({type:'pinyin',prompt:`Qual é o pinyin de ${c.char}?`,audio:c.char,correct:c.pinyin,options:makeOptions(c.pinyin,C.characters.map(x=>x.pinyin))}));
    shuffle(C.grammar).slice(0,4).forEach(g=>examQuestions.push({type:'grammar',prompt:g.title,correct:g.pattern,options:makeOptions(g.pattern,C.grammar.map(x=>x.pattern))}));
    shuffle(C.sentences).slice(0,4).forEach(s=>examQuestions.push({type:'listening',prompt:'Ouça e escolha a tradução.',audio:s.zh,correct:s.pt,options:makeOptions(s.pt,C.sentences.map(x=>x.pt))}));
    examQuestions=shuffle(examQuestions); renderExam();
  }
  function renderExam(){ $('#examContainer').innerHTML=examQuestions.map((q,i)=>`<fieldset class="exam-question"><legend>${i+1}. ${escapeHTML(q.prompt)} ${q.audio?`<button type="button" data-speak-text="${q.audio}">🔊</button>`:''}</legend>${q.options.map(o=>`<label><input type="radio" name="exam-${i}" value="${escapeHTML(o)}"> <span>${escapeHTML(o)}</span></label>`).join('')}</fieldset>`).join(''); $('#examResult').innerHTML=''; }
  function submitExam(){
    let correct=0; const by={char:[0,0],word:[0,0],pinyin:[0,0],grammar:[0,0],listening:[0,0]};
    examQuestions.forEach((q,i)=>{const v=$(`input[name="exam-${i}"]:checked`)?.value; const ok=v===q.correct; by[q.type][1]++; if(ok){correct++;by[q.type][0]++;}});
    const score=Math.round(correct/examQuestions.length*100); state.lastExam={score,date:Date.now(),by}; save();
    $('#examResult').innerHTML=`<strong>${score}%</strong><p>${correct} de ${examQuestions.length} respostas corretas.</p><div class="exam-breakdown">${Object.entries(by).map(([k,[a,t]])=>`<span>${k}: ${a}/${t}</span>`).join('')}</div>`;
  }
  function populateFilters(){
    const options='<option value="all">Todas</option>'+C.units.map(u=>`<option value="${u.id}">Unidade ${String(u.id).padStart(2,'0')}</option>`).join('');
    $('#vocabUnit').innerHTML=options; $('#grammarUnit').innerHTML=options;
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest('button'); if(!b)return;
    if(b.dataset.unit){state.selectedUnit=Number(b.dataset.unit);save();renderJourney();$('#unitDetail').scrollIntoView({behavior:'smooth',block:'start'});}
    if(b.dataset.openTrainer)openTrainer(b.dataset.openTrainer);
    if(b.dataset.speakText)speak(b.dataset.speakText,Number(b.dataset.rate||.82));
    if(b.dataset.gradeWord){grade('word',b.dataset.gradeWord,Number(b.dataset.quality));renderVocabulary();renderUnit(state.selectedUnit);}
    if(b.dataset.gradeGrammar){grade('grammar',b.dataset.gradeGrammar,Number(b.dataset.quality));renderGrammar();renderUnit(state.selectedUnit);}
    if(b.dataset.vocabPage){vocabPage+=b.dataset.vocabPage==='next'?1:-1;renderVocabulary();}
    if(b.dataset.listeningAnswer!==undefined)answerListening(b.dataset.listeningAnswer);
    if(b.hasAttribute('data-new-listening'))chooseListening();
    if(b.hasAttribute('data-start-review'))startReview();
    if(b.id==='revealReview'){ $('#reviewBack').hidden=false; $('#reviewGrades').hidden=false; b.hidden=true; }
    if(b.dataset.reviewGrade!==undefined)gradeReview(Number(b.dataset.reviewGrade));
    if(b.id==='startExam')startExam(); if(b.id==='submitExamV3')submitExam();
  });
  ['vocabSearch','vocabUnit','vocabStatus'].forEach(id=>$('#'+id)?.addEventListener(id==='vocabSearch'?'input':'change',()=>{vocabPage=0;renderVocabulary();}));
  ['grammarSearch','grammarUnit'].forEach(id=>$('#'+id)?.addEventListener(id==='grammarSearch'?'input':'change',renderGrammar));
  function init(){ populateFilters(); renderAllStats(); renderVocabulary(); renderGrammar(); chooseListening(); startReview(); startExam(); }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
