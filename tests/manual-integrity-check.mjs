import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const root=process.cwd();const rd=p=>fs.readFileSync(p);
const data=JSON.parse(rd('manual-catalogo.json'));
assert.equal(data.version,2);
assert.equal(data.sourcePdfSha256,'cdf0ffa3591edc92f2595566e7c56e4e42f99daa1c6b0d99236866846f07e199');
assert.deepEqual([data.pdfPageCount,data.links,data.externalLinks,data.internalLinks],[198,7762,4104,3658]);
assert.deepEqual([data.atlasCount,data.exampleCount,data.characterCount,data.strokeSteps],[410,820,164,1157]);
assert.equal(data.toc.length,176);
assert.equal(data.atlas.length,410);assert.equal(data.characters.length,164);
assert.deepEqual(data.atlas.map(e=>e.id),Array.from({length:410},(_,i)=>i+1));
assert.deepEqual(data.characters.map(e=>e.id),Array.from({length:164},(_,i)=>i+1));
assert.ok(data.atlas.every(e=>e.examples.length===2&&e.ptbr&&e.ajuste&&e.audio));
assert.ok(data.characters.every(e=>e.hanzi&&e.pinyin&&e.listen&&e.animate));
assert.equal(data.characters.reduce((a,s)=>a+s.n,0),1157);
let pages=[],links=0,ext=0,int=0;
for(const f of data.pageParts){const bytes=rd(f.file);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),f.sha256,'arquivo alterado: '+f.file);const section=JSON.parse(bytes);assert.deepEqual(section.pages.map(p=>p.p),f.pages,'páginas de '+f.file);pages.push(...section.pages)}
assert.deepEqual(pages.map(p=>p.p),Array.from({length:198},(_,i)=>i+1),'Todas as 198 páginas estão presentes na sequência exata');
for(const p of pages){assert.ok(p.text.length>100,'conteúdo textual incompleto: '+p.p);assert.ok(p.blocks.length>0,'blocos de texto ausentes: '+p.p);
 for(const l of p.links){links++;if(l.kind==='ext'){ext++;const u=new URL(l.to);assert.ok(['https:','http:'].includes(u.protocol),'destino perigoso: '+u)}else{int++;assert.ok(Number.isInteger(l.to)&&l.to>=1&&l.to<=198,'destino interno inválido') }}
 for(const b of p.blocks)for(const line of b.lines)for(const [text,index] of line){assert.equal(typeof text,'string');if(index!==null)assert.ok(p.links.some(x=>x.i===index),'link inline não existe na anotação original');}
}
assert.deepEqual([links,ext,int],[7762,4104,3658]);
let images=0;
for(const f of data.visualParts){const bytes=rd(f.file);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),f.sha256,'imagem alterada '+f.file);const data=JSON.parse(bytes);assert.deepEqual(Object.keys(data.images).map(Number),f.pages);for(const b64 of Object.values(data.images)){const im=Buffer.from(b64,'base64');assert.equal(im.subarray(0,4).toString(),'RIFF','não é arquivo WebP');assert.equal(im.subarray(8,12).toString(),'WEBP');images++}}
assert.equal(images,85,'84 pranchas + matriz final devem estar presentes');
assert.equal(fs.existsSync('manual-assets.json'),false,'PDF fragmentado ainda disponível');
assert.equal(fs.existsSync('manual-index.json'),false,'índice antigo do PDF ainda disponível');
for(let i=1;i<=8;i++)assert.equal(fs.existsSync('assets/manual/parte-'+String(i).padStart(2,'0')+'.bin'),false,'fragmento PDF antigo');
const html=rd('manual.html').toString(),app=rd('manual-web.js').toString();
assert.match(html,/<main id="conteudo"/);assert.match(html,/manual-web\.js/);assert.match(html,/manual-web\.css/);
assert.ok(!html.includes('manualFrame')&&!html.includes('application\/pdf'),'leitor PDF antigo no site');
assert.ok(!app.includes('buildPDF')&&!app.includes('createObjectURL'),'montagem de PDF no app');
assert.ok(html.includes('estudar.html')&&html.includes('laboratorio.html')&&html.includes('avaliacao.html'));
console.log(JSON.stringify({ok:true,nativeHtml:true,pages:198,links,ext,int,atlas:410,examples:820,characters:164,strokeSteps:1157,visuals:images,sourceSha256Verified:true}));
