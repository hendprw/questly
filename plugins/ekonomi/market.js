/**
 * plugin: market (!market)
 * -------------------------
 * Porting `.market` (marketplace player-to-player) dari Orion RPG.
 * Tampilan & alur command SENGAJA dibuat sedekat mungkin dengan aslinya
 * (tree-format ├/└, quick-copy "!market buy <id>", smart amount "1k"/"all").
 *
 * Beda dari Orion: alias top-level TIDAK termasuk "toko"/"shop" (sudah
 * dipakai `!shop` — toko NPC rotasi questly) supaya tidak tabrakan; harga
 * dirender lewat money() questly (label "✧Aster") bukan "🪙" hardcode.
 */
import {
  createListing,
  searchListings,
  randomListings,
  getMyListings,
  buyListing,
  cancelListing,
  getActiveDiscount,
  relativeTimeUntil,
} from "../../db/repo/market.js";
import { money } from "../../lib/format.js";

function formatListings(db, listings, title) {
  if (!listings || listings.length === 0) {
    return "🍂 *Pasar sepi...* Belum ada item yang ditemukan.";
  }

  const discount = getActiveDiscount(db);
  let message = `🛒 *${title}*\n──────────────────\n`;

  if (discount) {
    message += `🎉 *EVENT DISKON: ${discount.name} (-${discount.percentage}%)*\n──────────────────\n`;
  }

  for (const item of listings) {
    let finalPrice = item.total_price;
    let finalUnit = item.price_per_unit;
    let discountTag = "";

    if (discount) {
      finalPrice = Math.floor(item.total_price * (1 - discount.percentage / 100));
      finalUnit = Math.floor(item.price_per_unit * (1 - discount.percentage / 100));
      discountTag = " 🏷️📉";
    }

    message += `📦 *${item.item_name}* (x${item.quantity.toLocaleString("id-ID")})\n`;
    message += `   ├ 🆔 ID: *${item.id}*\n`;
    message += `   ├ 💰 Harga: *${money(finalPrice)}*${discountTag}\n`;
    message += `   ├ ⚖️ Satuan: ${money(finalUnit)} / pcs\n`;
    message += `   └ 👤 Penjual: ${item.seller_name.slice(0, 15)}\n`;
    if (item.note) message += `   📝 _"${item.note}"_\n`;
    message += "   👉 `!market buy " + item.id + "`\n\n";
  }
  return message;
}

