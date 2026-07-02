/* ==================================================================
   SERVICE WORKER
   Estratégia: "cache-first com atualização em segundo plano".
   - Tudo que é essencial (HTML, JSON da Bíblia e do Hinário) é
     baixado e guardado já na instalação, então o app funciona
     offline desde a primeira visita completa.
   - Recursos externos (fontes, ícones) são guardados conforme vão
     sendo usados.
   Sempre que você atualizar o conteúdo (ex.: trocar a Bíblia ou o
   hinário), aumente o número da versão abaixo — isso força o
   navegador a buscar tudo de novo e atualizar o cache.
   ================================================================== */

const CACHE_VERSION = 'pipq-cache-v10';

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './biblia-acf.json',
  './biblia-ara.json',
  './biblia-naa.json',
  './novo-cantico.json',
  './assets/logo-fundo.jpeg',
  './app-data.js',
  './firebase-config.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache =>
      // addAll falha se QUALQUER arquivo não existir; por isso adicionamos
      // um por um e ignoramos os que ainda não foram colocados na pasta
      // (ex.: biblia-acf.json antes de você adicioná-lo).
      Promise.all(
        CORE_ASSETS.map(url =>
          cache.add(url).catch(() => {/* arquivo ainda não existe — tudo bem */})
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      // Atualiza o cache em segundo plano sem travar a resposta atual
      const networkFetch = fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then(cache => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached); // sem internet: usa o que já está em cache

      return cached || networkFetch;
    })
  );
});
