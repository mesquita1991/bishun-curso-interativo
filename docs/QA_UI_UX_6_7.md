# QA — UX 6.7.0

## Contratos

- 6.7 é aditiva após 6.6;
- modo padrão = `guided`;
- trilha 6.6 permanece a fonte de verdade de progresso;
- em modo guiado, somente a etapa atual ocupa o fluxo curricular;
- primeira visita mostra orientação + Start/Continue antes do documento longo;
- `Explorar tudo` restaura o documento integral sem limpar estado;
- impressão sempre contém o conteúdo integral;
- desktop-nav e contextbar deixam de competir durante a sessão guiada;
- modo Explore oculta o dock guiado, mantendo exploração limpa;
- nenhum motor curricular ou `data/` é modificado.

## Gate automatizado

Executar `node tests/ux-6.7-regression-check.mjs` junto às suítes 6.3–6.6.
