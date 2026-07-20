import { getItemByCode, getInventoryItem, removeItem, addItem } from "./items.js";
import { getCarryState, addCarryWeight } from "./shop.js";

export function getGudangState(db, userId) {
  const weightRows = db.prepare(`
    SELECT SUM(inv.quantity * COALESCE(it.weight, 0)) as total_weight
    FROM inventory inv
    JOIN items it ON it.id = inv.item_id
    WHERE inv.user_id = ? AND inv.location = 'gudang'
  `).get(userId);
  
  const current_weight = weightRows?.total_weight || 0;
  
  const leveling = db.prepare(`SELECT level FROM leveling WHERE user_id = ?`).get(userId);
  const level = leveling?.level || 1;
  const max_gudang_weight = 250 + (Math.floor(level / 10) * 150);
  
  return { gudang_weight: current_weight, max_gudang_weight };
}

export function getGudangItems(db, userId) {
  return db
    .prepare(
      `SELECT inv.id AS inventory_id, inv.quantity,
              it.code, it.name, it.category, it.rarity, it.weight
         FROM inventory inv JOIN items it ON it.id = inv.item_id
        WHERE inv.user_id = ? AND inv.location = 'gudang'
        ORDER BY it.category, it.name`
    )
    .all(userId);
}

export function getGudangItem(db, userId, itemCode) {
  return db
    .prepare(
      `SELECT inv.*, it.code, it.name, it.stackable, it.max_stack, it.weight
         FROM inventory inv JOIN items it ON it.id = inv.item_id
        WHERE inv.user_id = ? AND it.code = ? AND inv.location = 'gudang'`
    )
    .get(userId, itemCode);
}

export function depositToGudang(db, userId, itemCode, quantityInput) {
  const apply = db.transaction(() => {
    const itemInfo = getItemByCode(db, itemCode);
    if (!itemInfo) throw new Error(`Item ${itemCode} tidak ditemukan.`);

    const bagItem = getInventoryItem(db, userId, itemCode);
    if (!bagItem) throw new Error(`Kamu tidak memiliki ${itemInfo.name} di tas.`);

    const quantity = quantityInput === 'all' ? bagItem.quantity : parseInt(quantityInput, 10);
    if (!Number.isFinite(quantity) || quantity <= 0) throw new Error("Jumlah tidak valid.");
    if (quantity > bagItem.quantity) throw new Error(`Kamu hanya punya ${bagItem.quantity}x ${itemInfo.name}.`);

    const weightToMove = (itemInfo.weight || 0) * quantity;
    const gudangState = getGudangState(db, userId);

    if (gudangState.gudang_weight + weightToMove > gudangState.max_gudang_weight) {
      throw new Error(`Gudang penuh! Butuh ${weightToMove} ruang, tersisa ${gudangState.max_gudang_weight - gudangState.gudang_weight}.`);
    }

    // Kurangi dari tas
    removeItem(db, userId, itemCode, quantity);
    addCarryWeight(db, userId, -weightToMove);

    // Tambah ke gudang
    const existingGudang = getGudangItem(db, userId, itemCode);
    if (existingGudang && itemInfo.stackable) {
      db.prepare(`UPDATE inventory SET quantity = quantity + ? WHERE id = ?`).run(quantity, existingGudang.id);
    } else {
      db.prepare(
        `INSERT INTO inventory (user_id, item_id, quantity, location) VALUES (?, ?, ?, 'gudang')`
      ).run(userId, itemInfo.id, quantity);
    }

    db.prepare(`UPDATE characters SET gudang_weight = gudang_weight + ? WHERE user_id = ?`).run(weightToMove, userId);

    return { itemInfo, quantity };
  });

  return apply();
}

export function withdrawFromGudang(db, userId, itemCode, quantityInput) {
  const apply = db.transaction(() => {
    const itemInfo = getItemByCode(db, itemCode);
    if (!itemInfo) throw new Error(`Item ${itemCode} tidak ditemukan.`);

    const gudangItem = getGudangItem(db, userId, itemCode);
    if (!gudangItem) throw new Error(`Tidak ada ${itemInfo.name} di gudang.`);

    const quantity = quantityInput === 'all' ? gudangItem.quantity : parseInt(quantityInput, 10);
    if (!Number.isFinite(quantity) || quantity <= 0) throw new Error("Jumlah tidak valid.");
    if (quantity > gudangItem.quantity) throw new Error(`Kamu hanya punya ${gudangItem.quantity}x ${itemInfo.name} di gudang.`);

    const weightToMove = (itemInfo.weight || 0) * quantity;
    const carryState = getCarryState(db, userId);

    if (carryState.carry_weight + weightToMove > carryState.max_carry_weight) {
      throw new Error(`Tas penuh! Butuh ${weightToMove} ruang, tersisa ${carryState.max_carry_weight - carryState.carry_weight}.`);
    }

    // Kurangi dari gudang
    if (gudangItem.quantity === quantity) {
      db.prepare(`DELETE FROM inventory WHERE id = ?`).run(gudangItem.id);
    } else {
      db.prepare(`UPDATE inventory SET quantity = quantity - ? WHERE id = ?`).run(quantity, gudangItem.id);
    }
    db.prepare(`UPDATE characters SET gudang_weight = gudang_weight - ? WHERE user_id = ?`).run(weightToMove, userId);

    // Tambah ke tas
    addItem(db, userId, itemCode, quantity);
    addCarryWeight(db, userId, weightToMove);

    return { itemInfo, quantity };
  });

  return apply();
}
