import Database from 'better-sqlite3';
import { WORLD_ITEMS } from '../db/seed-world.js';
import path from 'path';

const dbPath = path.resolve('./data/rpg.db');
const db = new Database(dbPath);

console.log("Menyinkronkan semua data item dari seed-world.js ke database...");

const itemsToSync = WORLD_ITEMS;
console.log(`Ditemukan ${itemsToSync.length} item di WORLD_ITEMS.`);

const stmt = db.prepare(`
    INSERT INTO items (code, name, description, category, rarity, stackable, max_stack, weight, tradeable, equip_slot, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(code) DO UPDATE SET
        name = excluded.name,
        description = excluded.description,
        rarity = excluded.rarity,
        metadata = excluded.metadata
`);

db.transaction(() => {
    for (const item of itemsToSync) {
        stmt.run(
            item.code,
            item.name,
            item.description || "",
            item.category,
            item.rarity,
            item.stackable ? 1 : 0,
            item.max_stack || 99,
            item.weight || 0,
            item.tradeable ? 1 : 0,
            item.equip_slot || null,
            item.metadata ? JSON.stringify(item.metadata) : null
        );
        // console.log(`Upserted: ${item.code} - ${item.name}`); // Dimatikan agar tidak spam
    }
})();

console.log("Sinkronisasi selesai!");
db.close();
