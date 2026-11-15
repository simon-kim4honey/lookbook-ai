-- ────────────────────────────────────────────────────
-- 0049_workspace_templates_announcements.sql
-- 옵션 템플릿("고객사별 옵션 묶음을 템플릿으로 저장")과 공지사항/팝업
-- ("공지사항과 팝업으로 고객사에 소식 전달").
-- ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS workspace_option_templates (
  id TEXT PRIMARY KEY,
  industry TEXT NOT NULL DEFAULT 'clothing',
  label TEXT NOT NULL,          -- 템플릿 이름(예: "실버 체인 세트")
  options_json TEXT NOT NULL,   -- [{"label":"재질","value":"실버"}, ...]
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ws_opt_templates_industry ON workspace_option_templates(industry);

-- is_popup=1인 글이 /my-production 첫 화면에 팝업으로 뜬다. is_active=0이면 숨김.
CREATE TABLE IF NOT EXISTS workspace_announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  is_popup INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ws_announcements_active ON workspace_announcements(is_active);
