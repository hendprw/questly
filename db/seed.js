/**
 * db/seed.js
 * ----------
 * Data master awal (jobs & items). Dipanggil sekali tiap start — pakai
 * INSERT OR IGNORE jadi aman dijalankan berulang kali tanpa duplikat.
 */



const ITEMS = [
  { code: "wood_sword", name: "Pedang Kayu", category: "weapon", rarity: "common", equip_slot: "weapon", buy_price: 200, sell_price: 80, stackable: 0, weight: 5 },
  { code: "iron_sword", name: "Pedang Besi", category: "weapon", rarity: "uncommon", equip_slot: "weapon", buy_price: 800, sell_price: 320, stackable: 0, weight: 7 },
  { code: "health_potion", name: "Ramuan Kesehatan", category: "consumable", rarity: "common", buy_price: 50, sell_price: 20, stackable: 1, max_stack: 99, weight: 1 },
  { code: "mana_potion", name: "Ramuan Mana", category: "consumable", rarity: "common", buy_price: 60, sell_price: 25, stackable: 1, max_stack: 99, weight: 1 },
  { code: "fishing_rod", name: "Pancingan", category: "tool", rarity: "common", buy_price: 250, sell_price: 100, stackable: 0, weight: 4 },
];

const CURRENCIES = [
  { code: "cash", name: "Cash", symbol: "💵", is_active: 1 },
  { code: "bank", name: "Bank", symbol: "🏦", is_active: 1 },
  { code: "gems", name: "Gems", symbol: "💎", is_active: 1 },
];

/** @param {import('better-sqlite3').Database} db */
export function seedDatabase(db) {

  const insertItem = db.prepare(`
    INSERT OR IGNORE INTO items (code, name, category, rarity, equip_slot, buy_price, sell_price, stackable, max_stack, weight)
    VALUES (@code, @name, @category, @rarity, @equip_slot, @buy_price, @sell_price, @stackable, @max_stack, @weight)
  `);
  const insertCurrency = db.prepare(`
    INSERT OR IGNORE INTO currencies (code, name, symbol, is_active) VALUES (@code, @name, @symbol, @is_active)
  `);

  const runAll = db.transaction(() => {

    for (const item of ITEMS) {
      insertItem.run({
        equip_slot: null,
        max_stack: 99,
        weight: 1,
        ...item,
      });
    }
    for (const currency of CURRENCIES) insertCurrency.run(currency);
  });

  runAll();
}