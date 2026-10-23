-- ────────────────────────────────────────────────────
-- 지원사업 AI 초안 구조 — 구글폼형 모듈 빌더 개편 (P0: DB 마이그레이션)
--
-- 기존 gov_support_sections(대분류) → gov_support_items(항목) 2단계 구조를
-- gov_support_nodes 단일 트리(대분류/중분류/소분류 3단계, level 1~3)로 이관한다.
-- 기존 두 테이블은 DROP하지 않고 그대로 둔다(운영 중 롤백 여지 — 6개월 병행 후 정리 예정).
-- 실제 데이터 이관은 doMigrateGovStructure()(src/index.tsx)가 멱등적으로 수행한다.
--
-- 함께 신설하는 템플릿/버전/변경이력/양식원본/답변시뮬레이션/게시상태 테이블은
-- 이후 단계(빌더 UI·버전관리·양식 자동구조화)에서 쓰인다 — 이번 단계에서는 빈 테이블만 생성.
-- ────────────────────────────────────────────────────

-- 1) 구조 트리 (단일 테이블)
CREATE TABLE IF NOT EXISTS gov_support_nodes (
  id                TEXT PRIMARY KEY,                 -- uuid
  program_id        TEXT NOT NULL,                    -- 'yebi' | 'choi' | ...
  parent_id         TEXT,                             -- NULL = L1(대분류)
  level             INTEGER NOT NULL CHECK (level BETWEEN 1 AND 3),
  sort_key          TEXT NOT NULL,                     -- lexicographic 정렬키 (예: 'a000','a001')
  expression_type   TEXT NOT NULL,                     -- 14종 + L1 전용 'categoryHeader'
  title             TEXT,                              -- 카드 제목 / 노드 라벨
  payload           TEXT NOT NULL DEFAULT '{}',        -- JSON (표현방법별 설정)
  binding           TEXT NOT NULL DEFAULT 'ai',        -- static|answer|computed|ai
  binding_key       TEXT,                              -- binding=answer/computed 일 때의 키
  fill_policy       TEXT NOT NULL DEFAULT 'aiFill',    -- require|aiFill|aiFillEstimate|benchmark|synthesize|fixedPhrase|omit
  fixed_phrase      TEXT,                              -- fill_policy='fixedPhrase' 일 때의 고정 문구
  page_share        REAL,                              -- L1 전용: 분량 배분(%) — NULL이면 자동
  repeat_config     TEXT,                              -- JSON (반복 설정)
  condition_config  TEXT,                              -- JSON (조건부 렌더)
  note              TEXT,                               -- 관리자 메모 (생성 프롬프트에는 미반영)
  target_chars      INTEGER,                            -- L1 전용: 목표 분량
  weight            INTEGER,                            -- L1 전용: 심사 배점(선택)
  status            TEXT NOT NULL DEFAULT 'draft',      -- draft|published
  created_at        INTEGER NOT NULL,
  updated_at        INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gsn_program ON gov_support_nodes(program_id, status);
CREATE INDEX IF NOT EXISTS idx_gsn_parent  ON gov_support_nodes(parent_id, sort_key);

-- 2) 템플릿 라이브러리 (재사용 가능한 노드 서브트리 스냅샷)
CREATE TABLE IF NOT EXISTS gov_support_templates (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  description     TEXT,
  tags            TEXT,                                 -- JSON 배열
  scope           TEXT NOT NULL,                         -- 'category'|'group'|'module'
  source_program  TEXT,
  tree_json       TEXT NOT NULL,                         -- 노드 서브트리 스냅샷(JSON)
  is_system       INTEGER NOT NULL DEFAULT 0,            -- 1 = 시스템 제공
  use_count       INTEGER NOT NULL DEFAULT 0,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
);

-- 3) 버전 스냅샷
CREATE TABLE IF NOT EXISTS gov_support_versions (
  id            TEXT PRIMARY KEY,
  program_id    TEXT NOT NULL,
  version_no    INTEGER NOT NULL,
  label         TEXT,
  memo          TEXT,
  tree_json     TEXT NOT NULL,                           -- 전체 트리 스냅샷
  node_count    INTEGER NOT NULL DEFAULT 0,
  is_published  INTEGER NOT NULL DEFAULT 0,
  author        TEXT,
  created_at    INTEGER NOT NULL,
  UNIQUE(program_id, version_no)
);

CREATE INDEX IF NOT EXISTS idx_gsv_program ON gov_support_versions(program_id, version_no DESC);

-- 4) 변경 이력(audit log)
CREATE TABLE IF NOT EXISTS gov_support_audit_log (
  id            TEXT PRIMARY KEY,
  program_id    TEXT NOT NULL,
  node_id       TEXT,
  node_path     TEXT,                                    -- 예: '1 > 1-1 > 가'
  action        TEXT NOT NULL,                            -- create|update|delete|move|retype|publish|rollback|template_apply|import
  before_json   TEXT,
  after_json    TEXT,
  author        TEXT,
  created_at    INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gsal_program ON gov_support_audit_log(program_id, created_at DESC);

-- 5) 양식 원본 문서 (공식 양식 PDF 업로드 → 자동 구조화용, 이후 단계에서 사용)
CREATE TABLE IF NOT EXISTS gov_support_source_docs (
  id                 TEXT PRIMARY KEY,
  program_id         TEXT,
  file_name          TEXT NOT NULL,
  mime_type          TEXT NOT NULL,
  size_bytes         INTEGER NOT NULL,
  storage_key        TEXT NOT NULL,                       -- LOOKBOOK_KV 키 (base64)
  extracted_json     TEXT,                                 -- 추출된 3단계 트리 초안
  extraction_status  TEXT NOT NULL DEFAULT 'pending',      -- pending|parsed|failed|reviewed
  created_at         INTEGER NOT NULL
);

-- 6) 답변 시뮬레이션 세트 (어드민 미리보기용, 이후 단계에서 사용)
CREATE TABLE IF NOT EXISTS gov_support_answer_sets (
  id            TEXT PRIMARY KEY,
  program_id    TEXT NOT NULL,
  name          TEXT NOT NULL,
  answers_json  TEXT NOT NULL,
  created_at    INTEGER NOT NULL
);

-- 7) 게시 상태 (프로그램 단위)
CREATE TABLE IF NOT EXISTS gov_support_config (
  program_id         TEXT PRIMARY KEY,
  structure_status   TEXT NOT NULL DEFAULT 'draft',        -- draft|published
  published_at       INTEGER,
  published_version  TEXT,
  updated_at         INTEGER NOT NULL
);
