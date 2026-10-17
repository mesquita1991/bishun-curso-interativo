/* Apresentação integral sem interface, navegação ou escrita em armazenamento local. */
(()=>{'use strict';
const main=document.getElementById('conteudo'),state=document.getElementById('estado');
const failures=[],loaded=[];
const add=(parent,tag,text)=>{const node=document.createElement(tag);if(text!==undefined&&text!==null)node.textContent=String(text);parent.append(node);return node};
const group=name=>{const block=add(main,'section');add(block,'h2',name);return block};
const heading=(parent,name)=>add(parent,'h3',name);
const text=(parent,content)=>add(parent,'pre',content);
const jsonLines=arr=>(arr||[]).map(x=>JSON.stringify(x)).join('\n');
async function get(path){const r=await fetch(path,{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);const data=await r.json();loaded.push(path);return data}
async function include(parent,path,cb){try{const data=await get(path);await cb(data,parent)}catch(e){failures.push(path);add(parent,'p','Falha ao carregar '+path+': '+e.message);console.error(e)}}
function update(name){state.textContent='Carregando '+name+' — '+loaded.length+' arquivos lidos.'}
async function pool(paths,threads,fn){let pointer=0;await Promise.all(Array.from({length:Math.min(threads,paths.length)},async()=>{for(;;){const n=pointer++;if(n>=paths.length)return;await fn(paths[n],n)}}))}
function displayRecord(parent,label,obj){heading(parent,label);text(parent,typeof obj==='string'?obj:JSON.stringify(obj,null,1))}
function plainPage(html){
 const doc=new DOMParser().parseFromString(html,'text/html');
 doc.querySelectorAll('script,style,nav,header,footer,noscript,svg').forEach(n=>n.remove());
 const target=doc.querySelector('main')||doc.body;
 if(!target)return'';
 const output=[];
 const block=/^(p|section|article|div|li|ul|ol|h[1-6]|br|tr|table|details|summary|blockquote|figure)$/;
 const walk=n=>{if(n.nodeType===3){const s=n.nodeValue.replace(/\s+/g,' ').trim();if(s)output.push(s);return}
  if(n.nodeType!==1)return;const b=block.test(n.nodeName.toLowerCase());if(b)output.push('\n');
  for(const child of n.childNodes)walk(child);if(b)output.push('\n')};
 walk(target);return output.join(' ').replace(/\s*\n\s*/g,'\n').replace(/\n{3,}/g,'\n\n').trim()
}
async function manual(){
 const section=group('1. Mandarim em 90 dias — doze semanas e seis dias de consolidação');
 const catalog=await get('manual-catalogo.json');
 const parts=await Promise.all(catalog.pageParts.map(p=>get(p.file)));
 const graphics=await Promise.all(catalog.visualParts.map(p=>get(p.file)));
 const images=Object.assign({},...graphics.map(p=>p.images||{}));
 const pages=parts.flatMap(x=>x.pages||[]).sort((a,b)=>a.p-b.p);
 if(pages.length!==198)throw Error('O manual precisa preservar 198 páginas; encontradas '+pages.length);
 for(const page of pages){
  heading(section,'Página '+page.p);
  text(section,page.text||jsonLines(page.blocks));
  const b64=images[page.p];
  if(b64){const img=add(section,'img');img.src='data:image/webp;base64,'+b64;img.loading='lazy';img.alt='Ilustração original do manual — página '+page.p}
 }
 displayRecord(group('2. Manual — inventário, índices, atlas fonético, hiperlinks e traços'),'Metadados integrais do manual',catalog);
}
async function stages(){
 const section=group('3. Curso integral — nove etapas, 300 unidades');
 for(let stage=1;stage<=9;stage++)await include(section,'data/stage-'+stage+'.json',d=>{
  const root=add(section,'section');heading(root,'Etapa '+stage+' — '+d.units.length+' unidades');
  for(const [field,label] of [['units','Unidades'],['characters','Caracteres'],['vocabulary','Vocabulário'],['grammar','Gramática'],['syllables','Sílabas'],['sentences','Frases']]){
   add(root,'h4',label);text(root,jsonLines(d[field]))
  }
  displayRecord(root,'Referências e metadados',{version:d.version,stage:d.stage,officialBand:d.officialBand,splitType:d.splitType,meta:d.meta});
 });
}
async function trail(){
 const section=group('4. Trilha pedagógica — 302 lições');
 await include(section,'trilha-v9.json',d=>{displayRecord(section,'Contexto das lições',{version:d.version,origin:d.origin,pedagogicalScope:d.pedagogicalScope});text(section,jsonLines(d.lessons))});
}
async function fundamentals(){
 const section=group('5. Fundamentos e conteúdos das seções originais');
 await include(section,'conteudos.json',d=>{for(const s of d.sections){heading(section,s.title||s.id);text(section,(s.items||[]).map(x=>(x.kind||'texto')+': '+(x.text||'')).join('\n'))}});
 await include(section,'visual-mnemonics-6.2.1.json',d=>{
  heading(section,'Biblioteca dos 48 mnemônicos');
  for(const e of d.items){add(section,'p',e.char+' · '+e.titlePt+' — '+e.hintPt+' ('+e.type+')');if(e.svg){const img=add(section,'img');img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(e.svg);img.width=92;img.height=92;img.loading='lazy';img.alt=e.char+' · '+e.titlePt}}
 });
 await include(section,'data/syllables.json',d=>displayRecord(section,'Todas as sílabas',d));
 await include(section,'data/mastery-v6.json',d=>displayRecord(section,'Avaliações e competências',d));
}
async function post(){
 const section=group('6. Pós-padrão — leituras, pragmática e extensão lexical integral');
 const named=['curriculum.json','core-map.json','idioms.json','meta.json','packs.json','priority-20000.json'];
 for(const filename of named)await include(section,'data/post/'+filename,d=>displayRecord(section,filename,d));
 const files=Array.from({length:128},(_,i)=>'data/post/lex-'+String(i).padStart(3,'0')+'.json');
 const slots=files.map((path,i)=>{const el=add(section,'div');heading(el,'Léxico '+String(i).padStart(3,'0'));return el});
 await pool(files,6,(path,i)=>include(slots[i],path,d=>text(slots[i],Array.isArray(d)?jsonLines(d):JSON.stringify(d))));
 const search=Array.from({length:16},(_,i)=>'data/post/search-index-'+String(i).padStart(2,'0')+'.json');
 const sroot=group('7. Índices de pesquisa e cobertura original');
 await pool(search,4,(path)=>include(sroot,path,d=>displayRecord(sroot,path,d)));
}
async function legacy(){
 const section=group('8. Texto de todas as antigas páginas, preservado em arquivos de dados');
 for(let n=1;n<=3;n++)await include(section,'archive/legacy-'+n+'.json',data=>{
  for(const [name,html] of Object.entries(data)){heading(section,'Origem: '+name);text(section,plainPage(html))}
 });
}
async function start(){
 try{await manual()}catch(e){failures.push('manual');add(main,'p',e.message);console.error(e)}
 update('as nove etapas');await stages();
 update('as 302 lições');await trail();
 update('os conteúdos complementares');await fundamentals();
 update('o léxico completo');await post();
 update('as páginas históricas');await legacy();
 document.documentElement.dataset.loaded=failures.length?'partial':'complete';
 state.textContent=failures.length?'Conteúdo parcialmente carregado: '+failures.join(', '):'Conteúdo completo reunido nesta única página ('+loaded.length+' arquivos de dados).';
}
if('serviceWorker'in navigator)navigator.serviceWorker.getRegistrations().then(all=>Promise.all(all.map(x=>x.unregister()))).catch(()=>{});
start();
})();