-- ────────────────────────────────────────────────────
-- 0044_workspace_inquiries.sql
-- 이지룩 ADMIN/USER 연결 1단계: "생산 문의" 루프.
-- PDF 흐름(고객사 문의 → 운영팀 상담 → 발주 생성 → WORKS 공정 → 납품) 중
-- 고객사 ↔ 운영팀을 잇는 접수 단계. 고객사 계정은 기존 EZlook 로그인(users
-- 테이블)을 그대로 재사용한다 — 별도 고객사 계정 체계를 만들지 않는다.
-- ────────────────────────────────────────────────────

-- 어떤 발주/제품이 어느(로그인) 고객 소유인지 — USER 포털이 "내 발주"를
-- 필터링하는 기준. 기존 client_name(자유 텍스트)과 별개로 실제 로그인 계정과
-- 연결한다.
ALTER TABLE workspace_products ADD COLUMN client_user_id TEXT REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_ws_products_client_user ON workspace_products(client_user_id);

-- status: new(신규) → in_discussion(상담 중) → done(발주로 전환 완료)
CREATE TABLE IF NOT EXISTS workspace_inquiries (
  id TEXT PRIMARY KEY,
  client_user_id TEXT NOT NULL REFERENCES users(id),
  industry TEXT NOT NULL DEFAULT 'clothing',
  title TEXT NOT NULL,
  design_note TEXT,
  desired_qty INTEGER,
  desired_price INTEGER,
  status TEXT NOT NULL DEFAULT 'new',
  admin_note TEXT,
  converted_order_id TEXT REFERENCES workspace_orders(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ws_inquiries_client ON workspace_inquiries(client_user_id);
CREATE INDEX IF NOT EXISTS idx_ws_inquiries_status ON workspace_inquiries(status);
