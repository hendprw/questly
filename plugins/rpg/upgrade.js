import { hasItem, removeItem } from "../../db/repo/items.js";
import { getFullProfile } from "../../db/repo/users.js";
import { removeCash } from "../../db/repo/economy.js";
import { money } from "../../lib/format.js";

export default function (bot) {
    bot.command("upgrade", async (ctx) => {
        const slot = ctx.args[0]?.toLowerCase();
        
        if (!slot || !["weapon", "armor"].includes(slot)) {
            return ctx.reply(`❌ Format salah! Gunakan: \`${bot.options.prefix}upgrade <weapon/armor>\``);
        }

        const userId = ctx.dbUser.id;
        const db = bot.db;

        // Ambil item yang sedang dipakai di slot tersebut
        const equipped = db.prepare(`
            SELECT inv.id as inv_id, inv.instance_metadata, it.code, it.name, it.metadata 
            FROM equipment eq
            JOIN inventory inv ON eq.inventory_id = inv.id
            JOIN items it ON inv.item_id = it.id
            WHERE eq.user_id = ? AND eq.slot = ?
        `).get(userId, slot);

        if (!equipped) {
            return ctx.reply(`❌ Kamu tidak sedang memakai peralatan apapun di slot *${slot}*.`);
        }

        const meta = equipped.metadata ? JSON.parse(equipped.metadata) : {};
        if (!meta.upgrade) {
            return ctx.reply(`❌ *${equipped.name}* tidak dapat di-upgrade/enchant.`);
        }

        const instanceMeta = equipped.instance_metadata ? JSON.parse(equipped.instance_metadata) : {};
        const currentLevel = instanceMeta.level || 1;

        if (currentLevel >= meta.upgrade.maxLevel) {
            return ctx.reply(`❌ *${equipped.name}* sudah mencapai level maksimal (Lv. ${meta.upgrade.maxLevel}).`);
        }

        const nextLevel = currentLevel + 1;
        const upgradeCost = meta.upgrade.cost.find(c => c.level === nextLevel);

        if (!upgradeCost) {
            return ctx.reply(`❌ Terjadi kesalahan: Data biaya upgrade untuk level ${nextLevel} tidak ditemukan.`);
        }

        // Cek Solari/Aester
        const profile = getFullProfile(db, userId);
        if ((profile.wallet.cash || 0) < upgradeCost.aester) {
            return ctx.reply(`❌ Aester kamu tidak cukup. Butuh ${money(upgradeCost.aester)}, kamu hanya punya ${money(profile.wallet.cash || 0)}.`);
        }

        // Cek Material
        let missingMats = [];
        for (const [matCode, reqAmount] of Object.entries(upgradeCost.materials)) {
            if (!hasItem(db, userId, matCode, reqAmount)) {
                const matData = db.prepare("SELECT name FROM items WHERE code = ?").get(matCode);
                const matName = matData ? matData.name : matCode;
                missingMats.push(`- ${reqAmount}x ${matName}`);
            }
        }

        if (missingMats.length > 0) {
            return ctx.reply(`❌ Material untuk upgrade *${equipped.name}* tidak cukup:\n\n${missingMats.join('\n')}`);
        }

        // Eksekusi Upgrade
        const apply = db.transaction(() => {
            // Kurangi uang
            removeCash(db, userId, upgradeCost.aester, { note: `Upgrade ${equipped.name} to Lv${nextLevel}` });
            
            // Kurangi material
            for (const [matCode, reqAmount] of Object.entries(upgradeCost.materials)) {
                removeItem(db, userId, matCode, reqAmount);
            }

            // Update level
            instanceMeta.level = nextLevel;
            db.prepare(`UPDATE inventory SET instance_metadata = ? WHERE id = ?`)
              .run(JSON.stringify(instanceMeta), equipped.inv_id);
        });

        apply();

        // Siapkan teks bonus status
        const statsObj = meta.upgrade.statGrowth || {};
        const newStatsText = Object.entries(statsObj)
            .map(([stat, value]) => `${stat.toUpperCase()} +${value}`)
            .join(', ');

        return ctx.reply(`🎉 *Upgrade Berhasil!* 🎉\n\n*${equipped.name}* milikmu memancarkan cahaya baru dan telah ditempa menjadi *Level ${nextLevel}*.\n\n✨ *Bonus Stat:* ${newStatsText}`);
    }, { aliases: ["enchant", "tempa"], category: "RPG", description: "Meningkatkan level equipment yang sedang dipakai." });
}
