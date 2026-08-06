(() => {
  'use strict';

  const VERSION = '6.3.0';
  const STORAGE_KEY = 'bishunUxV63';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);

  const GROUPS = [
    {
      id: 'orientacao', label: 'Orientação', short: 'Início', icon: '◎',
      description: 'Entenda o método, veja seu progresso e escolha a próxima ação.',
      sections: ['inicio', 'progresso', 'painel', 'cobertura']
    },
    {
      id: 'base', label: 'Base 300', short: 'Base', icon: '基',
      description: 'Fundamentos, pronúncia, escrita, vocabulário e prova inicial.',
      sections: ['fundamentos', 'tracos-fundamentais', 'regras', 'estruturas', 'pronuncia', 'treinador', 'jornada', 'vocabulario', 'gramatica-300', 'escuta', 'revisao', 'prova-300', 'proporcao', 'variantes', 'erros-comuns', 'metodo-estudo', 'pratica']
    },
    {
      id: 'integral', label: 'Programa integral', short: 'Integral', icon: '全',
      description: 'Nove etapas, 3.000 caracteres, 11.092 palavras e cinco competências.',
      sections: ['programa-integral', 'mapa-etapas', 'unidades-integrais', 'atlas-integral', 'laboratorio-integral', 'vocabulario-integral', 'silabas-integral', 'gramatica-integral', 'competencias-integral', 'revisao-integral', 'prova-integral']
    },
    {
      id: 'imersao', label: 'Imersão real', short: 'Imersão', icon: '实',
      description: 'Analise textos, amplie o léxico e pratique uso contextual.',
      sections: ['pos-padrao', 'imersao-aberta', 'lexico-pos', 'expressoes-pos', 'pragmatica-pos', 'leituras-pos', 'missoes-pos']
    },
    {
      id: 'evidencia', label: 'Domínio e evidência', short: 'Domínio', icon: '证',
      description: 'Validação longitudinal, diagnóstico, matriz e plano adaptativo.',
      sections: ['validacao-v6', 'benchmark-v6', 'matriz-v6', 'plano-v6', 'dominio-real']
    },
    {
      id: 'referencia', label: 'Referência', short: 'Mais', icon: '＋',
      description: 'Fontes, histórico de versões, síntese e documentação.',
      sections: ['fontes', 'novidades', 'encerramento']
    }
  ];

  const reducedMotionQuery = typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : { matches: false };
  const scrollKeys = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ']);
  const drawerFocusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const state = loadState();
  let activeSection = state.lastSection || 'inicio';
  let commandResults = [];
  let commandIndex = 0;
  let scrollTicking = false;
  let manualScrollIntent = false;
  let scrollSpySynchronized = false;
  let drawerReturnFocus = null;

  function loadState() {
    const fallback = { lastSection: 'inicio', favorites: [], visited: ['inicio'], drawerOpen: false };
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return {
        ...fallback,
        ...parsed,
        favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
        visited: Array.isArray(parsed.visited) ? parsed.visited : ['inicio']
      };
    } catch {
      return fallback;
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function existingSections() {
    return GROUPS.flatMap(group => group.sections.map(id => {
      const element = document.getElementById(id);
      if (!element) return null;
      const heading = element.querySelector('h1, h2, h3');
      const title = heading?.textContent.trim() || element.getAttribute('aria-label') || id;
      return {
        id,
        element,
        groupId: group.id,
        groupLabel: group.label,
        groupIcon: group.icon,
        title,
        search: `${group.label} ${title} ${element.textContent.slice(0, 500)}`.toLocaleLowerCase('pt-BR')
      };
    }).filter(Boolean));
  }

  function getSection(id) {
    return existingSections().find(item => item.id === id) || existingSections()[0];
  }

  function getGroup(sectionId) {
    return GROUPS.find(group => group.sections.includes(sectionId)) || GROUPS[0];
  }

  function createButton({ id, className = '', label, icon, title }) {
    const button = document.createElement('button');
    button.type = 'button';
    if (id) button.id = id;
    button.className = className;
    button.setAttribute('aria-label', label);
    button.title = title || label;
    button.innerHTML = `<span aria-hidden="true">${icon}</span><span class="ux-visually-hidden">${escapeHTML(label)}</span>`;
    return button;
  }

  function sectionIdFromHash() {
    const raw = window.location.hash.slice(1);
    if (!raw) return null;
    let id = raw;
    try { id = decodeURIComponent(raw); } catch { /* Preserve malformed hashes as non-matches. */ }
    return document.getElementById(id)?.dataset.uxSection ? id : null;
  }

  function updateSectionHistory(id, mode = 'push') {
    if (mode === 'none' || sectionIdFromHash() === id) return;
    const url = new URL(window.location.href);
    url.hash = id;
    const currentState = history.state && typeof history.state === 'object' ? history.state : {};
    const nextState = { ...currentState, uxSection: id };
    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    if (mode === 'replace') history.replaceState(nextState, '', nextUrl);
    else history.pushState(nextState, '', nextUrl);
  }

  function navigateTo(id, options = {}) {
    const target = document.getElementById(id);
    if (!target) return;
    manualScrollIntent = false;
    activeSection = id;
    state.lastSection = id;
    if (!state.visited.includes(id)) state.visited.push(id);
    saveState();
    updateResumeTargets();
    updateActiveUI();
    updateSectionHistory(id, options.history || 'push');
    const smooth = !options.instant && !reducedMotionQuery.matches;
    target.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
    if (options.focus !== false) window.setTimeout(() => target.focus({ preventScroll: true }), smooth ? 500 : 0);
    closeDrawer({ restoreFocus: false });
    closeCommand();
  }

  function prepareDocument() {
    document.documentElement.dataset.uxRuntime = VERSION;
    document.documentElement.classList.add('ux-enhanced');
    document.body.classList.add('ux-body');

    existingSections().forEach(item => {
      item.element.dataset.uxSection = item.id;
      item.element.dataset.uxGroup = item.groupId;
      item.element.setAttribute('tabindex', '-1');
      item.element.setAttribute('aria-label', item.title);
    });

    const topActions = $('.top-actions');
    if (topActions && !$('#uxCommandButton')) {
      const command = createButton({
        id: 'uxCommandButton', className: 'icon-button ux-command-button',
        label: 'Buscar e navegar no curso', icon: '⌕', title: 'Buscar no curso (Ctrl ou ⌘ + K)'
      });
      topActions.prepend(command);
    }
  }

  function createContextBar() {
    if ($('#uxContextBar')) return;
    const bar = document.createElement('div');
    bar.id = 'uxContextBar';
    bar.className = 'ux-contextbar';
    bar.innerHTML = `
      <div class="ux-contextbar-inner">
        <button type="button" class="ux-map-trigger" id="uxMapButton" aria-haspopup="dialog" aria-controls="uxJourneyDrawer">
          <span aria-hidden="true">☷</span><span>Mapa</span>
        </button>
        <div class="ux-breadcrumb" aria-live="polite">
          <span id="uxCurrentGroup">Orientação</span><span aria-hidden="true">›</span><strong id="uxCurrentSection">Início</strong>
        </div>
        <div class="ux-page-progress" role="progressbar" aria-label="Progresso de leitura da página" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
          <span id="uxPageProgress"></span>
        </div>
        <button type="button" class="ux-favorite-current" id="uxFavoriteCurrent" aria-label="Favoritar seção atual" title="Favoritar seção atual">☆</button>
      </div>`;
    const header = $('.topbar');
    header?.insertAdjacentElement('afterend', bar);
  }

  function createLaunchpad() {
    if ($('#uxLaunchpad')) return;
    const hero = $('#inicio');
    if (!hero) return;
    const launchpad = document.createElement('div');
    launchpad.id = 'uxLaunchpad';
    launchpad.className = 'ux-launchpad section-shell';
    launchpad.setAttribute('aria-labelledby', 'uxLaunchpadTitle');
    launchpad.innerHTML = `
      <div class="ux-launchpad-head">
        <div><span class="ux-overline">Escolha seu caminho</span><h2 id="uxLaunchpadTitle">O que você precisa fazer agora?</h2></div>
        <button type="button" class="ux-text-button" data-ux-open-command>Buscar qualquer conteúdo <kbd>⌘ K</kbd></button>
      </div>
      <div class="ux-route-grid">
        <button type="button" class="ux-route-card is-primary" data-ux-route="fundamentos">
          <span class="ux-route-icon" aria-hidden="true">始</span><span><strong>Começar do zero</strong><small>Traços, regras, pronúncia e primeiras práticas.</small></span><b aria-hidden="true">→</b>
        </button>
        <button type="button" class="ux-route-card" data-ux-resume>
          <span class="ux-route-icon" aria-hidden="true">续</span><span><strong>Continuar meu progresso</strong><small id="uxResumeLabel">Retomar a última seção visitada.</small></span><b aria-hidden="true">→</b>
        </button>
        <button type="button" class="ux-route-card" data-ux-route="programa-integral">
          <span class="ux-route-icon" aria-hidden="true">全</span><span><strong>Explorar o programa integral</strong><small>Nove etapas e todo o inventário formal.</small></span><b aria-hidden="true">→</b>
        </button>
        <button type="button" class="ux-route-card" data-ux-route="imersao-aberta">
          <span class="ux-route-icon" aria-hidden="true">实</span><span><strong>Praticar com texto real</strong><small>Cole um texto e transforme lacunas em estudo.</small></span><b aria-hidden="true">→</b>
        </button>
      </div>`;
    hero.insertAdjacentElement('afterend', launchpad);
  }

  function createDrawer() {
    if ($('#uxJourneyDrawer')) return;
    const backdrop = document.createElement('div');
    backdrop.id = 'uxDrawerBackdrop';
    backdrop.className = 'ux-drawer-backdrop';
    backdrop.hidden = true;

    const drawer = document.createElement('aside');
    drawer.id = 'uxJourneyDrawer';
    drawer.className = 'ux-journey-drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-labelledby', 'uxDrawerTitle');
    drawer.setAttribute('aria-hidden', 'true');
    drawer.tabIndex = -1;
    drawer.innerHTML = `
      <div class="ux-drawer-head">
        <div><span class="ux-overline">Navegação completa</span><h2 id="uxDrawerTitle">Mapa do curso</h2><p>${existingSections().length} seções organizadas por objetivo.</p></div>
        <button type="button" class="ux-close-button" id="uxDrawerClose" aria-label="Fechar mapa">×</button>
      </div>
      <div class="ux-drawer-resume">
        <button type="button" data-ux-resume><span aria-hidden="true">▶</span><span><strong>Retomar</strong><small id="uxDrawerResumeLabel">Última seção visitada</small></span></button>
      </div>
      <nav class="ux-drawer-nav" aria-label="Mapa detalhado do curso">
        ${GROUPS.map(group => `
          <div class="ux-drawer-group" data-ux-drawer-group="${group.id}">
            <button type="button" class="ux-drawer-group-head" aria-expanded="${group.id === 'orientacao' ? 'true' : 'false'}">
              <span class="ux-group-icon" aria-hidden="true">${group.icon}</span>
              <span><strong>${escapeHTML(group.label)}</strong><small>${escapeHTML(group.description)}</small></span>
              <b>${group.sections.filter(id => document.getElementById(id)).length}</b>
            </button>
            <div class="ux-drawer-links" ${group.id === 'orientacao' ? '' : 'hidden'}>
              ${group.sections.map(id => {
                const section = getSection(id);
                return section ? `<button type="button" data-ux-jump="${id}"><span>${escapeHTML(section.title)}</span><i aria-hidden="true"></i></button>` : '';
              }).join('')}
            </div>
          </div>`).join('')}
      </nav>
      <div class="ux-drawer-favorites"><h3>Favoritos</h3><div id="uxFavoritesList"><p>Nenhuma seção favoritada.</p></div></div>`;

    document.body.append(backdrop, drawer);
  }

  function createCommandPalette() {
    if ($('#uxCommandDialog')) return;
    const dialog = document.createElement('dialog');
    dialog.id = 'uxCommandDialog';
    dialog.className = 'ux-command-dialog';
    dialog.setAttribute('aria-labelledby', 'uxCommandTitle');
    dialog.innerHTML = `
      <div class="ux-command-shell">
        <header><span aria-hidden="true">⌕</span><label id="uxCommandTitle" for="uxCommandInput">Buscar no curso</label><button type="button" id="uxCommandClose" aria-label="Fechar busca">Esc</button></header>
        <input id="uxCommandInput" type="search" role="combobox" aria-autocomplete="list" aria-haspopup="listbox" aria-expanded="false" autocomplete="off" placeholder="Ex.: pronúncia, atlas, texto real, prova…" aria-controls="uxCommandResults">
        <div class="ux-command-hints"><span>Digite para filtrar</span><span><kbd>↑</kbd><kbd>↓</kbd> navegar</span><span><kbd>Enter</kbd> abrir</span></div>
        <div id="uxCommandResults" class="ux-command-results" role="listbox" aria-label="Resultados da busca"></div>
      </div>`;
    document.body.append(dialog);
  }

  function createMobileDock() {
    if ($('#uxMobileDock')) return;
    const dock = document.createElement('nav');
    dock.id = 'uxMobileDock';
    dock.className = 'ux-mobile-dock';
    dock.setAttribute('aria-label', 'Atalhos móveis');
    dock.innerHTML = `
      <button type="button" data-ux-route="inicio"><span aria-hidden="true">⌂</span><small>Início</small></button>
      <button type="button" data-ux-resume><span aria-hidden="true">▶</span><small>Retomar</small></button>
      <button type="button" data-ux-open-command><span aria-hidden="true">⌕</span><small>Buscar</small></button>
      <button type="button" data-ux-open-drawer><span aria-hidden="true">☷</span><small>Mapa</small></button>`;
    document.body.append(dock);
  }

  function createToastRegion() {
    if ($('#uxToast')) return;
    const toast = document.createElement('div');
    toast.id = 'uxToast';
    toast.className = 'ux-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.append(toast);
  }

  function drawerIsOpen() {
    return $('#uxJourneyDrawer')?.getAttribute('aria-hidden') === 'false';
  }

  function drawerFocusable() {
    const drawer = $('#uxJourneyDrawer');
    if (!drawer) return [];
    return $$(drawerFocusableSelector, drawer).filter(element => {
      if (element.closest('[hidden]') || element.getAttribute('aria-hidden') === 'true') return false;
      const style = window.getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
  }

  function trapDrawerFocus(event) {
    if (event.key !== 'Tab' || !drawerIsOpen()) return false;
    const drawer = $('#uxJourneyDrawer');
    const focusable = drawerFocusable();
    if (!drawer || !focusable.length) {
      event.preventDefault();
      drawer?.focus();
      return true;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !drawer.contains(active))) {
      event.preventDefault();
      last.focus();
      return true;
    }
    if (!event.shiftKey && (active === last || !drawer.contains(active))) {
      event.preventDefault();
      first.focus();
      return true;
    }
    return false;
  }

  function openDrawer(opener = document.activeElement) {
    const drawer = $('#uxJourneyDrawer');
    const backdrop = $('#uxDrawerBackdrop');
    if (!drawer || !backdrop || drawerIsOpen()) return;
    closeCommand();
    drawerReturnFocus = opener && typeof opener.focus === 'function' && opener.isConnected ? opener : null;
    backdrop.hidden = false;
    requestAnimationFrame(() => document.body.classList.add('ux-drawer-open'));
    drawer.setAttribute('aria-hidden', 'false');
    state.drawerOpen = true;
    renderFavorites();
    window.setTimeout(() => ($('#uxDrawerClose') || drawerFocusable()[0] || drawer).focus(), 80);
  }

  function closeDrawer({ restoreFocus = true } = {}) {
    const drawer = $('#uxJourneyDrawer');
    const backdrop = $('#uxDrawerBackdrop');
    if (!drawer || !backdrop) return;
    const wasOpen = drawerIsOpen();
    const returnFocus = drawerReturnFocus;
    drawerReturnFocus = null;
    document.body.classList.remove('ux-drawer-open');
    drawer.setAttribute('aria-hidden', 'true');
    state.drawerOpen = false;
    window.setTimeout(() => {
      backdrop.hidden = true;
      if (wasOpen && restoreFocus && returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    }, reducedMotionQuery.matches ? 0 : 240);
  }

  function renderCommand(query = '') {
    const normalized = query.trim().toLocaleLowerCase('pt-BR');
    commandResults = existingSections().filter(item => !normalized || item.search.includes(normalized)).slice(0, 14);
    commandIndex = Math.min(commandIndex, Math.max(0, commandResults.length - 1));
    const container = $('#uxCommandResults');
    if (!container) return;
    const input = $('#uxCommandInput');
    if (!commandResults.length) {
      container.innerHTML = '<div class="ux-command-empty"><strong>Nenhum resultado</strong><span>Tente uma palavra mais ampla.</span></div>';
      input?.removeAttribute('aria-activedescendant');
      return;
    }
    container.innerHTML = commandResults.map((item, index) => `
      <button id="uxCommandOption-${escapeHTML(item.id)}" type="button" role="option" aria-selected="${index === commandIndex}" class="${index === commandIndex ? 'is-selected' : ''}" data-ux-command-index="${index}">
        <span class="ux-command-result-icon" aria-hidden="true">${escapeHTML(item.groupIcon)}</span>
        <span><strong>${escapeHTML(item.title)}</strong><small>${escapeHTML(item.groupLabel)}</small></span>
        ${state.favorites.includes(item.id) ? '<b aria-label="Favorito">★</b>' : '<i aria-hidden="true">↵</i>'}
      </button>`).join('');
    const selected = commandResults[commandIndex];
    if (selected) input?.setAttribute('aria-activedescendant', `uxCommandOption-${selected.id}`);
    else input?.removeAttribute('aria-activedescendant');
    container.querySelector('.is-selected')?.scrollIntoView({ block: 'nearest' });
  }

  function openCommand() {
    const dialog = $('#uxCommandDialog');
    if (!dialog) return;
    if (drawerIsOpen()) closeDrawer({ restoreFocus: false });
    if (typeof dialog.showModal === 'function' && !dialog.open) dialog.showModal();
    else dialog.setAttribute('open', '');
    document.body.classList.add('ux-command-open');
    const input = $('#uxCommandInput');
    input.value = '';
    input.setAttribute('aria-expanded', 'true');
    commandIndex = 0;
    renderCommand('');
    window.setTimeout(() => input.focus(), 50);
  }

  function closeCommand() {
    const dialog = $('#uxCommandDialog');
    if (!dialog) return;
    if (typeof dialog.close === 'function' && dialog.open) dialog.close();
    else dialog.removeAttribute('open');
    document.body.classList.remove('ux-command-open');
    const input = $('#uxCommandInput');
    input?.setAttribute('aria-expanded', 'false');
    input?.removeAttribute('aria-activedescendant');
  }

  function toggleFavorite(id = activeSection) {
    if (!document.getElementById(id)) return;
    if (state.favorites.includes(id)) {
      state.favorites = state.favorites.filter(item => item !== id);
      showToast('Removido dos favoritos');
    } else {
      state.favorites.unshift(id);
      showToast('Seção adicionada aos favoritos');
    }
    saveState();
    renderFavorites();
    updateActiveUI();
    renderCommand($('#uxCommandInput')?.value || '');
  }

  function renderFavorites() {
    const container = $('#uxFavoritesList');
    if (!container) return;
    const items = state.favorites.map(getSection).filter(Boolean);
    container.innerHTML = items.length ? items.map(item => `
      <div><button type="button" data-ux-jump="${item.id}"><span>${escapeHTML(item.title)}</span><small>${escapeHTML(item.groupLabel)}</small></button><button type="button" data-ux-remove-favorite="${item.id}" aria-label="Remover ${escapeHTML(item.title)} dos favoritos">×</button></div>`).join('') : '<p>Nenhuma seção favoritada.</p>';
  }

  function updateResumeTargets() {
    const item = getSection(state.lastSection) || getSection('fundamentos');
    if (!item) return;
    const label = `Retomar: ${item.title}`;
    const launch = $('#uxResumeLabel');
    const drawer = $('#uxDrawerResumeLabel');
    if (launch) launch.textContent = label;
    if (drawer) drawer.textContent = item.title;
    $$('[data-ux-resume]').forEach(button => button.dataset.uxRoute = item.id);
  }

  function updateActiveUI() {
    const item = getSection(activeSection);
    if (!item) return;
    const group = getGroup(item.id);
    const groupNode = $('#uxCurrentGroup');
    const sectionNode = $('#uxCurrentSection');
    if (groupNode) groupNode.textContent = group.label;
    if (sectionNode) sectionNode.textContent = item.title;
    const favorite = $('#uxFavoriteCurrent');
    if (favorite) {
      const isFavorite = state.favorites.includes(item.id);
      favorite.textContent = isFavorite ? '★' : '☆';
      favorite.setAttribute('aria-label', isFavorite ? 'Remover seção atual dos favoritos' : 'Favoritar seção atual');
      favorite.classList.toggle('is-favorite', isFavorite);
    }
    $$('[data-ux-jump]').forEach(button => {
      const isActive = button.dataset.uxJump === item.id;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-current', isActive ? 'location' : 'false');
      const marker = button.querySelector('i');
      if (marker) marker.classList.toggle('is-visited', state.visited.includes(button.dataset.uxJump));
    });
    $('#uxMobileDock')?.style.setProperty('--ux-active-group', `'${group.short}'`);
  }

  function updateScrollProgress() {
    const root = document.documentElement;
    const max = Math.max(1, root.scrollHeight - root.clientHeight);
    const percent = Math.min(100, Math.max(0, Math.round((root.scrollTop / max) * 100)));
    const progress = $('#uxPageProgress');
    const wrapper = progress?.parentElement;
    if (progress) progress.style.width = `${percent}%`;
    if (wrapper) wrapper.setAttribute('aria-valuenow', String(percent));
  }

  function setupScrollSpy() {
    const sections = existingSections();
    const observer = new IntersectionObserver(entries => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top));
      if (!visible.length) return;
      const id = visible[0].target.id;
      if (!id) return;
      const shouldPersist = scrollSpySynchronized || manualScrollIntent;
      scrollSpySynchronized = true;
      if (id === activeSection) return;
      activeSection = id;
      if (shouldPersist) {
        state.lastSection = id;
        if (!state.visited.includes(id)) state.visited.push(id);
        saveState();
        updateResumeTargets();
      }
      updateActiveUI();
    }, { rootMargin: '-18% 0px -67% 0px', threshold: [0, 0.01] });
    sections.forEach(item => observer.observe(item.element));

    const armManualScroll = event => {
      if (event.type === 'keydown' && !scrollKeys.has(event.key)) return;
      manualScrollIntent = true;
    };
    window.addEventListener('wheel', armManualScroll, { passive: true });
    window.addEventListener('touchmove', armManualScroll, { passive: true });
    window.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse' && event.clientX >= document.documentElement.clientWidth - 32) {
        manualScrollIntent = true;
      }
    }, { passive: true });
    document.addEventListener('keydown', armManualScroll);
    window.addEventListener('scroll', () => {
      if (scrollTicking) return;
      scrollTicking = true;
      requestAnimationFrame(() => {
        updateScrollProgress();
        scrollTicking = false;
      });
    }, { passive: true });
    updateScrollProgress();
  }

  function setupEvents() {
    document.addEventListener('click', event => {
      const route = event.target.closest('[data-ux-route]');
      if (route?.dataset.uxRoute) {
        event.preventDefault();
        navigateTo(route.dataset.uxRoute);
        return;
      }
      const jump = event.target.closest('[data-ux-jump]');
      if (jump?.dataset.uxJump) {
        event.preventDefault();
        navigateTo(jump.dataset.uxJump);
        return;
      }
      const hashLink = event.target.closest('a[href^="#"]');
      const hashTarget = hashLink?.getAttribute('href')?.slice(1);
      if (hashTarget && document.getElementById(hashTarget)?.dataset.uxSection) {
        event.preventDefault();
        navigateTo(hashTarget);
        return;
      }

      if (event.target.closest('[data-ux-open-command]') || event.target.closest('#uxCommandButton')) openCommand();
      const drawerTrigger = event.target.closest('[data-ux-open-drawer]') || event.target.closest('#uxMapButton');
      if (drawerTrigger) openDrawer(drawerTrigger);
      if (event.target.closest('#uxDrawerClose') || event.target.closest('#uxDrawerBackdrop')) closeDrawer();
      if (event.target.closest('#uxCommandClose')) closeCommand();
      if (event.target.closest('#uxFavoriteCurrent')) toggleFavorite();

      const remove = event.target.closest('[data-ux-remove-favorite]');
      if (remove) toggleFavorite(remove.dataset.uxRemoveFavorite);

      const groupHead = event.target.closest('.ux-drawer-group-head');
      if (groupHead) {
        const links = groupHead.nextElementSibling;
        const expanded = groupHead.getAttribute('aria-expanded') === 'true';
        groupHead.setAttribute('aria-expanded', String(!expanded));
        links.hidden = expanded;
      }

      const commandItem = event.target.closest('[data-ux-command-index]');
      if (commandItem) {
        const item = commandResults[Number(commandItem.dataset.uxCommandIndex)];
        if (item) navigateTo(item.id);
      }
    });

    $('#uxCommandInput')?.addEventListener('input', event => {
      commandIndex = 0;
      renderCommand(event.target.value);
    });

    $('#uxCommandInput')?.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        commandIndex = Math.min(commandResults.length - 1, commandIndex + 1);
        renderCommand(event.currentTarget.value);
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        commandIndex = Math.max(0, commandIndex - 1);
        renderCommand(event.currentTarget.value);
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        const item = commandResults[commandIndex];
        if (item) navigateTo(item.id);
      }
    });

    $('#uxCommandDialog')?.addEventListener('click', event => {
      if (event.target === event.currentTarget) closeCommand();
    });

    document.addEventListener('focusin', event => {
      const drawer = $('#uxJourneyDrawer');
      if (!drawerIsOpen() || drawer?.contains(event.target)) return;
      (drawerFocusable()[0] || drawer)?.focus();
    });

    document.addEventListener('keydown', event => {
      if (trapDrawerFocus(event)) return;
      const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '');
      if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === 'k') {
        event.preventDefault();
        openCommand();
      } else if (event.key === '/' && !typing) {
        event.preventDefault();
        openCommand();
      } else if (event.key === 'Escape') {
        closeDrawer();
        closeCommand();
      }
    });

    const syncCurricularHash = () => {
      const id = sectionIdFromHash();
      if (!id) return;
      if (id === activeSection && state.lastSection === id) return;
      navigateTo(id, { history: 'none', instant: true, focus: false });
    };
    window.addEventListener('popstate', syncCurricularHash);
    window.addEventListener('hashchange', syncCurricularHash);
  }

  function showToast(message) {
    const toast = $('#uxToast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('is-visible'), 2200);
  }

  function addReleaseNote() {
    const current = $('#novidades .current-release');
    if (!current || current.dataset.uxRelease) return;
    current.dataset.uxRelease = VERSION;
    const note = document.createElement('li');
    note.innerHTML = '<strong>UX 6.3:</strong> navegação por intenção, busca global, mapa de jornada, retomada, favoritos, breadcrumb contextual e dock móvel, sem alteração do conteúdo curricular.';
    current.querySelector('.release-list')?.prepend(note);
  }

  function init() {
    if (!document.body || document.documentElement.dataset.uxRuntime) return;
    prepareDocument();
    createContextBar();
    createLaunchpad();
    createDrawer();
    createCommandPalette();
    createMobileDock();
    createToastRegion();
    updateResumeTargets();
    renderFavorites();
    updateActiveUI();
    setupScrollSpy();
    setupEvents();
    const initialHashSection = sectionIdFromHash();
    if (initialHashSection) navigateTo(initialHashSection, { history: 'replace', instant: true, focus: false });
    addReleaseNote();
    document.documentElement.classList.add('ux-ready');
    window.dispatchEvent(new CustomEvent('bishun:ux-ready', { detail: { version: VERSION } }));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
