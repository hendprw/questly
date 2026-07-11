/**
 * db/connection.js
 * ----------------
 * Satu titik masuk untuk koneksi SQLite. Dipanggil sekali di index.js
 * sebelum plugin di-load, lalu instance-nya dipasang ke `bot.db` supaya
 * semua plugin bisa pakai lewat closure `bot` yang mereka terima.
 */
import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "fs";
import { dirname, resolve } from "path";

const DEFAULT_DB_PATH = resolve(process.cwd(), "data/rpg.db");

/**
 * @param {string} [dbPath] path ke file .db — default `./data/rpg.db`
 * @returns {import('better-sqlite3').Database}
 */
export function openDatabase(dbPath = DEFAULT_DB_PATH) {
  const dir = dirname(dbPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const db = new Database(dbPath);

  // WAL = tulisan lebih cepat & baca-tulis bisa bersamaan (penting karena
  // command bisa datang cepat dari banyak user sekaligus).
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("synchronous = NORMAL");

  return db;
}
