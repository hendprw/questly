/**
 * db/repo/progression.js
 * ----------------------
 * Porting dari utils/progression.js (Orion RPG). Menggabungkan addXp
 * (db/repo/leveling.js) dengan efek RPG saat naik level: rank tier,
 * stat growth sesuai class, dan auto-unlock skill dari skill_tree class
 * + skill umum yang punya level_requirement.
 *
 * Sengaja dipisah dari leveling.js supaya leveling.js tetap generik
 * (dipakai juga oleh sistem non-RPG kalau ada), sementara progression.js
 * ini spesifik RPG (butuh tabel characters/classes/skills).
 */
import { addXp, xpToNextLevel } from "./leveling.js";
import { getClass } from "./classes.js";

// Porting RANKS dari Orion — tier gelar berdasarkan level.
const RANKS = [
  { name: "Wanderer", level: 1 },
  { name: "Iron Recruit", level: 10 },
  { name: "Steel Vanguard", level: 25 },
  { name: "Silver Knight", level: 40 },
  { name: "Elite Gladiator", level: 60 },
  { name: "Paladin of Light", level: 80 },
  { name: "Continental Conqueror", level: 100 },
  { name: "Hand of the King", level: 125 },
  { name: "Aether Walker", level: 150 },
  { name: "Ascendant", level: 175 },
  { name: "God of War", level: 200 },
];

export function getRank(level) {
  let current = RANKS[0].name;
  for (const r of RANKS) {
    if (level >= r.level) current = r.name;
    else break;
  }
  return current;
}

/**
 * Tambah XP + terapkan semua efek RPG kalau naik level (bisa multi-level
 * sekaligus kalau XP besar, sama seperti Orion pakai `while`).
 *
 * @returns {{ leveledUp: boolean, levelsGained: number, messages: string[], leveling: object, character: object }}
 */
export function gainXp(db, userId, amount) {
  const apply = db.transaction(() => {
    const messages = [];
    const result = addXp(db, userId, amount);

    let character = db.prepare(`SELECT * FROM characters WHERE user_id = ?`).get(userId);
    const cls = character.class ? getClass(db, character.class) : null;
    const growth = cls?.stat_growth || { max_hp: 10, max_mana: 5, attack: 2, defense: 1, speed: 0 };

    if (result.leveledUp) {
      // Terapkan stat_growth SEKALI PER LEVEL yang didapat (bukan sekali borongan),
      // supaya hasilnya identik dengan naik level satu-satu seperti di Orion.
      for (let i = 0; i < result.levelsGained; i++) {
        db.prepare(
          `UPDATE characters
              SET max_hp = max_hp + ?, max_mp = max_mp + ?,
                  attack = attack + ?, defense = defense + ?, speed = speed + ?
            WHERE user_id = ?`
        ).run(
          growth.max_hp || 0, growth.max_mana || 0,
          growth.attack || 0, growth.defense || 0, growth.speed || 0,
          userId
        );
      }

      // Full heal setiap kali level up (konsisten dengan Orion).
      db.prepare(
        `UPDATE characters SET hp = max_hp, mp = max_mp WHERE user_id = ?`
      ).run(userId);
      character = db.prepare(`SELECT * FROM characters WHERE user_id = ?`).get(userId);

      messages.push(`🎉 *LEVEL UP!* Kamu sekarang Level ${result.after.level}!`);

      // Unlock skill dari skill_tree class di level yang baru dicapai.
      const unlockSkill = db.prepare(
        `INSERT OR IGNORE INTO user_skills (user_id, skill_code) VALUES (?, ?)`
      );
      const getSkill = db.prepare(`SELECT * FROM skills WHERE code = ?`);

      for (let lvl = result.before.level + 1; lvl <= result.after.level; lvl++) {
        if (cls?.skill_tree?.[String(lvl)]) {
          const skillCode = cls.skill_tree[String(lvl)];
          const already = db.prepare(`SELECT 1 FROM user_skills WHERE user_id = ? AND skill_code = ?`).get(userId, skillCode);
          if (!already) {
            unlockSkill.run(userId, skillCode);
            const skill = getSkill.get(skillCode);
            if (skill) messages.push(`🌟 *Skill Class Baru: ${skill.name}*`);
          }
        }

        // Skill umum (class_code NULL) yang level_requirement-nya persis lvl ini.
        const generalSkills = db
          .prepare(`SELECT * FROM skills WHERE class_code IS NULL AND level_requirement = ?`)
          .all(lvl);
        for (const skill of generalSkills) {
          const already = db.prepare(`SELECT 1 FROM user_skills WHERE user_id = ? AND skill_code = ?`).get(userId, skill.code);
          if (!already) {
            unlockSkill.run(userId, skill.code);
            messages.push(`🌟 *Skill Umum Baru: ${skill.name}*`);
          }
        }
      }

      // Rank up.
      const newRank = getRank(result.after.level);
      const levelingRow = db.prepare(`SELECT rank FROM leveling WHERE user_id = ?`).get(userId);
      if (levelingRow.rank !== newRank) {
        db.prepare(`UPDATE leveling SET rank = ? WHERE user_id = ?`).run(newRank, userId);
        messages.push(`🏆 *RANK UP!* Kamu mencapai peringkat "${newRank}"!`);
      }
    }

    return {
      leveledUp: result.leveledUp,
      levelsGained: result.levelsGained,
      messages,
      leveling: db.prepare(`SELECT * FROM leveling WHERE user_id = ?`).get(userId),
      character,
    };
  });

  return apply();
}

export { xpToNextLevel };