-- 검색어트렌드/쇼핑인사이트는 매주 생성 시점에만 네이버 API를 호출해 그 순간의
-- change_pct 한 값만 저장했다 — 그래서 새로 추적을 시작한 키워드는 과거 몇 주치
-- 데이터가 우리 DB에 없어 4주 그래프가 비어 보였다. 네이버 데이터랩 API는 한 번의
-- 요청으로 과거 여러 주를 함께 돌려주므로, 생성 시점에 그 응답에서 최근 4주치
-- 주간 등락률을 함께 뽑아 JSON으로 저장해둔다(history_json). 과거(이 컬럼이 없던
-- 시절) 생성된 행은 NULL — 조회 시 기존 방식(여러 주의 digest를 모아 비교)으로 폴백.
ALTER TABLE digest_trends ADD COLUMN history_json TEXT;
