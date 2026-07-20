/**
 * db/repo/shop.js
 * ---------------
 * Toko NPC rotasi — porting mekanik `.shop` dari Orion RPG
 * (utils/shop-manager.js + commands/rpg/shop.js) ke Questly.
 *
 * Beda utama dari Orion: state toko di sini DIPERSISTEN ke SQLite
 * (shop_listings + shop_meta), bukan disimpan di object in-memory —
 * jadi tidak ke-reset kalau bot restart, dan konsisten dengan prinsip
 * "state penting harus survive restart" yang sudah dipakai di cooldowns.js.
 */

// Rarity yang boleh muncul di toko rotasi — meniru NON_RARE_RARITIES Orion
// (yang mengecualikan rarity paling langka dari rotasi toko mekanik).
const ROTATABLE_RARITIES = ["common", "uncommon"];

// Setara STOCK_MULTIPLIERS di Orion: makin langka rarity-nya, makin
// sedikit stok yang di-generate per restock.
const STOCK_MULTIPLIERS = {
  common: { min: 20, max: 40 },
  uncommon: { min: 10, max: 20 },
  rare: { min: 3, max: 8 },
};

const PRICE_JITTER = 0.2; // harga di-roll ±20% dari buy_price dasar (setara value.min/max Orion)
const MIN_ITEMS = 5;
const MAX_ITEMS = 10;
const RESTOCK_COOLDOWN_SECONDS = 10 * 60; // 10 menit, sama seperti SHOP_COOLDOWN Orion

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function nowSec() {
  return Math.floor(Date.now() / 1000);
}

function getMeta(db) {
  db.prepare(`INSERT OR IGNORE INTO shop_meta (id, last_restock_at) VALUES (1, 0)`).run();
  return db.prepare(`SELECT * FROM shop_meta WHERE id = 1`).get();
}

/**
 * Regenerate seluruh isi toko: buang listing lama, pilih 5-10 item acak
 * dari katalog yang boleh dirotasi, lalu roll harga & stok baru.
 * Setara generateShop() di Orion.
 */
export function generateShop(db) {
  const placeholders = ROTATABLE_RARITIES.map(() => "?").join(",");
  const pool = db
    .prepare(
      `SELECT * FROM items WHERE buy_price IS NOT NULL AND rarity IN (${placeholders})`
    )
    .all(...ROTATABLE_RARITIES);

  const picked = shuffle(pool).slice(0, randomInt(MIN_ITEMS, Math.min(MAX_ITEMS, pool.length || MIN_ITEMS)));

  const apply = db.transaction(() => {
    db.prepare(`DELETE FROM shop_listings`).run();

    const insert = db.prepare(
      `INSERT INTO shop_listings (item_id, price, stock, restocked_at) VALUES (?, ?, ?, ?)`
    );

    const t = nowSec();
    for (const item of picked) {
      const min = Math.max(1, Math.floor(item.buy_price * (1 - PRICE_JITTER)));
      const max = Math.max(min, Math.ceil(item.buy_price * (1 + PRICE_JITTER)));
      const price = randomInt(min, max);

      const stockRange = STOCK_MULTIPLIERS[item.rarity] ?? STOCK_MULTIPLIERS.common;
      const stock = randomInt(stockRange.min, stockRange.max);

      insert.run(item.id, price, stock, t);
    }

    db.prepare(`UPDATE shop_meta SET last_restock_at = ? WHERE id = 1`).run(t);
  });

  apply();
}

/**
 * Ambil isi toko saat ini. Auto-restock kalau toko kosong DAN cooldown
 * sudah lewat — setara logika di getShopState() Orion.
 */
