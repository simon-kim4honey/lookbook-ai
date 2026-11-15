-- ────────────────────────────────────────────────────
-- 0047_workspace_invoices.sql
-- 거래명세서 — "발주 기반으로 거래명세서를 만들고 납품 처리".
-- 여러 발주를 하나의 명세서로 묶을 수 있어 order_ids를 JSON 배열로 저장한다
-- (별도 조인 테이블 없이 단순하게). status: pending(승인대기) → unpaid(미결제) →
-- paid(결제) → tax_invoice_issued(세금계산서 발행 완료)
-- ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS workspace_invoices (
  id TEXT PRIMARY KEY,
  invoice_code TEXT NOT NULL,
  client_user_id TEXT REFERENCES users(id),
  order_ids_json TEXT NOT NULL,     -- JSON: ["orderId1", "orderId2", ...]
  total_amount INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ws_invoices_client ON workspace_invoices(client_user_id);
CREATE INDEX IF NOT EXISTS idx_ws_invoices_status ON workspace_invoices(status);
