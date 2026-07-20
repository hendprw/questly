import { getGudangState, getGudangItems, depositToGudang, withdrawFromGudang } from "../../db/repo/gudang.js";
import { getInventory } from "../../db/repo/items.js";

function formatGudang(gudangState, gudangItems) {
    let message = `*--- 📦 GUDANG PRIBADI ---*\n\n`;
    message += `*Kapasitas:* ${gudangState.gudang_weight.toLocaleString()}/${gudangState.max_gudang_weight.toLocaleString()} ⚖️\n\n`;

    if (!gudangItems || gudangItems.length === 0) {
        message += 'Gudangmu kosong melompong.';
        return message;
    }

    const hasItems = gudangItems.some(i => i.category !== 'material');
    const hasResources = gudangItems.some(i => i.category === 'material');

    if (hasItems) {
        message += '*╭─── • 「 🎒 ITEM 」*\n';
        for (const item of gudangItems.filter(i => i.category !== 'material')) {
            message += `*│* • *${item.name}* (x${item.quantity.toLocaleString()})\n`;
            message += `*│* └── ID: \`${item.code}\`\n`;
        }
        message += '*╰────────────*\n\n';
    }

    if (hasResources) {
        message += '*╭─── • 「 🌿 SUMBER ALAM 」*\n';
        for (const item of gudangItems.filter(i => i.category === 'material')) {
            message += `*│* • *${item.name}* (x${item.quantity.toLocaleString()})\n`;
            message += `*│* └── ID: \`${item.code}\`\n`;
        }
        message += '*╰──────────────────*';
    }
    return message.trim();
}

export default function (bot) {
    bot.command("gudang", async (ctx) => {
        const subCommand = ctx.args[0]?.toLowerCase();
        
        if (!subCommand) {
            const state = getGudangState(bot.db, ctx.dbUser.id);
            const items = getGudangItems(bot.db, ctx.dbUser.id);
            const gudangMessage = formatGudang(state, items);
            const helpText = `\n\n*--- Perintah Gudang ---*\n`+
                             ` • \`${bot.options.prefix}gudang simpan <id> <jumlah|all>\`\n` +
                             ` • \`${bot.options.prefix}gudang simpan all\` (Simpan semua item)\n` +
                             ` • \`${bot.options.prefix}gudang ambil <id> <jumlah|all>\``;
            return ctx.reply(gudangMessage + helpText);
        }

        const itemId = ctx.args[1]?.toLowerCase();
        const amountArg = ctx.args[2];

        switch (subCommand) {
            case 'deposit':
            case 'depo':
            case 'dp':
            case 'simpan': {
                if (itemId === 'all') {
                    const bagItems = getInventory(bot.db, ctx.dbUser.id);
                    if (bagItems.length === 0) return ctx.reply('Tasmu sudah kosong.');

                    let totalWeightToMove = 0;
                    for (const item of bagItems) {
                        totalWeightToMove += (item.weight || 0) * item.quantity; // Assuming weight is fetched in getInventory
                    }

                    const gudangState = getGudangState(bot.db, ctx.dbUser.id);
                    if (gudangState.gudang_weight + totalWeightToMove > gudangState.max_gudang_weight) {
                        return ctx.reply(`Gudang tidak cukup! Butuh ${totalWeightToMove.toLocaleString()} ruang, hanya tersisa ${(gudangState.max_gudang_weight - gudangState.gudang_weight).toLocaleString()}.`);
                    }

                    try {
                        for (const item of bagItems) {
                            depositToGudang(bot.db, ctx.dbUser.id, item.code, 'all');
                        }
                        return ctx.reply('✅ Semua item dari tas berhasil disimpan ke gudang.');
                    } catch (e) {
                        return ctx.reply(`❌ ${e.message}`);
                    }
                }

                if (!itemId || !amountArg) return ctx.reply(`Penggunaan salah. Contoh: \`${bot.options.prefix}gudang simpan wood 100\``);

                try {
                    const { itemInfo, quantity } = depositToGudang(bot.db, ctx.dbUser.id, itemId, amountArg);
                    return ctx.reply(`✅ Berhasil menyimpan ${quantity.toLocaleString()}x *${itemInfo.name}* ke gudang.`);
                } catch (e) {
                    return ctx.reply(`❌ ${e.message}`);
                }
            }

            case 'withdraw':
            case 'wd':
            case 'ambil':
            case 'tarik': {
                if (!itemId || !amountArg) return ctx.reply(`Penggunaan salah. Contoh: \`${bot.options.prefix}gudang ambil wood 100\``);

                try {
                    const { itemInfo, quantity } = withdrawFromGudang(bot.db, ctx.dbUser.id, itemId, amountArg);
                    return ctx.reply(`✅ Berhasil mengambil ${quantity.toLocaleString()}x *${itemInfo.name}* dari gudang.`);
                } catch (e) {
                    return ctx.reply(`❌ ${e.message}`);
                }
            }

            default:
                return ctx.reply('Perintah tidak valid. Gunakan `simpan` atau `ambil`.');
        }
    }, { aliases: ["warehouse", "storage"], category: "Ekonomi", description: "Menyimpan atau mengambil barang dari gudang pribadi yang aman." });
}
