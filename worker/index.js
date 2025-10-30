const CACHE_NAME = 'media-cache-v1';

self.addEventListener('push', function(event) {
    console.log('Received push event:', event);
    const { title, body, url } = JSON.parse(event.data.text()); // Extract URL

    if (event.data) {
        const options = {
            body,
            icon: '/icon.png',
            vibrate: [100, 50, 100],
            data: {
                url, // Include the URL in notification data
                dateOfArrival: Date.now(),
                primaryKey: '2',
            },
        };

        event.waitUntil(self.registration.showNotification(title, options));
    }
});

self.addEventListener('notificationclick', async(e) => {
    e.notification.close();

    console.log(e.notification.data.url);

    const urlToOpen = e.notification.data.url || '/';

    e.waitUntil(
        clients
        .matchAll({
            type: 'window',
        })
        .then((clientList) => {
            for (const client of clientList) {
                if (client.url === urlToOpen && 'focus' in client)
                    return client.focus();
            }

            if (clients.openWindow) return clients.openWindow(urlToOpen);
        })
    );
});

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching essential files');
            return cache.addAll([
                '/',
                '/offline.html', // A simple offline page
            ]);
        })
    );
});

self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        console.log('[Service Worker] Deleting old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches
        .match(event.request)
        .then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request).then((response) => {
                if (event.request.url.includes('/media/')) {
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, response.clone());
                    });
                }
                return response;
            });
        })
        .catch(() => {
            return caches.match('/offline.html');
        })
    );
});