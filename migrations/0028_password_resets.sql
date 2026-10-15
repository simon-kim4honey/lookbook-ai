-- ────────────────────────────────────────────────────
-- 0028_password_resets.sql
-- 이메일 가입 사용자용 "비밀번호 찾기" — 재설정 토큰을 저장. 토큰은 1회용(used_at),
-- 30분 유효(expires_at). 만료된 토큰을 지우는 별도 배치는 없고, 조회 시점에
-- expires_at을 비교해 무효 처리한다(건수가 적어 정리 배치 없이도 문제 없음).
-- ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS password_resets (
  token      TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at    TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(user_id);
