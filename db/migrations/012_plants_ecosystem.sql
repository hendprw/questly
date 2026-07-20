-- 012_plants_ecosystem.sql
-- Tabel untuk menyimpan entitas tumbuhan (farmable dan wild foraging)

CREATE TABLE IF NOT EXISTS plants (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,       -- 'farmable' atau 'wild'
  locations TEXT NOT NULL DEFAULT '[]', -- Habitat biome (untuk wild)
  harvest_time INTEGER DEFAULT 0, -- Waktu tumbuh (menit) untuk farmable
  loot_table TEXT NOT NULL DEFAULT '[]' -- Hasil panen
);
