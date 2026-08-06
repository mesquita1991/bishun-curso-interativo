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

