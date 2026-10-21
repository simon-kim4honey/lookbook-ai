-- ────────────────────────────────────────────────────
-- 지원사업 도우미 — 목록 9개(GOV_SUPPORT_PROGRAMS)에 없는 사업을 사용자가
-- "기타" 버튼으로 직접 요청할 때, 업로드한 양식 파일(KV에 base64 저장)과
-- 요청 정보를 기록한다. 관리자가 검토해 새 프로그램 JSON으로 추가하는 용도.
-- ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gov_support_custom_requests (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       TEXT NOT NULL,
  program_name  TEXT NOT NULL,
  file_name     TEXT,
  kv_key        TEXT NOT NULL,       -- LOOKBOOK_KV에 저장된 base64 파일의 키
  content_type  TEXT,
  status        TEXT NOT NULL DEFAULT 'pending', -- pending | reviewed
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_gov_support_custom_requests_status ON gov_support_custom_requests(status);
