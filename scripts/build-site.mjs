import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const output=path.join(root,'dist');
const publicFiles=['index.html','autoaula.css','autoaula.js','unidade-02.html','autoaula-02.css','autoaula-02.js','unidade-03.html','autoaula-03.css','autoaula-03.js','favicon.svg','manifest.webmanifest'];
if(!fs.existsSync(path.join(root,'index.html')))throw new Error('Execute a construção na raiz do projeto.');
fs.rmSync(output,{recursive:true,force:true});
fs.mkdirSync(output,{recursive:true});
for(const file of publicFiles)fs.copyFileSync(path.join(root,file),path.join(output,file));
console.log(`Site limpo pronto: ${publicFiles.join(', ')}`);
