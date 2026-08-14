-- ────────────────────────────────────────────────────
-- 0012_rename_toss_columns.sql
-- 결제 PG를 토스페이먼츠 → 나이스페이먼츠로 전환하며
-- payment_logs의 PG 종속적 컬럼명(toss_*)을 범용 이름으로 변경
-- ────────────────────────────────────────────────────

ALTER TABLE payment_logs RENAME COLUMN toss_method TO pg_method;
ALTER TABLE payment_logs RENAME COLUMN toss_raw    TO pg_raw;
