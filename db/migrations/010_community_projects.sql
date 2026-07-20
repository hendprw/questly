-- 010_community_projects.sql
-- Tabel untuk menyimpan progress proyek gotong royong dunia

CREATE TABLE IF NOT EXISTS community_projects (
  code TEXT PRIMARY KEY,           -- contoh: "project_celestia"
  name TEXT NOT NULL,              -- contoh: "Membangun Jembatan Celestia"
  required_item TEXT NOT NULL,     -- contoh: "omni_stone" (kode item)
  target_amount INTEGER NOT NULL,  -- contoh: 10000
  current_amount INTEGER NOT NULL DEFAULT 0,
  is_completed INTEGER NOT NULL DEFAULT 0
);
