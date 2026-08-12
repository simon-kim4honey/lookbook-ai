-- 재다운로드 시 크레딧 재차감 방지를 위한 다운로드 이력 컬럼
-- 하나의 job이 여러 장의 이미지를 포함할 수 있어 job 단위가 아닌
-- image_urls 배열 내 인덱스 단위로 다운로드 여부를 기록한다 (JSON 배열, 예: "[0,2]")
ALTER TABLE generation_logs ADD COLUMN downloaded_indices TEXT;
