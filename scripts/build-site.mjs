import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const output=path.join(root,'dist');
const publicFiles=['index.html','inicio.css','inicio.js','unidade-01.html','autoaula.css','autoaula.js','unidade-02.html','autoaula-02.css','autoaula-02.js','unidade-03.html','autoaula-03.css','autoaula-03.js','unidade-04.html','autoaula-04.css','autoaula-04.js','unidade-05.html','autoaula-05.css','autoaula-05.js','favicon.svg','manifest.webmanifest'];
if(!fs.existsSync(path.join(root,'index.html')))throw new Error('Execute a construção na raiz do projeto.');
fs.rmSync(output,{recursive:true,force:true});
fs.mkdirSync(output,{recursive:true});
for(const file of publicFiles)fs.copyFileSync(path.join(root,file),path.join(output,file));
await import('./build-course-document.mjs');
console.log(`Site limpo pronto: ${publicFiles.join(', ')}`);
