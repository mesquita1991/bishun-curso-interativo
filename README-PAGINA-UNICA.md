# Bǐshùn · app de página única

O curso principal segue **12 semanas de objetivos comunicativos e 6 dias finais**. Termos, caracteres e gramática foram selecionados dos arquivos curriculares preservados em `data/stage-*.json`, com correspondência em `programa-12-semanas.json`. Uma palavra ou um caractere repetido em outra semana funciona como revisão.

## Sem perda de acervo

Somente `index.html` é página pública. A seção **Conteúdo ainda não selecionado** consulta todos os registros das nove etapas que não entraram no currículo central, filtráveis por tipo, etapa ou busca. A biblioteca na mesma página abre sob demanda as 198 páginas do manual e 85 imagens, o atlas de 410 sílabas, 164 caracteres com sequência de escrita, os 48 mnemônicos, 302 lições, 52 leituras, 100 fichas de pragmática, 120 missões, 36 avaliações, 5.295 expressões idiomáticas, 128 fragmentos lexicais (124.370 registros), 47 seções de fundamentos e 24 páginas antigas arquivadas. O leitor de fontes possibilita abrir os arquivos JSON originais em trechos, sem navegar para outros HTML.

A página inicial carrega **apenas o plano de 90 dias e nove arquivos curriculares**. Não carrega 198 páginas, dezenas de imagens ou 124 mil itens lexicais antes da consulta. O progresso de tarefas e notas é salvo localmente; não equivale a certificação. A voz de dispositivo é sintética, não áudio nativo.

## Auditoria

`npm run check` valida os dados, o percurso e a integridade curricular. `node tests/app-browser-smoke.mjs` testa a experiência em Chromium nos tamanhos 390 px e 1440 px, após instalação do Playwright. Os arquivos pedagógicos originais não são alterados.
