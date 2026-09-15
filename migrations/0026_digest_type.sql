-- 다이제스트를 요일별로 분리 (월: news, 수: search_trend, 금: shopping_insight)
ALTER TABLE content_digests ADD COLUMN type TEXT NOT NULL DEFAULT 'news';
