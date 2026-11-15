-- ────────────────────────────────────────────────────
-- 0045_workspace_order_details.sql
-- 발주 관리(이지룩 ADMIN "발주를 만들고 품목별 옵션과 결제 금액을 관리") —
-- 업종마다 옵션 항목이 달라(의류/가방/신발/주얼리) 고정 컬럼 대신 라벨+값 쌍의
-- JSON 배열로 저장해 품목마다 자유롭게 옵션을 지정할 수 있게 한다.
-- ────────────────────────────────────────────────────

ALTER TABLE workspace_orders ADD COLUMN options_json TEXT;        -- JSON: [{"label":"사이즈","value":"L"}, ...]
ALTER TABLE workspace_orders ADD COLUMN unit_price INTEGER;       -- 단가(원)
ALTER TABLE workspace_orders ADD COLUMN total_amount INTEGER;     -- 합계 금액(원) — 보통 수량*단가지만 수동 조정 가능
ALTER TABLE workspace_orders ADD COLUMN shipping_address TEXT;    -- 배송지
