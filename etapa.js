(()=>{
'use strict';
const shell=document.querySelector('[data-stage-number]');if(!shell)return;
const stage=Math.max(1,Math.min(9,Number(shell.dataset.stageNumber)||1));
const $=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const say=(text,rate=0.82)=>{if(!('speechSynthesis'in window)){$('stageStatus').textContent='A síntese de voz não está disponível neste navegador.';return;}speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(String(text));u.lang='zh-CN';u.rate=rate;const voices=speechSynthesis.getVoices();u.voice=voices.find(x=>x.lang.toLowerCase()==='zh-cn')||voices.find(x=>x.lang.toLowerCase().startsWith('zh'))||null;speechSynthesis.speak(u)};
let data=null,active=null,loading=false;
function savedUnit(){try{const state=JSON.parse(localStorage.getItem('bishunFullV4')||'{}');return Number(state?.unitsByStage?.[stage]??(Number(state?.stage)===stage?state?.unit:1))||1}catch{return 1}}
function setLegacy(){try{const state=JSON.parse(localStorage.getItem('bishunFullV4')||'{}');state.stage=stage;state.unit=active||savedUnit();if(!state.unitsByStage||typeof state.unitsByStage!=='object'||Array.isArray(state.unitsByStage))state.unitsByStage={};state.unitsByStage[stage]=state.unit;localStorage.setItem('bishunFullV4',JSON.stringify(state));const mode=JSON.parse(localStorage.getItem('bishunFocusV67')||'{}');mode.mode='explore';localStorage.setItem('bishunFocusV67',JSON.stringify(mode));}catch(e){console.warn('Progresso local não alterado:',e)}}
document.querySelectorAll('[data-legacy]').forEach(a=>a.addEventListener('click',setLegacy));
const status=$('stageStatus'),loadButton=$('loadStageButton'),selector=$('stageUnitSelect'),unitView=$('unitContent');
function renderUnit(id,persist){
 if(!data)return;
 const unit=data.units.find(x=>x.id===id)||data.units[0];if(!unit)return;
 active=unit.id;selector.value=String(active);
 if(persist)setLegacy();
 const chars=new Map(data.characters.map(x=>[x.id,x]));
 const vocab=new Map(data.vocabulary.map(x=>[x.id,x]));
 const grammar=new Map(data.grammar.map(x=>[String(x.no),x]));
 const syllables=new Map(data.syllables.map(x=>[x.no,x]));
 const characters=unit.characters.map(x=>chars.get(x)).filter(Boolean),words=unit.words.map(x=>vocab.get(x)).filter(Boolean),rules=unit.grammar.map(x=>grammar.get(String(x))).filter(Boolean),sounds=unit.syllables.map(x=>syllables.get(x)).filter(Boolean);
 const charHTML=characters.map(x=>'<article class="hanzi-card"><strong lang="zh-Hans">'+esc(x.char)+'</strong><span>'+esc(x.pinyin)+'</span><small>'+esc(x.meaning)+'</small><button type="button" class="speak" data-speak="'+esc(x.char)+'" aria-label="Ouvir '+esc(x.char)+'">Ouvir</button></article>').join('');
 const wordHTML=words.map(x=>'<article class="word-card"><b lang="zh-Hans">'+esc(x.hanzi)+'</b> · <span>'+esc(x.pinyin)+'</span><small>'+esc(x.meaning)+'</small><button type="button" class="speak" data-speak="'+esc(x.hanzi)+'" aria-label="Ouvir '+esc(x.hanzi)+'">Ouvir</button></article>').join('');
 const rulesHTML=rules.map(x=>'<li><b>'+esc(x.title)+'</b><p>'+esc(x.pattern||'')+'</p><p>'+esc(x.explanation||x.source?.content||'')+'</p></li>').join('');
 const syllableHTML=sounds.map(x=>'<span>'+esc(x.pinyin)+' <span lang="zh-Hans">'+esc(x.representative)+'</span></span>').join(' · ');
 unitView.innerHTML='<h3>Unidade '+String(unit.globalId||unit.id).padStart(3,'0')+'</h3><p class="subtle">'+characters.length+' caracteres · '+words.length+' palavras · '+rules.length+' itens gramaticais · '+sounds.length+' sílabas</p><h3 class="words-heading">Caracteres desta unidade</h3><div class="hanzi-list">'+charHTML+'</div><h3 class="words-heading">Vocabulário</h3><div class="word-list">'+wordHTML+'</div><h3 class="words-heading">Gramática e padrões</h3>'+(rulesHTML?'<ul class="simple-list">'+rulesHTML+'</ul>':'<p>Nenhum novo registro gramatical nesta unidade.</p>')+'<h3 class="words-heading">Sílabas</h3><p>'+syllableHTML+'</p><div class="actions"><a class="button" href="estudar.html?etapa='+stage+'&unidade='+active+'">Estudar esta unidade · 4 atividades →</a><a class="button secondary" data-legacy href="laboratorio.html?etapa='+stage+'&unidade='+active+'">Laboratório independente de escrita</a><a class="button secondary" data-legacy href="avaliacao.html?etapa='+stage+'#prova">Realizar prova desta etapa</a></div>';
 unitView.querySelectorAll('[data-legacy]').forEach(a=>a.addEventListener('click',setLegacy));
 status.textContent='Unidade '+unit.id+' de '+data.units.length+' exibida. A página carrega somente esta unidade na interface.';
}
async function load(){
 if(loading||data)return;loading=true;loadButton.disabled=true;loadButton.textContent='Carregando etapa '+stage+'…';status.textContent='Baixando apenas os dados desta etapa.';
 try{
  const r=await fetch('data/stage-'+stage+'.json');if(!r.ok)throw new Error('HTTP '+r.status);
  const next=await r.json();if(next.stage!==stage||!Array.isArray(next.units)||!Array.isArray(next.characters))throw new Error('Conteúdo inesperado');
  data=next;selector.innerHTML=data.units.map(u=>'<option value="'+u.id+'">Unidade '+String(u.globalId||u.id).padStart(3,'0')+'</option>').join('');
  $('stageLoaded').hidden=false;$('stageIntro').hidden=true;
  renderUnit(savedUnit(),false);
 }catch(e){status.textContent='Falha ao carregar esta etapa. Verifique a conexão e tente novamente.';loadButton.disabled=false;loadButton.textContent='Tentar novamente';console.error(e)}finally{loading=false}
}
loadButton?.addEventListener('click',load);
selector?.addEventListener('change',()=>renderUnit(Number(selector.value),true));
document.addEventListener('click',e=>{const b=e.target.closest('[data-speak]');if(b)say(b.dataset.speak)});

if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost')){window.addEventListener('load',()=>{const run=()=>navigator.serviceWorker.register('./sw.js?v=8.0.0',{updateViaCache:'none'}).catch(e=>console.warn('Cache offline indisponível:',e));if('requestIdleCallback' in window)requestIdleCallback(run,{timeout:2500});else setTimeout(run,0)},{once:true})}
})();
