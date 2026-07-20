import Database from 'better-sqlite3';
const db = new Database('data/rpg.db');

const PETS = [
    { code: 'pet_baby_dragon', stats: { attack: 25, max_hp: 50 } },
    { code: 'pet_white_wolf', stats: { attack: 15, speed: 20 } },
    { code: 'pet_chocobo', stats: { speed: 35, max_hp: 20 } },
    { code: 'pet_slime', stats: { max_hp: 100, defense: 10 } },
    { code: 'pet_eagle', stats: { speed: 15, attack: 10, max_mp: 30 } }
];

PETS.forEach(pet => {
    db.prepare(`UPDATE items SET equip_slot = 'pet', metadata = ? WHERE code = ?`).run(JSON.stringify({ stats: pet.stats }), pet.code);
});

console.log("Existing pets patched!");
