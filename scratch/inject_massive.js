import fs from 'fs';

let content = fs.readFileSync('db/seed-world.js', 'utf-8');

// NEW ITEMS TO INJECT
const newItemsStr = `
  { "code": "salad_buah", "name": "Salad Buah Hutan", "description": "Campuran Beri Liar dan Pisang yang menyegarkan.", "category": "food", "rarity": "common", "equip_slot": null, "buy_price": 60, "sell_price": 30, "stackable": 1, "max_stack": 99, "tradeable": 1, "weight": 2, "metadata": { "usable": { "heal_hp": 40 }, "crafting": { "materials": { "wild_berries": 2, "banana": 1 } } } },
  { "code": "kue_manis", "name": "Kue Manis", "description": "Roti panggang dengan gula dan telur.", "category": "food", "rarity": "uncommon", "equip_slot": null, "buy_price": 120, "sell_price": 60, "stackable": 1, "max_stack": 99, "tradeable": 1, "weight": 2, "metadata": { "usable": { "heal_hp": 30, "heal_stamina": 20 }, "crafting": { "materials": { "sugar": 1, "wheat": 2, "duck_egg": 1 } } } },
  { "code": "ramuan_nyawa_hitam", "name": "Ramuan Nyawa Hitam", "description": "Ramuan kental dari Lotus Hitam dan Darah Lintah.", "category": "potion", "rarity": "epic", "equip_slot": null, "buy_price": 500, "sell_price": 250, "stackable": 1, "max_stack": 99, "tradeable": 1, "weight": 1, "metadata": { "usable": { "heal_hp": 150 }, "crafting": { "materials": { "black_lotus": 1, "leech_blood": 3 } } } },
  { "code": "esensi_salju_abadi", "name": "Esensi Salju Abadi", "description": "Dingin yang membekukan jiwa, namun memulihkan mana.", "category": "potion", "rarity": "epic", "equip_slot": null, "buy_price": 600, "sell_price": 300, "stackable": 1, "max_stack": 99, "tradeable": 1, "weight": 1, "metadata": { "usable": { "heal_mp": 100 }, "crafting": { "materials": { "frost_crystal": 1, "ice_melon": 2 } } } },
  { "code": "sate_paha_katak", "name": "Sate Paha Katak", "description": "Daging kenyal hasil panggangan.", "category": "food", "rarity": "common", "equip_slot": null, "buy_price": 50, "sell_price": 25, "stackable": 1, "max_stack": 99, "tradeable": 1, "weight": 3, "metadata": { "usable": { "heal_hp": 35 }, "crafting": { "materials": { "giant_frog_leg": 1, "wood": 1 } } } },
  { "code": "jubah_yeti", "name": "Jubah Yeti Tahan Dingin", "description": "Jubah tebal dari bulu Yeti asli.", "category": "armor", "rarity": "rare", "equip_slot": "body", "buy_price": 800, "sell_price": 400, "stackable": 0, "max_stack": 1, "tradeable": 1, "weight": 8, "metadata": { "stats": { "defense": 15, "hp": 50 }, "crafting": { "materials": { "yeti_fur": 3, "seal_oil": 1 } } } },
  { "code": "zirah_naga_rawa", "name": "Zirah Sisik Hydra", "description": "Baju besi yang tahan korosi dan sangat kuat.", "category": "armor", "rarity": "epic", "equip_slot": "body", "buy_price": 1500, "sell_price": 750, "stackable": 0, "max_stack": 1, "tradeable": 1, "weight": 12, "metadata": { "stats": { "defense": 25, "mp": 20 }, "crafting": { "materials": { "hydra_scale": 5, "swamp_gas_vial": 2, "iron_ore": 3 } } } },
  { "code": "mahkota_griffin", "name": "Mahkota Griffin", "description": "Hiasan kepala lambang kebebasan.", "category": "armor", "rarity": "rare", "equip_slot": "head", "buy_price": 700, "sell_price": 350, "stackable": 0, "max_stack": 1, "tradeable": 1, "weight": 2, "metadata": { "stats": { "defense": 10, "speed": 15 }, "crafting": { "materials": { "griffin_claw": 2, "harpy_feather": 3 } } } },
  { "code": "kalung_tengkorak", "name": "Kalung Tengkorak Goblin", "description": "Menakutkan tapi berkhasiat sihir.", "category": "accessory", "rarity": "uncommon", "equip_slot": "accessory", "buy_price": 300, "sell_price": 150, "stackable": 0, "max_stack": 1, "tradeable": 1, "weight": 1, "metadata": { "stats": { "attack": 5 }, "crafting": { "materials": { "goblin_ear": 5, "reeds": 2 } } } },
`;

content = content.replace(/(?=\];\n\nexport const WORLD_MONSTERS)/, newItemsStr);

// MODIFY UPGRADES 
// steel_sword (if exists, wait let's use broad replaces)
// Since we don't know the exact weapon names except iron_sword, excalibur, etc. 
// We will modify some specific weapons by searching them in AST or string.

function modifyWeaponCost(content, weaponCode, gemName, levelTarget) {
    let regex = new RegExp('("code": "' + weaponCode + '"[^]*?"upgrade": {[\\s\\S]*?"cost": \\[)([\\s\\S]*?)(\\])');
    let match = content.match(regex);
    if (match) {
        let costArrayStr = match[2];
        try {
            let costArray = JSON.parse("[" + costArrayStr + "]");
            costArray.forEach(lvl => {
                if (lvl.level === levelTarget) lvl.materials[gemName] = 1;
            });
            let newCostStr = JSON.stringify(costArray).slice(1, -1);
            return content.replace(costArrayStr, newCostStr);
        } catch(e) { }
    }
    return content;
}

content = modifyWeaponCost(content, "iron_sword", "copper_ore", 2);
content = modifyWeaponCost(content, "iron_sword", "mythril_ore", 5);
content = modifyWeaponCost(content, "excalibur", "glacial_shard", 4);
content = modifyWeaponCost(content, "excalibur", "lava_rock", 5);
content = modifyWeaponCost(content, "aegis_of_dawn", "abyssal_pearl", 5);

fs.writeFileSync('db/seed-world.js', content, 'utf-8');
console.log("Massive injection complete.");
