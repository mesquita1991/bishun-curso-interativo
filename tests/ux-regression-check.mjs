import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd());
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const html = read('index.html');
const ux = read('ux-upgrade.js');
const mastery = read('mastery-v6.js');

const requiredIds = ['inicio','painel','fundamentos','treinador','programa-integral','mapa-etapas','atlas-integral','pos-padrao','imersao-aberta','validacao-v6','novidades'];
const requiredScripts = ['app.js','course.js','full-course.js','post-standard.js','mastery-v6.js','ux-upgrade.js'];
const sectionCount = (html.match(/<section\b/g) || []).length;
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);

assert(sectionCount === 47, `Esperadas 47 seções curriculares; encontradas ${sectionCount}.`);
requiredIds.forEach(id => assert(html.includes(`id="${id}"`), `ID obrigatório ausente: ${id}`));
requiredScripts.forEach(file => assert(html.includes(file), `Script obrigatório ausente no HTML: ${file}`));
assert(html.includes('ux-upgrade.css'), 'Folha UX não referenciada.');
assert(html.includes('class="ux-skip-link"'), 'Link de salto acessível ausente.');
assert(html.includes('<main id="conteudo">'), 'Destino do link de salto ausente.');
assert(duplicates.length === 0, `IDs duplicados: ${[...new Set(duplicates)].join(', ')}`);
assert(!mastery.includes('document.documentElement.dataset.masteryVersion'), 'Regressão crítica: atributo de runtime colide com seletor visual do mastery.');
assert(mastery.includes('dataset.masteryRuntime'), 'Proteção de runtime do mastery ausente.');
assert(!ux.includes("$$('[data-ux-runtime]')"), 'Regressão crítica: o elemento HTML não pode ser alvo de textContent da UX.');
assert(ux.includes('dataset.uxRuntime'), 'Marcador isolado de runtime UX ausente.');
assert(fs.existsSync(path.join(root,'ux-upgrade.css')), 'ux-upgrade.css ausente.');

console.log(JSON.stringify({ ok: true, sectionCount, uniqueIds: ids.length, requiredScripts: requiredScripts.length, uxVersion: '6.3.0' }, null, 2));
