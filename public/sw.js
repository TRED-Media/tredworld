const CACHE='tred-shell-v1';
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(['/','/icon.svg','/manifest.webmanifest'])));self.skipWaiting();});
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin)return;if(url.pathname.startsWith('/api/'))return;event.respondWith(fetch(event.request).then(response=>{if(response.ok){const clone=response.clone();event.waitUntil(caches.open(CACHE).then(c=>c.put(event.request,clone)));}return response;}).catch(()=>caches.match(event.request).then(r=>r||(event.request.mode==='navigate'?caches.match('/'):Response.error()))));});
