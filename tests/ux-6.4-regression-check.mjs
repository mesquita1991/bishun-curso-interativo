import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd());
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const html = read('index.html');
const css = read('ux-6.4.0.css');
const js = read('ux-6.4.0.js');
const baseUx = read('ux-6.3.0.js');

const sectionTags = [...html.matchAll(/<section\b[^>]*>/g)].map(match => match[0]);
const sectionIds = sectionTags.map(tag => tag.match(/\bid="([^"]+)"/)?.[1]).filter(Boolean);
const coreScripts = ['app.js', 'course.js', 'full-course.js', 'post-standard.js', 'mastery-v6.js'];

assert(sectionTags.length === 47, `Esperadas 47 seções; encontradas ${sectionTags.length}.`);
assert(sectionIds.length === 47 && new Set(sectionIds).size === 47, 'As 47 seções precisam manter IDs únicos.');
assert(html.includes('ux-6.3.0.css?v=6.3.0'), 'A folha UX 6.3 deve continuar como base.');
assert(html.includes('ux-6.4.0.css?v=6.4.0-preview'), 'A folha UX 6.4 não está carregada.');
assert(html.indexOf('ux-6.3.0.css?v=6.3.0') < html.indexOf('ux-6.4.0.css?v=6.4.0-preview'), 'UX 6.4 CSS deve carregar após a 6.3.');
assert(html.includes('ux-6.3.0.js?v=6.3.0'), 'O runtime UX 6.3 deve continuar carregado.');
assert(html.includes('ux-6.4.0.js?v=6.4.0-preview'), 'O runtime UX 6.4 não está carregado.');
assert(html.indexOf('ux-6.3.0.js?v=6.3.0') < html.indexOf('ux-6.4.0.js?v=6.4.0-preview'), 'UX 6.4 JS deve carregar após a 6.3.');
coreScripts.forEach(file => assert(html.includes(file), `Script central ausente: ${file}`));
assert(html.includes('mastery-v6.js?v=6.2.3-c711049'), 'A referência crítica do mastery precisa permanecer intacta.');

assert(js.includes("const VERSION = '6.4.0'"), 'Versão do runtime 6.4 ausente.');
assert(js.includes("dataset.ux64Runtime = VERSION"), 'Marcador isolado do runtime 6.4 ausente.');
assert(js.includes("className = 'ux64-brand-cluster'"), 'Agrupamento coerente de marca+versão ausente.');
assert(js.includes("aria-current', 'location'"), 'Estado semântico da navegação ativa ausente.');
assert(js.includes('IntersectionObserver'), 'Realce visual de seção ativa ausente.');
assert(js.includes("classList.toggle('ux64-scrolled'"), 'Estado visual do header durante rolagem ausente.');
assert(!js.includes('localStorage'), 'UX 6.4 não pode escrever ou ler progresso persistido.');
assert(!js.includes('history.pushState') && !js.includes('history.replaceState'), 'UX 6.4 não pode alterar o histórico.');
assert(!js.includes('location.hash'), 'UX 6.4 não pode controlar hash.');
assert(!js.includes('preventDefault('), 'UX 6.4 não pode sequestrar navegação existente.');
assert(!js.includes('scrollIntoView('), 'UX 6.4 não pode gerar saltos verticais de página.');

assert(css.includes('grid-template-columns: auto minmax(280px, 1fr) auto'), 'Header unificado em três grupos ausente.');
assert(css.includes('.ux64-brand-cluster'), 'Estilo do cluster de identidade ausente.');
assert(css.includes('.desktop-nav a.is-current'), 'Estado ativo do trilho de navegação ausente.');
assert(css.includes('position: absolute') && css.includes('height: 2px'), 'Progresso integrado na borda da context bar ausente.');
assert(css.includes('@media (max-width: 1080px)'), 'Breakpoint intermediário do header ausente.');
assert(css.includes('@media (max-width: 820px)'), 'Breakpoint móvel do header ausente.');
assert(css.includes('.menu-button { display: none !important; }'), 'Menu duplicado deve ser ocultado apenas quando o dock móvel já existe.');
assert(css.includes('@media (prefers-reduced-motion: reduce)'), 'Fallback de movimento reduzido ausente.');
assert(!css.includes('[data-ux-section] { display: none'), 'Seções curriculares não podem ser ocultadas pela 6.4.');
assert(baseUx.includes('const GROUPS = ['), 'A arquitetura de informação 6.3 esperada não está presente.');

console.log(JSON.stringify({
  ok: true,
  sectionCount: sectionTags.length,
  coreScripts: coreScripts.length,
  additiveAfter63: true,
  headerHierarchy: true,
  activeNavigation: true,
  contextIntegration: true,
  mobileContinuity: true,
  noPersistenceWrites: true,
  noHistoryWrites: true,
  noNavigationInterception: true,
  ux64Version: '6.4.0'
}, null, 2));
