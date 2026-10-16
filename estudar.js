(()=>{
'use strict';
const $=id=>document.getElementById(id);
const modes=['aprender','escrever','revisar','avaliar'],KEY='bishunUnitJourneyV70',LEGACY='bishunFullV4',DAY=86400000;
const stepFields={aprender:'learned',escrever:'written',revisar:'reviewed',avaliar:'evaluated'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bounds=(x,min,max)=>Math.max(min,Math.min(max,Number(x)||min));
const readJSON=(key)=>{try{const v=JSON.parse(localStorage.getItem(key)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}catch{return{}}};
const saveJSON=(key,obj)=>{try{localStorage.setItem(key,JSON.stringify(obj));return true}catch(e){console.warn('Armazenamento indisponível',e);return false}};
const readJourney=()=>{const s=readJSON(KEY);s.units=s.units&&typeof s.units==='object'&&!Array.isArray(s.units)?s.units:{};return s};
const legacyState=()=>readJSON(LEGACY);
const stageCache=new Map();
let current=null,stage=1,unit=1,mode='aprender',ticket=0,stageLoading=false;
let reviewItems=[],reviewAt=0,reviewRatings=0,exam=[],examAt=0,score=0,examLocked=false,writer=null,writerPromise=null,writerChar='',writingTicket=0;
const params=new URLSearchParams(location.search),old=legacyState(),previous=readJourney().last||{};
const unitLimits=[30,30,30,30,30,30,40,40,40];
const initialStage=bounds(params.get('etapa')||previous.stage||old.stage||1,1,9);
const initialUnit=bounds(params.get('unidade')||previous.unit||old.unitsByStage?.[initialStage]||old.unit||1,1,unitLimits[initialStage-1]);
const initialMode=modes.includes(params.get('modo'))?params.get('modo'):(modes.includes(previous.mode)?previous.mode:'aprender');
function progressKey(){return stage+':'+unit}
function progress(){const s=readJourney(),v=s.units[progressKey()]||{};return {learned:false,written:false,reviewed:false,evaluated:false,score:null,completedAt:null,...v}}
function updateProgress(update){const s=readJourney(),key=progressKey(),next={...progress(),...update,updatedAt:Date.now()};const all=['learned','written','reviewed','evaluated'].every(x=>next[x]);if(all&&!next.completedAt)next.completedAt=Date.now();if(!all)next.completedAt=null;s.units[key]=next;s.last={stage,unit,mode};saveJSON(KEY,s);paintProgress();return next}
function rememberContext(){
 const state=legacyState();state.stage=stage;state.unit=unit;state.unitsByStage=state.unitsByStage&&typeof state.unitsByStage==='object'&&!Array.isArray(state.unitsByStage)?state.unitsByStage:{};state.unitsByStage[stage]=unit;saveJSON(LEGACY,state);
 const flow=readJourney();flow.last={stage,unit,mode};saveJSON(KEY,flow)
}
function setURL(push=false){const url=new URL(location.href);url.searchParams.set('etapa',String(stage));url.searchParams.set('unidade',String(unit));url.searchParams.set('modo',mode);if(push)history.pushState(null,'',url);else history.replaceState(null,'',url)}
function announce(msg,fail=false){const el=$('loadStatus');el.hidden=false;el.textContent=msg;el.dataset.error=String(fail)}
function takeHide(){if(current)$('loadStatus').hidden=true}
function components(){
 const unitData=current?.units?.find(x=>Number(x.id)===unit);
 if(!unitData)return {u:null,chars:[],words:[],grammar:[],syllables:[]};
 const charsById=new Map(current.characters.map(x=>[String(x.id),x])),wordsById=new Map(current.vocabulary.map(x=>[String(x.id),x]));
 const gramById=new Map(current.grammar.map(x=>[String(x.no),x])),sylById=new Map(current.syllables.map(x=>[String(x.no),x]));
 return {u:unitData,chars:(unitData.characters||[]).map(x=>charsById.get(String(x))).filter(Boolean),words:(unitData.words||[]).map(x=>wordsById.get(String(x))).filter(Boolean),grammar:(unitData.grammar||[]).map(x=>gramById.get(String(x))).filter(Boolean),syllables:(unitData.syllables||[]).map(x=>sylById.get(String(x))).filter(Boolean)}
}
function paintProgress(){
 const p=progress(),done=modes.filter(m=>p[stepFields[m]]).length;
 $('unitProgressLabel').textContent=done+' de 4 atividades';
 $('unitProgressPct').textContent=done*25+'%';
 $('unitProgressBar').setAttribute('aria-valuenow',String(done));
 $('unitProgressFill').style.width=done*25+'%';
 $('completionLabel').textContent=done===4?'Você concluiu os quatro passos':done===0?'Comece conhecendo os caracteres':done+' de 4 passos realizados';
 $('completionLabel').classList.toggle('complete',done===4);
 document.querySelectorAll('[data-progress]').forEach(el=>{const status=Boolean(p[stepFields[el.dataset.progress]]);el.classList.toggle('done',status);el.querySelector('span').textContent=status?'✓':String(modes.indexOf(el.dataset.progress)+1)});
 const next=modes.find(m=>!p[stepFields[m]]);
 $('nextSuggested').textContent=next?'Seu próximo passo: '+({aprender:'Conhecer e ouvir',escrever:'Observar e escrever',revisar:'Lembrar sem olhar',avaliar:'Conferir o que aprendeu'})[next]:'Você passou pelos quatro passos';
 $('nextDescription').textContent=next?'Escolha esse passo acima e continue quando estiver pronto.':'Avance para outra unidade ou refaça um passo que queira praticar.';
 $('finishLearn').textContent=p.learned?'Já conheci o conteúdo · continuar a escrita →':'Já li e ouvi · vou praticar a escrita →';
 const buttons=$('unitIndex').querySelectorAll('button[data-unit]');
 buttons.forEach(b=>{const s=readJourney().units[stage+':'+b.dataset.unit]||{};b.classList.toggle('complete',['learned','written','reviewed','evaluated'].every(x=>s[x]));b.classList.toggle('active',Number(b.dataset.unit)===unit)});
}
function speak(text,rate=.82){if(!('speechSynthesis'in window)){$('writingFeedback').textContent='Síntese de voz indisponível neste navegador.';return}try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(String(text));u.lang='zh-CN';u.rate=rate;const voices=speechSynthesis.getVoices();u.voice=voices.find(v=>v.lang.toLowerCase()==='zh-cn')||voices.find(v=>v.lang.toLowerCase().startsWith('zh'))||null;speechSynthesis.speak(u)}catch(e){console.warn('Áudio indisponível',e)}}
function renderLearn(){
 const {chars,words,grammar,syllables}=components();
 $('learnCharacters').innerHTML=chars.map(c=>'<article class="character-tile"><strong class="hanzi" lang="zh-Hans">'+esc(c.char)+'</strong><span class="pinyin">'+esc(c.pinyin)+'</span><span class="meaning">'+esc(c.meaning)+'</span><button type="button" data-say="'+esc(c.char)+'" aria-label="Ouvir '+esc(c.char)+'">Ouvir</button></article>').join('');
 $('learnWords').innerHTML=words.map(w=>'<article class="vocabulary-item"><b lang="zh-Hans">'+esc(w.hanzi)+'</b> <span class="pinyin">'+esc(w.pinyin)+'</span><small>'+esc(w.meaning)+'</small></article>').join('')||'<p>Nenhum vocábulo cadastrado nesta unidade.</p>';
 $('learnGrammar').innerHTML=grammar.map(g=>'<article class="grammar-item"><h5>'+esc(g.title)+'</h5><p class="pattern">'+esc(g.pattern)+'</p><p>'+esc(g.explanation||g.source?.content)+'</p>'+(g.examples||[]).slice(0,2).map(e=>'<p><span lang="zh-Hans">'+esc(e.zh)+'</span> · '+esc(e.pinyin)+' · '+esc(e.pt)+'</p>').join('')+'</article>').join('')||'<p>Nenhum registro gramatical adicional nesta unidade.</p>';
 $('learnSyllables').innerHTML=syllables.map(s=>'<span>'+esc(s.pinyin)+' <span lang="zh-Hans">'+esc(s.representative)+'</span></span>').join('')||'<p>Sem novas sílabas registradas.</p>';
}
function renderWriting(){
 const {chars}=components();$('writeCharacter').innerHTML=chars.map(x=>'<option value="'+esc(x.char)+'">'+esc(x.char)+' · '+esc(x.pinyin)+' · '+esc(x.meaning)+'</option>').join('');
 writerChar=chars[0]?.char||'';paintWriter();
}
function paintWriter(){
 const {chars}=components(),c=chars.find(x=>x.char===writerChar)||chars[0];writer=null;writingTicket++;writerChar=c?.char||'';
 $('writeCharacter').value=writerChar;
 $('writerFrame').innerHTML='<span class="writer-hanzi" lang="zh-Hans">'+esc(writerChar||'字')+'</span>';
 $('writeHanzi').textContent=writerChar||'';
 $('writePinyin').textContent=c?.pinyin||'';
 $('writeMeaning').textContent=c?.meaning||'';
 $('writingFeedback').textContent='Primeiro veja a ordem dos traços. Depois, tente escrever com o dedo ou com o mouse.'
}
const studentGuidance={
 aprender:['Passo 1 de 4','Conhecer e ouvir','Leia os caracteres, ouça a pronúncia e conheça os significados. Quando terminar, escolha o botão para praticar a escrita.'],
 escrever:['Passo 2 de 4','Observar e escrever','Veja a ordem dos traços e tente escrever pelo menos um caractere. Você pode repetir antes de seguir.'],
 revisar:['Passo 3 de 4','Lembrar sem olhar','Pense no significado de cada caractere antes de revelar a resposta. Diga se lembrou ou não.'],
 avaliar:['Passo 4 de 4','Conferir o que aprendeu','Responda às dez perguntas. Sete acertos concluem este passo; se precisar, volte a praticar.']
};
function setMode(next,{historyMode=false,focus=false}={}){
 if(!modes.includes(next))next='aprender';mode=next;
 const guidance=studentGuidance[mode];$('studentStepNumber').textContent=guidance[0];$('studentGoal').textContent=guidance[1];$('studentAction').textContent=guidance[2];
 for(const m of modes){const tab=$('tab-'+m),panel=$('panel-'+m),active=m===mode;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;panel.hidden=!active}
 if(current){rememberContext();setURL(historyMode);takeHide()}
 if(focus)$('tab-'+mode).focus({preventScroll:true})
}
function paintUnit(){
 const {u,chars,words,grammar,syllables}=components();if(!u)return;
 $('crumbUnit').textContent='Etapa '+stage+' · unidade '+unit;
 $('unitEyebrow').textContent='Etapa '+stage+' de 9 · Unidade '+String(u.globalId||u.id).padStart(3,'0');
 $('unitTitle').textContent='Unidade '+String(u.globalId||u.id).padStart(3,'0');
 $('unitSummary').textContent=chars.length+' caracteres · '+words.length+' palavras · '+grammar.length+' pontos gramaticais · '+syllables.length+' sílabas';
 $('unitDetail').textContent=unit+' de '+current.units.length+' unidades nesta etapa';
 $('studyUnit').value=String(unit);
 renderLearn();renderWriting();
 reviewItems=[];reviewAt=0;exam=[];examAt=0;
 $('reviewCard').innerHTML='<p>Comece quando estiver pronto. Tente lembrar antes de revelar a resposta.</p>';
 $('reviewContext').textContent=progress().learned?'Agora tente lembrar o significado sem consultar a lista de caracteres.':'Se ainda não conhece alguns caracteres, use este exercício como primeira prática de memória.';
 $('startReview').hidden=false;$('reviewToTest').hidden=true;$('testCard').innerHTML='<p>Escolha o significado correto de cada caractere. Este exercício verifica apenas o reconhecimento dos significados.</p>';
 $('startTest').textContent='Responder às dez perguntas';
 paintProgress();
 $('prevUnit').disabled=stage===1&&unit===1;
 $('nextUnit').disabled=stage===9&&unit===40;
 $('studyContent').hidden=false;
}
function paintUnitIndex(){
 $('studyUnit').innerHTML=current.units.map(u=>'<option value="'+u.id+'">Unidade '+String(u.globalId||u.id).padStart(3,'0')+'</option>').join('');
 $('unitIndex').innerHTML=current.units.map(u=>'<button type="button" data-unit="'+u.id+'" title="Unidade '+String(u.globalId||u.id).padStart(3,'0')+'">'+String(u.id).padStart(2,'0')+'</button>').join('');
}
async function loadStage(target,requestedUnit=1,requestedMode='aprender',push=false){
 const wanted=bounds(target,1,9),seq=++ticket;stageLoading=true;
 $('failurePanel').hidden=true;$('studyContent').hidden=true;$('studyUnit').disabled=true;$('studyStage').value=String(wanted);
 announce('Carregando os dados da etapa '+wanted+'…');
 try{
  let result=stageCache.get(wanted);
  if(!result){const r=await fetch('data/stage-'+wanted+'.json');if(!r.ok)throw Error('HTTP '+r.status);result=await r.json();if(result.stage!==wanted||!Array.isArray(result.units)||!Array.isArray(result.characters)||!Array.isArray(result.vocabulary))throw Error('Etapa inválida');stageCache.set(wanted,result)}
  if(seq!==ticket)return;
  current=result;stage=wanted;unit=bounds(requestedUnit,1,current.units.length);
  paintUnitIndex();$('studyUnit').disabled=false;paintUnit();setMode(requestedMode,{historyMode:push});
  $('loadStatus').hidden=true;stageLoading=false;
 }catch(e){if(seq!==ticket)return;console.error(e);announce('Falha ao carregar a etapa '+wanted+'.',true);$('failurePanel').hidden=false;stageLoading=false;$('studyStage').value=String(stage)}
}
function selectUnit(next,push=true){if(!current)return;unit=bounds(next,1,current.units.length);paintUnit();setMode('aprender',{historyMode:push});rememberContext()}
function relativeUnit(delta){
 if(!current)return;
 const next=unit+delta;
 if(next>=1&&next<=current.units.length)return selectUnit(next);
 if(next>current.units.length&&stage<9)return loadStage(stage+1,1,'aprender',true);
 if(next<1&&stage>1)return loadStage(stage-1,unitLimits[stage-2],'aprender',true)
}
function writerLoader(){
 if(window.HanziWriter)return Promise.resolve(window.HanziWriter);
 if(writerPromise)return writerPromise;
 writerPromise=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/hanzi-writer@3.7.3/dist/hanzi-writer.min.js';s.async=true;s.onload=()=>window.HanziWriter?resolve(window.HanziWriter):reject(Error('Motor de escrita indisponível'));s.onerror=()=>reject(Error('Não foi possível acessar o motor de escrita'));document.head.appendChild(s)}).catch(e=>{writerPromise=null;throw e});
 return writerPromise
}
async function runWriting(type){
 if(!current||!writerChar)return;
 const char=writerChar,seq=++writingTicket;
 $('writingFeedback').textContent='Preparando o caractere '+char+'…';
 try{
  const lib=await writerLoader();
  if(seq!==writingTicket||char!==writerChar||mode!=='escrever')return;
  const frame=$('writerFrame');frame.innerHTML='';const size=Math.min(290,frame.clientWidth||290);
  writer=lib.create(frame,char,{width:size,height:size,padding:25,showOutline:true,showCharacter:true,strokeColor:'#224b9a',outlineColor:'#cbd9ec',highlightColor:'#db8129',drawingColor:'#1f4aa8',drawingWidth:8});
  if(type==='animate'){writer.animateCharacter();$('writingFeedback').textContent='Observe por onde começa cada traço e a ordem até completar o caractere.';return}
  $('writingFeedback').textContent='Agora tente escrever na ordem mostrada. Você pode usar o dedo ou o mouse.';
  writer.quiz({showHintAfterMisses:2,onComplete:result=>{
   if(char!==writerChar||!current||seq!==writingTicket)return;
   updateProgress({written:true,writingCharacter:char,writingMistakes:Number(result.totalMistakes)||0});
   $('writingFeedback').textContent='Escrita de '+char+' concluída ('+(Number(result.totalMistakes)||0)+' erros). Atividade registrada.'
  }});
 }catch(e){console.error(e);$('writerFrame').innerHTML='<span class="writer-hanzi" lang="zh-Hans">'+esc(char)+'</span>';$('writingFeedback').textContent='A animação exige acesso ao motor externo. O conteúdo e o áudio permanecem disponíveis.'}
}
function reviewQueue(){
 const {chars,words}=components(),src=[...chars.slice(0,8).map(x=>({type:'char',id:x.char,char:x.char,pinyin:x.pinyin,meaning:x.meaning})),...words.slice(0,4).map(x=>({type:'word',id:x.id,char:x.hanzi,pinyin:x.pinyin,meaning:x.meaning}))];
 const records=legacyState().records||{};
 return src.map(x=>({...x,isNew:!records[x.type]?.[x.id]}));
}
function grade(item,q){
 const state=legacyState();state.records=state.records&&typeof state.records==='object'?state.records:{};
 state.records[item.type]=state.records[item.type]&&typeof state.records[item.type]==='object'?state.records[item.type]:{};
 const intervals=[0,1,3,7,14,30,60,120],now=Date.now();
 const r={level:0,due:0,attempts:0,correct:0,last:0,...(state.records[item.type][item.id]||{})};
 r.attempts++;if(q>=2){r.correct++;r.level=Math.min(7,r.level+1)}else if(q===1){r.level=Math.max(1,r.level)}else{r.level=0}
 r.last=now;r.due=now+intervals[r.level]*DAY;state.records[item.type][item.id]=r;saveJSON(LEGACY,state);
}
function renderReview(){
 const box=$('reviewCard');
 if(reviewAt>=reviewItems.length){updateProgress({reviewed:true,reviewCount:reviewRatings,reviewedAt:Date.now()});box.innerHTML='<h4>Você terminou este exercício de memória</h4><p>Você tentou lembrar '+reviewRatings+' caracteres ou palavras. Agora confira o que aprendeu.</p>';$('reviewToTest').hidden=false;$('startReview').textContent='Tentar lembrar novamente';$('startReview').hidden=false;return}
 const item=reviewItems[reviewAt];
 box.innerHTML='<p class="study-muted">Item '+(reviewAt+1)+' de '+reviewItems.length+' · '+(item.isNew?'Primeiro contato':'Já visto antes')+'</p><div class="quiz-hanzi" lang="zh-Hans">'+esc(item.char)+'</div><button type="button" class="study-button secondary" id="revealAnswer">Revelar resposta</button><div id="reviewAnswer" hidden><p><strong>'+esc(item.pinyin)+'</strong> · '+esc(item.meaning)+'</p><div class="writer-actions"><button type="button" class="study-button ghost" data-grade="0">Não lembrei</button><button type="button" class="study-button secondary" data-grade="1">Com dificuldade</button><button type="button" class="study-button" data-grade="2">Lembrei</button></div></div>';
 $('revealAnswer').addEventListener('click',()=>{$('reviewAnswer').hidden=false;$('revealAnswer').hidden=true});
 box.querySelectorAll('[data-grade]').forEach(btn=>btn.addEventListener('click',()=>{grade(item,Number(btn.dataset.grade));reviewRatings++;reviewAt++;renderReview()}))
}
function beginReview(){if(!current)return;reviewItems=reviewQueue();reviewAt=0;reviewRatings=0;$('reviewToTest').hidden=true;$('startReview').hidden=true;renderReview()}
function shuffle(items){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function quizQuestions(){
 const {chars}=components(),source=current.characters.filter(x=>x.meaning);
 return shuffle(chars.filter(x=>x.meaning)).slice(0,10).map(c=>{const distractors=shuffle(source.filter(x=>x.char!==c.char&&x.meaning!==c.meaning)).map(x=>x.meaning);
  const options=[c.meaning];for(const choice of distractors){if(!options.includes(choice))options.push(choice);if(options.length===4)break}
  return {char:c.char,correct:c.meaning,options:shuffle(options)}
 }).filter(q=>q.options.length===4)
}
function renderExam(){
 const box=$('testCard');
 if(examAt>=exam.length){
  const percent=Math.round(score/exam.length*100),passed=score>=Math.ceil(exam.length*.7);
  const prev=progress();updateProgress({evaluated:passed||prev.evaluated,score,examTotal:exam.length,lastTestedAt:Date.now()});
  box.innerHTML='<h4>Veja como você se saiu</h4><p><strong>'+score+' de '+exam.length+' respostas corretas ('+percent+'%)</strong></p><p>'+ (passed?'Você acertou pelo menos sete questões e concluiu este passo.':'Você ainda não acertou sete questões. Revise os significados e tente novamente.')+'</p><p class="study-muted">Esta avaliação mede apenas reconhecimento de significados.</p>';
  $('startTest').textContent='Tentar as perguntas novamente';
  return
 }
 const question=exam[examAt];
 box.innerHTML='<p class="study-muted">Questão '+(examAt+1)+' de '+exam.length+'</p><h4>Qual é o significado de <span lang="zh-Hans">'+esc(question.char)+'</span>?</h4><div class="quiz-options">'+question.options.map((option,i)=>'<button type="button" data-answer="'+i+'">'+esc(option)+'</button>').join('')+'</div><p class="quiz-feedback" id="testFeedback" aria-live="polite"></p><button type="button" class="study-button" id="advanceQuestion" hidden>Próxima pergunta →</button>';
 examLocked=false;box.querySelectorAll('[data-answer]').forEach(b=>b.addEventListener('click',()=>{
  if(examLocked)return;examLocked=true;const answer=question.options[Number(b.dataset.answer)],right=answer===question.correct;if(right)score++;
  box.querySelectorAll('[data-answer]').forEach(el=>{el.disabled=true;el.setAttribute('aria-pressed',String(el===b))});
  $('testFeedback').textContent=right?'Correto.':'Resposta correta: '+question.correct;
  $('advanceQuestion').hidden=false;$('advanceQuestion').textContent=examAt===exam.length-1?'Ver resultado →':'Próxima pergunta →';
 }));
 $('advanceQuestion').addEventListener('click',()=>{examAt++;renderExam()})
}
function startTest(){if(!current)return;exam=quizQuestions();examAt=0;score=0;if(exam.length<5){$('testCard').innerHTML='<p>Questões insuficientes nesta unidade.</p>';return}renderExam()}
function registerEvents(){
 $('studyStage').addEventListener('change',()=>{const n=Number($('studyStage').value),record=readJourney().last||{};loadStage(n,Number(legacyState().unitsByStage?.[n]||1),'aprender',true)});
 $('studyUnit').addEventListener('change',()=>selectUnit(Number($('studyUnit').value)));
 $('unitIndex').addEventListener('click',e=>{const b=e.target.closest('button[data-unit]');if(b)selectUnit(Number(b.dataset.unit))});
 document.querySelectorAll('.study-tabs [data-mode]').forEach(tab=>{
  tab.addEventListener('click',()=>setMode(tab.dataset.mode,{historyMode:true}));
  tab.addEventListener('keydown',e=>{if(!['ArrowRight','ArrowLeft','Home','End'].includes(e.key))return;e.preventDefault();let i=modes.indexOf(mode);if(e.key==='ArrowRight')i=(i+1)%4;if(e.key==='ArrowLeft')i=(i+3)%4;if(e.key==='Home')i=0;if(e.key==='End')i=3;setMode(modes[i],{historyMode:true,focus:true})})
 });
 $('learnCharacters').addEventListener('click',e=>{const btn=e.target.closest('[data-say]');if(btn)speak(btn.dataset.say)});
 $('finishLearn').addEventListener('click',()=>{if(!current)return;updateProgress({learned:true,readAt:Date.now()});setMode('escrever',{historyMode:true})});
 $('writeCharacter').addEventListener('change',()=>{writerChar=$('writeCharacter').value;paintWriter()});
 $('animateCharacter').addEventListener('click',()=>runWriting('animate'));
 $('quizWriting').addEventListener('click',()=>runWriting('quiz'));
 $('speakWrite').addEventListener('click',()=>speak(writerChar));
 $('skipToReview').addEventListener('click',()=>setMode('revisar',{historyMode:true}));
 $('startReview').addEventListener('click',beginReview);
 $('reviewToTest').addEventListener('click',()=>setMode('avaliar',{historyMode:true}));
 $('startTest').addEventListener('click',startTest);
 $('prevUnit').addEventListener('click',()=>relativeUnit(-1));
 $('nextUnit').addEventListener('click',()=>relativeUnit(1));
 $('retryLoad').addEventListener('click',()=>loadStage(Number($('studyStage').value),unit,mode));
 addEventListener('popstate',()=>{const p=new URLSearchParams(location.search);const n=bounds(p.get('etapa'),1,9),u=bounds(p.get('unidade'),1,unitLimits[n-1]),m=modes.includes(p.get('modo'))?p.get('modo'):'aprender';if(current&&n===stage){unit=u;paintUnit();setMode(m)}else loadStage(n,u,m)});
}
registerEvents();loadStage(initialStage,initialUnit,initialMode);
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost')){
 window.addEventListener('load',()=>{
  const run=()=>navigator.serviceWorker.register('./sw.js?v=7.0.1',{updateViaCache:'none'}).catch(e=>console.warn('Cache offline indisponível',e));
  if('requestIdleCallback' in window)requestIdleCallback(run,{timeout:2500});else setTimeout(run,0)
 },{once:true})
}
})();