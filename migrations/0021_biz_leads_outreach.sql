-- 사업자 리드 아웃리치(이메일 발송) 이력 추적
-- 중복 발송 방지 및 발송 현황 파악용
ALTER TABLE biz_leads ADD COLUMN outreach_sent_at TEXT;
ALTER TABLE biz_leads ADD COLUMN outreach_campaign TEXT;

CREATE INDEX IF NOT EXISTS idx_biz_leads_outreach_sent ON biz_leads(outreach_sent_at);
