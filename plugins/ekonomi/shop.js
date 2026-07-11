/**
 * plugin: shop
 * ------------
 * Sebelumnya `!shop`, `!buy`, dan `!sell` adalah tiga command top-level
 * terpisah. Disatukan jadi SATU command `!shop` dengan sub-command
 * (`.sub()`, pola yang sama seperti `plugins/core/admin.js`) — persis gaya
 * Orion: `!shop`, `!shop buy <kode> [jumlah]`, `!shop sell <kode> [jumlah]`.
 *
 * Alias lama (`!buy`, `!sell`) tetap didaftarkan sebagai command tipis yang
 * langsung memanggil handler yang sama, supaya user lama tidak mendadak
 * "command tidak ditemukan".
 */
import { listShopItems, listSellableItems, getItemByCode, addItem, removeItem, getInventoryItem } from "../../db/repo/items.js";
import { addCash, removeCash, InsufficientFundsError } from "../../db/repo/economy.js";
import { money } from "../../lib/format.js";

const RARITY_ICON = {
  trash: "🗑️",
  common: "⚪",
  uncommon: "🟢",
  rare: "🔵",
  epic: "🟣",
  legendary: "🟠",
  mythic: "🔴",
};

const CATEGORY_LABEL = {
  weapon: "⚔️ Senjata",
  armor: "🛡️ Armor",
  consumable: "🧪 Konsumsi",
  material: "🪵 Material",
  quest: "📜 Quest Item",
  collectible: "💎 Koleksi",
  misc: "📦 Lain-lain",
};

function formatShopLine(it) {
  const icon = RARITY_ICON[it.rarity] ?? "⚪";
  return `${icon} *${it.name}* (\`${it.code}\`) — ${money(it.buy_price)}`;
}

async function doBuy(bot, ctx) {
  const code = (ctx.args[0] || "").toLowerCase();
  const qty = Math.max(1, parseInt(ctx.args[1], 10) || 1);

  if (!code) {
    return ctx.reply(`Format: ${bot.options.prefix}shop buy <kode> [jumlah]\nContoh: ${bot.options.prefix}shop buy health_potion 3`);
  }

  const item = getItemByCode(bot.db, code);
  if (!item || item.buy_price == null) {
    return ctx.reply(`❌ Item \`${code}\` tidak dijual di toko. Ketik ${bot.options.prefix}shop untuk lihat daftar.`);
  }

  const totalPrice = item.buy_price * qty;
  try {
    removeCash(bot.db, ctx.dbUser.id, totalPrice, { type: "shop_buy", note: `${qty}x ${item.code}` });
    addItem(bot.db, ctx.dbUser.id, item.code, qty);
    await ctx.reply(`✅ Berhasil beli ${qty}x *${item.name}* seharga ${money(totalPrice)}.`);
  } catch (e) {
    await ctx.reply(e instanceof InsufficientFundsError ? "❌ Cash kamu tidak cukup." : `❌ ${e.message}`);
  }
}

async function doSell(bot, ctx) {
  const code = (ctx.args[0] || "").toLowerCase();
  const qty = Math.max(1, parseInt(ctx.args[1], 10) || 1);

  if (!code) {
    return ctx.reply(`Format: ${bot.options.prefix}shop sell <kode> [jumlah]\nContoh: ${bot.options.prefix}shop sell iron_ore 5`);
  }

  const owned = getInventoryItem(bot.db, ctx.dbUser.id, code);
  if (!owned || owned.quantity < qty) {
    return ctx.reply("❌ Kamu tidak punya item itu sejumlah itu.");
  }
  if (!owned.sell_price) {
    return ctx.reply(`❌ *${owned.name}* tidak bisa dijual.`);
  }

  const totalPrice = owned.sell_price * qty;
  try {
    removeItem(bot.db, ctx.dbUser.id, code, qty);
    addCash(bot.db, ctx.dbUser.id, totalPrice, { type: "shop_sell", note: `${qty}x ${code}` });
    await ctx.reply(`✅ Berhasil jual ${qty}x *${owned.name}* seharga ${money(totalPrice)}.`);
  } catch (e) {
    await ctx.reply(`❌ ${e.message}`);
  }
}

async function showShop(bot, ctx) {
  // !shop <kategori> -> filter, mis. !shop material / !shop weapon
  const filter = (ctx.args[0] || "").toLowerCase();
  const validCategory = Object.keys(CATEGORY_LABEL).includes(filter) ? filter : null;

  const items = listShopItems(bot.db, validCategory);
  if (!items.length) {
    return ctx.reply("🛒 Toko sedang kosong untuk kategori itu.");
  }

  const grouped = new Map();
  for (const it of items) {
    if (!grouped.has(it.category)) grouped.set(it.category, []);
    grouped.get(it.category).push(it);
  }

  const sections = [...grouped.entries()].map(([cat, list]) => {
    const label = CATEGORY_LABEL[cat] ?? cat;
    return `${label}\n${list.map(formatShopLine).join("\n")}`;
  });

  const hint = validCategory
    ? `\n\nKategori lain: ${Object.keys(CATEGORY_LABEL).join(", ")}`
    : `\n\nFilter kategori: ${bot.options.prefix}shop <kategori> (${Object.keys(CATEGORY_LABEL).join(", ")})`;

  await ctx.reply(
    `🛒 *Toko*\n\n${sections.join("\n\n")}${hint}\n\n` +
      `Beli: ${bot.options.prefix}shop buy <kode> [jumlah]\n` +
      `Jual: ${bot.options.prefix}shop sell <kode> [jumlah]\n` +
      `Resource mentah (hasil gathering/loot monster) tidak dijual di sini — jual balik lewat ${bot.options.prefix}shop sell.`
  );
}

async function showSellable(bot, ctx) {
  const items = listSellableItems(bot.db).slice(0, 40);
  const lines = items.map((it) => `${RARITY_ICON[it.rarity] ?? "⚪"} *${it.name}* (\`${it.code}\`) — ${money(it.sell_price)}`);
  await ctx.reply(
    `💰 *Daftar Harga Jual*\n\n${lines.join("\n")}\n\n` +
      `Jual item dari inventory: ${bot.options.prefix}shop sell <kode> [jumlah]`
  );
}

export default function (bot) {
  bot
    .command(
      "shop",
      async (ctx) => showShop(bot, ctx),
      {
        aliases: ["toko"],
        category: "Ekonomi",
        description: "Lihat & transaksi di toko (shop buy/sell, atau shop <kategori>)",
      }
    )
    .sub("buy", async (ctx) => doBuy(bot, ctx), {
      aliases: ["b"],
      description: "Beli item dari toko (shop buy <kode> [jumlah])",
    })
    .sub("sell", async (ctx) => doSell(bot, ctx), {
      aliases: ["s"],
      description: "Jual item dari inventory (shop sell <kode> [jumlah])",
    })
    .sub("prices", async (ctx) => showSellable(bot, ctx), {
      aliases: ["harga"],
      description: "Lihat daftar harga jual semua item yang bisa dijual",
    });

  // Alias top-level untuk backward-compat sama user lama yang terbiasa !buy / !sell
  bot.command("buy", async (ctx) => doBuy(bot, ctx), {
    category: "Ekonomi",
    description: `Alias dari ${bot.options.prefix}shop buy`,
  });
  bot.command("sell", async (ctx) => doSell(bot, ctx), {
    category: "Ekonomi",
    description: `Alias dari ${bot.options.prefix}shop sell`,
  });
}
