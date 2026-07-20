import Database from 'better-sqlite3';
const db = new Database('data/rpg.db');

const allItems = db.prepare('SELECT * FROM items').all();

const usedMaterials = new Set();
const upgradeMaterials = new Set();
const usableItems = new Set();
const equippableItems = new Set();
const farmSeeds = new Set(['wheat', 'herb', 'potato', 'carrot', 'apple', 'sunflower_seed', 'fire_lotus_seed']);
const questItems = new Set();

allItems.forEach(i => {
    if (i.equip_slot) equippableItems.add(i.code);
    if (i.category === 'quest') questItems.add(i.code);
    
    let meta = {};
    if (i.metadata) {
        try { meta = JSON.parse(i.metadata); } catch(e){}
    }
    
    if (meta.usable) usableItems.add(i.code);
    
    if (meta.crafting && meta.crafting.materials) {
        Object.keys(meta.crafting.materials).forEach(m => usedMaterials.add(m));
    }
    
    if (meta.upgrade && meta.upgrade.cost) {
        meta.upgrade.cost.forEach(lvl => {
            if (lvl.materials) {
                Object.keys(lvl.materials).forEach(m => upgradeMaterials.add(m));
            }
        });
    }
});

const trash = [];

allItems.forEach(i => {
    const code = i.code;
    if (
        !usedMaterials.has(code) && 
        !upgradeMaterials.has(code) && 
        !usableItems.has(code) && 
        !equippableItems.has(code) && 
        !farmSeeds.has(code) && 
        !questItems.has(code)
    ) {
        trash.push(code + " (" + i.name + ") - Category: " + i.category);
    }
});

console.log("Remaining Vendor Trash:");
console.log(trash.join('\n'));
