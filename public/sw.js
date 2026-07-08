// Horom PWA service worker — зориудаар консерватив.
//
// Энэ апп нэвтрэлт шаарддаг, олон гэр бүлийн (multi-tenant) зургийн апп тул
// кэшлэх бодлого нь "хэрэглэгчийн өгөгдлийг ХЭЗЭЭ Ч кэшлэхгүй" зарчимтай:
//
//   КЭШЛЭНЭ:   /_next/static/*  (build-ийн hash-тай, хувиршгүй asset)
//              /offline.html    (офлайн үеийн fallback хуудас)
//
//   /icons/*-ийг зориуд кэшлэхгүй — файлын нэр нь hash-гүй тул icon солиход
//   CACHE_VERSION-ийг мартвал хуучин icon гацна. Browser-ийн HTTP кэш хангалттай.
//
//   ОГТ ОРОЛЦОХГҮЙ (browser шууд network рүү):
//              /api/*           (session, upload, зураг — бүгд хэрэглэгчийн өгөгдөл)
//              GET биш бүх хүсэлт (upload-ийн POST/multipart г.м.)
//              cross-origin хүсэлтүүд
//
//   NAVIGATION (HTML хуудас): үргэлж network-ээс; кэшлэхгүй. Зөвхөн сүлжээ
//              тасарсан үед offline.html-ийг буцаана. HTML-ийг кэшлэдэггүй тул
//              нэг төхөөрөмж дээр хэрэглэгч солигдоход хуучин хэрэглэгчийн
//              хуудас гарч ирэх эрсдэлгүй.
//
// Шинэчлэхдээ CACHE_VERSION-ийг өсгөнө — activate үед хуучин кэш устана.

const CACHE_VERSION = "horom-v1"
const OFFLINE_URL = "/offline.html"

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll([OFFLINE_URL]))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  )
})

// Кэшлэхэд аюулгүй, хувиршгүй статик asset мөн үү? (зөвхөн build-hash-тай зам)
function isImmutableAsset(url) {
  return url.pathname.startsWith("/_next/static/")
}

self.addEventListener("fetch", (event) => {
  const req = event.request

  // GET биш (upload г.м.) болон өөр origin-ийн хүсэлдэд огт оролцохгүй.
  if (req.method !== "GET") return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // БҮҮ ЗӨӨЖ/УСТГАЖ БОЛОХГҮЙ: энэ мөр /api/auth/*, /api/verify/*, /api/sms/*
  // зэрэг session/хэрэглэгчийн өгөгдөлтэй бүх замыг SW-ээс бүрэн тусгаарладаг.
  // Хэрэв хэзээ нэгэн /api/-ийн доторх замыг кэшлэх бол carve-out-оо ЭНЭ
  // МӨРНӨӨС ДЭЭШ нь нэмж, CACHE_VERSION-ийг заавал өсгө.
  if (url.pathname.startsWith("/api/")) return

  // Хувиршгүй статик asset: cache-first.
  if (isImmutableAsset(url)) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone()
              caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy))
            }
            return res
          })
      )
    )
    return
  }

  // Хуудасны navigation: network-only + офлайн fallback. HTML-ийг кэшлэхгүй.
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)))
    return
  }

  // Бусад бүх GET (RSC payload, зураг г.м.) — оролцохгүй, browser өөрөө шийднэ.
})
