/**
 * db/migrate.js
 * -------------
 * Migration runner sederhana tapi future-proof: setiap file di
 * db/migrations/ (diurut berdasarkan nama, jadi selalu prefix angka,
 * mis. 001_init.sql, 002_add_pets.sql, dst) dijalankan tepat SEKALI dan
 * dicatat di tabel schema_migrations. Aman dijalankan berulang kali saat
 * bot restart — migration yang sudah tercatat otomatis dilewati.
 *
 * Cara nambah migration baru di masa depan:
 *   1. Buat file db/migrations/00N_nama_perubahan.sql
 *   2. Isi dengan statement SQL (ALTER TABLE / CREATE TABLE baru / dst)
 *   3. Restart bot — migration akan otomatis terdeteksi & dijalankan.
 */
import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, "migrations");

/**
 * @param {import('better-sqlite3').Database} db
 */
export function runMigrations(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version     INTEGER PRIMARY KEY,
      name        TEXT NOT NULL,
      applied_at  INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );
  `);

  const applied = new Set(
    db.prepare(`SELECT name FROM schema_migrations`).all().map((r) => r.name)
  );

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const insertRecord = db.prepare(
    `INSERT INTO schema_migrations (version, name) VALUES (?, ?)`
  );

  let ranCount = 0;
  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    const version = parseInt(file.split("_")[0], 10) || applied.size + 1;

    const runOne = db.transaction(() => {
      db.exec(sql);
      insertRecord.run(version, file);
    });
    runOne();

    ranCount++;
    console.log(`[db] migration applied: ${file}`);
  }

  if (ranCount === 0) console.log("[db] schema up to date, no migrations to run");
  return ranCount;
}
