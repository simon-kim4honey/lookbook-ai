-- ────────────────────────────────────────────────────
-- 0046_workspace_design_cost.sql
-- 디자인 DB — "디자인 DB에 원가와 공급 공장까지 기록". 디자인은 곧 workspace_products
-- 레코드이므로(발주 생성 시 재사용) 별도 테이블 대신 원가/공급공장 컬럼만 추가한다.
-- ────────────────────────────────────────────────────

ALTER TABLE workspace_products ADD COLUMN cost_note TEXT;        -- 원가 정보(재질/단가 등 자유 기술)
ALTER TABLE workspace_products ADD COLUMN supply_factory TEXT;   -- 공급 공장
