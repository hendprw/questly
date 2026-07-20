import { transferCash, getWallet } from "../../db/repo/economy.js";

const fmt = (num) => num.toLocaleString('id-ID');

export default function (bot) {
    bot.command("transfer", async (ctx) => {
        let targetJid = ctx.mentionedJid?.[0];
        if (!targetJid && ctx.args[0] && ctx.args[0].includes("@")) {
            targetJid = ctx.args[0].replace(/[@c.us]/g, "") + "@s.whatsapp.net";
        }
        
        const amount = parseInt(ctx.args[1]);

        if (!targetJid || isNaN(amount) || amount <= 0) {
            return ctx.reply("Kamu harus me-mention pemain yang ingin kamu transfer beserta jumlahnya.\nContoh: `!transfer @tag 5000`\n(Jumlah transfer harus lebih dari 0)");
        }

        const targetId = targetJid.split("@")[0]; 
        const senderId = ctx.dbUser.id;
        
        if (targetId === String(ctx.senderNumber)) {
            return ctx.reply("Kamu tidak bisa mentransfer Aester ke dirimu sendiri.");
        }

        const wallet = getWallet(bot.db, senderId);
        if (wallet.cash < amount) {
            return ctx.reply(`Aester kamu tidak cukup. Kamu hanya memiliki ${fmt(wallet.cash)}🪙.`);
        }

        // Get Names
        const targetData = bot.db.prepare('SELECT id, push_name, display_name FROM users WHERE phone_number = ?').get(targetId);
        if (!targetData) {
             return ctx.reply('Pemain yang kamu tuju belum terdaftar di dunia RPG.');
        }
        
        const senderName = ctx.dbUser.display_name || ctx.dbUser.push_name || ctx.senderNumber;
        const targetName = targetData.display_name || targetData.push_name || targetId;

        try {
            const result = transferCash(bot.db, senderId, targetData.id, amount);
            
            // Konfirmasi ke pengirim
            await ctx.reply(`✅ Transfer berhasil!\nKamu telah mengirim *${fmt(amount)}*🪙 Aester ke *${targetName}*.\n\nSisa Aester kamu: ${fmt(result.sender.cash)}🪙.`);
            
            // Notifikasi ke penerima
            if (bot.sock) {
                await bot.sock.sendMessage(targetJid, { text: `🔔 Notifikasi Transfer!\nKamu telah menerima *${fmt(amount)}*🪙 Aester dari *${senderName}*.\n\nTotal Aester kamu sekarang: ${fmt(result.receiver.cash)}🪙.` });
            }
        } catch (error) {
            await ctx.reply(`Maaf, terjadi kesalahan saat melakukan transfer.`);
        }
    }, { aliases: ["tf", "pay", "give"], category: "Ekonomi", description: "Mentransfer Aester ke pemain lain" });
}