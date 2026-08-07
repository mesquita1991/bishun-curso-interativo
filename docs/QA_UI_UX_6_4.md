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
