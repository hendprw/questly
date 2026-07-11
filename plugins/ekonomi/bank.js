import { getWallet, deposit, withdraw } from "../../db/repo/economy.js";
import { money } from "../../lib/format.js";

export default function (bot) {
    bot.command("bank", async (ctx) => {
        const wallet = getWallet(bot.db, ctx.dbUser.id);
        
        const text = `🏦 *BANK CENTRAL PUSAT*\n\n` +
                     `💰 *Cash*: ${money(wallet.cash)}\n` +
                     `💳 *Bank*: ${money(wallet.bank)}\n\n` +
                     `*Menu Interaktif (Ketik perintah di bawah):*\n` +
                     `> \`!bank deposit <jumlah>\`\n` +
                     `> \`!bank withdraw <jumlah>\``;
                     
        await ctx.reply(text);
    }, { aliases: ["b"], category: "Ekonomi", description: "Cek saldo dan akses bank" })
    
    .sub("deposit", async (ctx) => {
        const amount = parseInt(ctx.args[0]);
        if (isNaN(amount)) return ctx.reply("Format salah! Contoh: `!bank deposit 1000`");
        
        try {
            const result = deposit(bot.db, ctx.dbUser.id, amount);
            await ctx.reply(`✅ *DEPOSIT SUKSES*\n\nBerhasil menyimpan ${money(result.amount)} ke Bank.\nSisa Cash: ${money(result.cash)}\nTotal Bank: ${money(result.bank)}`);
        } catch (error) {
            await ctx.reply(`❌ *GAGAL:* ${error.message}`);
        }
    }, { description: "Simpan cash ke bank" })
    
    .sub("withdraw", async (ctx) => {
        const amount = parseInt(ctx.args[0]);
        if (isNaN(amount)) return ctx.reply("Format salah! Contoh: `!bank withdraw 1000`");
        
        try {
            const result = withdraw(bot.db, ctx.dbUser.id, amount);
            await ctx.reply(`✅ *PENARIKAN SUKSES*\n\nBerhasil menarik ${money(result.amount)} dari Bank.\nSisa Bank: ${money(result.bank)}\nTotal Cash: ${money(result.cash)}`);
        } catch (error) {
            await ctx.reply(`❌ *GAGAL:* ${error.message}`);
        }
    }, { description: "Tarik uang dari bank" });
}