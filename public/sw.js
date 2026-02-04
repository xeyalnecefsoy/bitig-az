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
