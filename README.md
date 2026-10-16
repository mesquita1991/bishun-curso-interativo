# Bǐshùn 7.2.1 — correção da qualidade pedagógica

- Cada par de caracteres pede uma **tentativa de recuperação ativa de dois significados** com respostas ocultas, feedback imediato e repetição opcional. Avançar exige responder, não acertar; a avaliação da unidade permanece com dez perguntas. Históricos anteriores são preservados.
- A **revisão posterior (mínimo 24h)** inclui todos os caracteres da unidade, mesmo quando intervalos individuais ainda não venceram. As revisões de rotina seguem selecionando apenas itens vencidos.
- A escrita inicial propõe **八**, com dois traços, em lugar de começar por **爱**. Há links diretos para pinyin, tons e traços. A interface deixa explícito quando a escrita fica pendente.
- Regressões cobrem a recuperação de pares e a memória posterior de dez caracteres com datas individuais futuras. Nenhum dado curricular foi alterado. As alterações são entregues em um único commit no pipeline consolidado.

---

# Bǐshùn 7.2 — aprendizagem progressiva e memória diferida

A unidade de estudo começa com **dois caracteres por apresentação** (cinco partes na unidade de dez caracteres). O aluno observa e escuta, relaciona palavras aos caracteres exibidos e percorre todas as partes antes de marcar a leitura como realizada. Percorrer os grupos registra **exposição**, não domínio.

A prática de escrita exige concluir exercícios de **três caracteres diferentes**; repetir um só não conclui a atividade. A revisão inicial pede recuperação ativa de **todos os dez caracteres** e até quatro palavras, com a resposta escondida até o aluno tentar lembrar. Em visitas posteriores, a revisão mostra apenas os itens vencidos conforme os registros locais de repetição espaçada.

A avaliação inclui **uma questão para cada um dos dez caracteres**, com quatro opções distintas e feedback. Oito acertos concluem a **avaliação inicial de reconhecimento de significados**. Os caracteres errados ficam visíveis para orientar a próxima tentativa. Concluir quatro atividades não é sinônimo de fluência nem prova de retenção.

Após a primeira avaliação aprovada, o aplicativo agenda uma nova **verificação de memória para pelo menos 24 horas depois**. A página inicial orienta a retomá-la quando chegar o momento. O resultado depende de autoavaliação do aluno: registra quantos caracteres ele afirmou lembrar, distinguindo explicitamente essa informação de uma medida objetiva de retenção. Não altera ou remove históricos antigos; os critérios mais rigorosos exigem evidências novas para contar uma unidade como concluída.

Os nove arquivos curriculares e todas as 300 unidades permanecem inalterados. O algoritmo puro em `pedagogia.js` é auditado por `tests/pedagogy-check.mjs` e os fluxos pelo Chromium, **no pipeline consolidado existente**, sem novo workflow automático nem repetição cíclica de runs.

---

# Bǐshùn 7.1 — padrões compartilhados em todas as páginas

A experiência visual pública segue um único sistema de identidade `interface.css`, aplicado às **19 páginas** (início, estudo, mapa, quatro ferramentas, três páginas de apoio e nove etapas). A rota `curso.html` permanece exclusivamente como redirecionador de compatibilidade e não volta a carregar a aplicação antiga; o arquivo histórico continua preservado fora da navegação comum.

## Orientação ao estudante

- **Início**: a sequência Conhecer e ouvir → Observar e escrever → Lembrar sem olhar → Conferir o que aprendeu.
- **Minha unidade**: estudo contínuo e retomada da última unidade.
- **Etapas**: seleção do percurso e acesso às nove etapas.
- **Escrita**: animação e exercício individual de traços.
- **Consultar**: caracteres, palavras, sílabas e gramática disponíveis por etapa.
- **Revisão**: exercícios de memória e perguntas sobre significados.
- **Biblioteca**: explicações e fontes complementares.

Os sete destinos aparecem **na mesma ordem** em todas as páginas. No celular, um controle nativo **Menu** apresenta esses mesmos destinos; não é necessário baixar um framework para navegação.

## Design system

