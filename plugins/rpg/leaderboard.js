import { getLevelLeaderboard, getWealthLeaderboard } from "../../db/repo/leveling.js";
import { money } from "../../lib/format.js";

function displayNameOf(row) {
  return row.display_name || row.push_name || row.jid.split("@")[0];
}

export default function (bot) {
  bot.command(
    "leaderboard",
    async (ctx) => {
      const mode = (ctx.args[0] || "level").toLowerCase();

      if (mode === "cash" || mode === "kaya" || mode === "wealth") {
        const rows = getWealthLeaderboard(bot.db, 10);
        const lines = rows.map((r, i) => `${i + 1}. ${displayNameOf(r)} — ${money(r.net_worth)}`);
        return ctx.reply(`💰 *Leaderboard Kekayaan*\n\n${lines.join("\n")}`);
      }

      const rows = getLevelLeaderboard(bot.db, 10);
      const lines = rows.map((r, i) => `${i + 1}. ${displayNameOf(r)} — Level ${r.level} (${r.total_xp} XP)`);
      await ctx.reply(`🏅 *Leaderboard Level*\n\n${lines.join("\n")}`);
    },
    {
      aliases: ["lb", "top"],
      category: "RPG",
      description: "Lihat ranking level (!lb) atau kekayaan (!lb cash)",
    }
  );
}