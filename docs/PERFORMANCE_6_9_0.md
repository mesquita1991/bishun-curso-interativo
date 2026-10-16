# Bǐshùn 6.9.0 — auditoria e critérios de publicação

## Problema de origem

A página de entrada anterior continha todo o conteúdo do curso em ~66,7 KB HTML e carregava imediatamente múltiplos módulos JS/CSS e dados curriculares. O service worker 6.8.1 também incluía uma lista de pré-cache com dados e motores. Isso produzia custo inicial elevado mesmo para usuários que só queriam escolher uma etapa.

## Organização

- `index.html`: primeiro contato leve, cards de rotas, nove etapas, retomada e links do app legado. HTML ~6,8 KB; CSS/JS comuns compactos.
- `curso.html`: aplicação integral 6.8.1 preservada (47 seções, 40 passos, 48 ilustrações, demais ferramentas e dados). A versão publicada do núcleo pode continuar pesada, pois mantém seus motores, mas deixa de ser carregada na primeira visita.
- `base.html`, `imersao.html`, `validacao.html`: páginas temáticas estáticas indexáveis com links diretos às seções correspondentes em `curso.html`.
- `etapa-1.html` a `etapa-9.html`: páginas isoladas com o inventário do estágio, sem importar motores avançados. Os dados de uma única etapa são obtidos por `etapa.js` ao ativar `Carregar unidades`. Apenas uma unidade por vez é inserida no DOM.
- `portal.css`, `portal.js`, `etapa.js`: apresentação acessível, progresso local por domínio e inicialização tardia do SW.
- `sw.js`: instalação de cache mínimo e armazenamento de outros arquivos somente conforme navegação/solicitação. Nada dos nove arquivos de etapa é pré-cacheado.

## Continuidade e segurança

1. A árvore curricular `data/` não é alterada.
2. O aplicativo antigo mantém sua chave `bishunFullV4`; as páginas de etapas só ajustam `stage`, `unit` e `unitsByStage` quando o estudante escolhe uma unidade ou entra no ambiente completo.
3. `index.html#fundamentos` e outros fragmentos anteriores continuam roteados para `curso.html#fundamentos`.
4. A mudança do cache traz uma ressalva: a utilização offline completa só estará disponível para recursos visitados; não se deve apresentar o portal como download integral.
5. Busca global, 48 mnemônicos, treino manuscrito e modo guiado permanecem no aplicativo completo, preservados intactos quanto à UI original.

## Critérios objetivos de aceite

- `npm run check` aprova as suítes antigas e `tests/multipage-performance-check.mjs`.
- A home não referencia diretamente os módulos JS grandes nem arquivos de etapa, e seu HTML não ultrapassa 12 KB.
- As 9 páginas possuem canonical próprio e estão presentes no sitemap.
- Links `curso.html#id` referenciam IDs realmente existentes.
- O app `curso.html` mantém as 47 seções e o inventário curricular completo.
- Testar manualmente: navegação sem JavaScript, teclado, modo claro/escuro do curso integral, áudio, escrita, troca entre etapas, SRS, provas e continuidade do progresso.
- Em navegador: conferir Network para 0 downloads de `data/stage-N.json` na home; somente 1 download de etapa após clique no estudo correspondente.
- Off-line: validar a home offline após visita; reabrir unidade visitada e identificar corretamente indisponibilidade das outras etapas.

## SEO e estrutura

Canonical específico, meta description, título H1 único, links HTML reais, breadcrumbs, JSON-LD, sitemap e robots. As páginas estáticas evitam depender de execução JavaScript para títulos e navegação primária. A versão integral recebeu canonical próprio.

## Limites e rollback

Reverter o merge da 6.9.0 restaura a entrada anterior em `index.html`; se o service worker 6.9.0 tiver tomado controle, clientes podem precisar de uma atualização para adquirir a versão restaurada. Nenhuma migração destrutiva de progresso é realizada. Não alegar ganhos medidos de Core Web Vitals sem medição de navegador em produção.
