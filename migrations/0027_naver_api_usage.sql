-- 네이버 API HUB 무료 한도(뉴스 월 775,000건 공유 / 검색어트렌드·쇼핑인사이트 각 월 50,000건)
-- 근접 여부를 어드민에서 바로 확인할 수 있도록 월별 호출 횟수를 집계한다.
CREATE TABLE naver_api_usage (
  year_month TEXT NOT NULL,   -- 'YYYY-MM'
  api_type TEXT NOT NULL,     -- 'news' | 'search_trend' | 'shopping_insight'
  call_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (year_month, api_type)
);
