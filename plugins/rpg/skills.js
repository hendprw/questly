import { getFullProfile } from "../../db/repo/users.js";

export default function (bot) {
  bot.command("skills", async (ctx) => {
      const db = bot.db;
      const userId = ctx.dbUser.id;

      const profile = getFullProfile(db, userId);
      if (!profile || !profile.character) {
          return ctx.reply("Kamu belum membuat karakter. Ketik `!start`.");
      }

      const character = profile.character;
      const skillCooldowns = JSON.parse(character.skill_cooldowns || '{}');
      const battleInfo = JSON.parse(character.battle_info || '{}');
      const dungeonInfo = JSON.parse(character.dungeon_info || '{}');

      const userSkills = db.prepare(`
          SELECT s.code, s.name, s.description, s.mana_cost, s.cooldown_seconds 
          FROM user_skills us
          JOIN skills s ON us.skill_code = s.code
          WHERE us.user_id = ?
      `).all(userId);

      if (character.is_hero === 1) {
          const holySkills = db.prepare(`SELECT code, name, description, mana_cost, cooldown_seconds FROM skills WHERE code IN ('divine_retribution', 'aegis_of_light')`).all();
          userSkills.push(...holySkills);
      }

      let message = `*--- 📖 BUKU SKILL ---*\n\n`;
      message += `*Mana:* ${character.mp}/${character.max_mp} 💧\n\n`;

      if (userSkills.length === 0) {
          message += '_Kamu belum mempelajari skill apapun._\n\n';
          return ctx.reply(message.trim());
      }

      const rows = [];
      for (const skill of userSkills) {
          let status = '🟢 Siap';
          const cooldownEnd = skillCooldowns[skill.code];

          if (cooldownEnd && Date.now() < cooldownEnd) {
              const timeLeft = cooldownEnd - Date.now();
              const minutes = Math.floor(timeLeft / 60000);
              const seconds = Math.floor((timeLeft % 60000) / 1000);
              status = `🔴 CD (${minutes}m ${seconds}s)`;
          }

          let actionId = `.fight skill ${skill.code}`; // Default
          if (dungeonInfo.dungeonId) {
              actionId = `.dungeon skill ${skill.code}`; 
              // Catatan: fitur !dungeon skill bisa ditambahkan di dungeon.js nanti,
              // sementara arahkan ke fight skill agar aman, atau fallback text.
          }

          rows.push({
              title: skill.name,
              id: actionId,
              description: `Mana: ${skill.mana_cost} | ${status}`
          });
      }

      await ctx.sendListMenu(
          { title: message, footer: "Gunakan saat bertarung", buttonText: "Pilih Skill" },
          [{ title: "Skill Aktif", rows }]
      );

  }, { aliases: ["skill"], category: "RPG", description: "Melihat daftar skill yang kamu miliki dan status cooldown-nya." });
}
