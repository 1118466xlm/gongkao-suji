const CACHE = 'gongkao-v9';
const PAGE = '/gongkao-suji/';

self.addEventListener('install', function(e) {
  self.skipWaiting();
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

  // 导航请求：cache-first，后台更新
  if (e.request.mode === 'navigate') {
    e.respondWith(
      caches.match(PAGE).then(function(cached) {
        var netUp = fetch(e.request).then(function(r) {
          if (r.ok) {
            var rc = r.clone();
            caches.open(CACHE).then(function(c) { c.put(PAGE, rc); });
          }
          return r;
        }).catch(function() {});
        return cached || netUp;
      })
    );
    return;
  }

  // 其他资源：network-first，fallback到缓存
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
