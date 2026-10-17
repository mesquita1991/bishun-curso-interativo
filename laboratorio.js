(()=>{
'use strict';
const $=x=>document.getElementById(x),learning=window.BishunLearning;if(!learning)throw Error('Motor pedagógico indisponível');
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let data=null,list=[],selected=null,writer=null,writerLib=null,ticket=0;
const stageControl=$('etapa'),loadBtn=$('carregar'),status=$('aviso');
function state(){try{return JSON.parse(localStorage.getItem('bishunFullV4')||'{}')}catch{return{}}}
function save(st){try{localStorage.setItem('bishunFullV4',JSON.stringify(st));return true}catch{return false}}
function initial(){const s=state();const query=new URLSearchParams(location.search);return Math.max(1,Math.min(9,Number(query.get('etapa')||s.stage)||1))}
stageControl.value=String(initial());
function stageSave(){const s=state();s.stage=Number(stageControl.value);if(!s.unitsByStage||typeof s.unitsByStage!=='object')s.unitsByStage={};s.unit=s.unitsByStage[s.stage]||1;save(s)}
function selectedUnit(){const s=state();return Number(s.unitsByStage?.[Number(stageControl.value)]||((Number(s.stage)===Number(stageControl.value))?s.unit:1))||1}
function setUnit(n){const s=state(),stage=Number(stageControl.value);s.stage=stage;s.unit=n;s.unitsByStage=typeof s.unitsByStage==='object'&&s.unitsByStage?s.unitsByStage:{};s.unitsByStage[stage]=n;save(s)}
function grade(char,mistakes){
 try{
  const all=JSON.parse(localStorage.getItem('bishunUnitJourneyV70')||'{}');
  all.units=all.units&&typeof all.units==='object'?all.units:{};
  const owner=data?.units?.find(u=>u.characters.some(id=>data.characters.find(c=>c.id===id)?.char===char));
  const unitId=owner?.id||Number($('unidade').value),key=Number(stageControl.value)+':'+unitId;
  const previous=all.units[key]||{};
  all.units[key]={...previous,...learning.writing(previous,char,mistakes),updatedAt:Date.now()};
  localStorage.setItem('bishunUnitJourneyV70',JSON.stringify(all));
 }catch(e){console.warn('Não foi possível registrar a escrita no histórico local',e)}
 renderProgress();
}
function speak(text,rate=.8){if(!('speechSynthesis'in window)){show('A síntese de voz não está disponível no navegador.',true);return}const syn=window.speechSynthesis;syn.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='zh-CN';u.rate=rate;u.voice=syn.getVoices().find(v=>v.lang.toLowerCase()==='zh-cn')||syn.getVoices().find(v=>v.lang.toLowerCase().startsWith('zh'))||null;syn.speak(u)}
function show(msg,error=false){const el=$('feedback');el.textContent=msg;el.setAttribute('role',error?'alert':'status')}
function renderProgress(){
 if(!data)return;const record=state().records?.char||{};
 const spaced=data.characters.filter(c=>(record[c.char]?.verifiedLevel||0)>=3).length;
 const pct=Math.round(spaced/data.characters.length*100);
 $('dominio').style.width=pct+'%';
 $('dominioTxt').textContent=spaced+' de '+data.characters.length+' caracteres com três recordações espaçadas autoavaliadas ('+pct+'%). Não é certificação.';
}
function renderChar(char){const x=data?.characters.find(c=>c.char===char);if(!x)return;selected=x;writer=null;$('caractere').value=x.char;$('hanzi').textContent=x.char;$('pinyin').textContent=x.pinyin||'';$('significado').textContent=x.meaning||'';$('tradicional').textContent='Tradicional: '+(x.traditional||x.char)+' · Etapa '+stageControl.value;$('exemplos').textContent=(x.examples||[]).slice(0,5).join(' · ');$('writer').innerHTML='<div class="hanzi-fallback">'+esc(x.char)+'</div>';$('cards').querySelectorAll('[data-char]').forEach(b=>b.setAttribute('aria-current',String(b.dataset.char===x.char)));show('Pronto para ouvir ou animar os traços de '+x.char+'.')}
function cards(){if(!data)return;const q=$('busca').value.trim().toLocaleLowerCase();const unit=Number($('unidade').value);const u=data.units.find(x=>x.id===unit);list=(u?data.characters.filter(x=>u.characters.includes(x.id)):data.characters).filter(x=>!q||[x.char,x.pinyin,x.meaning,x.traditional].some(t=>String(t||'').toLocaleLowerCase().includes(q)));$('caractere').innerHTML=list.map(x=>'<option value="'+esc(x.char)+'">'+esc(x.char)+' · '+esc(x.pinyin)+' · '+esc(x.meaning).slice(0,42)+'</option>').join('');$('cards').innerHTML=list.slice(0,90).map(x=>'<button type="button" class="mini-result" data-char="'+esc(x.char)+'"><b lang="zh-Hans">'+esc(x.char)+'</b><small>'+esc(x.pinyin)+' — '+esc(x.meaning).slice(0,60)+'</small></button>').join('');if(list.length){renderChar(list.some(x=>x.char===selected?.char)?selected.char:list[0].char)}else{$('writer').innerHTML='';selected=null;$('cards').innerHTML='<p>Nenhum caractere encontrado.</p>';show('Busca sem resultados. Altere o termo ou a unidade.',true)}}
async function load(){const n=Number(stageControl.value),t=++ticket;loadBtn.disabled=true;status.textContent='Carregando apenas a etapa '+n+'…';try{const response=await fetch('data/stage-'+n+'.json');if(!response.ok)throw Error('HTTP '+response.status);const next=await response.json();if(t!==ticket)return;if(next.stage!==n||!Array.isArray(next.characters)||!Array.isArray(next.units))throw Error('dados inválidos');data=next;selected=null;stageSave();$('laboratorio').hidden=false;$('unidade').innerHTML=data.units.map(x=>'<option value="'+x.id+'">Unidade '+String(x.globalId||x.id).padStart(3,'0')+'</option>').join('');const params=new URLSearchParams(location.search);const requested=params.get('caractere');const foundChar=requested?data.characters.find(c=>c.char===requested):null;const requestedUnit=Number(params.get('unidade'))||0;const matchingUnit=foundChar?data.units.find(u=>u.characters.includes(foundChar.id))?.id:0;const nextUnit=matchingUnit||requestedUnit||selectedUnit();$('unidade').value=String(data.units.some(x=>x.id===nextUnit)?nextUnit:1);cards();if(foundChar)renderChar(foundChar.char);renderProgress();status.textContent='Etapa '+n+' carregada: '+data.characters.length+' caracteres. O laboratório de escrita é carregado sob demanda.'}catch(e){if(t!==ticket)return;status.textContent='Falha ao carregar a etapa. Verifique a conexão e tente novamente.';console.error(e)}finally{if(t===ticket)loadBtn.disabled=false}}
function ensureWriter(){if(writerLib)return Promise.resolve(writerLib);return new Promise((resolve,reject)=>{const existing=window.HanziWriter;if(existing){writerLib=existing;resolve(existing);return}const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/hanzi-writer@3.7.3/dist/hanzi-writer.min.js';script.async=true;script.onload=()=>window.HanziWriter?(writerLib=window.HanziWriter,resolve(writerLib)):reject(Error('HanziWriter ausente'));script.onerror=()=>reject(Error('Não foi possível carregar o motor de escrita'));document.head.appendChild(script)})}
async function practice(mode){if(!selected)return;show('Preparando traços de '+selected.char+'…');try{const lib=await ensureWriter();const char=selected.char,frame=$('writer');if(!selected||selected.char!==char)return;frame.innerHTML='';const size=Math.min(300,frame.clientWidth||300);writer=lib.create(frame,char,{width:size,height:size,padding:24,showOutline:true,showCharacter:true,strokeColor:'#19346f',outlineColor:'#c9d6ee',highlightColor:'#d77620',drawingColor:'#1f4aa8',drawingWidth:8});if(mode==='animate'){writer.animateCharacter();show('Animação dos traços de '+char+'.')}else{show('Siga com o dedo ou mouse a ordem correta dos traços.');writer.quiz({showHintAfterMisses:2,onComplete:result=>{const errors=result.totalMistakes||0;grade(char,errors<=1?2:1);show('Escrita de '+char+' concluída com '+errors+' erro(s). Registro atualizado.')}})}}catch(e){writer=null;$('writer').innerHTML='<div class="hanzi-fallback">'+esc(selected.char)+'</div>';show('Não foi possível inicializar a animação. O caractere, pinyin e áudio continuam disponíveis. '+e.message,true)}}

let visuals=null,visualExpanded=false;
const featured=new Set(['山','川','水','火','木','林','森','日','月','雨','目','休']);
function renderVisuals(){
 if(!visuals)return;
 const q=$('visualSearch').value.trim().toLocaleLowerCase();
 const matching=visuals.filter(x=>!q||[x.char,x.titlePt,x.hintPt,x.type].some(y=>String(y||'').toLocaleLowerCase().includes(q)));
 const visible=(q||visualExpanded)?matching:matching.filter(x=>featured.has(x.char));
 $('visualGrid').innerHTML=visible.map(x=>'<article class="tool-card"><div class="visual-svg" aria-label="Ilustração de '+esc(x.char)+'">'+x.svg+'</div><b lang="zh-Hans">'+esc(x.char)+'</b><strong>'+esc(x.titlePt)+'</strong><small>'+esc(x.hintPt)+'</small></article>').join('');
 $('visualMore').hidden=Boolean(q);$('visualMore').textContent=visualExpanded?'Mostrar apenas os 12 essenciais':'Mostrar todos os 48';
 $('visualNotice').textContent=visible.length+' ilustrações exibidas, de '+visuals.length+' na coleção histórica.';
}
$('memoriaVisual').addEventListener('toggle',async()=>{
 if(!$('memoriaVisual').open||visuals)return;
 $('visualNotice').textContent='Carregando ilustrações sob demanda…';
 try{const r=await fetch('visual-mnemonics-6.2.1.json?v=6.9.1');if(!r.ok)throw Error('HTTP '+r.status);const d=await r.json();if(!Array.isArray(d.items)||d.items.length!==48)throw Error('Inventário visual incompleto');visuals=d.items;renderVisuals();}
 catch(e){$('visualNotice').textContent='Não foi possível carregar a biblioteca visual. Tente reabrir este painel.';console.error(e)}
});
$('visualSearch').addEventListener('input',renderVisuals);
$('visualMore').addEventListener('click',()=>{visualExpanded=!visualExpanded;renderVisuals()});

loadBtn.addEventListener('click',load);stageControl.addEventListener('change',()=>{data=null;selected=null;$('laboratorio').hidden=true;status.textContent='Clique em Carregar etapa para abrir a etapa '+stageControl.value;loadBtn.disabled=false;ticket++;});
$('unidade').addEventListener('change',()=>{setUnit(Number($('unidade').value));$('busca').value='';selected=null;cards()});$('busca').addEventListener('input',cards);$('caractere').addEventListener('change',()=>renderChar($('caractere').value));$('cards').addEventListener('click',event=>{const b=event.target.closest('[data-char]');if(b)renderChar(b.dataset.char)});
$('animar').addEventListener('click',()=>practice('animate'));$('escrever').addEventListener('click',()=>practice('quiz'));$('ouvir').addEventListener('click',()=>selected&&speak(selected.char));$('lento').addEventListener('click',()=>selected&&speak(selected.char,.58));$('proximo').addEventListener('click',()=>{if(!selected||!list.length)return;const i=list.findIndex(x=>x.char===selected.char);renderChar(list[(i+1)%list.length].char)});
})();
