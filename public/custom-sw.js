// public/sw.js - Main service worker file

const CACHE_NAME = 'media-cache-v3';
const OFFLINE_URL = '/offline.html';

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching essential resources...');
        return cache.addAll([
          '/',
          OFFLINE_URL,
          '/icons/icon-192x192.png',
          '/icons/icon-96x96.png',
        ]).catch(err => {
          console.error('Failed to cache some resources:', err);
        });
      })
      .then(() => {
        console.log('✅ Service Worker installed');
        return self.skipWaiting(); // Activate immediately
      })
  );
});

// Activate event - clean old caches and take control
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheWhitelist.includes(cacheName)) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated');
        return self.clients.claim(); // Take control of all pages immediately
      })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', function (event) {
  console.log('📬 Push notification received');
  
  if (!event.data) {
    console.warn('⚠️ Push event has no data');
    return;
  }

  let payload;
  try {
    payload = event.data.json();
    console.log('📋 Parsed payload:', payload);
  } catch (e) {
    console.error('❌ Failed to parse push data as JSON:', e);
    try {
      payload = JSON.parse(event.data.text());
    } catch (err) {
      console.error('❌ Failed to parse as text:', err);
      payload = { 
        title: 'Notification', 
        body: event.data.text() 
      };
    }
  }

  // Extract notification data
  const title = payload.title || 'Notification';
  const body = payload.body || '';
  const icon = payload.icon || '/icons/icon-192x192.png';
  const badge = payload.badge || '/icons/icon-96x96.png';
  const url = payload.url || '/';

  const options = {
    body,
    icon,
    badge,
    vibrate: [200, 100, 200],
    data: { 
      url, 
      dateOfArrival: Date.now(),
      clickAction: url,
    },
    actions: [
      { action: 'open', title: 'Open', icon: '/icons/icon-96x96.png' },
      { action: 'close', title: 'Dismiss' }
    ],
    tag: 'notification-' + Date.now(),
    requireInteraction: false,
    silent: false,
  };

  console.log('🔔 Showing notification:', title, options);

  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => {
        console.log('✅ Notification displayed successfully');
      })
      .catch(err => {
        console.error('❌ Failed to show notification:', err);
      })
  );
});

// Notification click event - handle user interaction
self.addEventListener('notificationclick', function (event) {
  console.log('👆 Notification clicked, action:', event.action);
  
  event.notification.close();

  // If user clicked "close", just close the notification
  if (event.action === 'close') {
    console.log('User dismissed notification');
    return;
  }

  const urlToOpen = event.notification.data?.url || 
                    event.notification.data?.clickAction || 
                    '/';

  console.log('🔗 Opening URL:', urlToOpen);

  event.waitUntil(
    clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    }).then((clientList) => {
      console.log('🔍 Found', clientList.length, 'open windows');
      
      // Check if there's already a window/tab open with this URL
      for (const client of clientList) {
        const clientUrl = new URL(client.url);
        const targetUrl = new URL(urlToOpen, self.location.origin);
        
        if (clientUrl.pathname === targetUrl.pathname && 'focus' in client) {
          console.log('✅ Focusing existing window');
          return client.focus();
        }
      }
      
      // No existing window found, open a new one
      if (clients.openWindow) {
        console.log('🆕 Opening new window');
        return clients.openWindow(urlToOpen);
      }
    }).catch(err => {
      console.error('❌ Error handling notification click:', err);
    })
  );
});

// Fetch event - serve from cache when possible
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          console.log('📦 Serving from cache:', event.request.url);
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // Cache media files and icons
            const url = event.request.url;
            const shouldCache = url.includes('/media/') || 
                              url.includes('/icons/') ||
                              url.includes('/images/');

            if (shouldCache) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  console.log('💾 Caching:', url);
                  cache.put(event.request, responseClone);
                })
                .catch(err => console.error('Failed to cache:', err));
            }

            return response;
          })
          .catch((error) => {
            console.error('❌ Fetch failed:', error);
            
            // For navigation requests, return offline page
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            
            throw error;
          });
      })
  );
});

// Handle push subscription changes
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('🔄 Push subscription changed');
  
  event.waitUntil(
    self.registration.pushManager.subscribe(event.oldSubscription.options)
      .then((subscription) => {
        console.log('✅ Resubscribed to push notifications');
        
        // Send new subscription to server
        return fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription })
        });
      })
      .catch(err => {
        console.error('❌ Failed to resubscribe:', err);
      })
  );
});

// Log service worker errors
self.addEventListener('error', (event) => {
  console.error('❌ Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Unhandled promise rejection in SW:', event.reason);
});

console.log('🎉 Service Worker script loaded');