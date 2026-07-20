/**
 * db/seed-rpg.js
 * --------------
 * Data master untuk sistem RPG (Fase 1 porting dari Orion RPG):
 * class (dulu "job" RPG di Orion), skill, monster.
 *
 * Dipisah dari db/seed.js (yang isinya job EKONOMI + item toko) supaya
 * tidak numpuk satu file dan gampang di-maintain per domain.
 */

const CLASSES = [
  {
    code: "pejuang",
    name: "Pejuang",
    description: "Ahli pertempuran jarak dekat dengan kekuatan fisik dan pertahanan superior.",
    base_bonus: { max_hp: 20, attack: 5, defense: 5, passive_trait: { skill: "mining", bonus: 0.2, desc: "+20% hasil tambang" } },
    stat_growth: { max_hp: 15, attack: 3, defense: 2 },
    skill_tree: { "10": "heavy_strike", "20": "taunt" },
  },
  {
    code: "penyihir",
    name: "Penyihir",
    description: "Perapal mantra yang mengandalkan mana dan serangan sihir jarak jauh.",
    base_bonus: { max_mana: 30, attack: 3, passive_trait: { skill: "crafting", bonus: 0.15, desc: "+15% sukses craft/alchemy" } },
    stat_growth: { max_mana: 10, attack: 4, max_hp: 6 },
    skill_tree: { "10": "fireball", "20": "mana_shield" },
  },
  {
    code: "pemanah",
    name: "Pemanah",
    description: "Serangan jarak jauh presisi tinggi dengan kecepatan di atas rata-rata.",
    base_bonus: { attack: 4, speed: 5, passive_trait: { skill: "hunting", bonus: 0.2, desc: "+20% hasil buruan & panen" } },
    stat_growth: { attack: 3, speed: 2, max_hp: 8 },
    skill_tree: { "10": "aimed_shot", "20": "double_shot" },
  },
  {
    code: "assassin",
    name: "Assassin",
    description: "Pembunuh bayaran yang bergerak cepat dan mematikan dalam kegelapan.",
    base_bonus: { attack: 7, speed: 7, max_hp: 5, passive_trait: { skill: "loot_and_thief", bonus: 0.15, desc: "+10% Rare Drop & +15% Insting Copet" } },
    stat_growth: { attack: 5, speed: 3, max_hp: 5 },
    skill_tree: { "10": "shadow_strike", "20": "evasion" },
  },
  {
    code: "paladin",
    name: "Paladin",
    description: "Ksatria suci dengan pertahanan tak tertembus, namun serangan yang lebih lambat.",
    base_bonus: { max_hp: 30, defense: 10, attack: 2, passive_trait: { skill: "discount", bonus: 0.1, desc: "Diskon pajak market 10%" } },
    stat_growth: { max_hp: 20, defense: 4, attack: 1 },
    skill_tree: { "10": "holy_shield", "20": "heal" },
  },
];

