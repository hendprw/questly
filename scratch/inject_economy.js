import fs from 'fs';

let content = fs.readFileSync('db/seed-world.js', 'utf-8');

// 1. ADD NEW USABLE ITEMS
const newItemsStr = `
  { "code": "ikan_bakar", "name": "Ikan Bakar", "description": "Ikan segar yang dibakar sempurna.", "category": "food", "rarity": "common", "equip_slot": null, "buy_price": 40, "sell_price": 20, "stackable": 1, "max_stack": 99, "tradeable": 1, "weight": 2, "metadata": { "usable": { "heal_hp": 20 }, "crafting": { "materials": { "common_fish": 1, "wood": 1 } } } },
  { "code": "sup_belut", "name": "Sup Belut Penambah Stamina", "description": "Sup hangat yang membakar semangatmu.", "category": "food", "rarity": "rare", "equip_slot": null, "buy_price": 100, "sell_price": 50, "stackable": 1, "max_stack": 99, "tradeable": 1, "weight": 2, "metadata": { "usable": { "heal_stamina": 25 }, "crafting": { "materials": { "serpent_eel": 1, "herb": 1 } } } },
  { "code": "ramuan_penyembuh", "name": "Ramuan Penyembuh", "description": "Cairan merah berbau herbal pekat.", "category": "potion", "rarity": "uncommon", "equip_slot": null, "buy_price": 80, "sell_price": 40, "stackable": 1, "max_stack": 99, "tradeable": 1, "weight": 1, "metadata": { "usable": { "heal_hp": 50 }, "crafting": { "materials": { "treant_sap": 1, "herb": 2 } } } },
  { "code": "elixir_bulan", "name": "Elixir Bulan", "description": "Memancarkan cahaya biru lembut, memulihkan Mana.", "category": "potion", "rarity": "rare", "equip_slot": null, "buy_price": 150, "sell_price": 75, "stackable": 1, "max_stack": 99, "tradeable": 1, "weight": 1, "metadata": { "usable": { "heal_mp": 50 }, "crafting": { "materials": { "moonpetal": 1, "cave_moss": 2 } } } },
  { "code": "telur_dadar", "name": "Telur Dadar Liar", "description": "Makanan sederhana namun mengenyangkan.", "category": "food", "rarity": "common", "equip_slot": null, "buy_price": 30, "sell_price": 15, "stackable": 1, "max_stack": 99, "tradeable": 1, "weight": 2, "metadata": { "usable": { "heal_hp": 15 }, "crafting": { "materials": { "duck_egg": 1, "wood": 1 } } } },
  { "code": "mantel_bulu", "name": "Mantel Bulu Kelinci", "description": "Pakaian hangat dan ringan.", "category": "armor", "rarity": "common", "equip_slot": "body", "buy_price": 200, "sell_price": 100, "stackable": 0, "max_stack": 1, "tradeable": 1, "weight": 5, "metadata": { "stats": { "defense": 5 }, "crafting": { "materials": { "rabbit_fur": 3, "iron_ore": 1 } } } },
`;

// Insert new items before the end of WORLD_ITEMS array
// WORLD_ITEMS ends with "];\n\nexport const WORLD_MONSTERS"
content = content.replace(/(?=\];\n\nexport const WORLD_MONSTERS)/, newItemsStr);

// 2. MODIFY UPGRADE COSTS for a few weapons
// iron_sword: add ruby to level 3, sapphire to level 4, obsidian to level 5
let swordRegex = /("code": "iron_sword"[^]*?"upgrade": {[^]*?"cost": \[)([^]*?)(\])/;
let match = content.match(swordRegex);
if (match) {
    let costArrayStr = match[2];
    try {
        let costArray = JSON.parse(`[${costArrayStr}]`);
        costArray.forEach(lvl => {
            if (lvl.level === 3) lvl.materials.ruby = 1;
            if (lvl.level === 4) lvl.materials.sapphire = 1;
            if (lvl.level === 5) lvl.materials.obsidian = 1;
        });
        let newCostStr = JSON.stringify(costArray).slice(1, -1);
        content = content.replace(costArrayStr, newCostStr);
    } catch(e) { console.error("Error parsing iron_sword upgrade cost", e); }
}

let excaliburRegex = /("code": "excalibur"[^]*?"upgrade": {[^]*?"cost": \[)([^]*?)(\])/;
let excaliburMatch = content.match(excaliburRegex);
if (excaliburMatch) {
    let costArrayStr = excaliburMatch[2];
    try {
        let costArray = JSON.parse(`[${costArrayStr}]`);
        costArray.forEach(lvl => {
            if (lvl.level === 3) lvl.materials.amethyst = 1;
            if (lvl.level === 4) lvl.materials.ruby = 2;
            if (lvl.level === 5) { lvl.materials.obsidian = 2; lvl.materials.dragon_scale = 1; }
        });
        let newCostStr = JSON.stringify(costArray).slice(1, -1);
        content = content.replace(costArrayStr, newCostStr);
    } catch(e) { console.error("Error parsing excalibur upgrade cost", e); }
}

fs.writeFileSync('db/seed-world.js', content, 'utf-8');
console.log("Injection complete.");
