# Upgrade absoluto de UI/UX — candidato 6.3.0

## Princípio de segurança

A implementação é aditiva. `index.html` recebe apenas um link de salto, um destino semântico e referências a `ux-6.3.0.css` e `ux-6.3.0.js`. Nenhum ID curricular, motor de treino, chave de armazenamento, arquivo de dados ou comportamento das versões 3–6 é removido ou renomeado.

## Problema tratado

A página preservada contém 47 seções curriculares, 61 botões e 43 campos. O conteúdo é amplo, mas a navegação linear produz carga cognitiva alta e dificulta responder a três perguntas: onde estou, o que faço agora e como retomo depois.

## Solução

- central inicial por intenção com quatro rotas;
- busca global e command palette por `Ctrl/⌘+K` ou `/`;
- mapa completo agrupado em seis áreas;
- breadcrumb contextual e progresso de leitura;
- retomada automática da última seção;
- favoritos persistidos localmente;
- registro das seções visitadas;
- dock móvel com quatro ações essenciais;
- nova hierarquia visual, formulários e estados de foco;
- respeito a movimento reduzido, impressão e navegação por teclado.

## Isolamento

A nova camada usa somente a chave `bishunUxV63` no `localStorage` e o atributo interno `data-ux-runtime`. O seletor visual da versão não usa esse atributo, prevenindo repetição da colisão que apagou o documento na versão anterior.

## Critérios de aceite

1. As 47 seções originais continuam presentes.
2. Todos os scripts centrais permanecem referenciados.
3. Nenhum ID é duplicado.
4. A busca abre e permite navegar por teclado.
5. Mapa, retomada e favoritos sobrevivem a recargas.
6. Não há rolagem horizontal em 375, 768 e 1440 px.
7. Tema, navegação, treino e programa integral continuam funcionais.
8. O documento nunca pode ser substituído por um número de versão.


## Correções após auditoria responsiva

- os seis grupos do mapa são `div` de navegação, não novas seções curriculares;
- overlays fechados usam isolamento de exibição e `overflow-x: clip`, impedindo aumento do `scrollWidth`;
- a contagem de seções permanece exatamente 47 em runtime.

- os assets finais usam nomes imutáveis por versão, evitando reutilização acidental de cache durante revisão e implantação.

- a geometria SVG procedural do Hanzi Writer é contida no próprio viewport, impedindo que trajetórias internas ampliem a largura documental.


## Evidências

A auditoria independente completa está em `docs/QA_UI_UX_6_3.md`.

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


Critérios adicionais de aceite verificados:

1. links internos existentes para qualquer seção atualizam `lastSection` pelo mesmo fluxo de navegação da camada UX;
2. o link de salto para `#conteudo` permanece nativo e não altera a retomada;
3. em até 820 px, topbar e barra contextual não se sobrepõem;
4. o drawer modal impede saída de foco por teclado ou foco programático e restaura o acionador ao fechar.
