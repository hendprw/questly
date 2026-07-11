/**
 * db/repo/items.js
 * ----------------
 * Katalog item (master data) + operasi inventory user.
 */

function parseItemRow(row) {
  if (!row) return row;
  return {
    ...row,
    locations: row.locations ? JSON.parse(row.locations) : [],
    crafting: row.crafting ? JSON.parse(row.crafting) : null,
    metadata: row.metadata ? JSON.parse(row.metadata) : {},
  };
}

export function getItemByCode(db, code) {
  return parseItemRow(db.prepare(`SELECT * FROM items WHERE code = ?`).get(code));
}

/** Item yang bisa dibeli langsung di !shop buy (buy_price terisi). */
export function listShopItems(db, category = null) {
  const rows = category
    ? db.prepare(`SELECT * FROM items WHERE buy_price IS NOT NULL AND category = ? ORDER BY buy_price ASC`).all(category)
    : db.prepare(`SELECT * FROM items WHERE buy_price IS NOT NULL ORDER BY category, buy_price ASC`).all();
  return rows.map(parseItemRow);
}

/** Semua item yang bisa dijual (dipakai untuk validasi + info harga jual). */
export function listSellableItems(db) {
  return db
    .prepare(`SELECT * FROM items WHERE tradeable = 1 AND sell_price > 0 ORDER BY category, sell_price ASC`)
    .all()
    .map(parseItemRow);
}

/** Resource yang bisa didapat lewat !gather di biome tertentu (nama biome, mis. 'Veridian Labyrinth'). */
export function listGatherableByBiome(db, biomeName) {
  return db
    .prepare(`SELECT * FROM items WHERE locations LIKE ? ORDER BY rarity, sell_price`)
    .all(`%${biomeName}%`)
    .map(parseItemRow);
}

export function getInventory(db, userId) {
  return db
    .prepare(
      `SELECT inv.id AS inventory_id, inv.quantity, inv.is_equipped, inv.durability,
              it.code, it.name, it.category, it.rarity, it.equip_slot, it.sell_price
         FROM inventory inv JOIN items it ON it.id = inv.item_id
        WHERE inv.user_id = ?
        ORDER BY it.category, it.name`
    )
    .all(userId);
}

export function getInventoryItem(db, userId, itemCode) {
  return db
    .prepare(
      `SELECT inv.*, it.code, it.name, it.stackable, it.max_stack, it.sell_price
         FROM inventory inv JOIN items it ON it.id = inv.item_id
        WHERE inv.user_id = ? AND it.code = ?`
    )
    .get(userId, itemCode);
}

/**
 * Tambah item ke inventory. Item stackable akan digabung ke baris yang
 * sudah ada (sampai max_stack); non-stackable selalu bikin baris baru
 * (jadi tiap instance bisa punya instance_metadata/durability sendiri).
 */
export function addItem(db, userId, itemCode, quantity = 1) {
  const item = getItemByCode(db, itemCode);
  if (!item) throw new Error(`Item tidak ditemukan: ${itemCode}`);

  const apply = db.transaction(() => {
    if (item.stackable) {
      const existing = db
        .prepare(`SELECT * FROM inventory WHERE user_id = ? AND item_id = ? LIMIT 1`)
        .get(userId, item.id);

      if (existing) {
        db.prepare(`UPDATE inventory SET quantity = quantity + ? WHERE id = ?`)
          .run(quantity, existing.id);
        return;
      }
    }

    db.prepare(
      `INSERT INTO inventory (user_id, item_id, quantity) VALUES (?, ?, ?)`
    ).run(userId, item.id, quantity);
  });

  apply();
  return getInventoryItem(db, userId, itemCode);
}

/** Kurangi/hapus item dari inventory. Melempar error kalau jumlahnya kurang. */
export function removeItem(db, userId, itemCode, quantity = 1) {
  const row = getInventoryItem(db, userId, itemCode);
  if (!row || row.quantity < quantity) {
    throw new Error(`Jumlah item "${itemCode}" tidak cukup`);
  }

  const apply = db.transaction(() => {
    if (row.quantity === quantity) {
      db.prepare(`DELETE FROM inventory WHERE id = ?`).run(row.id);
    } else {
      db.prepare(`UPDATE inventory SET quantity = quantity - ? WHERE id = ?`)
        .run(quantity, row.id);
    }
  });

  apply();
  return true;
}

export function hasItem(db, userId, itemCode, quantity = 1) {
  const row = getInventoryItem(db, userId, itemCode);
  return !!row && row.quantity >= quantity;
}
