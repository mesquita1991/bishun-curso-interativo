/* Bǐshùn: 12 semanas orientadas a comunicação, sem alterar os dados originais. */
(()=>{'use strict';
const $=id=>document.getElementById(id),cache=new Map();
const make=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined&&text!==null)n.textContent=String(text);if(className)n.className=className;return n};
const put=(parent,tag,text,cls)=>{const n=make(tag,text,cls);parent.append(n);return n};
const clear=node=>node.replaceChildren();
const strong=(parent,s)=>put(parent,'strong',s);
function get(path){
 if(!cache.has(path))cache.set(path,fetch(path).then(r=>{if(!r.ok)throw Error(path+' · HTTP '+r.status);return r.json()}).catch(e=>{cache.delete(path);throw e}));
 return cache.get(path);
}
const memoryKey='bishun-curso90-v1';
const fresh=()=>({week:1,tasks:{},notes:{},completed:{},quizzes:{},lastDay:0});
function loadProgress(){try{const d=JSON.parse(localStorage.getItem(memoryKey));if(!d||typeof d!=='object')return fresh();return {...fresh(),...d,tasks:d.tasks||{},notes:d.notes||{},completed:d.completed||{},quizzes:d.quizzes||{}}}catch{return fresh()}}
const progress=loadProgress();
function saveProgress(){try{localStorage.setItem(memoryKey,JSON.stringify(progress))}catch{}}
let plan,stages=[],wordMap=new Map(),charMap=new Map(),ruleMap=new Map(),all={vocabulary:[],characters:[],grammar:[]};
let selected={vocabulary:new Set(),characters:new Set(),grammar:new Set()};
let selectedWeek=Math.max(1,Math.min(13,Number(progress.week)||1)),tab='models',remainingPage=0,quiz=null;
const label=(p)=>'Etapa '+p.stage+' · unidade '+p.unit;
const courseEl=$('lesson');
function indexData(){
 const maps={vocabulary:wordMap,characters:charMap,grammar:ruleMap};
 for(const s of stages){
  const ids={vocabulary:new Map(),characters:new Map(),grammar:new Map()};
  for(const u of s.units){for(const id of u.words)if(!ids.vocabulary.has(id))ids.vocabulary.set(id,u.globalId);
   for(const id of u.characters)if(!ids.characters.has(id))ids.characters.set(id,u.globalId);
   for(const id of u.grammar)if(!ids.grammar.has(String(id)))ids.grammar.set(String(id),u.globalId);
  }
  const specs=[['vocabulary','hanzi','id'],['characters','char','id'],['grammar','no','no']];
  for(const [kind,name,id] of specs)for(const v of s[kind]){
    const k=kind==='grammar'?Number(v.no):v[name],it={...v,stage:s.stage,unit:ids[kind].get(String(v[id]))||ids[kind].get(v[id])||null};
    all[kind].push(it);
    if(!maps[kind].has(k))maps[kind].set(k,it);
  }
 }
 for(const w of plan.weeks){for(const k of w.words)selected.vocabulary.add(k);
  for(const k of w.characters)selected.characters.add(k);
  for(const k of w.grammar)selected.grammar.add(Number(k));
 }
}
function speak(zh){
 if(!('speechSynthesis'in window)||!('SpeechSynthesisUtterance'in window)){alert('O navegador não oferece síntese de voz. Use uma gravação de falante nativo para escuta.');return}
 try{
  window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(zh);u.lang='zh-CN';u.rate=.84;
  const voice=window.speechSynthesis.getVoices().find(x=>/^zh([-_]|$)/i.test(x.lang));if(voice)u.voice=voice;
  else {const p=$('speechHint');if(p)p.textContent='Voz chinesa não instalada: a síntese deste dispositivo pode pronunciar incorretamente.'}
  window.speechSynthesis.speak(u);
 }catch{const p=$('speechHint');if(p)p.textContent='Síntese de voz indisponível neste dispositivo.'}
}
function btn(parent,title,handler,cls='button secondary'){const b=put(parent,'button',title,cls);b.type='button';b.addEventListener('click',handler);return b}
function renderRail(){
 const el=$('weekList');clear(el);
 for(const w of plan.weeks){
  const b=put(el,'button',null,'week-choice'+(progress.completed[w.week]?' done':''));
  b.type='button';b.dataset.week=String(w.week);b.setAttribute('aria-current',w.week===selectedWeek?'step':'false');
  put(b,'span','Semana '+w.week+' · dias '+w.days.join('–'));
  b.append(document.createTextNode(w.title));
  b.onclick=()=>chooseWeek(w.week);
 }
 const fin=put(el,'button',null,'week-choice'+(progress.completed[13]?' done':''));
 fin.type='button';fin.dataset.week='13';fin.setAttribute('aria-current',selectedWeek===13?'step':'false');
 put(fin,'span','Dias 85–90');fin.append(document.createTextNode('Consolidação final'));fin.onclick=()=>chooseWeek(13);
 const done=Array.from({length:13},(_,i)=>!!progress.completed[i+1]).filter(Boolean).length;
 $('progressStatus').textContent=done+' de 13 blocos registrados como concluídos';
}
function chooseWeek(n){
 selectedWeek=n;progress.week=n;saveProgress();tab='models';quiz=null;renderRail();renderLesson();
 document.getElementById('curso').scrollIntoView({behavior:'auto',block:'start'});
}
function header(w){
 const head=put(courseEl,'div',null,'lesson-title'),content=put(head,'div');
 put(content,'p',w?('Semana '+w.week+' · dias '+w.days[0]+'–'+w.days[1]):'Dias 85–90','kicker');
 put(content,'h2',w?w.title:'Consolidação dos 90 dias');
 put(content,'p',w?w.goal:'Revisar escuta, leitura, produção, pronúncia e dificuldades recorrentes.');
 put(content,'p',w?('Seleção curricular · origem no manual, página '+w.manualPage):'Fechamento: seis tarefas do manual de 90 dias.','small-note');
 const status=put(head,'div',null,'');
 if(progress.completed[w?.week||13])put(status,'span','Concluído','pill');
}
function renderLesson(){
 clear(courseEl);
 if(!plan)return;
 if(selectedWeek===13)return renderClosing();
 const w=plan.weeks[selectedWeek-1];
 header(w);
 const tabs=put(courseEl,'div',null,'tabs');tabs.setAttribute('role','group');tabs.setAttribute('aria-label','Tipo de estudo');
 const options=[['models','Frases'],['words','Vocabulário'],['characters','Caracteres'],['grammar','Gramática'],['practice','Praticar']];
 for(const [name,title] of options){const b=btn(tabs,title,()=>{tab=name;quiz=null;renderLesson()});b.setAttribute('aria-pressed',String(tab===name));}
 const body=put(courseEl,'div');body.id='lessonBody';
 if(tab==='models'){
  put(body,'h3','Frases para usar hoje');
  for(const zh of w.models){const row=put(body,'div',null,'model');put(row,'span',zh,'hanzi');btn(row,'Ouvir (voz do dispositivo)',()=>speak(zh),'button muted-button')}
  put(body,'p','Escute, repita e tente formular respostas próprias. Os exemplos são do manual de estudo; o áudio, quando disponível, é sintetizado pelo dispositivo.','muted');
  put(body,'p',null,'small-note').id='speechHint';
  put(body,'h3','Meta comunicativa');put(body,'p',w.assessment);
 }else if(tab==='words'||tab==='characters'){
  const chars=tab==='characters',source=chars?charMap:wordMap,terms=chars?w.characters:w.words;
  put(body,'h3',chars?'Escrita e reconhecimento':'Vocabulário funcional');
  put(body,'p',chars?'Os caracteres servem à leitura e escrita de frases; não é preciso memorizar o inventário inteiro para conversar.':'Termos utilizados nesta semana. Algumas palavras são retomadas em outras semanas.','muted');
  const list=put(body,'div',null,'study-list');
  for(const item of terms){const rec=source.get(item),box=put(list,'article',null,'entry');
   if(!rec){put(box,'strong',item);put(box,'p','Registro não encontrado no currículo.');continue}
   const line=put(box,'div');strong(line,item);put(line,'span',rec.pinyin||'');
   put(box,'p',rec.meaning||'Sem tradução informada.');
   put(box,'small',label(rec)+(rec.stage>1?' · origem em etapa posterior':''));
   btn(box,'Pronunciar',()=>speak(item),'button muted-button');
  }
 }else if(tab==='grammar'){
  put(body,'h3','Estruturas necessárias');
  for(const number of w.grammar){
   const rec=ruleMap.get(Number(number)),box=put(body,'article',null,'entry');
   if(!rec){put(box,'p','Ficha #'+number+' indisponível');continue}
   put(box,'h4','#'+number+' · '+rec.title);put(box,'p',rec.pattern||'Sem padrão registrado.');
   put(box,'small',label(rec));
   if(rec.examples?.length)for(const x of rec.examples.slice(0,2)){
    const row=put(box,'p',x.zh+' · '+x.pinyin+' · '+x.pt);
    row.lang='zh';
   }
   else put(box,'p','Registro curricular sem exemplo próprio; use as frases comunicativas desta semana.','muted');
  }
 }else renderPractice(body,w);
 const nav=put(courseEl,'div',null,'lesson-actions');
 btn(nav,'← Semana anterior',()=>chooseWeek(Math.max(1,selectedWeek-1))).disabled=selectedWeek===1;
 btn(nav,'Próxima semana →',()=>chooseWeek(Math.min(13,selectedWeek+1))).disabled=selectedWeek===13;
}
function doneCount(week,max){return Array.from({length:max},(_,i)=>!!(progress.tasks[week]||{})[i]).filter(Boolean).length}
function renderPractice(body,w){
 put(body,'h3','Atividades e verificação semanal');
 const list=put(body,'ul',null,'task-list');
 w.tasks.forEach((task,i)=>{
  const li=put(list,'li'),labelEl=put(li,'label'),check=put(labelEl,'input');
  check.type='checkbox';check.checked=!!progress.tasks[w.week]?.[i];
  check.addEventListener('change',()=>{if(!progress.tasks[w.week])progress.tasks[w.week]={};
   progress.tasks[w.week][i]=check.checked;
   if(!check.checked)delete progress.completed[w.week];
   saveProgress();renderRail();putStatus();});
  put(labelEl,'span',task);
 });
 const labelEl=put(body,'label','Notas e correções pessoais','note-label');labelEl.htmlFor='weekNotes';
 const notes=put(body,'textarea',null,'note-input');notes.id='weekNotes';notes.value=progress.notes[w.week]||'';
 notes.placeholder='Escreva o que conseguiu fazer e o que precisa revisar.';
 notes.addEventListener('input',()=>{progress.notes[w.week]=notes.value;saveProgress()});
 put(body,'h4','Verificação');put(body,'p',w.assessment);
 const actions=put(body,'div',null,'lesson-actions');
 btn(actions,'Fazer revisão de vocabulário',()=>startQuiz(body,w),'button secondary');
 btn(actions,'Marcar semana como realizada',()=>{
  if(doneCount(w.week,3)!==3){putStatus('Marque primeiro as três atividades realizadas.');return}
  progress.completed[w.week]=true;saveProgress();renderRail();putStatus('Semana registrada como realizada neste navegador.');
 },'button');
 const notice=put(body,'p',null,'muted');notice.id='practiceStatus';
 function putStatus(message){notice.textContent=message||doneCount(w.week,3)+' de 3 atividades marcadas.'}
 putStatus();
 const target=put(body,'div');target.id='quizArea';
}
function startQuiz(body,w){
 const items=w.words.map(k=>wordMap.get(k)).filter(x=>x?.meaning);
 const unique=[...new Map(items.map(x=>[x.hanzi,x])).values()];
 const shuffled=[...unique].sort(()=>Math.random()-.5).slice(0,Math.min(5,unique.length));
 quiz={week:w.week,items:shuffled,index:0,correct:0,answered:false};
 renderQuiz(body,w);
}
function renderQuiz(body,w){
 const area=body.querySelector('#quizArea');if(!area||!quiz)return;clear(area);
 const box=put(area,'div',null,'quiz-card');const q=quiz.items[quiz.index];
 if(!q){put(box,'h3','Revisão concluída');put(box,'p','Resultado: '+quiz.correct+' de '+quiz.items.length+'.');
  progress.quizzes[w.week]={correct:quiz.correct,total:quiz.items.length};saveProgress();
  btn(box,'Refazer revisão',()=>startQuiz(body,w));return}
 put(box,'h3','Questão '+(quiz.index+1)+' de '+quiz.items.length);
 put(box,'p',q.hanzi,'hanzi');
 put(box,'p','Qual é o significado principal deste termo?','muted');
 const options=put(box,'div',null,'choices');
 const pool=w.words.map(x=>wordMap.get(x)).filter(x=>x?.meaning&&x.hanzi!==q.hanzi&&x.meaning!==q.meaning);
 const others=[...new Map(pool.map(x=>[x.meaning,x.meaning])).values()].sort(()=>Math.random()-.5).slice(0,3);
 const answers=[q.meaning,...others].sort(()=>Math.random()-.5);
 const feedback=put(box,'p',null,'quiz-feedback');feedback.setAttribute('role','status');
 for(const val of answers){const choice=btn(options,val,()=>{
  if(quiz.answered)return;quiz.answered=true;
  if(val===q.meaning){quiz.correct++;choice.classList.add('correct');feedback.textContent='Correto.'}
  else{choice.classList.add('wrong');feedback.textContent='Resposta esperada: '+q.meaning;[...options.children].find(b=>b.textContent===q.meaning)?.classList.add('correct')}
  for(const b of options.children)b.disabled=true;
  next.disabled=false;
 },'choice');}
 const next=btn(box,'Próxima questão →',()=>{quiz.index++;quiz.answered=false;renderQuiz(body,w)},'button');
 next.disabled=true;
}
function renderClosing(){
 header(null);put(courseEl,'h3','Seis dias para consolidar');
 const list=put(courseEl,'ul',null,'task-list');
 plan.closing.forEach((p,i)=>{
  const li=put(list,'li'),labelEl=put(li,'label'),check=put(labelEl,'input');
  check.type='checkbox';check.checked=!!progress.tasks[13]?.[i];
  check.onchange=()=>{if(!progress.tasks[13])progress.tasks[13]={};progress.tasks[13][i]=check.checked;
   if(!check.checked)delete progress.completed[13];saveProgress();renderRail();notice.textContent=doneCount(13,6)+' de 6 dias registrados.'};
  put(labelEl,'span','Dia '+p.day+' · '+p.task);
 });
 const notice=put(courseEl,'p',doneCount(13,6)+' de 6 dias registrados.','muted');
 const note=put(courseEl,'label','Revisões prioritárias para o próximo ciclo','note-label');note.htmlFor='closingNotes';
 const txt=put(courseEl,'textarea',null,'note-input');txt.id='closingNotes';txt.value=progress.notes[13]||'';txt.oninput=()=>{progress.notes[13]=txt.value;saveProgress()};
 const foot=put(courseEl,'div',null,'lesson-actions');
 btn(foot,'← Semana 12',()=>chooseWeek(12),'button secondary');
 btn(foot,'Registrar fechamento',()=>{
  if(doneCount(13,6)!==6){notice.textContent='Marque os seis dias realizados antes de concluir.';return}
  progress.completed[13]=true;saveProgress();renderRail();notice.textContent='Ciclo de 90 dias registrado como realizado (não é certificação).';
 });
 put(courseEl,'p','Critério: avance por compreensão e produção, não apenas pelo dia do calendário.','muted');
}
function kindKey(kind,x){return kind==='grammar'?Number(x.no):kind==='characters'?x.char:x.hanzi}
function remain(){
 if(!plan)return;
 const kind=$('remainderKind').value,stage=$('remainderStage').value,q=$('remainderQuery').value.trim().toLocaleLowerCase('pt-BR');
 const rec=all[kind].filter(x=>{
  if(selected[kind].has(kindKey(kind,x)))return false;
  if(stage!=='all'&&x.stage!==Number(stage))return false;
  return !q||[x.hanzi,x.char,x.pinyin,x.meaning,x.title,x.pattern,x.explanation].some(s=>typeof s==='string'&&s.toLocaleLowerCase('pt-BR').includes(q));
 });
 const size=24,pages=Math.max(1,Math.ceil(rec.length/size));remainingPage=Math.min(pages-1,Math.max(0,remainingPage));
 $('remainderCount').textContent=rec.length+' registro(s) não selecionado(s) nesta busca.';
 const dest=$('remainderItems');clear(dest);
 for(const x of rec.slice(remainingPage*size,(remainingPage+1)*size)){
  const item=put(dest,'article',null,'entry'),key=kindKey(kind,x);
  const head=put(item,'div');strong(head,key);if(x.pinyin)put(head,'span',x.pinyin);
  put(item,'p',kind==='grammar'?x.pattern||x.explanation||'Sem descrição.':x.meaning||'Sem tradução registrada.');
  put(item,'small',label(x)+(kind==='grammar'?' · '+x.title:''));
 }
 if(!rec.length)put(dest,'p','Nenhum registro encontrado para esses filtros.','muted');
 $('remainderPage').textContent='Página '+(remainingPage+1)+' de '+pages;
 $('remainderPrev').disabled=remainingPage===0;
 $('remainderNext').disabled=remainingPage>=pages-1;
}
function summary(){
 const target=$('remainingSummary');clear(target);
 for(const [k,title] of [['vocabulary','Vocabulário'],['characters','Caracteres'],['grammar','Gramática']]){
  const total=all[k].length,unused=all[k].filter(x=>!selected[k].has(kindKey(k,x))).length;
  put(target,'span',title+': '+unused+' não selecionados de '+total);
 }
}
async function start(){
 try{
  [$('remainderKind'),$('remainderStage'),$('remainderQuery')].forEach(x=>x.addEventListener(x.tagName==='INPUT'?'input':'change',()=>{remainingPage=0;remain()}));
  $('remainderPrev').onclick=()=>{remainingPage--;remain()};
  $('remainderNext').onclick=()=>{remainingPage++;remain()};
  [plan,...stages]=await Promise.all([get('programa-12-semanas.json'),...Array.from({length:9},(_,i)=>get('data/stage-'+(i+1)+'.json'))]);
  if(plan.weeks.length!==12||plan.closing.length!==6)throw Error('O plano de 90 dias está incompleto.');
  indexData();
  for(let n=1;n<=9;n++){const option=put($('remainderStage'),'option','Etapa '+n);option.value=String(n)}
  summary();renderRail();renderLesson();remain();
 }catch(e){
  $('progressStatus').textContent='Falha ao carregar o curso.';
  clear(courseEl);put(courseEl,'p','Não foi possível carregar o curso: '+e.message);
  btn(courseEl,'Tentar novamente',()=>location.reload());
 }
}
window.BishunLite={get,make,put,clear,btn,speak};
start();
})();