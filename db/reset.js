/**
 * node db/reset.js — hapus data/rpg.db lalu bikin ulang dari migration + seed.
 * Berguna saat development ketika schema berubah drastis.
 */
import { existsSync, rmSync } from "fs";
import { resolve } from "path";
import { openDatabase } from "./connection.js";
import { runMigrations } from "./migrate.js";
import { seedDatabase } from "./seed.js";

const dbPath = resolve(process.cwd(), "data/rpg.db");

for (const suffix of ["", "-wal", "-shm"]) {
  const p = dbPath + suffix;
  if (existsSync(p)) rmSync(p);
}

const db = openDatabase(dbPath);
runMigrations(db);
seedDatabase(db);
db.close();

console.log("[db] reset complete —", dbPath);
