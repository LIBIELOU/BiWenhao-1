// Service Worker for caching resume resources
const CACHE_NAME = 'resume-cache-v1';
const RESOURCES_TO_CACHE = [
    '/',
    '/index.html',
    '/styles.css',
    '/modules/resume-buttons.css',
    '/modules/resume-buttons.js',
    '/modules/cache-busting.js',
    '/modules/content-sync.js',
    '/modules/local-data-sync.js',
    '/script.js',
    '/data.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// 安装 Service Worker
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching resume resources');
                return cache.addAll(RESOURCES_TO_CACHE);
            })
            .catch((error) => {
                console.error('[Service Worker] Cache install failed:', error);
            })
    );
    self.skipWaiting();
});

// 激活 Service Worker
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// 拦截请求
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // 只缓存简历相关的资源
    const isResumeResource = RESOURCES_TO_CACHE.some(resource => {
        return url.pathname === resource || url.href.includes(resource);
    });
    
    if (isResumeResource) {
        event.respondWith(
            caches.match(event.request)
                .then((cachedResponse) => {
                    if (cachedResponse) {
                        console.log('[Service Worker] Serving from cache:', event.request.url);
                        return cachedResponse;
                    }
                    
                    console.log('[Service Worker] Fetching from network:', event.request.url);
                    return fetch(event.request).then((response) => {
                        // 检查是否是有效响应
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // 克隆响应，因为响应是流，只能使用一次
                        const responseToCache = response.clone();
                        
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    }).catch((error) => {
                        console.error('[Service Worker] Fetch failed:', error);
                        // 如果网络请求失败，尝试从缓存中获取
                        return caches.match(event.request);
                    });
                })
        );
    } else {
        // 对于其他资源，直接从网络获取
        event.respondWith(fetch(event.request));
    }
});

// 监听消息事件
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});