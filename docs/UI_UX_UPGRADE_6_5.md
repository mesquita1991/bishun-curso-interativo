# UI/UX Upgrade 6.5 — Experience System

## Objetivo

Promover a interface publicada para uma camada de experiência global 6.5, perceptivelmente superior em hierarquia, orientação, consistência, acessibilidade e robustez, sem alterar motores de aprendizagem, dados, SRS, provas ou regras de progresso.

## Contrato de preservação

A 6.5 é carregada **depois** de 6.3 e 6.4. Os motores `app.js`, `course.js`, `curriculum-data.js`, `full-course.js`, `post-standard.js` e `mastery-v6.js`, além de todo `data/`, são imutáveis nesta promoção e passam a ser cobertos por `tests/core-integrity-check.mjs`.

## Mudanças de experiência

- identidade única `6.5 EXPERIENCE`, ocultando badges concorrentes sem reescrever os marcadores funcionais;
- header e context bar tratados como um único sistema de navegação;
- rail desktop com as seis macroetapas e estado atual sincronizado com a observação 6.4;
- hero editorial com hierarquia inequívoca e preservação integral dos elementos originais;
- gramática visual consistente para as 47 seções;
- normalização de cards recorrentes, formulários, controles, botões, dialogs e drawer;
- tabelas que realmente transbordam tornam-se regiões focáveis e rotuladas para navegação por teclado;
- touch targets reforçados em dispositivos coarse-pointer;
- suporte explícito a `prefers-contrast`, `forced-colors` e `prefers-reduced-motion`;
- safe-area móvel e impressão preservadas;
- canonical, preconnect, color-scheme, robots e metadados sociais coerentes;
- manifest alinhado à identidade publicada;
- `npm check` passa a verificar todas as camadas UX e integridade do núcleo.

## Não faz

A UX 6.5 não usa `localStorage`, History API, `preventDefault()` para navegação, nem reescreve conteúdo curricular. Não ativa service worker nem cria nova estratégia de cache, preservando a política de recuperação existente.

## Rollback

Remover somente `ux-6.5.0.css?v=6.5.0` e `ux-6.5.0.js?v=6.5.0` de `index.html` retorna a experiência visual à 6.4 sem migração ou perda de estado.
