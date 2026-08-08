-- 모델 자동 라벨링 컬럼 추가
ALTER TABLE custom_models ADD COLUMN gender TEXT NOT NULL DEFAULT '미분류';
ALTER TABLE custom_models ADD COLUMN age    TEXT NOT NULL DEFAULT '미분류';
ALTER TABLE custom_models ADD COLUMN mood   TEXT NOT NULL DEFAULT '미분류';

-- 배경 카테고리 컬럼 (이미 있으므로 기본값 업데이트 없이 스킵)
-- ALTER TABLE custom_bgs ADD COLUMN sub_category TEXT NOT NULL DEFAULT '';
