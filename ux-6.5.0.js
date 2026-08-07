(() => {
  'use strict';

  const VERSION = '6.5.0';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const GROUPS = [
    { id: 'orientacao', label: 'Orientação', short: 'Início', icon: '◎', target: 'inicio', sections: ['inicio','progresso','painel','cobertura'] },
    { id: 'base', label: 'Base 300', short: 'Base', icon: '基', target: 'fundamentos', sections: ['fundamentos','tracos-fundamentais','regras','estruturas','pronuncia','treinador','jornada','vocabulario','gramatica-300','escuta','revisao','prova-300','proporcao','variantes','erros-comuns','metodo-estudo','pratica'] },
    { id: 'integral', label: 'Programa integral', short: 'Integral', icon: '全', target: 'programa-integral', sections: ['programa-integral','mapa-etapas','unidades-integrais','atlas-integral','laboratorio-integral','vocabulario-integral','silabas-integral','gramatica-integral','competencias-integral','revisao-integral','prova-integral'] },
    { id: 'imersao', label: 'Imersão real', short: 'Imersão', icon: '实', target: 'imersao-aberta', sections: ['pos-padrao','imersao-aberta','lexico-pos','expressoes-pos','pragmatica-pos','leituras-pos','missoes-pos'] },
    { id: 'evidencia', label: 'Domínio e evidência', short: 'Domínio', icon: '证', target: 'validacao-v6', sections: ['validacao-v6','benchmark-v6','matriz-v6','plano-v6','dominio-real'] },
    { id: 'referencia', label: 'Referência', short: 'Mais', icon: '＋', target: 'fontes', sections: ['fontes','novidades','encerramento'] }
  ];

  let scrollFrame = 0;
  let tableFrame = 0;

  function currentSection() {
    const observed = document.documentElement.dataset.ux64Section;
    if (observed) return observed;
    const raw = location.hash ? location.hash.slice(1) : '';
    if (!raw) return 'inicio';
    try { return decodeURIComponent(raw); }
    catch { return raw; }
  }

  function groupFor(sectionId) {
    return GROUPS.find(group => group.sections.includes(sectionId)) || GROUPS[0];
  }

  function enhanceIdentity() {
    const cluster = $('.ux64-brand-cluster') || $('.topbar');
    if (!cluster || $('.ux65-badge', cluster)) return;
    const badge = document.createElement('span');
    badge.className = 'ux65-badge';
    badge.setAttribute('aria-label', 'Experiência UX 6.5 ativa em produção');
    badge.innerHTML = '<strong>6.5</strong><small>experience</small>';
    cluster.append(badge);
  }

  function buildExperienceRail() {
    if ($('#ux65StageRail')) return;
    const rail = document.createElement('nav');
    rail.id = 'ux65StageRail';
    rail.className = 'ux65-stage-rail';
    rail.setAttribute('aria-label', 'Etapas principais do curso');
    rail.innerHTML = `
      <div class="ux65-rail-track">
        ${GROUPS.map(group => `<a href="#${group.target}" data-ux65-group="${group.id}" aria-label="Ir para ${group.label}"><span aria-hidden="true">${group.icon}</span><small>${group.short}</small></a>`).join('')}
      </div>
      <a class="ux65-to-top" href="#inicio" aria-label="Voltar ao início"><span aria-hidden="true">↑</span><small>Topo</small></a>`;
    document.body.append(rail);
    syncExperienceRail(currentSection());
  }

  function syncExperienceRail(sectionId) {
    const group = groupFor(sectionId);
    $$('#ux65StageRail [data-ux65-group]').forEach(link => {
      const current = link.dataset.ux65Group === group.id;
      link.classList.toggle('is-current', current);
      if (current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    const rail = $('#ux65StageRail');
    if (rail) rail.dataset.ux65Current = group.id;
    document.documentElement.dataset.ux65Group = group.id;
  }

  function observeSectionState() {
    const html = document.documentElement;
    new MutationObserver(mutations => {
      if (mutations.some(item => item.attributeName === 'data-ux64-section')) {
        syncExperienceRail(currentSection());
      }
    }).observe(html, { attributes: true, attributeFilter: ['data-ux64-section'] });
    window.addEventListener('hashchange', () => syncExperienceRail(currentSection()), { passive: true });
  }

  let tableResizeObserver = null;

  function enhanceScrollableTables(root = document) {
    $$('table', root).forEach(table => {
      const region = table.parentElement;
      if (!region || region === document.body) return;
      tableResizeObserver?.observe(table);
      tableResizeObserver?.observe(region);
      const overflow = region.scrollWidth > region.clientWidth + 2;
      region.classList.toggle('ux65-scroll-region', overflow);
      if (overflow) {
        if (!region.hasAttribute('tabindex')) {
          region.tabIndex = 0;
          region.dataset.ux65TabindexAdded = 'true';
        }
        if (!region.hasAttribute('role')) {
          region.setAttribute('role', 'region');
          region.dataset.ux65RoleAdded = 'true';
        }
        if (!region.hasAttribute('aria-label')) {
          const caption = table.querySelector('caption')?.textContent.trim();
          const heading = table.closest('section')?.querySelector('h2,h3')?.textContent.trim();
          region.setAttribute('aria-label', `Tabela rolável: ${caption || heading || 'conteúdo tabular'}`);
          region.dataset.ux65LabelAdded = 'true';
        }
        return;
      }
      if (region.dataset.ux65TabindexAdded === 'true') {
        region.removeAttribute('tabindex');
        delete region.dataset.ux65TabindexAdded;
      }
      if (region.dataset.ux65RoleAdded === 'true') {
        region.removeAttribute('role');
        delete region.dataset.ux65RoleAdded;
      }
      if (region.dataset.ux65LabelAdded === 'true') {
        region.removeAttribute('aria-label');
        delete region.dataset.ux65LabelAdded;
      }
    });
  }

  function scheduleTableEnhancement() {
    if (tableFrame) return;
    tableFrame = requestAnimationFrame(() => {
      tableFrame = 0;
      enhanceScrollableTables();
    });
  }

  function observeDynamicContent() {
    if ('ResizeObserver' in window) tableResizeObserver = new ResizeObserver(scheduleTableEnhancement);
    new MutationObserver(mutations => {
      if (mutations.some(item => item.addedNodes.length)) scheduleTableEnhancement();
    }).observe($('#conteudo') || document.body, { childList: true, subtree: true });
    window.addEventListener('resize', scheduleTableEnhancement, { passive: true });
  }

  function syncScrollState() {
    scrollFrame = 0;
    const y = window.scrollY;
    document.documentElement.classList.toggle('ux65-scrolled', y > 20);
    document.documentElement.classList.toggle('ux65-deep-scroll', y > 640);
  }

  function setupScrollState() {
    syncScrollState();
    window.addEventListener('scroll', () => {
      if (scrollFrame) return;
      scrollFrame = requestAnimationFrame(syncScrollState);
    }, { passive: true });
  }

  function syncThemeColor() {
    const meta = $('meta[name="theme-color"]');
    if (!meta) return;
    meta.content = document.documentElement.dataset.theme === 'dark' ? '#060b18' : '#071126';
  }

  function observeTheme() {
    syncThemeColor();
    new MutationObserver(syncThemeColor).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }

  function annotateExperience() {
    const context = $('#uxContextBar');
    if (context) context.dataset.ux65Surface = 'context';
    const dock = $('#uxMobileDock');
    if (dock) dock.dataset.ux65Surface = 'dock';
    const command = $('#uxCommandDialog');
    if (command) command.dataset.ux65Surface = 'command';
    const drawer = $('#uxJourneyDrawer');
    if (drawer) drawer.dataset.ux65Surface = 'drawer';
    $$('.section-shell').forEach(section => section.dataset.ux65Surface ||= 'section');
  }

  function init() {
    if (document.documentElement.dataset.ux65Runtime === VERSION) return;
    document.documentElement.dataset.ux65Runtime = VERSION;
    document.documentElement.classList.add('ux65-ready');
    document.body.classList.add('ux65-body');
    enhanceIdentity();
    buildExperienceRail();
    annotateExperience();
    observeSectionState();
    observeTheme();
    setupScrollState();
    observeDynamicContent();
    scheduleTableEnhancement();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else requestAnimationFrame(init);
})();
