-- 마케팅 수신 동의 컬럼 추가
-- 0: 미동의(기본), 1: 동의
ALTER TABLE users ADD COLUMN agree_marketing INTEGER NOT NULL DEFAULT 0;