- **Base**: `portal.css`, com tipografia do sistema e escalas responsivas.
- **Identidade compartilhada**: `interface.css`, com cabeçalho, rodapé, navegação compacta, estados de foco, cartões, margens e hierarquia.
- **Estilos locais preservados**: `jornada.css` (início), `estudar.css` (percurso) e `modulos.css` (ferramentas), sem eliminar recursos nem seletores JS.
- **SEO**: títulos terminados em `| Bǐshùn`, um título principal por página e URL canônica por página.
- **Acessibilidade**: link para pular ao conteúdo, navegação sem JavaScript via `<details>`, contraste e foco visível, suporte à preferência por movimento reduzido.
- **Rodapé**: links essenciais e aviso uniforme de armazenamento local; nenhum recurso é apresentado como certificação de proficiência.
- **Offline**: o cache `bishun-offline-7.1.0` inclui a identidade visual comum; conteúdos curriculares continuam sob demanda.

## Prevenção de regressões

O teste `tests/site-design-check.mjs`, incluído em `npm run check`, exige que as 19 páginas exibam o mesmo menu, rodapé, títulos, estilos e caminhos internos válidos. `tests/site-design-browser-smoke.mjs` verifica a interface em Chromium, incluindo menu móvel e transbordamento horizontal. Os testes rodam **dentro do pipeline consolidado existente**, sem novo workflow automático. Uma alteração que falhe no teste rápido não executa o navegador.

**Não foram modificados arquivos de `data/` nem removidos conteúdos curriculares.** A padronização não afirma equivalência entre exercícios concluídos e domínio da língua.

---

# Bǐshùn 7.0.1 — percurso do aluno e execuções controladas

## Jornada de aprendizagem exibida ao estudante

A página inicial prioriza o que o estudante realmente faz, sem explicações sobre arquitetura ou carregamento: **Conhecer e ouvir → Observar e escrever → Lembrar sem olhar → Conferir o que aprendeu**. O botão principal abre a primeira unidade e a retomada abre a unidade registrada anteriormente. As nove etapas continuam acessíveis em seção secundária, sem competir com a próxima atividade.

Em `estudar.html`, cada passo apresenta uma orientação prática: o que observar ou tentar, como concluir e o que fazer depois. Os textos dos botões e mensagens explicam a ação do aluno. Isso não altera os critérios de conclusão: leitura de todos os grupos registrada, três caracteres diferentes escritos, todos os caracteres da unidade recuperados na prática inicial e avaliação de significados com pelo menos oito acertos em dez questões.

## Política de uso responsável do GitHub Actions

Há **um pipeline automático** em `.github/workflows/ux681-gate.yml`. Ele executa `npm run check` primeiro; **somente se passar** instala e executa o Chromium. A chave de `concurrency` identifica PR/branch e `cancel-in-progress: true` cancela verificações obsoletas quando há uma atualização. O antigo pipeline duplicado de navegador (`.github/workflows/multipage-browser-qa.yml`) passou a ser **somente manual** (`workflow_dispatch`).

As alterações devem ser reunidas em uma branch e verificadas antes da abertura de um único PR. Não há loop de tentativas automáticas após falha. Diante de um erro de código, corrige-se o código e publica-se nova revisão; diante de erros temporários da infraestrutura ou `403/429`, deve-se respeitar `Retry-After` ou aguardar pelo menos um minuto com backoff exponencial, sem insistir indefinidamente. Uma tentativa manual de reexecução pode ser feita após examinar a causa, jamais um ciclo de reexecuções.

A estratégia evita **runs duplicados e testes pesados de mudanças já inválidas**, sem prometer um limite fixo de consumo da API.

---

# Bǐshùn 7.0 — área de estudo por unidade

A interface de estudo central é `estudar.html`. Ela carrega somente o inventário JSON da etapa selecionada (1 a 9) e exibe uma unidade por vez, com **quatro atividades na mesma tela**: Aprender, Escrever, Revisar e Avaliar.

## Fluxo efetivamente implementado

