-- ════════════════════════════════════════════════════════════════════════
-- 005_dynamic_shop.sql — porting mekanik toko NPC dari Orion RPG (bot lama)
--
-- Yang diporting dari utils/shop-manager.js + commands/rpg/shop.js Orion:
--  1. Toko ROTASI — isi acak tiap restock, bukan katalog statis.
--  2. Harga DINAMIS — di-roll ulang tiap restock (bukan buy_price tetap).
--  3. Stok TERBATAS per item, berkurang tiap dibeli.
--  4. Cooldown RESTOCK setelah toko kosong.
--  5. Cek KAPASITAS TAS (weight) sebelum transaksi berhasil.
--
-- Catatan: kolom `items.weight` TIDAK ditambahkan di sini — sudah ada
-- dari 004_world_expansion.sql (porting world-data.js Orion). Migration
-- ini cuma menambah apa yang belum ada: kapasitas bawa per karakter +
-- state toko rotasi.
--
-- Beda desain dari Orion: state toko Orion cuma di-memory proses Node
-- (hilang kalau restart). Di sini state toko dipersisten ke SQLite
-- (shop_listings + shop_meta) — konsisten dengan prinsip "semua state
-- penting harus survive restart" yang sudah dipakai cooldowns/transactions.
-- ════════════════════════════════════════════════════════════════════════

PRAGMA foreign_keys = ON;

-- ── Kapasitas bawa barang per karakter (setara currentWeight/maxInventoryWeight
--    milik Player Orion) ─────────────────────────────────────────────────
ALTER TABLE characters ADD COLUMN carry_weight     INTEGER NOT NULL DEFAULT 0;
ALTER TABLE characters ADD COLUMN max_carry_weight INTEGER NOT NULL DEFAULT 50;

-- ── Isi toko NPC saat ini (setara shopState.items Orion, tapi di DB) ──────
CREATE TABLE IF NOT EXISTS shop_listings (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id       INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  price         INTEGER NOT NULL,   -- hasil roll dinamis, BUKAN items.buy_price langsung
  stock         INTEGER NOT NULL,
  restocked_at  INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

-- ── Meta toko: kapan terakhir restock (setara shopState.lastRestockAt) ───
-- Single-row table (id selalu 1) — dipakai buat hitung cooldown restock.
CREATE TABLE IF NOT EXISTS shop_meta (
  id                INTEGER PRIMARY KEY CHECK (id = 1),
  last_restock_at   INTEGER NOT NULL DEFAULT 0
);
INSERT OR IGNORE INTO shop_meta (id, last_restock_at) VALUES (1, 0);