import { hasItem, removeItem } from "../../db/repo/items.js";
import { getFullProfile } from "../../db/repo/users.js";
import { getAndRegenerateStamina } from "../../db/repo/stamina.js";
import { addCash } from "../../db/repo/economy.js";
import { addXp } from "../../db/repo/leveling.js";

export default function (bot) {
    bot.command("use", async (ctx) => {
        const itemCode = ctx.args[0]?.toLowerCase();
        
        if (!itemCode) {
            return ctx.reply("❌ Sebutkan kode item yang ingin digunakan! Contoh: `!use potion_penyembuh`");
        }

        const db = bot.db;
        const userId = ctx.dbUser.id;

        const profile = getFullProfile(db, userId);
        if (!profile || !profile.character) {
            return ctx.reply("❌ Kamu belum memiliki karakter.");
        }

        const itemDef = db.prepare("SELECT * FROM items WHERE code = ?").get(itemCode);
        if (!itemDef) return ctx.reply(`❌ Item \`${itemCode}\` tidak ditemukan.`);

        if (!hasItem(db, userId, itemCode, 1)) {
            return ctx.reply(`❌ Kamu tidak memiliki ${itemDef.name}.`);
        }

        const metadata = itemDef.metadata ? JSON.parse(itemDef.metadata) : {};
        if (!metadata.usable) {
            return ctx.reply(`❌ ${itemDef.name} tidak bisa digunakan secara langsung.`);
        }

        // Terapkan efek (heal_hp, heal_mp, heal_stamina)
        let effectMsg = [];
        const character = profile.character;
        let newHp = character.hp;
        let newMp = character.mp;
        
        // Kita butuh stats untuk tahu max_hp dan max_mp
        // Tapi kita bisa asumsikan efek tidak melebihi HP saat ini, 
        // Idealnya baca stats pakai calculateBattleStats, tapi kita batasi manual atau izinkan overflow sedikit.
        const stats = { maxHp: 100 + (character.level * 10), maxMp: 50 + (character.level * 5) }; // Simple fallback

        if (metadata.usable.heal_hp) {
            newHp = Math.min(stats.maxHp, newHp + metadata.usable.heal_hp);
            db.prepare(`UPDATE characters SET hp = ? WHERE user_id = ?`).run(newHp, userId);
            effectMsg.push(`❤️ HP pulih +${metadata.usable.heal_hp} (${newHp}/${stats.maxHp})`);
        }

        if (metadata.usable.heal_mp) {
            newMp = Math.min(stats.maxMp, newMp + metadata.usable.heal_mp);
            db.prepare(`UPDATE characters SET mp = ? WHERE user_id = ?`).run(newMp, userId);
            effectMsg.push(`💧 MP pulih +${metadata.usable.heal_mp} (${newMp}/${stats.maxMp})`);
        }

        if (metadata.usable.heal_stamina) {
            const staminaData = getAndRegenerateStamina(db, userId);
            const newStamina = Math.min(staminaData.max_stamina, staminaData.stamina + metadata.usable.heal_stamina);
            db.prepare(`UPDATE characters SET stamina = ? WHERE user_id = ?`).run(newStamina, userId);
            effectMsg.push(`⚡ Stamina pulih +${metadata.usable.heal_stamina} (${newStamina}/${staminaData.max_stamina})`);
        }

        if (metadata.usable.xp) {
            const xpGained = metadata.usable.xp;
            addXp(db, userId, xpGained);
            effectMsg.push(`🌟 Mendapat ${xpGained} XP!`);
        }

        if (metadata.usable.cash) {
            const cashGained = metadata.usable.cash;
            addCash(db, userId, cashGained);
            effectMsg.push(`💰 Menemukan ${cashGained} Aester!`);
        }

        // Hapus item
        removeItem(db, userId, itemCode, 1);

        return ctx.reply(`✨ Kamu menggunakan *${itemDef.name}*!\n${effectMsg.join('\n')}`);

    }, { aliases: ["konsumsi", "makan", "minum"], category: "RPG", description: "Menggunakan item ramuan atau makanan." });
}
