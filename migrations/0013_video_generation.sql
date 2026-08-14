-- ────────────────────────────────────────────────────
-- 0013_video_generation.sql
-- 생성내역에 영상(비디오) 결과도 함께 담기 위한 컬럼 추가
-- kind='image'(기본) | 'video' 로 구분, video_url은 video일 때만 채워짐
-- ────────────────────────────────────────────────────

ALTER TABLE generation_logs ADD COLUMN kind TEXT DEFAULT 'image';
ALTER TABLE generation_logs ADD COLUMN video_url TEXT;

CREATE INDEX IF NOT EXISTS idx_gen_logs_kind ON generation_logs(kind);
