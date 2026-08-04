-- LookbookAI — 크레딧 차감/지급 로그 테이블
-- 이미지 생성 1장당 90크레딧 차감 (1,800원 / 20원 = 90크레딧)
-- 관리자 수동 지급도 기록

CREATE TABLE IF NOT EXISTS credit_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'deduct',  -- 'deduct' | 'grant' | 'signup'
  amount      INTEGER NOT NULL,                -- 차감: 음수, 지급: 양수
  balance     INTEGER NOT NULL,                -- 변경 후 잔액
  reason      TEXT NOT NULL DEFAULT '',        -- 'image_generation' | 'admin_grant' | 'signup_bonus'
  ref_id      TEXT,                            -- 관련 job_id 또는 admin_id 등
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_credit_logs_user_id ON credit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_logs_created_at ON credit_logs(created_at);
