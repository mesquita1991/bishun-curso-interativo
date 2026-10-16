import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=file=>fs.readFileSync(file,'utf8');
const home=read('index.html'),lesson=read('estudar.html'),client=read('estudar.js');
const primary=read('.github/workflows/ux681-gate.yml');
const secondary=read('.github/workflows/multipage-browser-qa.yml');
const pkg=JSON.parse(read('package.json'));
assert.equal(pkg.version,'7.2.1');
assert.ok(lesson.includes('id="pairPractice"')&&lesson.includes('id="pairProbe"'),'Cada par deve exigir tentativa de recuperação ativa');
for(const phrase of [
 'Aprenda mandarim, uma unidade de cada vez.',
 'O que fazer em cada unidade?',
 'Conhecer e ouvir','Observar e escrever','Lembrar sem olhar',
 'Conferir o que aprendeu','Primeira visita?','Continuar de onde parei',
 'Ver as nove etapas do curso'
])assert.ok(home.includes(phrase),'Texto essencial ausente na página inicial: '+phrase);
for(const term of ['interface leve','carregamento progressivo','módulos originais','motor de escrita','validação longitudinal','sistema offline'])assert.ok(!home.includes(term),'Jargão técnico ou promessa não comprovada na home: '+term);
for(const phrase of [
 'Sua lição de hoje','Onde você está estudando','Conhecer e ouvir',
 'Observar e escrever','Lembrar sem olhar','Conferir o que aprendeu',
 'id="studentStepNumber"','id="studentGoal"','id="studentAction"',
 'Já li e ouvi','Tentar escrever','Começar a lembrar','Responder às dez perguntas'
])assert.ok(lesson.includes(phrase),'Orientação ausente na área de estudo: '+phrase);
assert.ok(client.includes('studentGuidance'),'O texto explicativo precisa atualizar quando se troca de atividade');
assert.ok(read('portal.js').includes("resume.href='estudar.html?etapa='"),'Retomada da unidade não pode ser removida');
assert.ok(primary.includes('needs: fast'),'Chromium deve aguardar a aprovação da verificação rápida');
assert.ok(primary.includes('cancel-in-progress: true'),'Execuções obsoletas devem ser canceladas');
assert.ok(primary.includes('group: bishun-qa-'),'Não pode haver execuções concorrentes para o mesmo PR');
assert.ok(!primary.includes('retry')&&!primary.includes('max_attempts'),'Não executar tentativas automáticas sucessivas');
assert.ok(secondary.includes('workflow_dispatch:')&&!secondary.includes('pull_request:')&&!secondary.includes('push:'),'Não criar segundo workflow automático');
assert.ok(!home.includes('href="curso.html"'),'A página antiga não pode reaparecer na navegação');
console.log(JSON.stringify({ok:true,version:pkg.version,journeySteps:4,learnerCopy:true,shortCircuitCI:true,parallelRunsPrevented:true,duplicateAutomaticWorkflow:false}));
