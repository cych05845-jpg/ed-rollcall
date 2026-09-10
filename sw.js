/* 急診點班 PWA service worker
 *
 * ★★★ 這支「完全不快取」，所以你改 HTML 之後不用做任何事。
 *
 * 為什麼拿掉快取：
 *   原本的版本會把 index.html 存進快取，好處是離線也能開啟畫面，
 *   代價是每次改 HTML 都要記得把 VERSION 加 1，否則離線時會看到舊版。
 *   但這個系統離線根本不能用 —— 點班、冰箱、氧氣、欠物每個動作都要寫回
 *   Apps Script；離線時就算畫面打得開，也只是看到本機的舊資料，
 *   反而容易讓人以為存好了。
 *   所以那份離線備份幾乎沒有價值，卻要你每次改檔都記得維護它。不划算。
 *
 * 現在的行為：跟「沒有 service worker」完全一樣，
 *   只多了「可以加到主畫面、有圖標、全螢幕開啟」這件事。
 *   不會有任何舊版殘留的問題，也永遠不必再改這個檔。
 *
 * ★ 注意：fetch 事件處理器一定要留著（即使什麼都不做），
 *   Android Chrome 判斷「可否安裝」時會檢查它存在。
 *   千萬不要改成 e.respondWith(fetch(e.request)) —— 那會由 service worker
 *   重新發出請求，跨網域時可能掉失 CORS 條件，把排班表（Firebase）
 *   和後端寫入（Apps Script）弄壞。
 */
const SW_VERSION = 'ed-rollcall-nocache-4';
/* ★ 每次 service worker 啟動就把所有快取清掉。
   為什麼不只放在 activate：實測發現舊版 SW 被換掉的那一次，
   activate 清完之後，還在控制頁面的舊 SW 又把 index.html 重新寫回快取，
   結果 ed-rollcall-v1 一直留著（4 個檔）。
   因為這支永遠不寫快取，所以「開機就全清」是安全且idempotent的做法，
   舊版留下的殘留一定會被清乾淨。 */
function purgeAll() {
  return caches.keys()
    .then(function (keys) { return Promise.all(keys.map(function (k) { return caches.delete(k); })); })
    .catch(function () {});
}
purgeAll();                              // SW 每次啟動都跑一次
self.addEventListener('install', function (e) {
  e.waitUntil(purgeAll().then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(purgeAll().then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function () {
  // 刻意不呼叫 respondWith：一切交給瀏覽器原生處理。
  // 有這個處理器才具備 PWA 安裝資格。
  return;
});
