-- ────────────────────────────────────────────────────
-- 지원사업 도우미 위저드 — 사용자가 입력한 답변(answers)을 프로젝트 단위로 저장.
-- 재무 계산 결과(finance)와 상태(status)도 함께 보관한다.
-- status: draft(입력 중) | generated(AI 초안 생성됨, 다음 단계 구현 예정) | done
-- ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gov_support_projects (
  id            TEXT PRIMARY KEY,    -- uuid
  user_id       TEXT NOT NULL,
  program_id    TEXT NOT NULL,       -- GOV_SUPPORT_PROGRAMS의 id (예: 'yebi')
  program_name  TEXT NOT NULL,
  answers       TEXT NOT NULL DEFAULT '{}',  -- JSON (위저드 단계별 답변)
  finance       TEXT,                -- JSON (재무 계산기 결과 — 다음 단계에서 채움)
  status        TEXT NOT NULL DEFAULT 'draft',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_gov_support_projects_user ON gov_support_projects(user_id);
