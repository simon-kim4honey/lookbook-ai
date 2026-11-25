-- ────────────────────────────────────────────────────
-- 0055_study_submissions_pin.sql
-- 브랜드명 중복을 허용하는 설계라(0054 참고), 브랜드명만으로 다른 기기에서
-- 이전 제출물을 불러오면 같은 이름을 쓴 다른 학생의 답안을 불러올 수 있다.
-- 학생이 직접 정하는 4자리 숫자(pin)를 브랜드명과 함께 입력해야 불러올 수
-- 있도록 구분 키를 하나 더 추가한다.
-- ────────────────────────────────────────────────────

ALTER TABLE study_submissions ADD COLUMN pin TEXT;
CREATE INDEX IF NOT EXISTS idx_study_submissions_brand_pin ON study_submissions(brand_alias, pin);
