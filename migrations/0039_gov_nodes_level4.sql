-- ────────────────────────────────────────────────────
-- 지원사업 구조 모듈 빌더 — 3단계(대분류/중분류/소분류) → 4단계(대분류/중분류/
-- 소분류/소소분류) 확장.
--
-- gov_support_nodes.level CHECK가 1~3으로 고정돼 있어 SQLite 특성상(CHECK는
-- ALTER TABLE로 못 바꾼다) 테이블을 1~4로 다시 만들어 데이터를 그대로 옮긴다.
-- 기존 행은 전부 level 1~3 범위라 그대로 복사해도 제약 위반이 없다 — 실제로
-- "중분류를 한 단계 끼워넣는" 재구조화(기존 L2→L3, 기존 L3→L4로 밀어내리고 그
-- 사이에 새 L2 노드 삽입)는 이 마이그레이션이 하지 않는다. 그건 프로그램(yebi
-- 등)마다 "어디서 중분류를 나눌지"가 관리자 판단이 들어가는 데이터 이관이라
-- 별도 스크립트로 수행한다(SELF-NOTE: scripts/migrate-gov-nodes-level4-data와
-- 짝을 이룬다 — 이 SQL은 "4단계를 저장할 수 있게"만 바꾼다).
--
-- 레벨별 이름(대분류/중분류/소분류/소소분류)은 어드민이 프로그램별로 바꿀 수
-- 있어야 하므로(요청: "대분류, 중분류, 소분류, 소소분류는 어드민에서 관리자가
-- 이름과 함께 세팅") gov_support_config에 level1_label~level4_label 컬럼을
-- 추가한다 — 기본값은 지금까지 쓰던 이름 그대로.
-- ────────────────────────────────────────────────────

CREATE TABLE gov_support_nodes_new (
  id                TEXT PRIMARY KEY,
  program_id        TEXT NOT NULL,
  parent_id         TEXT,
  level             INTEGER NOT NULL CHECK (level BETWEEN 1 AND 4),
  sort_key          TEXT NOT NULL,
  expression_type   TEXT NOT NULL,
  title             TEXT,
  payload           TEXT NOT NULL DEFAULT '{}',
  binding           TEXT NOT NULL DEFAULT 'ai',
  binding_key       TEXT,
  fill_policy       TEXT NOT NULL DEFAULT 'aiFill',
  fixed_phrase      TEXT,
  page_share        REAL,
  repeat_config     TEXT,
  condition_config  TEXT,
  note              TEXT,
  target_chars      INTEGER,
  weight            INTEGER,
  status            TEXT NOT NULL DEFAULT 'draft',
  created_at        INTEGER NOT NULL,
  updated_at        INTEGER NOT NULL
);

INSERT INTO gov_support_nodes_new
  SELECT id, program_id, parent_id, level, sort_key, expression_type, title, payload,
         binding, binding_key, fill_policy, fixed_phrase, page_share, repeat_config,
         condition_config, note, target_chars, weight, status, created_at, updated_at
  FROM gov_support_nodes;

DROP TABLE gov_support_nodes;
ALTER TABLE gov_support_nodes_new RENAME TO gov_support_nodes;

CREATE INDEX IF NOT EXISTS idx_gsn_program ON gov_support_nodes(program_id, status);
CREATE INDEX IF NOT EXISTS idx_gsn_parent  ON gov_support_nodes(parent_id, sort_key);

ALTER TABLE gov_support_config ADD COLUMN level1_label TEXT NOT NULL DEFAULT '대분류';
ALTER TABLE gov_support_config ADD COLUMN level2_label TEXT NOT NULL DEFAULT '중분류';
ALTER TABLE gov_support_config ADD COLUMN level3_label TEXT NOT NULL DEFAULT '소분류';
ALTER TABLE gov_support_config ADD COLUMN level4_label TEXT NOT NULL DEFAULT '소소분류';
