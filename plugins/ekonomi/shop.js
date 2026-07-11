import { listShopItems, getItemByCode, addItem, removeItem, getInventoryItem } from "../../db/repo/items.js";
import { addCash, removeCash, InsufficientFundsError } from "../../db/repo/economy.js";
import { money } from "../../lib/format.js";

export default function (bot) {
  bot.command(
    "shop",
    async (ctx) => {
      const items = listShopItems(bot.db);
      const lines = items.map((it) => `• *${it.name}* (${it.code}) — ${money(it.buy_price)}`);
      await ctx.reply(
        `🛒 *Toko*\n\n${lines.join("\n")}\n\n` +
          `Beli: ${bot.options.prefix}buy <kode> [jumlah]\n` +
          `Jual: ${bot.options.prefix}sell <kode> [jumlah]`
      );
    },
    { category: "Ekonomi", description: "Lihat daftar item yang bisa dibeli" }
  );

  bot.command(
    "buy",
    async (ctx) => {
      const code = (ctx.args[0] || "").toLowerCase();
      const qty = Math.max(1, parseInt(ctx.args[1], 10) || 1);
      const item = getItemByCode(bot.db, code);

      if (!item || item.buy_price == null) {
        return ctx.reply("❌ Item tidak ditemukan di toko. Ketik !shop untuk lihat daftar.");
      }

      const totalPrice = item.buy_price * qty;
      try {
        removeCash(bot.db, ctx.dbUser.id, totalPrice, { type: "shop_buy", note: `${qty}x ${item.code}` });
        addItem(bot.db, ctx.dbUser.id, item.code, qty);
        await ctx.reply(`✅ Berhasil beli ${qty}x *${item.name}* seharga ${money(totalPrice)}.`);
      } catch (e) {
        await ctx.reply(e instanceof InsufficientFundsError ? "❌ Cash kamu tidak cukup." : `❌ ${e.message}`);
      }
    },
    { category: "Ekonomi", description: "Beli item dari toko (!buy <kode> [jumlah])" }
  );

  bot.command(
    "sell",
    async (ctx) => {
      const code = (ctx.args[0] || "").toLowerCase();
      const qty = Math.max(1, parseInt(ctx.args[1], 10) || 1);
      const owned = getInventoryItem(bot.db, ctx.dbUser.id, code);

      if (!owned || owned.quantity < qty) {
        return ctx.reply("❌ Kamu tidak punya item itu sejumlah itu.");
      }

      const totalPrice = owned.sell_price * qty;
      try {
        removeItem(bot.db, ctx.dbUser.id, code, qty);
        addCash(bot.db, ctx.dbUser.id, totalPrice, { type: "shop_sell", note: `${qty}x ${code}` });
        await ctx.reply(`✅ Berhasil jual ${qty}x *${owned.name}* seharga ${money(totalPrice)}.`);
      } catch (e) {
        await ctx.reply(`❌ ${e.message}`);
      }
    },
    { category: "Ekonomi", description: "Jual item dari inventory (!sell <kode> [jumlah])" }
  );
}