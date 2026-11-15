-- ────────────────────────────────────────────────────
-- 0050_workspace_notifications.sql
-- 알림 — 벤치마킹(유사 서비스 홍보 영상)에서 확인한 핵심 기능. 운영팀(ADMIN)과
-- 고객사(USER) 양쪽에 다 뜨는데, audience로 구분해서 한 테이블에 같이 둔다.
-- audience='client'일 때만 client_user_id가 의미 있다(그 사람 알림만 보임).
-- audience='admin'은 공유 비밀번호 하나를 쓰는 운영팀 전체가 같은 알림을 본다.
-- ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS workspace_notifications (
  id TEXT PRIMARY KEY,
  audience TEXT NOT NULL,          -- 'admin' | 'client'
  client_user_id TEXT REFERENCES users(id),
  message TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ws_notifications_audience ON workspace_notifications(audience, is_read);
CREATE INDEX IF NOT EXISTS idx_ws_notifications_client ON workspace_notifications(client_user_id, is_read);
