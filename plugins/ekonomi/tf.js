import { transferCash } from "../../db/repo/economy.js";
import { money } from "../../lib/format.js";

export default function (bot) {
    bot.command("transfer", async (ctx) => {
        // Mendapatkan target dari tag atau argumen pertama
        let targetJid = ctx.mentionedJid?.[0];
        if (!targetJid && ctx.args[0] && ctx.args[0].includes("@")) {
            targetJid = ctx.args[0].replace(/[@c.us]/g, "") + "@s.whatsapp.net";
        }
        
        const amount = parseInt(ctx.args[1]);

        if (!targetJid || isNaN(amount)) {
            return ctx.reply("Format salah!\nCara penggunaan: `!transfer @tag 5000`");
        }

        // Resolusi user_id target di database (Botify mengambil nomor WA sbg ID atau via repo users)
        // Disini kita asumsikan getOrCreateUser sudah menyimpan JID sebagai ID atau kita extract nomornya.
        const targetId = targetJid.split("@")[0]; 
        const senderId = ctx.dbUser.id;

        try {
            const result = transferCash(bot.db, senderId, targetId, amount);
            await ctx.reply(`💸 *TRANSFER BERHASIL*\n\nKamu telah mengirimkan ${money(result.amount)} ke @${targetId}.`, { mentions: [targetJid] });
        } catch (error) {
            await ctx.reply(`❌ *GAGAL TRANSFER:* ${error.message}`);
        }
    }, { aliases: ["tf", "pay"], category: "Ekonomi", description: "Kirim uang ke pemain lain" });
}