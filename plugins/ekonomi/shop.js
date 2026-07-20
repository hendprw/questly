import { getItemByCode, addItem, removeItem, getInventoryItem } from "../../db/repo/items.js";
import { addCash, removeCash, InsufficientFundsError } from "../../db/repo/economy.js";
import {
  getShopState,
  getShopListingByCode,
  decrementStock,
  getCarryState,
  addCarryWeight,
  getDynamicSellPrice,
  recordItemSale,
} from "../../db/repo/shop.js";
import { formatDuration } from "../../db/repo/cooldowns.js";
import { money, progressBar } from "../../lib/format.js";

const RARITY_BADGE = {
  common: "🟢 Common",
  uncommon: "🔵 Uncommon",
  rare: "🟣 Rare",
  epic: "🟠 Epic",
  legendary: "🟡 Legendary",
  mythic: "🔴 Mythic",
};

const INDEX_EMOJI = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

function formatListing(it, i) {
  const badge = RARITY_BADGE[it.rarity] ?? it.rarity;
  const num = INDEX_EMOJI[i] ?? `${i + 1}.`;
  return (
    `${num} *${it.name}* (${it.code})\n` +
    `💰${money(it.price)} • 📦${it.stock} • ⚖️${it.weight} • ${badge}`
  );
}

export default function (bot) {
  bot.command(
    "shop",
    async (ctx) => {
      const state = getShopState(bot.db);

      if (state.items.length === 0) {
        return ctx.reply(
          `🛒 *TOKO*\n\n` +
            `Rak-rak lagi kosong, semua item ludes diborong! 😅\n` +
            `⏳ Restock baru dalam *${formatDuration(state.cooldownRemaining)}*.`
        );
      }

      const lines = state.items.map(formatListing).join("\n\n");

      await ctx.reply(
        `🛒 *TOKO*\n` +
          `_stok & harga berubah tiap restock, ±10 menit_\n\n` +
          `${lines}\n\n` +
          `🛍️ ${bot.options.prefix}shop buy <kode> [jumlah]\n` +
          `💸 ${bot.options.prefix}shop sell <kode> [jumlah]`
      );
    },
    { category: "Ekonomi", description: "Lihat isi toko rotasi saat ini" }
  )

    .sub(
      "buy",
      async (ctx) => {
        const db = bot.db;
        const code = (ctx.args[0] || "").toLowerCase();
        const qty = Math.max(1, parseInt(ctx.args[1], 10) || 1);

        if (!code) {
          return ctx.reply(`⚠️ Format salah. Contoh: \`${bot.options.prefix}shop buy health_potion 5\``);
        }

        const listing = getShopListingByCode(db, code);
        if (!listing || listing.stock <= 0) {
          return ctx.reply(`❌ Item \`${code}\` tidak ada di toko saat ini. Ketik ${bot.options.prefix}shop untuk lihat stok.`);
        }
        if (listing.stock < qty) {
          return ctx.reply(`❌ Stok *${listing.name}* cuma tersisa ${listing.stock}.`);
        }

        const totalPrice = listing.price * qty;
        const totalWeight = listing.weight * qty;
        const carry = getCarryState(db, ctx.dbUser.id);

        if (carry.carry_weight + totalWeight > carry.max_carry_weight) {
          return ctx.reply(
            `🎒 *TAS PENUH*\n` +
              `Butuh ${totalWeight} slot, sisa kapasitas kamu ${carry.max_carry_weight - carry.carry_weight}.`
          );
        }

        try {
          removeCash(db, ctx.dbUser.id, totalPrice, { type: "shop_buy", note: `${qty}x ${listing.code}` });
          addItem(db, ctx.dbUser.id, listing.code, qty);
          decrementStock(db, listing.listing_id, qty);
          addCarryWeight(db, ctx.dbUser.id, totalWeight);

          const newCarry = getCarryState(db, ctx.dbUser.id);
          await ctx.reply(
            `✅ *Beli ${qty}x ${listing.name}*\n` +
              `💰 ${money(totalPrice)} • ⚖️ ${newCarry.carry_weight}/${newCarry.max_carry_weight} ${progressBar(newCarry.carry_weight, newCarry.max_carry_weight, 10)}`
          );
        } catch (e) {
          await ctx.reply(e instanceof InsufficientFundsError ? "❌ Cash kamu tidak cukup." : `❌ ${e.message}`);
        }
      },
      { description: "Beli item dari toko (!shop buy <kode> [jumlah])" }
    )

    .sub(
      "sell",
      async (ctx) => {
        const db = bot.db;
        const code = (ctx.args[0] || "").toLowerCase();
        const qty = Math.max(1, parseInt(ctx.args[1], 10) || 1);

        if (!code) {
          return ctx.reply(`⚠️ Format salah. Contoh: \`${bot.options.prefix}shop sell health_potion 5\``);
        }

        const owned = getInventoryItem(db, ctx.dbUser.id, code);
        if (!owned || owned.quantity < qty) {
          return ctx.reply("❌ Kamu tidak punya item itu sejumlah itu.");
        }

        const dynamicPrice = getDynamicSellPrice(db, code, owned.sell_price);
        const totalPrice = dynamicPrice * qty;
        const item = getItemByCode(db, code);
        const totalWeight = (item?.weight ?? 0) * qty;

        try {
          removeItem(db, ctx.dbUser.id, code, qty);
          addCash(db, ctx.dbUser.id, totalPrice, { type: "shop_sell", note: `${qty}x ${code}` });
          addCarryWeight(db, ctx.dbUser.id, -totalWeight);
          recordItemSale(db, code, qty);

          const newCarry = getCarryState(db, ctx.dbUser.id);
          await ctx.reply(
            `✅ *Jual ${qty}x ${owned.name}*\n` +
              `📉 _(Harga dinamis: ${dynamicPrice} Aester/ea)_\n` +
              `💰 ${money(totalPrice)} • ⚖️ ${newCarry.carry_weight}/${newCarry.max_carry_weight} ${progressBar(newCarry.carry_weight, newCarry.max_carry_weight, 10)}`
          );
        } catch (e) {
          await ctx.reply(`❌ ${e.message}`);
        }
      },
      { description: "Jual item dari inventory (!shop sell <kode> [jumlah])" }
    );
}