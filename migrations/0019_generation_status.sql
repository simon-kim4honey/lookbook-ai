-- 영상/이미지 생성 실패 감지 + 크레딧 환불 처리를 위한 상태 컬럼
-- 값: 'processing'(기본) | 'completed' | 'failed'
-- 영상은 요청 시점에 크레딧을 선차감하므로, 실패가 확인되면 이 컬럼을 'failed'로
-- 전환하면서 환불도 함께 처리한다(중복 환불 방지를 위해 상태 전환은 원자적 UPDATE로 수행).
ALTER TABLE generation_logs ADD COLUMN status TEXT NOT NULL DEFAULT 'processing';
