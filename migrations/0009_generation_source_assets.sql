-- 공유 페이지에서 원본 의상/모델/배경을 함께 보여주기 위해
-- 생성에 사용된 커스텀 모델/배경 ID를 생성 내역에 함께 저장
ALTER TABLE generation_logs ADD COLUMN model_id TEXT;
ALTER TABLE generation_logs ADD COLUMN bg_id TEXT;
