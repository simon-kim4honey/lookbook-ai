-- LookbookAI — 커스텀 모델 / 배경 영구 저장
-- Genspark Hosted D1 (SQLite)

CREATE TABLE IF NOT EXISTS id_counter (
  id    INTEGER PRIMARY KEY CHECK (id = 1),
  value INTEGER NOT NULL DEFAULT 1000
);
INSERT OR IGNORE INTO id_counter (id, value) VALUES (1, 1000);

CREATE TABLE IF NOT EXISTS custom_models (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  desc_text   TEXT NOT NULL DEFAULT '',
  image_b64   TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS custom_bgs (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT '기타',
  bg_desc     TEXT NOT NULL DEFAULT '',
  image_b64   TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
