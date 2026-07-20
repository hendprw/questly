import Database from 'better-sqlite3';
import { WORLD_ITEMS } from '../db/seed-world.js';

const db = new Database('data/rpg.db');

const stmtCheck = db.prepare('SELECT id FROM items WHERE code = ?');
const stmtUpdate = db.prepare('UPDATE items SET metadata = ?, locations = ?, buy_price = ?, sell_price = ?, description = ? WHERE code = ?');
const stmtInsert = db.prepare('INSERT INTO items (code, name, description, category, rarity, equip_slot, buy_price, sell_price, stackable, max_stack, tradeable, weight, metadata, locations) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

let newCount = 0;
let updateCount = 0;

for (const it of WORLD_ITEMS) {
    const metaStr = it.metadata ? JSON.stringify(it.metadata) : null;
    let locations = '[]';
    if (it.metadata && it.metadata.locations) {
        locations = JSON.stringify(it.metadata.locations);
    } else if (it.locations) {
        locations = JSON.stringify(it.locations);
    }

    const row = stmtCheck.get(it.code);
    if (row) {
        stmtUpdate.run(metaStr, locations, it.buy_price, it.sell_price, it.description, it.code);
        updateCount++;
    } else {
        stmtInsert.run(
            it.code, it.name, it.description, it.category, it.rarity, it.equip_slot,
            it.buy_price, it.sell_price, it.stackable, it.max_stack, it.tradeable, it.weight,
            metaStr, locations
        );
        newCount++;
    }
}

console.log(`Synced items: ${newCount} inserted, ${updateCount} updated.`);
