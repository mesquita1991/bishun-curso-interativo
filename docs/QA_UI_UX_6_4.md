# QA — candidato UX 6.4.0

## Invariantes

- 47 seções curriculares preservadas;
- UX 6.3 permanece carregada antes da 6.4;
- arquivos centrais permanecem byte-for-byte fora do commit;
- `mastery-v6.js?v=6.2.3-c711049` permanece referenciado;
- 6.4 não usa `localStorage`, History API, `location.hash`, `scrollIntoView()` de página ou `preventDefault()` em navegação;
- nenhum conteúdo curricular é criado, removido ou renomeado.

## Cobertura visual

Validar em 1440×900, 1024×768, 768×900, 390×844 e viewport curto 390×520:

1. header permanece sticky e sem sobreposição;
2. marca/versão, navegação e utilidades aparecem como três grupos coerentes;
3. em <=1080 px a navegação desktop some e o menu legado continua disponível até o dock assumir em <=820 px;
4. em <=820 px busca, som, texto e tema continuam acessíveis;
5. context bar acompanha header e mantém mapa, seção atual e favorito;
6. progresso ocupa somente a borda inferior;
7. dock não encobre conteúdo e respeita safe area;
8. command palette e drawer continuam totalmente roláveis;
9. nenhum overflow horizontal visível;
10. modo escuro e `prefers-reduced-motion` permanecem suportados.

## Testes automáticos

Executar:

```bash
node --check ux-6.4.0.js
node --check tests/ux-6.4-regression-check.mjs
node tests/ux-regression-check.mjs
node tests/ux-6.4-regression-check.mjs
```

## Evidência Chromium

Auditoria executada em Chromium Headless 134 / Playwright 1.51 com a UX 6.3 e 6.4 carregadas sobre o HTML atual, isolando os motores de conteúdo para testar geometria e navegação.

| Viewport | Header/contexto | Navegação | Utilidades | Overflow da página | Resultado |
|---|---|---|---|---|---|
| 1440×900 | 72 px + 42 px, adjacentes | trilho desktop ativo | 4 controles | bloqueado | OK |
| 1024×768 | 72 px + 42 px, adjacentes | desktop oculto, menu legado visível | 4 controles | bloqueado | OK |
| 390×844 | 64 px + 42 px, adjacentes | menu duplicado oculto, dock visível | busca/som/texto/tema visíveis | bloqueado | OK |
| 390×520 | 64 px + 42 px, adjacentes | dock visível | 4 controles | bloqueado | OK |

No scroll para `#programa-integral`, o header permaneceu em `top: 0`, a context bar acompanhou a altura correta e o item `Programa integral` recebeu `aria-current="location"` em todos os tamanhos testados.

No viewport 390×520, a command palette ficou entre `top=20` e `bottom=500`, apresentou 47 opções, `clientHeight=313`, `scrollHeight=4673` e permitiu alcançar integralmente a última opção. Erros JavaScript observados: **0**.

A largura de `body` permaneceu igual ao viewport em todos os cenários e a tentativa de rolagem horizontal da página permaneceu bloqueada; tabelas largas continuam usando seu próprio contexto rolável, sem deslocar a página.


## Revisão visual 2

- badge exclusivo `UX 6.4 · preview` deve existir sem alterar `[data-version]`;
- `data-ux64-visual-revision="2"` deve estar ativo;
- header deve usar a composição de alto contraste da camada 6.4;
- URLs dos assets 6.4 usam `preview-r2` para evitar confusão por cache;
- regressões 6.3 e invariantes de não escrita continuam obrigatórias.


### Evidência comparativa em Chromium — revisão 2

Comparação executada contra o site público 6.3 em Chromium Headless 134:

- site público 6.3: `data-ux64-runtime` ausente, badge UX 6.4 ausente, header sem gradiente de alto contraste;
- candidato 6.4: `data-ux64-runtime="6.4.0"`, `data-ux64-visual-revision="2"`, badge `UX 6.4 PREVIEW` visível;
- runtime funcional continua exibindo `v6.3.0`, deliberadamente separado da identidade visual candidata;
- desktop 1440×900: header navy/cobalto, três grupos sem sobreposição, `body.scrollWidth === viewport`;
- mobile 390×844: badge `UX 6.4` visível, dock ativo, quatro utilidades preservadas, sem rolagem horizontal;
- `#programa-integral` continua ativando `aria-current="location"`;
- erros JavaScript observados: 0.

Para inspeção humana, preferir `htmlpreview.github.io` com o SHA do head; RawGitHack pode inserir uma tela intermediária de aviso antes do conteúdo real.


## Correções finais antes da publicação

Dois apontamentos P2 do Codex foram tratados antes do merge:

1. **Transição 821–1080 → ≤820 px:** a camada 6.4 passa a observar `(max-width: 820px)`; ao entrar no breakpoint do dock, `#mobileNav` é fechado (`hidden=true`) e `#menuButton` retorna a `aria-expanded=false`. Isso impede que um menu legado aberto permaneça sobre a página após rotação/redimensionamento quando seu toggle já está oculto.
2. **Impressão após a revisão visual 2:** uma paleta `@media print` final, posicionada depois de todas as regras de tela da revisão 2, força fundo branco, foreground escuro, ausência de sombras/backdrop e controles legíveis mesmo quando o navegador não imprime gráficos de fundo.

A suíte 6.4 verifica explicitamente a presença dos dois mecanismos e a ordem da regra de impressão.


### Evidência Chromium das correções finais

Cenário de breakpoint: com `#mobileNav` aberto em 900 px (`hidden=false`, `aria-expanded=true`), a mudança do viewport para 820 px resultou em `hidden=true`, `aria-expanded=false`, `#menuButton` com `display:none` e `#uxMobileDock` com `display:grid`. Erros de página: 0.

Cenário de impressão: ao mudar para mídia `print`, o header apresentou `rgb(255,255,255)`, `background-image:none`, foreground `rgb(17,24,39)`, `box-shadow:none` e `transition-duration:0s`; marca e navegação permaneceram legíveis. Erros de página: 0.


## Promoção para publicação

Com a autorização de publicação, o candidato foi promovido para identidade de produção sem tocar no núcleo funcional:

- assets `ux-6.4.0.css` e `ux-6.4.0.js` passam a usar cache-busting `?v=6.4.0`;
- o badge visual passa de `UX 6.4 · preview` para **`UX 6.4 · live`**;
- o badge funcional legado `v6.3.0` permanece no DOM/dados, mas é ocultado visualmente quando a camada UX 6.4 está ativa, evitando dupla versão no header;
- `app.js`, `course.js`, `full-course.js`, `mastery-v6.js`, SRS, conteúdo e dados permanecem inalterados.
