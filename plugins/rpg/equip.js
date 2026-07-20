import { getInventory } from "../../db/repo/items.js";

export default function (bot) {
    bot.command("equip", async (ctx) => {
        const itemCodeOrName = ctx.args.join(" ")?.toLowerCase();
        if (!itemCodeOrName) {
            return ctx.reply(`❌ Format salah! Gunakan: \`${bot.options.prefix}equip <kode_item>\``);
        }

        const userId = ctx.dbUser.id;
        const db = bot.db;

        // Cari item di inventory
        const inventory = getInventory(db, userId);
        const itemToEquip = inventory.find(i => 
            i.code.toLowerCase() === itemCodeOrName || 
            i.name.toLowerCase() === itemCodeOrName
        );

        if (!itemToEquip) {
            return ctx.reply(`❌ Kamu tidak memiliki item tersebut di tasmu.`);
        }

        const slot = itemToEquip.equip_slot;
        if (!slot) {
            return ctx.reply(`❌ *${itemToEquip.name}* bukanlah peralatan yang bisa dipakai (equip).`);
        }

        if (itemToEquip.is_equipped) {
            return ctx.reply(`⚠️ *${itemToEquip.name}* sudah sedang dipakai.`);
        }

        const apply = db.transaction(() => {
            // Lepas equip lama di slot yang sama (jika ada)
            db.prepare(`
                UPDATE inventory 
                SET is_equipped = 0 
                WHERE user_id = ? AND item_id IN (
                    SELECT item_id FROM items WHERE equip_slot = ?
                ) AND is_equipped = 1
            `).run(userId, slot);

            db.prepare(`DELETE FROM equipment WHERE user_id = ? AND slot = ?`).run(userId, slot);

            // Pakai equip baru
            db.prepare(`UPDATE inventory SET is_equipped = 1 WHERE id = ?`).run(itemToEquip.inventory_id);
            db.prepare(`INSERT INTO equipment (user_id, slot, inventory_id) VALUES (?, ?, ?)`).run(userId, slot, itemToEquip.inventory_id);
        });

        apply();

        ctx.reply(`✅ Berhasil memakai **${itemToEquip.name}** di slot *${slot.toUpperCase()}*.`);
    }, { aliases: ["pakai", "kenakan", "use"], category: "RPG", description: "Memakai senjata atau armor dari tas." });

    bot.command("unequip", async (ctx) => {
        const slot = ctx.args[0]?.toLowerCase();
        if (!slot) {
            return ctx.reply(`❌ Format salah! Gunakan: \`${bot.options.prefix}unequip <weapon/armor/shield>\``);
        }

        const userId = ctx.dbUser.id;
        const db = bot.db;

        const apply = db.transaction(() => {
            db.prepare(`
                UPDATE inventory 
                SET is_equipped = 0 
                WHERE user_id = ? AND item_id IN (
                    SELECT item_id FROM items WHERE equip_slot = ?
                ) AND is_equipped = 1
            `).run(userId, slot);

            db.prepare(`DELETE FROM equipment WHERE user_id = ? AND slot = ?`).run(userId, slot);
        });

        apply();

        ctx.reply(`✅ Berhasil melepas peralatan dari slot *${slot.toUpperCase()}*.`);
    }, { aliases: ["lepas"], category: "RPG", description: "Melepas senjata atau armor yang sedang dipakai." });
}
