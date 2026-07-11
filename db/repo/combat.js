/**
 * db/repo/combat.js
 * -----------------
 * Combat dasar untuk !hunt — auto-battle beberapa ronde (bukan turn-based
 * interaktif kayak !dungeon Orion, itu menyusul di Fase 5). HP karakter
 * PERSISTEN antar pertarungan (sama seperti Orion: kalah = HP kepotong
 * beneran, harus pulih dulu sebelum hunt lagi kalau mepet).
 */
import { getRandomMonsterForLevel } from "./monsters.js";
import { addCash } from "./economy.js";
import { gainXp } from "./progression.js";
import { addItem } from "./items.js";

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Damage dengan sedikit randomness (0.85x - 1.15x), minimal 1. */
function rollDamage(attack, defense) {
  const base = Math.max(1, attack - defense * 0.5);
  const variance = 0.85 + Math.random() * 0.3;
  return Math.max(1, Math.round(base * variance));
}

/**
 * Simulasi pertarungan HP-vs-HP sampai salah satu tumbang (maks 20 ronde
 * biar tidak infinite loop kalau statnya berimbang aneh).
 */
function simulateBattle({ playerHp, playerAttack, playerDefense, monster }) {
  let pHp = playerHp;
  let mHp = monster.hp;
  const log = [];
  let rounds = 0;

  while (pHp > 0 && mHp > 0 && rounds < 20) {
    rounds++;
    const dmgToMonster = rollDamage(playerAttack, monster.defense);
    mHp -= dmgToMonster;
    if (mHp <= 0) {
      log.push(`Ronde ${rounds}: kamu menghabisi sisa HP ${monster.name} (-${dmgToMonster} HP).`);
      break;
    }

    const dmgToPlayer = rollDamage(monster.attack, playerDefense);
    pHp -= dmgToPlayer;
    log.push(`Ronde ${rounds}: kamu -${dmgToMonster} HP musuh, ${monster.name} balas -${dmgToPlayer} HP ke kamu.`);
  }

  return {
    win: mHp <= 0 && pHp > 0,
    playerHpLeft: Math.max(0, pHp),
    monsterHpLeft: Math.max(0, mHp),
    rounds,
    log,
  };
}

/**
 * @returns {{ win: boolean, monster: object, log: string[], cashEarned: number,
 *             xpEarned: number, lootedItems: {name:string, qty:number}[],
 *             levelUp: object, character: object }}
 */
export function resolveHunt(db, userId) {
  const apply = db.transaction(() => {
    const character = db.prepare(`SELECT * FROM characters WHERE user_id = ?`).get(userId);
    const leveling = db.prepare(`SELECT level FROM leveling WHERE user_id = ?`).get(userId);

    const monster = getRandomMonsterForLevel(db, leveling.level);
    if (!monster) throw new Error("Tidak ada monster yang cocok untuk level kamu saat ini.");

    if (character.hp <= 0) {
      throw new Error("HP kamu habis! Pulihkan dulu (gunakan potion / tunggu regen) sebelum berburu lagi.");
    }

    const battle = simulateBattle({
      playerHp: character.hp,
      playerAttack: character.attack,
      playerDefense: character.defense,
      monster,
    });

    // HP persisten — kurang di kedua kasus (menang tetap kena damage).
    db.prepare(`UPDATE characters SET hp = ? WHERE user_id = ?`).run(
      Math.max(1, battle.playerHpLeft), // tidak dibiarkan mati total di sini, biar tidak butuh state "KO" dulu di Fase 1
      userId
    );

    let cashEarned = 0;
    let xpEarned = 0;
    let levelUp = null;
    const lootedItems = [];

    if (battle.win) {
      cashEarned = randomInt(monster.cash_min, monster.cash_max);
      xpEarned = monster.xp_reward;

      addCash(db, userId, cashEarned, { type: "hunt", note: `hunt ${monster.code}` });
      levelUp = gainXp(db, userId, xpEarned);

      for (const drop of monster.loot_table) {
        if (Math.random() < drop.chance) {
          const qty = randomInt(drop.qty_min, drop.qty_max);
          const item = addItem(db, userId, drop.item_code, qty);
          lootedItems.push({ name: item.name, qty });
        }
      }
    }

    const finalCharacter = db.prepare(`SELECT * FROM characters WHERE user_id = ?`).get(userId);

    return {
      win: battle.win,
      monster,
      log: battle.log,
      cashEarned,
      xpEarned,
      lootedItems,
      levelUp,
      character: finalCharacter,
    };
  });

  return apply();
}