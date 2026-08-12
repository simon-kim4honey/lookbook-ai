-- 배경 프리셋의 "생성용(AI 전달용)" 이미지를 전시용 이미지와 분리 저장하기 위한 컬럼
-- 값이 없으면(NULL) 기존처럼 image_b64(전시용 원본)를 그대로 생성에 사용
-- 값이 있으면 이 얼굴-마스킹 버전을 AtlasCloud 생성 요청에 사용 (사용자 화면 썸네일은 계속 원본 표시)
ALTER TABLE custom_bgs ADD COLUMN gen_image_b64 TEXT;
