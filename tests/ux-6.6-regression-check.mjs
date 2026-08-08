import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
const root=path.resolve(process.cwd()); const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const html=read('index.html'), js=read('ux-6.6.0.js'), css=read('ux-6.6.0.css');
const assert=(v,m)=>{if(!v)throw new Error(m)};
assert(html.includes('ux-6.6.0.css?v=6.6.0')&&html.includes('ux-6.6.0.js?v=6.6.0'),'6.6 assets missing');
assert(html.indexOf('ux-6.6.0.css')>html.indexOf('ux-6.5.0.css'),'6.6 CSS must be additive after 6.5');
assert(html.indexOf('ux-6.6.0.js')>html.indexOf('ux-6.5.0.js'),'6.6 JS must be additive after 6.5');
const ids=[...js.matchAll(/\['([a-z0-9-]+)','[^']+'\]/g)].map(m=>m[1]);
assert(ids.length===40,'guided path must contain exactly 40 essential steps'); assert(new Set(ids).size===40,'guided step IDs must be unique');
ids.forEach(id=>assert(html.includes(`id="${id}"`),`missing guided section ${id}`));
['bishunGuidedV66','bishunUxV63','startFresh','resume','pause','completeAndNext','elapsedMs','startedAt','Concluir e continuar','Parar e salvar','Continuar','data-guide-phase'].forEach(x=>assert(js.includes(x),`missing ${x}`));
assert(!js.includes('localStorage.clear('),'guided layer must never clear existing progress');
assert(!js.includes("localStorage.removeItem(UX63_KEY"),'guided layer must preserve UX 6.3 state');
assert(js.includes('a[data-guide-index]')&&js.includes('guidedStep.dataset.guideIndex'),'guided-step click sync missing');
assert(js.includes('syncFromLegacyNavigation')&&js.includes('MutationObserver'),'legacy navigation sync missing');
assert(js.includes('if(state.paused || !state.startedAt) state.startedAt=Date.now()'),'running clock preservation missing');
assert(css.includes('#uxLaunchpad')&&css.includes('#ux65StageRail'),'competing legacy navigation must be visually retired'); assert(js.includes('pagehide'),'session stop persistence missing'); assert(js.includes('Explorar mapa')&&js.includes('Progresso')&&js.includes('Fontes'),'support access missing');
assert(!css.includes('\\n.ux66-ready'),'escaped CSS newline literal present');
assert(css.includes('env(safe-area-inset-bottom)'),'safe area missing'); assert(css.includes('prefers-reduced-motion'),'reduced motion missing');
const release=JSON.parse(read('release-manifest.json'));
assert(release.version==='6.6.0','release manifest version mismatch');
assert(release.rollbackLayer?.includes('ux-6.6.0.js?v=6.6.0')&&release.rollbackLayer?.includes('ux-6.6.0.css?v=6.6.0'),'rollback layer must be 6.6');
for(const p of ['index.html','package.json','ux-6.6.0.js','ux-6.6.0.css','tests/ux-6.6-regression-check.mjs','docs/QA_UI_UX_6_6.md','docs/UI_UX_UPGRADE_6_6.md']){
  const body=read(p), entry=release.files.find(x=>x.path===p); assert(entry,`release inventory missing ${p}`);
  assert(entry.bytes===Buffer.byteLength(body),`release bytes stale for ${p}`);
  assert(entry.sha256===crypto.createHash('sha256').update(body).digest('hex'),`release hash stale for ${p}`);
}
console.log(JSON.stringify({ok:true,guidedSteps:ids.length,phases:4,startStop:true,preservesUx63:true,additiveAfter65:true,version:'6.6.0'},null,2));
