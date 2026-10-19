-- ────────────────────────────────────────────────────
-- 0029_trend_weekly_subscriptions.sql
-- 주간 트렌드 분석 — 크레딧 기반 구독(현금 정기결제 아님) + 카카오 알림톡 수신 설정
-- 콘텐츠 자체(기사/검색어트렌드/쇼핑인사이트)는 기존 content_digests/digest_articles/
-- digest_trends 테이블(0024_content_digests.sql, 0025_digest_trends.sql,
-- 0026_digest_type.sql)을 그대로 재사용한다 — 여기서는 "누가 구독 중인지"와
-- "그 사람에게 카톡을 보냈는지"만 추가로 기록한다.
-- ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS trend_subscriptions (
  user_id         TEXT PRIMARY KEY,
  status          TEXT NOT NULL DEFAULT 'trial', -- 'trial' | 'active' | 'expired' | 'canceled'
  plan            TEXT,                           -- 'monthly' | 'annual' (status='trial'일 때는 NULL)
  trial_ends_at   TEXT,                           -- 무료체험 종료 시각(status='trial'일 때만)
  next_billing_at TEXT,                           -- 다음 크레딧 차감 예정일(status='active'일 때만)
  kakao_phone     TEXT,                           -- 알림톡 수신용 전화번호(선택, 숫자만 저장)
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 다이제스트별 카톡 발송 중복 방지 + 발송 이력
CREATE TABLE IF NOT EXISTS trend_kakao_sends (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  digest_id   INTEGER NOT NULL REFERENCES content_digests(id),
  user_id     TEXT NOT NULL,
  phone       TEXT NOT NULL,
  status      TEXT NOT NULL,     -- 'sent' | 'failed'
  error       TEXT,
  sent_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_trend_kakao_sends_digest_user ON trend_kakao_sends(digest_id, user_id);
