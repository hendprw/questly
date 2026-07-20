import Database from 'better-sqlite3';
const db = new Database('./data/rpg.db');
try {
  db.prepare('DELETE FROM shop_listings').run();
  db.prepare('UPDATE shop_meta SET last_restock_at = 0').run();
  console.log('Shop reset successfully');
} catch (e) {
  console.error(e.message);
}
