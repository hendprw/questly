import { getWallet, addCash, removeCash } from "../../db/repo/economy.js";
import { consumeStamina, getAndRegenerateStamina } from "../../db/repo/stamina.js";

const ROB_STAMINA_COST = 20;
const ROB_COOLDOWN_MS = 3600000; // 1 jam

export default function (bot) {
    bot.command("rob", async (ctx) => {
        const targetMention = ctx.args[0];
        if (!targetMention || !targetMention.startsWith("<@") || !targetMention.endsWith(">")) {
            return ctx.reply(`❌ Format salah. Gunakan: \`${bot.options.prefix}rob <@user>\``);
        }

        const targetId = targetMention.replace(/[<@!>]/g, "");
        const userId = ctx.dbUser.id;
        const db = bot.db;

        if (targetId === userId) {
            return ctx.reply("❌ Kamu tidak bisa merampok dirimu sendiri!");
        }

        // Cek apakah target terdaftar
        const targetUser = db.prepare("SELECT * FROM users WHERE id = ?").get(targetId);
        if (!targetUser) {
            return ctx.reply("❌ Target tidak ditemukan dalam database.");
        }

        // Cek cooldown
        const lastRob = db.prepare("SELECT last_rob FROM characters WHERE user_id = ?").get(userId)?.last_rob || 0;
        const now = Date.now();
        if (now - lastRob < ROB_COOLDOWN_MS) {
            const timeLeft = Math.ceil((ROB_COOLDOWN_MS - (now - lastRob)) / 60000);
            return ctx.reply(`⏳ Kamu masih buronan! Bersembunyilah selama ${timeLeft} menit sebelum mencuri lagi.`);
        }

        // Cek Stamina
        let currentStamina = getAndRegenerateStamina(db, userId);
        if (currentStamina.stamina < ROB_STAMINA_COST) {
            return ctx.reply(`❌ Stamina tidak cukup! Butuh ${ROB_STAMINA_COST} Stamina. (Sisa: ${currentStamina.stamina})`);
        }

        // Cek target
        const targetWallet = getWallet(db, targetId);
        if (!targetWallet || targetWallet.cash < 500) {
            return ctx.reply("❌ Target terlalu miskin, dompetnya kosong melompong. Batal merampok.");
        }

        consumeStamina(db, userId, ROB_STAMINA_COST);
        db.prepare("UPDATE characters SET last_rob = ? WHERE user_id = ?").run(now, userId);
        currentStamina = getAndRegenerateStamina(db, userId);

        // Hukuman Karma (Hero Score)
        const myChar = db.prepare("SELECT is_hero, hero_score FROM characters WHERE user_id = ?").get(userId);
        if (myChar.is_hero === 1) {
            db.prepare("UPDATE characters SET is_hero = 0, hero_score = MAX(0, hero_score - 1000) WHERE user_id = ?").run(userId);
            ctx.reply("⚠️ **TRAGEDI KEPALSUAN!**\nSeorang Pahlawan Suci ketahuan mencoba mencuri! Gelar [HERO] milikmu DICABUT seketika oleh sistem dan Poin Kepahlawananmu hancur!");
        } else {
            db.prepare("UPDATE characters SET hero_score = MAX(0, hero_score - 50) WHERE user_id = ?").run(userId);
        }

        // Kalkulasi modifier curi
        function getRobModifiers(db, uid) {
            let bonus = 0;
            const char = db.prepare("SELECT c.passive_trait FROM characters ch JOIN classes c ON ch.class = c.code WHERE ch.user_id = ?").get(uid);
            if (char && char.passive_trait) {
                try {
                    const trait = JSON.parse(char.passive_trait);
                    if (trait.skill === 'loot_and_thief') bonus += 0.15;
                } catch(e) {}
            }
            const ring = db.prepare("SELECT items.metadata FROM equipment JOIN inventory ON equipment.inventory_id = inventory.id JOIN items ON inventory.item_id = items.id WHERE equipment.user_id = ? AND equipment.slot = 'accessory'").get(uid);
            if (ring && ring.metadata) {
                try {
                    const meta = JSON.parse(ring.metadata);
                    if (meta.passive === 'stealth') bonus += 0.15;
                } catch(e) {}
            }
            return bonus;
        }

        const attackerBonus = getRobModifiers(db, userId);
        const defenderBonus = getRobModifiers(db, targetId);

        let finalChance = 0.40 + attackerBonus - defenderBonus;
        finalChance = Math.max(0.05, Math.min(0.95, finalChance)); // Cap min 5%, max 95%

        // Peluang sukses dinamis
        const success = Math.random() < finalChance;

        if (success) {
            // Curi 5% - 10%
            const stealPercent = (Math.floor(Math.random() * 6) + 5) / 100;
            const stolenAmount = Math.floor(targetWallet.cash * stealPercent);

            try {
                // Eksekusi atomik
                db.transaction(() => {
                    removeCash(db, targetId, stolenAmount, { type: "robbed", note: `Dirampok oleh ${ctx.dbUser.username}` });
                    addCash(db, userId, stolenAmount, { type: "rob_success", note: `Merampok dari ${targetUser.username}` });
                })();
                return ctx.reply(`💰 **BERHASIL!**\nKamu mengendap-endap dan berhasil menggasak **${stolenAmount.toLocaleString()} Aester** dari saku <@${targetId}>!\n\n⚡ Stamina: ${currentStamina.stamina}/${currentStamina.max_stamina}`);
            } catch (e) {
                return ctx.reply("❌ Terjadi kesalahan saat mencuri. (Mungkin dompetnya penuh?)");
            }
        } else {
            // Gagal, denda 5% uangmu
            const myWallet = getWallet(db, userId);
            const penalty = Math.floor(myWallet.cash * 0.05);
            
            if (penalty > 0) {
                db.transaction(() => {
                    removeCash(db, userId, penalty, { type: "rob_penalty", note: "Ketahuan merampok" });
                })();
                return ctx.reply(`🚔 **GABRUK!!** Kamu ketahuan oleh penjaga kota saat mencoba merampok <@${targetId}>!\nSebagai denda, uangmu melayang sebanyak **${penalty.toLocaleString()} Aester**.\n\n⚡ Stamina: ${currentStamina.stamina}/${currentStamina.max_stamina}`);
            } else {
                return ctx.reply(`🚔 **GABRUK!!** Kamu ketahuan oleh <@${targetId}> dan lari terbirit-birit!\n\n⚡ Stamina: ${currentStamina.stamina}/${currentStamina.max_stamina}`);
            }
        }
    }, { aliases: ["steal", "curi", "copet"], category: "RPG", description: "Mencuri Aester dari pemain lain (Peluang 40%)." });
}
