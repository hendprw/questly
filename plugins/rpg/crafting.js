import { getItemByCode, hasItem, removeItem, addItem } from "../../db/repo/items.js";
import { getFullProfile } from "../../db/repo/users.js";
import { addXp } from "../../db/repo/leveling.js";

function handleCrafting(bot, ctx, itemCode, qty, requiredCategoryGroups, actionName, successEmoji) {
    if (!itemCode) {
        return ctx.reply(`❌ Format salah!\n- \`${bot.options.prefix}${actionName} list\` (Lihat resep)\n- \`${bot.options.prefix}${actionName} info <kode>\` (Detail resep)\n- \`${bot.options.prefix}${actionName} <kode_item> [jumlah]\` (Merakit)`);
    }

    const db = bot.db;

    // --- FITUR LIST ---
    if (itemCode.toLowerCase() === 'list') {
        const queryCats = requiredCategoryGroups.map(c => `'${c}'`).join(',');
        const recipes = db.prepare(`SELECT code, name, category, crafting FROM items WHERE category IN (${queryCats}) AND crafting IS NOT NULL ORDER BY rarity, name`).all();
        
        if (recipes.length === 0) return ctx.reply(`Belum ada resep yang tersedia untuk ${actionName}.`);

        let msg = `*--- 📜 DAFTAR RESEP ${actionName.toUpperCase()} ---*\n\n`;
        for (const r of recipes) {
            msg += `• *${r.name}* (Kode: \`${r.code}\`)\n`;
        }
        msg += `\n_Ketik \`${bot.options.prefix}${actionName} info <kode>\` untuk melihat material yang dibutuhkan._`;
        return ctx.reply(msg);
    }

    // --- FITUR INFO ---
    if (itemCode.toLowerCase() === 'info') {
        const targetCode = qty; // Argument kedua menjadi targetCode
        if (!targetCode) return ctx.reply(`❌ Masukkan kode item. Contoh: \`${bot.options.prefix}${actionName} info ramuan_penyembuh\``);
        
        const item = getItemByCode(db, targetCode);
        if (!item || !item.crafting || !requiredCategoryGroups.includes(item.category)) {
            return ctx.reply(`❌ Resep untuk \`${targetCode}\` tidak ditemukan di kategori ini.`);
        }

        let msg = `*--- 🔍 DETAIL RESEP: ${item.name} ---*\n\n`;
        msg += `*Deskripsi:* _${item.description}_\n\n`;
        msg += `*Bahan yang Dibutuhkan (Per 1x Buat):*\n`;
        for (const [matCode, amount] of Object.entries(item.crafting.materials)) {
            const matItem = getItemByCode(db, matCode);
            const matName = matItem ? matItem.name : matCode;
            msg += `- ${amount}x ${matName}\n`;
        }
        return ctx.reply(msg);
    }

    const amountToCraft = parseInt(qty) || 1;
    if (amountToCraft < 1) return ctx.reply("❌ Jumlah harus lebih dari 0.");

    const item = getItemByCode(db, itemCode);
    if (!item) return ctx.reply(`❌ Item dengan kode \`${itemCode}\` tidak ditemukan.`);

    if (!requiredCategoryGroups.includes(item.category)) {
        return ctx.reply(`❌ Kamu tidak bisa menggunakan \`${actionName}\` untuk membuat ${item.name} (Kategori: ${item.category}).`);
    }

    const craftingData = item.crafting;
    if (!craftingData) {
        return ctx.reply(`❌ ${item.name} tidak memiliki resep untuk dirakit.`);
    }

    const userId = ctx.dbUser.id;
    
    // Cek ketersediaan material
    let missingMats = [];
    for (const [matCode, amount] of Object.entries(craftingData.materials)) {
        const requiredAmount = amount * amountToCraft;
        if (!hasItem(bot.db, userId, matCode, requiredAmount)) {
            const matItem = getItemByCode(bot.db, matCode);
            const matName = matItem ? matItem.name : matCode;
            missingMats.push(`- ${requiredAmount}x ${matName}`);
        }
    }

    if (missingMats.length > 0) {
        return ctx.reply(`❌ Bahan tidak cukup untuk membuat ${amountToCraft}x ${item.name}:\n\n${missingMats.join('\n')}`);
    }

    // Ambil profile untuk pasif class
    const profile = getFullProfile(bot.db, userId);
    const charClass = profile.character.class;

    let finalYield = amountToCraft;
    let bonusMsg = "";

    // Implementasi Pasif Penyihir untuk Alkimia
    if (actionName === "alkimia") {
        let greatSuccessChance = 0;
        if (charClass === "penyihir") {
            greatSuccessChance = 15; // 15% flat untuk penyihir
        } else {
            greatSuccessChance = profile.character.level; // 1% per level untuk non-penyihir ala Orion RPG
        }

        if (Math.random() * 100 < greatSuccessChance) { 
            finalYield *= 2;
            bonusMsg = `\n✨ *Great Success!* Ramuanmu bereaksi sempurna! Kamu mendapatkan hasil 2x lipat.`;
        }
    }

    // Kurangi material
    for (const [matCode, amount] of Object.entries(craftingData.materials)) {
        removeItem(bot.db, userId, matCode, amount * amountToCraft);
    }

    // Tambah item
    addItem(bot.db, userId, item.code, finalYield);
    
    // Tambah XP (15 XP per item yang diminta craft, bukan final yield)
    const xpGained = 15 * amountToCraft;
    const leveled = addXp(bot.db, userId, xpGained);

    let text = `${successEmoji} *Berhasil Membuat Barang!*\n\nKamu telah merakit **${finalYield}x ${item.name}**.\n✨ Mendapat +${xpGained} EXP.`;
    if (bonusMsg) text += bonusMsg;

    ctx.reply(text);

    if (leveled && leveled.leveledUp) {
        setTimeout(async () => {
            try {
                if (bot.sock) await bot.sock.sendMessage(ctx.sender, { text: `🎉 Selamat! Kamu telah naik ke *Level ${leveled.after.level}*!` });
            } catch(e) { console.error(e); }
        }, 1000);
    }
}

export default function (bot) {
    bot.command("craft", async (ctx) => {
        handleCrafting(bot, ctx, ctx.args[0], ctx.args[1], ["weapon", "armor", "shield"], "craft", "🛠️");
    }, { aliases: ["tempa", "buat"], category: "RPG", description: "Merakit senjata atau perlengkapan." });

    bot.command("cook", async (ctx) => {
        handleCrafting(bot, ctx, ctx.args[0], ctx.args[1], ["food", "consumable"], "cook", "🍳");
    }, { aliases: ["masak", "koki"], category: "RPG", description: "Memasak bahan makanan menjadi hidangan." });

    bot.command("alkimia", async (ctx) => {
        // Alkimia bisa membuat ramuan (potion) atau material sintesis (material)
        handleCrafting(bot, ctx, ctx.args[0], ctx.args[1], ["potion", "material"], "alkimia", "🧪");
    }, { aliases: ["alchemy", "brew"], category: "RPG", description: "Meracik ramuan ajaib atau mengubah material." });
}
