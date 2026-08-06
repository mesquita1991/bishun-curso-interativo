import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd());
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const html = read('index.html');
const ux = read('ux-6.3.0.js');
const uxCss = read('ux-6.3.0.css');
const mastery = read('mastery-v6.js');

const requiredIds = ['inicio','progresso','painel','fundamentos','tracos-fundamentais','estruturas','treinador','programa-integral','mapa-etapas','atlas-integral','pos-padrao','imersao-aberta','validacao-v6','proporcao','variantes','erros-comuns','metodo-estudo','pratica','novidades','encerramento'];
const requiredScripts = ['app.js','course.js','full-course.js','post-standard.js','mastery-v6.js','ux-6.3.0.js'];
const sectionTags = [...html.matchAll(/<section\b[^>]*>/g)].map(match => match[0]);
const sectionIds = sectionTags.map(tag => tag.match(/\bid="([^"]+)"/)?.[1]).filter(Boolean);
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
const skipLinks = [...html.matchAll(/<a\b[^>]*href="#conteudo"[^>]*>Pular para o conteúdo<\/a>/g)];
const groupsBlock = ux.match(/const GROUPS = \[([\s\S]*?)\n  \];/)?.[1] || '';
const groupedIds = [...groupsBlock.matchAll(/sections:\s*\[([^\]]*)\]/g)]
  .flatMap(match => [...match[1].matchAll(/'([^']+)'/g)].map(item => item[1]));
const groupedUnique = [...new Set(groupedIds)];
const observerBlock = ux.match(/function setupScrollSpy\(\) \{([\s\S]*?)\n  \}\n\n  function setupEvents/)?.[1] || '';

assert(sectionTags.length === 47, `Esperadas 47 seções curriculares; encontradas ${sectionTags.length}.`);
assert(sectionIds.length === sectionTags.length, `Todas as 47 seções precisam de ID estável; encontradas ${sectionIds.length}.`);
assert(new Set(sectionIds).size === 47, 'IDs de seção precisam ser únicos.');
requiredIds.forEach(id => assert(sectionIds.includes(id), `ID obrigatório ausente: ${id}`));
requiredScripts.forEach(file => assert(html.includes(file), `Script obrigatório ausente no HTML: ${file}`));
assert(html.includes('ux-6.3.0.css'), 'Folha UX não referenciada.');
assert(skipLinks.length === 1, `Deve existir um único link de salto; encontrados ${skipLinks.length}.`);
assert(!html.includes('class="ux-skip-link"'), 'Link de salto duplicado da camada UX não foi removido.');
assert(html.includes('<main id="conteudo">'), 'Destino do link de salto ausente.');
assert(duplicates.length === 0, `IDs duplicados: ${[...new Set(duplicates)].join(', ')}`);

assert(groupedIds.length === 47, `O mapa deve enumerar 47 seções; enumera ${groupedIds.length}.`);
assert(groupedUnique.length === 47, 'O mapa contém IDs repetidos.');
sectionIds.forEach(id => assert(groupedUnique.includes(id), `Seção fora do mapa e da busca: ${id}`));
groupedUnique.forEach(id => assert(sectionIds.includes(id), `Destino do mapa não existe no HTML: ${id}`));
assert(ux.includes('${existingSections().length} seções organizadas por objetivo.'), 'Contador do mapa deve refletir a cobertura real.');

assert(observerBlock.includes('if (manualScrollIntent)'), 'Scroll-spy deve preservar o destino salvo durante a sincronização inicial.');
assert(observerBlock.indexOf('if (manualScrollIntent)') < observerBlock.indexOf('state.lastSection = id'), 'Persistência do scroll-spy precisa ocorrer somente após intenção manual.');
assert(ux.includes('manualScrollIntent = false;'), 'Navegação programática deve desarmar persistência intermediária do scroll-spy.');
assert(ux.includes("window.matchMedia('(prefers-reduced-motion: reduce)')"), 'Preferência de movimento reduzido não consultada no JavaScript.');
assert(ux.includes("behavior: smooth ? 'smooth' : 'auto'"), 'Rolagem programática não respeita movimento reduzido.');
assert(uxCss.includes('@media (prefers-reduced-motion: reduce)'), 'Fallback CSS de movimento reduzido ausente.');

assert(!mastery.includes('document.documentElement.dataset.masteryVersion'), 'Regressão crítica: atributo de runtime colide com seletor visual do mastery.');
assert(mastery.includes('dataset.masteryRuntime'), 'Proteção de runtime do mastery ausente.');
assert(!ux.includes("$$('[data-ux-runtime]')"), 'Regressão crítica: o elemento HTML não pode ser alvo de textContent da UX.');
assert(ux.includes('dataset.uxRuntime'), 'Marcador isolado de runtime UX ausente.');
assert(!ux.includes('<section class="ux-drawer-group"'), 'Grupos do mapa não podem inflar a contagem de seções curriculares.');
assert(ux.includes('<div class="ux-drawer-group"'), 'Estrutura neutra dos grupos do mapa ausente.');
assert(uxCss.includes('overflow-x: clip'), 'Proteção contra rolagem horizontal ausente.');
assert(fs.existsSync(path.join(root,'ux-6.3.0.css')), 'Asset CSS UX 6.3 ausente.');

console.log(JSON.stringify({ ok: true, sectionCount: sectionTags.length, mappedSections: groupedUnique.length, skipLinks: skipLinks.length, uniqueIds: ids.length, requiredScripts: requiredScripts.length, uxVersion: '6.3.0' }, null, 2));
