-- ────────────────────────────────────────────────────
-- 의류·패션·잡화 통신판매업 사업자 리드 (구 Genspark 샌드박스 프로젝트 이관)
-- 공정거래위원회 공공데이터(통신판매업 신고) + 도메인 유효성 검증 + 홈페이지 크롤링(이메일/전화/카카오채널/인스타그램) 결과
-- ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS biz_leads (
  id            INTEGER PRIMARY KEY,
  bzmnNm        TEXT,
  codeName      TEXT,
  status        TEXT,
  inst          TEXT,
  region        TEXT,
  ceo           TEXT,
  sn            TEXT,
  brno          TEXT,
  declDate      TEXT,
  method        TEXT,
  domain        TEXT,
  addr          TEXT,
  tel           TEXT,
  email         TEXT,
  server        TEXT,
  codeRaw       TEXT,
  domain_clean  TEXT,
  is_valid      INTEGER DEFAULT -1,
  valid_reason  TEXT,
  crawled_email TEXT,
  crawled_tel   TEXT,
  crawled_kakao TEXT,
  crawled_insta TEXT,
  crawl_status  TEXT
);

CREATE INDEX IF NOT EXISTS idx_biz_leads_region ON biz_leads(region);
CREATE INDEX IF NOT EXISTS idx_biz_leads_status ON biz_leads(status);
CREATE INDEX IF NOT EXISTS idx_biz_leads_valid ON biz_leads(is_valid);
CREATE INDEX IF NOT EXISTS idx_biz_leads_domain ON biz_leads(domain_clean);
CREATE INDEX IF NOT EXISTS idx_biz_leads_crawl_status ON biz_leads(crawl_status);
