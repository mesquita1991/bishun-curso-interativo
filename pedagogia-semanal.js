/* Bǐshùn — seis fases com evidências distintas. Mantém o acervo e a memória antiga. */
(function(){
'use strict';
const PHASES=[
 ['explain','1. Explicação'],['examples','2. Exemplo compreensível'],
 ['practice','3. Prática ativa'],['correction','4. Correção'],
 ['review','5. Revisão posterior'],['retention','6. Avaliação de retenção']
];
let context=null, activeWeek=0, currentPhase='explain', quiz=null, loadPromise=null, loadToken=0, didactics=null;
const el=(tag,text,cls)=>{const x=document.createElement(tag);if(text!=null)x.textContent=String(text);if(cls)x.className=cls;return x};
const add=(parent,tag,text,cls)=>{const x=el(tag,text,cls);parent.appendChild(x);return x};
const clear=x=>x.replaceChildren();
const btn=(parent,text,fn,cls='button secondary')=>{const b=add(parent,'button',text,cls);b.type='button';b.onclick=fn;return b};
const day=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
const plus=(date,n)=>{const [y,m,d]=date.split('-').map(Number),x=new Date(y,m-1,d);x.setDate(x.getDate()+n);return [x.getFullYear(),String(x.getMonth()+1).padStart(2,'0'),String(x.getDate()).padStart(2,'0')].join('-')};
const maxDate=(...dates)=>dates.filter(Boolean).sort().at(-1);
function record(){
 context.progress.learning??={};
 context.progress.learning[context.week.week]??={};
 return context.progress.learning[context.week.week];
}
function persist(){context.save();context.onProgress();}
function status(r,key){return !!r[key]?.passed}
function unlocked(r,key){
 return key==='explain'||key==='examples'&&!!r.explainedAt||key==='practice'&&status(r,'examples')
 ||key==='correction'&&status(r,'practice')||key==='review'&&status(r,'correction')
 ||key==='retention'&&status(r,'review1')&&status(r,'review2');
}
function done(r,key){
 return key==='explain'?!!r.explainedAt:key==='review'?status(r,'review1')&&status(r,'review2'):status(r,key);
}
function wordItems(){
 return [...new Map(context.week.words.map(k=>[k,context.wordMap.get(k)]).filter(([k,v])=>v&&typeof v.meaning==='string'&&v.meaning.trim())).values()].map(v=>({hanzi:v.hanzi,pinyin:v.pinyin,meaning:v.meaning}));
}
function choose(items,count){
 const out=items.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]]}
 return out.slice(0,count);
}
function fmtDate(s){return s?s.split('-').reverse().join('/'):'—'}
function navigate(key){currentPhase=key;quiz=null;paint()}
function phaseBar(root,r){
 const nav=add(root,'div',null,'phase-bar');
 for(const [key,name] of PHASES){
  const enabled=unlocked(r,key),b=btn(nav,(done(r,key)?'✓ ':'')+name,()=>navigate(key),'phase-button');
  b.disabled=!enabled;b.setAttribute('aria-pressed',String(currentPhase===key));b.title=enabled?'Abrir esta fase':'Conclua a fase anterior primeiro';
 }
}
function info(root,text){add(root,'p',text,'muted')}
function header(root,r){
 add(root,'p','SEMANA '+context.week.week+' · DIAS '+context.week.days.join('–'),'kicker');
 add(root,'h2',context.week.title);
 add(root,'p',context.week.goal);
 const doneCount=PHASES.filter(([key])=>done(r,key)).length;
 info(root,doneCount+' de 6 fases verificadas · A aprovação de retenção só pode ocorrer em dias posteriores.');
 phaseBar(root,r);
}
function detailCatalog(parent,title,terms,map,key){
 const section=add(parent,'details',null,'didactic-detail');add(section,'summary',title+' ('+terms.length+')');
 const list=add(section,'div',null,'study-list');
 for(const term of terms){
  const value=map.get(term),a=add(list,'article',null,'entry');
  add(a,'strong',term);if(value?.pinyin)add(a,'small',value.pinyin);
  add(a,'p',value?.meaning||value?.pattern||value?.explanation||'Consulte o inventário original.');
  if(key==='word'||key==='char')btn(a,'Ouvir',()=>context.speak(term),'button muted-button');
 }
}
function explain(root,r,lesson){
 add(root,'h3',lesson.concept);
 add(root,'p',lesson.explanation);
 const note=add(root,'div',null,'teaching-note');add(note,'strong','Atenção ao erro frequente');add(note,'p',lesson.pitfall);
 const guide=add(root,'div',null,'teaching-note');
 add(guide,'h4','Gramática do currículo desta semana');
 for(const number of context.week.grammar){
  const entry=context.ruleMap.get(Number(number));
  if(!entry)continue;
  const d=add(guide,'details');add(d,'summary',(entry.title||'Estrutura')+' · #'+number);
  add(d,'p',entry.pattern||entry.explanation||'Use as frases da semana para contextualizar a estrutura.');
  for(const sample of (entry.examples||[]).slice(0,2)){
   add(d,'p',[sample.zh,sample.pinyin,sample.pt].filter(Boolean).join(' · '));
  }
 }
 detailCatalog(root,'Consultar vocabulário',context.week.words,context.wordMap,'word');
 detailCatalog(root,'Consultar caracteres',context.week.characters,context.charMap,'char');
 const foot=add(root,'div',null,'lesson-actions');
 if(r.explainedAt)info(foot,'Leitura registrada em '+fmtDate(r.explainedAt)+'.');
 btn(foot,r.explainedAt?'Reabrir os exemplos →':'Li a explicação; ir aos exemplos →',()=>{
  if(!r.explainedAt){r.explainedAt=day();persist()}navigate('examples');
 },'button');
}
function examples(root,r,lesson){
 add(root,'h3','Entenda as três frases antes de memorizar');
 info(root,'Leia chinês, pinyin e tradução. Escute e explique cada frase com suas palavras.');
 const models=add(root,'div',null,'example-cards');
 for(const x of lesson.examples){
  const card=add(models,'article',null,'example-card');
  const hanzi=add(card,'strong',x.zh,'hanzi');hanzi.lang='zh-Hans';
  add(card,'div',x.pinyin,'small-note');
  add(card,'p',x.pt);
  btn(card,'Ouvir (voz sintética)',()=>context.speak(x.zh),'button muted-button');
 }
 add(root,'h4','Conferência de compreensão');
 info(root,'Aponte a frase chinesa correspondente ao significado apresentado. Critério: 3 de 3 em uma tentativa.');
 if(r.examples?.passed)info(root,'Compreensão de modelos verificada em '+fmtDate(r.examples.date)+'.');
 const host=add(root,'div',null,'quiz-host');
 btn(root,r.examples?.passed?'Refazer compreensão':'Verificar compreensão (3 questões)',()=>begin('examples',lesson.examples,host),'button');
}
function trackedTasks(root,r){
 add(root,'h4','Transferência para situações reais (autorregistro)');
 info(root,'Essas tarefas desenvolvem produção, mas a caixa marcada não é uma prova objetiva de fala.');
 const list=add(root,'ul',null,'task-list');
 context.week.tasks.forEach((task,i)=>{
  const li=add(list,'li'),label=add(li,'label'),input=add(label,'input');input.type='checkbox';
  input.checked=!!context.progress.tasks?.[context.week.week]?.[i];
  input.onchange=()=>{context.progress.tasks??={};context.progress.tasks[context.week.week]??={};context.progress.tasks[context.week.week][i]=input.checked;persist()};
  add(label,'span',task);
 });
 const title=add(root,'label','Notas e erros observados','note-label');title.htmlFor='weekNotes';
 const input=add(root,'textarea',null,'note-input');input.id='weekNotes';input.value=context.progress.notes?.[context.week.week]||'';
 input.placeholder='Escreva suas frases, dúvidas e correções pessoais.';
 input.oninput=()=>{context.progress.notes??={};context.progress.notes[context.week.week]=input.value;context.save()};
}
function practice(root,r){
 add(root,'h3','Recupere o significado sem consultar');
 info(root,'Cinco itens sorteados do vocabulário da semana. Escreva primeiro o significado de memória; só depois veja as alternativas. São necessários ao menos 4 acertos.');
 if(r.practice){
  info(root,'Última prática aprovada: '+r.practice.score+'/'+r.practice.total+' · '+fmtDate(r.practice.date)+'. Erros pendentes: '+r.practice.misses.length+'.');
 }
 const host=add(root,'div',null,'quiz-host');
 btn(root,'Iniciar prática (5 questões)',()=>begin('practice',wordItems(),host),'button');
 trackedTasks(root,r);
}
function correction(root,r){
 add(root,'h3','Corrigir os erros, não apenas ver o gabarito');
 const misses=r.practice?.misses||[];
 if(misses.length){
  info(root,'Itens errados no teste que aprovou a prática:');
  const list=add(root,'div',null,'study-list');
  for(const key of misses){
   const item=context.wordMap.get(key);const cell=add(list,'article',null,'entry');
   add(cell,'strong',key);add(cell,'small',item?.pinyin||'');add(cell,'p',item?.meaning||'Significado não localizado.');
  }
  info(root,'Reveja as respostas e acerte todos os itens incorretos numa nova tentativa.');
  const host=add(root,'div',null,'quiz-host');
  btn(root,'Tentar novamente os itens errados',()=>begin('correction',wordItems().filter(x=>misses.includes(x.hanzi)),host),'button');
 }else{
  info(root,'Você acertou todos os itens da prática. Confira o que aprendeu antes de continuar.');
  btn(root,'Conferi o gabarito; registrar correção',()=>{
   r.correction={passed:true,date:day(),score:0,total:0};persist();navigate('review');
  },'button');
 }
 if(r.correction?.passed)info(root,'Correção registrada em '+fmtDate(r.correction.date)+'.');
 if(r.correction?.passed)btn(root,'Ir às revisões →',()=>navigate('review'),'button secondary');
}
function reviewDue(r,key){
 const anchor=r.correction.date;
 const due=key==='review1'?plus(anchor,1):maxDate(plus(anchor,3),r.review1?.date?plus(r.review1.date,1):null);
 return maxDate(due,r[key]?.failedDate?plus(r[key].failedDate,1):null);
}
function review(root,r){
 add(root,'h3','Revisar em dias diferentes');
 info(root,'D+1 e D+3 são intervalos mínimos contados da correção. Se uma revisão ocorrer tarde, a seguinte só poderá contar a partir do dia seguinte.');
 for(const [key,label] of [['review1','Revisão 1 (D+1)'],['review2','Revisão 2 (D+3)']]){
  const panel=add(root,'article',null,'review-panel'),passed=status(r,key);
  add(panel,'h4',label);
  if(passed)info(panel,'Aprovada: '+r[key].score+'/'+r[key].total+' em '+fmtDate(r[key].date)+'.');
  else {
   const permitted=key==='review1'||status(r,'review1');
   const due=permitted?reviewDue(r,key):null;
   info(panel,permitted?'Disponível a partir de '+fmtDate(due)+'.':'Faça primeiro a revisão 1.');
   const b=btn(panel,'Verificar lembrança (5 itens)',()=>{currentPhase='review';begin(key,wordItems(),panel)},'button');
   b.disabled=!permitted||day()<due;
  }
 }
 if(status(r,'review1')&&status(r,'review2'))btn(root,'Abrir avaliação de retenção →',()=>navigate('retention'),'button');
}
function retentionDue(r){
 return maxDate(plus(r.correction.date,7),r.review2?.date?plus(r.review2.date,1):null,r.retention?.failedDate?plus(r.retention.failedDate,1):null);
}
function retention(root,r){
 add(root,'h3','Avaliação diferida de reconhecimento');
 info(root,'Cinco itens recuperados pelo menos 7 dias depois da correção, após duas revisões em dias separados. Critério de reconhecimento: 4/5.');
 if(status(r,'retention')){
  add(root,'p','Retenção de significados verificada em '+fmtDate(r.retention.date)+' ('+r.retention.score+'/'+r.retention.total+').','success-text');
  info(root,'Esse resultado NÃO certifica fluência, escrita independente, compreensão auditiva ou conversação.');
  return;
 }
 const due=retentionDue(r);
 info(root,'Primeira data elegível: '+fmtDate(due)+'.');
 const host=add(root,'div',null,'quiz-host');
 const start=btn(root,'Fazer teste diferido (5 questões)',()=>begin('retention',wordItems(),host),'button');
 start.disabled=day()<due;
}
function nextStep(r){
 for(const [key] of PHASES)if(unlocked(r,key)&&!done(r,key))return key;
 return 'retention';
}
function paint(){
 if(!context||!didactics)return;
 const root=context.root;clear(root);const r=record(),lesson=didactics.weeks[context.week.week-1];
 if(!lesson||lesson.week!==context.week.week){add(root,'p','Falta a explicação desta semana.');return}
 header(root,r);
 if(currentPhase!=='explain'&&!unlocked(r,currentPhase)){currentPhase=nextStep(r);quiz=null}
 const content=add(root,'section',null,'phase-content');
 if(currentPhase==='explain')explain(content,r,lesson);
 else if(currentPhase==='examples')examples(content,r,lesson);
 else if(currentPhase==='practice')practice(content,r);
 else if(currentPhase==='correction')correction(content,r);
 else if(currentPhase==='review')review(content,r);
 else retention(content,r);
 const actions=add(root,'div',null,'lesson-actions');
 btn(actions,'← Semana anterior',()=>context.selectWeek(Math.max(1,context.week.week-1))).disabled=context.week.week===1;
 btn(actions,'Próxima semana →',()=>context.selectWeek(Math.min(13,context.week.week+1)));
 info(root,'As respostas objetivas são verificadas pelo aplicativo; fala e escrita livre exigem avaliação externa. Datas usam o calendário deste dispositivo.');
}
function questions(type,items){
 if(type==='examples')return items.map(x=>({target:x.zh,meaning:x.pt,pinyin:x.pinyin}));
 return choose(items,Math.min(5,items.length)).map(x=>({target:x.hanzi,meaning:x.meaning,pinyin:x.pinyin}));
}
function distractors(q,type){
 const candidates=type==='examples'?didactics.weeks[context.week.week-1].examples.map(x=>x.zh):wordItems().map(x=>x.meaning);
 const correct=type==='examples'?q.target:q.meaning;
 let extras=[...new Set(candidates.filter(v=>v!==correct))];
 if(type!=='examples'&&extras.length<3)extras=extras.concat([...context.wordMap.values()].map(x=>x.meaning).filter(v=>typeof v==='string'&&v!==correct));
 return choose([correct,...choose([...new Set(extras)].filter(v=>v!==correct),type==='examples'?2:3)],type==='examples'?3:4);
}
function begin(type,items,host){
 if(!items.length){add(host,'p','Não existem itens suficientes para testar.');return}
 quiz={type,questions:questions(type,items),index:0,score:0,misses:[],answered:false};
 drawQuiz(host);
}
function drawQuiz(host){
 clear(host);
 if(!quiz)return;
 const q=quiz.questions[quiz.index];
 if(!q){finish(host);return}
 const card=add(host,'div',null,'quiz-card');
 add(card,'h4','Questão '+(quiz.index+1)+' de '+quiz.questions.length);
 let answerArea=add(card,'div',null,'choices');
 if(quiz.type==='examples'){
  add(card,'p','Qual frase chinesa corresponde a: '+q.meaning);
 }else{
  add(card,'p',q.target,'hanzi');
  info(card,'Antes das opções, escreva o significado que você recorda sem olhar o vocabulário.');
  const input=add(card,'input');input.type='text';input.placeholder='Sua lembrança, sem consultar';input.setAttribute('aria-label','Significado lembrado');
  input.className='recall-input';
  const reveal=btn(card,'Conferir alternativas',()=>{if(!input.value.trim()){hint.textContent='Escreva sua tentativa antes de continuar.';return}reveal.disabled=true;answerArea.hidden=false;hint.textContent='Selecione o significado para receber correção objetiva.'},'button secondary');
  const hint=add(card,'p',null,'muted');
  answerArea.hidden=true;
 }
 const feedback=add(card,'p',null,'quiz-feedback');feedback.setAttribute('role','status');
 const next=btn(card,'Próxima questão →',()=>{quiz.index++;quiz.answered=false;drawQuiz(host)},'button');next.disabled=true;
 const correct=quiz.type==='examples'?q.target:q.meaning;
 for(const text of distractors(q,quiz.type)){
  btn(answerArea,text,()=>{
   if(quiz.answered)return;
   quiz.answered=true;
   if(text===correct){quiz.score++;feedback.textContent='Correto.'}
   else{quiz.misses.push(q.target);feedback.textContent='Correção: '+q.target+' · '+q.pinyin+' · '+q.meaning}
   for(const button of answerArea.querySelectorAll('button')){button.disabled=true;if(button.textContent===correct)button.classList.add('correct');if(button.textContent===text&&text!==correct)button.classList.add('wrong')}
   next.disabled=false;
  },'choice');
 }
}
function finish(host){
 if(!quiz)return;
 const session=quiz;quiz=null;
 const r=record(),total=session.questions.length,score=session.score,today=day();
 const need=session.type==='examples'||session.type==='correction'?total:Math.ceil(total*.8);
 const passed=score>=need;
 const outcome=add(host,'article',null,'quiz-card');
 add(outcome,'h3','Resultado: '+score+'/'+total);
 if(passed){
  r[session.type]={passed:true,score,total,date:today,misses:session.misses.slice()};
  if(session.type==='practice'){delete r.correction;delete r.review1;delete r.review2;delete r.retention}
  if(session.type==='correction'){delete r.review1;delete r.review2;delete r.retention}
  persist();
  add(outcome,'p',session.type==='retention'?'Teste diferido aprovado. Apenas reconhecimento foi avaliado.':'Critério alcançado.','success-text');
  const next=session.type==='examples'?'practice':session.type==='practice'?'correction':session.type==='correction'?'review':session.type==='review1'||session.type==='review2'?'review':'retention';
  btn(outcome,'Continuar →',()=>navigate(next),'button');
 }else{
  if(['review1','review2','retention'].includes(session.type)){r[session.type]={passed:false,score,total,failedDate:today};persist()}
  add(outcome,'p',session.type==='examples'?'Releia os exemplos e tente novamente.':session.type==='practice'?'Revise as correções e repita a prática.':'Não atingiu o critério. Reforce os itens errados antes de repetir.');
  if(session.misses.length)add(outcome,'p','Revisar: '+session.misses.join(' · '));
  if(['review1','review2','retention'].includes(session.type))
   info(outcome,'Uma nova tentativa válida somente a partir do próximo dia de calendário.');
  else btn(outcome,'Revisar a fase →',()=>paint(),'button secondary');
 }
}
async function render(c){
 context=c;
 if(activeWeek!==c.week.week){activeWeek=c.week.week;currentPhase='explain';quiz=null}
 const t=++loadToken;clear(c.root);add(c.root,'p','Preparando sequência didática…','muted');
 try{
  loadPromise??=fetch('didatica-12-semanas.json').then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()}).catch(e=>{loadPromise=null;throw e});
  didactics=await loadPromise;
  if(t!==loadToken)return;
  const r=record();if(r.explainedAt)currentPhase=nextStep(r);
  paint();
 }catch(e){if(t===loadToken)add(c.root,'p','Não foi possível carregar a didática: '+e.message)}
}
window.BishunWeekly={render};
})();
