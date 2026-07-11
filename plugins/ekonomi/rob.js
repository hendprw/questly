import { robPlayer } from "../../db/repo/economy.js";
import { findUserByJid, findUserByNumber } from "../../db/repo/users.js";
import { getRemainingCooldown, setCooldown, formatDuration } from "../../db/repo/cooldowns.js";
import { money } from "../../lib/format.js";

const ACTION_KEY = "rob";
const COOLDOWN_SECONDS = 5 * 60; // 5 menit — persisten, bertahan walau bot restart

export default function (bot) {
    bot.command("rob", async (ctx) => {
        const db = bot.db;

        // Ambil JID target dari mention, atau dari nomor manual (mis. "!rob 6281234567890").
        let targetJid = ctx.mentionedJid?.[0];
        if (!targetJid && ctx.args[0]) {
            const rawNumber = ctx.args[0].replace(/[^0-9]/g, ""); // sisakan digit saja
            if (rawNumber) targetJid = `${rawNumber}@s.whatsapp.net`;
        }

        if (!targetJid) {
            return ctx.reply("Tag target yang ingin kamu rampok!\nContoh: `!rob @tag`");
        }

        // Resolve JID/nomor -> baris user internal (id autoincrement), BUKAN nomor telepon mentah.
        const rawNumber = targetJid.split("@")[0];
        const target = findUserByJid(db, targetJid) ?? findUserByNumber(db, rawNumber);

        if (!target) {
            return ctx.reply("❌ User itu belum pernah berinteraksi dengan bot ini.");
        }
        if (target.id === ctx.dbUser.id) {
            return ctx.reply("❌ Tidak bisa merampok diri sendiri.");
        }

        const robberId = ctx.dbUser.id;

        const remaining = getRemainingCooldown(db, robberId, ACTION_KEY);
        if (remaining > 0) {
            return ctx.reply(`⏳ Kamu masih bersembunyi dari polisi. Coba rampok lagi dalam ${formatDuration(remaining)}.`);
        }

        try {
            const result = robPlayer(db, robberId, target.id);
            setCooldown(db, robberId, ACTION_KEY, COOLDOWN_SECONDS);

            const targetLabel = target.display_name || target.push_name || rawNumber;

            if (result.success) {
                await ctx.reply(`🥷 *PERAMPOKAN SUKSES!*\n\nKamu diam-diam merampok @${rawNumber} dan mendapatkan hadiah sebesar ${money(result.amount)}!`, { mentions: [targetJid] });
            } else {
                await ctx.reply(`🚓 *TERTANGKAP BASAH!*\n\nTarget (${targetLabel}) melawan balik dan melaporkanmu ke polisi. Kamu membayar denda rumah sakit/polisi sebesar ${money(result.fine)}!`);
            }
        } catch (error) {
            // Percobaan gagal karena validasi (target kemiskinan/modal kurang) tidak kena cooldown,
            // supaya user bisa langsung coba target lain tanpa nunggu 5 menit.
            await ctx.reply(`❌ *GAGAL MERAMPOK:* ${error.message}`);
        }
    }, {
        aliases: ["rampok"],
        category: "RPG",
        description: "Rampok uang pemain lain (Risiko denda 10%)",
    });
}