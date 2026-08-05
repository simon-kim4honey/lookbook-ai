-- generation_logs 개선: 순번(seq_no), 이미지 URL 저장, 만료일 추가
ALTER TABLE generation_logs ADD COLUMN seq_no INTEGER;
ALTER TABLE generation_logs ADD COLUMN image_urls TEXT;
ALTER TABLE generation_logs ADD COLUMN expires_at DATETIME;

-- 기존 레코드 seq_no 채번 (user별 created_at 순)
-- SQLite는 window function 미지원이므로 트리거 방식 대신 앱단에서 처리

-- 기존 레코드에 expires_at 14일 세팅
UPDATE generation_logs SET expires_at = datetime(created_at, '+14 days') WHERE expires_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_gen_logs_expires_at ON generation_logs(expires_at);
