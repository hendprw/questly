/**
 * db/repo/items.js
 * ----------------
 * Katalog item (master data) + operasi inventory user.
 */

export function getItemByCode(db, code) {
  return db.prepare(`SELECT * FROM items WHERE code = ?`).get(code);
}

export function listShopItems(db) {
  return db
    .prepare(`SELECT * FROM items WHERE buy_price IS NOT NULL ORDER BY buy_price ASC`)
    .all();
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
