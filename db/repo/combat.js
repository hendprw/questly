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
import { addItem, getInventory } from "./items.js";

/** 
 * Menghitung stat akhir karakter ditambah dengan bonus dari equipment yang dipakai.
 */
export function calculateBattleStats(db, userId) {
  const character = db.prepare(`SELECT * FROM characters WHERE user_id = ?`).get(userId);
  if (!character) throw new Error("Karakter tidak ditemukan.");

  const stats = {
      hp: character.hp,
      maxHp: character.max_hp,
      mp: character.mp,
      maxMp: character.max_mp,
      attack: character.attack,
      defense: character.defense,
      speed: character.speed,
      passives: []
  };

  const equipped = db.prepare(`
      SELECT eq.slot, it.metadata 
      FROM equipment eq
      JOIN inventory inv ON inv.id = eq.inventory_id
      JOIN items it ON it.id = inv.item_id
      WHERE eq.user_id = ?
  `).all(userId);

  for (const item of equipped) {
      if (item.metadata) {
          const meta = JSON.parse(item.metadata);
          if (meta.stats) {
              if (meta.stats.attack) stats.attack += meta.stats.attack;
              if (meta.stats.defense) stats.defense += meta.stats.defense;
              if (meta.stats.speed) stats.speed += meta.stats.speed;
              if (meta.stats.max_hp) stats.maxHp += meta.stats.max_hp;
              if (meta.stats.max_mp) stats.maxMp += meta.stats.max_mp;
          }
          if (meta.passive) {
              stats.passives.push(meta.passive);
          }
      }
  }

  // Class Passives
  if (character.class === 'ksatria') stats.defense += Math.floor(stats.defense * 0.2); // +20% Def
  if (character.class === 'pemanah') stats.attack += Math.floor(stats.attack * 0.15); // +15% Atk
  if (character.class === 'assassin') stats.speed += Math.floor(stats.speed * 0.25); // +25% Speed
  if (character.class === 'penyihir') stats.maxMp += Math.floor(stats.maxMp * 0.3); // +30% MP

  return stats;
}

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

/**
 * Simulasi PVP 1v1 dengan kalkulasi Speed dan Defense.
 */
export function simulatePvpBattle(playerA, playerB) {
  let hpA = playerA.stats.maxHp; // di arena, asumsikan bertarung dengan full maxHp atau current HP?
  let hpB = playerB.stats.maxHp; // Kita gunakan maxHp agar adil dan tidak perlu repot healing dulu
  const log = [];
  let rounds = 0;

  let first = playerA;
  let second = playerB;

  if (playerB.stats.speed > playerA.stats.speed || (playerB.stats.speed === playerA.stats.speed && Math.random() > 0.5)) {
    first = playerB;
    second = playerA;
  }

  let firstHp = first.stats.maxHp;
  let secondHp = second.stats.maxHp;

  log.push(`⚡ *${first.name}* bergerak lebih cepat dan menyerang duluan!`);

  while (firstHp > 0 && secondHp > 0 && rounds < 20) {
    rounds++;
    const dmgToSecond = rollDamage(first.stats.attack, second.stats.defense);
    secondHp -= dmgToSecond;
    
    if (secondHp <= 0) {
      log.push(`Ronde ${rounds}: 💥 *${first.name}* menebas dengan *${dmgToSecond}* DMG! *${second.name}* tumbang!`);
      break;
    }

    const dmgToFirst = rollDamage(second.stats.attack, first.stats.defense);
    firstHp -= dmgToFirst;
    
    if (firstHp <= 0) {
      log.push(`Ronde ${rounds}: 💥 *${first.name}* menyerang (*${dmgToSecond}* DMG), tapi *${second.name}* membalas telak dengan *${dmgToFirst}* DMG dan memenangkan duel!`);
      break;
    }
    
    log.push(`Ronde ${rounds}: ⚔️ *${first.name}* (-${dmgToSecond} HP musuh) | *${second.name}* membalas (-${dmgToFirst} HP musuh)`);
  }

  // Jika seri karena ronde habis, yang HP persentasenya banyakan menang
  let winner = first;
  let loser = second;

  if (firstHp <= 0) {
    winner = second;
    loser = first;
  } else if (secondHp <= 0) {
    winner = first;
    loser = second;
  } else {
    // Tie breaker
    const pFirst = firstHp / first.stats.maxHp;
    const pSecond = secondHp / second.stats.maxHp;
    if (pSecond > pFirst) {
      winner = second;
      loser = first;
      log.push(`⏱️ Waktu habis! *${second.name}* menang berkat sisa HP yang lebih banyak.`);
    } else {
      log.push(`⏱️ Waktu habis! *${first.name}* menang berkat sisa HP yang lebih banyak.`);
    }
  }

  return {
    winner,
    loser,
    log,
    rounds
  };
}