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

      const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

      if (mode === "cash" || mode === "kaya" || mode === "wealth") {
        const rows = getWealthLeaderboard(bot.db, 10);
        const lines = rows.map((r, i) => `${medals[i]} *${displayNameOf(r)}*\n      ╰ 🪙 ${money(r.net_worth)}`);
        return ctx.reply(`╭─── [ 💰 *TOP ORANG KAYA* ] ───\n\n${lines.join("\n")}\n\n╰─────────────────────────────`);
      }

      const rows = getLevelLeaderboard(bot.db, 10);
      const lines = rows.map((r, i) => `${medals[i]} *${displayNameOf(r)}*\n      ╰ 🎖️ Lv. ${r.level}  (✨ ${Number(r.total_xp).toLocaleString('id-ID')})`);
      await ctx.reply(`╭─── [ 🏅 *TOP PETUALANG* ] ───\n\n${lines.join("\n")}\n\n╰────────────────────────────`);
    },
    {
      aliases: ["lb", "top"],
      category: "RPG",
      description: "Lihat ranking level (!lb) atau kekayaan (!lb cash)",
    }
  );
}