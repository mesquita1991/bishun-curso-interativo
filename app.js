(() => {
  'use strict';

  const APP_VERSION = '5.0.0';
  const STORAGE = {
    completed: 'bishunCompleted',
    quizScore: 'bishunQuizScore',
    learning: 'bishunLearningV2',
    theme: 'bishunTheme',
    sound: 'bishunSoundEnabled',
    selected: 'bishunSelectedCharacter',
    fontScale: 'bishunFontScaleIndex'
  };

  const strokes = [
    { symbol: '丶', name: 'Ponto', pinyin: '点 · diǎn', spoken: '点', direction: 'movimento curto e descendente' },
    { symbol: '一', name: 'Horizontal', pinyin: '横 · héng', spoken: '横', direction: 'da esquerda para a direita' },
    { symbol: '丨', name: 'Vertical', pinyin: '竖 · shù', spoken: '竖', direction: 'de cima para baixo' },
    { symbol: '丿', name: 'Descendente à esquerda', pinyin: '撇 · piě', spoken: '撇', direction: 'do alto à direita para baixo à esquerda' },
    { symbol: '㇏', name: 'Descendente à direita', pinyin: '捺 · nà', spoken: '捺', direction: 'do alto à esquerda para baixo à direita' },
    { symbol: '㇀', name: 'Ascendente', pinyin: '提 · tí', spoken: '提', direction: 'de baixo para cima, geralmente à direita' },
    { symbol: '亅', name: 'Gancho', pinyin: '钩 · gōu', spoken: '钩', direction: 'mudança curta no final de outro traço' },
    { symbol: '𠃍', name: 'Dobra', pinyin: '折 · zhé', spoken: '折', direction: 'mudança de direção sem levantar a caneta' }
  ];

  const rules = [
    { title: 'De cima para baixo', zh: '先上后下', example: '二 · 三 · 字', body: 'As partes superiores estabelecem referência para as inferiores. Em 字, escreva 宀 antes de 子.' },
    { title: 'Da esquerda para a direita', zh: '先左后右', example: '你 · 好 · 明', body: 'Em estruturas laterais, conclua o componente esquerdo antes de iniciar o direito.' },
    { title: 'Horizontal antes da vertical', zh: '先横后竖', example: '十 · 干 · 丰', body: 'Quando os traços se cruzam, o horizontal normalmente precede o vertical.' },
    { title: 'Esquerda descendente antes da direita', zh: '先撇后捺', example: '人 · 大 · 木', body: 'O traço 撇 abre primeiro para a esquerda; depois 捺 equilibra o caractere à direita.' },
    { title: 'Exterior antes do interior', zh: '先外后内', example: '同 · 问 · 间', body: 'Comece a estrutura envolvente antes de escrever o conteúdo interno.' },
    { title: 'Feche a moldura por último', zh: '先外后内再封口', example: '国 · 回 · 园', body: 'Construa a caixa, escreva o conteúdo e só então faça o traço inferior de fechamento.' },
    { title: 'Centro antes dos lados', zh: '先中间后两边', example: '小 · 水', body: 'Em formas simétricas, o eixo central organiza os elementos laterais.' },
    { title: 'Traços atravessadores depois', zh: '穿插笔画多后写', example: '中 · 丰', body: 'O traço que atravessa a estrutura costuma vir após os elementos que ele cruza.' },
    { title: 'Pontos complementares no final', zh: '点画后补', example: '玉 · 犬', body: 'Pontos que apenas diferenciam ou completam a forma são frequentemente acrescentados por último.' },
    { title: 'Componentes especiais têm padrão próprio', zh: '特殊部件按规范', example: '这 · 近 · 道', body: 'Com 辶, por exemplo, o componente interno costuma vir antes do traço envolvente final.' }
  ];

  const coreCharacters = [
    { char: '一', pinyin: 'yī', meaning: 'um', strokes: 1, level: 1, tone: 1, structure: 'simples', articulation: '1º tom: voz alta e estável. Pronuncie a sílaba isolada sem acrescentar outra vogal.', order: ['Horizontal da esquerda para a direita.'] },
    { char: '二', pinyin: 'èr', meaning: 'dois', strokes: 2, level: 1, tone: 4, structure: 'cima–baixo', articulation: '4º tom: queda curta e firme. O final r é produzido com leve retroflexão da língua.', order: ['Horizontal superior.', 'Horizontal inferior, geralmente mais longo.'] },
    { char: '三', pinyin: 'sān', meaning: 'três', strokes: 3, level: 1, tone: 1, structure: 'cima–baixo', articulation: '1º tom: mantenha a altura constante. O s é surdo e contínuo.', order: ['Horizontal superior.', 'Horizontal central.', 'Horizontal inferior, mais longo.'] },
    { char: '十', pinyin: 'shí', meaning: 'dez', strokes: 2, level: 1, tone: 2, structure: 'cruzada', articulation: '2º tom: a voz sobe. Em sh, a ponta da língua fica levemente recolhida; não é o ch português.', order: ['Horizontal.', 'Vertical atravessando o centro.'] },
    { char: '人', pinyin: 'rén', meaning: 'pessoa', strokes: 2, level: 1, tone: 2, structure: 'aberta', articulation: '2º tom: subida clara. O r mandarim é retroflexo e não coincide com o r forte do português.', order: ['Descendente à esquerda — 撇.', 'Descendente à direita — 捺.'] },
    { char: '大', pinyin: 'dà', meaning: 'grande', strokes: 3, level: 1, tone: 4, structure: 'simétrica', articulation: '4º tom: desça a voz com decisão. O d é curto, sem sopro forte.', order: ['Horizontal.', 'Descendente à esquerda.', 'Descendente à direita.'] },
    { char: '小', pinyin: 'xiǎo', meaning: 'pequeno', strokes: 3, level: 1, tone: 3, structure: 'simétrica', articulation: '3º tom: mantenha a voz baixa; isoladamente pode haver leve recuperação. O x é produzido com a parte frontal da língua.', order: ['Vertical central com gancho.', 'Traço lateral esquerdo.', 'Ponto lateral direito.'] },
    { char: '口', pinyin: 'kǒu', meaning: 'boca', strokes: 3, level: 1, tone: 3, structure: 'moldura', articulation: '3º tom: voz baixa. O k é aspirado; perceba o pequeno sopro após a consoante.', order: ['Vertical esquerda.', 'Horizontal superior com dobra vertical à direita.', 'Horizontal inferior de fechamento.'] },
    { char: '山', pinyin: 'shān', meaning: 'montanha', strokes: 3, level: 1, tone: 1, structure: 'simétrica', articulation: '1º tom: altura constante. O sh é retroflexo; mantenha os lábios relaxados.', order: ['Vertical central.', 'Vertical esquerda com dobra horizontal.', 'Vertical direita.'] },
    { char: '川', pinyin: 'chuān', meaning: 'rio', strokes: 3, level: 1, tone: 1, structure: 'paralela', articulation: '1º tom: alto e nivelado. O ch é retroflexo e aspirado, com sopro perceptível.', order: ['Traço descendente à esquerda.', 'Vertical central.', 'Vertical direita.'] },
    { char: '日', pinyin: 'rì', meaning: 'sol; dia', strokes: 4, level: 2, tone: 4, structure: 'moldura', articulation: '4º tom: queda firme. Após r, o i não soa como o i português comum; priorize a imitação do áudio.', order: ['Vertical esquerda.', 'Horizontal superior com dobra vertical.', 'Horizontal interno.', 'Horizontal inferior de fechamento.'] },
    { char: '月', pinyin: 'yuè', meaning: 'lua; mês', strokes: 4, level: 2, tone: 4, structure: 'moldura', articulation: '4º tom. Em yue, os lábios começam arredondados; a grafia representa uma sequência próxima de üe.', order: ['Descendente vertical à esquerda.', 'Horizontal superior com dobra e gancho.', 'Primeiro horizontal interno.', 'Segundo horizontal interno.'] },
    { char: '木', pinyin: 'mù', meaning: 'árvore; madeira', strokes: 4, level: 2, tone: 4, structure: 'simétrica', articulation: '4º tom: queda curta. Feche bem a vogal u sem transformá-la em duas sílabas.', order: ['Horizontal.', 'Vertical.', 'Descendente à esquerda.', 'Descendente à direita.'] },
    { char: '水', pinyin: 'shuǐ', meaning: 'água', strokes: 4, level: 2, tone: 3, structure: 'simétrica', articulation: '3º tom: voz baixa. A sequência ui é contraída no pinyin; ouça o modelo em vez de ler como português.', order: ['Vertical central com gancho.', 'Traço composto à esquerda.', 'Descendente curto à direita.', 'Descendente longo à direita.'] },
    { char: '火', pinyin: 'huǒ', meaning: 'fogo', strokes: 4, level: 2, tone: 3, structure: 'simétrica', articulation: '3º tom: mantenha a sílaba baixa. O h é uma fricção suave; a sequência uo deve permanecer unida.', order: ['Ponto à esquerda.', 'Traço curto à direita.', 'Descendente à esquerda.', 'Descendente à direita.'] },
    { char: '田', pinyin: 'tián', meaning: 'campo', strokes: 5, level: 2, tone: 2, structure: 'moldura', articulation: '2º tom: subida nítida. O t é aspirado; o final n encerra a sílaba sem vogal adicional.', order: ['Vertical esquerda.', 'Horizontal superior com dobra vertical.', 'Horizontal interno.', 'Vertical interno.', 'Horizontal inferior de fechamento.'] },
    { char: '中', pinyin: 'zhōng', meaning: 'centro; China', strokes: 4, level: 2, tone: 1, structure: 'atravessada', articulation: '1º tom: alto e estável. Zh é retroflexo e não aspirado; ong termina nasal.', order: ['Vertical esquerda da moldura.', 'Horizontal superior com dobra vertical.', 'Horizontal inferior de fechamento.', 'Vertical central atravessadora.'] },
    { char: '好', pinyin: 'hǎo', meaning: 'bom; bem', strokes: 6, level: 3, tone: 3, structure: 'esquerda–direita', articulation: '3º tom: baixo. Mantenha ao como uma única sílaba; neste curso, 好 é lido hǎo, “bom”.', order: ['女: dobra descendente.', '女: descendente à esquerda.', '女: horizontal ascendente.', '子: dobra horizontal com gancho.', '子: vertical com gancho.', '子: horizontal.'] },
    { char: '休', pinyin: 'xiū', meaning: 'descansar', strokes: 6, level: 3, tone: 1, structure: 'esquerda–direita', articulation: '1º tom: estável. O x usa a parte frontal da língua; iu é uma contração do pinyin e deve ser ouvido como unidade.', order: ['亻: descendente à esquerda.', '亻: vertical.', '木: horizontal.', '木: vertical.', '木: descendente à esquerda.', '木: descendente à direita.'] },
    { char: '明', pinyin: 'míng', meaning: 'brilhante; claro', strokes: 8, level: 3, tone: 2, structure: 'esquerda–direita', articulation: '2º tom: suba a voz. O final ng é nasal velar; não acrescente uma vogal depois dele.', order: ['Conclua os quatro traços de 日.', 'Depois escreva os quatro traços de 月.'] },
    { char: '你', pinyin: 'nǐ', meaning: 'você', strokes: 7, level: 3, tone: 3, structure: 'esquerda–direita', articulation: '3º tom: mantenha a voz baixa. Em fala conectada, o contorno pode mudar; pratique primeiro a forma isolada.', order: ['Conclua 亻 à esquerda.', 'Depois escreva 尔 à direita, de cima para baixo.'] },
    { char: '妈', pinyin: 'mā', meaning: 'mãe', strokes: 6, level: 3, tone: 1, structure: 'esquerda–direita', articulation: '1º tom: alto e nivelado. Compare com má, mǎ e mà para perceber que o tom muda o significado.', order: ['Conclua 女 à esquerda.', 'Depois escreva 马 à direita.'] },
    { char: '字', pinyin: 'zì', meaning: 'caractere; palavra escrita', strokes: 6, level: 3, tone: 4, structure: 'cima–baixo', articulation: '4º tom: queda firme. Z se aproxima de uma africada ts sem aspiração; o i final é especial após z.', order: ['宀: ponto central.', '宀: ponto à esquerda.', '宀: horizontal com gancho.', '子: dobra horizontal.', '子: vertical com gancho.', '子: horizontal.'] },
    { char: '国', pinyin: 'guó', meaning: 'país', strokes: 8, level: 3, tone: 2, structure: 'moldura', articulation: '2º tom: subida clara. O g é não aspirado; mantenha uo unido e finalize sem vogal extra.', order: ['Inicie 囗: vertical esquerda.', 'Faça o topo e a lateral direita.', 'Escreva 玉 no interior.', 'Feche a moldura com o horizontal inferior.'] }
  ];

  const toneFromPinyin = value => {
    if (/[āēīōūǖ]/.test(value)) return 1;
    if (/[áéíóúǘ]/.test(value)) return 2;
    if (/[ǎěǐǒǔǚ]/.test(value)) return 3;
    if (/[àèìòùǜ]/.test(value)) return 4;
    return 0;
  };
  const extraCharacters = (window.BISHUN_CURRICULUM?.characters || [])
    .filter(item => !coreCharacters.some(core => core.char === item.char))
    .map(item => ({
      char: item.char,
      pinyin: item.pinyin,
      meaning: item.meaning,
      strokes: '—',
      level: Math.ceil(item.unit / 10),
      tone: toneFromPinyin(item.pinyin),
      structure: `HSK 1 · unidade ${String(item.unit).padStart(2, '0')}`,
      articulation: item.note || `${toneFromPinyin(item.pinyin) ? `${toneFromPinyin(item.pinyin)}º tom` : 'Tom neutro ou leitura contextual'}. Ouça o modelo e repita sem inserir vogais extras.`,
      order: ['Observe a animação normativa.', 'Repita no modo guiado.', 'Consolide no modo desafio.']
    }));
  const characters = [...coreCharacters, ...extraCharacters];

  const toneExamples = [
    { tone: '1º tom', contour: 'alto e nivelado', mark: '¯', char: '妈', pinyin: 'mā', meaning: 'mãe', rate: 0.72 },
    { tone: '2º tom', contour: 'ascendente', mark: '´', char: '麻', pinyin: 'má', meaning: 'cânhamo', rate: 0.72 },
    { tone: '3º tom', contour: 'baixo; queda e recuperação no modelo isolado', mark: 'ˇ', char: '马', pinyin: 'mǎ', meaning: 'cavalo', rate: 0.72 },
    { tone: '4º tom', contour: 'descendente e firme', mark: '`', char: '骂', pinyin: 'mà', meaning: 'repreender', rate: 0.72 },
    { tone: 'Neutro', contour: 'curto e leve', mark: '·', char: '吗', pinyin: 'ma', meaning: 'partícula interrogativa', rate: 0.82 }
  ];

  const mistakes = [
    ['Desenhar o contorno', 'O caractere vira uma figura geométrica.', 'Construa-o movimento por movimento.'],
    ['Fazer 口 com quatro linhas', 'A dobra é ignorada.', 'Lembre: 口 possui três traços.'],
    ['Inverter a direção', 'A forma pode parecer próxima, mas o gesto fica artificial.', 'Aprenda ordem e direção juntas.'],
    ['Copiar só a forma final', 'A imagem estática não mostra o percurso.', 'Veja uma animação antes de copiar.'],
    ['Acelerar cedo demais', 'Erros passam para a memória motora.', 'Precisão primeiro; velocidade depois.'],
    ['Dar o mesmo espaço a tudo', 'Componentes perdem proporção.', 'Observe peso visual e complexidade.'],
    ['Copiar muitas vezes sem revisão', 'Cria familiaridade curta, não retenção.', 'Use revisão espaçada.'],
    ['Inventar quando houver dúvida', 'Regras gerais têm exceções.', 'Consulte um padrão confiável.']
  ];

  const studySteps = [
    ['Observe o todo', 'Identifique se a estrutura é simples, lateral, vertical, simétrica ou envolvente.'],
    ['Separe os componentes', 'Reconheça blocos já conhecidos antes de memorizar o conjunto.'],
    ['Ouça a pronúncia', 'Associe caractere, pinyin, tom e significado antes da escrita.'],
    ['Assista à animação', 'Veja ordem, direção, cruzamentos e fechamentos.'],
    ['Conte os traços', 'Numere a sequência em voz alta para torná-la consciente.'],
    ['Copie olhando', 'Escreva lentamente três a cinco vezes.'],
    ['Escreva sem olhar', 'Recupere a sequência da memória, não apenas a silhueta.'],
    ['Compare e corrija', 'Cheque traços, proporção, centro e direção.'],
    ['Revise em intervalos', 'Mesmo dia, dia seguinte, três dias, uma semana e duas semanas.']
  ];

  const quizQuestions = [
    { q: 'Qual é a direção normal de um traço horizontal?', options: ['Direita → esquerda', 'Esquerda → direita', 'Baixo → cima'], answer: 1, explanation: '横 · héng normalmente vai da esquerda para a direita.' },
    { q: 'Quantos traços possui 口?', options: ['2', '3', '4'], answer: 1, explanation: 'A parte superior e a lateral direita formam um único traço dobrado.' },
    { q: 'Em 十, qual traço vem primeiro?', options: ['Vertical', 'Horizontal', 'Ambos são simultâneos'], answer: 1, explanation: 'A regra geral é horizontal antes da vertical.' },
    { q: 'Em 人, qual movimento vem primeiro?', options: ['Descendente à direita', 'Ponto', 'Descendente à esquerda'], answer: 2, explanation: '撇 precede 捺.' },
    { q: 'Como se escreve uma moldura como 国?', options: ['Fechar, preencher, abrir', 'Exterior, interior, fechamento', 'Interior, exterior, centro'], answer: 1, explanation: 'A moldura é iniciada, o conteúdo é escrito e a base é fechada no final.' },
    { q: 'Qual componente é escrito primeiro em 好?', options: ['子', '女', 'Os dois alternadamente'], answer: 1, explanation: 'Em estruturas esquerda–direita, conclua o bloco esquerdo primeiro.' },
    { q: 'O acento de hǎo indica qual tom?', options: ['1º', '3º', '4º'], answer: 1, explanation: 'O caron ǎ marca o terceiro tom.' },
    { q: 'Em uma forma simétrica como 小, o que costuma vir primeiro?', options: ['O eixo central', 'O lado direito', 'O traço mais longo'], answer: 0, explanation: 'O centro organiza os elementos laterais.' },
    { q: 'Qual prática favorece mais a retenção?', options: ['Copiar 50 vezes em uma sessão', 'Ouvir, recuperar e revisar em intervalos', 'Olhar sem escrever'], answer: 1, explanation: 'Recuperação ativa e revisão espaçada reforçam a aprendizagem.' },
    { q: 'Qual afirmação é mais correta?', options: ['Todo ponto vem por último', 'Toda estrutura externa fecha primeiro', 'Regras gerais têm exceções estruturais'], answer: 2, explanation: 'Pontos superiores e componentes como 辶 demonstram que a estrutura específica importa.' }
  ];

  const state = {
    writer: null,
    heroWriter: null,
    currentCharacter: characters.find(item => item.char === localStorage.getItem(STORAGE.selected)) || characters[0],
    fontScaleIndex: Number(localStorage.getItem(STORAGE.fontScale) || 0),
    fontScales: [1, 1.1, 1.2],
    voices: [],
    soundEnabled: localStorage.getItem(STORAGE.sound) !== 'false',
    liveMistakes: 0
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function safeParse(value, fallback) {
    try { return JSON.parse(value); } catch { return fallback; }
  }

  function getLearningData() {
    const parsed = safeParse(localStorage.getItem(STORAGE.learning) || '{}', {});
    return parsed && typeof parsed === 'object' ? parsed : {};
  }

  function getRecord(char) {
    const data = getLearningData();
    return { listens: 0, attempts: 0, completions: 0, mistakes: 0, mastered: false, ...(data[char] || {}) };
  }

  function saveRecord(char, patch) {
    const data = getLearningData();
    data[char] = { ...getRecord(char), ...patch };
    localStorage.setItem(STORAGE.learning, JSON.stringify(data));
    renderDashboard();
    renderCharacterInfo();
    renderCharacterCards();
  }

  function confidence(record) {
    return clamp(
      Math.round(Math.min(record.listens, 4) * 5 + Math.min(record.attempts, 3) * 10 + Math.min(record.completions, 2) * 20 + (record.mastered ? 10 : 0) - record.mistakes * 2),
      0,
      100
    );
  }

  function toneName(number) {
    return ({ 1: 'alto e nivelado', 2: 'ascendente', 3: 'baixo / curvo', 4: 'descendente', 0: 'neutro' })[number] || '';
  }

  function renderVersion() {
    $$('[data-version]').forEach(node => { node.textContent = APP_VERSION; });
  }

  function renderStrokes() {
    $('#strokeGrid').innerHTML = strokes.map(item => `
      <article class="stroke-card">
        <div class="stroke-symbol" aria-hidden="true">${item.symbol}</div>
        <h3>${item.name}</h3>
        <p>${item.direction}</p>
        <div class="stroke-card-foot"><small>${item.pinyin}</small><button class="tiny-sound" type="button" data-speak="${item.spoken}" data-rate="0.78" aria-label="Ouvir ${item.pinyin}">🔊</button></div>
      </article>`).join('');
  }

  function renderRules() {
    $('#rulesList').innerHTML = rules.map((rule, i) => `
      <article class="rule-item">
        <button class="rule-header" type="button" aria-expanded="false">
          <span class="rule-index">${String(i + 1).padStart(2, '0')}</span>
          <span class="rule-title"><strong>${rule.title}</strong><small>${rule.zh}</small></span>
          <span class="rule-example" aria-hidden="true">${rule.example}</span>
          <span class="rule-toggle" aria-hidden="true">+</span>
        </button>
        <div class="rule-body"><p>${rule.body}</p></div>
      </article>`).join('');

    $$('.rule-header').forEach(button => {
      button.addEventListener('click', () => {
        const item = button.closest('.rule-item');
        const open = item.classList.toggle('open');
        button.setAttribute('aria-expanded', String(open));
      });
    });
  }

  function renderTones() {
    $('#toneGrid').innerHTML = toneExamples.map(item => `
      <article class="tone-card">
        <div class="tone-contour" aria-hidden="true"><span>${item.mark}</span></div>
        <div><span class="tone-label">${item.tone}</span><h3>${item.char} · ${item.pinyin}</h3><p>${item.meaning} · ${item.contour}</p></div>
        <button class="tone-sound" type="button" data-speak="${item.char}" data-rate="${item.rate}" aria-label="Ouvir ${item.char}, ${item.pinyin}">🔊 Ouvir</button>
      </article>`).join('');
  }

  function renderMistakes() {
    $('#mistakesGrid').innerHTML = mistakes.map(([title, problem, fix]) => `
      <article class="mistake-card"><h3>${title}</h3><p>${problem}</p><strong>Correção: ${fix}</strong></article>`).join('');
  }

  function renderStudySteps() {
    $('#studySteps').innerHTML = studySteps.map(([title, text]) => `<li><div><h3>${title}</h3><p>${text}</p></div></li>`).join('');
  }

  function fillCharacterSelect() {
    $('#characterSelect').innerHTML = characters.map(item => `<option value="${item.char}">${item.char} · ${item.pinyin} · ${item.meaning}</option>`).join('');
    $('#characterSelect').value = state.currentCharacter.char;
  }

  function getVisibleCharacters() {
    const filter = ($('#characterSearch')?.value || '').trim().toLocaleLowerCase('pt-BR');
    const level = $('#levelFilter')?.value || 'all';
    const mastery = $('#masteryFilter')?.value || 'all';
    return characters.filter(item => {
      const textMatch = [item.char, item.pinyin, item.meaning, item.structure].join(' ').toLocaleLowerCase('pt-BR').includes(filter);
      const levelMatch = level === 'all' || String(item.level) === level;
      const mastered = getRecord(item.char).mastered;
      const masteryMatch = mastery === 'all' || (mastery === 'mastered' ? mastered : !mastered);
      return textMatch && levelMatch && masteryMatch;
    });
  }

  function renderCharacterCards() {
    const visible = getVisibleCharacters();
    $('#characterCards').innerHTML = visible.map(item => {
      const record = getRecord(item.char);
      const score = confidence(record);
      return `
        <article class="character-card ${item.char === state.currentCharacter.char ? 'active' : ''} ${record.mastered ? 'mastered' : ''}">
          <button class="character-card-main" type="button" data-char="${item.char}" aria-label="Treinar ${item.char}, ${item.pinyin}">
            <span class="hanzi">${item.char}</span>
            <span class="card-copy"><b>${item.pinyin}</b><small>${item.meaning}</small></span>
            <span class="mastery-dot" title="Domínio ${score}%">${record.mastered ? '✓' : `${score}%`}</span>
          </button>
          <button class="card-sound" type="button" data-character-speak="${item.char}" aria-label="Ouvir ${item.char}, ${item.pinyin}">🔊</button>
        </article>`;
    }).join('') || '<p class="empty-state">Nenhum caractere corresponde aos filtros.</p>';

    $$('.character-card-main').forEach(button => button.addEventListener('click', () => selectCharacter(button.dataset.char, true, true)));
    $$('[data-character-speak]').forEach(button => button.addEventListener('click', () => {
      const item = characters.find(character => character.char === button.dataset.characterSpeak);
      speak(item?.char || button.dataset.characterSpeak, 0.78, item?.char || null);
    }));
  }

  function renderCharacterInfo() {
    const item = state.currentCharacter;
    const record = getRecord(item.char);
    const score = confidence(record);
    $('#characterMeta').innerHTML = `
      <div class="big-meta"><strong>${item.char}</strong><div><b>${item.pinyin}</b><span class="tone-chip tone-${item.tone}">${item.tone}º tom · ${toneName(item.tone)}</span></div></div>
      <p>${item.meaning}</p>
      <p><b>${item.strokes}</b> ${item.strokes === 1 ? 'traço' : 'traços'} · estrutura ${item.structure}</p>`;
    $('#pronunciationTip').innerHTML = `<strong>Dica individual:</strong> ${item.articulation}`;
    $('#strokeSequence').innerHTML = item.order.map(step => `<li>${step}</li>`).join('');
    $('#levelBadge').textContent = `Nível ${item.level}`;
    $('#characterStats').innerHTML = `
      <div class="mastery-meter"><span><b>Domínio estimado</b><em>${score}%</em></span><div><i style="width:${score}%"></i></div></div>
      <dl><div><dt>Escutas</dt><dd>${record.listens}</dd></div><div><dt>Tentativas</dt><dd>${record.attempts}</dd></div><div><dt>Conclusões</dt><dd>${record.completions}</dd></div><div><dt>Erros</dt><dd>${record.mistakes}</dd></div></dl>`;
    const masteryButton = $('#masteryButton');
    masteryButton.classList.toggle('is-mastered', record.mastered);
    masteryButton.textContent = record.mastered ? '★ Caractere dominado' : '☆ Marcar como dominado';
  }

  function createWriter() {
    const target = $('#writerTarget');
    target.innerHTML = '';
    const size = Math.min(340, Math.max(260, target.clientWidth || 340));
    target.style.width = `${size}px`;
    target.style.height = `${size}px`;

    if (!window.HanziWriter) {
      state.writer = null;
      target.innerHTML = `<div class="writer-fallback" style="font-size:${size * 0.65}px">${state.currentCharacter.char}</div>`;
      $('#trainerStatus').textContent = 'A biblioteca de animação não carregou. Pronúncia e sequência textual continuam disponíveis.';
      return;
    }

    const styles = getComputedStyle(document.documentElement);
    const ink = styles.getPropertyValue('--ink').trim();
    const line = styles.getPropertyValue('--line').trim();
    const accent = styles.getPropertyValue('--accent').trim();
    const speed = Number($('#speedRange').value);

    try {
      state.writer = HanziWriter.create(target, state.currentCharacter.char, {
        width: size,
        height: size,
        padding: 26,
        showOutline: $('#outlineToggle').checked,
        showCharacter: true,
        strokeColor: ink,
        outlineColor: line,
        highlightColor: accent,
        drawingColor: accent,
        drawingWidth: 7,
        strokeAnimationSpeed: speed,
        strokeHighlightSpeed: speed,
        delayBetweenStrokes: 260
      });
    } catch (error) {
      console.error(error);
      state.writer = null;
      target.innerHTML = `<div class="writer-fallback" style="font-size:${size * 0.65}px">${state.currentCharacter.char}</div>`;
      $('#trainerStatus').textContent = 'Não foi possível iniciar a animação. Use a sequência textual e tente recarregar a página.';
    }
  }

  function selectCharacter(char, scroll = false, fromUser = false) {
    state.currentCharacter = characters.find(item => item.char === char) || characters[0];
    localStorage.setItem(STORAGE.selected, state.currentCharacter.char);
    $('#characterSelect').value = state.currentCharacter.char;
    renderCharacterInfo();
    renderCharacterCards();
    createWriter();
    $('#trainerStatus').textContent = 'Comece ouvindo a pronúncia; depois observe e escreva.';
    if (fromUser && $('#autoSpeakToggle').checked) speak(state.currentCharacter.char, 0.78, state.currentCharacter.char);
    if (scroll) $('#treinador').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function stepCharacter(direction) {
    const index = characters.findIndex(item => item.char === state.currentCharacter.char);
    const next = (index + direction + characters.length) % characters.length;
    selectCharacter(characters[next].char, false, true);
  }

  function getChineseVoice() {
    return state.voices.find(voice => voice.lang.toLowerCase() === 'zh-cn')
      || state.voices.find(voice => voice.lang.toLowerCase().startsWith('zh'))
      || null;
  }

  function updateVoiceStatus() {
    const status = $('#voiceStatus');
    if (!('speechSynthesis' in window)) {
      status.textContent = 'Este navegador não oferece síntese de voz. Use o pinyin e a indicação tonal.';
      document.body.classList.add('speech-unavailable');
      return;
    }
    const voice = getChineseVoice();
    status.textContent = voice
      ? `Voz chinesa detectada: ${voice.name} (${voice.lang}).`
      : 'Nenhuma voz chinesa específica foi detectada; o navegador tentará usar a voz padrão.';
  }

  function loadVoices() {
    if (!('speechSynthesis' in window)) return;
    state.voices = window.speechSynthesis.getVoices();
    updateVoiceStatus();
  }

  function speak(text, rate = 0.78, trackedChar = null) {
    if (!state.soundEnabled) {
      $('#trainerStatus').textContent = 'O áudio está desativado no topo da página.';
      return;
    }
    if (!('speechSynthesis' in window)) {
      $('#trainerStatus').textContent = 'A síntese de voz não é suportada neste navegador.';
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = rate;
    utterance.pitch = 1;
    const voice = getChineseVoice();
    if (voice) utterance.voice = voice;
    utterance.onstart = () => {
      if (trackedChar && characters.some(item => item.char === trackedChar)) {
        const record = getRecord(trackedChar);
        saveRecord(trackedChar, { listens: record.listens + 1 });
      }
      if (trackedChar === state.currentCharacter.char) {
        $('#trainerStatus').textContent = rate < 0.7 ? 'Pronúncia lenta em reprodução.' : 'Pronúncia em reprodução. Repita uma vez.';
      }
    };
    utterance.onerror = () => {
      $('#trainerStatus').textContent = 'A voz do sistema não conseguiu reproduzir este item. O pinyin permanece disponível.';
    };
    window.speechSynthesis.speak(utterance);
  }

  function setupSound() {
    loadVoices();
    if ('speechSynthesis' in window) window.speechSynthesis.onvoiceschanged = loadVoices;

    document.addEventListener('click', event => {
      const button = event.target.closest('[data-speak]');
      if (!button) return;
      const text = button.dataset.speak;
      const rate = Number(button.dataset.rate || 0.78);
      const tracked = characters.some(item => item.char === text) ? text : null;
      speak(text, rate, tracked);
    });

    const toggle = $('#soundToggle');
    const updateToggle = () => {
      toggle.textContent = state.soundEnabled ? '🔊' : '🔇';
      toggle.setAttribute('aria-label', state.soundEnabled ? 'Desativar sons' : 'Ativar sons');
      toggle.classList.toggle('muted', !state.soundEnabled);
    };
    updateToggle();
    toggle.addEventListener('click', () => {
      state.soundEnabled = !state.soundEnabled;
      localStorage.setItem(STORAGE.sound, String(state.soundEnabled));
      if (!state.soundEnabled && 'speechSynthesis' in window) window.speechSynthesis.cancel();
      updateToggle();
    });
  }

  function setupWriterControls() {
    $('#characterSelect').addEventListener('change', event => selectCharacter(event.target.value, false, true));
    $('#previousCharacter').addEventListener('click', () => stepCharacter(-1));
    $('#nextCharacter').addEventListener('click', () => stepCharacter(1));
    $('#characterSearch').addEventListener('input', renderCharacterCards);
    $('#levelFilter').addEventListener('change', renderCharacterCards);
    $('#masteryFilter').addEventListener('change', renderCharacterCards);
    $('#speedRange').addEventListener('change', createWriter);
    $('#outlineToggle').addEventListener('change', createWriter);

    $('#speakNormalButton').addEventListener('click', () => speak(state.currentCharacter.char, 0.78, state.currentCharacter.char));
    $('#speakSlowButton').addEventListener('click', () => speak(state.currentCharacter.char, 0.55, state.currentCharacter.char));

    $('#animateButton').addEventListener('click', async () => {
      if (!state.writer) return;
      $('#trainerStatus').textContent = 'Animação em andamento: observe começo, direção e término de cada traço.';
      try {
        await state.writer.animateCharacter();
        $('#trainerStatus').textContent = 'Animação concluída. Agora inicie a escrita.';
      } catch {
        $('#trainerStatus').textContent = 'A animação não pôde ser concluída. Tente limpar e repetir.';
      }
    });

    $('#quizButton').addEventListener('click', () => {
      if (!state.writer) return;
      const mode = $('input[name="practiceMode"]:checked').value;
      const record = getRecord(state.currentCharacter.char);
      saveRecord(state.currentCharacter.char, { attempts: record.attempts + 1 });
      state.liveMistakes = 0;
      $('#trainerStatus').textContent = mode === 'guided'
        ? 'Modo guiado: desenhe o primeiro traço; uma dica aparece após duas falhas.'
        : 'Modo desafio: escreva sem ajuda. O sistema só sinaliza acerto ou erro.';
      state.writer.quiz({
        showHintAfterMisses: mode === 'guided' ? 2 : 99,
        highlightOnComplete: true,
        onMistake: data => {
          state.liveMistakes += 1;
          $('#trainerStatus').textContent = `Traço ${data.strokeNum + 1}: tente novamente e verifique a direção.`;
        },
        onCorrectStroke: data => {
          $('#trainerStatus').textContent = `Traço ${data.strokeNum + 1} correto.`;
        },
        onComplete: summary => {
          const current = getRecord(state.currentCharacter.char);
          const totalMistakes = Number.isFinite(summary.totalMistakes) ? summary.totalMistakes : state.liveMistakes;
          const completions = current.completions + 1;
          const mistakesTotal = current.mistakes + totalMistakes;
          const autoMastered = current.mastered || (completions >= 2 && mistakesTotal / completions <= 1);
          saveRecord(state.currentCharacter.char, { completions, mistakes: mistakesTotal, mastered: autoMastered });
          $('#trainerStatus').textContent = `Concluído com ${totalMistakes} ${totalMistakes === 1 ? 'erro' : 'erros'}. ${autoMastered ? 'Domínio consolidado.' : 'Repita para consolidar.'}`;
        }
      });
    });

    $('#resetWriterButton').addEventListener('click', () => {
      createWriter();
      $('#trainerStatus').textContent = 'Área limpa. O histórico de aprendizagem foi preservado.';
    });

    $('#masteryButton').addEventListener('click', () => {
      const record = getRecord(state.currentCharacter.char);
      saveRecord(state.currentCharacter.char, { mastered: !record.mastered });
      $('#trainerStatus').textContent = record.mastered ? 'Marcação de domínio removida.' : 'Caractere marcado como dominado.';
    });
  }

  function renderQuiz() {
    $('#quizContainer').innerHTML = quizQuestions.map((item, index) => `
      <article class="quiz-question" data-index="${index}">
        <fieldset>
          <legend>${index + 1}. ${item.q}</legend>
          <div class="quiz-options">
            ${item.options.map((option, optionIndex) => `
              <label class="quiz-option"><input type="radio" name="quiz-${index}" value="${optionIndex}"><span>${option}</span></label>`).join('')}
          </div>
          <div class="quiz-feedback">${item.explanation}</div>
        </fieldset>
      </article>`).join('');
    $('#quizResult').innerHTML = '';
  }

  function setupQuiz() {
    $('#submitQuiz').addEventListener('click', () => {
      let score = 0;
      quizQuestions.forEach((item, index) => {
        const container = $(`.quiz-question[data-index="${index}"]`);
        const selected = $(`input[name="quiz-${index}"]:checked`);
        container.classList.remove('correct', 'wrong');
        if (selected && Number(selected.value) === item.answer) {
          score += 1;
          container.classList.add('correct');
        } else {
          container.classList.add('wrong');
        }
      });
      const message = score >= 9 ? 'Domínio excelente.' : score >= 7 ? 'Boa base; revise os erros.' : score >= 5 ? 'Base parcial; retome as regras.' : 'Recomece pelos fundamentos.';
      $('#quizResult').innerHTML = `<div class="quiz-score">Resultado: ${score}/10 — ${message}</div>`;
      localStorage.setItem(STORAGE.quizScore, String(score));
    });
    $('#restartQuiz').addEventListener('click', renderQuiz);
  }

  function getCompletedModules() {
    const value = safeParse(localStorage.getItem(STORAGE.completed) || '[]', []);
    return Array.isArray(value) ? value : [];
  }

  function saveCompletedModules(list) {
    localStorage.setItem(STORAGE.completed, JSON.stringify(list));
  }

  function updateProgressUI() {
    const completed = getCompletedModules();
    const total = $$('.module').length;
    const validCompleted = completed.filter(id => $(`.module[data-module="${id}"]`));
    const percentage = Math.round((validCompleted.length / total) * 100);
    $('#progressLabel').textContent = `${validCompleted.length} de ${total} módulos concluídos`;
    $('#progressBar').style.width = `${percentage}%`;
    $('.progress-track').setAttribute('aria-valuenow', String(percentage));
    $$('.module').forEach(module => {
      const button = $('.complete-button', module);
      const done = validCompleted.includes(module.dataset.module);
      button.classList.toggle('is-complete', done);
      button.textContent = done ? '✓ Módulo concluído' : 'Marcar módulo como concluído';
    });
    renderDashboard();
  }

  function setupProgress() {
    $$('.module').forEach(module => {
      $('.complete-button', module).addEventListener('click', () => {
        const completed = new Set(getCompletedModules());
        if (completed.has(module.dataset.module)) completed.delete(module.dataset.module);
        else completed.add(module.dataset.module);
        saveCompletedModules([...completed]);
        updateProgressUI();
      });
    });
    $('#resetProgress').addEventListener('click', () => {
      const confirmed = window.confirm('Reiniciar módulos, avaliação e métricas individuais neste navegador?');
      if (!confirmed) return;
      Object.values(STORAGE).forEach(key => {
        if (![STORAGE.theme, STORAGE.sound, STORAGE.fontScale].includes(key)) localStorage.removeItem(key);
      });
      state.currentCharacter = characters[0];
      fillCharacterSelect();
      selectCharacter(characters[0].char);
      updateProgressUI();
      renderQuiz();
    });
    updateProgressUI();
  }

  function renderDashboard() {
    if (!$('#statModules')) return;
    const completed = getCompletedModules().length;
    const records = characters.map(item => getRecord(item.char));
    const listens = records.reduce((sum, record) => sum + record.listens, 0);
    const attempts = records.reduce((sum, record) => sum + record.attempts, 0);
    const mastered = records.filter(record => record.mastered).length;
    $('#statModules').textContent = `${completed}/${$$('.module').length}`;
    $('#statListens').textContent = String(listens);
    $('#statAttempts').textContent = String(attempts);
    $('#statMastered').textContent = `${mastered}/${characters.length}`;
    renderDailyChallenge();
  }

  function renderDailyChallenge() {
    const today = new Date();
    const key = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    const seed = [...key].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const item = characters[seed % characters.length];
    const record = getRecord(item.char);
    $('#dailyChallenge').innerHTML = `
      <div><span class="eyebrow">Desafio do dia</span><strong>${item.char} · ${item.pinyin}</strong><p>Ouça, anime e conclua uma escrita de ${item.meaning}.</p></div>
      <div class="daily-status"><span>${record.completions ? `${record.completions} conclusão(ões)` : 'Ainda não treinado'}</span><button id="startDailyChallenge" class="button secondary" type="button">Treinar agora</button></div>`;
    $('#startDailyChallenge').addEventListener('click', () => selectCharacter(item.char, true, true));
  }

  function setupThemeAndFont() {
    const savedTheme = localStorage.getItem(STORAGE.theme);
    if (savedTheme) document.documentElement.dataset.theme = savedTheme;
    state.fontScaleIndex = clamp(state.fontScaleIndex, 0, state.fontScales.length - 1);
    document.documentElement.style.setProperty('--font-scale', state.fontScales[state.fontScaleIndex]);

    $('#themeButton').addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      localStorage.setItem(STORAGE.theme, next);
      createWriter();
      initHeroWriter();
    });

    const updateFontButton = () => {
      $('#fontButton').textContent = state.fontScaleIndex === 0 ? 'A+' : state.fontScaleIndex === 1 ? 'A++' : 'A';
    };
    updateFontButton();
    $('#fontButton').addEventListener('click', () => {
      state.fontScaleIndex = (state.fontScaleIndex + 1) % state.fontScales.length;
      document.documentElement.style.setProperty('--font-scale', state.fontScales[state.fontScaleIndex]);
      localStorage.setItem(STORAGE.fontScale, String(state.fontScaleIndex));
      updateFontButton();
    });
  }

  function setupMenu() {
    const button = $('#menuButton');
    const nav = $('#mobileNav');
    button.addEventListener('click', () => {
      const open = nav.hidden;
      nav.hidden = !open;
      button.setAttribute('aria-expanded', String(open));
    });
    $$('#mobileNav a').forEach(link => link.addEventListener('click', () => {
      nav.hidden = true;
      button.setAttribute('aria-expanded', 'false');
    }));
  }

  function initHeroWriter() {
    if (!window.HanziWriter || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const target = $('#heroHanzi');
    target.textContent = '';
    try {
      state.heroWriter = HanziWriter.create(target, '永', {
        width: 340,
        height: 340,
        padding: 38,
        showOutline: true,
        showCharacter: false,
        strokeColor: getComputedStyle(document.documentElement).getPropertyValue('--ink').trim(),
        outlineColor: getComputedStyle(document.documentElement).getPropertyValue('--line').trim(),
        highlightColor: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),
        strokeAnimationSpeed: 1,
        delayBetweenStrokes: 220
      });
      state.heroWriter.loopCharacterAnimation();
    } catch {
      target.textContent = '永';
    }
  }

  function registerServiceWorker() {
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
      navigator.serviceWorker.register('./sw.js').catch(error => console.warn('Service worker:', error));
    }
  }

  function init() {
    renderVersion();
    renderStrokes();
    renderRules();
    renderTones();
    renderMistakes();
    renderStudySteps();
    fillCharacterSelect();
    renderCharacterCards();
    renderCharacterInfo();
    renderQuiz();
    setupSound();
    setupWriterControls();
    setupQuiz();
    setupProgress();
    setupThemeAndFont();
    setupMenu();
    createWriter();
    initHeroWriter();
    registerServiceWorker();
  }

  window.addEventListener('DOMContentLoaded', init);
})();
