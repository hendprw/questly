import { getFullProfile, findUserByNumber, findUserByJid } from "../../db/repo/users.js";
import { getGuildByUserId } from "../../db/repo/guild.js";
import { calculateBattleStats } from "../../db/repo/combat.js";
import { xpToNextLevel } from "../../db/repo/leveling.js";
import { getClass } from "../../db/repo/classes.js";
import { sendClassPicker } from "./class.js";
import { money, progressBar } from "../../lib/format.js";

const STAT_LABELS = {
  strength: "STR",
  intelligence: "INT",
  luck: "LUK",
  stamina: "STA",
  charisma: "CHA",
};

export default function (bot) {
  bot.command(
    "profile",
    async (ctx) => {
      let targetId = ctx.dbUser.id;
      let isStalking = false;
      
      // Deteksi jika ada argumen (misal nomor HP)
      if (ctx.args[0]) {
          const rawTarget = ctx.args[0].replace('@', '').replace(/[^0-9]/g, '');
          const targetUser = findUserByNumber(bot.db, rawTarget) || findUserByJid(bot.db, `${rawTarget}@s.whatsapp.net`);
          if (targetUser) {
              targetId = targetUser.id;
              isStalking = true;
          } else {
              return ctx.reply(`❌ Pemain dengan nomor tersebut tidak ditemukan.`);
          }
      }

      const profile = getFullProfile(bot.db, targetId);
      const { user, wallet, leveling, character, stats } = profile;

      // Belum pilih class
      if (!character.class) {
        if (isStalking) return ctx.reply(`❌ Pemain ini belum memilih Class.`);
        return sendClassPicker(
          ctx,
          bot.db,
          "📋 Kamu belum memilih class! Pilih dulu biar kartu petualangmu aktif:"
        );
      }

      let name = user.display_name || user.push_name || ctx.senderNumber;
      
      const guild = getGuildByUserId(bot.db, targetId);
      if (guild) {
          name = `[${guild.tag}] ` + name;
      }

      if (character.is_hero === 1) {
          name = `[🌟 HERO] ` + name;
      }
      const need = xpToNextLevel(leveling.level);
      const className = getClass(bot.db, character.class)?.name ?? character.class;
      const statLine = Object.entries(stats)
        .map(([k, v]) => `${STAT_LABELS[k] ?? k.toUpperCase()} ${v}`)
        .join("  ·  ");

      const bStats = calculateBattleStats(bot.db, targetId);

      const equipments = bot.db.prepare(`
        SELECT eq.slot, it.name 
        FROM equipment eq
        JOIN inventory inv ON inv.id = eq.inventory_id
        JOIN items it ON it.id = inv.item_id
        WHERE eq.user_id = ?
      `).all(targetId);
      
      const getEquip = (slot) => {
        const item = equipments.find(e => e.slot === slot);
        return item ? item.name : 'Kosong';
      };

      const card = [
        `*╭─── • 「 PROFIL 」*`,
        `*│* 👤 *Nama:* ${name}`,
        `*│* 🏆 *Peringkat:* _Rank ${leveling.rank || leveling.prestige || 1}_`,
        `*│* 📍 *Lokasi:* ${character.location || 'Ibu Kota'}`,
        `*│* ⚔️ *Class:* ${className}`,
        `*├─ • 「 STATUS UTAMA 」*`,
        `*│* 🎖️ *Level:* ${leveling.level}`,
        `*│* 📈 *EXP:* ${(leveling.xp || 0).toLocaleString()} / ${need.toLocaleString()}`,
        `*│* ❤️ *HP:* ${character.hp} / ${character.max_hp}`,
        `*│* 💧 *Mana:* ${character.mp} / ${character.max_mp}`,
        `*│* 🗡️ *Attack:* ${bStats.attack} ${bStats.attack > character.attack ? `_(+${bStats.attack - character.attack} equip)_` : ''}`,
        `*│* 🛡️ *Defense:* ${bStats.defense} ${bStats.defense > character.defense ? `_(+${bStats.defense - character.defense} equip)_` : ''}`,
        `*│* 💨 *Speed:* ${bStats.speed} ${bStats.speed > character.speed ? `_(+${bStats.speed - character.speed} equip)_` : ''}`,
        `*├─ • 「 ATRIBUT 」*`,
        `*│* ${statLine}`,
        `*├─ • 「 EKONOMI 」*`,
        `*│* ✧ *Aester:* ${(wallet.cash || 0).toLocaleString()}`,
        `*│* 💎 *Diamond:* ${(wallet.gems || 0).toLocaleString()}`,
        `*╰─── • 「 PERALATAN 」*`,
        `  ⚔️ *Senjata:* ${getEquip('weapon')}`,
        `  👕 *Armor:* ${getEquip('armor')}`
      ].join("\n");

      await ctx.reply(card);
    },
    {
      aliases: ["p", "me"],
      category: "RPG",
      description: "Lihat profil & karakter kamu",
    }
  );
}