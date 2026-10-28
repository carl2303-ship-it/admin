/* PADEL HUB — service worker (installable PWA) */
const CACHE = 'padel-hub-v1'
const PRECACHE = [
  '/icons/icon.svg',
  '/icons/icon-maskable.svg',
  '/pwa-icon/192',
  '/pwa-icon/512',
  '/pwa-icon/apple',
  '/manifest.webmanifest',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // Nunca cachear APIs / auth
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.startsWith('/login')
  ) {
    return
  }

  // Navegação: network-first (app dinâmica)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => res)
        .catch(() =>
          caches.match('/dashboard').then((cached) => cached || Response.error())
        )
    )
    return
  }

  // Ícones / manifest / estáticos: cache-first
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/pwa-icon/') ||
    url.pathname === '/manifest.webmanifest' ||
    url.pathname === '/sw.js'
  ) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached
        return fetch(req).then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((cache) => cache.put(req, copy))
          return res
        })
      })
    )
  }
})
