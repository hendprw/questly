/**
 * db/repo/monsters.js
 * -------------------
 * Katalog monster (porting sebagian dari MONSTERS di world-data.js Orion —
 * disederhanakan untuk Fase 1, tanpa biome/loot kompleks dulu).
 */

export function getMonster(db, code) {
  const row = db.prepare(`SELECT * FROM monsters WHERE code = ?`).get(code);
  if (!row) return null;
  return { ...row, loot_table: JSON.parse(row.loot_table) };
}

/** Ambil monster acak yang sesuai range level user (min_level <= level <= max_level). */
export function getRandomMonsterForLevel(db, level) {
  const rows = db
    .prepare(`SELECT * FROM monsters WHERE min_level <= ? AND max_level >= ?`)
    .all(level, level);
  if (rows.length === 0) return null;
  const picked = rows[Math.floor(Math.random() * rows.length)];
  return { ...picked, loot_table: JSON.parse(picked.loot_table) };
}

export function listMonsters(db) {
  return db.prepare(`SELECT code, name, min_level, max_level FROM monsters ORDER BY min_level`).all();
}