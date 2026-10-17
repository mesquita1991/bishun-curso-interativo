import fs from 'node:fs';import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(p,'utf8');
const version=JSON.parse(read('package.json')).version,log=JSON.parse(read('atualizacoes.json'));
assert.equal(version,'8.1.0');assert.equal(log.current,version);assert.equal(log.entries[0].version,version);
assert.equal(JSON.parse(read('release-manifest.json')).version,version);
const pages=['index.html','estudar.html','manual.html','mapa.html','aulas.html','base.html','avaliacao.html','laboratorio.html','catalogo.html','imersao.html','validacao.html','historico.html',...Array.from({length:9},(_,i)=>'etapa-'+(i+1)+'.html')];
for(const p of pages){const html=read(p);assert.ok(html.includes('plataforma.js?v=8.1.0'),p+' sem script de versão');assert.ok(html.includes('plataforma.css?v=8.1.0'),p+' sem estilo comum');}
const src=read('manual-web.js');for(const s of ['renderStudyBridge','manualBridgeStudy','bishunManualV8','busca','studyUrl(studyContext())'])assert.ok(src.includes(s),'Manual sem ponte: '+s);
const study=read('estudar.js');assert.ok(study.includes('unitManualLinks'));assert.ok(study.includes('manual.html?secao=atlas'));
assert.ok(read('historico.html').includes('id="releaseHistory"'));assert.ok(read('sitemap.xml').includes('/historico.html'));
const gate=read('.github/workflows/ux681-gate.yml');assert.ok(gate.includes('recent <= 3'));assert.ok(gate.includes('60000'));assert.ok(gate.includes('needs.fast.outputs.proceed'));assert.ok(gate.includes('cancel-in-progress: true'));
const m=JSON.parse(read('manual-catalogo.json'));assert.deepEqual([m.pdfPageCount,m.links,m.atlasCount,m.characterCount,m.strokeSteps],[198,7762,410,164,1157]);
console.log(JSON.stringify({ok:true,version,pages:pages.length,manualLinks:m.links,manualPages:m.pdfPageCount,releaseEntries:log.entries.length,rateGate:3}));
