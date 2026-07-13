/**
 * plugin: marketdiscount (!marketdiscount)
 * -----------------------------------------
 * Porting `.adisc`/`.setdiscount` (admindiscount.js) dari Orion.
 *
 * Beda dari Orion: gerbang owner pakai flag native `{ owner: true }` +
 * `ctx.isOwner` bawaan botify-wa (dicek terhadap OWNER_NUMBERS di
 * config.bt), bukan hardcode satu nomor JID di dalam source code plugin.
 */
import { createDiscount, stopDiscount, listDiscounts } from "../../db/repo/market.js";

export default function (bot) {
  bot.command(
    "marketdiscount",
    async (ctx) => {
      await ctx.reply(
        `*--- 🛠️ Admin Diskon Panel ---*\n\n` +
          `1. \`${bot.options.prefix}marketdiscount create "<nama>" <persen> <jam>\`\n` +
          `   _Contoh: ${bot.options.prefix}marketdiscount create "Diskon Akhir Pekan" 15 72_\n\n` +
          `2. \`${bot.options.prefix}marketdiscount stop <id>\`\n` +
          `   _Menghentikan diskon yang sedang aktif._\n\n` +
          `3. \`${bot.options.prefix}marketdiscount list\`\n` +
          `   _Melihat daftar semua event diskon._`
      );
    },
    { category: "Owner", owner: true, aliases: ["adisc", "setdiscount"], description: "Kelola event diskon pasar (Owner only)" }
  )

    .sub(
      "create",
      async (ctx) => {
        const joined = ctx.args.join(" ");
        const nameMatch = joined.match(/"([^"]+)"/);
        const name = nameMatch ? nameMatch[1] : null;
        const rest = (name ? joined.replace(`"${name}"`, "") : joined).trim().split(/\s+/);

        const percentage = parseInt(rest[0], 10);
        const durationHours = parseInt(rest[1], 10);

        if (!name || isNaN(percentage) || isNaN(durationHours) || percentage <= 0 || percentage > 90 || durationHours <= 0) {
          return ctx.reply(`Penggunaan salah.\nContoh: *${bot.options.prefix}marketdiscount create "Diskon Gila" 25 48*`);
        }

        try {
          const discount = createDiscount(bot.db, ctx.dbUser.id, name, percentage, durationHours);
          await ctx.reply(`✅ Event diskon "${discount.name}" (${discount.percentage}%) berhasil dibuat dan akan aktif selama ${durationHours} jam.`);
        } catch (e) {
          await ctx.reply(`❌ ${e.message}`);
        }
      },
      { description: 'Buat event diskon baru (create "<nama>" <persen> <jam>)' }
    )

    .sub(
      "stop",
      async (ctx) => {
        const discountId = parseInt(ctx.args[0], 10);
        if (isNaN(discountId)) return ctx.reply("Harap masukkan ID diskon yang valid.");

        try {
          const discount = stopDiscount(bot.db, discountId);
          await ctx.reply(`✅ Event diskon "${discount.name}" telah dihentikan.`);
        } catch (e) {
          await ctx.reply(`❌ ${e.message}`);
        }
      },
      { description: "Hentikan diskon yang aktif (stop <id>)" }
    )

    .sub(
      "list",
      async (ctx) => {
        const discounts = listDiscounts(bot.db);
        if (discounts.length === 0) return ctx.reply("Belum ada event diskon yang pernah dibuat.");

        const now = Math.floor(Date.now() / 1000);
        let message = "*--- 📜 Daftar Event Diskon ---*\n\n";
        for (const d of discounts) {
          const status = d.status === "active" && d.expires_at > now ? "🟢 AKTIF" : "🔴 NONAKTIF";
          message +=
            `*ID:* ${d.id}\n` +
            `*Nama:* ${d.name}\n` +
            `*Diskon:* ${d.percentage}%\n` +
            `*Status:* ${status}\n` +
            `*Berakhir:* ${new Date(d.expires_at * 1000).toLocaleString("id-ID")}\n\n`;
        }
        await ctx.reply(message);
      },
      { description: "Lihat riwayat semua event diskon" }
    );
}