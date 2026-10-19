import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const output = path.join(root, 'dist', 'curso-completo.html');
const units = [
  { id: 1, file: 'unidade-01.html', css: ['autoaula.css'], js: 'autoaula.js', title: 'Unidade 1 — Primeiro contato e apresentação' },
  { id: 2, file: 'unidade-02.html', css: ['autoaula.css', 'autoaula-02.css'], js: 'autoaula-02.js', title: 'Unidade 2 — Cortesia e despedida' },
  { id: 3, file: 'unidade-03.html', css: ['autoaula.css', 'autoaula-03.css'], js: 'autoaula-03.js', title: 'Unidade 3 — Pedir uma informação' },
  { id: 4, file: 'unidade-04.html', css: ['autoaula.css', 'autoaula-04.css'], js: 'autoaula-04.js', title: 'Unidade 4 — Pedir uma bebida' },
];

const escapeScript = source => source.replace(/<\/script/gi, '<\\/script');
const toSrcdoc = unit => {
  const page = fs.readFileSync(path.join(root, unit.file), 'utf8');
  const body = page.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1];
  if (!body) throw new Error(`Não foi possível ler o conteúdo de ${unit.file}.`);
  const styles = unit.css.map(file => `<style>\n${fs.readFileSync(path.join(root, file), 'utf8')}\n</style>`).join('\n');
  const appScript = fs.readFileSync(path.join(root, unit.js), 'utf8');
  let lesson = body
    .replace(/href="(?:\.\/)?index\.html"/g, 'href="#mapa" target="_parent"')
    .replace(/href="(?:\.\/)?unidade-01\.html"/g, 'href="#unidade-01" target="_parent"')
    .replace(/href="(?:\.\/)?unidade-02\.html"/g, 'href="#unidade-02" target="_parent"')
    .replace(/href="(?:\.\/)?unidade-03\.html"/g, 'href="#unidade-03" target="_parent"')
    .replace(/href="(?:\.\/)?unidade-04\.html"/g, 'href="#unidade-04" target="_parent"');
  const sizing = `\n<script>
(() => {
  const sendHeight = () => parent.postMessage({ type: 'bishun-course-height', height: Math.ceil(document.documentElement.scrollHeight) }, '*');
  if ('ResizeObserver' in window) new ResizeObserver(sendHeight).observe(document.documentElement);
  if ('MutationObserver' in window) new MutationObserver(sendHeight).observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
  window.addEventListener('load', sendHeight);
  window.addEventListener('resize', sendHeight);
  document.fonts?.ready.then(sendHeight);
  requestAnimationFrame(sendHeight);
})();
</script>`;
  lesson += `\n<script>\n${appScript}\n</script>${sizing}`;
  const document = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${unit.title} · Bǐshùn</title>
