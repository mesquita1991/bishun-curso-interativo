import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd());
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const js = read('ux-6.5.0.js');
const css = read('ux-6.5.0.css');
const manifest = JSON.parse(read('manifest.webmanifest'));
const pkg = JSON.parse(read('package.json'));
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const sectionIds = [...html.matchAll(/<section\s+id="([^"]+)"/g)].map(match => match[1]);
const allIds = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
assert(sectionIds.length === 47, `Esperadas 47 seções; encontradas ${sectionIds.length}.`);
assert(new Set(allIds).size === allIds.length, 'IDs estáticos duplicados no HTML.');
assert(html.includes('ux-6.4.0.css?v=6.4.0') && html.includes('ux-6.5.0.css?v=6.5.0'), 'Cadeia CSS 6.4 → 6.5 incompleta.');
assert(html.indexOf('ux-6.4.0.css?v=6.4.0') < html.indexOf('ux-6.5.0.css?v=6.5.0'), 'UX 6.5 CSS deve carregar após 6.4.');
assert(html.includes('ux-6.4.0.js?v=6.4.0') && html.includes('ux-6.5.0.js?v=6.5.0'), 'Cadeia JS 6.4 → 6.5 incompleta.');
assert(html.indexOf('ux-6.4.0.js?v=6.4.0') < html.indexOf('ux-6.5.0.js?v=6.5.0'), 'UX 6.5 JS deve carregar após 6.4.');
assert(html.includes('mastery-v6.js?v=6.2.3-c711049'), 'Referência crítica do mastery foi alterada.');
assert(html.includes('rel="canonical" href="https://mesquita1991.github.io/bishun-curso-interativo/"'), 'Canonical de produção ausente.');
assert(html.includes('rel="preconnect" href="https://cdn.jsdelivr.net"'), 'Preconnect para a única origem externa ausente.');
assert(html.includes('name="color-scheme" content="light dark"'), 'Color scheme explícito ausente.');
assert(html.includes('name="robots" content="index,follow,max-image-preview:large"'), 'Robots meta ausente.');

assert(js.includes("const VERSION = '6.5.0'"), 'Runtime 6.5 não versionado.');
assert(js.includes('dataset.ux65Runtime = VERSION'), 'Marcador isolado ux65 ausente.');
assert(js.includes("id = 'ux65StageRail'"), 'Rail de macro-orientação ausente.');
assert(js.includes('data-ux65-group'), 'Estados semânticos do rail ausentes.');
assert(js.includes('MutationObserver'), 'Sincronização com estado visual anterior ausente.');
assert(js.includes('ux65-scroll-region'), 'Aprimoramento de tabelas roláveis ausente.');
assert(js.includes('try { return decodeURIComponent(raw); }') && js.includes('catch { return raw; }'), 'Fragmentos malformados precisam ser preservados como não-match sem abortar a 6.5.');
assert(js.includes('new ResizeObserver(scheduleTableEnhancement)'), 'Overflow tabular precisa reagir a mudanças de tamanho.');
assert(js.includes("window.addEventListener('resize', scheduleTableEnhancement"), 'Fallback explícito de resize para tabelas ausente.');
assert(js.includes("region.removeAttribute('tabindex')") && js.includes("region.removeAttribute('role')") && js.includes("region.removeAttribute('aria-label')"), 'Semântica adicionada pela 6.5 precisa ser removida quando o overflow termina.');
assert(!js.includes('localStorage'), 'UX 6.5 não deve escrever estado persistente.');
assert(!js.includes('history.pushState') && !js.includes('history.replaceState'), 'UX 6.5 não deve modificar histórico.');
assert(!js.includes('preventDefault('), 'UX 6.5 não deve interceptar navegação nativa.');
assert(!js.includes('textContent = VERSION'), 'UX 6.5 não deve reescrever marcadores de versão genéricos.');

assert(css.includes('.ux65-stage-rail'), 'Rail visual 6.5 ausente.');
assert(css.includes('@media (max-width: 1400px)') && !css.includes('@media (max-width: 1320px)'), 'Rail deve permanecer oculto até haver margem segura ao lado da shell de 1220 px.');
assert(!css.includes('.ux65-ready .coverage-card,') && !css.includes('.ux65-ready .principle-card,'), 'Cards especializados com foreground claro não podem receber o fundo genérico quase branco da 6.5.');
assert(css.includes('html[data-theme="dark"].ux65-ready .principle-card { background: #9d2929; }'), 'Principle card escuro precisa manter fundo com contraste AA para texto branco.');
assert(css.includes('@media (prefers-contrast: more)'), 'Modo de contraste reforçado ausente.');
assert(css.includes('@media (forced-colors: active)'), 'Forced colors ausente.');
assert(css.includes('@media (prefers-reduced-motion: reduce)'), 'Reduced motion ausente.');
assert(css.includes('body.ux-body.ux64-body.ux65-body { padding-bottom: calc(82px + env(safe-area-inset-bottom)); }'), 'Override móvel 6.5 precisa vencer a cascata 6.4 e incluir safe-area.');
assert(css.includes('html.ux65-ready { scrollbar-gutter: auto; }'), 'Mobile deve devolver a largura integral do viewport.');
assert(css.includes('.ux65-scroll-region'), 'Tratamento visual de tabelas roláveis ausente.');
assert(css.includes('.version-badge,') && css.includes('.ux64-preview-badge'), 'Sinais de versão concorrentes não foram neutralizados visualmente.');

assert(manifest.theme_color === '#071126', 'Manifest não acompanha a identidade 6.5.');
assert(manifest.background_color === '#f4f7fc', 'Background do manifest não acompanha a 6.5.');
assert(manifest.id === './', 'Manifest sem ID estável.');
assert(pkg.version === '6.5.0', 'package.json não foi promovido para 6.5.0.');
assert(pkg.scripts.check.includes('core-integrity-check.mjs') && pkg.scripts.check.includes('ux-6.5-regression-check.mjs'), 'npm check não cobre integridade + UX 6.5.');

console.log(JSON.stringify({
  ok: true,
  sectionCount: sectionIds.length,
  uniqueStaticIds: allIds.length,
  additiveAfter64: true,
  productionMetadata: true,
  stageRail: true,
  safeRailBreakpoint: true,
  specializedCardContrastPreserved: true,
  darkPrincipleContrastAA: true,
  scrollableTables: true,
  malformedHashGuard: true,
  responsiveTableSemantics: true,
  accessibilityModes: true,
  safeArea: true,
  noPersistenceWrites: true,
  noHistoryWrites: true,
  noNavigationInterception: true,
  ux65Version: '6.5.0'
}, null, 2));
