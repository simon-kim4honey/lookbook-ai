-- ────────────────────────────────────────────────────
-- 지원사업 AI 초안 생성 구조를 관리자가 어드민 화면에서 직접 편집할 수 있도록
-- DB로 이관한다. 프로그램(program_id)별로 섹션(gov_support_sections)을 두고,
-- 각 섹션 안에 생성할 항목(gov_support_items)을 순서대로 둔다. 항목마다
-- 표현방법(expression_type — subhead/table/bullets 등)을 지정한다.
--
-- generateGovSupportSections()는 이 테이블에 해당 program_id의 섹션이 하나라도
-- 있으면 거기서 구조를 읽어 프롬프트를 조립하고, 없으면 코드에 하드코딩된
-- GS_YEBI_STRUCTURE로 폴백한다(마이그레이션 전/관리자가 아직 설정 안 한 프로그램
-- 보호용). "이 프로그램에 AI 초안 생성을 지원하는가"도 이 테이블에 섹션이
-- 있는지로 판단한다(GS_GENERATION_READY_IDS 하드코딩 배열 대체).
-- ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gov_support_sections (
  id            TEXT PRIMARY KEY,    -- uuid
  program_id    TEXT NOT NULL,       -- GOV_SUPPORT_PROGRAMS의 id (예: 'yebi')
  section_key   TEXT NOT NULL,       -- 'problem' | 'solution' | ... (영문 키, AI 응답 sectionId와 매칭)
  title         TEXT NOT NULL,       -- 화면/프롬프트에 쓰일 한글 제목 (예: "1. 문제 인식 (Problem)")
  display_order INTEGER NOT NULL DEFAULT 0,
  target_chars  INTEGER NOT NULL DEFAULT 800,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(program_id, section_key)
);

CREATE INDEX IF NOT EXISTS idx_gs_sections_program ON gov_support_sections(program_id);

CREATE TABLE IF NOT EXISTS gov_support_items (
  id              TEXT PRIMARY KEY,  -- uuid
  section_id      TEXT NOT NULL REFERENCES gov_support_sections(id) ON DELETE CASCADE,
  item_order      INTEGER NOT NULL DEFAULT 0,
  expression_type TEXT NOT NULL,     -- headlineBox|subhead|subhead2|paragraph|bullets|table|visual|iconStats
  label           TEXT NOT NULL,     -- 항목 제목/지시 (예: "가. 창업아이템 배경", "1) 외부적 배경 및 동기")
  notes           TEXT,              -- 추가 작성 지시(표 컬럼 구성, 참고자료 활용법 등)
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_gs_items_section ON gov_support_items(section_id);
