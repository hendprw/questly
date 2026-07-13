-- ════════════════════════════════════════════════════════════════════════
-- 004_world_expansion.sql — porting LENGKAP dunia dari Orion RPG (world-data.js
-- lama): biome, resource gathering, gemstone enchant, dan monster yang lebih
-- kaya (deskripsi + lokasi). Lihat db/seed-world.js untuk datanya.
-- ════════════════════════════════════════════════════════════════════════

PRAGMA foreign_keys = ON;

-- ── Biome / lokasi dunia (dulu cuma string bebas di Orion) ─────────────
CREATE TABLE IF NOT EXISTS biomes (
  code         TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  is_hidden    INTEGER NOT NULL DEFAULT 0,   -- 1 = area tersembunyi (perlu unlock)
  unlocked_by  TEXT                          -- kode item/quest yang membuka biome ini, NULL = selalu terbuka
);

-- ── Kolom tambahan di items untuk data resource dunia ───────────────────
-- weight     = berat per unit (dipakai sistem carry-capacity nanti)
-- locations  = JSON array nama biome tempat item ini bisa di-gather
-- crafting   = JSON {cost, materials:{code:qty}, levelRequirement?} kalau
--              item ini hasil olahan/crafting, NULL kalau resource mentah
-- metadata sudah ada dari 001_init.sql — dipakai untuk stats/effect_note/dll
ALTER TABLE items ADD COLUMN weight     INTEGER NOT NULL DEFAULT 1;
ALTER TABLE items ADD COLUMN locations  TEXT NOT NULL DEFAULT '[]';
ALTER TABLE items ADD COLUMN crafting   TEXT;

-- ── Gemstone enchanting (permata bisa dipasang ke weapon/armor) ─────────
CREATE TABLE IF NOT EXISTS gemstone_enchants (
  gem_code     TEXT NOT NULL,
  slot         TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  stats        TEXT NOT NULL DEFAULT '{}',
  PRIMARY KEY (gem_code, slot)
);

-- ── Kolom tambahan di monsters: deskripsi lore + lokasi + flag boss ─────
ALTER TABLE monsters ADD COLUMN description TEXT NOT NULL DEFAULT '';
ALTER TABLE monsters ADD COLUMN locations   TEXT NOT NULL DEFAULT '[]';
ALTER TABLE monsters ADD COLUMN is_boss     INTEGER NOT NULL DEFAULT 0;