1. **Aprender:** ler os caracteres com pinyin, significados e áudio; consultar palavras, gramática e sílabas; pressionar `Concluir leitura` para registrar a atividade.
2. **Escrever:** selecionar caractere e escolher animação ou escrita interativa, usando Hanzi Writer carregado sob demanda. Três caracteres diferentes praticados registram a atividade da unidade. A conexão pode ser necessária para acessar o motor externo.
3. **Revisar:** praticar os dez caracteres e até quatro palavras da **unidade atual**, revelando a resposta e marcando Não lembrei / Com dificuldade / Lembrei. Itens nunca estudados são identificados como prática inicial. Ao avaliar todos os itens da sessão, a atividade fica registrada; as autoavaliações atualizam os intervalos de revisão no armazenamento local.
4. **Avaliar:** responder a dez perguntas de reconhecimento de significados de caracteres da unidade, escolhendo entre quatro alternativas, com feedback imediato. Oito acertos ou mais satisfazem o critério desta atividade. Isso **não é certificação de proficiência**.

O indicador `0 de 4` a `4 de 4` representa somente a conclusão operacional dessas quatro atividades; não equivale ao domínio do conteúdo. A área de estudo salva os resultados por etapa e unidade na chave local `bishunUnitJourneyV70`. O contexto de etapa e unidade continua compatível com `bishunFullV4`, sem apagar registros anteriores.

Trocar de modo **não baixa novamente a etapa**. Trocar de unidade na mesma etapa reutiliza o conteúdo carregado. Mudanças de etapa carregam apenas o arquivo da nova etapa, com cache em memória durante a visita. O botão Retomar na home abre diretamente a unidade anterior.

As páginas `etapa-N.html`, mapa, biblioteca, catálogo, laboratório e revisão especializada continuam acessíveis. As páginas de etapa agora incluem um acesso explícito ao fluxo integrado. A arquitetura antiga permanece fora da navegação normal.

O serviço offline versão 7.0 não apresenta mais a home no lugar de uma página solicitada indisponível; informa claramente que o conteúdo específico não foi armazenado. A instalação do shell leve e o armazenamento sob demanda não significam que todo o inventário esteja automaticamente disponível offline.

## Testes e preservação

- `npm run check` inclui verificações sintáticas e de consistência do percurso por unidade.
- O CI em Chromium percorre leitura, escrita simulada, revisão, avaliação e recuperação de progresso nos tamanhos 390 e 1440 px, além dos testes multipágina anteriores.
- A árvore `data/`, as 48 ilustrações e a biblioteca histórica de 47 seções permanecem intactas.
- **Limites:** o teste de significados não avalia escuta/fala. A escrita animada depende do serviço de caracteres de Hanzi Writer, e o progresso é armazenado no navegador, sem conta ou sincronização.

---

# Bǐshùn 6.9.1 — navegação modular sem retorno à interface antiga

**Estado operacional:** a antiga rota `curso.html` agora redireciona imediatamente para o módulo pertinente, inclusive quando recebe hashes históricos como `#laboratorio-integral`. Nenhuma página de navegação nova utiliza links para ela.

- `laboratorio.html` — treino real de escrita e áudio, com Hanzi Writer carregado apenas ao solicitar.
- `catalogo.html` — caracteres, palavras, sílabas e gramática, carregamento por etapa.
- `avaliacao.html` — revisão espaçada e provas objetivas por etapa.
- `aulas.html` — textos pedagógicos e instruções extraídos das **47 seções** históricas em `conteudos.json`.
- `mapa.html` — acesso às nove etapas e ferramentas.
- `rotas.js` — mapeamento de fragmentos legados e favoritos para páginas independentes.
- `docs/arquivo-curso-6.8.1.html` — cópia de auditoria do HTML anterior, fora de toda navegação normal.
- As páginas `etapa-1.html` a `etapa-9.html`, a home e os três hubs temáticos foram corrigidos para não chamar a aplicação antiga.
- O progresso permanece no mesmo domínio e usa `bishunFullV4`. Nenhuma rotina apaga o histórico.
- `sw.js` versão 6.9.1 invalida os caches antigos; `sitemap.xml` omite a rota descontinuada.

