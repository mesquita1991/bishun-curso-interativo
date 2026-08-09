# QA — UX 6.8

## Proveniência

- introdução original: `3223487eb405017fb94a8ee2bf5cecded22b100d` (6.2.0);
- revisão compacta recuperada: `5cf48efc3a58eefeeb6f2f8f8f35f5dad6cbd318` (6.2.1);
- blob histórico do JSON: `4053e13ad4c0fdf5f95c6987ae4ce8bbe243684a`;
- blob calculado no asset 6.8: `4053e13ad4c0fdf5f95c6987ae4ce8bbe243684a` — identidade byte a byte confirmada;
- SHA-256: `9e4ca6b235aac09f6470e6ad9d574eadf44223b351fbcdfaa40ab8f81b929807`.

## Gates estáticos

UX 6.3, 6.4, 6.5, 6.6, 6.7 e 6.8 passaram em conjunto. Contratos preservados: 47 seções curriculares, 40 passos guiados, Start/Stop, histórico/hash, busca, drawer, mobile, contraste e referência `mastery-v6.js?v=6.2.3-c711049`.

Gate 6.8: 48 itens únicos, 48 SVGs, 12 essenciais (`山 川 水 火 木 林 森 日 月 雨 目 休`), seção complementar entre Treinador/Jornada, `data/` não alterado.

## Chromium — candidato sobre runtime público real

A rede foi interceptada para servir o HTML/assets 6.8 candidatos sobre os demais arquivos do GitHub Pages 6.7, evitando dependência de hosts de preview.

### Desktop 1440×900

- runtime UX 6.8.0 e visual 6.8.0; package 6.8.0;
- estado inicial forçado para Treinador: `current=5`, somente `#treinador` curricular visível;
- bridge “48 ilustrações” visível;
- diálogo abre com 12 cartões e SVG de `山`; busca recebe foco; dock guiado fica oculto;
- “Mostrar todos os 48” → 48 cartões;
- busca `chuva` → único resultado `雨`;
- “Abrir treino de 雨” → diálogo fecha, `#characterSelect=雨`, hash `#treinador`, current permanece 5 (passo 6/40), foco retorna ao seletor;
- Explorar tudo → 47 seções curriculares visíveis + `#mnemonicos-visuais` inline, em ordem Treinador → biblioteca → Jornada;
- overflow horizontal: ausente; page errors: 0; console errors: 0; request failures: 0.

### Mobile 390×844

- Treinador 6/40 visível e bridge em `display:grid`;
- diálogo: 378 px dentro de viewport 390 px;
- 12 cartões iniciais, `山` com SVG;
- botão fechar: 44×44 px;
- busca recebe foco; dock guiado oculto;
- body width 390 px; overflow horizontal: ausente; erros: 0.

### Teclado

- Escape fecha o diálogo;
- biblioteca é restaurada à posição inline original;
- foco volta para “Ver as 48 ilustrações”;
- sem overflow.
