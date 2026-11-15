-- ────────────────────────────────────────────────────
-- 0052_workspace_admins.sql
-- 관리자 관리(개별 계정) — 지금까지 /workspace·/admin02는 공유 ADMIN_PASSWORD
-- 하나로만 보호됐다(adminAuth 미들웨어). 이 테이블은 그 게이트를 대체하는 게
-- 아니라, 그 안쪽에서 "누가 로그인했는지"를 식별하는 레이어를 추가한다 —
-- 사내톡/워크플로우/휴일신청의 작성자가 자유 텍스트였던 이유(0051 참고)를
-- 실제로 해소한다. API 접근 권한 자체는 여전히 ADMIN_PASSWORD가 1차 게이트.
-- ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS workspace_admins (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'staff',  -- 'super'(총괄) | 'staff'(일반)
  is_active     INTEGER NOT NULL DEFAULT 1,
  last_login_at TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ws_admins_active ON workspace_admins(is_active);

CREATE TABLE IF NOT EXISTS workspace_admin_sessions (
  token      TEXT PRIMARY KEY,
  admin_id   TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (admin_id) REFERENCES workspace_admins(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_ws_admin_sessions_admin ON workspace_admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_ws_admin_sessions_expires ON workspace_admin_sessions(expires_at);
