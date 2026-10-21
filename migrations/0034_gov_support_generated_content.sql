-- ────────────────────────────────────────────────────
-- 지원사업 도우미 — AI 섹션 초안 생성 결과(SectionOutput 배열 + 재무/경쟁사/공정도 등)를
-- 프로젝트에 함께 저장한다. 재생성 시 덮어쓴다(버전 히스토리는 다음 단계).
-- ────────────────────────────────────────────────────
ALTER TABLE gov_support_projects ADD COLUMN generated_content TEXT;
ALTER TABLE gov_support_projects ADD COLUMN generated_at TEXT;
