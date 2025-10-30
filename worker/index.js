/* public/sw.js */
const CACHE_NAME = 'media-cache-v1';

self.addEventListener('push', function (event) {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    try { payload = JSON.parse(event.data.text()); } catch (err) { payload = { title: 'Notification', body: event.data.text() }; }
  }

  const { title = 'Notification', body = '', url = '/' } = payload;

  const options = {
    body,
    icon: '/icon.png',
    vibrate: [100, 50, 100],
    data: { url, dateOfArrival: Date.now() },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(urlToOpen);
    })
  );
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(['/','/offline.html']))
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.map((n) => (cacheWhitelist.includes(n) ? null : caches.delete(n))))
    )
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((resp) => {
        if (event.request.url.includes('/media/')) {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resp.clone()));
        }
        return resp;
      });
    }).catch(() => caches.match('/offline.html'))
  );
});
