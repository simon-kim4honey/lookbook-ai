-- ────────────────────────────────────────────────────
-- 패션 콘텐츠 다이제스트 (주간 RSS 수집 → AI 요약 → 카톡채널 발행용)
-- ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_digests (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  period        TEXT,                          -- "2026년 9월 3주차"
  status        TEXT DEFAULT 'draft',           -- draft | reviewed | sent
  summary       TEXT,                           -- 전체 요약 (카톡 메시지 본문 초안)
  keywords      TEXT,                           -- JSON 배열
  generated_at  TEXT DEFAULT (datetime('now')),
  reviewed_at   TEXT,
  sent_at       TEXT
);

CREATE TABLE IF NOT EXISTS digest_articles (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  digest_id      INTEGER NOT NULL REFERENCES content_digests(id),
  category       TEXT,       -- 트렌드 | 브랜드 | 유통 | 시장 | 글로벌
  title          TEXT,
  source         TEXT,
  url            TEXT,
  published_at   TEXT,
  summary        TEXT,       -- 2~3문장 요약
  importance     INTEGER,    -- 1~5
  excluded       INTEGER DEFAULT 0   -- 관리자가 검토 중 제외시킨 기사
);

CREATE INDEX IF NOT EXISTS idx_digest_articles_digest ON digest_articles(digest_id);
CREATE INDEX IF NOT EXISTS idx_content_digests_status ON content_digests(status);
