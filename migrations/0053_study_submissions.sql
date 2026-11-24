-- ────────────────────────────────────────────────────
-- 0053_study_submissions.sql
-- "정부지원사업 실습 교안" 인터랙티브 실습 페이지(/study, /study_admin) —
-- 오프라인 강의 중 수강생이 업로드한 미니 사업계획서 답안을 수업(강의실)
-- 단위로 모아보기 위한 테이블.
--
-- 개인정보 최소화: 실명·연락처는 수집하지 않는다. brand_alias는 학생이
-- 자유롭게 적는 브랜드명 칸일 뿐 실명 수집 필드가 아니다 — 강사가 오프라인
-- 강의 중 구두로 "임의의 브랜드명을 적어도 된다"고 안내하므로, 화면 문구로는
-- 별도 안내를 넣지 않는다(사용자 확정, 2026-11-24).
-- ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS study_classes (
  code        TEXT PRIMARY KEY,   -- 6자리 수업 코드(혼동 문자 0/O/1/I 제외) — 업로드·조회 접근 열쇠
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS study_submissions (
  id            TEXT PRIMARY KEY,   -- 클라이언트가 생성해 localStorage에 보관하는 제출 식별자(재업로드 시 같은 행을 갱신)
  class_code    TEXT NOT NULL REFERENCES study_classes(code) ON DELETE CASCADE,
  brand_alias   TEXT NOT NULL,      -- 학생이 적는 브랜드명 칸(실명 수집 안 함)
  answers_json  TEXT NOT NULL,      -- 미니 사업계획서 8칸 + 전체 실습 답안 JSON
  submitted_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_study_submissions_class ON study_submissions(class_code);
