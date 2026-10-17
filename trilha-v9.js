/* Bǐshùn 9 — percurso comunicativo, baseado exclusivamente no acervo existente. */
(()=>{'use strict';
const $=id=>document.getElementById(id),KEY='bishunTrilhaV90',STEP=['conhecer','usar','escrever','conferir'];
const DAY=86400000,learning=window.BishunLearning,escape=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
if(!learning)throw Error('Motor de estudo indisponível');
let lessons=[],index=0,phase=0,pairIndex=0,quiz=null,writer=null,writerPromise=null,writingChar='',writingSerial=0,catalog=null,catalogPromise=null;
const part=id=>document.getElementById(id),shuffle=arr=>{const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
function read(){try{const v=JSON.parse(localStorage.getItem(KEY)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}catch{return{}}}
function persist(s){try{localStorage.setItem(KEY,JSON.stringify(s))}catch(e){console.warn('Progresso não pôde ser salvo neste navegador',e)}}
function record(at=index){const s=read();return s.lessons?.[String(at+1)]||{}}
function update(patch){const s=read(),unit=String(index+1),old=s.lessons?.[unit]||{};s.lessons={...(s.lessons||{}),[unit]:{...old,...patch,updatedAt:Date.now()}};s.lastLesson=index+1;persist(s);renderOverview();return s.lessons[unit]}
const donePairs=r=>Array.isArray(r.pairDone)?r.pairDone:[];
const pairCount=()=>Math.ceil(lessons[index].characters.length/2);
const completed=r=>Boolean(r.initialPassedAt);
const due=r=>completed(r)&&learning.retentionStatus(r).phase==='due';
function recommend(){const records=read().lessons||{};for(let i=0;i<lessons.length;i++)if(due(records[String(i+1)]||{}))return i;
const last=Number(read().lastLesson)-1;if(last>=0&&last<lessons.length&&!completed(records[String(last+1)]||{}))return last;
return Math.max(0,lessons.findIndex((_,i)=>!completed(records[String(i+1)]||{})))}
function announce(msg){$('pathLive').textContent=msg}
function speech(char){if(!('speechSynthesis'in window)){announce('A pronúncia por áudio não está disponível neste aparelho. Use o guia de pronúncia.');return}
try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(char);u.lang='zh-CN';u.rate=.78;u.voice=speechSynthesis.getVoices().find(v=>v.lang.toLowerCase().startsWith('zh'))||null;speechSynthesis.speak(u)}catch{announce('O áudio não está disponível agora.')}}
function link(url,text){return '<a href="'+escape(url)+'">'+escape(text)+'</a>'}
function phaseAvailable(p,r){if(p===0)return true;if(p===1)return donePairs(r).length>=pairCount();if(p===2)return r.wordsPassed===true;if(p===3)return r.wordsPassed===true;return false}
function nextPhase(r){if(completed(r)||due(r))return 3;if(!phaseAvailable(1,r))return 0;if(!phaseAvailable(2,r))return 1;if(writingCount(r)>=3)return 3;return 2}
function statusText(r){const status=learning.retentionStatus(r);
switch(status.phase){case'due':return 'Hora de conferir o que ainda lembra. Faça a avaliação sem consultar as respostas.';
case'observed':return 'Você confirmou o reconhecimento em outro dia. A próxima revisão já está agendada.';
case'consolidated':return 'Você acertou os significados em duas revisões espaçadas. Continue praticando.';
case'scheduled':return 'Revisão dos significados prevista para '+new Date(status.dueAt).toLocaleDateString('pt-BR')+'.';
default:return completed(r)?'Você concluiu a primeira avaliação. Volte em outro dia para testar sua memória.':'Comece pelo reconhecimento; sua revisão será organizada após a primeira avaliação.'}}
function setLocation(push=false){const u=new URL(location.href);u.searchParams.set('licao',String(index+1));u.searchParams.set('passo',STEP[phase]);if(u.href===location.href)return;history[push?'pushState':'replaceState'](null,'',u)}
function renderOverview(){if(!lessons.length)return;const unit=lessons[index],r=record(),group=lessons.filter(l=>l.sourceStage===unit.sourceStage),start=lessons.findIndex(l=>l.sourceStage===unit.sourceStage);
const complete=group.filter(l=>completed(record(l.id-1))).length;
const countDue=lessons.filter((_,i)=>due(record(i))).length;
$('pathTitle').textContent=unit.name;$('pathGoal').textContent=unit.goal;
$('pathPosition').textContent=(unit.sourceStage===1?'Fundamentos':'Etapa '+unit.sourceStage)+' · Lição '+(index-start+1)+' de '+group.length;
$('pathSummary').textContent=complete+' de '+group.length+' lições praticadas'+(countDue?' · '+countDue+' para revisar':'');
$('pathProgressFill').style.width=(100*complete/group.length)+'%';
$('pathLessonNumber').textContent='Lição '+(index+1)+' de '+lessons.length;
$('pathRetention').textContent=statusText(r);
$('pathNextHint').textContent=due(r)?'Sua revisão já pode ser feita.':'Faça a atividade atual e avance quando estiver pronto.';
document.querySelectorAll('#pathSteps li').forEach((e,i)=>{const finished=i===0?phaseAvailable(1,r):i===1?phaseAvailable(2,r):i===2?Object.values(r.writingResults||{}).filter(x=>x.passed).length>=3:i===3?completed(r):false;
e.classList.toggle('done',finished);e.classList.toggle('current',i===phase);e.querySelector('span').textContent=finished?'✓':String(i+1)});
$('pathLessonSelect').value=String(index+1);
$('pathPrevious').disabled=index===0;
$('pathPreviousStep').disabled=phase===0;
$('pathNextLesson').disabled=index>=lessons.length-1;
}
function setLesson(i,requested,push=true){index=Math.max(0,Math.min(lessons.length-1,Number(i)||0));const r=record();
phase=STEP.indexOf(requested);if(phase<0||!phaseAvailable(phase,r))phase=nextPhase(r);
if(due(r)&&!requested)phase=3;
pairIndex=0;quiz=null;writer=null;writingSerial++;
update({openedAt:Date.now()});render();
$('pathHelp').open=false;
setLocation(push);
if(push)document.querySelector('.path-work')?.scrollIntoView({behavior:'auto',block:'start'});
}
function setPhase(step){const r=record();if(!phaseAvailable(step,r)){announce('Conclua primeiro a atividade anterior.');return}
if(phase===step)return;phase=step;quiz=null;writingSerial++;writer=null;render();setLocation(true);document.querySelector('.path-work')?.scrollIntoView({behavior:'auto',block:'start'});}
function render(){const r=record();renderOverview();$('pathStepLabel').textContent=({conhecer:'Conhecer',usar:'Usar',escrever:'Escrever',conferir:'Conferir'})[STEP[phase]];
const data={
conhecer:['Conheça dois caracteres','Observe a escrita, ouça a pronúncia e descubra os significados. Depois, tente lembrar sem olhar.'],
usar:['Encontre as palavras','Leia as palavras e descubra como os caracteres aparecem juntos. Depois, pratique o reconhecimento.'],
escrever:['Agora é sua vez de escrever','Observe a ordem dos traços e tente escrever. Três caracteres feitos com precisão concluem esta prática.'],
conferir:['O que você consegue lembrar?','Responda sem consultar. Oito acertos em dez indicam bom reconhecimento inicial dos significados.']
}[STEP[phase]];
$('pathActivityTitle').textContent=data[0];$('pathActivityDescription').textContent=data[1];
if(phase===0)renderPairs();else if(phase===1)renderWords();else if(phase===2)renderWriting();else renderExam();
}
function optionsFor(item,items){const chosen=[item.meaning],seen=new Set(chosen.map(s=>s.trim().toLowerCase()));for(const other of shuffle(items)){const meaning=String(other.meaning);const key=meaning.trim().toLowerCase();if(key&&!seen.has(key)){seen.add(key);chosen.push(meaning)}if(chosen.length===4)break}
return shuffle(chosen)}
function renderPairs(){const unit=lessons[index],r=record(),pairs=pairCount(),done=new Set(donePairs(r));
if(done.size>=pairs){$('pathActivity').innerHTML='<div class="path-result"><strong>Você reconheceu os pares desta lição.</strong><p>Agora veja como esses caracteres aparecem nas palavras.</p></div>';$('pathActions').innerHTML='<button class="path-button" data-action="phase" data-phase="1">Continuar para as palavras →</button>';return}
while(done.has(pairIndex)&&pairIndex<pairs-1)pairIndex++;const pair=unit.characters.slice(pairIndex*2,pairIndex*2+2);
$('pathActivity').innerHTML='<p class="path-eyebrow">Par '+(pairIndex+1)+' de '+pairs+'</p><div class="path-card-grid">'+pair.map(c=>'<article class="path-char"><strong class="path-hanzi" lang="zh-Hans">'+escape(c.char)+'</strong><span class="path-pinyin">'+escape(c.pinyin)+'</span><span class="path-meaning">'+escape(c.meaning)+'</span><button class="path-listen" data-speak="'+escape(c.char)+'" aria-label="Ouvir '+escape(c.char)+'">Ouvir ↗</button></article>').join('')+'</div>';
$('pathActions').innerHTML='<button class="path-button" data-action="start-pair">Tentar lembrar este par →</button>';
}
function startPair(){const unit=lessons[index],pair=unit.characters.slice(pairIndex*2,pairIndex*2+2);quiz={kind:'pair',items:pair,at:0,score:0,wrong:[],answered:false};renderQuestion()}
function renderQuestion(){if(!quiz)return;const q=quiz.items[quiz.at],choices=optionsFor(q,quiz.kind==='words'?lessons[index].words:lessons[index].characters);
const prompt=quiz.kind==='words'?'Qual é o significado desta palavra?':'O que significa este caractere?';
$('pathActivity').innerHTML='<div class="path-question"><p>Questão '+(quiz.at+1)+' de '+quiz.items.length+'</p><h3>'+prompt+'</h3><strong class="path-hanzi" lang="zh-Hans">'+escape(q.char||q.hanzi)+'</strong><div class="path-options">'+choices.map((v,i)=>'<button type="button" data-choice="'+i+'">'+escape(v)+'</button>').join('')+'</div><p id="pathFeedback" class="path-feedback" role="status"></p></div>';quiz.choices=choices;quiz.answered=false;$('pathActions').replaceChildren();
}
function answer(choice){if(!quiz||quiz.answered)return;const q=quiz.items[quiz.at],correct=q.meaning===quiz.choices[choice];quiz.answered=true;if(correct)quiz.score++;else quiz.wrong.push(q.char||q.hanzi);
document.querySelectorAll('#pathActivity [data-choice]').forEach(button=>{button.disabled=true;button.setAttribute('aria-pressed',String(Number(button.dataset.choice)===choice))});
$('pathFeedback').textContent=correct?'Isso mesmo.':('A resposta é: '+q.meaning+'.');
$('pathActions').innerHTML='<button class="path-button" data-action="next-question">'+(quiz.at===quiz.items.length-1?'Ver resultado':'Próxima pergunta')+' →</button>'}
function nextQuestion(){if(!quiz)return;if(++quiz.at<quiz.items.length){renderQuestion();return}finishQuiz()}
function finishQuiz(){const q=quiz,r=record(),unit=lessons[index];quiz=null;const total=q.items.length,ok=q.score>=Math.ceil(.8*total),errors=q.wrong.join(' · ');
if(q.kind==='pair'){const success=q.score===total,done=new Set(donePairs(r));if(success)done.add(pairIndex);update({pairDone:[...done].sort((a,b)=>a-b)});$('pathActivity').innerHTML='<div class="path-result'+(success?'':' needs-work')+'"><strong>'+q.score+' de '+total+' respostas corretas.</strong><p>'+(success?'Par reconhecido. Continue para o próximo.':'Reveja os significados e tente o par novamente.')+'</p></div>';
if(success&&done.size>=pairCount())$('pathActions').innerHTML='<button class="path-button" data-action="phase" data-phase="1">Continuar para as palavras →</button>';
else $('pathActions').innerHTML='<button class="path-button" data-action="'+(success?'next-pair':'retry-pair')+'">'+(success?'Próximo par':'Tentar novamente')+' →</button>';
return}
if(q.kind==='words'){if(ok)update({wordsPassed:true,wordsScore:q.score,wordsAt:Date.now()});$('pathActivity').innerHTML='<div class="path-result'+(ok?'':' needs-work')+'"><strong>'+q.score+' de '+total+' respostas corretas.</strong><p>'+(ok?'Você reconheceu as palavras. Agora, pratique a escrita.':'Retome as palavras que errou e tente novamente: '+errors)+'</p></div>';
$('pathActions').innerHTML='<button class="path-button" data-action="'+(ok?'phase':'retry-words')+'" '+(ok?'data-phase="2"':'')+'>'+(ok?'Continuar para a escrita':'Rever as palavras')+' →</button>';return}
if(q.kind==='exam'){const now=Date.now(),prev=record(),pass=learning.passed(q.score,total),evidence=learning.objective(prev,q.score,total,now),patch={lastExamScore:q.score,lastExamTotal:total,lastExamAt:now,lastErrors:q.wrong,objectiveChecks:evidence.objectiveChecks||prev.objectiveChecks||[],...evidence};
if(pass){patch.initialPassedAt=prev.initialPassedAt||now;patch.retentionDueAt=prev.retentionDueAt||now+DAY;}
update(patch);
try{const old=JSON.parse(localStorage.getItem('bishunFullV4')||'{}');old.records=old.records||{};old.records.char=old.records.char||{};for(const item of q.items){const positive=!q.wrong.includes(item.char);old.records.char[item.char]=learning.review(old.records.char[item.char],positive?2:0,now).record}localStorage.setItem('bishunFullV4',JSON.stringify(old))}catch{}
const state=learning.retentionStatus(record()),again=evidence.recorded;
$('pathActivity').innerHTML='<div class="path-result'+(pass?'':' needs-work')+'"><strong>'+q.score+' de '+total+' respostas corretas.</strong><p>'+(pass?(again?'Você reconheceu novamente os significados em outro dia.':'Você reconheceu os significados desta lição. Volte em outro dia para descobrir o que permanece na memória.'):'Reveja os caracteres: '+escape(errors)+'.')+'</p><small>Esta atividade verifica significados, não pronúncia ou conversação.</small></div>';
$('pathActions').innerHTML=pass?(index+1<lessons.length?'<button class="path-button" data-action="next-lesson">Continuar para a próxima lição →</button>':'<a class="path-button" href="mapa.html">Explorar as demais etapas →</a>'):'<button class="path-button" data-action="retry-exam">Praticar mais uma vez →</button>';
renderOverview();return}}
function renderWords(){const u=lessons[index],r=record();$('pathActivity').innerHTML='<ul class="path-words">'+u.words.map(w=>'<li><strong lang="zh-Hans">'+escape(w.hanzi)+'</strong><span><b>'+escape(w.pinyin)+'</b> · '+escape(w.meaning)+'</span><button class="path-listen" data-speak="'+escape(w.hanzi)+'">Ouvir</button></li>').join('')+'</ul>'+
u.sentences.map(s=>'<div class="path-example"><strong lang="zh-Hans">'+escape(s.zh)+'</strong><small>'+escape(s.pinyin)+'</small>'+escape(s.pt)+'</div>').join('');
$('pathActions').innerHTML='<button class="path-button" data-action="'+(r.wordsPassed?'phase':'start-words')+'" '+(r.wordsPassed?'data-phase="2"':'')+'>'+(r.wordsPassed?'Continuar para a escrita':'Ver se reconheço essas palavras')+' →</button>'}
function startWords(){quiz={kind:'words',items:shuffle(lessons[index].words).slice(0,4),at:0,score:0,wrong:[],answered:false};renderQuestion()}
function writingCount(r){const chars=new Set(lessons[index].characters.map(x=>x.char));return [...chars].filter(c=>r.writingResults?.[c]?.passed===true).length}
function renderWriting(){const u=lessons[index],r=record();if(!writingChar||!u.characters.some(c=>c.char===writingChar))writingChar=u.characters[0].char;
const c=u.characters.find(c=>c.char===writingChar);
$('pathActivity').innerHTML='<p class="path-result">'+writingCount(r)+' de 3 caracteres escritos com precisão.</p>'+
'<div class="path-writer"><div id="pathWritingFrame" class="path-writing-frame" aria-label="Área para escrever"><span class="path-hanzi" lang="zh-Hans">'+escape(c.char)+'</span></div><div><label for="pathWritingSelect">Caractere para praticar</label><select id="pathWritingSelect">'+u.characters.map(x=>'<option value="'+escape(x.char)+'" '+(x.char===writingChar?'selected':'')+'>'+escape(x.char)+' · '+escape(x.pinyin)+'</option>').join('')+'</select><p class="path-pinyin">'+escape(c.pinyin)+'</p><p class="path-writer-hint">'+escape(c.meaning)+'</p><p id="pathWritingFeedback" class="path-writer-hint" role="status">Primeiro observe os traços; depois tente escrever sem ajuda.</p><div class="path-writer-actions"><button class="path-button secondary" data-action="animate">Ver os traços</button><button class="path-button" data-action="write">Tentar escrever</button></div></div></div>';
$('pathActions').innerHTML=writingCount(r)>=3?'<button class="path-button" data-action="phase" data-phase="3">Conferir o que aprendi →</button>':'<button class="path-button secondary" data-action="phase" data-phase="3">Conferir agora e voltar à escrita depois →</button>';
}
function loadWriter(){if(window.HanziWriter)return Promise.resolve(window.HanziWriter);if(writerPromise)return writerPromise;
writerPromise=new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/hanzi-writer@3.7.3/dist/hanzi-writer.min.js';s.async=true;s.onload=()=>window.HanziWriter?res(window.HanziWriter):rej(Error('Motor de escrita indisponível'));s.onerror=()=>rej(Error('Motor de escrita não carregado'));document.head.append(s)}).catch(e=>{writerPromise=null;throw e});return writerPromise}
async function useWriter(type){const char=writingChar,serial=++writingSerial,feedback=$('pathWritingFeedback');feedback.textContent='Preparando a escrita…';try{const lib=await loadWriter();if(serial!==writingSerial||phase!==2||char!==writingChar)return;
const frame=$('pathWritingFrame');frame.replaceChildren();const size=Math.min(frame.clientWidth||275,275);writer=lib.create(frame,char,{width:size,height:size,padding:20,strokeColor:'#24588c',outlineColor:'#cbd9e6',showOutline:true,showCharacter:true});if(type==='animate'){writer.animateCharacter();feedback.textContent='Observe por onde começa cada traço.';return}
feedback.textContent='Escreva com o dedo ou com o mouse, na ordem indicada.';writer.quiz({showHintAfterMisses:2,onComplete:result=>{if(serial!==writingSerial||phase!==2||char!==writingChar)return;
const mistakes=Number(result.totalMistakes)||0;update(learning.writing(record(),char,mistakes));feedback.textContent=mistakes<=1?'Prática precisa registrada. Escolha outro caractere.':'Tente novamente com no máximo um erro para registrar a escrita.';renderWriting()}})}catch(e){feedback.textContent='Não foi possível abrir o exercício de escrita. Consulte a sequência de traços no manual e volte para praticar quando estiver disponível.';console.warn(e)}}
function renderExam(){const r=record(),status=learning.retentionStatus(r),isReview=due(r);const parts=lessons[index].characters.length;
$('pathActivity').innerHTML='<div class="path-question"><h3>'+(isReview?'É hora de rever o que lembra.':'Tente reconhecer '+parts+' caracteres.')+'</h3><p>'+(isReview?'A revisão está disponível. Faça as perguntas sem olhar as respostas.':'Escolha o significado correto de cada caractere. Se errar, poderá refazer.')+'</p></div>';
$('pathActions').innerHTML='<button class="path-button" data-action="start-exam">'+(isReview?'Começar revisão':'Responder às perguntas')+' →</button>';
if(r.initialPassedAt&&!isReview&&status.phase!=='due')$('pathActivity').innerHTML+='<p class="path-writer-hint">'+statusText(r)+'</p>'}
function startExam(){quiz={kind:'exam',items:shuffle(lessons[index].characters),at:0,score:0,wrong:[],answered:false};renderQuestion()}
async function showHelp(){const holder=$('pathHelpBody');holder.textContent='Procurando os exemplos desta lição…';
try{if(!catalogPromise)catalogPromise=fetch('manual-catalogo.json').then(r=>{if(!r.ok)throw Error('Dados indisponíveis');return r.json()});catalog=await catalogPromise;
const u=lessons[index],chars=u.characters.slice(0,5);holder.replaceChildren();
const title=document.createElement('p');title.textContent='Escolha uma referência e volte à atividade quando precisar.';holder.append(title);
for(const item of chars){const sect=document.createElement('div');sect.className='path-help-char';const name=document.createElement('strong');name.textContent=item.char+' · '+item.pinyin+' — '+item.meaning;sect.append(name);
const syllable=item.pinyin.split(/[ /]/)[0].normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();const atlas=catalog.atlas.find(x=>x.pinyin===syllable),stroke=catalog.characters.find(x=>x.hanzi===item.char);
if(atlas){const p=document.createElement('p');p.textContent=atlas.ptbr+' '+atlas.ajuste;sect.append(p);}
const links=document.createElement('p');
const refs=[stroke?['Ver a ordem dos traços','manual.html?pagina='+stroke.page+'&pos='+encodeURIComponent(stroke.y)]:['Consultar escrita','manual.html?secao=escrita&busca='+encodeURIComponent(item.char)],atlas?['Ouvir e comparar','manual.html?pagina='+atlas.page]:['Explorar sons','manual.html?secao=atlas&busca='+encodeURIComponent(syllable)],['Praticar na unidade original','estudar.html?etapa='+(item.sourceStage||1)+'&unidade='+item.sourceUnit]];
for(const [title,url] of refs){const a=document.createElement('a');a.href=url;a.textContent=title;links.append(a,' · ')}sect.append(links);holder.append(sect)}
}catch{holder.innerHTML='<p>Você também pode consultar o <a href="manual.html">manual de pronúncia e escrita</a>.</p>'}}
function process(action,el){if(!lessons.length)return;
if(action==='start-pair')startPair();else if(action==='retry-pair'){quiz=null;renderPairs()}else if(action==='next-pair'){pairIndex++;renderPairs()}
else if(action==='phase')setPhase(Number(el.dataset.phase));else if(action==='start-words')startWords();else if(action==='retry-words'){quiz=null;renderWords()}
else if(action==='start-exam'||action==='retry-exam')startExam();else if(action==='next-question')nextQuestion();
else if(action==='animate'||action==='write')useWriter(action);else if(action==='next-lesson')setLesson(index+1);}
function bind(){document.addEventListener('click',e=>{const answer=e.target.closest('[data-choice]');if(answer){answerQuestion(Number(answer.dataset.choice));return}
const speechButton=e.target.closest('[data-speak]');if(speechButton){speech(speechButton.dataset.speak);return}
const go=e.target.closest('[data-phase-go]');if(go){setPhase(Number(go.dataset.phaseGo));return}
const action=e.target.closest('[data-action]');if(action){process(action.dataset.action,action);return}});
$('pathActivity').addEventListener('change',e=>{if(e.target.id==='pathWritingSelect'){writingChar=e.target.value;writingSerial++;writer=null;renderWriting()}});
$('pathPreviousStep').addEventListener('click',()=>setPhase(Math.max(0,phase-1)));
$('pathPrevious').addEventListener('click',()=>setLesson(index-1));$('pathNextLesson').addEventListener('click',()=>setLesson(index+1));
$('pathLessonSelect').addEventListener('change',()=>setLesson(Number($('pathLessonSelect').value)-1));
$('pathHelp').addEventListener('toggle',()=>{if($('pathHelp').open)showHelp()});
$('pathRetry').addEventListener('click',load);
window.addEventListener('popstate',()=>{const p=new URLSearchParams(location.search),n=Number(p.get('licao'));setLesson(Number.isFinite(n)&&n>0?n-1:recommend(),p.get('passo'),false)})}
function answerQuestion(choice){answer(choice)}
async function load(){try{$('pathLoading').hidden=false;$('pathError').hidden=true;const r=await fetch('trilha-v9.json',{cache:'default'});if(!r.ok)throw Error('Não foi possível carregar as lições');const data=await r.json();if(data.version!==9||!Array.isArray(data.lessons)||!data.lessons.length)throw Error('Lições incompletas');
lessons=data.lessons;const select=$('pathLessonSelect');select.replaceChildren();
 for(const stage of [...new Set(lessons.map(l=>l.sourceStage))]){const group=document.createElement('optgroup');group.label=stage===1?'Fundamentos e primeiras conversas':'Etapa '+stage+' · ampliar repertório';
 for(const l of lessons.filter(x=>x.sourceStage===stage)){const option=document.createElement('option');option.value=l.id;option.textContent=String(l.id).padStart(3,'0')+' · '+l.name;group.append(option)}select.append(group)}
$('pathLoading').hidden=true;$('pathContent').hidden=false;const p=new URLSearchParams(location.search),n=Number(p.get('licao'));setLesson(n>=1&&n<=lessons.length?n-1:recommend(),p.get('passo'),false);}catch(e){console.warn(e);$('pathLoading').hidden=true;$('pathError').hidden=false}}
bind();load();
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost')){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js?v=9.0.0',{updateViaCache:'none'}).catch(()=>{}),{once:true})}
})();