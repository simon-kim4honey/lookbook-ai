-- ────────────────────────────────────────────────────
-- 0043_workspace_stage_defs.sql
-- 워크스페이스 공정 단계를 코드에 박아두지 않고 DB로 옮긴다 — 관리자가 업종별로
-- 공정 단계를 직접 추가/삭제할 수 있게 하기 위함(0042에서는 의류/주얼리/가방/신발
-- 4개 업종의 단계가 src/index.tsx에 하드코딩돼 있었음).
-- sort_order로 보드 컬럼 순서를 정하고, 기존 발주(workspace_orders.stage)가 쓰던
-- key 값은 그대로 보존해 하위호환한다.
-- ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS workspace_stage_defs (
  id TEXT PRIMARY KEY,
  industry TEXT NOT NULL,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(industry, key)
);
CREATE INDEX IF NOT EXISTS idx_ws_stage_defs_industry ON workspace_stage_defs(industry, sort_order);

INSERT INTO workspace_stage_defs (id, industry, key, label, sort_order) VALUES
  (lower(hex(randomblob(16))), 'clothing', 'receipt', '접수', 1),
  (lower(hex(randomblob(16))), 'clothing', 'cutting', '재단', 2),
  (lower(hex(randomblob(16))), 'clothing', 'sewing', '봉제', 3),
  (lower(hex(randomblob(16))), 'clothing', 'inspection', '검단', 4),
  (lower(hex(randomblob(16))), 'clothing', 'packing', '포장', 5),
  (lower(hex(randomblob(16))), 'clothing', 'done', '완료', 6),
  (lower(hex(randomblob(16))), 'jewelry', 'receipt', '접수', 1),
  (lower(hex(randomblob(16))), 'jewelry', 'casting', '주물', 2),
  (lower(hex(randomblob(16))), 'jewelry', 'inbound', '입고', 3),
  (lower(hex(randomblob(16))), 'jewelry', 'plating', '도금', 4),
  (lower(hex(randomblob(16))), 'jewelry', 'shipping', '출고', 5),
  (lower(hex(randomblob(16))), 'jewelry', 'done', '완료', 6),
  (lower(hex(randomblob(16))), 'bag', 'receipt', '접수', 1),
  (lower(hex(randomblob(16))), 'bag', 'cutting', '재단', 2),
  (lower(hex(randomblob(16))), 'bag', 'sewing', '봉제', 3),
  (lower(hex(randomblob(16))), 'bag', 'hardware', '부속조립', 4),
  (lower(hex(randomblob(16))), 'bag', 'inspection', '검수', 5),
  (lower(hex(randomblob(16))), 'bag', 'done', '완료', 6),
  (lower(hex(randomblob(16))), 'shoe', 'receipt', '접수', 1),
  (lower(hex(randomblob(16))), 'shoe', 'upper', '갑피재단', 2),
  (lower(hex(randomblob(16))), 'shoe', 'stitching', '갑피봉제', 3),
  (lower(hex(randomblob(16))), 'shoe', 'assembly', '조립', 4),
  (lower(hex(randomblob(16))), 'shoe', 'inspection', '검수', 5),
  (lower(hex(randomblob(16))), 'shoe', 'done', '완료', 6);
