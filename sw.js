const RECOVERY_VERSION='6.2.2';
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(key=>key.startsWith('bishun-')).map(key=>caches.delete(key)));
  await self.registration.unregister();
  const clientsList=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  for(const client of clientsList) client.postMessage({type:'BISHUN_CACHE_RESET',version:RECOVERY_VERSION});
})()));
