# UX 6.4.0 — reforma visual e navegação fluida

## Escopo

Este candidato é deliberadamente aditivo. A versão pública continua 6.3.0 até eventual merge/publicação. O objetivo é corrigir a sensação de elementos de header dispersos e melhorar fluidez, hierarquia, navegação e leitura sem alterar conteúdo nem lógica funcional.

## Princípios

1. **Uma arquitetura, não outra camada concorrente:** a UX 6.4 reutiliza topbar, navegação, context bar, mapa, command palette e dock já existentes.
2. **Preservação funcional:** nenhum arquivo de motor (`app.js`, `course.js`, `full-course.js`, `post-standard.js`, `mastery-v6.js`) ou dados é modificado.
3. **Header com hierarquia explícita:** identidade+versão, navegação do curso e utilidades formam três grupos visuais.
4. **Contexto contínuo:** breadcrumb, mapa, favorito e progresso passam a parecer a segunda linha do mesmo header.
5. **Fluidez sem efeitos excessivos:** mudanças usam transições curtas, sem animações que escondam conteúdo ou dependam de scroll para revelar seções.
6. **Mobile sem perda:** os controles únicos de som, texto, tema e busca permanecem; o menu legado duplicado é ocultado somente quando o dock já oferece mapa/navegação.

## Mudanças visuais

### Header
- bloco de marca e versão coeso;
- navegação central em trilho horizontal com estado ativo;
- utilidades em grupo único de dimensões consistentes;
- fundo e sombra respondem à rolagem sem mudar a altura do header, evitando desalinhamento de `scroll-margin`;
- breakpoint intermediário preserva o menu legado quando a navegação desktop deixa de caber.

### Barra contextual
- mesma largura e superfície visual do header;
- progresso transformado em linha de 2 px na borda inferior, liberando espaço horizontal;
- breadcrumb com grupo semântico em chip discreto;
- mapa e favorito com geometria equivalente.

### Conteúdo e exibição
- largura útil ajustada para 1.220 px;
- hero menos alto e menos afastado do header;
- espaçamento vertical e headings com leitura mais previsível;
- launchpad e cartões com profundidade visual reduzida e hover mais contido;
- command palette e drawer aproximados da mesma linguagem de superfície do header.

### Mobile
- marca compacta;
- controles continuam visíveis e agrupados;
- context bar reduzida sem perder seção atual, mapa ou favorito;
- dock centralizado, limitado a 430 px e compatível com `safe-area-inset-bottom`;
- command palette respeita margens menores em telas estreitas.

## Comportamento JS da 6.4

`ux-6.4.0.js` não grava progresso, não altera URL, não intercepta links e não chama motores do curso. Ele apenas:
- agrupa marca+versão no DOM;
- marca semanticamente os três blocos do header;
- observa a seção visível para aplicar `aria-current=location` ao item de navegação correspondente;
- centraliza visualmente o item ativo no trilho horizontal;
- adiciona estado visual de header durante rolagem;
- etiqueta os componentes UX existentes para styling.

## Rollback

Remover as duas referências `ux-6.4.0.*` de `index.html` devolve integralmente a interface UX 6.3.0, sem migração de estado e sem alteração de dados.