${styles}
</head>
${lesson}
</html>`;
  return document;
};

const entries = units.map(unit => ({ id: `unidade-0${unit.id}`, title: unit.title, html: toSrcdoc(unit) }));
const payload = escapeScript(JSON.stringify(entries));
const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#f8f6f0">
<meta name="description" content="As quatro auto-aulas de mandarim Bǐshùn em um único documento navegável e responsivo.">
<title>Bǐshùn · Curso inicial de mandarim</title>
<style>
:root{color-scheme:light;--ink:#26372f;--green:#315b47;--paper:#f8f6f0;--line:#dfe4dc;font-family:Arial,Helvetica,sans-serif}*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:1rem}body{margin:0;background:var(--paper);color:var(--ink);line-height:1.5}.skip-link{position:absolute;left:12px;top:-60px;z-index:5;padding:10px 14px;background:#fff;color:var(--green)}.skip-link:focus{top:12px}.course-header{padding:clamp(24px,5vw,58px) max(20px,calc((100% - 1180px)/2));background:#eaf0e9;border-bottom:1px solid var(--line)}.brand{display:flex;align-items:center;gap:10px;color:var(--green);font-weight:700}.brand-mark{font-size:1.3rem}.eyebrow{margin:22px 0 8px;color:var(--green);font-size:.72rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase}.course-header h1{max-width:14ch;margin:0;font:500 clamp(2.2rem,6vw,4rem)/1.03 Georgia,serif;letter-spacing:-.035em}.course-intro{max-width:68ch;color:#4c5d53}.course-nav{position:sticky;top:0;z-index:3;display:flex;gap:8px;overflow-x:auto;padding:10px max(12px,calc((100% - 1180px)/2));background:#fff;border-bottom:1px solid var(--line)}.course-nav a{flex:none;padding:9px 13px;border:1px solid var(--line);border-radius:999px;color:var(--green);font-size:.82rem;font-weight:700;text-decoration:none}.course-nav a:hover,.course-nav a:focus-visible{background:#eaf0e9;outline:2px solid var(--green);outline-offset:2px}.course-map{max-width:1180px;margin:22px auto;padding:0 18px}.course-map p{margin:0;color:#526158;font-size:.9rem}.unit{max-width:1440px;margin:0 auto;padding:16px 12px 30px;scroll-margin-top:70px}.unit h2{max-width:1180px;margin:0 auto 8px;padding:0 10px;color:var(--green);font:500 clamp(1.15rem,2.5vw,1.6rem)/1.25 Georgia,serif}.unit-frame{display:block;width:100%;height:180px;border:0;background:var(--paper)}.course-footer{max-width:1180px;margin:0 auto;padding:26px 18px 42px;border-top:1px solid var(--line);color:#55645a;font-size:.84rem}@media(max-width:640px){.course-nav{position:static;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));overflow:visible;padding:10px 12px}.course-nav a{text-align:center;padding:8px 7px;font-size:.76rem}.unit{padding:12px 0 24px}.unit h2{padding:0 16px}.course-map{margin:16px auto}}
</style>
</head>
<body>
<a class="skip-link" href="#mapa">Pular para o conteúdo do curso</a>
<header class="course-header"><div class="brand"><span class="brand-mark" lang="zh-Hans">笔顺</span><span>Bǐshùn</span></div><p class="eyebrow">MANDARIM · PERCURSO INICIAL</p><h1>Quatro conversas para começar</h1><p class="course-intro">As quatro auto-aulas estão reunidas neste documento. Use a navegação para ir direto a uma unidade ou siga a sequência: apresentar-se, agradecer e despedir-se, pedir uma informação e fazer um pedido simples. O progresso de cada aula continua salvo separadamente neste navegador.</p></header>
<nav class="course-nav" aria-label="Navegação pelas quatro unidades"><a href="#unidade-01">01 · Apresentação</a><a href="#unidade-02">02 · Cortesia</a><a href="#unidade-03">03 · Informação</a><a href="#unidade-04">04 · Pedido</a></nav>
<aside id="mapa" class="course-map"><p><strong>Como usar:</strong> cada unidade mantém suas instruções, atividades, gabarito, áudio, gravação opcional e revisões. Você pode estudar uma unidade por vez e voltar à navegação superior quando quiser.</p></aside>
<main id="conteudo">${entries.map(entry => `<section class="unit" id="${entry.id}" aria-labelledby="title-${entry.id}"><h2 id="title-${entry.id}">${entry.title}</h2><iframe class="unit-frame" title="${entry.title}" loading="eager" scrolling="no"></iframe></section>`).join('\n')}</main>
<footer class="course-footer">Bǐshùn · Documento de estudo com as Unidades 1–4. Áudio alternativo pode exigir conexão; as gravações, quando usadas, permanecem no aparelho.</footer>
<script>
const lessons=${payload};
const frames=[...document.querySelectorAll('.unit-frame')];
const byWindow=new Map();
frames.forEach((frame,index)=>{byWindow.set(frame.contentWindow,frame);frame.srcdoc=lessons[index].html;frame.addEventListener('load',()=>{try{frame.style.height=Math.max(180,frame.contentDocument.documentElement.scrollHeight)+'px'}catch{}})});
addEventListener('message',event=>{const frame=byWindow.get(event.source);if(!frame||event.data?.type!=='bishun-course-height')return;const height=Number(event.data.height);if(Number.isFinite(height))frame.style.height=Math.max(180,Math.min(100000,height))+'px'});
</script>
</body>
</html>`;

fs.writeFileSync(output, html, 'utf8');
console.log(`Documento integrado criado: ${path.relative(root, output)} (${html.length.toLocaleString('pt-BR')} caracteres).`);
