self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = {}
  }

  const title = payload.title || 'Bitig'
  const body = payload.body || 'Yeni bildiriş'
  const url = payload.url || '/'

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      data: { url },
      icon: '/logo.png',
      badge: '/logo.png',
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification?.data?.url || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const had = clients.find((client) => client.url.includes(self.location.origin))
      if (had) {
        had.focus()
        had.navigate(url)
        return
      }
      return self.clients.openWindow(url)
    })
  )
})

// This is a dummy service worker to fix the 404 errors in the console.
// It effectively unregisters itself to clean up any old registrations.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  self.registration.unregister()
    .then(() => console.log('Old service worker unregistered'))
    .catch((err) => console.error('Failed to unregister service worker', err));
});
