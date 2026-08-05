(() => {
  'use strict';
  const VERSION = '5.0.1';
  const KEY = 'bishunFullV4';
  const DAY = 86400000;
  const INTERVALS = [0,1,3,7,14,30,60,120];
  const $ = (s,r=document) => r.querySelector(s);
  const $$ = (s,r=document) => [...r.querySelectorAll(s)];
  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const shuffle = a => { const b=[...a]; for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];} return b; };
  const defaultState = () => ({stage:1,unit:1,records:{char:{},word:{},grammar:{},syllable:{},listening:{},reading:{},speaking:{},translation:{}},lastExam:null,downloaded:[],created:Date.now()});
  let state;
  try { state={...defaultState(),...JSON.parse(localStorage.getItem(KEY)||'{}')}; } catch { state=defaultState(); }
  state.records ||= defaultState().records;
  Object.keys(defaultState().records).forEach(k=>state.records[k] ||= {});
  const cache = new Map();
  let meta=null, current=null, atlasPage=0, vocabPage=0, syllablePage=0, grammarPage=0;
  let trainerWriter=null, trainerChar=null, lab=null, reviewQueue=[], reviewIndex=0, exam=[];
  const globalResults={atlas:null,vocab:null,syllable:null,grammar:null};
  const searchTimers={};

  function save(){ localStorage.setItem(KEY,JSON.stringify(state)); }
  function rec(type,id){ return {level:0,due:0,attempts:0,correct:0,last:0,...(state.records[type]?.[id]||{})}; }
  function grade(type,id,q){ const r=rec(type,id);r.attempts++;if(q>=2){r.correct++;r.level=Math.min(INTERVALS.length-1,r.level+1);}else if(q===1){r.level=Math.max(1,r.level);}else r.level=0;r.last=Date.now();r.due=Date.now()+INTERVALS[r.level]*DAY;state.records[type][id]=r;save();renderFullDashboard(); }
  function mastered(type,id){ return rec(type,id).level>=4; }
  function due(type,id){ const r=rec(type,id);return !r.due||r.due<=Date.now(); }
  function pct(a,b){ return b?Math.round(a/b*100):0; }
  function tone(p=''){ const marks=[['āēīōūǖ','1'],['áéíóúǘ','2'],['ǎěǐǒǔǚ','3'],['àèìòùǜ','4']];for(const [m,t] of marks)if([...m].some(c=>p.includes(c)))return t;return '0'; }
  function speak(text,rate=.82){ if(!('speechSynthesis' in window))return; speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='zh-CN';u.rate=rate;const vs=speechSynthesis.getVoices();u.voice=vs.find(v=>v.lang.toLowerCase()==='zh-cn')||vs.find(v=>v.lang.toLowerCase().startsWith('zh'))||null;speechSynthesis.speak(u); }
  function notice(msg,kind=''){ const el=$('#fullNotice');if(!el)return;el.textContent=msg;el.className='full-notice '+kind; }
  async function fetchJSON(path){ const r=await fetch(path);if(!r.ok)throw new Error(`${r.status} ${path}`);return r.json(); }
  async function loadMeta(){ meta=await fetchJSON('./data/meta.json'); renderMeta(); renderStageMap(); }
  async function loadStage(n,quiet=false){
    n=Math.max(1,Math.min(9,Number(n)||1));
    if(!quiet)notice(`Carregando etapa ${n}…`);
    try {
      if(!cache.has(n))cache.set(n,await fetchJSON(`./data/stage-${n}.json`));
      current=cache.get(n);state.stage=n;state.unit=Math.min(state.unit||1,current.units.length);save();
      atlasPage=vocabPage=syllablePage=grammarPage=0;
      renderStage();renderFullDashboard();populateSelectors();chooseLab('reading');startReview();startExam();
      if(!quiet)notice(`Etapa ${n} carregada: ${current.characters.length} caracteres e ${current.vocabulary.length} palavras.`,'ok');
    } catch(e){ console.error(e);notice('Não foi possível carregar esta etapa. Verifique a conexão ou tente novamente.','error'); }
  }
  async function ensureAllStages(){
    await Promise.all([...Array(9)].map(async(_,i)=>{const n=i+1;if(!cache.has(n))cache.set(n,await fetchJSON(`./data/stage-${n}.json`));}));
    return [...cache.values()];
  }
  async function enableGlobalCatalog(kind){
    const inputId={atlas:'atlasSearch',vocab:'fullVocabSearch',syllable:'syllableSearch',grammar:'fullGrammarSearch'}[kind];
    const q=($('#'+inputId)?.value||'').trim();
    if(!q){globalResults[kind]=null;({atlas:renderAtlas,vocab:renderVocabulary,syllable:renderSyllables,grammar:renderGrammar}[kind])();return;}
    notice(`Busca global em nove etapas: “${q}”…`);
    try{
      const all=await ensureAllStages();
      globalResults[kind]=all.flatMap(d=>({atlas:d.characters,vocab:d.vocabulary,syllable:d.syllables,grammar:d.grammar}[kind]));
      ({atlas:()=>{atlasPage=0;renderAtlas();},vocab:()=>{vocabPage=0;renderVocabulary();},syllable:()=>{syllablePage=0;renderSyllables();},grammar:()=>{grammarPage=0;renderGrammar();}}[kind])();
      notice(`Busca global concluída. Os nove arquivos permanecem em cache nesta sessão.`,'ok');
    }catch(e){console.error(e);notice('A busca global não pôde carregar todas as etapas.','error');}
  }
  function scheduleGlobalSearch(kind){clearTimeout(searchTimers[kind]);searchTimers[kind]=setTimeout(()=>enableGlobalCatalog(kind),260);}
  function renderMeta(){
    $$('[data-full-version]').forEach(x=>x.textContent=VERSION);
    const h=meta.headlineOfficial;
    const vals={fullChars:h.characters.toLocaleString('pt-BR'),fullWords:h.words.toLocaleString('pt-BR'),fullGrammar:meta.queryInventory.grammarRecords,fullSyllables:h.syllables.toLocaleString('pt-BR'),fullUnits:meta.totalUnits,fullSkills:h.competencies};
    Object.entries(vals).forEach(([id,v])=>{const el=$('#'+id);if(el)el.textContent=v;});
    $('#advancedSplitNotice').textContent=meta.advancedSplitNotice;
    $('#grammarDiscrepancy').textContent=meta.grammarNotice;
  }
  function countMastered(type){ return Object.values(state.records[type]||{}).filter(r=>r.level>=4).length; }
  function renderFullDashboard(){
    if(!meta)return;
    const totals={char:3000,word:11092,grammar:573,syllable:1110};
    Object.entries(totals).forEach(([t,total])=>{const done=countMastered(t);const a=$(`#full-${t}-progress`),b=$(`#full-${t}-count`);if(a)a.style.width=pct(done,total)+'%';if(b)b.textContent=`${done.toLocaleString('pt-BR')} / ${total.toLocaleString('pt-BR')}`;});
    const dueCount=Object.entries(state.records).reduce((sum,[t,rs])=>sum+Object.values(rs).filter(r=>!r.due||r.due<=Date.now()).length,0);
    $('#fullDueCount').textContent=dueCount.toLocaleString('pt-BR');
    const weighted=(countMastered('char')/3000+countMastered('word')/11092+countMastered('grammar')/573+countMastered('syllable')/1110)/4;
    $('#fullOverall').textContent=Math.round(weighted*100)+'%';
  }
  function renderStageMap(){
    $('#stageMap').innerHTML=meta.stages.map(s=>{
      const internal=s.splitType!=='official';
      return `<button class="stage-card ${s.stage===state.stage?'active':''}" data-stage="${s.stage}" type="button"><span>Etapa ${s.stage}</span><strong>${s.characterCount} 字 · ${s.wordCount.toLocaleString('pt-BR')} 词</strong><small>${s.grammarRecordCount} gramática · ${s.syllableCount} sílabas · ${s.unitCount} unidades${internal?' · divisão interna':''}</small></button>`;
    }).join('');
  }
  function renderStage(){
    renderStageMap();
    $('#stageSelect').value=String(current.stage);
    const m=current.meta;
    $('#stageTitle').textContent=`Etapa ${current.stage} · ${current.splitType==='official'?'faixa oficial':'subdivisão pedagógica do avançado'}`;
    $('#stageSummary').innerHTML=`<span><b>${m.characterCount}</b> caracteres</span><span><b>${m.wordCount.toLocaleString('pt-BR')}</b> palavras</span><span><b>${m.grammarRecordCount}</b> registros gramaticais</span><span><b>${m.syllableCount}</b> sílabas</span><span><b>${m.unitCount}</b> unidades</span>`;
    renderUnits();renderAtlas();renderVocabulary();renderSyllables();renderGrammar();
  }
  function indexes(){ return {chars:new Map(current.characters.map(x=>[x.id,x])),words:new Map(current.vocabulary.map(x=>[x.id,x])),grammar:new Map(current.grammar.map(x=>[String(x.no),x])),syllables:new Map(current.syllables.map(x=>[x.no,x]))}; }
  function unitProgress(u){ const ix=indexes();const ids=[...u.characters.map(id=>['char',ix.chars.get(id)?.char]),...u.words.map(id=>['word',id]),...u.grammar.map(id=>['grammar',id]),...u.syllables.map(id=>['syllable',id])].filter(x=>x[1]!=null);return pct(ids.filter(([t,id])=>mastered(t,id)).length,ids.length); }
  function renderUnits(){
    $('#unitGridFull').innerHTML=current.units.map(u=>`<button type="button" class="unit-card-full ${u.id===state.unit?'active':''}" data-full-unit="${u.id}"><span>${String(u.globalId).padStart(3,'0')}</span><b>${unitProgress(u)}%</b><small>${u.characters.length} 字 · ${u.words.length} 词</small></button>`).join('');
    renderUnitDetail();
  }
  function gradeButtons(type,id){return `<div class="mini-grade"><button data-full-grade="${type}|${esc(id)}|0" type="button">Errei</button><button data-full-grade="${type}|${esc(id)}|1" type="button">Difícil</button><button data-full-grade="${type}|${esc(id)}|2" type="button">Acertei</button></div>`;}
  function renderUnitDetail(){
    const u=current.units.find(x=>x.id===state.unit)||current.units[0],ix=indexes();
    $('#unitDetailTitle').textContent=`${u.title} · etapa ${current.stage}`;
    $('#unitDetailMeta').textContent=`${u.characters.length} caracteres · ${u.words.length} palavras · ${u.grammar.length} itens gramaticais · ${u.syllables.length} sílabas`;
    $('#unitCharsFull').innerHTML=u.characters.map(id=>{const x=ix.chars.get(id);return `<article class="compact-char ${mastered('char',x.char)?'mastered':''}"><button type="button" data-full-train-char="${x.char}"><b>${x.char}</b><span>${esc(x.pinyin)}</span><small>${esc(x.meaning)}</small></button>${gradeButtons('char',x.char)}</article>`;}).join('');
    $('#unitWordsFull').innerHTML=u.words.slice(0,80).map(id=>{const x=ix.words.get(id);return `<article class="compact-word ${mastered('word',id)?'mastered':''}"><button type="button" data-full-speak="${esc(x.hanzi)}">🔊</button><div><b>${x.hanzi}</b><span>${esc(x.pinyin)}</span><small>${esc(x.meaning)}</small></div>${gradeButtons('word',id)}</article>`;}).join('')+(u.words.length>80?`<p class="full-more">Mais ${u.words.length-80} palavras disponíveis no catálogo da etapa.</p>`:'');
    $('#unitGrammarFull').innerHTML=u.grammar.map(id=>{const x=ix.grammar.get(id);return `<details class="grammar-compact"><summary><b>${x.no}. ${esc(x.title)}</b><span>${esc(x.pattern)}</span></summary><p>${esc(x.explanation)}</p><p lang="zh-Hans"><strong>Fonte:</strong> ${esc(x.source.content||x.source.details||x.source.category)}</p>${gradeButtons('grammar',id)}</details>`;}).join('')||'<p>Nenhum novo registro gramatical nesta unidade.</p>';
    $('#unitSyllablesFull').innerHTML=u.syllables.map(id=>{const x=ix.syllables.get(id);return `<button type="button" class="syllable-chip tone-${tone(x.pinyin)}" data-full-speak="${x.representative}"><b>${x.pinyin}</b><span>${x.representative}</span></button>`;}).join('');
  }
  function filterText(x,q,fields){return !q||fields.map(f=>String(x[f]??'')).join(' ').toLocaleLowerCase('pt-BR').includes(q);}
  function pager(total,page,size,prefix){const pages=Math.max(1,Math.ceil(total/size));return `<div class="catalog-pager"><button type="button" data-${prefix}-page="prev" ${page<=0?'disabled':''}>Anterior</button><span>${page+1} / ${pages} · ${total.toLocaleString('pt-BR')} itens</span><button type="button" data-${prefix}-page="next" ${page>=pages-1?'disabled':''}>Próxima</button></div>`;}
  function renderAtlas(){
    const q=($('#atlasSearch')?.value||'').trim().toLocaleLowerCase('pt-BR'),status=$('#atlasStatus')?.value||'all';let source=q&&globalResults.atlas?globalResults.atlas:current.characters;let a=source.filter(x=>filterText(x,q,['char','traditional','pinyin','meaning'])&&(status==='all'||(status==='mastered')===mastered('char',x.char)));const size=36,pages=Math.max(1,Math.ceil(a.length/size));atlasPage=Math.min(atlasPage,pages-1);const slice=a.slice(atlasPage*size,(atlasPage+1)*size);
    $('#atlasGrid').innerHTML=slice.map(x=>`<article class="atlas-card ${mastered('char',x.char)?'mastered':''}"><button type="button" data-full-train-char="${x.char}"><b>${x.char}</b><span>${esc(x.pinyin)}</span><small>${esc(x.meaning)}</small><em>${x.traditional&&x.traditional!==x.char?'繁 '+x.traditional:''}</em></button></article>`).join('')||'<p>Nenhum caractere encontrado.</p>';
    $('#atlasPager').innerHTML=pager(a.length,atlasPage,size,'atlas');
  }
  function renderVocabulary(){
    const q=($('#fullVocabSearch')?.value||'').trim().toLocaleLowerCase('pt-BR'),status=$('#fullVocabStatus')?.value||'all';let source=q&&globalResults.vocab?globalResults.vocab:current.vocabulary;let a=source.filter(x=>filterText(x,q,['hanzi','traditional','pinyin','meaning','pos','sourceGloss'])&&(status==='all'||(status==='mastered')===mastered('word',x.id)));const size=32,pages=Math.max(1,Math.ceil(a.length/size));vocabPage=Math.min(vocabPage,pages-1);const slice=a.slice(vocabPage*size,(vocabPage+1)*size);
    $('#fullVocabList').innerHTML=slice.map(x=>`<article class="full-vocab-row ${mastered('word',x.id)?'mastered':''}"><button type="button" data-full-speak="${esc(x.hanzi)}">🔊</button><div class="vocab-main"><b>${x.hanzi}</b><span>${esc(x.pinyin)}</span><small>${esc(x.meaning)}</small></div><div class="vocab-meta"><span>${esc(x.pos)}</span>${x.traditional!==x.hanzi?`<span>繁 ${esc(x.traditional)}</span>`:''}</div>${gradeButtons('word',x.id)}<details><summary>Fonte lexical</summary><p lang="en">${esc(x.sourceGloss||'Sem glosa independente no CC-CEDICT.')}</p></details></article>`).join('')||'<p>Nenhuma palavra encontrada.</p>';
    $('#fullVocabPager').innerHTML=pager(a.length,vocabPage,size,'vocab');
  }
  function renderSyllables(){
    const q=($('#syllableSearch')?.value||'').trim().toLocaleLowerCase('pt-BR'),status=$('#syllableStatus')?.value||'all';let source=q&&globalResults.syllable?globalResults.syllable:current.syllables;let a=source.filter(x=>(!q||`${x.pinyin} ${x.representative}`.toLocaleLowerCase('pt-BR').includes(q))&&(status==='all'||(status==='mastered')===mastered('syllable',x.no)));const size=48,pages=Math.max(1,Math.ceil(a.length/size));syllablePage=Math.min(syllablePage,pages-1);const slice=a.slice(syllablePage*size,(syllablePage+1)*size);
    $('#syllableGrid').innerHTML=slice.map(x=>`<article class="syllable-card ${mastered('syllable',x.no)?'mastered':''}"><button type="button" data-full-speak="${x.representative}"><b>${x.pinyin}</b><span>${x.representative}</span><small>${tone(x.pinyin)==='0'?'tom neutro':tone(x.pinyin)+'º tom'}</small></button>${gradeButtons('syllable',x.no)}</article>`).join('');
    $('#syllablePager').innerHTML=pager(a.length,syllablePage,size,'syllable');
  }
  function renderGrammar(){
    const q=($('#fullGrammarSearch')?.value||'').trim().toLocaleLowerCase('pt-BR'),group=$('#grammarGroup')?.value||'all';let source=q&&globalResults.grammar?globalResults.grammar:current.grammar;let a=source.filter(x=>(!q||`${x.title} ${x.explanation} ${x.pattern} ${x.groupPt} ${x.categoryPt} ${x.source.content}`.toLocaleLowerCase('pt-BR').includes(q))&&(group==='all'||x.groupPt===group));const size=18,pages=Math.max(1,Math.ceil(a.length/size));grammarPage=Math.min(grammarPage,pages-1);const slice=a.slice(grammarPage*size,(grammarPage+1)*size);
    $('#fullGrammarList').innerHTML=slice.map(x=>`<details class="grammar-full ${mastered('grammar',x.no)?'mastered':''}"><summary><span><b>${x.no}. ${esc(x.title)}</b><small>${esc(x.groupPt)} · ${esc(x.categoryPt)}</small></span><em>${x.worked?'aula trabalhada':'registro oficial'}</em></summary><p>${esc(x.explanation)}</p><div class="pattern-source"><span>Padrão</span><strong lang="zh-Hans">${esc(x.pattern)}</strong></div>${x.examples?.length?`<div class="worked-examples">${x.examples.map(e=>`<p><button type="button" data-full-speak="${esc(e.zh)}">🔊</button><b>${e.zh}</b> · ${esc(e.pinyin)}<br><small>${esc(e.pt)}</small></p>`).join('')}</div>`:''}<details><summary>Transcrição-fonte</summary><dl><dt>项目</dt><dd>${esc(x.source.group)}</dd><dt>类别</dt><dd>${esc(x.source.category)}</dd><dt>细目</dt><dd>${esc(x.source.details)}</dd><dt>内容</dt><dd>${esc(x.source.content)}</dd></dl></details>${gradeButtons('grammar',x.no)}</details>`).join('');
    $('#fullGrammarPager').innerHTML=pager(a.length,grammarPage,size,'grammar');
  }
  function populateSelectors(){
    $('#stageSelect').innerHTML=meta.stages.map(s=>`<option value="${s.stage}">Etapa ${s.stage}${s.splitType==='official'?'':' · interna'}</option>`).join('');$('#stageSelect').value=String(current.stage);
    const groups=[...new Set(current.grammar.map(x=>x.groupPt))].sort();$('#grammarGroup').innerHTML='<option value="all">Todos os grupos</option>'+groups.map(g=>`<option>${esc(g)}</option>`).join('');
  }
  function openFullTrainer(ch){ const x=current.characters.find(c=>c.char===ch)||[...cache.values()].flatMap(d=>d.characters).find(c=>c.char===ch);if(!x)return;trainerChar=x;$('#fullTrainerChar').textContent=x.char;$('#fullTrainerPinyin').textContent=x.pinyin;$('#fullTrainerMeaning').textContent=x.meaning;$('#fullTrainerMeta').textContent=`Etapa ${x.stage} · tradicional ${x.traditional||x.char} · ${x.writingLevel?`escrita nível ${x.writingLevel}`:'reconhecimento avançado'}`;$('#fullTrainerExamples').innerHTML=(x.examples||[]).map(e=>`<span>${e}</span>`).join('');createFullWriter();$('#laboratorio-integral').scrollIntoView({behavior:'smooth',block:'start'}); }
  function createFullWriter(){ const target=$('#fullWriter');target.innerHTML='';if(!trainerChar)return;const size=Math.min(330,Math.max(250,target.clientWidth||330));target.style.width=target.style.height=size+'px';if(!window.HanziWriter){target.innerHTML=`<div class="writer-fallback">${trainerChar.char}</div>`;return;}try{trainerWriter=HanziWriter.create(target,trainerChar.char,{width:size,height:size,padding:25,showOutline:true,showCharacter:true,strokeColor:getComputedStyle(document.documentElement).getPropertyValue('--ink').trim(),outlineColor:getComputedStyle(document.documentElement).getPropertyValue('--line').trim(),highlightColor:getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),drawingColor:getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),drawingWidth:7});}catch(e){target.innerHTML=`<div class="writer-fallback">${trainerChar.char}</div>`;} }
  function chooseLab(kind){ if(!current)return;const words=current.vocabulary.filter(x=>x.meaning&&x.pinyin);const w=words[Math.floor(Math.random()*words.length)],opts=shuffle([w,...shuffle(words.filter(x=>x.id!==w.id)).slice(0,3)]);lab={kind,w,opts};$('#labMode').textContent=({reading:'Leitura',listening:'Escuta',translation:'Tradução',speaking:'Fala'}[kind]||kind);let html='';if(kind==='reading')html=`<p class="lab-prompt"><b>${w.hanzi}</b><span>${w.pinyin}</span></p><p>Qual é o significado?</p>`;if(kind==='listening')html=`<p class="lab-prompt"><button type="button" data-full-speak="${w.hanzi}" class="audio-large">▶ Ouvir</button></p><p>Qual tradução corresponde ao áudio?</p>`;if(kind==='translation')html=`<p class="lab-prompt"><b>${esc(w.meaning)}</b></p><label>Digite em caracteres chineses<input id="translationInput" autocomplete="off" lang="zh-Hans"></label><button type="button" id="checkTranslation" class="button primary">Verificar</button>`;if(kind==='speaking')html=`<p class="lab-prompt"><b>${w.hanzi}</b><span>${w.pinyin} · ${esc(w.meaning)}</span></p><button type="button" id="startRecognition" class="button primary">Gravar pronúncia</button><p id="speechResult">Use reconhecimento de voz quando disponível ou faça autoavaliação.</p><div class="mini-grade"><button data-self-speech="0">Preciso repetir</button><button data-self-speech="2">Pronunciei bem</button></div>`;if(['reading','listening'].includes(kind))html+=`<div class="lab-options">${opts.map(o=>`<button type="button" data-lab-answer="${o.id}">${esc(o.meaning)}</button>`).join('')}</div>`;$('#skillLab').innerHTML=html; }
  function answerLab(id){ const ok=id===lab.w.id;$('#labFeedback').textContent=ok?`Correto: ${lab.w.hanzi} · ${lab.w.pinyin} · ${lab.w.meaning}`:`Resposta: ${lab.w.hanzi} · ${lab.w.pinyin} · ${lab.w.meaning}`;grade(lab.kind,lab.w.id,ok?2:0);setTimeout(()=>chooseLab(lab.kind),900); }
  function startSpeech(){ const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){$('#speechResult').textContent='Reconhecimento indisponível neste navegador. Use a autoavaliação.';return;}const r=new SR();r.lang='zh-CN';r.interimResults=false;r.onresult=e=>{const t=e.results[0][0].transcript;const ok=t.includes(lab.w.hanzi)||lab.w.hanzi.includes(t);$('#speechResult').textContent=`Reconhecido: ${t}. ${ok?'Correspondência encontrada.':'Compare e repita.'}`;grade('speaking',lab.w.id,ok?2:1);};r.onerror=()=>$('#speechResult').textContent='Não foi possível reconhecer. Tente novamente ou use autoavaliação.';r.start(); }
  function allCurrentItems(){return [...current.characters.map(x=>({type:'char',id:x.char,front:x.char,back:`${x.pinyin} · ${x.meaning}`})),...current.vocabulary.map(x=>({type:'word',id:x.id,front:x.hanzi,back:`${x.pinyin} · ${x.meaning}`})),...current.grammar.map(x=>({type:'grammar',id:String(x.no),front:x.title,back:x.pattern})),...current.syllables.map(x=>({type:'syllable',id:x.no,front:x.pinyin,back:x.representative}))];}
  function startReview(){reviewQueue=shuffle(allCurrentItems().filter(x=>due(x.type,x.id))).slice(0,60);reviewIndex=0;renderReview();}
  function renderReview(){const el=$('#fullReviewCard');if(!reviewQueue.length){el.innerHTML='<p>Nenhum item vencido nesta etapa.</p>';return;}if(reviewIndex>=reviewQueue.length){el.innerHTML='<p>Revisão concluída.</p>';return;}const x=reviewQueue[reviewIndex];el.innerHTML=`<span>${reviewIndex+1}/${reviewQueue.length}</span><div class="review-front">${esc(x.front)}</div><button type="button" id="fullReveal" class="button secondary">Revelar</button><div id="fullReviewBack" hidden><p>${esc(x.back)}</p><div class="review-grades"><button data-review-q="0">Errei</button><button data-review-q="1">Difícil</button><button data-review-q="2">Acertei</button></div></div>`;}
  function makeOptions(correct,pool,key){return shuffle([correct,...shuffle(pool.filter(x=>x[key]!==correct[key])).slice(0,3)]);}
  function startExam(){ if(!current)return;const qs=[];const cs=shuffle(current.characters).slice(0,6),ws=shuffle(current.vocabulary).slice(0,18),ss=shuffle(current.syllables).slice(0,3),gs=shuffle(current.grammar).slice(0,3);cs.forEach(x=>qs.push({type:'char',prompt:`O que indica ${x.char}?`,correct:x.meaning,options:makeOptions(x,current.characters,'char').map(o=>o.meaning)}));ws.slice(0,6).forEach(x=>qs.push({type:'word',prompt:`Qual é o significado de ${x.hanzi}?`,correct:x.meaning,options:makeOptions(x,current.vocabulary,'id').map(o=>o.meaning)}));ws.slice(6,12).forEach(x=>qs.push({type:'reading',prompt:`Qual é o pinyin de ${x.hanzi}?`,correct:x.pinyin,options:makeOptions(x,current.vocabulary,'id').map(o=>o.pinyin)}));ws.slice(12,18).forEach(x=>qs.push({type:'listening',audio:x.hanzi,prompt:'Ouça e selecione o significado.',correct:x.meaning,options:makeOptions(x,current.vocabulary,'id').map(o=>o.meaning)}));ss.forEach(x=>qs.push({type:'syllable',prompt:`Qual caractere representa a sílaba ${x.pinyin}?`,correct:x.representative,options:makeOptions(x,current.syllables,'no').map(o=>o.representative)}));gs.forEach(x=>qs.push({type:'grammar',prompt:`A qual categoria pertence “${x.pattern}”?`,correct:x.title,options:makeOptions(x,current.grammar,'no').map(o=>o.title)}));exam=shuffle(qs);renderExam();}
  function renderExam(){ $('#fullExam').innerHTML=exam.map((q,i)=>`<fieldset class="exam-q"><legend>${i+1}. ${q.audio?`<button type="button" data-full-speak="${q.audio}">🔊 Ouvir</button> `:''}${esc(q.prompt)}</legend>${shuffle([...new Set(q.options)]).map(o=>`<label><input type="radio" name="fullExam${i}" value="${esc(o)}"> ${esc(o)}</label>`).join('')}</fieldset>`).join('');$('#fullExamResult').textContent=''; }
  function submitExam(){let ok=0;const per={};exam.forEach((q,i)=>{const v=$(`input[name="fullExam${i}"]:checked`)?.value;const hit=v===q.correct;ok+=hit?1:0;per[q.type]??={ok:0,n:0};per[q.type].n++;per[q.type].ok+=hit?1:0;});state.lastExam={date:Date.now(),ok,total:exam.length,stage:current.stage,per};save();$('#fullExamResult').innerHTML=`<strong>${ok}/${exam.length} · ${pct(ok,exam.length)}%</strong><div>${Object.entries(per).map(([k,v])=>`<span>${k}: ${v.ok}/${v.n}</span>`).join('')}</div>`;}
  async function downloadStage(){ if(!('caches' in window)){notice('Cache offline indisponível neste navegador.','error');return;}const urls=['./','./index.html','./styles.css','./app.js','./course.js','./full-course.js','./curriculum-data.js','./data/meta.json',`./data/stage-${current.stage}.json`];const c=await caches.open(`bishun-stage-${current.stage}-v4`);await c.addAll(urls);if(!state.downloaded.includes(current.stage))state.downloaded.push(current.stage);save();notice(`Etapa ${current.stage} disponível offline neste navegador.`,'ok'); }
  function exportProgress(){const blob=new Blob([JSON.stringify({schema:'bishun-full-v4',version:VERSION,exported:new Date().toISOString(),state},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`bishun-progresso-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href);}
  function importProgress(file){const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(x.schema!=='bishun-full-v4'||!x.state)throw 0;state={...defaultState(),...x.state};save();location.reload();}catch{notice('Arquivo de progresso inválido.','error');}};r.readAsText(file);}
  document.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.stage)loadStage(b.dataset.stage);
    if(b.dataset.fullUnit){state.unit=Number(b.dataset.fullUnit);save();renderUnits();$('#unitDetailFull').scrollIntoView({behavior:'smooth',block:'start'});}
    if(b.dataset.fullSpeak)speak(b.dataset.fullSpeak,Number(b.dataset.rate||.82));
    if(b.dataset.fullTrainChar)openFullTrainer(b.dataset.fullTrainChar);
    if(b.dataset.fullGrade){const [t,id,q]=b.dataset.fullGrade.split('|');grade(t,id,Number(q));renderUnitDetail();renderAtlas();renderVocabulary();renderSyllables();renderGrammar();}
    for(const [p,setter,render] of [['atlas',v=>atlasPage+=v,renderAtlas],['vocab',v=>vocabPage+=v,renderVocabulary],['syllable',v=>syllablePage+=v,renderSyllables],['grammar',v=>grammarPage+=v,renderGrammar]])if(b.dataset[p+'Page']){setter(b.dataset[p+'Page']==='next'?1:-1);render();}
    if(b.dataset.labMode)chooseLab(b.dataset.labMode);
    if(b.dataset.labAnswer)answerLab(b.dataset.labAnswer);
    if(b.id==='checkTranslation'){const v=$('#translationInput').value.trim(),ok=v===lab.w.hanzi;$('#labFeedback').textContent=ok?'Correto.':`Resposta: ${lab.w.hanzi} · ${lab.w.pinyin}`;grade('translation',lab.w.id,ok?2:0);}
    if(b.id==='startRecognition')startSpeech();if(b.dataset.selfSpeech!==undefined){grade('speaking',lab.w.id,Number(b.dataset.selfSpeech));chooseLab('speaking');}
    if(b.id==='fullReveal'){b.hidden=true;$('#fullReviewBack').hidden=false;}
    if(b.dataset.reviewQ!==undefined){const x=reviewQueue[reviewIndex++];grade(x.type,x.id,Number(b.dataset.reviewQ));renderReview();}
    if(b.id==='startFullReview')startReview();if(b.id==='newFullExam')startExam();if(b.id==='submitFullExam')submitExam();
    if(b.id==='fullSpeakNormal'&&trainerChar)speak(trainerChar.char,.78);if(b.id==='fullSpeakSlow'&&trainerChar)speak(trainerChar.char,.55);if(b.id==='fullAnimate'&&trainerWriter)trainerWriter.animateCharacter();if(b.id==='fullQuiz'&&trainerWriter&&trainerChar){grade('char',trainerChar.char,1);trainerWriter.quiz({showHintAfterMisses:2,onComplete:s=>{grade('char',trainerChar.char,(s.totalMistakes||0)<=1?2:1);$('#fullTrainerStatus').textContent=`Concluído com ${s.totalMistakes||0} erros.`;}});}
    if(b.id==='downloadStage')downloadStage();if(b.id==='exportFullProgress')exportProgress();
  });
  $('#atlasSearch')?.addEventListener('input',()=>scheduleGlobalSearch('atlas'));$('#atlasStatus')?.addEventListener('change',()=>{atlasPage=0;renderAtlas();});
  $('#fullVocabSearch')?.addEventListener('input',()=>scheduleGlobalSearch('vocab'));$('#fullVocabStatus')?.addEventListener('change',()=>{vocabPage=0;renderVocabulary();});
  $('#syllableSearch')?.addEventListener('input',()=>scheduleGlobalSearch('syllable'));$('#syllableStatus')?.addEventListener('change',()=>{syllablePage=0;renderSyllables();});
  $('#fullGrammarSearch')?.addEventListener('input',()=>scheduleGlobalSearch('grammar'));$('#grammarGroup')?.addEventListener('change',()=>{grammarPage=0;renderGrammar();});
  $('#stageSelect')?.addEventListener('change',e=>loadStage(e.target.value));$('#importFullProgress')?.addEventListener('change',e=>e.target.files[0]&&importProgress(e.target.files[0]));
  async function init(){ try{await loadMeta();await loadStage(state.stage,true);trainerChar=current.characters[0];openFullTrainer(trainerChar.char);notice('Programa integral carregado. Selecione uma etapa para começar.','ok');}catch(e){console.error(e);notice('Falha ao iniciar o programa integral.','error');} }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
