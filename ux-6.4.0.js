(() => {
  'use strict';

  const VERSION = '6.4.0';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const GROUP_ROUTE = {
    orientacao: { route: null, sections: ['inicio', 'progresso', 'painel', 'cobertura'] },
    base: { route: 'fundamentos', sections: ['fundamentos', 'tracos-fundamentais', 'regras', 'estruturas', 'pronuncia', 'treinador', 'jornada', 'vocabulario', 'gramatica-300', 'escuta', 'revisao', 'prova-300', 'proporcao', 'variantes', 'erros-comuns', 'metodo-estudo', 'pratica'] },
    integral: { route: 'programa-integral', sections: ['programa-integral', 'mapa-etapas', 'unidades-integrais', 'atlas-integral', 'laboratorio-integral', 'vocabulario-integral', 'silabas-integral', 'gramatica-integral', 'competencias-integral', 'revisao-integral', 'prova-integral'] },
    imersao: { route: 'pos-padrao', sections: ['pos-padrao', 'imersao-aberta', 'lexico-pos', 'expressoes-pos', 'pragmatica-pos', 'leituras-pos', 'missoes-pos'] },
    evidencia: { route: 'validacao-v6', sections: ['validacao-v6', 'benchmark-v6', 'matriz-v6', 'plano-v6', 'dominio-real'] },
    referencia: { route: 'novidades', sections: ['fontes', 'novidades', 'encerramento'] }
  };

  let activeVisualSection = null;
  let scrollFrame = 0;

  function enhanceHeader() {
    const header = $('.topbar');
    const brand = $('.brand', header);
    const version = $('.version-badge', header);
    const nav = $('.desktop-nav', header);
    const actions = $('.top-actions', header);
    if (!header || !brand || !nav || !actions) return;

    if (!header.querySelector('.ux64-brand-cluster')) {
      const cluster = document.createElement('div');
      cluster.className = 'ux64-brand-cluster';
      cluster.setAttribute('aria-label', 'Identidade e versão do curso');
      header.insertBefore(cluster, brand);
      cluster.append(brand);
      if (version) cluster.append(version);
    }

    const cluster = header.querySelector('.ux64-brand-cluster');
    if (cluster && !cluster.querySelector('.ux64-preview-badge')) {
      const preview = document.createElement('span');
      preview.className = 'ux64-preview-badge';
      preview.setAttribute('aria-label', 'Interface visual UX 6.4 ativa');
      preview.innerHTML = '<strong>UX 6.4</strong><small>live</small>';
      cluster.append(preview);
    }

    header.dataset.ux64Header = 'unified';
    header.dataset.ux64Visual = 'distinct';
    nav.dataset.ux64Nav = 'course';
    actions.dataset.ux64Actions = 'utilities';
    $$('.desktop-nav a', header).forEach(link => {
      const id = link.getAttribute('href')?.replace(/^#/, '');
      if (id) link.dataset.ux64Target = id;
    });

    const labels = {
      uxCommandButton: 'Buscar no curso',
      soundToggle: 'Som',
      fontButton: 'Texto',
      themeButton: 'Tema',
      menuButton: 'Menu'
    };
    Object.entries(labels).forEach(([id, label]) => {
      const control = document.getElementById(id);
      if (control) control.dataset.ux64Utility = label;
    });
  }

  function routeForSection(id) {
    if (!id) return null;
    const direct = document.querySelector(`.desktop-nav a[href="#${CSS.escape(id)}"]`);
    if (direct) return id;
    for (const group of Object.values(GROUP_ROUTE)) {
      if (group.sections.includes(id)) return group.route;
    }
    return null;
  }

  function updateHeaderNavigation(id) {
    const route = routeForSection(id);
    const nav = $('.desktop-nav');
    if (!nav) return;
    const links = $$('.desktop-nav a', nav);
    links.forEach(link => {
      const current = Boolean(route && link.dataset.ux64Target === route);
      link.classList.toggle('is-current', current);
      if (current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });

    const current = links.find(link => link.classList.contains('is-current'));
    if (current && nav.scrollWidth > nav.clientWidth) {
      const targetLeft = current.offsetLeft - (nav.clientWidth - current.offsetWidth) / 2;
      nav.scrollTo({ left: Math.max(0, targetLeft), behavior: 'auto' });
    }
  }

  function observeSections() {
    const sections = $$('[data-ux-section]');
    if (!sections.length || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top));
      if (!visible.length) return;
      const id = visible[0].target.id;
      if (!id || id === activeVisualSection) return;
      activeVisualSection = id;
      document.documentElement.dataset.ux64Section = id;
      updateHeaderNavigation(id);
    }, { rootMargin: '-20% 0px -68% 0px', threshold: [0, 0.01] });
    sections.forEach(section => observer.observe(section));
  }

  function syncScrollState() {
    scrollFrame = 0;
    document.documentElement.classList.toggle('ux64-scrolled', window.scrollY > 18);
  }

  function setupScrollState() {
    syncScrollState();
    window.addEventListener('scroll', () => {
      if (scrollFrame) return;
      scrollFrame = window.requestAnimationFrame(syncScrollState);
    }, { passive: true });
  }

  function setupDockBreakpoint() {
    const query = window.matchMedia('(max-width: 820px)');
    const closeLegacyMenu = () => {
      if (!query.matches) return;
      const nav = $('#mobileNav');
      const button = $('#menuButton');
      if (nav) nav.hidden = true;
      if (button) button.setAttribute('aria-expanded', 'false');
    };
    closeLegacyMenu();
    query.addEventListener?.('change', closeLegacyMenu);
  }

  function alignContext() {
    const context = $('#uxContextBar');
    if (context) context.dataset.ux64Context = 'integrated';
    const dock = $('#uxMobileDock');
    if (dock) dock.dataset.ux64Dock = 'refined';
    const command = $('#uxCommandDialog');
    if (command) command.dataset.ux64Command = 'refined';
    const drawer = $('#uxJourneyDrawer');
    if (drawer) drawer.dataset.ux64Drawer = 'refined';
  }

  function init() {
    if (document.documentElement.dataset.ux64Runtime === VERSION) return;
    document.documentElement.dataset.ux64Runtime = VERSION;
    document.documentElement.dataset.ux64VisualRevision = '2';
    document.documentElement.classList.add('ux64-ready');
    document.body.classList.add('ux64-body');
    enhanceHeader();
    alignContext();
    setupDockBreakpoint();
    observeSections();
    setupScrollState();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    window.requestAnimationFrame(init);
  }
})();
