-- ────────────────────────────────────────────────────
-- 0024_error_logs.sql
-- 사용자 에러(클라이언트 미처리 예외 + 서버 API 실패)를 어드민에서 바로 확인하고
-- 유지보수 세션이 주기적으로 폴링해 자동 진단/수정 PR을 붙일 수 있도록 기록하는 테이블.
-- status: open(신규) → in_review(수정 PR 생성됨, 사람 확인 대기) → resolved(해결/배포 완료)
-- ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS error_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,           -- 'client' | 'server'
  message TEXT NOT NULL,
  stack TEXT,
  route TEXT,                     -- 서버: API 경로 / 클라이언트: 발생 시점 URL
  extra TEXT,                     -- 부가 컨텍스트(JSON 문자열) — 예: userAgent, jobId
  status TEXT NOT NULL DEFAULT 'open',   -- open | in_review | resolved
  fix_pr_url TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_error_logs_status ON error_logs(status);
CREATE INDEX IF NOT EXISTS idx_error_logs_created ON error_logs(created_at);
