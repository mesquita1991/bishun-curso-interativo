# Integração pública do manual — Bǐshùn 8.1.0
Data: 17/10/2026.

O conteúdo do manual não foi reescrito: 198 páginas, 410 fichas fonéticas, 164 caracteres, 1.157 etapas gráficas e 7.762 links originais permanecem identificados e testados.

## Entradas e retornos
- `estudar.html` → manual: links por caractere e por sílaba da unidade corrente.
- `manual.html?secao=escrita&busca=我`: busca direta; quando o caractere não pertence às 164 pranchas, orienta a usar o laboratório completo.
- `manual.html?secao=atlas&busca=ai`: consulta fonética pela sílaba.
- Manual → estudar: recuperação da última unidade no mesmo navegador, mantendo as chaves históricas.
- `bishunManualV8`: registra última página e dias consultados, nunca confunde visita com tarefa completada.

## Diagramação
A aplicação de `plataforma.css` e `plataforma.js` fornece menu de apoio, referência à versão e acesso ao histórico em todas as páginas públicas. O manual recebe introdução orientada ao percurso e padronização das cores e cartões.

## Limite de GitHub Actions
O gate em `.github/workflows/ux681-gate.yml` conta gatilhos automáticos do próprio workflow em janela móvel de 60 segundos. Após mais de três, não inicia testes custosos. GitHub Actions não permite impedir a criação de uma execução já disparada com uma simples condição YAML. A proteção real inclui concorrência com cancelamento de runs obsoletos e ausência de retry. O limite exige aprovação dos testes antes da publicação.

## Preservação e testes
O hash da árvore `data/` permanece `f894df48393976e623f645b6e97796facfccfff8`. Testes de integridade do manual e testes Chromium cobrem links, responsividade, percurso, versionamento, busca contextual e histórico.
