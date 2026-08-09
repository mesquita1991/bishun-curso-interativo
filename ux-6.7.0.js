(() => {
  'use strict';

  const VERSION = '6.7.0';
  const STORAGE_KEY = 'bishunFocusV67';
  const GUIDE_KEY = 'bishunGuidedV66';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const view = loadView();
  let guideObserver = null;
  let identityObserver = null;
  let bootObserver = null;
  let syncQueued = false;

  function loadView() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return { mode: parsed.mode === 'explore' ? 'explore' : 'guided' };
    } catch {
      return { mode: 'guided' };
    }
  }

  function saveView() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(view)); } catch { /* UI remains usable without storage */ }
  }

  function guideState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(GUIDE_KEY) || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  function guideLinks() {
    return $$('#ux66Guide a[data-guide-index]');
  }

  function stepIdAt(index) {
    const link = guideLinks()[index];
    const href = link?.getAttribute('href') || '';
    return href.startsWith('#') ? href.slice(1) : null;
  }

  function stepTitleAt(index) {
    const link = guideLinks()[index];
    return link?.querySelector('b')?.textContent?.trim() || link?.textContent?.trim() || '';
  }

  function currentIndex() {
    const state = guideState();
    const numeric = Number(state.current);
    if (Number.isInteger(numeric) && numeric >= 0 && numeric < guideLinks().length) return numeric;
    const active = $('#ux66Guide a[aria-current="step"]');
    const fromDom = Number(active?.dataset.guideIndex);
    return Number.isInteger(fromDom) ? fromDom : 0;
  }

  function currentStepId() {
    return stepIdAt(currentIndex());
  }

  function hasStarted() {
    const state = guideState();
    return Boolean(state.active || state.paused || Number(state.current) > 0 || (Array.isArray(state.completed) && state.completed.length));
  }

  function promoteBadge() {
    const badge = $('.ux65-badge');
    if (!badge) return false;
    badge.innerHTML = '<strong>6.7</strong><small>foco</small>';
    badge.setAttribute('aria-label', 'UX 6.7 · estudo em uma etapa por vez');
    return true;
  }

  function ensureModeBar() {
    const guide = $('#ux66Guide');
    const main = $('#conteudo');
    if (!guide || !main) return null;

    let bar = $('#ux67ModeBar');
    if (!bar) {
      bar = document.createElement('section');
      bar.id = 'ux67ModeBar';
      bar.className = 'ux67-modebar';
      bar.setAttribute('aria-label', 'Modo de estudo');
      bar.innerHTML = `
        <div class="ux67-mode-copy">
          <span>COMO USAR</span>
          <strong>Uma etapa por vez. Sem procurar o próximo lugar.</strong>
          <div class="ux67-how" aria-label="Fluxo da trilha">
            <span><b>1</b> Comece ou continue</span>
            <span><b>2</b> Estude só a etapa exibida</span>
            <span><b>3</b> Concluir e continuar</span>
          </div>
        </div>
        <div class="ux67-mode-actions" role="group" aria-label="Escolher modo de visualização">
          <button type="button" data-ux67-mode="guided">Trilha guiada</button>
          <button type="button" data-ux67-mode="explore">Explorar tudo</button>
        </div>`;
    }

    if (guide.parentElement !== main || main.firstElementChild !== bar) {
      main.insertBefore(bar, main.firstElementChild);
      main.insertBefore(guide, bar.nextSibling);
    }
    return bar;
  }

  function ensureCompass() {
    const guide = $('#ux66Guide');
    if (!guide) return null;
    let compass = $('#ux67Compass');
    if (!compass) {
      compass = document.createElement('aside');
      compass.id = 'ux67Compass';
      compass.className = 'ux67-compass';
      compass.setAttribute('aria-live', 'polite');
      guide.insertAdjacentElement('afterend', compass);
    }
    return compass;
  }

  function suppressSections(guided, currentId, showLesson) {
    $$('[data-ux-section]').forEach(section => {
      const current = guided && showLesson && currentId && section.id === currentId;
      const suppress = guided && !current;
      section.classList.toggle('ux67-current-step', Boolean(current));
      section.classList.toggle('ux67-suppressed', suppress);
      if (suppress) section.setAttribute('aria-hidden', 'true');
      else section.removeAttribute('aria-hidden');
    });
  }

  function updateCompass() {
    const compass = ensureCompass();
    if (!compass) return;
    const state = guideState();
    const index = currentIndex();
    const current = stepTitleAt(index) || 'Fundamentos';
    const next = stepTitleAt(index + 1);
    const total = guideLinks().length || 40;
    const completed = Array.isArray(state.completed) ? state.completed.length : 0;
    const paused = Boolean(state.paused);
    compass.hidden = view.mode !== 'guided' || !hasStarted();
    compass.innerHTML = `
      <div><small>${paused ? 'SESSÃO PAUSADA · posição salva' : 'AGORA'} · ${index + 1}/${total}</small><strong>${escapeHtml(current)}</strong></div>
      <div><small>DEPOIS</small><strong>${escapeHtml(next || (completed >= total ? 'Trilha concluída' : 'Revisar pendências'))}</strong></div>
      <span>Salvo automaticamente</span>`;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function updateModeButtons() {
    $$('[data-ux67-mode]').forEach(button => {
      const active = button.dataset.ux67Mode === view.mode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function applyView({ scroll = false } = {}) {
    if (!$('#ux66Guide')) return;
    ensureModeBar();
    ensureCompass();
    promoteBadge();

    const guided = view.mode === 'guided';
    const id = currentStepId();
    const showLesson = guided && hasStarted();

    document.documentElement.classList.toggle('ux67-guided-view', guided);
    document.documentElement.classList.toggle('ux67-explore-view', !guided);
    document.documentElement.dataset.ux67Mode = view.mode;
    suppressSections(guided, id, showLesson);
    updateCompass();
    updateModeButtons();

    if (scroll) {
      const target = guided && showLesson ? document.getElementById(id) : $('#ux67ModeBar');
      target?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    }
  }

  function queueSync(options) {
    if (syncQueued) return;
    syncQueued = true;
    queueMicrotask(() => {
      syncQueued = false;
      applyView(options);
    });
  }

  function setMode(mode) {
    view.mode = mode === 'explore' ? 'explore' : 'guided';
    saveView();
    applyView({ scroll: true });
  }

  function wire() {
    document.addEventListener('click', event => {
      const modeButton = event.target.closest('[data-ux67-mode]');
      if (modeButton) {
        event.preventDefault();
        setMode(modeButton.dataset.ux67Mode);
        return;
      }
      if (event.target.closest('[data-guide-action], a[data-guide-index], [data-guide-phase], [data-ux-route], [data-ux-jump], [data-ux-command-index]')) {
        queueSync();
      }
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Enter' && event.target.closest('#uxCommandInput')) queueSync();
    });
    window.addEventListener('hashchange', () => queueSync());
    window.addEventListener('pageshow', () => queueSync());
    window.addEventListener('storage', event => {
      if (event.key === GUIDE_KEY || event.key === STORAGE_KEY) queueSync();
    });
  }

  function observeGuide() {
    const guide = $('#ux66Guide');
    if (!guide || guideObserver) return;
    guideObserver = new MutationObserver(() => queueSync());
    guideObserver.observe(guide, { childList: true, subtree: true });
  }

  function observeIdentity() {
    if (promoteBadge() || identityObserver) return;
    const root = $('.ux64-brand-cluster') || $('.topbar');
    if (!root) return;
    identityObserver = new MutationObserver(() => {
      if (promoteBadge()) identityObserver.disconnect();
    });
    identityObserver.observe(root, { childList: true, subtree: true });
    window.setTimeout(() => identityObserver?.disconnect(), 2500);
  }

  function boot() {
    if (document.documentElement.dataset.ux67Runtime === VERSION) return;
    const guide = $('#ux66Guide');
    if (!guide) {
      if (!bootObserver) {
        bootObserver = new MutationObserver(() => {
          if ($('#ux66Guide')) {
            bootObserver.disconnect();
            bootObserver = null;
            boot();
          }
        });
        bootObserver.observe(document.body, { childList: true, subtree: true });
        window.setTimeout(() => bootObserver?.disconnect(), 3000);
      }
      return;
    }
    document.documentElement.dataset.ux67Runtime = VERSION;
    document.documentElement.classList.add('ux67-ready');
    ensureModeBar();
    observeGuide();
    observeIdentity();
    wire();
    applyView();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
