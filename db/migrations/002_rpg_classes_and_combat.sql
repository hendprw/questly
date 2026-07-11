-- ════════════════════════════════════════════════════════════════════════
-- 002_rpg_classes_and_combat.sql — porting sistem class/job RPG & combat
-- dasar dari Orion RPG (bot lama).
--
-- Catatan penting: `jobs` (tabel lama) tetap dipakai untuk pekerjaan
-- EKONOMI (!work, !hire — cari cash). Class RPG di sini SENGAJA dibuat
-- tabel terpisah (`classes`) supaya tidak bentrok konsep dengan "job"
-- yang sudah ada — di Orion dua hal ini juga sebenarnya konsep berbeda
-- (job = kelas RPG, "kerja" = command work/mining/fishing terpisah).
-- ════════════════════════════════════════════════════════════════════════

PRAGMA foreign_keys = ON;

-- ── Stat tempur di karakter (belum ada di skema awal) ──────────────────
ALTER TABLE characters ADD COLUMN attack  INTEGER NOT NULL DEFAULT 10;
ALTER TABLE characters ADD COLUMN defense INTEGER NOT NULL DEFAULT 5;
ALTER TABLE characters ADD COLUMN speed   INTEGER NOT NULL DEFAULT 5;

-- ── Rank/gelar (dihitung dari level, tapi disimpan biar gampang query &
--    dipakai buat deteksi "baru saja naik rank" tanpa hitung ulang tiap saat)
ALTER TABLE leveling ADD COLUMN rank TEXT NOT NULL DEFAULT 'Wanderer';

-- ── Class RPG (dulu disebut "job" di Orion: Pejuang, Penyihir, dst) ────
-- base_bonus  = stat instan saat memilih class pertama kali (JSON)
-- stat_growth = tambahan stat per level naik (JSON)
-- skill_tree  = { "10": "heavy_strike", "20": "taunt" } skill yang otomatis
--               dipelajari di level tertentu (JSON, key level sebagai string)
CREATE TABLE IF NOT EXISTS classes (
  code         TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  base_bonus   TEXT NOT NULL DEFAULT '{}',
  stat_growth  TEXT NOT NULL DEFAULT '{}',
  skill_tree   TEXT NOT NULL DEFAULT '{}'
);

-- ── Skill (job skill maupun skill umum lintas class) ───────────────────
CREATE TABLE IF NOT EXISTS skills (
  code              TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  description       TEXT NOT NULL DEFAULT '',
  class_code        TEXT REFERENCES classes(code),   -- NULL = skill umum, tidak terikat class
  level_requirement INTEGER NOT NULL DEFAULT 1,
  mana_cost         INTEGER NOT NULL DEFAULT 0,
  cooldown_seconds  INTEGER NOT NULL DEFAULT 0,
  effect            TEXT NOT NULL DEFAULT '{}'        -- JSON: {type, power, ...} — dibaca combat engine
);

CREATE TABLE IF NOT EXISTS user_skills (
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_code  TEXT NOT NULL REFERENCES skills(code),
  learned_at  INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  PRIMARY KEY (user_id, skill_code)
);

-- ── Katalog monster untuk !hunt / (nanti) !dungeon ─────────────────────
CREATE TABLE IF NOT EXISTS monsters (
  code        TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  min_level   INTEGER NOT NULL DEFAULT 1,
  max_level   INTEGER NOT NULL DEFAULT 999,
  hp          INTEGER NOT NULL DEFAULT 30,
  attack      INTEGER NOT NULL DEFAULT 5,
  defense     INTEGER NOT NULL DEFAULT 2,
  xp_reward   INTEGER NOT NULL DEFAULT 10,
  cash_min    INTEGER NOT NULL DEFAULT 20,
  cash_max    INTEGER NOT NULL DEFAULT 80,
  loot_table  TEXT NOT NULL DEFAULT '[]'   -- JSON: [{item_code, chance, qty_min, qty_max}]
);
CREATE INDEX IF NOT EXISTS idx_monsters_level ON monsters(min_level, max_level);