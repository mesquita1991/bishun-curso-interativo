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
