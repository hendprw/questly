import { calculateBattleStats } from "../../db/repo/combat.js";
import { addXp } from "../../db/repo/leveling.js";
import { addCash } from "../../db/repo/economy.js";
import { addItem } from "../../db/repo/items.js";
import { WORLD_DUNGEONS } from "../../db/seed-world.js";
import { getRemainingCooldown, setCooldown, formatDuration } from "../../db/repo/cooldowns.js";

function getMonster(db, monsterId) {
    return db.prepare(`SELECT * FROM monsters WHERE code = ?`).get(monsterId);
}

function parseJSON(str, def) {
    try { return JSON.parse(str); } catch { return def; }
}

export default function (bot) {
  bot.command("dungeon", async (ctx) => {
      const db = bot.db;
      const userId = ctx.dbUser.id;
      const subCmd = ctx.args[0]?.toLowerCase();

      if (!subCmd || subCmd === 'list') {
          let listMsg = '*--- Daftar Dungeon Tersedia ---*\n\n';
          for (const id in WORLD_DUNGEONS) {
              const dg = WORLD_DUNGEONS[id];
              listMsg += `*${dg.name}* (Lv. ${dg.levelRequirement})\n_${dg.description}_\nID: \`${id}\`\n\n`;
          }
          listMsg += "Gunakan `!dungeon enter <id>` untuk masuk.";
          return ctx.reply(listMsg);
      }

      // Transaksi untuk Sinkronisasi DB
      const runDungeon = db.transaction(() => {
          const character = db.prepare(`SELECT * FROM characters WHERE user_id = ?`).get(userId);
          const battleInfo = parseJSON(character.battle_info, {});
          const dungeonInfo = parseJSON(character.dungeon_info, {});

          if (battleInfo.inBattle) {
              return { type: "error", text: "Kamu tidak bisa masuk dungeon saat sedang dalam pertarungan biasa!" };
          }

          if (subCmd === 'enter') {
              const dungeonId = ctx.args[1];
              const dungeon = WORLD_DUNGEONS[dungeonId];
              
              if (!dungeon) return { type: "error", text: "Dungeon tidak ditemukan. Ketik `!dungeon list`" };
              if (character.level < dungeon.levelRequirement) return { type: "error", text: `Kamu butuh minimal Lv. ${dungeon.levelRequirement} untuk masuk.` };
              if (dungeonInfo.dungeonId) return { type: "error", text: `Kamu sudah berada di dalam *${WORLD_DUNGEONS[dungeonInfo.dungeonId].name}*. Selesaikan atau \`!dungeon leave\`.` };

              const remainingCd = getRemainingCooldown(db, userId, "dungeon_enter");
              if (remainingCd > 0) {
                  return { type: "error", text: `Kamu masih kelelahan. Tunggu *${formatDuration(remainingCd)}* lagi untuk masuk dungeon.` };
              }
              setCooldown(db, userId, "dungeon_enter", 3600); // 1 jam cooldown
              
              const firstMonsterId = dungeon.monsters[0];
              const monsterDef = getMonster(db, firstMonsterId);

              const newDungeonInfo = {
                  dungeonId: dungeonId,
                  floor: 1,
                  monsterId: firstMonsterId,
                  monsterHp: monsterDef.hp,
                  turn: 0,
                  abilityUsed: false,
                  minions: []
              };
              
              db.prepare(`UPDATE characters SET dungeon_info = ? WHERE user_id = ?`).run(JSON.stringify(newDungeonInfo), userId);
              return { type: "ongoing", text: `Kamu memasuki gerbang gelap *${dungeon.name}*...\nLantai 1 menantimu.` };
          }

          if (!dungeonInfo.dungeonId) {
              return { type: "error", text: "Kamu tidak sedang berada di dalam dungeon." };
          }

          const dungeon = WORLD_DUNGEONS[dungeonInfo.dungeonId];
          if (subCmd === 'leave') {
              if (dungeonInfo.monsterHp > 0 && dungeonInfo.turn > 0) {
                  return { type: "error", text: "❌ Pintu keluar tertutup! Kamu tidak bisa kabur saat monster sedang menyerangmu. Habisi dia atau relakan nyawamu!" };
              }
              db.prepare(`UPDATE characters SET dungeon_info = '{}' WHERE user_id = ?`).run(userId);
              return { type: "end", text: `Kamu berlari meninggalkan *${dungeon.name}* dengan ketakutan. Sisa HP-mu adalah ${character.hp}.` };
          }

          if (subCmd === 'attack' || subCmd === 'skill') {
              const stats = calculateBattleStats(db, userId);
              let monster = getMonster(db, dungeonInfo.monsterId);
              let monsterCurrentHp = dungeonInfo.monsterHp;
              let currentActionLog = [];
              let playerDamage = 0;

              if (subCmd === 'attack') {
                  playerDamage = Math.max(1, stats.attack - (monster.defense || 0));
                  currentActionLog.push(`💥 Kamu menyerang *${monster.name}* (${playerDamage} DMG).`);
              } else if (subCmd === 'skill') {
                  const skillId = ctx.args[1];
                  if (!skillId) return { type: "error", text: "Sebutkan skill. Contoh: `!dungeon skill slash`" };
                  
                  const userSkill = db.prepare(`SELECT * FROM user_skills us JOIN skills s ON us.skill_code = s.code WHERE us.user_id = ? AND s.code = ?`).get(userId, skillId);
                  if (!userSkill) return { type: "error", text: `Kamu tidak memiliki skill \`${skillId}\`.` };
                  if (character.mp < userSkill.mana_cost) return { type: "error", text: `Mana tidak cukup! Butuh ${userSkill.mana_cost} MP.` };
                  
                  const cds = parseJSON(character.skill_cooldowns, {});
                  if (cds[skillId] && Date.now() < cds[skillId]) return { type: "error", text: `Skill *${userSkill.name}* masih cooldown!` };
                  
                  db.prepare(`UPDATE characters SET mp = mp - ? WHERE user_id = ?`).run(userSkill.mana_cost, userId);
                  cds[skillId] = Date.now() + (userSkill.cooldown_seconds * 1000);
                  db.prepare(`UPDATE characters SET skill_cooldowns = ? WHERE user_id = ?`).run(JSON.stringify(cds), userId);
                  
                  playerDamage = Math.max(1, Math.floor(stats.attack * 2.5) - (monster.defense || 0));
                  currentActionLog.push(`✨ Kamu menggunakan *${userSkill.name}* ke *${monster.name}* (${playerDamage} DMG).`);
              }

              monsterCurrentHp -= playerDamage;

              const totalFloors = dungeon.monsters.length + 1; // + 1 untuk boss

              // Jika Monster Mati
              if (monsterCurrentHp <= 0) {
                  dungeonInfo.floor++;
                  dungeonInfo.turn = 0;
                  dungeonInfo.abilityUsed = false;
                  dungeonInfo.minions = [];

                  if (dungeonInfo.floor > totalFloors) { // BOSS MATI = DUNGEON CLEAR
                      const leveled = addXp(db, userId, dungeon.rewards.exp);
                      let rewardAester = dungeon.rewards.aester;
                      if (stats.passives && stats.passives.includes('gold')) {
                          rewardAester = Math.floor(rewardAester * 1.3); // +30%
                      }
                      addCash(db, userId, rewardAester, { note: `Clear Dungeon ${dungeon.name}` });
                      
                      let rewardMsg = `*SELAMAT! Kamu telah menaklukkan ${dungeon.name}!* 🎉\n\n*Hadiah:*\n✨ *+${dungeon.rewards.exp}* EXP\n🪙 *+${rewardAester}* Aester`;
                      
                      for (const itemKey in dungeon.rewards.items) {
                          if (Math.random() < dungeon.rewards.items[itemKey]) {
                              addItem(db, userId, itemKey, 1);
                              rewardMsg += `\n🎁 *+1* ${itemKey}`;
                          }
                      }
                      
                      if (leveled && leveled.leveledUp) rewardMsg += `\n\n🎉 Kamu naik ke *Level ${leveled.after.level}*!`;

                      db.prepare(`UPDATE characters SET dungeon_info = '{}' WHERE user_id = ?`).run(userId);
                      return { type: "end", text: rewardMsg };
                  } else {
                      // LANJUT LANTAI BERIKUTNYA
                      const nextMonsterId = (dungeonInfo.floor <= dungeon.monsters.length) ? dungeon.monsters[dungeonInfo.floor - 1] : dungeon.boss;
                      const nextMonsterDef = getMonster(db, nextMonsterId);
                      
                      dungeonInfo.monsterId = nextMonsterId;
                      dungeonInfo.monsterHp = nextMonsterDef.hp;
                      db.prepare(`UPDATE characters SET dungeon_info = ? WHERE user_id = ?`).run(JSON.stringify(dungeonInfo), userId);
                      
                      return { type: "ongoing", text: `💀 *${monster.name}* hancur!\nLantai ${dungeonInfo.floor - 1} berhasil dilewati! Sisa HP: ${character.hp}.\nMenyiapkan lantai ${dungeonInfo.floor}...` };
                  }
              }

              // Giliran Monster Utama
              const monsterDamage = Math.max(1, (monster.attack || 1) - stats.defense);
              let totalMonsterDmg = monsterDamage;
              currentActionLog.push(`🩸 *${monster.name}* menyerangmu (${monsterDamage} DMG).`);

              // Giliran Minion (Jika ada boss summon)
              if (dungeonInfo.minions && dungeonInfo.minions.length > 0) {
                 const minionDef = getMonster(db, dungeonInfo.minions[0]);
                 const minionDmg = Math.max(1, (minionDef.attack || 1) - stats.defense) * dungeonInfo.minions.length;
                 totalMonsterDmg += minionDmg;
                 currentActionLog.push(`🩸 Pasukan *${minionDef.name}* menyerangmu (${minionDmg} DMG total).`);
              }

              // Simpan damage ke Player
              db.prepare(`UPDATE characters SET hp = hp - ? WHERE user_id = ?`).run(totalMonsterDmg, userId);
              // CEK KEMATIAN PEMAIN
              let currentHp = db.prepare(`SELECT hp FROM characters WHERE user_id = ?`).get(userId).hp;
              if (currentHp <= 0) {
                  // Brutal mechanic: Hapus semua inventory yang TIDAK dipakai
                  db.prepare(`DELETE FROM inventory WHERE user_id = ? AND is_equipped = 0`).run(userId);
                  db.prepare(`UPDATE characters SET hp = 1, dungeon_info = '{}' WHERE user_id = ?`).run(userId);
                  
                  return { type: "end", text: `☠️ *KAMU TELAH DIKALAHKAN* ☠️\n\n${currentActionLog.join('\n')}\n\nNyawamu berhasil diselamatkan, tetapi *kamu kehilangan seluruh item di dalam tasmu* (kecuali yang dipakai) karena pingsan di dalam dungeon. Kamu diusir keluar dengan 1 HP tersisa.` };
              }

              // Pasif Regen
              if (stats.passives && stats.passives.includes('regen')) {
                  const heal = Math.floor(stats.maxHp * 0.05);
                  db.prepare(`UPDATE characters SET hp = MIN(hp + ?, max_hp) WHERE user_id = ?`).run(heal, userId);
                  currentHp = db.prepare(`SELECT hp FROM characters WHERE user_id = ?`).get(userId).hp;
                  currentActionLog.push(`✨ _Fawkes memulihkan ${heal} HP milikmu!_`);
              }

              // Simpan state
              dungeonInfo.monsterHp = monsterCurrentHp;
              dungeonInfo.turn++;
              db.prepare(`UPDATE characters SET dungeon_info = ? WHERE user_id = ?`).run(JSON.stringify(dungeonInfo), userId);

              // Render UI
              let ui = `--- *${dungeon.name}* | Lantai ${dungeonInfo.floor}/${totalFloors} ---\n`;
              ui += `⚔️ *VS ${monster.name}* (Lv. ${monster.min_level || '?'})\n`;
              if (dungeonInfo.minions && dungeonInfo.minions.length > 0) ui += `   ↳ _dan ${dungeonInfo.minions.length}x pengikutnya_\n`;
              ui += `\n`;

              const pBar = Math.floor((currentHp / stats.maxHp) * 10);
              const playerName = ctx.dbUser.display_name || ctx.dbUser.push_name || 'Kamu';
              ui += `*${playerName}*\n❤️ ${'█'.repeat(pBar)}${'░'.repeat(10-pBar)} ${currentHp}/${stats.maxHp}\n\n`;

              const mBar = Math.floor((monsterCurrentHp / monster.hp) * 10);
              ui += `*${monster.name}*\n🩸 ${'█'.repeat(mBar)}${'░'.repeat(10-mBar)} ${monsterCurrentHp}/${monster.hp}\n\n`;

              ui += `_${currentActionLog.join('\n')}_\n`;
              return { type: "ongoing", text: ui };
          }

          return { type: "error", text: "Perintah dungeon tidak valid." };
      });

      const reply = runDungeon();
      if (reply && typeof reply === 'object' && reply.type === "ongoing") {
          await ctx.sendButtons(
              { title: reply.text, footer: "Lanjutkan lantai atau lari:" },
              [
                  { type: "reply", text: "⚔️ Serang", id: ".dungeon attack" },
                  { type: "reply", text: "🏃 Lari", id: ".dungeon leave" }
              ]
          );
      } else if (reply && typeof reply === 'object') {
          await ctx.reply(reply.text);
      } else {
          // kalau bukan object (karena list atau fallbacks)
          await ctx.reply(reply);
      }

  }, { aliases: ["dg", "raid"], category: "RPG", description: "Masuk ke instance dungeon untuk melawan musuh berantai." });
}
