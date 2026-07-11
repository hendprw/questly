import { getFullProfile } from "../../db/repo/users.js";
import { xpToNextLevel } from "../../db/repo/leveling.js";
import { money, progressBar } from "../../lib/format.js";

export default function (bot) {
  bot.command(
    "profile",
    async (ctx) => {
      const profile = getFullProfile(bot.db, ctx.dbUser.id);
      const { user, wallet, leveling, character, job, stats } = profile;

      const name = user.display_name || user.push_name || ctx.senderNumber;
      const need = xpToNextLevel(leveling.level);
      const statLine = Object.entries(stats)
        .map(([k, v]) => `${k}: ${v}`)
        .join(" · ");

      await ctx.reply(
        `👤 *Profil ${name}*\n\n` +
          `🏅 Level ${leveling.level} (Prestige ${leveling.prestige})\n` +
          `✨ XP: ${leveling.xp}/${need} ${progressBar(leveling.xp, need)}\n` +
          `💼 Pekerjaan: ${job?.job_name ?? "Pengangguran"}\n\n` +
          `💵 Cash: ${money(wallet.cash)}\n` +
          `🏦 Bank: ${money(wallet.bank)}/${money(wallet.bank_capacity)}\n` +
          `💎 Gems: ${wallet.gems}\n\n` +
          `❤️ HP: ${character.hp}/${character.max_hp}   🔷 MP: ${character.mp}/${character.max_mp}\n` +
          `⚡ Energy: ${character.energy}/${character.max_energy}\n\n` +
          `📊 Stats: ${statLine}`
      );
    },
    {
      aliases: ["p", "me"],
      category: "RPG",
      description: "Lihat profil & karakter kamu",
    }
  );
}