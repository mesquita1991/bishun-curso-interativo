# Auditoria independente — UI/UX 6.3

## Ambiente

- Chromium Headless 134 / Playwright 1.51;
- servidor HTTP local com os arquivos exatos da branch;
- contextos independentes de 375 × 900, 768 × 900 e 1440 × 900;
- dados iniciais do programa integral, extensão pós-padrão e validação v6 materializados da própria branch.

## Estrutura preservada

- 47 seções curriculares em todos os viewports;
- 4 rotas do launchpad;
- `head`, `body` e `h1` presentes;
- runtime UX `6.3.0`;
- nenhum erro de página e nenhuma requisição essencial falhou;
- scripts centrais e o patch crítico `mastery-v6.js?v=6.2.3-c711049` preservados.

## Interações verificadas

- busca `Ctrl/⌘+K`: 2 resultados para “atlas” e navegação correta;
- mapa: 39 destinos válidos, abertura e fechamento funcionais;
- favoritos: ID persistiu no `localStorage` após reload e reapareceu no painel de favoritos;
- tema: alternância de claro para escuro;
- rotas e retomada: navegação executada sem exceção;
- drawer aberto/fechado: `body.scrollWidth` permaneceu igual ao viewport.

## Responsividade

| Viewport | `body.scrollWidth` | Seções | Rotas | Dock móvel | Elementos visíveis fora do quadro |
|---:|---:|---:|---:|---|---:|
| 375 | 375 | 47 | 4 | grid | 0 |
| 768 | 768 | 47 | 4 | grid | 0 |
| 1440 | 1440 | 47 | 4 | none | 0 |

## Nota técnica sobre SVG

O Chromium contabiliza trajetórias internas de `<clipPath>` do Hanzi Writer no `documentElement.scrollWidth`, mesmo quando o SVG, o contêiner e o corpo estão recortados e não existe deslocamento horizontal observável. A auditoria rastreou essas trajetórias até `#heroHanzi` e `#writerTarget`. O sistema mantém `body.scrollWidth` em paridade, nenhum elemento visível excede o quadro e `overflow-x: clip` impede rolagem. As máscaras não foram removidas, pois isso poderia degradar a animação dos traços.

## Resultado

**Aprovado para revisão em PR.** O `main` permaneceu intocado e a ativação depende de merge explícito.

## Correções do Codex Review

O commit de revisão corrige quatro pontos identificados na análise automatizada:

- a sincronização inicial do `IntersectionObserver` atualiza somente o contexto visual e não sobrescreve `lastSection`; a persistência passa a exigir intenção manual de rolagem ou navegação explícita;
- todas as 47 seções agora possuem IDs estáveis e são enumeradas exatamente uma vez no mapa e na busca global;
- `navigateTo()` consulta `prefers-reduced-motion` e troca a rolagem programática por comportamento imediato quando solicitado pelo sistema;
- permanece apenas um link “Pular para o conteúdo”, reutilizando o componente original do site.

Os testes de regressão agora comparam diretamente os 47 IDs do HTML com os 47 destinos declarados em `GROUPS`, verificam o guard de retomada, o comportamento de movimento reduzido e a unicidade do link de salto.



## Correções após a segunda rodada do Codex Review

- cliques em âncoras curriculares já existentes (`href="#…"`) agora passam por `navigateTo()`, persistindo corretamente a retomada sem interceptar o link de salto `#conteudo`;
- a topbar móvel define `height` e `min-height` com `--ux-topbar-height`, impedindo sobreposição de 8 px sobre a barra contextual;
- o mapa modal contém o foco com `Tab`/`Shift+Tab`, redireciona tentativas de foco no plano de fundo e restaura o foco ao acionador ao fechar;
- navegação iniciada dentro do mapa fecha o modal sem devolver foco ao botão antigo, permitindo que o destino receba foco.


### Evidência da segunda rodada do Codex Review

Chromium Headless 134 / Playwright 1.51, viewport móvel de 390 × 900:

```json
{
  "initialResume": "atlas-integral",
  "afterSkipLink": "atlas-integral",
  "anchorTargetsPersisted": ["inicio", "fundamentos", "programa-integral", "imersao-aberta"],
  "mobileTopbar": {
    "height": 65,
    "minHeight": "64px",
    "contextTop": 64,
    "overlap": 0
  },
  "drawerInitialFocus": "uxDrawerClose",
  "shiftTabStayedInside": true,
  "backgroundFocusRedirectedInside": true,
  "focusRestoredTo": "uxMapButton",
  "drawerNavigationFocus": "fundamentos",
  "pageErrors": []
}
```

## Correção após a terceira rodada do Codex Review

- âncoras curriculares interceptadas agora atualizam `location.hash` por `history.pushState`;
- navegações programáticas do launchpad, mapa, busca e retomada também produzem URLs compartilháveis, sem duplicar a entrada quando o hash já corresponde ao destino;
- a carga inicial de uma URL com hash curricular sincroniza a seção com `replaceState` e sem animação ou roubo de foco;
- `popstate` restaura a seção ao usar Voltar/Avançar com `history: none`, evitando ciclos ou novas entradas;
- hashes não curriculares, incluindo `#conteudo`, continuam sob comportamento nativo.

