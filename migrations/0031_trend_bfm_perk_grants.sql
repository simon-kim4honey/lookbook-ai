-- ────────────────────────────────────────────────────
-- BFM회원 결제 시 자동 지급되는 콘텐츠 다이제스트 무료기간 혜택(grantBfmTrendPerkIfEligible)이
-- 어느 결제(order_id)로 trend_subscriptions의 어떤 필드를 얼마나 늘렸는지 기록해둔다.
-- 환불 시(revertBfmTrendPerkIfAny) 이 기록을 보고 혜택을 되돌릴 수 있게 하기 위함 —
-- 이게 없으면 결제가 취소돼도 이미 지급된 무료기간은 그대로 남는다.
-- ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trend_bfm_perk_grants (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id      TEXT NOT NULL,          -- payment_logs.order_id — 환불 통보 시 이 값으로 조회
  user_id       TEXT NOT NULL,
  field         TEXT NOT NULL,          -- 'trial_ends_at' | 'next_billing_at' — 어느 필드를 늘렸는지
  prev_value    TEXT,                   -- 지급 전 값 (신규 trend_subscriptions 행 생성이었다면 NULL)
  new_value     TEXT NOT NULL,          -- 지급 후 값
  reverted_at   TEXT,                   -- 환불로 되돌려진 시각 (NULL이면 아직 유효한 혜택)
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_trend_bfm_perk_grants_order ON trend_bfm_perk_grants(order_id);
