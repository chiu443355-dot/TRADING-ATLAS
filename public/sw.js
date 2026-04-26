const CACHE_VERSION = 'wikwiz-v1.0.0';
const RUNTIME_CACHE = 'wikwiz-runtime-v1';

const STATIC_ASSETS = [
  '/', '/chapters', '/calculators',
  '/chapters/01-what-is-trading', '/chapters/02-the-markets',
  '/chapters/03-market-sessions', '/chapters/04-market-structure',
  '/chapters/05-areas-of-interest', '/chapters/06-candlestick-mastery',
  '/chapters/07-chart-patterns', '/chapters/08-smart-money',
  '/chapters/09-risk-management', '/chapters/10-trading-psychology',
  '/chapters/11-complete-strategy', '/chapters/12-your-roadmap',
  '/chapters/13-options-derivatives', '/chapters/14-global-macro',
  '/chapters/15-algorithmic-concepts', '/chapters/16-becoming-professional',
  '/locales/en.json', '/locales/hi.json', '/locales/mr.json',
  '/manifest.json',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache =>
      Promise.allSettled(STATIC_ASSETS.map(url => cache.add(url).catch(() => null)))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(names.filter(n => n !== CACHE_VERSION && n !== RUNTIME_CACHE).map(n => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') return;

  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(cache =>
        cache.match(request).then(cached => cached || fetch(request).then(r => { cache.put(request, r.clone()); return r; }))
      )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response.status === 200 && response.type === 'basic') {
          caches.open(RUNTIME_CACHE).then(cache => cache.put(request, response.clone()));
        }
        return response;
      }).catch(() => {
        if (request.destination === 'document') return caches.match('/');
        return new Response('Offline', { status: 503 });
      });
    })
  );
});
