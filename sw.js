const CACHE = "duty-v1";

// 캐시 대상: 같은 출처 페이지 + CDN 스크립트/폰트. Supabase 요청은 건드리지 않음
const cacheable = (url) =>
  url.origin === self.location.origin ||
  url.hostname === "cdn.jsdelivr.net";

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["./"])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// stale-while-revalidate: 캐시본 즉시 응답, 뒤에서 최신본 받아 갱신
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || !cacheable(url)) return;
  e.respondWith(
    caches.open(CACHE).then(async (c) => {
      const cached = await c.match(e.request);
      const fresh = fetch(e.request).then((res) => {
        if (res.ok) c.put(e.request, res.clone());
        return res;
      }).catch(() => null);
      return cached || (await fresh) || new Response("오프라인이고 저장된 페이지가 없습니다", { status: 503 });
    })
  );
});
