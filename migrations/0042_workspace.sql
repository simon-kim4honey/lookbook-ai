-- ────────────────────────────────────────────────────
-- 0042_workspace.sql
-- 이지룩 워크스페이스(내부 제조팀용 현장 워크스페이스, "이지룩 WORKS" 1차 구현).
-- 일반 고객사(모델컷/누끼컷 생성 사용자)와는 무관한 내부 전용 기능으로,
-- /workspace 라우트는 기존 /admin02와 동일한 ADMIN_PASSWORD(X-Admin-Password)로 보호된다.
--
-- stage 값(발주 공정 단계): receipt(접수) → casting(주물) → inbound(입고) →
-- plating(도금) → shipping(출고) → done(완료)
-- ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS workspace_products (
  id TEXT PRIMARY KEY,
  product_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  client_name TEXT,
  category TEXT,
  is_sample INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS workspace_orders (
  id TEXT PRIMARY KEY,
  order_code TEXT NOT NULL,
  product_id TEXT NOT NULL REFERENCES workspace_products(id),
  factory_name TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  stage TEXT NOT NULL DEFAULT 'receipt',
  assigned_team TEXT,
  expected_complete_at TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ws_orders_stage ON workspace_orders(stage);
CREATE INDEX IF NOT EXISTS idx_ws_orders_product ON workspace_orders(product_id);

CREATE TABLE IF NOT EXISTS workspace_inbound_logs (
  id TEXT PRIMARY KEY,
  product_id TEXT REFERENCES workspace_products(id),
  order_id TEXT REFERENCES workspace_orders(id),
  factory_name TEXT,
  qty_in INTEGER NOT NULL DEFAULT 0,
  qty_defect INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  source TEXT NOT NULL DEFAULT 'manual',   -- manual | ai_chat
  raw_input TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ws_inbound_product ON workspace_inbound_logs(product_id);

CREATE TABLE IF NOT EXISTS workspace_product_history (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES workspace_products(id),
  type TEXT NOT NULL,   -- issue | resolution | caution | memo | stock
  content TEXT NOT NULL,
  resolved INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ws_history_product ON workspace_product_history(product_id);

-- AI 대화형 입력 로그. status: pending(실행 전 확인 대기) | confirmed | cancelled | answered(조회성 응답, 실행 없음)
CREATE TABLE IF NOT EXISTS workspace_chat_messages (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL,        -- user | assistant
  content TEXT NOT NULL,
  action_json TEXT,
  status TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
