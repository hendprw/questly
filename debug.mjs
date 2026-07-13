import { openDatabase } from "./db/connection.js";

const db = openDatabase(); // pakai path default yang sama kayak index.js: ./data/rpg.db

console.log("=== schema_migrations ===");
console.log(db.prepare("SELECT * FROM schema_migrations ORDER BY version").all());

console.log("\n=== tabel yang mengandung 'market' ===");
console.log(
  db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%market%'").all()
);

console.log("\n=== semua nama file migration di folder db/migrations ===");
import { readdirSync } from "fs";
console.log(readdirSync("./db/migrations").filter((f) => f.endsWith(".sql")).sort());

db.close();