Validação em Chromium: clique `#fundamentos` → `#programa-integral` criou duas entradas distintas; `goBack()` restaurou `#fundamentos`; `goForward()` restaurou `#programa-integral`; o destino salvo acompanhou cada travessia e nenhuma exceção foi registrada.



## Quarta rodada do Codex Review — saltos legados, histórico nativo e combobox

- O scroll-spy ignora somente sua primeira sincronização e persiste mudanças posteriores, inclusive `scrollIntoView()` disparado pelos fluxos legados do desafio diário.
- Alterações legadas de `location.hash`, como `#treinador` em `course.js`, são absorvidas por `hashchange` e sincronizam a retomada sem reescrever os motores existentes.
- `popstate` e `hashchange` não fazem nada diante de hashes não curriculares; `#conteudo` e entradas sem hash permanecem sob restauração nativa do navegador.
- A busca é um combobox ARIA com lista controlada, opções de ID estável, `aria-expanded` e `aria-activedescendant` sincronizado com setas e resultados filtrados.


### Validação Chromium — quarta rodada

```json
{
  "initialResume": "atlas-integral",
  "directScroll": {
    "hash": "",
    "lastSection": "treinador"
  },
  "directHash": {
    "hash": "#treinador",
    "lastSection": "treinador"
  },
  "nativeBack": {
    "hash": "#conteudo",
    "lastSection": "fundamentos",
    "selectedLast": "fundamentos"
  },
  "combobox": {
    "role": "combobox",
    "ariaAutocomplete": "list",
    "expandedWhileOpen": "true",
    "initialActiveDescendant": "uxCommandOption-inicio",
    "activeDescendantAfterArrow": "uxCommandOption-progresso",
    "selectedOptionAnnounced": true,
    "activeDescendantRemovedWithoutResults": true,
    "expandedAfterClose": "false"
  },
  "pageErrors": []
}
```

O retorno para `#conteudo` preservou a restauração nativa de posição dentro da tolerância do harness e não alterou `lastSection`. O salto por `scrollIntoView()` persistiu `treinador` mesmo sem produzir hash, enquanto a atribuição direta a `location.hash` atualizou hash e retomada.


## Quinta rodada pós-review — restauração nativa sem perda da retomada

Validação específica em Chromium Headless 134 / Playwright 1.51 com `scroll-behavior: smooth`:

- estado inicial salvo: `treinador`;
- ativação nativa de `#conteudo`: breadcrumb mudou para `Início`, mas `lastSection` permaneceu `treinador`;
- seleção explícita de `#fundamentos`: `lastSection` passou para `fundamentos`;
- Back para `#conteudo`: após a restauração completa e `scrollend`, o breadcrumb voltou a `Início`, mas `lastSection` permaneceu `fundamentos`;
- encerrada a janela de proteção, um novo salto programático ao fim do documento voltou a persistir `treinador`;
- Back para uma entrada sem hash preservou exatamente o destino salvo antes da travessia;
- exceções de página: 0.

Resultado resumido:

```json
{
  "afterNativeRestore": {
    "hash": "#conteudo",
    "active": "Início",
    "stored": "fundamentos"
  },
  "afterGuardRelease": {
    "active": "Treinador de escrita",
    "stored": "treinador"
  },
  "afterHashlessBack": {
    "hash": "",
    "storedPreserved": true
  },
  "pageErrors": []
}
```

A proteção usa uma janela transitória iniciada por `popstate`/`hashchange` não curricular, encerrada por `scrollend`, nova ação explícita do usuário ou fallback de 1.200 ms. O estado visual continua acompanhando a posição; somente a persistência de `lastSection` é suspensa durante a restauração nativa.


## Sexta rodada de regressão — startup, busca completa e cliques modificados

- o scroll-spy agora persiste apenas rolagem manual ou transições ocorridas logo após uma ativação real do usuário; saltos automáticos de inicialização/layout não alteram `lastSection`;
- `navigateTo()` limpa essa janela porque já persiste diretamente o destino, evitando registrar seções intermediárias durante smooth scroll;
- a busca global indexa o `textContent` completo das 47 seções, sem o corte anterior de 500 caracteres;
- links curriculares só são interceptados em clique primário simples; Ctrl/⌘/Shift/Alt, `target` próprio e `download` permanecem nativos;
- `full-course.js` permanece sem alterações.

Validação comportamental da sexta rodada em Chromium Headless 134 / Playwright 1.51:

```json
{
  "initialResume": "atlas-integral",
  "afterAutomaticStartupLikeJump": "atlas-integral",
  "afterUserTriggeredScriptedJumpChanged": true,
  "search": {
    "corpus oficial": "Base curricular auditável",
    "biblioteca individual": "Ouça, observe, escreva e consolide",
    "diversidade de gêneros": "Novidades do site"
  },
  "modifiedClick": {
    "currentHashUnchanged": true,
    "defaultPrevented": false
  },
  "pageErrors": []
}
```
