const CACHE='bishun-offline-7.0.0';
const SHELL=['./','./index.html','./portal.css?v=6.9.0','./portal.js?v=7.0.0','./rotas.js?v=6.9.1','./favicon.svg','./manifest.webmanifest'];
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(SHELL);await self.skipWaiting()})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('bishun-')&&k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim()})()));
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET')return;
 const url=new URL(req.url);if(url.origin!==self.location.origin)return;
 if(req.mode==='navigate'){
  event.respondWith((async()=>{const cache=await caches.open(CACHE);try{const response=await fetch(req);if(response.ok)await cache.put(req,response.clone());return response}catch{
   const saved=await cache.match(req);if(saved)return saved;
   return new Response('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Conteúdo indisponível offline</title><body style="font:16px system-ui;max-width:48rem;margin:12vh auto;padding:20px"><h1>Este conteúdo ainda não está disponível offline</h1><p>Conecte-se à internet e abra esta página ao menos uma vez para salvá-la neste navegador.</p><p><a href="./">Abrir a página inicial</a></p></body></html>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8'}})
  }})());return;
 }
 event.respondWith((async()=>{const cache=await caches.open(CACHE);const cached=await cache.match(req);if(cached)return cached;const response=await fetch(req);if(response.ok)await cache.put(req,response.clone());return response})())
});
