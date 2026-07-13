-- ════════════════════════════════════════════════════════════════════════
-- 006_player_market.sql — porting `.market` (player-to-player marketplace)
-- dari Orion RPG (database/models/MarketListing.js + MarketDiscount.js +
-- commands/rpg/market.js). Lihat db/repo/market.js untuk logikanya.
--
-- BEDA DARI ORION (disengaja, lihat komentar di db/repo/market.js):
--   1. seller/created_by disimpan sebagai FK user_id (bukan JID mentah)
--      supaya konsisten dengan tabel lain, tapi item_code/item_name/
--      seller_name tetap di-snapshot ke listing (kalau item dihapus dari
--      katalog atau user ganti display_name, listing lama tidak rusak).
--   2. Tidak ada mongoose-sequence — `id` AUTOINCREMENT biasa sudah cukup
--      dan tetap tampil ke user sebagai "ID Listing" persis seperti Orion.
-- ════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS market_listings (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  seller_user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_name     TEXT NOT NULL,            -- snapshot nama penjual saat listing dibuat
  item_id         INTEGER NOT NULL REFERENCES items(id),
  item_code       TEXT NOT NULL,            -- snapshot kode item
  item_name       TEXT NOT NULL,            -- snapshot nama item
  quantity        INTEGER NOT NULL,
  price_per_unit  INTEGER NOT NULL,
  total_price     INTEGER NOT NULL,
  note            TEXT,
  status          TEXT NOT NULL DEFAULT 'active',  -- active | sold | expired | cancelled
  created_at      INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  expires_at      INTEGER NOT NULL,
  CHECK (quantity > 0 AND price_per_unit > 0 AND total_price >= 0)
);
CREATE INDEX IF NOT EXISTS idx_market_listings_status   ON market_listings(status);
CREATE INDEX IF NOT EXISTS idx_market_listings_seller   ON market_listings(seller_user_id);
CREATE INDEX IF NOT EXISTS idx_market_listings_itemname ON market_listings(item_name);
CREATE INDEX IF NOT EXISTS idx_market_listings_expires  ON market_listings(status, expires_at);

-- Event diskon pasar global (dikelola owner lewat !marketdiscount) — setara
-- MarketDiscount Orion. Hanya 1 yang boleh 'active' dalam satu waktu.
CREATE TABLE IF NOT EXISTS market_discounts (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL,
  percentage   INTEGER NOT NULL,
  status       TEXT NOT NULL DEFAULT 'active',   -- active | inactive
  created_by   INTEGER REFERENCES users(id),
  created_at   INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  expires_at   INTEGER NOT NULL,
  CHECK (percentage > 0 AND percentage <= 90)
);
CREATE INDEX IF NOT EXISTS idx_market_discounts_status ON market_discounts(status);