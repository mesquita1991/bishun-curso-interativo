# QA — UX 6.5.0

## Invariantes

- 47 seções curriculares;
- IDs estáticos únicos;
- UX 6.3 e 6.4 permanecem carregadas antes da 6.5;
- referência crítica `mastery-v6.js?v=6.2.3-c711049` preservada;
- seis motores centrais e árvore `data/` protegidos por fingerprint;
- nenhum write de persistência/histórico na nova camada;
- nenhuma interceptação de navegação;
- fallback integral para UX 6.4.

## Matriz de validação

1. `node --check ux-6.5.0.js`;
2. `node --check tests/core-integrity-check.mjs`;
3. `node --check tests/ux-6.5-regression-check.mjs`;
4. suítes UX 6.3, 6.4 e 6.5;
5. comparação GitHub garantindo ausência de mudanças em core/data;
6. Chromium desktop, tablet, mobile e viewport curta;
7. scroll + item ativo + rail 6.5;
8. command palette e drawer;
9. rotação 900→820 px;
10. impressão;
11. tema escuro, reduced motion e high contrast;
12. verificação pública após GitHub Pages.

## Observação de performance

A promoção adiciona preconnect/dns-prefetch somente para `cdn.jsdelivr.net`, a única origem externa do shell. Não introduz framework, biblioteca, imagem ou fonte adicional.

## Ajuste após QA móvel

O teste computado em 390 px revelou que a especificidade da regra 6.4 ainda mantinha 76 px de padding inferior. A 6.5 agora vence explicitamente com `body.ux-body.ux64-body.ux65-body` e remove `scrollbar-gutter` em <=820 px para devolver a largura integral do viewport.

## Evidência Chromium — candidato interceptado sobre dados públicos reais

### Desktop 1440×900
- runtimes 6.3.0, 6.4.0 e 6.5.0 coexistiram;
- 47 seções;
- apenas o badge `6.5 EXPERIENCE` permaneceu visível;
- rail com 6 macroetapas ativo;
- `#programa-integral` sincronizou `data-ux64-section`, grupo `integral` e `aria-current` no rail;
- header permaneceu em `top: 0`;
- command palette abriu com 47 resultados;
- erro JS/console: 0.

### Mobile touch 390×844
- largura do body = viewport = 390 px;
- padding inferior = 82 px antes do `safe-area-inset-bottom`;
- rail desktop oculto e dock ativo;
- Busca, Som, Texto e Tema mediram 44×44 px;
- 1 região tabular transbordante recebeu tratamento rolável;
- erro JS: 0.

### Breakpoint e impressão
- em 900 px, menu legado abriu normalmente; ao mudar para 820 px, fechou e `aria-expanded=false`, com dock ativo;
- impressão: header branco, texto `rgb(17,24,39)`, sem imagem de fundo, sem sombra, rail oculto e transição 0 s.

### Preferências de acessibilidade
- `forced-colors: active` removeu sombras e fundos decorativos sem quebrar a interface;
- `prefers-reduced-motion: reduce` reduziu transições a 0,01 ms;
- erros JS: 0.

## Correções após Codex Review — rodada 1

Dois P2 foram reproduzidos e corrigidos antes do merge:

1. **Fragmento percent-encoded malformado** — `currentSection()` agora envolve `decodeURIComponent` em `try/catch`; fragmentos inválidos permanecem como não-match e não interrompem a inicialização da 6.5.
2. **Overflow tabular após resize/rotação** — a 6.5 agora usa `ResizeObserver` mais evento `resize`, reavalia overflow e remove somente `tabindex`, `role` e `aria-label` que ela própria adicionou quando a região deixa de transbordar.
