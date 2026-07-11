import { addCash } from "../../db/repo/economy.js";
import { addXp } from "../../db/repo/leveling.js";
import { getRemainingCooldown, setCooldown, formatDuration } from "../../db/repo/cooldowns.js";
import { money } from "../../lib/format.js";

const ACTION_KEY = "daily";
const COOLDOWN_SECONDS = 24 * 3600;
const BASE_REWARD = 1000;
const STREAK_BONUS_PER_DAY = 200;
const MAX_STREAK_BONUS_DAYS = 10;

export default function (bot) {
  bot.command(
    "daily",
    async (ctx) => {
      const db = bot.db;
      const userId = ctx.dbUser.id;

      const remaining = getRemainingCooldown(db, userId, ACTION_KEY);
      if (remaining > 0) {
        return ctx.reply(`⏳ Kamu sudah klaim daily. Coba lagi dalam ${formatDuration(remaining)}.`);
      }

      // Streak putus kalau lewat >48 jam sejak klaim terakhir; dilanjut kalau masih dalam window.
      const row = db.prepare(`SELECT metadata FROM users WHERE id = ?`).get(userId);
      const meta = JSON.parse(row.metadata || "{}");
      const lastClaimAt = meta.lastDailyAt ?? 0;
      const now = Math.floor(Date.now() / 1000);
      const streakBroken = now - lastClaimAt > COOLDOWN_SECONDS * 2;
      const streak = streakBroken ? 1 : (meta.dailyStreak ?? 0) + 1;

      const bonusDays = Math.min(streak - 1, MAX_STREAK_BONUS_DAYS);
      const reward = BASE_REWARD + bonusDays * STREAK_BONUS_PER_DAY;

      addCash(db, userId, reward, { type: "daily", note: `streak ${streak}` });
      const leveled = addXp(db, userId, 25);
      setCooldown(db, userId, ACTION_KEY, COOLDOWN_SECONDS);

      db.prepare(`UPDATE users SET metadata = ? WHERE id = ?`).run(
        JSON.stringify({ ...meta, lastDailyAt: now, dailyStreak: streak }),
        userId
      );

      let text =
        `🎁 *Daily Reward*\n\n` +
        `Kamu mendapat ${money(reward)} (streak ${streak} hari) + 25 XP.`;
      if (leveled.leveledUp) {
        text += `\n\n🎉 Level up! Sekarang level ${leveled.after.level}.`;
      }

      await ctx.reply(text);
    },
    {
      category: "Ekonomi",
      description: "Klaim hadiah harian (reset tiap 24 jam, ada bonus streak)",
    }
  );
}