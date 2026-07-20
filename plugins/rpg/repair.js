import { getInventory, getItemByCode, hasItem, removeItem } from "../../db/repo/items.js";
import { getFullProfile } from "../../db/repo/users.js";
import { removeCash } from "../../db/repo/economy.js";

const RARITY_COST = {
    'common': 10,
    'uncommon': 25,
    'rare': 50,
    'epic': 150,
    'legendary': 500,
    'mythic': 1000
};

export default function (bot) {
    bot.command("repair", async (ctx) => {
        const itemCodeOrName = ctx.args.join(" ")?.toLowerCase();
        if (!itemCodeOrName) {
            return ctx.reply(`❌ Format salah! Gunakan: \`${bot.options.prefix}repair <nama_equipment>\`\n(Atau bawa ke Blacksmith jika kamu punya materialnya)`);
        }

        const userId = ctx.dbUser.id;
        const db = bot.db;

        const inventory = getInventory(db, userId);
        const itemToRepair = inventory.find(i => 
            i.code.toLowerCase() === itemCodeOrName || 
            i.name.toLowerCase() === itemCodeOrName
        );

        if (!itemToRepair) {
            return ctx.reply(`❌ Kamu tidak memiliki item tersebut di tasmu.`);
        }

        if (itemToRepair.category !== 'weapon' && itemToRepair.category !== 'armor') {
            return ctx.reply(`❌ Hanya senjata dan armor yang bisa diperbaiki.`);
        }

        if (itemToRepair.durability >= 100) {
            return ctx.reply(`✅ *${itemToRepair.name}* milikmu masih dalam kondisi sempurna (100/100).`);
        }

        const missingDurability = 100 - (itemToRepair.durability || 0);
        const costPerPoint = RARITY_COST[itemToRepair.rarity] || 10;
        let totalCost = missingDurability * costPerPoint;

        // Diskon untuk item yang hancur total? Tidak, harganya flat sesuai kerusakan.
        
        // Cari material requirement dari resep crafting
        const itemDef = getItemByCode(db, itemToRepair.code);
        let requiredMaterials = [];
        let matString = "";

        if (itemDef.crafting && itemDef.crafting.materials) {
            for (const [matCode, qty] of Object.entries(itemDef.crafting.materials)) {
                // Untuk repair, butuh 20% dari material asli (minimal 1)
                const repairQty = Math.max(1, Math.floor(qty * 0.2));
                requiredMaterials.push({ code: matCode, qty: repairQty });
                const matDef = getItemByCode(db, matCode);
                matString += `\n  - ${repairQty}x ${matDef ? matDef.name : matCode}`;
            }
        } else {
            // Jika tidak ada resep crafting, butuh iron_ore (common) atau aester_shard
            if (itemToRepair.rarity === 'legendary' || itemToRepair.rarity === 'mythic') {
                requiredMaterials.push({ code: 'aester_shard', qty: 1 });
                matString += `\n  - 1x Aester Shard`;
            } else {
                requiredMaterials.push({ code: 'iron_ore', qty: 2 });
                matString += `\n  - 2x Iron Ore`;
            }
        }

        const profile = getFullProfile(db, userId);
        const cash = profile.wallet.cash || 0;

        // Validasi uang
        if (cash < totalCost) {
            return ctx.reply(`❌ Aester kamu tidak cukup! Butuh 🪙 ${totalCost.toLocaleString("id-ID")} Aester untuk memperbaiki ${missingDurability} poin durabilitas *${itemToRepair.name}*.`);
        }

        // Validasi material
        for (const req of requiredMaterials) {
            if (!hasItem(db, userId, req.code, req.qty)) {
                return ctx.reply(`❌ Material tidak cukup!\nUntuk memperbaiki *${itemToRepair.name}* kamu butuh:\n🪙 ${totalCost.toLocaleString("id-ID")} Aester${matString}`);
            }
        }

        // Eksekusi
        const apply = db.transaction(() => {
            removeCash(db, userId, totalCost, { note: `Repair ${itemToRepair.code}` });
            for (const req of requiredMaterials) {
                removeItem(db, userId, req.code, req.qty);
            }
            db.prepare(`UPDATE inventory SET durability = 100 WHERE id = ?`).run(itemToRepair.inventory_id);
        });

        try {
            apply();
            return ctx.reply(`🔨 *Ting.. Tong..*\nBlacksmith berhasil memperbaiki *${itemToRepair.name}* milikmu kembali ke kondisi sempurna (100/100)!\n\n_(-🪙 ${totalCost.toLocaleString("id-ID")} Aester)_`);
        } catch (e) {
            return ctx.reply(`❌ Gagal memperbaiki: ${e.message}`);
        }

    }, { aliases: ["perbaiki"], category: "RPG", description: "Memperbaiki equipment yang rusak." });
}
