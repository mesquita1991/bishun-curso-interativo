/* Bǐshùn — conteúdo nativo extraído da fonte integral; nenhum PDF é carregado. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const state={meta:null,partCache:new Map(),visualCache:new Map(),current:1,view:'leitura',searchGeneration:0};
const query=new URLSearchParams(location.search);
const norm=t=>String(t||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const sectionFor=p=>p<=22?'90 dias':p<=40?'Pronúncia':p<=108?'Atlas de pinyin':p<=113?'Índice alfabético':p<=125?'Prática da escrita':p<=197?'Ordem dos traços':'Matriz sonora';
const pageHref=(p,top)=>'manual.html?pagina='+p+(top?'&pos='+encodeURIComponent(top):'');
const el=(tag,css,text)=>{let n=document.createElement(tag);if(css)n.className=css;if(text!==undefined)n.textContent=text;return n};
function link(label,url,css='',external=false){const a=el('a',css,label);a.href=url;if(external){a.target='_blank';a.rel='noopener noreferrer'}return a}
function setNotice(message){$('manualNotice').textContent=message}
async function getJSON(file){const res=await fetch(file,{cache:'default'});if(!res.ok)throw Error('Não foi possível ler '+file+' ('+res.status+')');return res.json()}
async function getPage(number){const file=state.meta.pageParts.find(x=>x.pages.includes(number));if(!file)throw Error('Página sem dados: '+number);if(!state.partCache.has(file.file))state.partCache.set(file.file,getJSON(file.file));const data=await state.partCache.get(file.file);const page=data.pages.find(p=>p.p===number);if(!page)throw Error('Página ausente: '+number);return page}
async function getImage(number){const file=state.meta.visualParts.find(x=>x.pages.includes(number));if(!file)return null;if(!state.visualCache.has(file.file))state.visualCache.set(file.file,getJSON(file.file));return (await state.visualCache.get(file.file)).images[String(number)]||null}
function annotationHref(l){return l.kind==='ext'?l.to:pageHref(l.to,l.top)}
function addNativeText(page,parent){const container=el('div','manual-document-text');const hdr=el('p','manual-transcription','Texto integral desta página, com os hiperlinks originais nos trechos correspondentes.');container.append(hdr);
 const found=new Set();
 for(const block of page.blocks){let max=block.size;let tag='p',klass='manual-para';if(max>=17){tag='h3';klass='manual-block-heading'}else if(max>=11&&block.bold){tag='h4';klass='manual-block-subheading'}
  const para=el(tag,klass);if(block.x>=280&&page.p>=6&&page.p<=17)para.classList.add('manual-translation');
  for(let i=0;i<block.lines.length;i++){
   if(i)para.append(document.createTextNode(' '));
   for(const [t,index] of block.lines[i]){
    if(index===null||index===undefined||!page.links.some(l=>l.i===index)){para.append(document.createTextNode(t));continue}
    let item=page.links.find(l=>l.i===index);let a=link(t,annotationHref(item),'manual-inline-link',item.kind==='ext');a.setAttribute('aria-label',t.trim()||'Consultar recurso');para.append(a);found.add(index);
   }
  }
  container.append(para);
 }
 parent.append(container);
 // All 7,762 original link annotations remain available, including image hotspots and invisible links.
 // Listing annotations is deliberate: some PDF links were not attached to selectable text.
 const details=el('details','manual-original-links'),summary=el('summary',null,'Todos os destinos originais desta página ('+page.links.length+' links)');details.append(summary);
 const desc=el('p','manual-muted','Os links abaixo incluem destinos externos e referências internas originais. Alguns se repetem porque cada ocorrência no documento possui seu próprio link.');details.append(desc);
 const list=el('ol','manual-annotations');
 for(let i=0;i<page.links.length;i++){const l=page.links[i];const li=el('li');const endpoint=l.kind==='ext'?new URL(l.to):null;const chinese=l.kind==='ext'?endpoint.searchParams.get('wdqb'):null;const sound=l.kind==='ext'?endpoint.searchParams.get('define'):null;const text=l.kind==='int'?'Ir à página '+l.to+(l.top?' · posição '+Math.round(l.top):''):chinese?chinese+' · consultar o dicionário':sound?sound+' · ouvir pronúncia':(l.to.includes('strokeorder.com')?'Consultar ordem dos traços · ':'Abrir recurso · ')+endpoint.hostname;const a=link(text,annotationHref(l),'manual-resource',l.kind==='ext');li.append(a);list.append(li)}
 details.append(list);parent.append(details);
}
function related(parent,kind){const r=el('aside','manual-related');r.append(el('strong',null,'Continue aprendendo no Bǐshùn'));
 const nav=el('div','manual-related-links');const common=[['Minha unidade','estudar.html'],['Treinar escrita','laboratorio.html'],['Consultar palavras','catalogo.html#palavras'],['Revisar','avaliacao.html']];
 for(const [name,url] of common)nav.append(link(name+' →',url));r.append(nav);parent.append(r)}
async function showPage(p,top){p=Math.min(198,Math.max(1,Number(p)||1));state.current=p;state.view='leitura';setActiveNav('leitura');const out=$('manualContent');out.replaceChildren(el('p','manual-wait','Carregando o conteúdo…'));setNotice('Preparando página '+p+' de 198');
 try{const page=await getPage(p);if(state.current!==p||state.view!=='leitura')return;out.replaceChildren();
 const title=el('header','manual-page-heading');title.append(el('span','manual-eyebrow',sectionFor(p)+' · referência '+p+'/198'),el('h2',null,extractTitle(page)));
 title.append(el('p','manual-muted','Conteúdo textual e hiperlinks da fonte original, convertido para elementos do site.'));out.append(title);
 const control=el('div','manual-pager');if(p>1)control.append(link('← Página '+(p-1),pageHref(p-1),'manual-button secondary'));control.append(el('span','manual-muted','Página '+p+' de 198'));if(p<198)control.append(link('Página '+(p+1)+' →',pageHref(p+1),'manual-button secondary'));out.append(control);
 if(p>=114&&p<=198){const b64=await getImage(p);if(state.view!=='leitura'||state.current!==p)return;if(b64){const figure=el('figure','manual-figure');const img=el('img');img.src='data:image/webp;base64,'+b64;img.alt=p<=125?'Prancha de prática de escrita, imagem original convertida em WebP':p===126?'Esquemas dos traços e gestos fundamentais':p===198?'Matriz completa original, com 410 células e a legenda explicativa':'Sequências completas dos traços ilustrados nesta página, em ordem';img.loading='lazy';figure.append(img,el('figcaption',null,'Ilustração original convertida em imagem da página '+p+'. O texto e os links correspondentes seguem como elementos HTML.'));out.append(figure)}}
 addNativeText(page,out);
 if(p===198)renderMatrix(out,true);
 related(out);
 const bottom=control.cloneNode(true);out.append(bottom);
 $('manualPageNumber').value=String(p);
 history.replaceState({page:p},'',pageHref(p,top));
 setNotice('Página '+p+' carregada. '+page.links.length+' links originais disponíveis.');
 if(top!==undefined&&top!==null){const sorted=[...out.querySelectorAll('.manual-para,.manual-block-heading,.manual-block-subheading')];const blocks=page.blocks;let n=0;for(let j=0;j<blocks.length;j++){if(blocks[j].y<=Number(top)+5)n=j}const selected=sorted[Math.min(n,sorted.length-1)];if(selected)selected.scrollIntoView({behavior:'auto',block:'center'});else out.scrollIntoView({block:'start'})}
 else if(out.getBoundingClientRect().top<-20)out.scrollIntoView({behavior:'auto'});
 }catch(err){out.replaceChildren(el('p','manual-error','Erro ao abrir conteúdo: '+err.message));setNotice('Erro no carregamento. Use o índice ou recarregue a página.');console.error(err)}
}
function extractTitle(page){if(page.p>=127&&page.p<=197){const chars=state.meta.characters.filter(c=>c.page===page.p).map(c=>c.hanzi+' ('+c.pinyin+')');return 'Ordem dos traços · '+chars.join(' · ')}if(page.p===198)return 'Matriz completa de consulta sonora';if(page.p>=41&&page.p<=108){const a=state.meta.atlas.filter(x=>x.page===page.p);return a.length?'Atlas de pinyin · '+a[0].pinyin+' a '+a[a.length-1].pinyin:'Atlas de pronúncia'}const likely=page.blocks.filter(b=>b.y>44&&b.y<230&&b.size>=12).sort((a,b)=>b.size-a.size)[0];return likely?likely.lines.flat().map(x=>x[0]).join('').trim().slice(0,130):'Material de consulta · página '+page.p}
function setActiveNav(view){document.querySelectorAll('[data-manual-view]').forEach(x=>{x.setAttribute('aria-pressed',x.dataset.manualView===view?'true':'false')})}
function cardInfo(a){const article=el('article','manual-atlas-card');let top=el('header','manual-card-top');top.append(el('strong',null,'#'+String(a.id).padStart(3,'0')+' · '+a.pinyin));top.append(el('span','manual-coord',a.finalGroup+' × '+a.initialColumn));article.append(top);
 for(const e of a.examples)article.append(el('p','manual-example',e));
 if(a.ptbr)article.append(el('p',null,a.ptbr));if(a.ajuste)article.append(el('p','manual-muted',a.ajuste));
 const footer=el('div','manual-card-links');footer.append(link('Ouvir pronúncia ↗',a.audio,'',true),link('Contexto integral →',pageHref(a.page)));article.append(footer);return article}
function showAtlas(q=''){state.view='atlas';setActiveNav('atlas');const out=$('manualContent');out.replaceChildren();out.append(el('h2',null,'Atlas integral · 410 combinações de pinyin'),el('p','manual-muted','820 exemplos, pistas de aproximação em português brasileiro e ajustes articulatórios. Cada ficha mantém a referência da página original.'));
 const controls=el('div','manual-searchbox');const inp=el('input');inp.type='search';inp.placeholder='Procure uma sílaba, Hanzi, significado ou ajuste…';inp.value=q;inp.setAttribute('aria-label','Pesquisar fichas de pinyin');controls.append(inp);out.append(controls);
 const result=el('p','manual-muted'),cards=el('div','manual-atlas-grid'),pager=el('div','manual-pager');out.append(result,cards,pager);
 let offset=0;function update(){const needle=norm(inp.value.trim());const vals=state.meta.atlas.filter(a=>!needle||norm([a.pinyin,a.syllable,a.content,a.examples.join(' ')].join(' ')).includes(needle));result.textContent=vals.length+' de 410 fichas encontradas.';cards.replaceChildren(...vals.slice(offset,offset+12).map(cardInfo));pager.replaceChildren();if(offset>0){const prev=el('button','manual-button secondary','← Anteriores');prev.type='button';prev.onclick=()=>{offset-=12;update()};pager.append(prev)}if(offset+12<vals.length){const next=el('button','manual-button secondary','Próximas →');next.type='button';next.onclick=()=>{offset+=12;update()};pager.append(next)}}inp.oninput=()=>{offset=0;update()};update();history.replaceState(null,'','manual.html?secao=atlas');}
function showCharacters(q=''){state.view='escrita';setActiveNav('escrita');const out=$('manualContent');out.replaceChildren();out.append(el('h2',null,'Escrita progressiva · 164 caracteres'),el('p','manual-muted','1.157 etapas gráficas, da primeira linha ao caractere completo. As figuras ilustram cada etapa, e as animações externas foram mantidas.'));
 const div=el('div','manual-searchbox'),inp=el('input');inp.type='search';inp.placeholder='Buscar Hanzi ou pinyin, como 我 / wǒ';inp.setAttribute('aria-label','Pesquisar caracteres');inp.value=q;div.append(inp);out.append(div);
 const list=el('div','manual-character-grid');out.append(list);
 function render(){const q=norm(inp.value.trim());list.replaceChildren();for(const s of state.meta.characters){if(q&&!norm(s.hanzi+' '+s.pinyin+' '+s.id).includes(q))continue;let art=el('article','manual-character-card');art.append(el('strong','manual-hanzi',s.hanzi),el('span','manual-pinyin',s.pinyin),el('span','manual-muted',s.n+' traço'+(s.n===1?'':'s')+' · '+String(s.id).padStart(3,'0')+'/164'));
  art.append(link('Ver sequência →',pageHref(s.page,s.y)));if(s.listen)art.append(link('Ouvir ↗',s.listen,'',true));if(s.animate)art.append(link('Animação ↗',s.animate,'',true));list.append(art)}}inp.oninput=render;render();history.replaceState(null,'','manual.html?secao=escrita');}
function renderMatrix(container,withinPage=false){if(!withinPage){state.view='matriz';setActiveNav('matriz');container=$('manualContent');container.replaceChildren()}
 container.append(el('h2',null,'Matriz interativa das 410 combinações'),el('p','manual-muted','37 grupos de finais × 22 colunas de iniciais. Toque em uma sílaba para abrir sua ficha; use “Som” para ouvir a referência original. Role horizontalmente em telas pequenas.'));
 const panel=el('div','manual-matrix-scroll'),table=el('table','manual-matrix'),thead=el('thead'),hrow=el('tr');hrow.append(el('th',null,'Final'));for(let c=1;c<=22;c++)hrow.append(el('th',null,'C'+String(c).padStart(2,'0')));thead.append(hrow);table.append(thead);
 const tbody=el('tbody');const bycoord=new Map(state.meta.atlas.map(a=>[a.finalGroup+'-'+a.initialColumn,a]));for(let r=1;r<=37;r++){const tr=el('tr');const label='L'+String(r).padStart(2,'0');const th=el('th',null,label);th.scope='row';tr.append(th);for(let c=1;c<=22;c++){let col='C'+String(c).padStart(2,'0'),a=bycoord.get(label+'-'+col),td=el('td');if(a){td.append(link(a.syllable,pageHref(a.page),'manual-matrix-pinyin'),link('Som ↗',a.audio,'manual-matrix-audio',true))}else td.textContent='—';tr.append(td)}tbody.append(tr)}table.append(tbody);panel.append(table);container.append(panel);if(!withinPage)history.replaceState(null,'','manual.html?secao=matriz');}
async function showDay(day){let d=Math.min(90,Math.max(1,Number(day)||1));const p=d<=84?6+Math.floor((d-1)/7):18;await showPage(p);$('manualDay').value=String(d);setNotice('Dia '+d+' · consulte as atividades D'+d+' nesta página.')}
async function fullSearch(q){const term=norm(q.trim());const display=$('manualSearchResults'),status=$('manualSearchStatus');display.replaceChildren();if(term.length<2){status.textContent='Digite ao menos dois caracteres para pesquisar todo o conteúdo.';return}
 const generation=++state.searchGeneration;status.textContent='Pesquisando em 198 páginas…';
 try{const pages=(await Promise.all(state.meta.pageParts.map(async f=>{if(!state.partCache.has(f.file))state.partCache.set(f.file,getJSON(f.file));return (await state.partCache.get(f.file)).pages}))).flat();if(generation!==state.searchGeneration)return;const hits=[];
 for(const pg of pages){const txt=norm(pg.text);const pos=txt.indexOf(term);if(pos!==-1)hits.push({p:pg.p,snip:pg.text.slice(Math.max(0,pos-45),Math.min(pg.text.length,pos+120)).replace(/\s+/g,' ').trim()})}
 status.textContent=hits.length+' página(s) encontrada(s); '+Math.min(hits.length,80)+' resultados exibidos.';
 for(const h of hits.slice(0,80)){const li=el('li');const a=link('Página '+h.p+' · '+sectionFor(h.p),pageHref(h.p));li.append(a,el('small',null,h.snip));display.append(li)}
 }catch(e){status.textContent='Erro ao pesquisar: '+e.message;console.error(e)}
}
function setupToc(){const list=$('manualToc');for(const item of state.meta.toc){const li=el('li');li.append(link(item.title+' · p. '+item.page,pageHref(item.page)));list.append(li)}$('manualTocCount').textContent=String(state.meta.toc.length);}
function events(){document.querySelectorAll('[data-manual-view]').forEach(b=>b.onclick=()=>{const v=b.dataset.manualView;if(v==='atlas')showAtlas();else if(v==='escrita')showCharacters();else if(v==='matriz')renderMatrix();else showPage(state.current)});
 document.querySelectorAll('[data-manual-page]').forEach(b=>b.onclick=()=>showPage(Number(b.dataset.manualPage)));
 $('manualPageGo').onclick=()=>showPage($('manualPageNumber').value);
 $('manualDayGo').onclick=()=>showDay($('manualDay').value);
 let searchTimer;$('manualSearch').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>fullSearch($('manualSearch').value),260)});
 document.addEventListener('click',evt=>{const a=evt.target.closest('a[href]');if(!a)return;const u=new URL(a.href,location.href);if(u.origin!==location.origin||!u.pathname.endsWith('/manual.html'))return;let p=u.searchParams.get('pagina');if(!p)return;evt.preventDefault();showPage(p,u.searchParams.get('pos'));});
 window.addEventListener('popstate',()=>{let qs=new URLSearchParams(location.search);const view=qs.get('secao');if(view==='atlas')showAtlas();else if(view==='escrita')showCharacters();else if(view==='matriz')renderMatrix();else showPage(qs.get('pagina')||1)});
}
async function init(){try{state.meta=await getJSON('manual-catalogo.json');if(state.meta.pdfPageCount!==198||state.meta.links!==7762||state.meta.atlas.length!==410||state.meta.characters.length!==164)throw Error('Inventário do conteúdo incompleto');setupToc();events();
const view=query.get('secao');if(view==='atlas')showAtlas();else if(view==='escrita')showCharacters();else if(view==='matriz')renderMatrix();else await showPage(query.get('pagina')||2,query.get('pos'));
$('manualReady').textContent='198 páginas de conteúdo · 410 sílabas · 164 caracteres · 7.762 links originais';}catch(err){setNotice('Falha ao carregar conteúdo: '+err.message);console.error(err)}}
init();
})();
