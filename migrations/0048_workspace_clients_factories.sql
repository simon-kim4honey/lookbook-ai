-- ────────────────────────────────────────────────────
-- 0048_workspace_clients_factories.sql
-- 고객사/공장 관리. 고객사 로그인 자체는 기존 users 테이블을 그대로 쓰므로(별도
-- 계정 체계 없음), workspace_clients는 그 계정에 ADMIN이 덧붙이는 사업자 정보만
-- 보관한다(users 테이블은 전체 서비스 공용이라 직접 건드리지 않음).
-- 공장은 로그인과 무관한 내부 전용 디렉토리.
-- ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS workspace_clients (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  company_name TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS workspace_factories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,            -- 자유 텍스트(예: 봉제, 도금, 주물, 원단)
  contact_info TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
