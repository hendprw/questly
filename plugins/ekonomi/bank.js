import { getWallet, deposit, withdraw } from "../../db/repo/economy.js";
import { progressBar } from "../../lib/format.js";

const fmt = (num) => num.toLocaleString('id-ID');

export default function (bot) {
    bot.command("bank", async (ctx) => {
        const wallet = getWallet(bot.db, ctx.dbUser.id);
        
        const percentage = ((wallet.bank / wallet.bank_capacity) * 100).toFixed(1);
        const availableSpace = wallet.bank_capacity - wallet.bank;
        const name = ctx.dbUser.display_name || ctx.dbUser.push_name || ctx.senderNumber;

        let statusMessage = `╭─── [ 🏦 *BANK QUESTLY* ] ───\n`;
        statusMessage += `│ 👤 *Nasabah:* ${name}\n`;
        statusMessage += `│ 👛 *Dompet:* 🪙 ${fmt(wallet.cash)}\n`;
        statusMessage += `│ 💰 *Tabungan:* 🪙 ${fmt(wallet.bank)} / ${fmt(wallet.bank_capacity)}\n`;
        statusMessage += `│ 📊 *Kapasitas:* [${progressBar(wallet.bank, wallet.bank_capacity, 10)}] ${percentage}%\n`;
        statusMessage += `╰─────────────────────────────\n`;
        statusMessage += `💡 _Bisa simpan: 🪙 ${fmt(availableSpace)} lagi_\n`;
        statusMessage += `_Gunakan: \`!bank depo all\` atau \`!bank wd 500\`_`;
                     
        await ctx.reply(statusMessage);
    }, { aliases: ["b"], category: "Ekonomi", description: "Cek saldo dan akses bank" })
    
    .sub("deposit", async (ctx) => {
        const wallet = getWallet(bot.db, ctx.dbUser.id);
        const amountArg = ctx.args[0]?.toLowerCase();
        
        if (!amountArg) return ctx.reply(`❌ Harap sertakan jumlah.\nContoh: \`!bank depo 5000\`, \`!bank wd all\`, atau \`!bank depo half\``);
        
        let amountToMove = 0;
        if (amountArg === 'all' || amountArg === 'max') amountToMove = wallet.cash;
        else if (amountArg === 'half') amountToMove = Math.floor(wallet.cash / 2);
        else amountToMove = parseInt(amountArg);

        if (isNaN(amountToMove) || amountToMove <= 0) return ctx.reply("❌ Jumlah tidak valid.");
        if (amountToMove > wallet.cash) return ctx.reply(`❌ Uang di dompet kurang! Kamu cuma punya ${fmt(wallet.cash)} 🪙.`);

        if (wallet.bank >= wallet.bank_capacity) {
            return ctx.reply(`⚠️ *Bank Penuh!* Kapasitas bankmu sudah mencapai batas maksimal (${fmt(wallet.bank_capacity)} 🪙).\nUpgrade bank untuk menyimpan lebih banyak.`);
        }

        const spaceAvailable = wallet.bank_capacity - wallet.bank;
        let actualDeposit = amountToMove;
        let overflowMsg = '';

        if (amountToMove > spaceAvailable) {
            actualDeposit = spaceAvailable;
            overflowMsg = `\n⚠️ _Bank penuh! Sisa ${fmt(amountToMove - spaceAvailable)} dikembalikan ke dompet._`;
        }

        try {
            const result = deposit(bot.db, ctx.dbUser.id, actualDeposit);
            await ctx.reply(`✅ *SETOR TUNAI BERHASIL*\n📥 Masuk Bank: *${fmt(actualDeposit)}* 🪙\n🏦 Total Bank: ${fmt(result.bank)} 🪙${overflowMsg}`);
        } catch (error) {
            await ctx.reply(`❌ *GAGAL:* ${error.message}`);
        }
    }, { aliases: ["depo", "dp", "simpan"], description: "Simpan cash ke bank" })
    
    .sub("withdraw", async (ctx) => {
        const wallet = getWallet(bot.db, ctx.dbUser.id);
        const amountArg = ctx.args[0]?.toLowerCase();
        
        if (!amountArg) return ctx.reply(`❌ Harap sertakan jumlah.\nContoh: \`!bank depo 5000\`, \`!bank wd all\`, atau \`!bank depo half\``);
        
        let amountToMove = 0;
        if (amountArg === 'all' || amountArg === 'max') amountToMove = wallet.bank;
        else if (amountArg === 'half') amountToMove = Math.floor(wallet.bank / 2);
        else amountToMove = parseInt(amountArg);

        if (isNaN(amountToMove) || amountToMove <= 0) return ctx.reply("❌ Jumlah tidak valid.");
        if (amountToMove > wallet.bank) return ctx.reply(`❌ Saldo bank kurang! Tabunganmu hanya ${fmt(wallet.bank)} 🪙.`);
        
        try {
            const result = withdraw(bot.db, ctx.dbUser.id, amountToMove);
            await ctx.reply(`✅ *TARIK TUNAI BERHASIL*\n📤 Masuk Dompet: *${fmt(amountToMove)}* 🪙\n👛 Total Dompet: ${fmt(result.cash)} 🪙`);
        } catch (error) {
            await ctx.reply(`❌ *GAGAL:* ${error.message}`);
        }
    }, { aliases: ["wd", "ambil", "tarik"], description: "Tarik uang dari bank" });
}