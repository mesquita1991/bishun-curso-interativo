
(()=>{'use strict';const $=x=>document.getElementById(x),esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));let data=null,rows=[],page=0,token=0;const size=30;
function stored(){try{return JSON.parse(localStorage.getItem('bishunFullV4')||'{}')}catch{return{}}}
const initial=new URLSearchParams(location.search).get('etapa')||stored().stage||1;$('etapa').value=String(Math.max(1,Math.min(9,Number(initial)||1)));
const types={caracteres:'characters',palavras:'vocabulary',gramatica:'grammar',silabas:'syllables'};
function currentType(){const h=location.hash.replace('#','');return types[h]?h:$('tipo').value}
function selectType(){const h=location.hash.replace('#','');if(types[h])$('tipo').value=h}
selectType();
function render(){if(!data)return;const type=$('tipo').value,all=data[types[type]]||[],query=$('busca').value.trim().toLocaleLowerCase();rows=all.filter(x=>!query||[x.char,x.hanzi,x.pinyin,x.meaning,x.title,x.explanation,x.pattern,x.representative].some(t=>String(t||'').toLocaleLowerCase().includes(query)));const max=Math.max(0,Math.ceil(rows.length/size)-1);page=Math.min(page,max);$('total').textContent=rows.length+' registros encontrados. Exibindo no máximo '+size+' por página.';$('pagina').textContent='Página '+(page+1)+' de '+(max+1);$('anterior').disabled=page===0;$('proximo').disabled=page>=max;
$('resultados').innerHTML=rows.slice(page*size,(page+1)*size).map(x=>{
 const han=x.char||x.hanzi||x.representative||x.title||'';
 const desc=x.meaning||x.explanation||x.pattern||x.source?.content||'';
 const target=x.char?('laboratorio.html?etapa='+data.stage+'&caractere='+encodeURIComponent(x.char)):x.hanzi?('laboratorio.html?etapa='+data.stage+'&caractere='+encodeURIComponent([...x.hanzi][0])):('aulas.html#gramatica-300');
 return '<article class="tool-card"><b lang="zh-Hans">'+esc(han)+'</b><span>'+esc(x.pinyin||x.pattern||'')+'</span><small>'+esc(desc).slice(0,230)+'</small><p style="margin-top:10px"><a href="'+target+'">Explorar →</a></p></article>'
}).join('')||'<p>Nenhum registro corresponde aos filtros.</p>'}
async function load(){const n=Number($('etapa').value),t=++token;$('carregar').disabled=true;$('aviso').textContent='Carregando somente o catálogo da etapa '+n+'…';try{const r=await fetch('data/stage-'+n+'.json');if(!r.ok)throw Error('HTTP '+r.status);const next=await r.json();if(t!==token)return;if(!Array.isArray(next.characters)||next.stage!==n)throw Error('Conteúdo inválido');data=next;$('catalogo').hidden=false;page=0;render();$('aviso').textContent='Catálogo da etapa '+n+' carregado.'}catch(e){if(t!==token)return;$('aviso').textContent='Não foi possível carregar esta etapa. Tente novamente.';console.error(e)}finally{if(t===token)$('carregar').disabled=false}}
$('carregar').addEventListener('click',load);$('etapa').addEventListener('change',()=>{token++;data=null;$('catalogo').hidden=true;$('aviso').textContent='Clique em Carregar catálogo para abrir esta etapa.';$('carregar').disabled=false});$('tipo').addEventListener('change',()=>{page=0;history.replaceState(null,'','#'+$('tipo').value);render()});$('busca').addEventListener('input',()=>{page=0;render()});$('anterior').addEventListener('click',()=>{page=Math.max(0,page-1);render()});$('proximo').addEventListener('click',()=>{page++;render()});window.addEventListener('hashchange',()=>{selectType();page=0;render()});
})();
