/* Biblioteca sob demanda, sempre na página inicial. */
(()=>{'use strict';
const api=window.BishunLite;if(!api)return;
const {get,put,clear,btn,speak}=api,$=id=>document.getElementById(id);
const el=$('libraryContent'),status=$('libraryStatus');
const state={kind:'manual',page:1,sub:1,active:false,source:'',token:0,sourceChunk:1};
const add=(p,t,v,c)=>put(p,t,v,c);
const block=()=>{const b=add(el,'div',null,'reader');return b};
const para=(p,text)=>add(p,'p',text);
const pre=(p,text)=>add(p,'pre',text);
const h=(p,text)=>add(p,'h3',text);
function q(){return $('libraryQuery').value.trim().toLocaleLowerCase('pt-BR')}
function matches(item,query=q()){return !query||JSON.stringify(item).toLocaleLowerCase('pt-BR').includes(query)}
function controls(parent,total,onGo,caption='Página'){
 const line=add(parent,'div',null,'reader-controls');
 btn(line,'← Anterior',()=>onGo(state.page-1)).disabled=state.page<=1;
 add(line,'span',caption+' '+state.page+' de '+total,'small-note');
 btn(line,'Próximo →',()=>onGo(state.page+1)).disabled=state.page>=total;
}
function resultPager(parent,total,size){const pages=Math.max(1,Math.ceil(total/size));
 state.page=Math.min(pages,Math.max(1,state.page));
 controls(parent,pages,p=>{state.page=p;render(true)});
}
function list(parent,items,size,draw){
 const filtered=items.filter(x=>matches(x));
 const pages=Math.max(1,Math.ceil(filtered.length/size));state.page=Math.min(pages,Math.max(1,state.page));
 para(parent,filtered.length+' registros nesta seleção.');
 const list=add(parent,'div',null,'result-list');
 for(const item of filtered.slice((state.page-1)*size,state.page*size))draw(list,item);
 if(!filtered.length)para(list,'Nenhum item com esse termo. Tente uma palavra mais curta.');
 resultPager(parent,filtered.length,size);
}
const entry=(parent,title,detail,meta)=>{
 const b=add(parent,'article',null,'entry');add(b,'strong',title);
 if(detail)add(b,'p',detail);
 if(meta)add(b,'small',meta);
 return b;
};
function manualTitle(page,catalog){
 const t=catalog.toc?.filter(x=>x.page===page).map(x=>x.title).slice(0,3).join(' · ');
 return 'Página '+page+(t?' · '+t:'');
}
async function manual(parent,token){
 const catalog=await get('manual-catalogo.json');if(token!==state.token)return;
 const pages=catalog.pdfPageCount;state.page=Math.min(pages,Math.max(1,state.page));
 const f=catalog.pageParts.find(x=>x.pages.includes(state.page));
 const r=f?await get(f.file):null;if(token!==state.token)return;
 const p=r?.pages?.find(x=>x.p===state.page);
 if(!p)throw Error('Página '+state.page+' não encontrada no manual');
 h(parent,manualTitle(state.page,catalog));pre(parent,p.text||'Transcrição indisponível.');
 const img=catalog.visualParts.find(x=>x.pages.includes(state.page));
 if(img){const data=await get(img.file);if(token!==state.token)return;
  if(data.images?.[state.page]){const image=add(parent,'img');image.loading='lazy';image.alt='Imagem original da página '+state.page;image.src='data:image/webp;base64,'+data.images[state.page]}}
 controls(parent,pages,n=>{state.page=n;render(true)},'Manual: página');
 const direct=add(parent,'div',null,'reader-controls');
 const field=add(direct,'input');field.type='number';field.min='1';field.max=String(pages);field.value=String(state.page);field.setAttribute('aria-label','Número da página do manual');
 const goto=()=>{const n=Number(field.value);if(Number.isInteger(n)&&n>=1&&n<=pages){state.page=n;render(true)}};
 btn(direct,'Abrir página',goto);field.addEventListener('keydown',e=>{if(e.key==='Enter')goto()});
}
async function structured(parent,kind){
 let items=[],per=12;
 if(kind==='atlas'){
  const c=await get('manual-catalogo.json');items=c.atlas;
  h(parent,'Atlas de 410 combinações de pinyin');
  list(parent,items,per,(p,x)=>{
   const b=entry(p,x.pinyin,(x.examples||[]).join(' · '),x.ptbr);
   para(b,x.ajuste||'');
   if(x.audio){const a=add(b,'a','Consultar a sílaba em fonte externa');a.href=x.audio;a.target='_blank';a.rel='noopener noreferrer';}
  });return;
 }
 if(kind==='strokes'){
  const c=await get('manual-catalogo.json');items=c.characters;
  h(parent,'164 caracteres com ordem de traços documentada');
  list(parent,items,per,(p,x)=>{
   const b=entry(p,x.hanzi+' · '+x.pinyin,x.n+' traços · página '+x.page,'sequência normativa no manual');
   btn(b,'Ver sequência nesta página',()=>{state.kind='manual';$('libraryKind').value='manual';state.page=x.page;render(true)},'button secondary');
  });return;
 }
 if(kind==='mnemonics'){
  items=(await get('visual-mnemonics-6.2.1.json')).items;
  h(parent,'48 mnemônicos e pictogramas');
  list(parent,items,per,(p,x)=>{
   const b=entry(p,x.char+' · '+x.titlePt,x.hintPt,x.type);
   if(x.svg){const img=add(b,'img');img.width=95;img.height=95;img.loading='lazy';img.alt=x.char+' · '+x.titlePt;img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(x.svg)}
  });return;
 }
 if(kind==='trail'){
  items=(await get('trilha-v9.json')).lessons;
  h(parent,'302 lições anteriores (reconhecimento e escrita)');
  list(parent,items,8,(p,x)=>{
   const b=entry(p,x.id+' · '+x.name,x.goal,'Fonte: etapa '+x.sourceStage+'; '+x.characters.length+' caracteres');
   para(b,'Caracteres: '+x.characters.map(c=>c.char).join(' · '));
   para(b,'Palavras: '+x.words.map(c=>c.hanzi).join(' · '));
   if(x.sentences?.length)for(const s of x.sentences)para(b,s.zh+' · '+s.pinyin+' · '+s.pt);
  });return;
 }
 const curriculum=['readings','pragmatics','missions'].includes(kind)?await get('data/post/curriculum.json'):null;
 if(kind==='readings'){
  h(parent,'52 leituras autorais (sem áudio gravado)');
  list(parent,curriculum.readings,6,(p,x)=>{
   const b=entry(p,x.id+' · '+x.title,x.zh,x.pt);
   add(b,'small','Tarefas: '+x.tasks.join(' · '));
   btn(b,'Ouvir (voz do dispositivo)',()=>speak(x.zh),'button muted-button');
  });return;
 }
 if(kind==='pragmatics'){
  h(parent,'100 fichas de pragmática');
  list(parent,curriculum.pragmatics,12,(p,x)=>{
   const b=entry(p,x.phrase+' · '+x.pinyin,x.meaning,x.category);
   para(b,x.example+' — '+x.examplePt);
   if(x.note)para(b,x.note);
  });return;
 }
 if(kind==='missions'){
  h(parent,'120 missões pós-padrão');
  list(parent,curriculum.missions,12,(p,x)=>{
   const b=entry(p,x.id+' · '+x.title,x.objective,x.trackTitle);
   para(b,'Entrega: '+x.deliverable);para(b,'Evidências: '+(x.evidence||[]).join(' · '));
  });return;
 }
 if(kind==='benchmarks'){
  const data=await get('data/mastery-v6.json');h(parent,'36 avaliações complementares');
  list(parent,data.benchmarks,6,(p,x)=>{
   const b=entry(p,x.titlePt,x.zh,x.genre+' · '+x.level);
   para(b,'Tarefa de produção: '+x.productionPt);
   for(const question of x.questions||[]){
    const d=add(b,'details'),sum=add(d,'summary',question.qPt);
    const options=add(d,'ol');for(const option of question.optionsPt||[])add(options,'li',option);
    para(d,'Resposta do banco: '+question.optionsPt[question.answer]);
   }
  });return;
 }
 if(kind==='idioms'){
  items=await get('data/post/idioms.json');h(parent,'5.295 expressões idiomáticas');
  para(parent,'As glosas deste banco são predominantemente em inglês, ainda não revisadas para PT-BR.');
  list(parent,items,20,(p,x)=>entry(p,x.h+' · '+x.p,x.g,'Glosa original · inglês'));return;
 }
 if(kind==='fundamentals'){
  items=(await get('conteudos.json')).sections;
  h(parent,'47 seções de fundamentação e apoio');
  list(parent,items,6,(p,x)=>{
   const b=entry(p,x.title||x.id,'','Identificação: '+x.id);
   pre(b,(x.items||[]).map(i=>(i.kind||'texto')+': '+(i.text||'')).join('\n'));
  });return;
 }
}
async function lexicon(parent,token){
 const meta=await get('data/post/meta.json');if(token!==state.token)return;
 const paths=meta.shards||[],max=paths.length;
 state.page=Math.min(Math.max(1,state.page),max);
 const info=paths[state.page-1];const data=await get(info.file);if(token!==state.token)return;
 h(parent,'Léxico pós-padrão · fragmento '+state.page+' de '+max);
 para(parent,'124.370 registros no acervo integral. Cada fragmento abre separadamente para manter a página leve. Pesquisa limitada ao fragmento atual; glosa original geralmente em inglês.');
 const matched=data.filter(x=>matches(x)),size=20,pages=Math.max(1,Math.ceil(matched.length/size));
 state.sub=Math.min(Math.max(1,state.sub),pages);
 const out=add(parent,'div',null,'result-list');
 for(const x of matched.slice((state.sub-1)*size,state.sub*size))entry(out,x.h+' · '+x.p,x.m||x.g,x.m?'Tradução PT-BR':'Glosa original EN');
 if(!matched.length)para(out,'Nada encontrado neste fragmento.');
 const line=add(parent,'div',null,'reader-controls');
 btn(line,'← Registros',()=>{state.sub--;render(true)}).disabled=state.sub<=1;
 para(line,'Registros · página '+state.sub+' de '+pages);
 btn(line,'Mais registros →',()=>{state.sub++;render(true)}).disabled=state.sub>=pages;
 controls(parent,max,n=>{state.page=n;state.sub=1;render(true)},'Fragmento');
 const pick=add(parent,'div',null,'reader-controls'),input=add(pick,'input');input.type='number';input.min='1';input.max=String(max);input.value=String(state.page);input.setAttribute('aria-label','Número do fragmento lexical');
 btn(pick,'Abrir fragmento',()=>{let n=Number(input.value);if(Number.isInteger(n)&&n>=1&&n<=max){state.page=n;state.sub=1;render(true)}});
}
function oldPage(html){
 const doc=new DOMParser().parseFromString(html,'text/html');
 for(const node of doc.querySelectorAll('script,style,nav,header,footer,noscript,svg'))node.remove();
 const root=doc.querySelector('main')||doc.body;
 return root?.innerText||root?.textContent?.replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n')||'';
}
async function archives(parent){
 const archives=await Promise.all([1,2,3].map(n=>get('archive/legacy-'+n+'.json')));
 const items=archives.flatMap(data=>Object.entries(data).map(([name,html])=>({name,html}))).filter(x=>matches(x.name));
 const total=Math.max(1,items.length);state.page=Math.min(total,Math.max(1,state.page));
 h(parent,'24 páginas históricas preservadas, não publicadas como páginas separadas');
 para(parent,items.length+' página(s) correspondentes à busca.');
 if(items.length){const x=items[state.page-1];h(parent,x.name);pre(parent,oldPage(x.html));}
 controls(parent,total,n=>{state.page=n;render(true)},'Página arquivada');
}
function sourcePaths(catalog){
 const basics=['programa-12-semanas.json','manual-catalogo.json','trilha-v9.json','conteudos.json','data/meta.json',
 'data/syllables.json','data/mastery-v6.json','visual-mnemonics-6.2.1.json',
 'data/post/curriculum.json','data/post/meta.json','data/post/core-map.json','data/post/packs.json',
 'data/post/priority-20000.json','data/post/idioms.json',...Array.from({length:9},(_,i)=>'data/stage-'+(i+1)+'.json'),
 ...Array.from({length:3},(_,i)=>'archive/legacy-'+(i+1)+'.json')];
 return [...new Set([...basics,...catalog.pageParts.map(x=>x.file),...catalog.visualParts.map(x=>x.file),
 ...Array.from({length:128},(_,i)=>'data/post/lex-'+String(i).padStart(3,'0')+'.json'),
 ...Array.from({length:16},(_,i)=>'data/post/search-index-'+String(i).padStart(2,'0')+'.json')])];
}
async function sources(parent,token){
 const catalog=await get('manual-catalogo.json');if(token!==state.token)return;
 const options=sourcePaths(catalog);if(!state.source||!options.includes(state.source))state.source='data/meta.json';
 const line=add(parent,'div',null,'reader-controls');
 const select=add(line,'select');select.setAttribute('aria-label','Arquivo original para consulta');
 for(const path of options){const opt=add(select,'option',path);opt.value=path;if(path===state.source)opt.selected=true}
 btn(line,'Abrir arquivo',()=>{state.source=select.value;state.sourceChunk=1;render(true)});
 const data=await get(state.source);if(token!==state.token)return;
 h(parent,'Fonte original · '+state.source);
 const raw=JSON.stringify(data,null,2),size=14000,pages=Math.max(1,Math.ceil(raw.length/size));
 state.sourceChunk=Math.min(Math.max(1,state.sourceChunk),pages);
 pre(parent,raw.slice((state.sourceChunk-1)*size,state.sourceChunk*size));
 para(parent,'Trecho '+state.sourceChunk+' de '+pages+' · arquivo integral inalterado');
 const pager=add(parent,'div',null,'reader-controls');
 btn(pager,'← Trecho anterior',()=>{state.sourceChunk--;render(true)}).disabled=state.sourceChunk<=1;
 btn(pager,'Próximo trecho →',()=>{state.sourceChunk++;render(true)}).disabled=state.sourceChunk>=pages;
}
async function render(scroll=false){
 const token=++state.token;state.active=true;state.kind=$('libraryKind').value;
 clear(el);status.textContent='Abrindo material…';
 const parent=block();
 try{
  if(state.kind==='manual')await manual(parent,token);
  else if(state.kind==='lexicon')await lexicon(parent,token);
  else if(state.kind==='archives')await archives(parent);
  else if(state.kind==='sources')await sources(parent,token);
  else await structured(parent,state.kind);
  if(token!==state.token)return;
  status.textContent='Material aberto nesta página. Conteúdo preservado nos arquivos originais.';
  if(scroll)el.scrollIntoView({behavior:'auto',block:'start'});
 }catch(e){
  if(token!==state.token)return;
  clear(el);status.textContent='Não foi possível abrir este material: '+e.message;
  btn(el,'Tentar novamente',()=>render(false));
 }
}
$('libraryOpen').onclick=()=>{state.page=1;state.sub=1;state.sourceChunk=1;render(false)};
$('libraryKind').onchange=()=>{state.page=1;state.sub=1;state.sourceChunk=1;if(state.active)render(false)};
$('libraryQuery').oninput=()=>{state.page=1;state.sub=1;if(state.active&&state.kind!=='manual'&&state.kind!=='sources')render(false)};
})();