import Database from 'better-sqlite3';
import fs from 'fs';

const db = new Database('./data/rpg.db');
const sql = fs.readFileSync('./db/migrations/020_add_battle_info.sql', 'utf8');
db.exec(sql);
console.log('Migration done');
