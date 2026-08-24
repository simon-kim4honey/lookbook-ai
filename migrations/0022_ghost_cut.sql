-- ────────────────────────────────────────────────────
-- 고스트컷(Ghost Mannequin) 기능 — 카테고리별 관리자 샘플 이미지
-- category는 코드(src/index.tsx의 GHOSTCUT_CATEGORIES)에 정의된 고정 29종 슬러그
-- ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ghost_cut_samples (
  category    TEXT PRIMARY KEY,
  group_name  TEXT NOT NULL,
  label_ko    TEXT NOT NULL,
  image_b64   TEXT NOT NULL,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
