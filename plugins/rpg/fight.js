import { calculateBattleStats } from "../../db/repo/combat.js";
import { addXp } from "../../db/repo/leveling.js";
import { addCash } from "../../db/repo/economy.js";
import { addItem, degradeEquippedItems } from "../../db/repo/items.js";
import { progressQuest } from "../../db/repo/quests.js";

function getMonster(db, monsterId) {
    return db.prepare(`SELECT * FROM monsters WHERE code = ?`).get(monsterId);
}

function parseJSON(str, def) {
    try { return JSON.parse(str); } catch { return def; }
}

export default function (bot) {
  bot.command("fight", async (ctx) => {
      const db = bot.db;
      const userId = ctx.dbUser.id;
      const subCmd = ctx.args[0]?.toLowerCase();

      // Transaksi untuk memastikan state pertempuran sinkron
      const runFight = db.transaction(() => {
          const character = db.prepare(`SELECT * FROM characters WHERE user_id = ?`).get(userId);
          const battleInfo = parseJSON(character.battle_info, {});

          // --- MEMULAI PERTARUNGAN BARU ---
          if (!subCmd || subCmd === 'start') {
              if (battleInfo.inBattle) {
                  return "Kamu sudah dalam pertarungan! Selesaikan dulu atau gunakan `!fight run`.";
              }

              // Pilih monster sesuai lokasi
              const monsters = db.prepare(`SELECT * FROM monsters WHERE locations LIKE ? AND is_boss = 0`).all(`%${character.location}%`);
              if (monsters.length === 0) return "Tidak ada monster yang bisa dilawan di lokasi ini.";
              
              const monster = monsters[Math.floor(Math.random() * monsters.length)];
              
              // Simpan state
              const newBattleInfo = {
                  inBattle: true,
                  monsterId: monster.code,
                  monsterHp: monster.hp
              };
              db.prepare(`UPDATE characters SET battle_info = ? WHERE user_id = ?`).run(JSON.stringify(newBattleInfo), userId);
              
              return { type: "start", text: `Seekor *${monster.name}* liar (Lv. ${monster.min_level}) muncul menyerangmu!` };
          }

          // --- LOGIKA MELANJUTKAN PERTARUNGAN ---
          if (!battleInfo.inBattle) {
              return { type: "error", text: "Kamu tidak sedang dalam pertarungan. Ketik `!fight start` untuk mencari musuh." };
          }

          const monsterDef = getMonster(db, battleInfo.monsterId);
          if (!monsterDef) {
              db.prepare(`UPDATE characters SET battle_info = '{}' WHERE user_id = ?`).run(userId);
              return { type: "end", text: "Pertarungan dibatalkan. Monster melarikan diri karena galat dimensi." };
          }

          const stats = calculateBattleStats(db, userId);
          let monsterCurrentHp = battleInfo.monsterHp;
          
          let playerLog = "";
          let monsterLog = "";
          let fightEnd = false;

          if (subCmd === 'attack') {
              const damage = Math.max(1, stats.attack - (monsterDef.defense || 0));
              monsterCurrentHp -= damage;
              const playerName = ctx.dbUser.display_name || ctx.dbUser.push_name || 'Kamu';
              playerLog = `💥 *${playerName}* menyerang dengan senjata dan memberikan *${damage}* DMG!`;
          } else if (subCmd === 'run') {
              db.prepare(`UPDATE characters SET battle_info = '{}' WHERE user_id = ?`).run(userId);
              return { type: "end", text: `🏃 Kamu berhasil melarikan diri dari *${monsterDef.name}*!` };
          } else if (subCmd === 'skill') {
              const skillId = ctx.args[1];
              if (!skillId) return { type: "error", text: "Sebutkan skill. Contoh: `!fight skill slash`" };
              
              // Cek skill user
              let userSkill = db.prepare(`SELECT * FROM user_skills us JOIN skills s ON us.skill_code = s.code WHERE us.user_id = ? AND s.code = ?`).get(userId, skillId);
              
              if (!userSkill && character.is_hero === 1 && (skillId === 'divine_retribution' || skillId === 'aegis_of_light')) {
                  userSkill = db.prepare(`SELECT * FROM skills WHERE code = ?`).get(skillId);
              }

              if (!userSkill) return { type: "error", text: `Kamu tidak memiliki skill \`${skillId}\`.` };
              
              // Cek Mana
              if (character.mp < userSkill.mana_cost) return { type: "error", text: `Mana tidak cukup! Butuh ${userSkill.mana_cost} MP.` };

              // Cooldown Check
              const cds = parseJSON(character.skill_cooldowns, {});
              if (cds[skillId] && Date.now() < cds[skillId]) {
                  return { type: "error", text: `Skill *${userSkill.name}* masih cooldown!` };
              }

              // Apply Skill
              db.prepare(`UPDATE characters SET mp = mp - ? WHERE user_id = ?`).run(userSkill.mana_cost, userId);
              cds[skillId] = Date.now() + (userSkill.cooldown_seconds * 1000);
              db.prepare(`UPDATE characters SET skill_cooldowns = ? WHERE user_id = ?`).run(JSON.stringify(cds), userId);

              // Skill logic statis (karena eval berbahaya, kita asumsikan multiplier DMG atau heal)
              let dmg = 0;
              const playerName = ctx.dbUser.display_name || ctx.dbUser.push_name || 'Kamu';
              
              if (skillId === 'divine_retribution') {
                  dmg = Math.max(1, Math.floor(stats.attack * 3.0)); // Mutlak 300%
                  playerLog = `✨ *${playerName}* memanggil *${userSkill.name}* dari langit dan memberikan *${dmg}* True DMG!`;
              } else if (skillId === 'aegis_of_light') {
                  db.prepare(`UPDATE characters SET hp = max_hp WHERE user_id = ?`).run(userId);
                  playerLog = `✨ *${playerName}* mengaktifkan *${userSkill.name}*, memulihkan HP hingga penuh!`;
              } else {
                  dmg = Math.max(1, Math.floor(stats.attack * 2.5) - (monsterDef.defense || 0));
                  playerLog = `✨ *${playerName}* menggunakan *${userSkill.name}* dan memberikan *${dmg}* DMG!`;
              }

              if (dmg > 0) {
                  monsterCurrentHp -= dmg;
              }
          } else {
              return { type: "error", text: "Perintah tidak valid. Gunakan `attack`, `skill <id>`, atau `run`." };
          }

          // Cek kematian monster
          if (monsterCurrentHp <= 0) {
              db.prepare(`UPDATE characters SET battle_info = '{}' WHERE user_id = ?`).run(userId);
              
              let cashDrop = Math.floor(Math.random() * (monsterDef.cash_max - monsterDef.cash_min + 1)) + monsterDef.cash_min;
              if (stats.passives && stats.passives.includes('gold')) {
                  cashDrop = Math.floor(cashDrop * 1.3); // +30%
              }
              addCash(db, userId, cashDrop, { note: 'Loot monster' });
              const leveled = addXp(db, userId, monsterDef.xp_reward);
              
              progressQuest(db, userId, 'hunt', monsterDef.code, 1);
              
              let lootMsg = "";
              const lootTable = parseJSON(monsterDef.loot_table, []);
              for (const loot of lootTable) {
                  if (Math.random() < loot.chance) {
                      let qty = Math.floor(Math.random() * (loot.qty_max - loot.qty_min + 1)) + loot.qty_min;
                      if (stats.passives && stats.passives.includes('lucky') && Math.random() < 0.15) {
                          qty *= 2;
                      }
                      addItem(db, userId, loot.item_code, qty);
                      lootMsg += `\n📦 *+${qty} ${loot.item_code}*`;
                  }
              }

              let winMsg = `${playerLog}\n\n💀 *${monsterDef.name}* telah dikalahkan!\n\n*Hadiah:*\n✨ *+${monsterDef.xp_reward}* EXP\n🪙 *+${cashDrop}* Aester${lootMsg}`;
              if (leveled && leveled.leveledUp) winMsg += `\n\n🎉 Kamu naik ke *Level ${leveled.after.level}*!`;
              
              const broken = degradeEquippedItems(db, userId);
              if (broken.length > 0) {
                  winMsg += `\n\n⚠️ *PERINGATAN:* Peralatan hancur dan dilepas: ${broken.map(b => b.name).join(", ")}! Segera perbaiki di Blacksmith.`;
              }

              return { type: "end", text: winMsg };
          }

          // Giliran Monster
          const monsterDmg = Math.max(1, (monsterDef.attack || 1) - stats.defense);
          db.prepare(`UPDATE characters SET hp = hp - ? WHERE user_id = ?`).run(monsterDmg, userId);
          monsterLog = `🩸 *${monsterDef.name}* menyerang balik memberikan *${monsterDmg}* DMG!`;

          // Cek kematian Player
          let currentHp = db.prepare(`SELECT hp FROM characters WHERE user_id = ?`).get(userId).hp;
          if (currentHp <= 0) {
              db.prepare(`UPDATE characters SET hp = 1, battle_info = '{}' WHERE user_id = ?`).run(userId);
              let dieMsg = `${playerLog}\n${monsterLog}\n\n☠️ *KAMU TERBUNUH!*\nKamu kehilangan kesadaran dan diselamatkan oleh penjaga hutan. (Tersisa 1 HP).`;
              
              const broken = degradeEquippedItems(db, userId);
              if (broken.length > 0) {
                  dieMsg += `\n\n⚠️ *PERINGATAN:* Peralatan hancur dan dilepas: ${broken.map(b => b.name).join(", ")}! Segera perbaiki di Blacksmith.`;
              }
              
              return { type: "end", text: dieMsg };
          }

          // Pasif Regen
          if (stats.passives && stats.passives.includes('regen')) {
              const heal = Math.floor(stats.maxHp * 0.05);
              db.prepare(`UPDATE characters SET hp = MIN(hp + ?, max_hp) WHERE user_id = ?`).run(heal, userId);
              currentHp = db.prepare(`SELECT hp FROM characters WHERE user_id = ?`).get(userId).hp;
              monsterLog += `\n✨ _Fawkes memulihkan ${heal} HP milikmu!_`;
          }

          // Lanjut bertarung
          battleInfo.monsterHp = monsterCurrentHp;
          db.prepare(`UPDATE characters SET battle_info = ? WHERE user_id = ?`).run(JSON.stringify(battleInfo), userId);

          // Render UI
          let ui = `*⚔️ PERTARUNGAN*\n\n`;
          
          const pBar = Math.floor((currentHp / stats.maxHp) * 10);
          const playerName = ctx.dbUser.display_name || ctx.dbUser.push_name || 'Kamu';
          ui += `*${playerName}*\n❤️ ${'█'.repeat(pBar)}${'░'.repeat(10-pBar)} ${currentHp}/${stats.maxHp}\n`;
          ui += `💧 MP: ${character.mp}/${stats.maxMp}\n\n`;

          const mBar = Math.floor((monsterCurrentHp / monsterDef.hp) * 10);
          ui += `*${monsterDef.name}*\n🩸 ${'█'.repeat(mBar)}${'░'.repeat(10-mBar)} ${monsterCurrentHp}/${monsterDef.hp}\n\n`;

          ui += `_${playerLog}_\n_${monsterLog}_\n\n`;

          return { type: "ongoing", text: ui };
      });

      const reply = runFight();
      
      if (typeof reply === "string") {
          return ctx.reply(reply);
      }
      
      if (reply.type === "ongoing" || reply.type === "start") {
          await ctx.sendButtons(
              { title: reply.text, footer: "Pilih aksi giliranmu:" },
              [
                  { type: "reply", text: "🗡️ Serang", id: ".fight attack" },
                  { type: "reply", text: "📖 Skills", id: ".skills" },
                  { type: "reply", text: "🏃 Kabur", id: ".fight run" }
              ]
          );
      } else {
          await ctx.reply(reply.text);
      }

  }, { aliases: ["serang", "battle"], category: "RPG", description: "Melawan monster di sekitarmu secara turn-based." });
}
