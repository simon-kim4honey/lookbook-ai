-- ────────────────────────────────────────────────────
-- 사업자 리드 메일 발송(DirectSend) 배치 추적
-- 이미 뽑아준 리드를 다음 요청에서 다시 뽑지 않기 위한 컬럼
-- ────────────────────────────────────────────────────
ALTER TABLE biz_leads ADD COLUMN mail_sent_at TEXT;
ALTER TABLE biz_leads ADD COLUMN mail_batch INTEGER;

CREATE INDEX IF NOT EXISTS idx_biz_leads_mail_batch ON biz_leads(mail_batch);
