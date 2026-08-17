-- ────────────────────────────────────────────────────
-- 0016_users_referrer.sql
-- 회원가입 시 추천인(제휴사) 선택 저장 — BFM / 코오롱 FnC / 한섬
-- ────────────────────────────────────────────────────

ALTER TABLE users ADD COLUMN referrer TEXT; -- NULL | 'BFM' | '코오롱 FnC' | '한섬'

CREATE INDEX IF NOT EXISTS idx_users_referrer ON users(referrer);
