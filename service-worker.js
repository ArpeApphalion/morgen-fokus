const CACHE = 'morgen-fokus-v2';
const ASSETS = ['./', './index.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(caches.keys().then(keys =>
        Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ));
    self.clients.claim();
});

self.addEventListener('fetch', e => {
    e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request)));
});

/* ── Notification Scheduling ── */
let scheduledTimers = [];

self.addEventListener('message', event => {
    if (event.data?.type === 'SCHEDULE') {
        scheduledTimers.forEach(t => clearTimeout(t));
        scheduledTimers = [];

        (event.data.schedule || []).forEach(notif => {
            const delay = notif.timestamp - Date.now();
            if (delay > 0 && delay < 48 * 60 * 60 * 1000) {
                const t = setTimeout(() => {
                    self.registration.showNotification(notif.title, {
                        body: notif.body,
                        icon: './icons/icon-192.png',
                        badge: './icons/icon-192.png',
                        tag: notif.tag,
                        data: { url: './' },
                        vibrate: [200, 100, 200],
                        requireInteraction: false
                    });
                }, delay);
                scheduledTimers.push(t);
            }
        });
    }
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    const url = event.notification.data?.url || './';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
            for (const client of list) {
                if ('focus' in client) return client.focus();
            }
            return clients.openWindow(url);
        })
    );
});
