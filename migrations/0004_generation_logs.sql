-- 이미지 생성 내역 테이블 (크레딧 차감과 별도로 생성 이벤트 기록)
CREATE TABLE IF NOT EXISTS generation_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL,
  job_id      TEXT,
  image_count INTEGER DEFAULT 1,
  model_name  TEXT,
  bg_name     TEXT,
  ratio       TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gen_logs_user_id ON generation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_gen_logs_created_at ON generation_logs(created_at);
