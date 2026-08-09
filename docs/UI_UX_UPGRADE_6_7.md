# UX 6.7 — Modo Foco de uma etapa por vez

A 6.7 corrige a causa estrutural da desorientação residual da 6.6: a trilha existia, mas ainda navegava dentro de um documento longo com dezenas de seções simultaneamente no fluxo vertical.

## Princípio

No modo **Trilha guiada**, a página mostra o controlador da jornada e **somente a etapa curricular atual**. Todas as demais seções continuam no DOM e nos arquivos originais, mas saem do fluxo visual até serem necessárias. O usuário não precisa mais localizar a próxima seção por rolagem.

O modo **Explorar tudo** restaura imediatamente o documento integral, a navegação global e todas as 47 seções, sem apagar progresso.

## Fluxo canônico

1. Começar ou Continuar.
2. Estudar apenas a etapa exibida.
3. Concluir e continuar.
4. Parar e salvar quando quiser.
5. Retomar exatamente dali.

A 6.7 não altera motores curriculares, SRS, provas, áudio, dados ou o estado `bishunGuidedV66`; adiciona apenas `bishunFocusV67` para memorizar a preferência de visualização.
