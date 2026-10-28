-- 2026-10-28: 공정 흐름도 이미지를 base64로 변환해 generated_content JSON 안에
-- data URI 그대로 박아넣었더니(2026-10-26 핫링크 깨짐 수정), 이미지 하나가
-- 600KB대라 결과 페이지 JSON 응답 전체가 700KB 가까이 부풀어 "불러오는 중"에서
-- 멈추는 사례가 실사용자 리포트로 확인됨. 이미지를 별도 컬럼으로 분리해 전용
-- 엔드포인트(/api/gov-support/projects/:id/process-image)로만 서빙하고,
-- generated_content.processImageUrl에는 그 가벼운 경로만 남긴다.
ALTER TABLE gov_support_projects ADD COLUMN process_image_b64 TEXT;
