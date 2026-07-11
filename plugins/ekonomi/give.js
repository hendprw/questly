import { transfer, InsufficientFundsError } from "../../db/repo/economy.js";
import { findUserByNumber, findUserByJid } from "../../db/repo/users.js";
import { money } from "../../lib/format.js";

export default function (bot) {
  bot.command(
    "give",
    async (ctx) => {
      const amount = parseInt(ctx.args[ctx.args.length - 1], 10);
      const mentionJid = ctx.mentions?.[0];

      if (!mentionJid || !Number.isFinite(amount) || amount <= 0) {
        return ctx.reply(`Pakai: ${bot.options.prefix}give @user <jumlah>`);
      }

      let target = findUserByJid(bot.db, mentionJid);
      if (!target) {
        // Target belum pernah pakai bot sama sekali — belum ada baris user.
        return ctx.reply("❌ User itu belum pernah berinteraksi dengan bot ini.");
      }
      if (target.id === ctx.dbUser.id) {
        return ctx.reply("❌ Tidak bisa transfer ke diri sendiri.");
      }

      try {
        const { sender, receiver } = transfer(bot.db, ctx.dbUser.id, target.id, amount);
        await ctx.reply(
          `✅ Kamu mengirim ${money(amount)} ke ${target.display_name || target.push_name || "user"}.\n` +
            `Saldo cash kamu sekarang: ${money(sender.cash)}.`
        );
      } catch (e) {
        await ctx.reply(e instanceof InsufficientFundsError ? "❌ Cash kamu tidak cukup." : `❌ ${e.message}`);
      }
    },
    {
      aliases: ["transfer", "kirim"],
      category: "Ekonomi",
      description: "Kirim cash ke user lain — mention orangnya + jumlah",
    }
  );
}