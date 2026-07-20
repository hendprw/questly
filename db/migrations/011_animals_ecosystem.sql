-- 011_animals_ecosystem.sql
-- Tabel untuk menyimpan entitas hewan ternak dan hewan buruan liar

CREATE TABLE IF NOT EXISTS animals (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,       -- 'ternak' atau 'buruan'
  locations TEXT NOT NULL DEFAULT '[]',
  loot_table TEXT NOT NULL DEFAULT '[]'
);
