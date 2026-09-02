// PWA 설치(홈 화면/데스크톱에 추가) 가능 조건을 충족시키기 위한 최소 서비스워커.
// 의도적으로 아무것도 캐싱하지 않음 — 생성 결과·크레딧 등 항상 최신 데이터를
// 보여줘야 하는 서비스라 오프라인 캐싱으로 인한 stale 데이터 위험을 피한다.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
