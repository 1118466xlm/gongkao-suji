const CACHE = 'gongkao-v1';
const PAGE = '/gongkao-suji/';

self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c) {
    return c.add(PAGE).catch(function() {});
  }));
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); }));
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  var url = new URL(e.request.url);

  // LAN API 请求：不缓存，直通网络
  if (url.hostname === '192.168.1.2' && url.pathname === '/api/idioms') {
    e.respondWith(
      fetch(e.request).catch(function() {
        return new Response(JSON.stringify({ chengyu: [], shici: [] }), { headers: { 'Content-Type': 'application/json' } });
      })
    );
    return;
  }

  // 导航请求：网络优先，离线降级到缓存
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(function(r) {
        var rc = r.clone();
        caches.open(CACHE).then(function(c) { c.put(PAGE, rc); });
        return r;
      }).catch(function() {
        return caches.match(PAGE);
      })
    );
    return;
  }

  // 其他请求：网络优先，失败时用缓存
  e.respondWith(
    fetch(e.request).then(function(r) {
      if (r.ok && e.request.method === 'GET') {
        var rc = r.clone();
        caches.open(CACHE).then(function(c) { c.put(e.request, rc); });
      }
      return r;
    }).catch(function() {
      return caches.match(e.request);
    })
  );
});
