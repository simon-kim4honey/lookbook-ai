-- ────────────────────────────────────────────────────
-- 0054_study_submissions_simplify.sql
-- "정부지원사업 실습 교안" /study, /study_admin 설계 단순화 (사용자 확정,
-- 2026-11-24) — 총 참여자 10명 이하 소규모 사용을 전제로, 수업 코드/강의실
-- 구분 개념을 없애고 브랜드명으로만 구분한다. /study_admin은 고정 비밀번호로
-- 보호한다(src/study.ts의 STUDY_ADMIN_PASSWORD).
--
-- 브랜드명 중복은 지금 단계에서는 허용한다(규모가 커지면 "이미 사용 중인
-- 브랜드입니다" 같은 중복 방지를 별도 업그레이드로 추가 예정 — 지금은 범위 밖).
--
-- 기존 study_classes/study_submissions(0053)는 테스트 데이터만 있는 상태라
-- 재생성한다.
-- ────────────────────────────────────────────────────

DROP TABLE IF EXISTS study_submissions;
DROP TABLE IF EXISTS study_classes;

CREATE TABLE IF NOT EXISTS study_submissions (
  id            TEXT PRIMARY KEY,   -- 클라이언트가 생성해 localStorage에 보관하는 제출 식별자(재업로드 시 같은 행을 갱신)
  brand_alias   TEXT NOT NULL,      -- 학생이 적는 브랜드명 칸(실명 수집 안 함) — 구분/표시의 유일한 기준
  answers_json  TEXT NOT NULL,      -- 미니 사업계획서 8칸 + 전체 실습 답안 JSON
  submitted_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_study_submissions_brand ON study_submissions(brand_alias);
