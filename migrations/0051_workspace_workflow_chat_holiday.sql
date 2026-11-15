-- ────────────────────────────────────────────────────
-- 0051_workspace_workflow_chat_holiday.sql
-- 워크플로우(요청), 사내톡, 근무/휴일관리. 셋 다 로그인 계정이 없는 운영팀 내부용
-- 기능이라 "작성자"는 자유 텍스트(이름)로만 남긴다 — ADMIN_PASSWORD 하나를
-- 공유해서 쓰기 때문에 누가 썼는지 시스템이 구분할 방법이 없음.
-- ────────────────────────────────────────────────────

-- status: open(접수) → in_progress(진행) → done(완료)
CREATE TABLE IF NOT EXISTS workspace_workflow_requests (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,          -- cad(캐드/원본) | material(부자재) | repair(수리) | other
  title TEXT NOT NULL,
  content TEXT,
  product_code TEXT,
  requester_name TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ws_workflow_status ON workspace_workflow_requests(status);

-- 사내톡 — 운영팀 전체가 보는 하나의 공유 채팅방(AI 아님, 사람 간 대화).
CREATE TABLE IF NOT EXISTS workspace_team_chat (
  id TEXT PRIMARY KEY,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 휴일 교환 신청. status: pending(대기) → approved(승인) | rejected(반려)
CREATE TABLE IF NOT EXISTS workspace_holiday_requests (
  id TEXT PRIMARY KEY,
  requester_name TEXT NOT NULL,
  requested_date TEXT NOT NULL,   -- 쉬고 싶은 날짜(YYYY-MM-DD)
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ws_holiday_status ON workspace_holiday_requests(status);
