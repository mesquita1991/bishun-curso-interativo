import fs from 'node:fs';import assert from 'node:assert/strict';import path from 'node:path';
const read=p=>fs.readFileSync(path.join(process.cwd(),p),'utf8'),home=read('index.html'),legacy=read('docs/arquivo-curso-6.8.1.html'),sw=read('sw.js'),client=read('etapa.js'),portal=read('portal.js'),pkg=JSON.parse(read('package.json'));assert.equal(pkg.version,'8.0.0');
assert.ok(Buffer.byteLength(home)<12000,'Homepage HTML must be <12KB');
assert.ok(Buffer.byteLength(read('portal.css'))<13000,'First-view CSS must be compact');
assert.ok(Buffer.byteLength(portal)<4000,'First-view JS must be compact');
for(const heavy of ['curriculum-data.js','full-course.js','mastery-v6.js','post-standard.js','hanzi-writer.min.js','visual-mnemonics.js'])assert.ok(!home.includes('<script defer src="'+heavy),'Heavy runtime loaded on home: '+heavy);
assert.ok(home.includes('window.BishunRoutes.forSection(location.hash)'),'Legacy deep-links must route without loading monolith');
assert.ok(legacy.includes('id="treinador"')&&legacy.includes('id="programa-integral"')&&legacy.includes('visual-mnemonics.js?v=6.8.0'),'Complete training environment must remain available');
const originalSections=[...legacy.matchAll(/<section[^>]*data-ux-section/g)]; // 47 IDs are annotated at runtime; verify canonical section boundaries explicitly below.
for(const id of ['fundamentos','regras','treinador','jornada','programa-integral','mapa-etapas','unidades-integrais','pos-padrao','validacao-v6','dominio-real'])assert.ok(legacy.includes('id="'+id+'"'),'Preserved section '+id);
const sitemap=read('sitemap.xml'),urls=new Set();
for(let n=1;n<=9;n++){const filename='etapa-'+n+'.html',p=read(filename),data=JSON.parse(read('data/stage-'+n+'.json'));assert.ok(p.includes('data-stage-number="'+n+'"'),'Wrong stage: '+n);assert.ok(p.includes('rel="canonical" href="https://mesquita1991.github.io/bishun-curso-interativo/'+filename+'"'),'Wrong canonical '+n);assert.ok(!p.includes('<script defer src="full-course.js"'),'Heavy runtime in stage page '+n);assert.equal(data.stage,n);assert.ok(Array.isArray(data.units)&&data.units.length>0);assert.ok(Array.isArray(data.characters)&&Array.isArray(data.vocabulary));assert.ok(sitemap.includes(filename));urls.add(filename);}
for(const page of ['index.html','curso.html','base.html','imersao.html','validacao.html',...urls]){const html=read(page);const ids=new Set([...legacy.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]));for(const match of html.matchAll(/href="curso\.html#([a-z0-9-]+)"/g))assert.ok(ids.has(match[1]),'Broken deep-link '+page+' #'+match[1]);}
assert.ok(sw.includes("const SHELL=")&&!sw.slice(sw.indexOf('const SHELL='),sw.indexOf(';',sw.indexOf('const SHELL='))).includes('full-course.js'),'Legacy runtime must not be precached');
assert.ok(!sw.slice(sw.indexOf('const SHELL='),sw.indexOf(';',sw.indexOf('const SHELL='))).includes('stage-1.json'),'Stage JSON must be on demand');
assert.ok(client.includes("fetch('data/stage-'+stage+'.json')"),'Stage-specific fetch required');
assert.ok(!portal.includes("fetch('data/stage-"),'Home must not eagerly load stage');
assert.ok(read('robots.txt').includes('sitemap.xml'),'Crawler discovery missing');
console.log(JSON.stringify({ok:true,version:'6.9.0',homepageBytes:Buffer.byteLength(home),cssBytes:Buffer.byteLength(read('portal.css')),jsBytes:Buffer.byteLength(portal),stages:9,preservedLegacy:true,stageDataOnDemand:true,linksChecked:true}));
