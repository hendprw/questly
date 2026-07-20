import fs from 'fs';

let content = fs.readFileSync('db/seed-world.js', 'utf-8');

const newItemsStr = `
  { "code": "ramuan_sihir_kuno", "name": "Ramuan Sihir Kuno", "description": "Ramuan sakti dari serbuk debu mana dan wisp.", "category": "potion", "rarity": "mythic", "equip_slot": null, "buy_price": 1000, "sell_price": 500, "stackable": 1, "max_stack": 99, "tradeable": 1, "weight": 1, "metadata": { "usable": { "heal_mp": 150 }, "crafting": { "materials": { "mana_dust": 2, "will_o_wisp": 1, "mountain_flower": 1, "fire_blossom": 1 } } } },
  { "code": "telur_wyvern_bakar", "name": "Telur Wyvern Bakar", "description": "Telur raksasa yang dipanggang dengan kayu abu.", "category": "food", "rarity": "epic", "equip_slot": null, "buy_price": 800, "sell_price": 400, "stackable": 1, "max_stack": 99, "tradeable": 1, "weight": 5, "metadata": { "usable": { "heal_hp": 100, "heal_stamina": 50 }, "crafting": { "materials": { "wyvern_egg": 1, "ash_wood": 2 } } } },
  { "code": "zirah_laut_dalam", "name": "Zirah Laut Dalam", "description": "Baju besi yang memancarkan aura lautan.", "category": "armor", "rarity": "legendary", "equip_slot": "body", "buy_price": 3000, "sell_price": 1500, "stackable": 0, "max_stack": 1, "tradeable": 1, "weight": 15, "metadata": { "stats": { "defense": 30, "hp": 100 }, "crafting": { "materials": { "abyssal_scale": 3, "coral_branch": 5, "deep_sea_kelp": 10 } } } },
  { "code": "jubah_kadal_terbang", "name": "Jubah Kadal Terbang", "description": "Ringan dan tahan api.", "category": "armor", "rarity": "uncommon", "equip_slot": "body", "buy_price": 400, "sell_price": 200, "stackable": 0, "max_stack": 1, "tradeable": 1, "weight": 4, "metadata": { "stats": { "defense": 12, "speed": 5 }, "crafting": { "materials": { "lizard_scale": 4, "feathers": 5 } } } },`;

content = content.replace(/(?=\];\n\nexport const GEMSTONE_ENCHANTS)/, "\n" + newItemsStr + "\n");

function addUpgradeCost(content, weaponCode, mats) {
    let regex = new RegExp('("code": "' + weaponCode + '"[^]*?"upgrade": {[\\s\\S]*?"cost": \\[)([\\s\\S]*?)(\\])');
    let match = content.match(regex);
    if (match) {
        let costArrayStr = match[2];
        try {
            let costArray = JSON.parse("[" + costArrayStr + "]");
            // Tambahkan material secara berurutan ke level 2, 3, 4, 5 dst
            let matIndex = 0;
            costArray.forEach(lvl => {
                if (matIndex < mats.length) {
                    lvl.materials[mats[matIndex]] = 1;
                    matIndex++;
                }
            });
            let newCostStr = JSON.stringify(costArray).slice(1, -1);
            return content.replace(costArrayStr, newCostStr);
        } catch(e) { }
    }
    return content;
}

content = addUpgradeCost(content, "durandal", ["sapphire", "obsidian_shard"]);
content = addUpgradeCost(content, "gram", ["copper_ore", "mythril_ore", "fairy_tear"]);
content = addUpgradeCost(content, "caliburn", ["mysterious_egg", "leviathan_heart"]);
content = addUpgradeCost(content, "bloodhowl", ["beast_soul_gem"]);
content = addUpgradeCost(content, "earthshaker", ["ancient_lightning_core"]);

fs.writeFileSync('db/seed-world.js', content, 'utf-8');
console.log("Remaining trash integrated!");
