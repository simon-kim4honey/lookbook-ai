-- ────────────────────────────────────────────────────
-- 0015_payment_logs_multi_pg.sql
-- 해외 결제(Stripe) 지원을 위해 payment_logs에 PG/통화 구분 컬럼 추가
-- 기존 나이스페이먼츠 행은 전부 pg_provider='nicepay', currency='KRW'로 채움
-- ────────────────────────────────────────────────────

ALTER TABLE payment_logs ADD COLUMN pg_provider TEXT NOT NULL DEFAULT 'nicepay'; -- 'nicepay' | 'stripe'
ALTER TABLE payment_logs ADD COLUMN currency    TEXT NOT NULL DEFAULT 'KRW';     -- 'KRW' | 'USD' | 'JPY'

CREATE INDEX IF NOT EXISTS idx_payment_logs_pg_provider ON payment_logs(pg_provider);
