-- 브랜드 영업 리드(Lead) 파이프라인: 수집 → 분류 → 분석 → 아웃리치 초안
-- 1단계 범위: 공개 브랜드 디렉토리/수동 CSV 수집 + AI 분석 + 초안 생성(발송은 수동)

CREATE TABLE IF NOT EXISTS lead_platforms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  country TEXT NOT NULL,                       -- 'KR' | 'US' | 'JP'
  code TEXT NOT NULL UNIQUE,                    -- 'musinsa' | '29cm' | 'brandi' | ...
  name TEXT NOT NULL,
  directory_url TEXT,                           -- 공개 브랜드 디렉토리 URL (선택)
  list_selector TEXT,                           -- 브랜드 항목 컨테이너 CSS 셀렉터
  name_selector TEXT,                           -- 항목 내 브랜드명 셀렉터
  link_selector TEXT,                           -- 항목 내 링크(a[href]) 셀렉터
  category_selector TEXT,                       -- 항목 내 카테고리 텍스트 셀렉터
  is_scrapable INTEGER NOT NULL DEFAULT 0,      -- 관리자가 약관/robots.txt 확인 후 수동으로 1로 전환
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS brands (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform_id INTEGER NOT NULL REFERENCES lead_platforms(id),
  country TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  brand_url TEXT,
  contact_email TEXT,                           -- 공개된 제휴문의 이메일 등, 있는 경우에만 수동 입력
  source TEXT NOT NULL DEFAULT 'manual',        -- 'manual_csv' | 'scrape' | 'manual'
  status TEXT NOT NULL DEFAULT 'new',           -- new | analyzed | drafted | reviewed | contacted | won | skipped
  collected_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(platform_id, name)
);

CREATE TABLE IF NOT EXISTS brand_analysis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brand_id INTEGER NOT NULL REFERENCES brands(id),
  style_tags TEXT,                              -- JSON 배열 문자열
  target_customer TEXT,
  price_tier TEXT,                              -- budget | mid | premium | luxury
  lookbook_need_score INTEGER NOT NULL DEFAULT 0,   -- 0-100
  priority_score INTEGER NOT NULL DEFAULT 0,        -- 0-100 (종합 영업 우선순위)
  ai_summary TEXT,
  analysis_method TEXT NOT NULL DEFAULT 'heuristic', -- heuristic | claude
  analyzed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS outreach_drafts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brand_id INTEGER NOT NULL REFERENCES brands(id),
  language TEXT NOT NULL,                       -- ko | en | ja
  channel TEXT NOT NULL DEFAULT 'email',
  subject TEXT,
  body TEXT NOT NULL,
  generation_method TEXT NOT NULL DEFAULT 'template', -- template | claude
  status TEXT NOT NULL DEFAULT 'draft',          -- draft | reviewed | sent | skipped
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_at TEXT,
  sent_at TEXT
);

CREATE TABLE IF NOT EXISTS collection_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform_id INTEGER REFERENCES lead_platforms(id),
  method TEXT NOT NULL,                          -- csv | scrape
  status TEXT NOT NULL DEFAULT 'running',        -- running | success | failed
  collected_count INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  finished_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_brands_platform ON brands(platform_id);
CREATE INDEX IF NOT EXISTS idx_brands_status ON brands(status);
CREATE INDEX IF NOT EXISTS idx_brands_country ON brands(country);
CREATE INDEX IF NOT EXISTS idx_analysis_brand ON brand_analysis(brand_id);
CREATE INDEX IF NOT EXISTS idx_drafts_brand ON outreach_drafts(brand_id);
CREATE INDEX IF NOT EXISTS idx_drafts_status ON outreach_drafts(status);

-- 기본 플랫폼 설정 시드 (브랜드 데이터는 시드하지 않음 — 관리자가 CSV 업로드 또는 검증된 셀렉터로 수집)
INSERT OR IGNORE INTO lead_platforms (country, code, name, is_scrapable, notes) VALUES
  ('KR', 'musinsa', '무신사', 0, '수집 전 이용약관/robots.txt 확인 필요 — is_scrapable=1로 전환 전 셀렉터 검증 필수'),
  ('KR', '29cm',    '29CM',   0, '수집 전 이용약관/robots.txt 확인 필요'),
  ('KR', 'brandi',  '브랜디',  0, '수집 전 이용약관/robots.txt 확인 필요'),
  ('US', 'faire',        'Faire (B2B 도매 마켓플레이스)', 0, '수집 전 이용약관/robots.txt 확인 필요'),
  ('US', 'shopify_store', 'Shopify 개별 브랜드몰',        0, '플랫폼이 아닌 개별몰 — CSV 수동 등록 권장'),
  ('JP', 'zozotown',      'ZOZOTOWN',      0, '수집 전 이용약관/robots.txt 확인 필요'),
  ('JP', 'rakuten_fashion','楽天ファッション', 0, '수집 전 이용약관/robots.txt 확인 필요');
