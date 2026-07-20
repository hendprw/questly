import Database from 'better-sqlite3';
const db = new Database('./data/rpg.db');
try {
  db.prepare(`INSERT INTO schema_migrations (version, name) VALUES (20, '020_add_battle_info.sql')`).run();
  console.log('Migration recorded in schema_migrations');
} catch(e) {
  console.error(e.message);
}
