import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const output=path.join(root,'dist');
const publicFiles=['index.html','inicio.css','inicio.js','unidade-01.html','autoaula.css','autoaula.js','unidade-02.html','autoaula-02.css','autoaula-02.js','unidade-03.html','autoaula-03.css','autoaula-03.js','unidade-04.html','autoaula-04.css','autoaula-04.js','unidade-05.html','autoaula-05.css','autoaula-05.js','unidade-06.html','autoaula-06.css','autoaula-06.js','favicon.svg','manifest.webmanifest'];
if(!fs.existsSync(path.join(root,'index.html')))throw new Error('Execute a construção na raiz do projeto.');
fs.rmSync(output,{recursive:true,force:true});
fs.mkdirSync(output,{recursive:true});
for(const file of publicFiles)fs.copyFileSync(path.join(root,file),path.join(output,file));
// Deploy the 12-week app and the complete source-backed reference library.
// All large lexical records remain separate JSON files and are fetched only when requested.
const weeklyFiles=['curso90.css','app-lite.css','single-page.js','pedagogia-semanal.js','library-lite.js',
 'programa-12-semanas.json','didatica-12-semanas.json','manual-catalogo.json','trilha-v9.json',
 'conteudos.json','visual-mnemonics-6.2.1.json'];
const manualParts=fs.readdirSync(root).filter(name=>/^manual-(?:texto|graficos)-.*\.json$/.test(name));
for(const file of [...weeklyFiles,...manualParts]){
 if(!fs.existsSync(path.join(root,file)))throw new Error('Fonte ausente: '+file);
 fs.copyFileSync(path.join(root,file),path.join(output,file));
}
for(const dir of ['data','archive']){
 fs.cpSync(path.join(root,dir),path.join(output,dir),{recursive:true});
}

await import('./build-course-document.mjs');
console.log(`Site limpo pronto: ${publicFiles.join(', ')}`);
