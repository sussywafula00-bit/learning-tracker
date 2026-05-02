/**
 * Service Worker for 好学伴 PWA
 */

const CACHE_NAME = 'haoxueban-v1';
const urlsToCache = [
  './',
  './login.html',
  './student.html',
  './parent.html',
  './css/common.css',
  './css/login.css',
  './css/student.css',
  './css/parent.css',
  './js/storage.js',
  './js/utils.js',
  './js/auth.js',
  './js/tasks.js',
  './js/tracker.js',
  './js/points.js',
  './js/drop.js',
  './js/wishes.js',
  './js/login.js',
  './js/student.js',
  './js/parent.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js',
  './pwa-192x192.png',
  './pwa-512x512.png',
  './manifest.json'
];

// 安装 Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// 激活并清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 请求拦截 - 缓存优先
self.addEventListener('fetch', event => {
  // 跳过非 GET 请求
  if (event.request.method !== 'GET') return;

  // 跳过跨域请求
  if (!event.request.url.startsWith(self.location.origin) &&
      !event.request.url.includes('cdnjs.cloudflare.com') &&
      !event.request.url.includes('cdn.jsdelivr.net')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }

        return fetch(event.request).then(response => {
          // 不缓存非正常响应
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // 缓存新资源
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });

          return response;
        });
      })
      .catch(() => {
        // 离线时返回缓存的登录页
        if (event.request.url.includes('login.html')) {
          return caches.match('/login.html');
        }
      })
  );
});