export function getShopState(db) {
  const meta = getMeta(db);
  let listings = db
    .prepare(
      `SELECT sl.id AS listing_id, sl.price, sl.stock, it.code, it.name, it.rarity, it.weight
         FROM shop_listings sl JOIN items it ON it.id = sl.item_id
        ORDER BY sl.price ASC`
    )
    .all();

  if (listings.length === 0 && nowSec() - meta.last_restock_at > RESTOCK_COOLDOWN_SECONDS) {
    generateShop(db);
    listings = db
      .prepare(
        `SELECT sl.id AS listing_id, sl.price, sl.stock, it.code, it.name, it.rarity, it.weight
           FROM shop_listings sl JOIN items it ON it.id = sl.item_id
          ORDER BY sl.price ASC`
      )
      .all();
  }

  const freshMeta = getMeta(db);
  const cooldownRemaining =
    listings.length === 0
      ? Math.max(0, RESTOCK_COOLDOWN_SECONDS - (nowSec() - freshMeta.last_restock_at))
      : 0;

  return { items: listings, lastRestockAt: freshMeta.last_restock_at, cooldownRemaining };
}

export function getShopListingByCode(db, code) {
  return db
    .prepare(
      `SELECT sl.id AS listing_id, sl.price, sl.stock, it.id AS item_id, it.code, it.name, it.rarity, it.weight
         FROM shop_listings sl JOIN items it ON it.id = sl.item_id
        WHERE it.code = ?`
    )
    .get(code);
}

/**
 * Kurangi stok listing setelah dibeli; hapus baris kalau stok habis.
 * Kalau toko jadi kosong total, mulai hitung cooldown restock dari sekarang.
 * Setara updateStock() di Orion.
 */
export function decrementStock(db, listingId, amount) {
  const apply = db.transaction(() => {
    db.prepare(`UPDATE shop_listings SET stock = stock - ? WHERE id = ?`).run(amount, listingId);
    db.prepare(`DELETE FROM shop_listings WHERE id = ? AND stock <= 0`).run(listingId);

    const remaining = db.prepare(`SELECT COUNT(*) AS n FROM shop_listings`).get().n;
    if (remaining === 0) {
      db.prepare(`UPDATE shop_meta SET last_restock_at = ? WHERE id = 1`).run(nowSec());
    }
  });
  apply();
}

// ── Kapasitas bawa barang (setara currentWeight/maxInventoryWeight Player Orion) ──

export function getCarryState(db, userId) {
  const weightRows = db.prepare(`
    SELECT SUM(inv.quantity * COALESCE(it.weight, 0)) as total_weight
    FROM inventory inv
    JOIN items it ON it.id = inv.item_id
    WHERE inv.user_id = ? AND inv.location = 'bag'
  `).get(userId);
  
  const current_weight = weightRows?.total_weight || 0;

  let max_carry_weight = 70; // Kapasitas dasar
  const equippedBag = db.prepare(`
      SELECT items.metadata FROM equipment 
      JOIN inventory ON equipment.inventory_id = inventory.id 
      JOIN items ON inventory.item_id = items.id 
      WHERE equipment.user_id = ? AND equipment.slot = 'bag'
  `).get(userId);

  if (equippedBag && equippedBag.metadata) {
      try {
          const meta = JSON.parse(equippedBag.metadata);
          if (meta.capacity_bonus) {
              max_carry_weight += meta.capacity_bonus;
          }
      } catch(e) {}
  }
  
  return { carry_weight: current_weight, max_carry_weight };
}

export function addCarryWeight(db, userId, delta) {
  const apply = db.transaction(() => {
    db.prepare(`UPDATE characters SET carry_weight = carry_weight + ? WHERE user_id = ?`).run(
      delta,
      userId
    );
  });
  apply();
}

/** Hitung harga jual berdasarkan supply & demand server */
export function getDynamicSellPrice(db, itemCode, baseSellPrice) {
    const record = db.prepare(`SELECT sold_count FROM shop_supply WHERE item_code = ?`).get(itemCode);
    const sold = record ? record.sold_count : 0;
    return Math.max(1, Math.floor(baseSellPrice * (500 / (500 + sold))));
}

/** Catat penjualan item ke server untuk menjatuhkan harganya */
export function recordItemSale(db, itemCode, quantity) {
    db.prepare(`
        INSERT INTO shop_supply (item_code, sold_count) 
        VALUES (?, ?) 
        ON CONFLICT(item_code) DO UPDATE SET sold_count = sold_count + excluded.sold_count, last_updated = strftime('%s','now')
    `).run(itemCode, quantity);
}