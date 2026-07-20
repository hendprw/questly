import fs from 'fs';
import Database from 'better-sqlite3';

const db = new Database('data/rpg.db');
const items = db.prepare("SELECT code, metadata FROM items WHERE category = 'consumable' OR code IN ('old_boot', 'rusty_can', 'bottle_message', 'sunken_coin', 'frozen_tear', 'dragon_scale_fragment')").all();

let seedContent = fs.readFileSync('db/seed.js', 'utf-8');

items.forEach(i => {
    if (i.metadata) {
        const regex = new RegExp('(\\{\\s*code:\\s*"' + i.code + '"[^}]*?\\s*\\})');
        const match = seedContent.match(regex);
        if (match) {
            let objStr = match[1];
            // If it already has metadata, skip for now. If not, append it.
            if (!objStr.includes('metadata:')) {
                // Parse it to append
                let newObjStr = objStr.replace(/\\s*\\}$/, \`, metadata: \${i.metadata} }\`);
                seedContent = seedContent.replace(objStr, newObjStr);
            }
        }
    }
});

fs.writeFileSync('db/seed.js', seedContent, 'utf-8');
console.log("Patched seed.js!");