**Nota de escopo:** a interatividade do antigo documento único foi substituída por ferramentas independentes nas rotas documentadas. Funcionalidades antigas muito específicas continuam preservadas em arquivo histórico; isso não equivale a dizer que toda antiga subferramenta foi reimplementada. O objetivo desta correção é garantir percursos utilizáveis, evitar a tela quebrada e não perder dados nem textos didáticos.

Consulte os testes `tests/legacy-free-routing-check.mjs` e `tests/multipage-browser-smoke.mjs` para as garantias automatizadas de roteamento e fluxos reais.

---

# Bǐshùn — Mandarim Integral v6.9.0

## Arquitetura multipágina e carregamento progressivo (6.9.0)

A entrada `index.html` agora é um **portal leve** (HTML inicial < 12 KB), com `portal.css` e `portal.js`; não inicializa os motores ou o inventário curricular. O aplicativo 6.8.1 completo foi **preservado** em `curso.html`, na mesma origem e com as mesmas chaves de progresso. Links legados `index.html#secao` são redirecionados para `curso.html#secao`, preservando o destino original.

Páginas independentes: `base.html`, `imersao.html`, `validacao.html`, e `etapa-1.html` até `etapa-9.html`. O `etapa.js` só obtém `data/stage-N.json` mediante clique explícito, renderiza uma unidade por vez e preserva o acesso ao treino avançado. Essas páginas não fazem carregamento antecipado de `full-course.js`, `post-standard.js`, `mastery-v6.js` ou Hanzi Writer.

O `sw.js` pré-armazena apenas os seis arquivos essenciais da interface leve, em vez de toda a aplicação; dados de etapas e páginas completas são guardados sob demanda. `sitemap.xml`, `robots.txt`, canonical exclusivo por página, landmarks, labels, foco de teclado e estrutura H1/H2 organizam SEO e acessibilidade.

**Escopo de preservação:** os dados de `data/`, os 48 SVGs mnemônicos, as 47 seções, os 40 passos guiados, o SRS, as provas, o histórico e a opção Explorar tudo continuam acessíveis em `curso.html`. Os recursos do aplicativo integral podem continuar mais pesados quando abertos; o principal ganho é evitar esse custo na entrada e nas páginas de etapa. Consulte `docs/PERFORMANCE_6_9_0.md`.

## Versão integral preservada — 6.8.1


Aplicação estática local-first em português. Preserva integralmente a Base 300 e o inventário GF0025-2021, acrescentando uma extensão pós-padrão orientada por conteúdo real.

## Programa formal

- 1.110 sílabas;
- 3.000 caracteres;
- 11.092 palavras;
- 573 registros retornados pelo sistema oficial de consulta, com a discrepância 572/573 documentada;
- 300 unidades em nove etapas;
- leitura, escuta, fala, escrita e tradução.

## Extensão pós-padrão

- 124.370 entradas alinhadas à edição de 24 de julho de 2026 do CC-CEDICT;
- 128 fragmentos lexicais carregados sob demanda;
- 20.000 entradas de prioridade heurística;
- 5.295 expressões idiomáticas ou figuradas;
- 24 domínios profissionais e 12 registros/variedades inferidos das glosas;
- 100 aulas autorais de pragmática;
- 52 leituras autorais e 120 missões de transferência;
- laboratório que segmenta qualquer texto chinês e mede cobertura de ocorrências, tipos, inventário formal e itens dominados.

## Limites

A extensão não representa uma lista oficial de frequência nem define “100% da língua”. Classificações pós-padrão são heurísticas e a segmentação é assistiva. As 11.092 palavras curriculares mantêm tradução portuguesa; entradas adicionais sem tradução revisada exibem a glosa inglesa original.

## Fontes e licença

GF0025-2021 / ChineseTest, transcrição estruturada `ivankra/hsk30`, CC-CEDICT sob CC BY-SA 4.0 e Hanzi Writer.

## Validação longitudinal v6

- 36 textos autorais em 12 gêneros e três níveis;
- leitura inédita, ditado, cloze, shadowing, produção e transferência;
- índice bloqueado até haver repetição em dias diferentes;
- autoavaliação de fala limitada a 70% e de produção a 85%;
- matriz 12×3, planejamento adaptativo e exportação local das evidências.


