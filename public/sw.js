const CACHE_NAME = "coin-pulse-v1.00005";
/**
 * Service Worker для Progressive Web App (PWA)
 *
 * Обеспечивает кэширование ресурсов, офлайн-доступ и другие PWA-функции.
 * Использует стратегию кэширования "network first, falling back to cache".
 *
 * @module ServiceWorker
 *
 * @see {@link https://web.dev/service-workers-cache-policies/} - Руководство по стратегиям кэширования Service Workers
 *
 * @remarks
 * - Кэширует статические ресурсы приложения
 * - Обрабатывает запросы к CoinGecko API отдельно (не кэширует)
 * - Автоматически управляет версиями кэша
 * - Использует алгоритм обновления: новый SW ждет завершения работы старого
 *
 * @version 1.0.0
 */
self.addEventListener("install", () => {
  console.log("[Service Worker] Установка завершена успешно");
  self.skipWaiting();
});

/**
 * Event listener для события 'activate'
 *
 * Очищает устаревшие кэши и переходит в активное состояние,
 * немедленно принимая контроль над всеми клиентами.
 *
 * @event activate
 *
 * @param {ExtendableEvent} event - Событие активации Service Worker
 *
 * @remarks
 * - Удаляет все кэши, кроме текущего (CACHE_NAME)
 * - Использует event.waitUntil() для продления времени жизни события
 * - Вызывает self.clients.claim() для немедленного контроля над клиентами
 */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          // Удаляем старый устаревший кэш
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        }),
      );
    }),
  );
  self.clients.claim();
});
/**
 * Event listener для события 'fetch'
 *
 * Обрабатывает сетевые запросы, используя стратегию "network first, falling back to cache".
 * Запросы к CoinGecko API не кэшируются и проходят напрямую.
 *
 * @event fetch
 *
 * @param {FetchEvent} event - Событие сетевого запроса
 *
 * @remarks
 * - Пропускает запросы к CoinGecko API без кэширования
 * - Кэширует успешные GET-запросы после получения ответа
 * - Использует кэш как резервный источник при сетевых ошибках
 */
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  // console.log(url);
  // Пропускаем запросы к CoinGecko API (не кэшируем API-запросы)
  if (url.hostname.endsWith("coingecko.com")) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // Кэшируем успешные GET-запросы
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          request.method === "GET"
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Возвращаем из кэша при сетевых ошибках
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
      }),
  );
});
