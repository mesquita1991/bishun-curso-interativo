(() => {
  'use strict';

  const VERSION = '6.0.0';
  const KEY = 'bishunPostV5';
  const FULL_KEY = 'bishunFullV4';
  const DAY = 86400000;
  const INTERVALS = [0, 1, 3, 7, 14, 30, 60, 120, 240];
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const cjk = char => /[\u3400-\u9fff\uf900-\ufaff]/u.test(char);
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const shuffle = list => { const copy = [...list]; for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; } return copy; };

  const defaultState = () => ({
    records: { lex: {}, idiom: {}, pragmatic: {}, mission: {} },
    recentTexts: [],
    lastText: '',
    created: Date.now()
  });

  let state;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '{}');
    state = { ...defaultState(), ...parsed };
  } catch {
    state = defaultState();
  }
  state.records ||= defaultState().records;
  Object.keys(defaultState().records).forEach(key => state.records[key] ||= {});
  state.recentTexts ||= [];

  let meta = null;
  let curriculum = null;
  let coreMap = null;
  let priority = null;
  let idioms = null;
  let packs = null;
  let searchIndex = null;
  let indexById = null;
  let currentTokens = [];
  let lexPage = 0;
  let idiomPage = 0;
  let pragmaticPage = 0;
  let readingPage = 0;
  let missionPage = 0;
  const shardCache = new Map();
  const entryById = new Map();

  function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function record(type, id) {
    return { level: 0, due: 0, attempts: 0, correct: 0, last: 0, ...(state.records[type]?.[id] || {}) };
  }

  function grade(type, id, quality) {
    const r = record(type, id);
    r.attempts += 1;
    if (quality >= 2) {
      r.correct += 1;
      r.level = Math.min(INTERVALS.length - 1, r.level + 1);
    } else if (quality === 1) {
      r.level = Math.max(1, r.level);
    } else {
      r.level = 0;
    }
    r.last = Date.now();
    r.due = Date.now() + INTERVALS[r.level] * DAY;
    state.records[type][id] = r;
    save();
    renderPostDashboard();
  }

  function mastered(type, id) {
    return record(type, id).level >= 4;
  }

  function due(type, id) {
    const r = record(type, id);
    return !r.due || r.due <= Date.now();
  }

  function pct(value, total) {
    return total ? Math.round(value / total * 1000) / 10 : 0;
  }

  async function fetchJSON(path) {
    const response = await fetch(path, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`${response.status} ao carregar ${path}`);
    return response.json();
  }

  function fullState() {
    try { return JSON.parse(localStorage.getItem(FULL_KEY) || '{}'); }
    catch { return {}; }
  }

  function fullLevel(type, id) {
    return Number(fullState()?.records?.[type]?.[id]?.level || 0);
  }

  function coreEntryMastered(entry) {
    if (!entry) return false;
    const words = coreMap?.words?.[entry.h] || [];
    if (words.some(id => fullLevel('word', id) >= 4)) return true;
    const char = coreMap?.characters?.[entry.h];
    if (char && fullLevel('char', entry.h) >= 4) return true;
    return false;
  }

  function shardForChar(char) {
    return char.codePointAt(0) % 128;
  }

  async function loadShard(number) {
    if (shardCache.has(number)) return shardCache.get(number);
    const info = meta.shards.find(item => item.shard === number);
    if (!info) return [];
    const promise = fetchJSON(`./${info.file}`).then(items => {
      items.forEach(item => entryById.set(item.i, item));
      return items;
    });
    shardCache.set(number, promise);
    return promise;
  }

  async function loadSearchIndex() {
    if (searchIndex) return searchIndex;
    const parts = await Promise.all(meta.files.searchIndexParts.map(path => fetchJSON(`./${path}`)));
    searchIndex = parts.flat();
    indexById = new Map(searchIndex.map(row => [row[0], row]));
    return searchIndex;
  }

  async function resolveIds(ids) {
    await loadSearchIndex();
    const unique = [...new Set(ids.map(Number))];
    const missing = unique.filter(id => !entryById.has(id));
    const byShard = new Map();
    missing.forEach(id => {
      const row = indexById.get(id);
      if (!row) return;
      const shard = row[3];
      if (!byShard.has(shard)) byShard.set(shard, []);
      byShard.get(shard).push(id);
    });
    await Promise.all([...byShard.keys()].map(loadShard));
    return unique.map(id => entryById.get(id)).filter(Boolean);
  }

  function speak(text, rate = .82) {
    if (!('speechSynthesis' in window) || !text) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = rate;
    const voices = speechSynthesis.getVoices();
    utterance.voice = voices.find(v => v.lang.toLowerCase() === 'zh-cn') || voices.find(v => v.lang.toLowerCase().startsWith('zh')) || null;
    speechSynthesis.speak(utterance);
  }

  const toneMarks = {
    a: ['a','ā','á','ǎ','à'], e: ['e','ē','é','ě','è'], i: ['i','ī','í','ǐ','ì'],
    o: ['o','ō','ó','ǒ','ò'], u: ['u','ū','ú','ǔ','ù'], ü: ['ü','ǖ','ǘ','ǚ','ǜ']
  };

  function markSyllable(raw) {
    if (!raw) return '';
    const match = raw.match(/^(.+?)([0-5])$/);
    if (!match) return raw.replace(/u:/g, 'ü').replace(/v/g, 'ü');
    let base = match[1].replace(/u:/g, 'ü').replace(/v/g, 'ü');
    const tone = Number(match[2]);
    if (!tone || tone === 5) return base;
    const lower = base.toLowerCase();
    let index = lower.indexOf('a');
    if (index < 0) index = lower.indexOf('e');
    if (index < 0 && lower.includes('ou')) index = lower.indexOf('o');
    if (index < 0) {
      for (let i = lower.length - 1; i >= 0; i--) {
        if ('aeiouü'.includes(lower[i])) { index = i; break; }
      }
    }
    if (index < 0) return base;
    const vowel = lower[index];
    const marked = toneMarks[vowel]?.[tone] || base[index];
    if (base[index] === base[index].toUpperCase()) base = base.slice(0, index) + marked.toUpperCase() + base.slice(index + 1);
    else base = base.slice(0, index) + marked + base.slice(index + 1);
    return base;
  }

  function prettyPinyin(pinyin = '') {
    return pinyin.split(/\s+/).map(markSyllable).join(' ');
  }

  function meaningInfo(entry) {
    if (!entry) return { text: '', source: '' };
    if (entry.m) return { text: entry.m, source: 'tradução curricular em português' };
    return { text: entry.g || 'Sem glosa disponível.', source: 'glosa-fonte em inglês · CC-CEDICT' };
  }

  function renderPostDashboard() {
    if (!meta) return;
    const lexMastered = Object.values(state.records.lex).filter(r => r.level >= 4).length;
    const idiomMastered = Object.values(state.records.idiom).filter(r => r.level >= 4).length;
    const pragmaticMastered = Object.values(state.records.pragmatic).filter(r => r.level >= 4).length;
    const missionsDone = Object.values(state.records.mission).filter(r => r.level >= 1).length;
    const dueCount = Object.entries(state.records.lex).filter(([, r]) => !r.due || r.due <= Date.now()).length + Object.entries(state.records.idiom).filter(([, r]) => !r.due || r.due <= Date.now()).length;
    if ($('#postLexMastered')) $('#postLexMastered').textContent = lexMastered.toLocaleString('pt-BR');
    if ($('#postIdiomMastered')) $('#postIdiomMastered').textContent = idiomMastered.toLocaleString('pt-BR');
    if ($('#postPragMastered')) $('#postPragMastered').textContent = `${pragmaticMastered}/${meta.inventory.pragmaticsLessons}`;
    if ($('#postMissionsDone')) $('#postMissionsDone').textContent = `${missionsDone}/${meta.inventory.missions}`;
    if ($('#postDueCount')) $('#postDueCount').textContent = dueCount.toLocaleString('pt-BR');
    const evidence = [
      Math.min(1, lexMastered / 20000),
      Math.min(1, idiomMastered / Math.max(1, meta.inventory.idiomExpressions)),
      Math.min(1, pragmaticMastered / meta.inventory.pragmaticsLessons),
      Math.min(1, missionsDone / meta.inventory.missions)
    ];
    const score = Math.round(evidence.reduce((a, b) => a + b, 0) / evidence.length * 100);
    if ($('#postEvidenceScore')) $('#postEvidenceScore').textContent = `${score}%`;
  }

  function renderOverview() {
    const inv = meta.inventory;
    const values = {
      postEntries: inv.entryCount,
      postPriority: inv.priorityEntries,
      postIdioms: inv.idiomExpressions,
      postDomains: inv.domainPackCount,
      postPragmatics: inv.pragmaticsLessons,
      postReadings: inv.authoredReadings,
      postMissions: inv.missions,
      postShards: inv.lexicalShards
    };
    Object.entries(values).forEach(([id, value]) => {
      const element = $(`#${id}`);
      if (element) element.textContent = Number(value).toLocaleString('pt-BR');
    });
    if ($('#postMethodNotice')) $('#postMethodNotice').textContent = meta.methodology.scope;
    renderPostDashboard();
  }

  async function segmentText(text) {
    const firstChars = [...new Set([...text].filter(cjk))];
    const shardNumbers = [...new Set(firstChars.map(shardForChar))];
    const shardEntries = (await Promise.all(shardNumbers.map(loadShard))).flat();
    const byHeadword = new Map();
    let maxLength = 1;
    shardEntries.forEach(entry => {
      if (!byHeadword.has(entry.h)) byHeadword.set(entry.h, entry);
      maxLength = Math.max(maxLength, Math.min(16, entry.h.length));
    });
    const tokens = [];
    let index = 0;
    while (index < text.length) {
      const char = text[index];
      if (!cjk(char)) {
        let end = index + 1;
        while (end < text.length && !cjk(text[end])) end += 1;
        tokens.push({ text: text.slice(index, end), kind: 'punctuation' });
        index = end;
        continue;
      }
      let found = null;
      const limit = Math.min(maxLength, text.length - index);
      for (let length = limit; length >= 1; length--) {
        const candidate = text.slice(index, index + length);
        if (![...candidate].every(cjk)) continue;
        const entry = byHeadword.get(candidate);
        if (entry) { found = entry; break; }
      }
      if (found) {
        tokens.push({ text: found.h, kind: 'word', entry: found });
        index += found.h.length;
      } else {
        tokens.push({ text: char, kind: 'unknown' });
        index += 1;
      }
    }
    return tokens;
  }

  function analyzeMetrics(tokens) {
    const lexical = tokens.filter(token => token.kind === 'word' || token.kind === 'unknown');
    const recognized = lexical.filter(token => token.kind === 'word');
    const core = recognized.filter(token => token.entry.c || coreMap.words[token.text] || coreMap.characters[token.text]);
    const masteredTokens = recognized.filter(token => coreEntryMastered(token.entry) || mastered('lex', token.entry.i));
    const types = [...new Set(lexical.map(token => token.text))];
    const recognizedTypes = [...new Set(recognized.map(token => token.text))];
    const coreTypes = [...new Set(core.map(token => token.text))];
    const masteredTypes = [...new Set(masteredTokens.map(token => token.text))];
    const unknownTypes = [...new Set(lexical.filter(token => token.kind === 'unknown').map(token => token.text))];
    return {
      tokens: lexical.length,
      types: types.length,
      recognized: recognized.length,
      recognizedTypes: recognizedTypes.length,
      core: core.length,
      coreTypes: coreTypes.length,
      mastered: masteredTokens.length,
      masteredTypes: masteredTypes.length,
      unknownTypes,
      dictionaryCoverage: pct(recognized.length, lexical.length),
      typeCoverage: pct(recognizedTypes.length, types.length),
      formalCoverage: pct(core.length, lexical.length),
      masteryCoverage: pct(masteredTokens.length, lexical.length)
    };
  }

  function renderTokenDetail(token) {
    const root = $('#immersionTokenDetail');
    if (!root) return;
    if (!token || token.kind !== 'word') {
      root.innerHTML = token?.kind === 'unknown'
        ? `<p><strong>${esc(token.text)}</strong> não foi encontrado no dicionário carregado. Confirme se é nome, erro de segmentação, variante rara ou caractere fora da base.</p>`
        : '<p>Selecione uma palavra reconhecida para ver leitura, glosa e classificação.</p>';
      return;
    }
    const entry = token.entry;
    const meaning = meaningInfo(entry);
    const tags = [...(entry.a || []), ...(entry.d || [])];
    root.innerHTML = `<article class="immersion-detail-card">
      <div class="immersion-detail-head"><div><b lang="zh-Hans">${esc(entry.h)}</b>${entry.t ? `<span lang="zh-Hant">繁 ${esc(entry.t)}</span>` : ''}<em>${esc(prettyPinyin(entry.p))}</em></div><button type="button" data-post-speak="${esc(entry.h)}">🔊 Ouvir</button></div>
      <p>${esc(meaning.text)}</p><small>${esc(meaning.source)}</small>
      ${tags.length ? `<div class="tag-row">${tags.map(tag => `<span>${esc(tag)}</span>`).join('')}</div>` : ''}
      <div class="post-grade-strip"><button type="button" data-post-grade="lex" data-post-id="${entry.i}" data-quality="0">Rever</button><button type="button" data-post-grade="lex" data-post-id="${entry.i}" data-quality="1">Difícil</button><button type="button" data-post-grade="lex" data-post-id="${entry.i}" data-quality="2">Dominei</button></div>
    </article>`;
  }

  function renderAnalysis(tokens) {
    currentTokens = tokens;
    const metrics = analyzeMetrics(tokens);
    const metricMap = {
      immersionTokenCount: metrics.tokens,
      immersionTypeCount: metrics.types,
      immersionDictionaryCoverage: `${metrics.dictionaryCoverage}%`,
      immersionFormalCoverage: `${metrics.formalCoverage}%`,
      immersionMasteryCoverage: `${metrics.masteryCoverage}%`,
      immersionUnknownCount: metrics.unknownTypes.length
    };
    Object.entries(metricMap).forEach(([id, value]) => { if ($(`#${id}`)) $(`#${id}`).textContent = String(value); });
    $('#immersionTokenOutput').innerHTML = tokens.map((token, index) => {
      if (token.kind === 'punctuation') return `<span class="token-punctuation">${esc(token.text)}</span>`;
      if (token.kind === 'unknown') return `<button type="button" class="token-chip unknown" data-token-index="${index}">${esc(token.text)}</button>`;
      const formal = token.entry.c || coreMap.words[token.text] || coreMap.characters[token.text];
      const isMastered = coreEntryMastered(token.entry) || mastered('lex', token.entry.i);
      return `<button type="button" class="token-chip ${formal ? 'formal' : 'post'} ${isMastered ? 'mastered' : ''}" data-token-index="${index}" title="${esc(prettyPinyin(token.entry.p))}">${esc(token.text)}</button>`;
    }).join('');
    $('#immersionUnknownList').innerHTML = metrics.unknownTypes.length
      ? metrics.unknownTypes.map(item => `<span>${esc(item)}</span>`).join('')
      : '<span>Nenhum tipo desconhecido nesta análise.</span>';
    $('#immersionCoverageNote').innerHTML = `<strong>Interpretação:</strong> o dicionário reconheceu ${metrics.dictionaryCoverage}% das ocorrências e ${metrics.typeCoverage}% dos tipos. ${metrics.formalCoverage}% das ocorrências pertencem ao inventário formal; ${metrics.masteryCoverage}% já estão registradas como dominadas. Estes percentuais descrevem apenas este texto.`;
    renderTokenDetail(tokens.find(token => token.kind === 'word') || tokens.find(token => token.kind === 'unknown'));
  }

  async function analyzeImmersion(saveRecent = true) {
    const text = ($('#immersionText')?.value || '').trim();
    if (!text) {
      $('#immersionStatus').textContent = 'Cole ou escolha um texto antes de analisar.';
      return;
    }
    $('#immersionStatus').textContent = 'Carregando os fragmentos lexicais necessários…';
    try {
      const tokens = await segmentText(text);
      renderAnalysis(tokens);
      state.lastText = text;
      if (saveRecent) {
        state.recentTexts = [{ text, title: text.replace(/\s+/g, ' ').slice(0, 32), savedAt: Date.now() }, ...state.recentTexts.filter(item => item.text !== text)].slice(0, 10);
      }
      save();
      renderRecentTexts();
      $('#immersionStatus').textContent = `Análise concluída com ${tokens.filter(t => t.kind !== 'punctuation').length} unidades lexicais.`;
    } catch (error) {
      console.error(error);
      $('#immersionStatus').textContent = `Não foi possível concluir a análise: ${error.message}`;
    }
  }

  function renderRecentTexts() {
    const root = $('#recentImmersionTexts');
    if (!root) return;
    root.innerHTML = state.recentTexts.length
      ? state.recentTexts.map((item, index) => `<button type="button" data-load-recent="${index}"><b>${esc(item.title)}</b><small>${new Date(item.savedAt).toLocaleDateString('pt-BR')}</small></button>`).join('')
      : '<p>Nenhum texto salvo ainda.</p>';
  }

  function lexCard(entry) {
    const info = meaningInfo(entry);
    const tags = [...(entry.a || []), ...(entry.d || [])];
    return `<article class="post-lex-card ${mastered('lex', entry.i) ? 'mastered' : ''}">
      <div class="post-lex-head"><div><b lang="zh-Hans">${esc(entry.h)}</b><span>${esc(prettyPinyin(entry.p))}</span></div><button type="button" data-post-speak="${esc(entry.h)}">🔊</button></div>
      <p>${esc(info.text)}</p><small>${esc(info.source)}</small>
      ${entry.t ? `<em lang="zh-Hant">繁 ${esc(entry.t)}</em>` : ''}
      ${tags.length ? `<div class="tag-row">${tags.slice(0, 5).map(tag => `<span>${esc(tag)}</span>`).join('')}</div>` : ''}
      <div class="post-grade-strip"><button type="button" data-post-grade="lex" data-post-id="${entry.i}" data-quality="0">Errei</button><button type="button" data-post-grade="lex" data-post-id="${entry.i}" data-quality="1">Difícil</button><button type="button" data-post-grade="lex" data-post-id="${entry.i}" data-quality="2">Acertei</button></div>
    </article>`;
  }

  async function lexiconSource() {
    const mode = $('#postLexMode')?.value || 'priority';
    const query = ($('#postLexSearch')?.value || '').trim().toLowerCase();
    if (mode === 'priority') {
      priority ||= await fetchJSON(`./${meta.files.priority}`);
      return priority.filter(entry => !query || `${entry.h} ${entry.t} ${entry.p} ${entry.g}`.toLowerCase().includes(query));
    }
    packs ||= await fetchJSON(`./${meta.files.packs}`);
    if (mode === 'domain') {
      const name = $('#postDomainSelect')?.value || Object.keys(packs.domains)[0];
      const entries = await resolveIds(packs.domains[name] || []);
      return entries.filter(entry => !query || `${entry.h} ${entry.t || ''} ${entry.p} ${entry.g}`.toLowerCase().includes(query));
    }
    if (mode === 'register') {
      const name = $('#postRegisterSelect')?.value || Object.keys(packs.registers)[0];
      const entries = await resolveIds(packs.registers[name] || []);
      return entries.filter(entry => !query || `${entry.h} ${entry.t || ''} ${entry.p} ${entry.g}`.toLowerCase().includes(query));
    }
    if (!query) return [];
    const index = await loadSearchIndex();
    const rows = [];
    for (const row of index) {
      if (`${row[1]} ${row[2]}`.toLowerCase().includes(query)) rows.push(row);
      if (rows.length >= 500) break;
    }
    return resolveIds(rows.map(row => row[0]));
  }

  async function renderLexicon(reset = false) {
    if (reset) lexPage = 0;
    const root = $('#postLexiconGrid');
    if (!root) return;
    root.innerHTML = '<p class="loading-state">Carregando léxico…</p>';
    try {
      const source = await lexiconSource();
      const status = $('#postLexStatus')?.value || 'all';
      const filtered = source.filter(entry => status === 'all' || (status === 'mastered' && mastered('lex', entry.i)) || (status === 'due' && due('lex', entry.i)));
      const size = 24;
      const pages = Math.max(1, Math.ceil(filtered.length / size));
      lexPage = clamp(lexPage, 0, pages - 1);
      const slice = filtered.slice(lexPage * size, (lexPage + 1) * size);
      root.innerHTML = slice.length ? slice.map(lexCard).join('') : '<p class="empty-state">Nenhum item neste recorte. Na busca integral, digite caracteres ou pinyin.</p>';
      $('#postLexPage').textContent = `${lexPage + 1}/${pages}`;
      $('#postLexResultCount').textContent = `${filtered.length.toLocaleString('pt-BR')} resultados`;
    } catch (error) {
      console.error(error);
      root.innerHTML = `<p class="error-state">Falha ao carregar o léxico: ${esc(error.message)}</p>`;
    }
  }

  async function initializePackFilters() {
    packs ||= await fetchJSON(`./${meta.files.packs}`);
    $('#postDomainSelect').innerHTML = Object.keys(packs.domains).map(name => `<option value="${esc(name)}">${esc(name)} · ${packs.domains[name].length}</option>`).join('');
    $('#postRegisterSelect').innerHTML = Object.keys(packs.registers).map(name => `<option value="${esc(name)}">${esc(name)} · ${packs.registers[name].length}</option>`).join('');
  }

  function idiomCard(entry) {
    return `<article class="idiom-card ${mastered('idiom', entry.i) ? 'mastered' : ''}">
      <div><b lang="zh-Hans">${esc(entry.h)}</b><span>${esc(prettyPinyin(entry.p))}</span><button type="button" data-post-speak="${esc(entry.h)}">🔊</button></div>
      <p lang="en">${esc(entry.g)}</p><small>Glosa-fonte em inglês · CC-CEDICT</small>
      <div class="post-grade-strip"><button type="button" data-post-grade="idiom" data-post-id="${entry.i}" data-quality="0">Rever</button><button type="button" data-post-grade="idiom" data-post-id="${entry.i}" data-quality="1">Difícil</button><button type="button" data-post-grade="idiom" data-post-id="${entry.i}" data-quality="2">Dominei</button></div>
    </article>`;
  }

  async function renderIdioms(reset = false) {
    if (reset) idiomPage = 0;
    idioms ||= await fetchJSON(`./${meta.files.idioms}`);
    const query = ($('#idiomSearch')?.value || '').trim().toLowerCase();
    const status = $('#idiomStatus')?.value || 'all';
    const filtered = idioms.filter(entry => (!query || `${entry.h} ${entry.t} ${entry.p} ${entry.g}`.toLowerCase().includes(query)) && (status === 'all' || (status === 'mastered' && mastered('idiom', entry.i)) || (status === 'due' && due('idiom', entry.i))));
    const size = 20;
    const pages = Math.max(1, Math.ceil(filtered.length / size));
    idiomPage = clamp(idiomPage, 0, pages - 1);
    const slice = filtered.slice(idiomPage * size, (idiomPage + 1) * size);
    $('#idiomGrid').innerHTML = slice.length ? slice.map(idiomCard).join('') : '<p>Nenhuma expressão encontrada.</p>';
    $('#idiomPage').textContent = `${idiomPage + 1}/${pages}`;
    $('#idiomResultCount').textContent = `${filtered.length.toLocaleString('pt-BR')} expressões`;
  }

  function renderPragmatics(reset = false) {
    if (reset) pragmaticPage = 0;
    const category = $('#pragmaticCategory')?.value || 'all';
    const status = $('#pragmaticStatus')?.value || 'all';
    const query = ($('#pragmaticSearch')?.value || '').trim().toLowerCase();
    const items = curriculum.pragmatics.filter(item => (category === 'all' || item.category === category) && (!query || `${item.phrase} ${item.pinyin} ${item.meaning} ${item.note}`.toLowerCase().includes(query)) && (status === 'all' || (status === 'mastered') === mastered('pragmatic', item.id)));
    const size = 12;
    const pages = Math.max(1, Math.ceil(items.length / size));
    pragmaticPage = clamp(pragmaticPage, 0, pages - 1);
    const slice = items.slice(pragmaticPage * size, (pragmaticPage + 1) * size);
    $('#pragmaticGrid').innerHTML = slice.map(item => `<details class="pragmatic-card ${mastered('pragmatic', item.id) ? 'mastered' : ''}"><summary><span><b lang="zh-Hans">${esc(item.phrase)}</b><small>${esc(prettyPinyin(item.pinyin))} · ${esc(item.meaning)}</small></span><button type="button" data-post-speak="${esc(item.phrase)}">🔊</button></summary><p>${esc(item.note)}</p><div class="pragmatic-example"><button type="button" data-post-speak="${esc(item.example)}">▶</button><div><b lang="zh-Hans">${esc(item.example)}</b><small>${esc(item.examplePt)}</small></div></div><div class="post-grade-strip"><button type="button" data-post-grade="pragmatic" data-post-id="${item.id}" data-quality="0">Rever</button><button type="button" data-post-grade="pragmatic" data-post-id="${item.id}" data-quality="1">Difícil</button><button type="button" data-post-grade="pragmatic" data-post-id="${item.id}" data-quality="2">Dominei</button></div></details>`).join('') || '<p>Nenhuma aula encontrada.</p>';
    $('#pragmaticPage').textContent = `${pragmaticPage + 1}/${pages}`;
  }

  function renderReadings(reset = false) {
    if (reset) readingPage = 0;
    const genre = $('#readingGenre')?.value || 'all';
    const items = curriculum.readings.filter(item => genre === 'all' || item.genre === genre);
    const size = 6;
    const pages = Math.max(1, Math.ceil(items.length / size));
    readingPage = clamp(readingPage, 0, pages - 1);
    const slice = items.slice(readingPage * size, (readingPage + 1) * size);
    $('#postReadingGrid').innerHTML = slice.map(item => `<article class="post-reading-card"><span>${esc(item.genre)}</span><h3>${esc(item.title)}</h3><p lang="zh-Hans">${esc(item.zh)}</p><details><summary>Tradução de apoio</summary><p>${esc(item.pt)}</p></details><ul>${item.tasks.map(task => `<li>${esc(task)}</li>`).join('')}</ul><div class="reading-actions"><button type="button" data-post-speak="${esc(item.zh)}">▶ Ouvir</button><button type="button" data-analyze-reading="${item.id}">Analisar no laboratório</button></div></article>`).join('');
    $('#readingPage').textContent = `${readingPage + 1}/${pages}`;
  }

  function renderMissions(reset = false) {
    if (reset) missionPage = 0;
    const track = Number($('#missionTrack')?.value || 1);
    const status = $('#missionStatus')?.value || 'all';
    const items = curriculum.missions.filter(item => item.track === track && (status === 'all' || (status === 'done') === mastered('mission', item.id)));
    const size = 10;
    const pages = Math.max(1, Math.ceil(items.length / size));
    missionPage = clamp(missionPage, 0, pages - 1);
    const slice = items.slice(missionPage * size, (missionPage + 1) * size);
    $('#missionGrid').innerHTML = slice.map(item => `<article class="mission-card ${mastered('mission', item.id) ? 'completed' : ''}"><span>Etapa ${item.step}/10 · ${item.minimumMinutes} min</span><h3>${esc(item.title)}</h3><p>${esc(item.objective)}</p><dl><dt>Escopo</dt><dd>${esc(item.scope)}</dd><dt>Entrega</dt><dd>${esc(item.deliverable)}</dd></dl><button type="button" data-toggle-mission="${item.id}">${mastered('mission', item.id) ? '✓ Concluída' : 'Marcar evidência concluída'}</button></article>`).join('') || '<p>Nenhuma missão neste filtro.</p>';
    $('#missionPage').textContent = `${missionPage + 1}/${pages}`;
  }

  function renderRubric() {
    const root = $('#masteryRubric');
    if (!root) return;
    const labels = { inventory: 'Inventário', retrieval: 'Recuperação', listening: 'Escuta', reading: 'Leitura', speaking: 'Fala', writing: 'Escrita', transfer: 'Transferência' };
    root.innerHTML = Object.entries(curriculum.masteryRubric).map(([key, text]) => `<article><b>${labels[key] || key}</b><p>${esc(text)}</p></article>`).join('');
  }

  function exportProgress() {
    const payload = { type: 'bishun-post-standard-progress', version: VERSION, exportedAt: new Date().toISOString(), state };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `mandarim-pos-padrao-v${VERSION}.json`; a.click();
    URL.revokeObjectURL(url);
  }

  async function importProgress(file) {
    const parsed = JSON.parse(await file.text());
    if (parsed.type !== 'bishun-post-standard-progress' || !parsed.state) throw new Error('Arquivo de progresso incompatível.');
    state = { ...defaultState(), ...parsed.state };
    state.records ||= defaultState().records;
    Object.keys(defaultState().records).forEach(key => state.records[key] ||= {});
    save();
    renderAllPost();
  }

  function renderAllPost() {
    renderOverview();
    renderRecentTexts();
    renderPragmatics(true);
    renderReadings(true);
    renderMissions(true);
    renderRubric();
    renderLexicon(true);
    renderIdioms(true);
  }

  function bindEvents() {
    let lexTimer = null;
    let idiomTimer = null;
    let pragmaticTimer = null;
    $('#analyzeImmersion')?.addEventListener('click', () => analyzeImmersion(true));
    $('#speakImmersion')?.addEventListener('click', () => speak($('#immersionText').value, .78));
    $('#clearImmersion')?.addEventListener('click', () => { $('#immersionText').value = ''; $('#immersionTokenOutput').innerHTML = ''; $('#immersionStatus').textContent = 'Área limpa.'; });
    $('#saveImmersion')?.addEventListener('click', () => analyzeImmersion(true));
    $('#postLexSearch')?.addEventListener('input', () => { clearTimeout(lexTimer); lexTimer = setTimeout(() => renderLexicon(true), 320); });
    ['postLexMode','postDomainSelect','postRegisterSelect','postLexStatus'].forEach(id => $(`#${id}`)?.addEventListener('change', () => renderLexicon(true)));
    $('#postLexPrev')?.addEventListener('click', () => { lexPage -= 1; renderLexicon(); });
    $('#postLexNext')?.addEventListener('click', () => { lexPage += 1; renderLexicon(); });
    $('#idiomSearch')?.addEventListener('input', () => { clearTimeout(idiomTimer); idiomTimer = setTimeout(() => renderIdioms(true), 250); });
    $('#idiomStatus')?.addEventListener('change', () => renderIdioms(true));
    $('#idiomPrev')?.addEventListener('click', () => { idiomPage -= 1; renderIdioms(); });
    $('#idiomNext')?.addEventListener('click', () => { idiomPage += 1; renderIdioms(); });
    $('#pragmaticSearch')?.addEventListener('input', () => { clearTimeout(pragmaticTimer); pragmaticTimer = setTimeout(() => renderPragmatics(true), 250); });
    ['pragmaticCategory','pragmaticStatus'].forEach(id => $(`#${id}`)?.addEventListener('change', () => renderPragmatics(true)));
    $('#pragmaticPrev')?.addEventListener('click', () => { pragmaticPage -= 1; renderPragmatics(); });
    $('#pragmaticNext')?.addEventListener('click', () => { pragmaticPage += 1; renderPragmatics(); });
    $('#readingGenre')?.addEventListener('change', () => renderReadings(true));
    $('#readingPrev')?.addEventListener('click', () => { readingPage -= 1; renderReadings(); });
    $('#readingNext')?.addEventListener('click', () => { readingPage += 1; renderReadings(); });
    ['missionTrack','missionStatus'].forEach(id => $(`#${id}`)?.addEventListener('change', () => renderMissions(true)));
    $('#missionPrev')?.addEventListener('click', () => { missionPage -= 1; renderMissions(); });
    $('#missionNext')?.addEventListener('click', () => { missionPage += 1; renderMissions(); });
    $('#exportPostProgress')?.addEventListener('click', exportProgress);
    $('#importPostProgress')?.addEventListener('change', async event => {
      try { if (event.target.files?.[0]) await importProgress(event.target.files[0]); $('#postStatus').textContent = 'Progresso importado.'; }
      catch (error) { $('#postStatus').textContent = error.message; }
      event.target.value = '';
    });

    document.addEventListener('click', async event => {
      const button = event.target.closest('button');
      if (!button) return;
      if (button.dataset.postSpeak) speak(button.dataset.postSpeak, button.dataset.slow ? .58 : .82);
      if (button.dataset.postGrade) {
        grade(button.dataset.postGrade, button.dataset.postId, Number(button.dataset.quality));
        if (button.dataset.postGrade === 'lex') renderLexicon();
        if (button.dataset.postGrade === 'idiom') renderIdioms();
        if (button.dataset.postGrade === 'pragmatic') renderPragmatics();
      }
      if (button.dataset.tokenIndex !== undefined) renderTokenDetail(currentTokens[Number(button.dataset.tokenIndex)]);
      if (button.dataset.loadRecent !== undefined) {
        const item = state.recentTexts[Number(button.dataset.loadRecent)];
        if (item) { $('#immersionText').value = item.text; await analyzeImmersion(false); $('#imersao-aberta').scrollIntoView({ behavior: 'smooth' }); }
      }
      if (button.dataset.analyzeReading) {
        const item = curriculum.readings.find(reading => reading.id === Number(button.dataset.analyzeReading));
        if (item) { $('#immersionText').value = item.zh; await analyzeImmersion(true); $('#imersao-aberta').scrollIntoView({ behavior: 'smooth' }); }
      }
      if (button.dataset.toggleMission) {
        const id = Number(button.dataset.toggleMission);
        if (mastered('mission', id)) state.records.mission[id] = { level: 0, due: 0, attempts: 0, correct: 0, last: Date.now() };
        else state.records.mission[id] = { level: 4, due: Date.now() + 30 * DAY, attempts: 1, correct: 1, last: Date.now() };
        save(); renderMissions(); renderPostDashboard();
      }
      if (button.dataset.sampleText) {
        const item = curriculum.readings.find(reading => reading.id === Number(button.dataset.sampleText));
        if (item) { $('#immersionText').value = item.zh; await analyzeImmersion(true); }
      }
    });
  }

  async function init() {
    if (!$('#pos-padrao')) return;
    try {
      [meta, curriculum, coreMap] = await Promise.all([
        fetchJSON('./data/post/meta.json'),
        fetchJSON('./data/post/curriculum.json'),
        fetchJSON('./data/post/core-map.json')
      ]);
      document.documentElement.dataset.postStandard = VERSION;
      $$('[data-post-version]').forEach(element => element.textContent = VERSION);
      await initializePackFilters();
      const pragmaticCategories = [...new Set(curriculum.pragmatics.map(item => item.category))];
      $('#pragmaticCategory').innerHTML = '<option value="all">Todas as categorias</option>' + pragmaticCategories.map(category => `<option value="${esc(category)}">${esc(category)}</option>`).join('');
      const genres = [...new Set(curriculum.readings.map(item => item.genre))];
      $('#readingGenre').innerHTML = '<option value="all">Todos os gêneros</option>' + genres.map(genre => `<option value="${esc(genre)}">${esc(genre)}</option>`).join('');
      $('#missionTrack').innerHTML = curriculum.tracks.map(track => `<option value="${track.id}">${track.id}. ${esc(track.title)}</option>`).join('');
      $('#immersionSamples').innerHTML = curriculum.readings.slice(0, 8).map(item => `<button type="button" data-sample-text="${item.id}">${esc(item.genre)} · ${esc(item.title)}</button>`).join('');
      bindEvents();
      renderAllPost();
      if (state.lastText) $('#immersionText').value = state.lastText;
      $('#postStatus').textContent = 'Extensão pós-padrão pronta. Os dados pesados são carregados apenas quando necessários.';
    } catch (error) {
      console.error(error);
      if ($('#postStatus')) $('#postStatus').textContent = `Falha ao iniciar a extensão: ${error.message}`;
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
