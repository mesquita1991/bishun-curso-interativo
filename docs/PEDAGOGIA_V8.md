# Bǐshùn 8.0 — integração pedagógica
Esta versão preserva os inventários e o histórico original sem apagar dados.
## Domínio e revisão
O nível histórico `level` permanece intacto, mas não é prova de domínio. Os campos `verifiedLevel` e `spacedEvidence` são atualizados por `aprendizagem-v8.js`, e promoções exigem ao menos 24h desde a última evidência aceita e vencimento da revisão. Tentativas prematuras ficam registradas sem promover nem adiar o vencimento.
## Percurso do aluno
Cada par de caracteres exige duas respostas corretas para avançar; o exercício de escrita exige três caracteres distintos com no máximo um erro por execução; a avaliação inicial mantém as dez questões e limiar de oito acertos.
Uma nova avaliação objetiva só é elegível após 24 horas. A segunda confirmação é agendada três dias após a primeira. Autoavaliações são mantidas como registros de estudo, sem inferir domínio objetivo.
## Compatibilidade
As chaves `bishunFullV4` e `bishunUnitJourneyV70` continuam válidas. Nenhum registro antigo é apagado; novos campos ficam armazenados junto ao histórico existente. A ferramenta avançada histórica retorna por `avancado.html`. O manual continua intacto.
## Limites
As duas avaliações espaçadas medem reconhecimento de significados, não fluência. O áudio é dependente do dispositivo; a escrita depende de Hanzi Writer. O site não sincroniza navegadores.
## Publicação
Executar `npm run check`, `node tests/manual-integrity-check.mjs` e os testes Chromium antes de liberar em produção. Reverter o merge caso qualquer verificação crítica falhe.
