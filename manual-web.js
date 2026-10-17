/* Bǐshùn — conteúdo nativo extraído da fonte integral; nenhum PDF é carregado. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const state={meta:null,partCache:new Map(),visualCache:new Map(),current:1,view:'leitura',searchGeneration:0};
const query=new URLSearchParams(location.search);
function manualRecord(){try{const o=JSON.parse(localStorage.getItem('bishunManualV8')||'{}');return o&&typeof o==='object'?o:{}}catch{return{}}}
function saveManualRecord(patch){try{localStorage.setItem('bishunManualV8',JSON.stringify({...manualRecord(),...patch,updatedAt:Date.now()}))}catch{}}
function studyContext(){
 const direct={stage:Number(query.get('etapa')),unit:Number(query.get('unidade'))};
 if(direct.stage>=1&&direct.stage<=9&&direct.unit>=1&&direct.unit<=(direct.stage<=6?30:40))return direct;
 try{const o=JSON.parse(localStorage.getItem('bishunUnitJourneyV70')||'{}').last||{};
 if(o.stage>=1&&o.stage<=9&&o.unit>=1&&o.unit<=(o.stage<=6?30:40))return{stage:o.stage,unit:o.unit}}catch{}
 try{const o=JSON.parse(localStorage.getItem('bishunFullV4')||'{}');
 if(o.stage>=1&&o.stage<=9&&o.unit>=1&&o.unit<=(o.stage<=6?30:40))return{stage:o.stage,unit:o.unit}}catch{}
 return null;
}
function studyUrl(context){return context?'estudar.html?etapa='+context.stage+'&unidade='+context.unit:'estudar.html'}
function trainingUrl(context,char){return 'laboratorio.html'+(context?'?etapa='+context.stage+'&unidade='+context.unit+(char?'&caractere='+encodeURIComponent(char):''):'')}
function renderStudyBridge(){
 const context=studyContext(),status=$('manualBridgeStatus'),study=$('manualBridgeStudy'),writing=$('manualBridgeWriting');
 if(!status||!study||!writing)return;
 status.textContent=context?'Etapa '+context.stage+' · Unidade '+String((context.stage<=6?(context.stage-1)*30:180+(context.stage-7)*40)+context.unit).padStart(3,'0')+' — continue de onde parou.':'Pronto para começar? A primeira unidade espera por você.';
 study.href=studyUrl(context);study.textContent=context?'Continuar minha unidade →':'Começar unidade 1 →';
 writing.href=trainingUrl(context);
 const hero=$('manualHeroStudy');if(hero)hero.href=studyUrl(context);
}
const norm=t=>String(t||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const sectionFor=p=>p<=22?'Atividades para cada dia':p<=40?'Aprenda a pronunciar':p<=108?'Sons do mandarim':p<=113?'Encontre por pinyin':p<=125?'Primeiros traços':p<=197?'Aprenda a escrever':'Compare os sons';
const pageHref=(p,top)=>'manual.html?pagina='+p+(top?'&pos='+encodeURIComponent(top):'');
const el=(tag,css,text)=>{let n=document.createElement(tag);if(css)n.className=css;if(text!==undefined)n.textContent=text;return n};
function link(label,url,css='',external=false){const a=el('a',css,label);a.href=url;if(external){a.target='_blank';a.rel='noopener noreferrer'}return a}
function setNotice(message){$('manualNotice').textContent=message}
async function getJSON(file){const res=await fetch(file,{cache:'default'});if(!res.ok)throw Error('Não foi possível ler '+file+' ('+res.status+')');return res.json()}
async function getPage(number){const file=state.meta.pageParts.find(x=>x.pages.includes(number));if(!file)throw Error('Página sem dados: '+number);if(!state.partCache.has(file.file))state.partCache.set(file.file,getJSON(file.file));const data=await state.partCache.get(file.file);const page=data.pages.find(p=>p.p===number);if(!page)throw Error('Página ausente: '+number);return page}
async function getImage(number){const file=state.meta.visualParts.find(x=>x.pages.includes(number));if(!file)return null;if(!state.visualCache.has(file.file))state.visualCache.set(file.file,getJSON(file.file));return (await state.visualCache.get(file.file)).images[String(number)]||null}
function annotationHref(l){return l.kind==='ext'?l.to:pageHref(l.to,l.top)}
function addNativeText(page,parent){const container=el('div','manual-document-text');
 const found=new Set(),linksByIndex=new Map(page.links.map(l=>[l.i,l]));
 for(const block of page.blocks){let max=block.size;let tag='p',klass='manual-para';if(max>=17){tag='h3';klass='manual-block-heading'}else if(max>=11&&block.bold){tag='h4';klass='manual-block-subheading'}
  const para=el(tag,klass);if(block.x>=280&&page.p>=6&&page.p<=17)para.classList.add('manual-translation');
  for(let i=0;i<block.lines.length;i++){
   if(i)para.append(document.createTextNode(' '));
   for(const [t,index] of block.lines[i]){
    if(index===null||index===undefined||!linksByIndex.has(index)){para.append(document.createTextNode(t));continue}
    let item=linksByIndex.get(index);let a=link(t,annotationHref(item),'manual-inline-link',item.kind==='ext');a.setAttribute('aria-label',t.trim()||'Consultar recurso');para.append(a);found.add(index);
   }
  }
  container.append(para);
 }
 parent.append(container);
 // All 7,762 original link annotations remain available, including image hotspots and invisible links.
 // Listing annotations is deliberate: some PDF links were not attached to selectable text.
 const details=el('details','manual-original-links'),summary=el('summary',null,'Outras referências desta leitura');details.append(summary);
 const desc=el('p','manual-muted','Encontre aqui links adicionais para ouvir, consultar exemplos ou continuar a leitura.');details.append(desc);
 const list=el('ol','manual-annotations');
 for(let i=0;i<page.links.length;i++){const l=page.links[i];const li=el('li');const endpoint=l.kind==='ext'?new URL(l.to):null;const chinese=l.kind==='ext'?endpoint.searchParams.get('wdqb'):null;const sound=l.kind==='ext'?endpoint.searchParams.get('define'):null;const text=l.kind==='int'?'Continuar na leitura '+l.to:chinese?chinese+' · ver no dicionário':sound?sound+' · ouvir':(l.to.includes('strokeorder.com')?'Ver escrita · ':'Consultar · ')+endpoint.hostname;const a=link(text,annotationHref(l),'manual-resource',l.kind==='ext');li.append(a);list.append(li)}
 details.append(list);parent.append(details);
}
function related(parent,kind){const r=el('aside','manual-related');r.append(el('strong',null,'Continue aprendendo no Bǐshùn'));
 const nav=el('div','manual-related-links');const context=studyContext();
 const common=[['Voltar à minha unidade',studyUrl(context)],['Praticar escrita',trainingUrl(context)],['Consultar palavras','catalogo.html#palavras'],['Revisar o que aprendi','avaliacao.html']];
 for(const [name,url] of common)nav.append(link(name+' →',url));r.append(nav);parent.append(r)}
async function showPage(p,top){p=Math.min(198,Math.max(1,Number(p)||1));state.current=p;state.view='leitura';setActiveNav('leitura');const out=$('manualContent');out.replaceChildren(el('p','manual-wait','Carregando o conteúdo…'));setNotice('Abrindo sua leitura…');
 try{const page=await getPage(p);if(state.current!==p||state.view!=='leitura')return;out.replaceChildren();
 const title=el('header','manual-page-heading');title.append(el('span','manual-eyebrow',sectionFor(p)),el('h2',null,extractTitle(page)));
 title.append(el('p','manual-reading-intro',p<=22?'Leia a atividade e procure experimentar o que foi apresentado.':p<=40?'Ouça, compare os sons e repita em voz alta.':p<=113?'Observe a sílaba e experimente pronunciá-la antes de ouvir.':p<=197?'Acompanhe os traços na ordem indicada e tente escrever.':'Compare as combinações e abra a sílaba que deseja estudar.'));out.append(title);
 const bridge=el('div','manual-context-links');bridge.append(link('← Minha unidade',studyUrl(studyContext())),link('Treinar escrita',trainingUrl(studyContext())));out.append(bridge);
 saveManualRecord({lastPage:p,lastMode:'leitura'});
 const control=el('div','manual-pager');if(p>1)control.append(link('← Anterior',pageHref(p-1),'manual-button secondary'));control.append(el('span','manual-pager-progress','Leitura '+p+' de 198'));if(p<198)control.append(link('Continuar leitura →',pageHref(p+1),'manual-button secondary'));out.append(control);
 if(p>=114&&p<=198){const b64=await getImage(p);if(state.view!=='leitura'||state.current!==p)return;if(b64){const figure=el('figure','manual-figure');const img=el('img');img.src='data:image/webp;base64,'+b64;img.alt=p<=125?'Exercícios ilustrados para praticar escrita':p===126?'Exemplos de como fazer cada traço':p===198?'Tabela para comparar os sons do mandarim':'Passo a passo ilustrado da escrita dos caracteres';img.loading='lazy';figure.append(img,el('figcaption',null,p===198?'Escolha uma sílaba na tabela para ouvir sua pronúncia.':'Observe a sequência e pratique os movimentos no laboratório de escrita.'));out.append(figure)}}
 addNativeText(page,out);
 if(p===198)renderMatrix(out,true);
 related(out);
 const bottom=control.cloneNode(true);out.append(bottom);
 $('manualPageNumber').value=String(p);
 history.replaceState({page:p},'',pageHref(p,top));
 setNotice('Leitura pronta.');
 if(top!==undefined&&top!==null){const sorted=[...out.querySelectorAll('.manual-para,.manual-block-heading,.manual-block-subheading')];const blocks=page.blocks;let n=0;for(let j=0;j<blocks.length;j++){if(blocks[j].y<=Number(top)+5)n=j}const selected=sorted[Math.min(n,sorted.length-1)];if(selected)selected.scrollIntoView({behavior:'auto',block:'center'});else out.scrollIntoView({block:'start'})}
 else if(out.getBoundingClientRect().top<-20)out.scrollIntoView({behavior:'auto'});
 }catch(err){out.replaceChildren(el('p','manual-error','Erro ao abrir conteúdo: '+err.message));setNotice('Erro no carregamento. Use o índice ou recarregue a página.');console.error(err)}
}
function extractTitle(page){if(page.p>=127&&page.p<=197){const chars=state.meta.characters.filter(c=>c.page===page.p).map(c=>c.hanzi+' ('+c.pinyin+')');return 'Escrevendo '+chars.join(' · ')}if(page.p===198)return 'Compare os sons do mandarim';if(page.p>=41&&page.p<=108){const a=state.meta.atlas.filter(x=>x.page===page.p);return a.length?'Pronuncie '+a[0].pinyin+' a '+a[a.length-1].pinyin:'Como pronunciar'}const likely=page.blocks.filter(b=>b.y>44&&b.y<230&&b.size>=12).sort((a,b)=>b.size-a.size)[0];return likely?likely.lines.flat().map(x=>x[0]).join('').trim().slice(0,130) :'Continue sua leitura'}
function setActiveNav(view){document.querySelectorAll('[data-manual-view]').forEach(x=>{x.setAttribute('aria-pressed',x.dataset.manualView===view?'true':'false')})}
function cardInfo(a){const article=el('article','manual-atlas-card');let top=el('header','manual-card-top');top.append(el('strong',null,a.pinyin));article.append(top);
 for(const e of a.examples)article.append(el('p','manual-example',e));
 if(a.ptbr)article.append(el('p',null,a.ptbr));if(a.ajuste)article.append(el('p','manual-muted',a.ajuste));
 const footer=el('div','manual-card-links');footer.append(link('Ouvir ↗',a.audio,'',true),link('Ver explicação →',pageHref(a.page)));article.append(footer);return article}
function showAtlas(q=''){state.view='atlas';setActiveNav('atlas');const out=$('manualContent');out.replaceChildren();out.append(el('h2',null,'Como se pronuncia?'),el('p','manual-muted','Escolha um som, experimente dizê-lo e depois ouça o exemplo. As comparações com o português ajudam a orientar a pronúncia.'));
 const controls=el('div','manual-searchbox');const inp=el('input');inp.type='search';inp.placeholder='Procure uma sílaba, Hanzi, significado ou ajuste…';inp.value=q;inp.setAttribute('aria-label','Pesquisar fichas de pinyin');controls.append(inp);out.append(controls);
 const result=el('p','manual-muted'),cards=el('div','manual-atlas-grid'),pager=el('div','manual-pager');out.append(result,cards,pager);
 let offset=0;function update(){const needle=norm(inp.value.trim());const vals=state.meta.atlas.filter(a=>!needle||norm([a.pinyin,a.syllable,a.content,a.examples.join(' ')].join(' ')).includes(needle));result.textContent=vals.length+' de 410 fichas encontradas.';cards.replaceChildren(...vals.slice(offset,offset+12).map(cardInfo));pager.replaceChildren();if(offset>0){const prev=el('button','manual-button secondary','← Anteriores');prev.type='button';prev.onclick=()=>{offset-=12;update()};pager.append(prev)}if(offset+12<vals.length){const next=el('button','manual-button secondary','Próximas →');next.type='button';next.onclick=()=>{offset+=12;update()};pager.append(next)}}inp.oninput=()=>{offset=0;update();history.replaceState(null,'','manual.html?secao=atlas'+(inp.value?'&busca='+encodeURIComponent(inp.value):''))};update();history.replaceState(null,'','manual.html?secao=atlas'+(q?'&busca='+encodeURIComponent(q):''));saveManualRecord({lastMode:'atlas'});}
function showCharacters(q=''){state.view='escrita';setActiveNav('escrita');const out=$('manualContent');out.replaceChildren();out.append(el('h2',null,'Como escrever este caractere?'),el('p','manual-muted','Busque um caractere e acompanhe a sequência dos traços. Depois pratique sem olhar.'));
 const div=el('div','manual-searchbox'),inp=el('input');inp.type='search';inp.placeholder='Buscar Hanzi ou pinyin, como 我 / wǒ';inp.setAttribute('aria-label','Pesquisar caracteres');inp.value=q;div.append(inp);out.append(div);
 const list=el('div','manual-character-grid');out.append(list);
 function render(){const q=norm(inp.value.trim());list.replaceChildren();let found=0;for(const s of state.meta.characters){if(q&&!norm(s.hanzi+' '+s.pinyin+' '+s.id).includes(q))continue;found++;let art=el('article','manual-character-card');art.append(el('strong','manual-hanzi',s.hanzi),el('span','manual-pinyin',s.pinyin),el('span','manual-muted',s.n+' traço'+(s.n===1?'':'s')));
  art.append(link('Ver sequência →',pageHref(s.page,s.y)));if(s.listen)art.append(link('Ouvir ↗',s.listen,'',true));if(s.animate)art.append(link('Animação ↗',s.animate,'',true));list.append(art)}
 if(!found){const note=el('p','manual-muted','Não encontrei este caractere nas ilustrações. Você pode treiná-lo no laboratório de escrita.');list.append(note,link('Abrir laboratório de escrita →',trainingUrl(studyContext(),inp.value.trim()),'manual-button'))}
 }
 inp.oninput=()=>{render();history.replaceState(null,'','manual.html?secao=escrita'+(inp.value?'&busca='+encodeURIComponent(inp.value):''))};render();history.replaceState(null,'','manual.html?secao=escrita'+(q?'&busca='+encodeURIComponent(q):''));saveManualRecord({lastMode:'escrita'});}
function renderMatrix(container,withinPage=false){if(!withinPage){state.view='matriz';setActiveNav('matriz');container=$('manualContent');container.replaceChildren()}
 container.append(el('h2',null,'Compare os sons do mandarim'),el('p','manual-muted','Encontre uma sílaba na tabela, abra sua explicação ou ouça a pronúncia. No celular, deslize a tabela para os lados.'));
 const panel=el('div','manual-matrix-scroll'),table=el('table','manual-matrix'),thead=el('thead'),hrow=el('tr');hrow.append(el('th',null,'Final'));for(let c=1;c<=22;c++)hrow.append(el('th',null,'C'+String(c).padStart(2,'0')));thead.append(hrow);table.append(thead);
 const tbody=el('tbody');const bycoord=new Map(state.meta.atlas.map(a=>[a.finalGroup+'-'+a.initialColumn,a]));for(let r=1;r<=37;r++){const tr=el('tr');const label='L'+String(r).padStart(2,'0');const th=el('th',null,label);th.scope='row';tr.append(th);for(let c=1;c<=22;c++){let col='C'+String(c).padStart(2,'0'),a=bycoord.get(label+'-'+col),td=el('td');if(a){td.append(link(a.syllable,pageHref(a.page),'manual-matrix-pinyin'),link('Som ↗',a.audio,'manual-matrix-audio',true))}else td.textContent='—';tr.append(td)}tbody.append(tr)}table.append(tbody);panel.append(table);container.append(panel);if(!withinPage){history.replaceState(null,'','manual.html?secao=matriz');saveManualRecord({lastMode:'matriz'})}}
async function showDay(day){let d=Math.min(90,Math.max(1,Number(day)||1));const p=d<=84?6+Math.floor((d-1)/7):18;await showPage(p);$('manualDay').value=String(d);
 const reader=$('manualContent');if(state.view==='leitura'&&state.current===p&&!reader.querySelector('.manual-error')){
 const banner=el('div','manual-day-focus'),heading=el('strong',null,'Dia '+d),help=el('p',null,'Leia a proposta deste dia e experimente a atividade. Consultar um dia não o marca como concluído.');
 banner.append(heading,help);if(d>1)banner.append(link('← Dia anterior','manual.html?dia='+(d-1)));if(d<90)banner.append(link('Próximo dia →','manual.html?dia='+(d+1)));
 const text=reader.querySelector('.manual-document-text');if(text)reader.insertBefore(banner,text);
 const expressions=new RegExp('(?:^|[^A-Za-z0-9])D\\s*0*'+d+'(?=[^0-9]|$)','i');const blocks=[...reader.querySelectorAll('.manual-document-text .manual-para,.manual-document-text .manual-block-heading,.manual-document-text .manual-block-subheading')];
 const match=blocks.find(el=>expressions.test(el.textContent.trim().slice(0,90)));if(match){match.classList.add('manual-day-highlight');match.scrollIntoView({behavior:'auto',block:'center'})}
 history.replaceState({day:d},'','manual.html?dia='+d);
 }
 const visited=new Set(Array.isArray(manualRecord().visitedDays)?manualRecord().visitedDays:[]);
 visited.add(d);saveManualRecord({visitedDays:[...visited].sort((a,b)=>a-b),lastDay:d,lastVisitAt:Date.now()});const progress=$('manualDayProgress');if(progress)progress.textContent='Dia '+d+' aberto · escolha outro quando desejar.';setNotice('Atividades do dia '+d+' abertas.')}
async function fullSearch(q){const term=norm(q.trim());const display=$('manualSearchResults'),status=$('manualSearchStatus');display.replaceChildren();if(term.length<2){status.textContent='Digite ao menos dois caracteres para pesquisar todo o conteúdo.';return}
 const generation=++state.searchGeneration;status.textContent='Procurando no seu guia…';
 try{const pages=(await Promise.all(state.meta.pageParts.map(async f=>{if(!state.partCache.has(f.file))state.partCache.set(f.file,getJSON(f.file));return (await state.partCache.get(f.file)).pages}))).flat();if(generation!==state.searchGeneration)return;const hits=[];
 for(const pg of pages){const txt=norm(pg.text);const pos=txt.indexOf(term);if(pos!==-1)hits.push({p:pg.p,snip:pg.text.slice(Math.max(0,pos-45),Math.min(pg.text.length,pos+120)).replace(/\s+/g,' ').trim()})}
 status.textContent=hits.length?'Encontrei '+hits.length+' leitura(s) com este assunto.':'Não encontrei este termo. Tente outra palavra.';
 for(const h of hits.slice(0,80)){const li=el('li');const a=link(sectionFor(h.p)+' · leitura '+h.p,pageHref(h.p));li.append(a,el('small',null,h.snip));display.append(li)}
 }catch(e){status.textContent='Erro ao pesquisar: '+e.message;console.error(e)}
}
function setupToc(){const list=$('manualToc');for(const item of state.meta.toc){const li=el('li');li.append(link(item.title,pageHref(item.page)));list.append(li)}$('manualTocCount').textContent=String(state.meta.toc.length);}
function events(){document.querySelectorAll('[data-manual-view]').forEach(b=>b.onclick=()=>{const v=b.dataset.manualView;if(v==='atlas')showAtlas();else if(v==='escrita')showCharacters();else if(v==='matriz')renderMatrix();else showPage(state.current)});
 document.querySelectorAll('[data-manual-page]').forEach(b=>b.onclick=()=>showPage(Number(b.dataset.manualPage)));
 document.querySelectorAll('[data-manual-day]').forEach(b=>b.onclick=()=>showDay(Number(b.dataset.manualDay)));
 const dayInput=$('manualDay');if(dayInput)dayInput.addEventListener('keydown',e=>{if(e.key==='Enter')showDay(dayInput.value)});
 $('manualPageGo').onclick=()=>showPage($('manualPageNumber').value);
 $('manualDayGo').onclick=()=>showDay($('manualDay').value);
 let searchTimer;$('manualSearch').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>fullSearch($('manualSearch').value),260)});
 document.addEventListener('click',evt=>{const a=evt.target.closest('a[href]');if(!a)return;const u=new URL(a.href,location.href);if(u.origin!==location.origin||!u.pathname.endsWith('/manual.html'))return;let p=u.searchParams.get('pagina');if(!p)return;evt.preventDefault();showPage(p,u.searchParams.get('pos'));});
 window.addEventListener('popstate',()=>{let qs=new URLSearchParams(location.search);const view=qs.get('secao');if(view==='atlas')showAtlas(qs.get('busca')||'');else if(view==='escrita')showCharacters(qs.get('busca')||'');else if(view==='matriz')renderMatrix();else if(qs.has('dia'))showDay(qs.get('dia'));else showPage(qs.get('pagina')||2)});
}
async function init(){try{state.meta=await getJSON('manual-catalogo.json');if(state.meta.pdfPageCount!==198||state.meta.links!==7762||state.meta.atlas.length!==410||state.meta.characters.length!==164)throw Error('Inventário do conteúdo incompleto');setupToc();events();renderStudyBridge();
 const recentDay=Number(manualRecord().lastDay)||1;if($('manualDay'))$('manualDay').value=String(recentDay);
const view=query.get('secao'),filter=query.get('busca')||'';
 if(view==='atlas')showAtlas(filter);else if(view==='escrita')showCharacters(filter);else if(view==='matriz')renderMatrix();else if(query.has('dia'))await showDay(query.get('dia'));else await showPage(query.get('pagina')||manualRecord().lastPage||2,query.get('pos'));
$('manualReady').textContent='198 páginas disponíveis · guia pronto para estudar';}catch(err){setNotice('Falha ao carregar conteúdo: '+err.message);console.error(err)}}
init();
})();
