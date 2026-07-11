import { resolveHunt } from "../../db/repo/combat.js";
import { getRemainingCooldown, setCooldown, formatDuration } from "../../db/repo/cooldowns.js";
import { money } from "../../lib/format.js";

const ACTION_KEY = "hunt";
const COOLDOWN_SECONDS = 5 * 60;

export default function (bot) {
  bot.command(
    "hunt",
    async (ctx) => {
      const db = bot.db;
      const userId = ctx.dbUser.id;

      const remaining = getRemainingCooldown(db, userId, ACTION_KEY);
      if (remaining > 0) {
        return ctx.reply(`⏳ Kamu masih capek berburu. Coba lagi dalam ${formatDuration(remaining)}.`);
      }

      let result;
      try {
        result = resolveHunt(db, userId);
      } catch (e) {
        return ctx.reply(`❌ ${e.message}`);
      }

      setCooldown(db, userId, ACTION_KEY, COOLDOWN_SECONDS);

      const { win, monster, log, cashEarned, xpEarned, lootedItems, levelUp, character } = result;

      let text = `🗡️ *Berburu ${monster.name}*\n\n${log.join("\n")}\n\n`;

      if (win) {
        text += `✅ *Menang!* Dapat ${money(cashEarned)} + ${xpEarned} XP.`;
        if (lootedItems.length > 0) {
          text += `\n🎁 Loot: ${lootedItems.map((i) => `${i.name} x${i.qty}`).join(", ")}`;
        }
        if (levelUp?.messages?.length) {
          text += `\n\n${levelUp.messages.join("\n")}`;
        }
      } else {
        text += `💀 *Kalah!* Kamu terpaksa mundur, tidak dapat hadiah.`;
      }

      text += `\n\n❤️ HP kamu sekarang: ${character.hp}/${character.max_hp}`;

      await ctx.reply(text);
    },
    { category: "RPG", description: "Berburu monster untuk cash & XP (!hunt)" }
  );
}