const SKILLS = [
  { code: "heavy_strike", name: "Heavy Strike", description: "Serangan berat, damage 180% attack.", class_code: "pejuang", level_requirement: 10, mana_cost: 0, cooldown_seconds: 30, effect: { type: "damage", multiplier: 1.8 } },
  { code: "taunt", name: "Taunt", description: "Menaikkan defense sementara di pertarungan berikutnya.", class_code: "pejuang", level_requirement: 20, mana_cost: 0, cooldown_seconds: 60, effect: { type: "buff", stat: "defense", multiplier: 1.3, duration: 1 } },
  { code: "fireball", name: "Fireball", description: "Serangan sihir, damage 200% attack, makan mana.", class_code: "penyihir", level_requirement: 10, mana_cost: 15, cooldown_seconds: 20, effect: { type: "damage", multiplier: 2.0 } },
  { code: "mana_shield", name: "Mana Shield", description: "Menyerap sebagian damage masuk dengan mana.", class_code: "penyihir", level_requirement: 20, mana_cost: 20, cooldown_seconds: 45, effect: { type: "shield", absorb_ratio: 0.3, duration: 1 } },
  { code: "aimed_shot", name: "Aimed Shot", description: "Serangan presisi, damage 170% attack, jarang meleset.", class_code: "pemanah", level_requirement: 10, mana_cost: 0, cooldown_seconds: 25, effect: { type: "damage", multiplier: 1.7 } },
  { code: "double_shot", name: "Double Shot", description: "Menembak dua kali berturut-turut.", class_code: "pemanah", level_requirement: 20, mana_cost: 0, cooldown_seconds: 40, effect: { type: "multi_hit", hits: 2, multiplier: 0.9 } },
  { code: "shadow_strike", name: "Shadow Strike", description: "Serangan mematikan menembus defense 50%.", class_code: "assassin", level_requirement: 10, mana_cost: 0, cooldown_seconds: 25, effect: { type: "pierce", multiplier: 1.5, pierce_ratio: 0.5 } },
  { code: "evasion", name: "Evasion", description: "Menaikkan speed drastically untuk menghindar.", class_code: "assassin", level_requirement: 20, mana_cost: 0, cooldown_seconds: 60, effect: { type: "buff", stat: "speed", multiplier: 2.0, duration: 1 } },
  { code: "holy_shield", name: "Holy Shield", description: "Meningkatkan defense drastis.", class_code: "paladin", level_requirement: 10, mana_cost: 0, cooldown_seconds: 40, effect: { type: "buff", stat: "defense", multiplier: 1.5, duration: 2 } },
  { code: "heal", name: "Heal", description: "Memulihkan HP sebesar 150% attack stat.", class_code: "paladin", level_requirement: 20, mana_cost: 10, cooldown_seconds: 30, effect: { type: "heal", multiplier: 1.5 } },
  { code: "divine_retribution", name: "Divine Retribution", description: "Hukuman dewa dengan damage mutlak 300% attack. (Eksklusif Hero)", class_code: "all", level_requirement: 1, mana_cost: 50, cooldown_seconds: 120, effect: { type: "damage", multiplier: 3.0 } },
  { code: "aegis_of_light", name: "Aegis of Light", description: "Perisai cahaya yang memblokir semua damage (Absorb 100%). (Eksklusif Hero)", class_code: "all", level_requirement: 1, mana_cost: 60, cooldown_seconds: 150, effect: { type: "shield", absorb_ratio: 1.0, duration: 1 } },
  // skill umum, tidak terikat class (class_code NULL)
  { code: "second_wind", name: "Second Wind", description: "Pulihkan sedikit HP di awal pertarungan.", class_code: null, level_requirement: 15, mana_cost: 0, cooldown_seconds: 0, effect: { type: "heal_on_start", percent: 0.1 } },
];

const MONSTERS = [
  { code: "wolf", name: "Serigala", min_level: 5, max_level: 15, hp: 70, attack: 13, defense: 4, xp_reward: 40, cash_min: 70, cash_max: 200, loot_table: [] },
  { code: "orc", name: "Orc Prajurit", min_level: 10, max_level: 25, hp: 120, attack: 20, defense: 8, xp_reward: 70, cash_min: 120, cash_max: 350, loot_table: [{ item_code: "iron_ore", chance: 0.25, qty_min: 1, qty_max: 3 }] },
  { code: "troll", name: "Troll Gua", min_level: 20, max_level: 40, hp: 220, attack: 32, defense: 14, xp_reward: 140, cash_min: 250, cash_max: 700, loot_table: [{ item_code: "gold_ore", chance: 0.1, qty_min: 1, qty_max: 1 }] },
  { code: "dark_knight", name: "Ksatria Kegelapan", min_level: 35, max_level: 60, hp: 400, attack: 55, defense: 25, xp_reward: 300, cash_min: 500, cash_max: 1500, loot_table: [{ item_code: "iron_sword", chance: 0.05, qty_min: 1, qty_max: 1 }] },
];


/** @param {import('better-sqlite3').Database} db */
export function seedRpgContent(db) {
  const insertClass = db.prepare(`
    INSERT OR IGNORE INTO classes (code, name, description, base_bonus, stat_growth, skill_tree)
    VALUES (@code, @name, @description, @base_bonus, @stat_growth, @skill_tree)
  `);
  const insertSkill = db.prepare(`
    INSERT OR IGNORE INTO skills (code, name, description, class_code, level_requirement, mana_cost, cooldown_seconds, effect)
    VALUES (@code, @name, @description, @class_code, @level_requirement, @mana_cost, @cooldown_seconds, @effect)
  `);
  const insertMonster = db.prepare(`
    INSERT OR IGNORE INTO monsters (code, name, min_level, max_level, hp, attack, defense, xp_reward, cash_min, cash_max, loot_table)
    VALUES (@code, @name, @min_level, @max_level, @hp, @attack, @defense, @xp_reward, @cash_min, @cash_max, @loot_table)
  `);

  const runAll = db.transaction(() => {
    for (const c of CLASSES) {
      insertClass.run({
        ...c,
        base_bonus: JSON.stringify(c.base_bonus),
        stat_growth: JSON.stringify(c.stat_growth),
        skill_tree: JSON.stringify(c.skill_tree),
      });
    }
    for (const s of SKILLS) {
      insertSkill.run({ ...s, effect: JSON.stringify(s.effect) });
    }
    for (const m of MONSTERS) {
      insertMonster.run({ ...m, loot_table: JSON.stringify(m.loot_table) });
    }
  });

  runAll();
}