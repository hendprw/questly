/**
 * db/seed.js
 * ----------
 * Data master awal (jobs & items). Dipanggil sekali tiap start — pakai
 * INSERT OR IGNORE jadi aman dijalankan berulang kali tanpa duplikat.
 */

const JOBS = [
  { code: "farmer", name: "Petani", min_level: 1, base_pay_min: 100, base_pay_max: 400, base_xp: 15, cooldown_seconds: 1800 },
  { code: "fisherman", name: "Nelayan", min_level: 1, base_pay_min: 150, base_pay_max: 450, base_xp: 18, cooldown_seconds: 1800 },
  { code: "miner", name: "Penambang", min_level: 5, base_pay_min: 300, base_pay_max: 900, base_xp: 30, cooldown_seconds: 3600 },
  { code: "merchant", name: "Pedagang", min_level: 10, base_pay_min: 500, base_pay_max: 1500, base_xp: 45, cooldown_seconds: 3600 },
  { code: "mercenary", name: "Tentara Bayaran", min_level: 20, base_pay_min: 1000, base_pay_max: 3000, base_xp: 80, cooldown_seconds: 7200 },
];

const ITEMS = [
  { code: "wood_sword", name: "Pedang Kayu", category: "weapon", rarity: "common", equip_slot: "weapon", buy_price: 200, sell_price: 80, stackable: 0 },
  { code: "iron_sword", name: "Pedang Besi", category: "weapon", rarity: "uncommon", equip_slot: "weapon", buy_price: 800, sell_price: 320, stackable: 0 },
  { code: "leather_armor", name: "Baju Kulit", category: "armor", rarity: "common", equip_slot: "body", buy_price: 300, sell_price: 120, stackable: 0 },
  { code: "health_potion", name: "Ramuan Kesehatan", category: "consumable", rarity: "common", buy_price: 50, sell_price: 20, stackable: 1, max_stack: 99 },
  { code: "mana_potion", name: "Ramuan Mana", category: "consumable", rarity: "common", buy_price: 60, sell_price: 25, stackable: 1, max_stack: 99 },
  { code: "fishing_rod", name: "Pancingan", category: "tool", rarity: "common", buy_price: 250, sell_price: 100, stackable: 0 },
  { code: "iron_ore", name: "Bijih Besi", category: "material", rarity: "common", buy_price: null, sell_price: 40, stackable: 1, max_stack: 999 },
  { code: "gold_ore", name: "Bijih Emas", category: "material", rarity: "rare", buy_price: null, sell_price: 250, stackable: 1, max_stack: 999 },
];

const CURRENCIES = [
  { code: "cash", name: "Cash", symbol: "💵", is_active: 1 },
  { code: "bank", name: "Bank", symbol: "🏦", is_active: 1 },
  { code: "gems", name: "Gems", symbol: "💎", is_active: 1 },
];

/** @param {import('better-sqlite3').Database} db */
export function seedDatabase(db) {
  const insertJob = db.prepare(`
    INSERT OR IGNORE INTO jobs (code, name, min_level, base_pay_min, base_pay_max, base_xp, cooldown_seconds)
    VALUES (@code, @name, @min_level, @base_pay_min, @base_pay_max, @base_xp, @cooldown_seconds)
  `);
  const insertItem = db.prepare(`
    INSERT OR IGNORE INTO items (code, name, category, rarity, equip_slot, buy_price, sell_price, stackable, max_stack)
    VALUES (@code, @name, @category, @rarity, @equip_slot, @buy_price, @sell_price, @stackable, @max_stack)
  `);
  const insertCurrency = db.prepare(`
    INSERT OR IGNORE INTO currencies (code, name, symbol, is_active) VALUES (@code, @name, @symbol, @is_active)
  `);

  const runAll = db.transaction(() => {
    for (const job of JOBS) insertJob.run(job);
    for (const item of ITEMS) {
      insertItem.run({
        equip_slot: null,
        max_stack: 99,
        ...item,
      });
    }
    for (const currency of CURRENCIES) insertCurrency.run(currency);
  });

  runAll();
}
