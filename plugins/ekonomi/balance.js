import { getWallet } from "../../db/repo/economy.js";
import { money } from "../../lib/format.js";

export default function (bot) {
  bot.command(
    "balance",
    async (ctx) => {
      const wallet = getWallet(bot.db, ctx.dbUser.id);
      await ctx.reply(
        `💰 *Saldo Kamu*\n\n` +
          `💵 Cash : ${money(wallet.cash)}\n` +
          `🏦 Bank : ${money(wallet.bank)} / ${money(wallet.bank_capacity)}\n` +
          `💎 Gems : ${wallet.gems}\n\n` +
          `Total kekayaan: ${money(wallet.cash + wallet.bank)}`
      );
    },
    {
      aliases: ["bal", "saldo"],
      category: "Ekonomi",
      description: "Cek saldo cash, bank, dan gems kamu",
    }
  );
}