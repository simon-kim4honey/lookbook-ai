-- ────────────────────────────────────────────────────
-- 0014_users_locale.sql
-- 글로벌 로컬라이제이션 — 회원별 언어/국가/통화 선호 저장
-- ────────────────────────────────────────────────────

ALTER TABLE users ADD COLUMN locale TEXT;     -- 'ko' | 'en' | 'ja' (NULL이면 접속 국가로 자동 감지)
ALTER TABLE users ADD COLUMN country TEXT;    -- 마지막으로 감지/선택된 국가 코드 (ISO 3166-1 alpha-2)
ALTER TABLE users ADD COLUMN currency TEXT;   -- 'KRW' | 'USD' | 'JPY' 등 — 결제 시 사용할 통화

CREATE INDEX IF NOT EXISTS idx_users_locale ON users(locale);
