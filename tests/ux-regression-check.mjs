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

assert(observerBlock.includes('const shouldPersist = !nativeHistoryRestoreActive && (scrollSpySynchronized || manualScrollIntent)'), 'Scroll-spy deve preservar saltos posteriores sem persistir restaurações nativas.');
assert(observerBlock.indexOf('scrollSpySynchronized = true') < observerBlock.indexOf('if (id === activeSection) return'), 'A sincronização inicial deve concluir mesmo quando a primeira seção já está ativa.');
assert(observerBlock.indexOf('const shouldPersist') < observerBlock.indexOf('state.lastSection = id'), 'Persistência do scroll-spy deve usar o estado de sincronização calculado antes da atualização.');
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
assert(ux.includes('a[href^="#"]'), 'Âncoras internas existentes não são encaminhadas pela camada UX.');
assert(ux.includes('document.getElementById(hashTarget)?.dataset.uxSection'), 'Âncoras devem persistir somente destinos curriculares válidos.');
assert(ux.includes("function updateSectionHistory(id, mode = 'push')"), 'Sincronização de hash e History API ausente.');
assert(ux.includes('history.pushState(nextState'), 'Navegação explícita deve criar entrada no histórico.');
assert(ux.includes('history.replaceState(nextState'), 'Navegação inicial deve poder normalizar o histórico sem duplicação.');
assert(ux.includes("window.addEventListener('popstate'"), 'Back/Forward não restaura a seção selecionada.');
assert(ux.includes("{ history: 'none', instant: true, focus: false }"), 'Travessia do histórico não pode criar novas entradas nem roubar foco.');
assert(ux.includes('openDrawer(drawerTrigger)'), 'O drawer deve registrar o controle acionador para restaurar foco.');
assert(ux.includes('function trapDrawerFocus(event)'), 'Contenção de foco do drawer ausente.');
assert(ux.includes('drawerReturnFocus'), 'Restauração de foco do drawer ausente.');
assert(ux.includes("document.addEventListener('focusin'"), 'Proteção contra foco no plano de fundo ausente.');
assert(ux.includes('closeDrawer({ restoreFocus: false })'), 'Navegação pelo drawer não pode devolver foco ao acionador antigo.');
assert(uxCss.includes('.ux-enhanced .topbar { height: var(--ux-topbar-height); min-height: var(--ux-topbar-height); }'), 'Altura mínima móvel da topbar não acompanha a variável UX.');

assert(ux.includes('let scrollSpySynchronized = false'), 'Estado de sincronização inicial do scroll-spy ausente.');
assert(ux.includes('const shouldPersist = !nativeHistoryRestoreActive && (scrollSpySynchronized || manualScrollIntent)'), 'Scroll-spy precisa excluir restaurações nativas do estado de retomada.');
assert(ux.includes('function beginNativeHistoryRestore()'), 'Janela de restauração nativa do histórico ausente.');
assert(ux.includes('function finishNativeHistoryRestore()'), 'Finalização da restauração nativa do histórico ausente.');
assert(ux.includes("window.addEventListener('scrollend', nativeHistoryScrollEndHandler, { once: true })"), 'Restauração nativa deve permanecer bloqueada até o fim da rolagem do navegador.');
assert(ux.includes('nativeHistoryRestoreTimer = window.setTimeout(finishNativeHistoryRestore, 1200)'), 'Fallback de liberação da restauração nativa ausente.');
assert(ux.indexOf('scrollSpySynchronized = true') < ux.indexOf('if (id === activeSection) return'), 'O scroll-spy deve concluir a sincronização mesmo quando a primeira seção já está ativa.');
assert(ux.includes("window.addEventListener('hashchange', syncCurricularHash)"), 'Atribuições legadas a location.hash não são sincronizadas pela UX.');
assert(ux.includes('if (!id) {\n        beginNativeHistoryRestore();\n        return;\n      }'), 'Hashes não curriculares devem iniciar proteção contra persistência do scroll-spy.');
assert(!ux.includes("sectionIdFromHash() || 'inicio'"), 'Regressão: hashes não curriculares não podem redirecionar para início.');
assert(ux.includes('role="combobox"'), 'Campo de busca não é exposto como combobox.');
assert(ux.includes('aria-autocomplete="list"'), 'Combobox não declara autocomplete por lista.');
assert(ux.includes('aria-activedescendant'), 'Combobox não anuncia a opção ativa.');
assert(ux.includes('id="uxCommandOption-${escapeHTML(item.id)}"'), 'Resultados da busca não possuem IDs estáveis.');
assert(ux.includes("input.setAttribute('aria-expanded', 'true')"), 'Combobox não anuncia abertura da lista.');
assert(ux.includes("input?.setAttribute('aria-expanded', 'false')"), 'Combobox não anuncia fechamento da lista.');

assert(fs.existsSync(path.join(root,'ux-6.3.0.css')), 'Asset CSS UX 6.3 ausente.');

console.log(JSON.stringify({ ok: true, sectionCount: sectionTags.length, mappedSections: groupedUnique.length, skipLinks: skipLinks.length, anchorRouting: true, hashHistory: true, mobileTopbar: true, drawerFocusTrap: true, scriptedJumpSync: true, nativeHashHistory: true, nativeHistoryResumeGuard: true, commandCombobox: true, uniqueIds: ids.length, requiredScripts: requiredScripts.length, uxVersion: '6.3.0' }, null, 2));
