# Mandarim Integral · 笔顺 — v6.3.0

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
