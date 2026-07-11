import { robPlayer } from "../../db/repo/economy.js";
import { money } from "../../lib/format.js";

export default function (bot) {
    bot.command("rob", async (ctx) => {
        let targetJid = ctx.mentionedJid?.[0];
        if (!targetJid && ctx.args[0] && ctx.args[0].includes("@")) {
            targetJid = ctx.args[0].replace(/[@c.us]/g, "") + "@s.whatsapp.net";
        }

        if (!targetJid) {
            return ctx.reply("Tag target yang ingin kamu rampok!\nContoh: `!rob @tag`");
        }

        const targetId = targetJid.split("@")[0];
        const robberId = ctx.dbUser.id;

        try {
            const result = robPlayer(bot.db, robberId, targetId);
            
            if (result.success) {
                await ctx.reply(`🥷 *PERAMPOKAN SUKSES!*\n\nKamu diam-diam merampok @${targetId} dan mendapatkan hadiah sebesar ${money(result.amount)}!`, { mentions: [targetJid] });
            } else {
                await ctx.reply(`🚓 *TERTANGKAP BASAH!*\n\nTarget melawan balik dan melaporkanmu ke polisi. Kamu membayar denda rumah sakit/polisi sebesar ${money(result.fine)}!`);
            }
        } catch (error) {
            await ctx.reply(`❌ *GAGAL MERAMPOK:* ${error.message}`);
        }
    }, { 
        aliases: ["rampok"], 
        category: "RPG", 
        description: "Rampok uang pemain lain (Risiko denda 10%)",
        cooldown: 300000 // Cooldown 5 menit agar tidak spam
    });
}