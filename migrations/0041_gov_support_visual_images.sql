-- 2026-10-28: iconStats로 렌더되던 4개 시각화 슬롯(1-1 필요성/나.문제점/다.해결방안/
-- 3-2 사업화 전략)을 AtlasCloud가 생성한 인포그래픽 이미지로 바꾸면서, 그 base64
-- 이미지들을 담을 컬럼을 추가한다. process_image_b64(0040)와 같은 이유로 별도
-- 컬럼+전용 엔드포인트로 분리한다 — generated_content JSON에 직접 박아넣으면
-- 응답이 부풀어 "불러오는 중" 멈춤이 재발한다. 여러 슬롯을 한 컬럼에 담기 위해
-- {visualId: dataUri} JSON 맵으로 저장한다(컬럼 여러 개 대신).
ALTER TABLE gov_support_projects ADD COLUMN visual_images_b64 TEXT;
