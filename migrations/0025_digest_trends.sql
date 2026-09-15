-- 콘텐츠 다이제스트에 네이버 검색어트렌드/쇼핑인사이트 데이터 추가
CREATE TABLE digest_trends (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  digest_id INTEGER NOT NULL REFERENCES content_digests(id),
  type TEXT NOT NULL CHECK(type IN ('search_trend','shopping_insight')),
  label TEXT NOT NULL,
  change_pct REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_digest_trends_digest_id ON digest_trends(digest_id);