## Release UX 6.3.0

Release publicada no `main` com camada aditiva de navegação por intenção, busca global, mapa do curso, retomada, favoritos, breadcrumb e dock móvel. Consulte `docs/UI_UX_UPGRADE_6_3.md`. O núcleo funcional 6.2.3 permanece preservado.


Auditoria: `docs/QA_UI_UX_6_3.md`.

Correções pós-review: retomada preservada na carga inicial, mapa/busca cobrindo 47/47 seções, rolagem programática compatível com movimento reduzido e um único link de salto.


Segunda rodada pós-review: âncoras existentes atualizam a retomada, topbar móvel sem sobreposição e drawer modal com foco contido/restaurado.

Histórico de navegação: âncoras curriculares preservam hashes compartilháveis e Voltar/Avançar restaura as seções sem criar entradas duplicadas.


Quarta revisão Codex: saltos programáticos posteriores à carga atualizam a retomada; hashes não curriculares preservam o histórico nativo; a busca expõe combobox e opção ativa a tecnologias assistivas.

Quinta rodada pós-review: restaurações nativas de `#conteudo` ou entradas sem hash atualizam apenas o contexto visual e não sobrescrevem a retomada; a proteção termina em `scrollend`, nova ação do usuário ou fallback seguro.

Sexta rodada pós-review: saltos automáticos de startup não contaminam retomada, busca global indexa o texto completo e cliques modificados em links curriculares permanecem nativos.

Sétima rodada pós-review: busca global sem truncamento; todas as correspondências entre as 47 seções permanecem acessíveis.
- UX 6.3: intenção de rolagem manual expira ao final/ociosidade e a busca global adapta a área de resultados à altura do viewport.

## Candidato visual UX 6.4.0

Branch de revisão exclusivamente visual/navegacional. A camada `ux-6.4.0.*` é carregada depois da UX 6.3 e reorganiza somente apresentação, hierarquia do header, estados ativos, densidade, fluidez, busca/mapa e responsividade. Nenhum motor pedagógico, dado, armazenamento, SRS, áudio, prova ou regra de progresso é alterado.

Documentação: `docs/UI_UX_UPGRADE_6_4.md`. Auditoria: `docs/QA_UI_UX_6_4.md`.


### Revisão visual 2 do candidato 6.4

A primeira iteração foi deliberadamente conservadora e podia ser confundida com a 6.3. A revisão 2 torna a diferença inequívoca sem alterar o runtime funcional: header de alto contraste, badge próprio `UX 6.4 · preview`, navegação segmentada com estado ativo forte, context bar integrada, hero e launchpad com nova hierarquia e cache-busting específico do preview. O badge `v6.3.0` continua representando o runtime da aplicação; o novo badge identifica apenas a camada visual candidata.


## UX 6.5.0 — Experience System

A camada 6.5 promove a interface inteira sem reescrever o núcleo: identidade única, rail de macro-orientação, consistência entre 47 seções, acessibilidade de alto contraste/forced-colors, safe-area, tabelas roláveis por teclado, metadados de produção e suíte de integridade do core. A 6.4 permanece imediatamente abaixo como fallback reversível.


## UX 6.7 — estudo em uma etapa por vez

A trilha guiada passa a ser o modo padrão: o usuário vê orientação, Start/Continue e somente a etapa curricular atual. O documento completo permanece disponível em **Explorar tudo**. Nenhum conteúdo, motor ou dado é removido.

## UX 6.8 — restauração das 48 ilustrações

A biblioteca visual original das versões 6.2.0/6.2.1 foi recuperada do histórico Git e reintegrada sem alterar o núcleo curricular. Os 48 SVGs históricos são preservados byte a byte em `visual-mnemonics-6.2.1.json`. No modo guiado, a biblioteca abre em foco dentro do passo **Treinador (6/40)**; em **Explorar tudo**, a seção histórica reaparece inline entre Treinador e Jornada. São exibidos 12 exemplos essenciais inicialmente, com busca, filtro pictograma/mnemônico e expansão para os 48.
