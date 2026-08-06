# Upgrade absoluto de UI/UX — candidato 6.3.0

## Princípio de segurança

A implementação é aditiva. `index.html` recebe apenas um link de salto, um destino semântico e referências a `ux-upgrade.css` e `ux-upgrade.js`. Nenhum ID curricular, motor de treino, chave de armazenamento, arquivo de dados ou comportamento das versões 3–6 é removido ou renomeado.

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