export default function (bot) {
  bot.command(
    "market",
    async (ctx) => {
      const help =
        `🏪 *PASAR (MARKETPLACE)*\n\n` +
        `📦 *JUAL BARANG* (WTS)\n` +
        `\`${bot.options.prefix}market sell <kode_item> <jumlah> <harga>\`\n` +
        `_Contoh: ${bot.options.prefix}market sell iron_ore 100 500 (atau 500k)_\n\n` +
        `🔍 *CARI BARANG*\n` +
        `\`${bot.options.prefix}market search <nama>\`\n` +
        `_Contoh: ${bot.options.prefix}market search potion_\n\n` +
        `🛒 *BELI BARANG*\n` +
        `\`${bot.options.prefix}market buy <ID_listing> [jumlah]\`\n\n` +
        `📋 *MENU LAIN*\n` +
        `• \`${bot.options.prefix}market random\` : Item acak\n` +
        `• \`${bot.options.prefix}market me\` : Lapak daganganmu\n` +
        `• \`${bot.options.prefix}market cancel <ID>\` : Batal jual\n\n` +
        `💡 *TIPS:* Gunakan \`k\`/\`m\`/\`b\` (ribu/juta/miliar) atau \`all\` di input angka.`;
      await ctx.reply(help);
    },
    { category: "Ekonomi", aliases: ["pasar"], description: "Pusat perdagangan antar pemain (!market)" }
  )

    .sub(
      "sell",
      async (ctx) => {
        const [itemInput, amountInput, priceInput, ...noteWords] = ctx.args;
        if (!itemInput || !amountInput || !priceInput) {
          return ctx.reply(`⚠️ Format salah. Contoh: \`${bot.options.prefix}market sell iron_ore 50 100\``);
        }

        try {
          const { listing, tax } = createListing(
            bot.db,
            ctx.dbUser.id,
            itemInput.toLowerCase(),
            amountInput,
            priceInput,
            noteWords.join(" ") || null
          );

          await ctx.reply(
            `✅ *DAFTAR BERHASIL*\n` +
              `📦 Barang: ${listing.quantity}x ${listing.item_name}\n` +
              `💰 Harga Total: ${money(listing.total_price)}\n` +
              `🧾 Pajak: -${money(tax)} (Terbayar)\n` +
              `🆔 ID Listing: *${listing.id}*`
          );
        } catch (e) {
          await ctx.reply(`❌ ${e.message}`);
        }
      },
      { aliases: ["jual", "wts", "s"], description: "Jual item ke pemain lain (!market sell <kode> <jumlah> <harga>)" }
    )

    .sub(
      "search",
      async (ctx) => {
        const term = ctx.args.join(" ");
        const listings = searchListings(bot.db, term || null, 10);
        const title = term ? `Hasil Pencarian: "${term}"` : "Item Terbaru";
        await ctx.reply(formatListings(bot.db, listings, title));
      },
      { aliases: ["cari", "find", "wtb", "f"], description: "Cari barang yang dijual pemain lain (!market search <nama>)" }
    )

    .sub(
      "random",
      async (ctx) => {
        const listings = randomListings(bot.db, 10);
        await ctx.reply(formatListings(bot.db, listings, "Rekomendasi Pasar"));
      },
      { aliases: ["global", "explore"], description: "Lihat listing acak dari pasar" }
    )

    .sub(
      "buy",
      async (ctx) => {
        const [listingIdStr, amountStr] = ctx.args;
        const listingId = parseInt(listingIdStr, 10);
        if (isNaN(listingId)) return ctx.reply(`⚠️ Masukkan ID Listing. Contoh: \`${bot.options.prefix}market buy 12\``);

        try {
          const result = buyListing(bot.db, ctx.dbUser.id, listingId, amountStr);

          let msg = `🎉 *PEMBELIAN SUKSES*\n`;
          msg += `📦 Item: ${result.amountToBuy}x ${result.itemName}\n`;
          msg += `💰 Bayar: ${money(result.finalPrice)}`;
          if (result.discount) msg += ` (Hemat ${money(result.priceTotalOriginal - result.finalPrice)})`;
          await ctx.reply(msg);

          const seller = bot.db.prepare(`SELECT jid FROM users WHERE id = ?`).get(result.sellerUserId);
          if (seller?.jid) {
            const buyerName = ctx.dbUser.display_name || ctx.dbUser.push_name || "Seseorang";
            ctx.sock
              .sendMessage(seller.jid, {
                text:
                  `🔔 *MARKET NOTIF*\nLaku! ${buyerName} membeli ${result.amountToBuy}x ${result.itemName}.\n` +
                  `💰 +${money(result.priceTotalOriginal)} diterima.`,
              })
              .catch(() => {});
          }
        } catch (e) {
          await ctx.reply(`❌ ${e.message}`);
        }
      },
      { aliases: ["beli", "b"], description: "Beli listing (!market buy <ID> [jumlah])" }
    )

    .sub(
      "cancel",
      async (ctx) => {
        const listingId = parseInt(ctx.args[0], 10);
        if (isNaN(listingId)) return ctx.reply(`⚠️ Masukkan ID. Contoh: \`${bot.options.prefix}market cancel 12\``);

        try {
          const listing = cancelListing(bot.db, ctx.dbUser.id, listingId);
          await ctx.reply(`✅ Listing #${listing.id} dibatalkan. Item dikembalikan ke tas.`);
        } catch (e) {
          await ctx.reply(`❌ ${e.message}`);
        }
      },
      { aliases: ["batal", "del"], description: "Batalkan listing milikmu (!market cancel <ID>)" }
    )

    .sub(
      "me",
      async (ctx) => {
        const listings = getMyListings(bot.db, ctx.dbUser.id);
        if (listings.length === 0) return ctx.reply("📭 Kamu belum menjual apapun.");

        let message = `🏪 *LAPAK SAYA*\n──────────────────\n`;
        for (const item of listings) {
          let icon = "🔴";
          let statusText = "Kadaluarsa";
          if (item.status === "active") {
            icon = "🟢";
            statusText = `Aktif (${relativeTimeUntil(item.expires_at)})`;
          } else if (item.status === "sold") {
            icon = "💰";
            statusText = "Terjual";
          } else if (item.status === "cancelled") {
            icon = "❌";
            statusText = "Dibatalkan";
          }
          message += `${icon} *${item.item_name}* (x${item.quantity})\n`;
          message += `   └ ID: \`${item.id}\` | 💰 ${money(item.total_price)} | Status: ${statusText}\n`;
        }
        message += `\n_Ketik ${bot.options.prefix}market cancel <ID> untuk ambil barang kembali._`;
        await ctx.reply(message);
      },
      { aliases: ["saya", "status", "my", "lapak"], description: "Lihat lapak & status daganganmu" }
    );
}