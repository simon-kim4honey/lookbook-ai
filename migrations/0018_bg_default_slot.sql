-- 배경 선택 그리드 "기본 슬롯" 기능
-- 관리자가 지정한 배경 하나를 셔플에서 제외하고 그리드 맨 앞에 고정 노출하기 위한 플래그.
-- 사용자에게는 일반 배경 카드와 동일하게 표시되며 별도 표기는 없음(프론트에서만 정렬에 사용).
ALTER TABLE custom_bgs ADD COLUMN is_default INTEGER NOT NULL DEFAULT 0;
