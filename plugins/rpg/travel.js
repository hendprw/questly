import { getFullProfile } from "../../db/repo/users.js";
import { getRemainingCooldown, setCooldown, formatDuration } from "../../db/repo/cooldowns.js";
import { removeCash } from "../../db/repo/economy.js";
import { getAndRegenerateStamina, consumeStamina } from "../../db/repo/stamina.js";

export default function (bot) {
    bot.command("travel", async (ctx) => {
        const profile = getFullProfile(bot.db, ctx.dbUser.id);
        const { character, leveling, wallet } = profile;
        const currentLoc = character.location || 'Ibu Kota';

        const destinationArg = ctx.args[0]?.toLowerCase();
        const travelCost = 250;
        const travelStamina = 20;
        const travelCooldown = 300; // 5 menit

        const biomes = bot.db.prepare("SELECT * FROM biomes").all();

        // Helper untuk cek apakah biome sudah terbuka (via Item atau Community Project)
        const isUnlocked = (unlockedBy) => {
            if (!unlockedBy) return true;
            
            // Jika diawali dengan 'project_', cek tabel community_projects
            if (unlockedBy.startsWith('project_')) {
                const proj = bot.db.prepare("SELECT is_completed FROM community_projects WHERE code = ?").get(unlockedBy);
                return proj && proj.is_completed === 1;
            }

            // Jika bukan project, cek apakah item ada di inventory (Tas)
            const item = bot.db.prepare(
                `SELECT inv.id FROM inventory inv 
                 JOIN items it ON it.id = inv.item_id 
                 WHERE inv.user_id = ? AND it.code = ?`
            ).get(ctx.dbUser.id, unlockedBy);
            
            return !!item;
        };

        // 1. Tampilkan Menu Biome
        if (!destinationArg) {
            let message = `🧭 Kamu saat ini berada di *${currentLoc}*.\n\n`;
            message += `*Tujuan yang Tersedia (Biaya: ${travelCost} Aester):*\n\n`;
            
            for (const biome of biomes) {
                // Cek syarat hidden & item unlock
                if (biome.is_hidden && !isUnlocked(biome.unlocked_by)) continue;
                
                // Cek syarat level
                if (leveling.level < biome.min_level) continue;

                if (biome.name !== currentLoc) {
                    message += `*${biome.name}* (Min Lvl: ${biome.min_level})\n`;
                    message += `_${biome.description}_\n`;
                    message += `(Ketik: \`${bot.options.prefix}travel ${biome.code}\`)\n\n`;
                }
            }
            return ctx.reply(message.trim());
        }

        // 2. Eksekusi Perjalanan
        // Cek cooldown
        const remaining = getRemainingCooldown(bot.db, ctx.dbUser.id, "travel");
        if (remaining > 0) {
            return ctx.reply(`Kamu masih lelah dari perjalanan sebelumnya. Tunggu ${formatDuration(remaining)} lagi.`);
        }

        // Cari biome tujuan
        const targetBiome = biomes.find(b => b.code.toLowerCase() === destinationArg);
        if (!targetBiome) {
            return ctx.reply(`Tujuan "${destinationArg}" tidak ditemukan. Cek ejaan kode dengan mengetik \`${bot.options.prefix}travel\` saja.`);
        }

        // Validasi syarat masuk biome
        if (targetBiome.is_hidden && !isUnlocked(targetBiome.unlocked_by)) {
            if (targetBiome.unlocked_by.startsWith('project_')) {
                return ctx.reply(`Kamu tidak bisa pergi ke *${targetBiome.name}*. Jalur menuju ke sana masih terputus dan butuh proyek gotong royong (!project) untuk memperbaikinya.`);
            }
            return ctx.reply(`Kamu tidak bisa pergi ke *${targetBiome.name}*. Jalur menuju ke sana masih tertutup kabut rahasia.`);
        }

        if (leveling.level < targetBiome.min_level) {
            return ctx.reply(`Levelmu terlalu rendah untuk bertahan hidup di *${targetBiome.name}*. Dibutuhkan minimal Level ${targetBiome.min_level}.`);
        }

        if (targetBiome.name === currentLoc) {
            return ctx.reply(`Kamu sudah berada di ${targetBiome.name}.`);
        }

        if (wallet.cash < travelCost) {
            return ctx.reply(`Aester kamu tidak cukup. Perjalanan jauh membutuhkan biaya ${travelCost} Aester.`);
        }

        const staminaData = getAndRegenerateStamina(bot.db, ctx.dbUser.id);
        if (staminaData.stamina < travelStamina) {
            return ctx.reply(`⚡ Kamu terlalu lelah untuk melakukan perjalanan sejauh itu! Butuh ${travelStamina} Stamina.`);
        }

        // Transaksi
        try {
            const apply = bot.db.transaction(() => {
                removeCash(bot.db, ctx.dbUser.id, travelCost, `Travel ke ${targetBiome.name}`);
                consumeStamina(bot.db, ctx.dbUser.id, travelStamina);
                bot.db.prepare(`UPDATE characters SET location = ? WHERE user_id = ?`).run(targetBiome.name, ctx.dbUser.id);
                setCooldown(bot.db, ctx.dbUser.id, "travel", travelCooldown);
            });
            apply();
            
            return ctx.reply(`✅ Perjalanan berhasil! Kamu telah tiba di *${targetBiome.name}*.\n\n- ${travelCost} Aester\n- ⚡ ${travelStamina} Stamina`);
        } catch (err) {
            return ctx.reply(`❌ Gagal: ${err.message}`);
        }

    }, { aliases: ["pergi"], category: "RPG", description: "Pergi menjelajahi dunia dan pindah wilayah (Biome)." });
}
