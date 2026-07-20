import { openDatabase } from './db/connection.js'; 
const db = openDatabase(); 
const rows = db.prepare("SELECT code, crafting, category FROM items WHERE category='potion'").all(); 
console.log(JSON.stringify(rows, null, 2));
