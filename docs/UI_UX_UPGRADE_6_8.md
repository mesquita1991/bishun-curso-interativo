# UX 6.8 — restauração visual auditável

A biblioteca de 48 mnemônicos/pictogramas vetoriais publicada em 6.2.0 e refinada em 6.2.1 foi recuperada diretamente do histórico Git.

## Integração didática

- mantém a trilha canônica em 40 passos;
- no passo 6/40 (Treinador), um bloco explícito abre a biblioteca em diálogo sem abandonar a etapa;
- 12 relações essenciais aparecem primeiro; “Mostrar todos os 48” expande o conjunto;
- busca, filtro por pictograma/mnemônico, reset e acesso ao treinador são preservados;
- no modo Explorar tudo, a seção histórica reaparece inline exatamente entre Treinador e Jornada;
- o modo guiado não alonga a página com a biblioteca fechada.

## Preservação

O JSON histórico é preservado byte a byte em `visual-mnemonics-6.2.1.json`, fora de `data/` para não alterar o fingerprint da árvore curricular protegida. Nenhum motor curricular é modificado.
