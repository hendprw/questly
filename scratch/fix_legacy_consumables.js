import Database from 'better-sqlite3';
const db = new Database('data/rpg.db');

const items = db.prepare('SELECT * FROM items').all();

let updated = 0;

items.forEach(i => {
    let meta = {};
    if (i.metadata) {
        try { meta = JSON.parse(i.metadata); } catch(e){}
    }
    
    let needsUpdate = false;
    
    // 1. Fix Legacy Consumables
    if (i.category === 'consumable' && (!meta.usable)) {
        meta.usable = {};
        
        let note = meta.effect_note || i.description || "";
        note = note.toLowerCase();
        
        let hpMatch = note.match(/memulihkan (\\d+) hp/);
        let staminaMatch = note.match(/(\\d+) stamina/);
        let mpMatch = note.match(/(\\d+) mp/);
        
        if (hpMatch) meta.usable.heal_hp = parseInt(hpMatch[1]);
        else if (note.includes("darah") || note.includes("nyawa") || note.includes("kesehatan") || note.includes("pemulih")) {
            meta.usable.heal_hp = i.rarity === 'common' ? 20 : i.rarity === 'uncommon' ? 50 : 100;
        } else {
            // Default food/drink
            meta.usable.heal_hp = 15; 
        }
        
        if (staminaMatch) meta.usable.heal_stamina = parseInt(staminaMatch[1]);
        if (mpMatch) meta.usable.heal_mp = parseInt(mpMatch[1]);
        if (note.includes("mana")) meta.usable.heal_mp = i.rarity === 'common' ? 20 : 50;
        
        needsUpdate = true;
    }
    
    // 2. Fix Pure Junk
    const junkMap = {
        'old_boot': { heal_stamina: -5 }, // bau, ngurangin stamina lol
        'rusty_can': { heal_hp: -5 }, // bahaya tetanus
        'bottle_message': { xp: 10 }, // dapat wawasan
        'sunken_coin': { cash: 500 }, // dapat duit
        'frozen_tear': { heal_mp: 20 },
        'dragon_scale_fragment': { heal_hp: 25, heal_stamina: 25 }
    };
    
    if (junkMap[i.code]) {
        meta.usable = junkMap[i.code];
        needsUpdate = true;
    }

    if (needsUpdate) {
        db.prepare('UPDATE items SET metadata = ? WHERE code = ?').run(JSON.stringify(meta), i.code);
        updated++;
    }
});

console.log("Fixed " + updated + " legacy items & junk in database!");
