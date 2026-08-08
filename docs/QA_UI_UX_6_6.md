# QA — UX 6.6.0 · Trilha guiada Start/Stop

## Contratos

- camada estritamente aditiva após 6.5;
- 40 passos pedagógicos essenciais, em quatro fases;
- as 47 seções originais continuam no DOM e navegáveis;
- painéis, cobertura, progresso, fontes, novidades e síntese permanecem como apoio, fora da sequência obrigatória;
- estado próprio `bishunGuidedV66`; nunca limpa nem substitui `bishunUxV63`;
- Start, Pausar, Continuar, Anterior e Concluir/continuar persistentes;
- cronômetro de sessão acumulativo;
- dock móvel com safe-area; reduced-motion e impressão preservados.

## Critério didático

A rota canônica elimina escolhas concorrentes durante o estudo: Base → Integral → Imersão → Domínio. O mapa e a busca continuam disponíveis para exploração deliberada.

## Sincronização

A trilha observa o estado ativo produzido pela UX 6.3; navegação via mapa, busca ou links existentes atualiza o passo 6.6 sem duplicar o motor de navegação. Reabrir o passo atual durante uma sessão em andamento não zera o cronômetro.

## Primeira rodada Codex

- P1: removidos escapes `\n` literais do CSS; seletores 6.6 voltam a ser CSS válido.
- P1: clique direto em passo `data-guide-index` sincroniza `state.current` explicitamente.
- P2: `resume()` não reinicia `startedAt` quando a sessão já está em andamento.
- P2: `release-manifest.json` regenerado para 6.6, com rollback 6.6 e inventário/hash exatos dos novos artefatos.

## Segunda rodada Codex

- P1: o gate herdado 6.5 passou a aceitar releases 6.x posteriores, sem deixar a versão regredir abaixo de 6.5.
- P2: `pageshow` rerenderiza a trilha após restauração por bfcache, mantendo controles coerentes com o estado pausado salvo no `pagehide`.

## Terceira rodada Codex

- P2: o primeiro `render()` agora é precedido por `syncInitialLocation()`, que resolve o fragmento URL atual e, se necessário, o `aria-current` da UX 6.3. Recarregar/bookmarkar uma seção guiada não deixa o dock apontando para outro passo.

## Browser QA — restauração sem hash

O navegador real reproduziu um caso em que um reload sem fragmento restaurava o scroll em uma seção distante e o fallback de `aria-current` sobrescrevia o passo salvo. A regra foi corrigida: `syncInitialLocation()` só altera `current` quando há um hash curricular explícito; em reload sem hash prevalece o estado persistido `bishunGuidedV66`.
