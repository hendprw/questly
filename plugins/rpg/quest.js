import { getDailyQuests, claimQuest } from "../../db/repo/quests.js";
import { getItemByCode, hasItem } from "../../db/repo/items.js";

export default function (bot) {
    bot.command("quest", async (ctx) => {
        const db = bot.db;
        const userId = ctx.dbUser.id;
        const subCmd = ctx.args[0]?.toLowerCase();
        const questIdArg = parseInt(ctx.args[1], 10);

        try {
            const quests = getDailyQuests(db, userId);

            // Sub-command Claim
            if (subCmd === "claim") {
                if (isNaN(questIdArg) || questIdArg < 1 || questIdArg > quests.length) {
                    return ctx.reply(`❌ Format salah! Gunakan \`${bot.options.prefix}quest claim <nomor_misi>\``);
                }
                const questToClaim = quests[questIdArg - 1];
                
                try {
                    const rewards = claimQuest(db, userId, questToClaim.id);
                    let msg = `🎉 *Berhasil mengklaim Misi #${questIdArg}!*\n\n*Hadiah yang didapatkan:*`;
                    if (rewards.aester > 0) msg += `\n🪙 ${rewards.aester.toLocaleString("id-ID")} Aester`;
                    if (rewards.xp > 0) msg += `\n✨ ${rewards.xp.toLocaleString("id-ID")} EXP`;
                    if (rewards.item && rewards.item_qty > 0) {
                        const rItem = getItemByCode(db, rewards.item);
                        msg += `\n📦 ${rewards.item_qty}x ${rItem ? rItem.name : rewards.item}`;
                    }
                    if (rewards.tokens > 0) msg += `\n🌟 ${rewards.tokens} Adventurer Token(s)`;
                    return ctx.reply(msg);
                } catch (err) {
                    return ctx.reply(`❌ Gagal klaim: ${err.message}`);
                }
            }

            // Command Utama: Lihat Daftar Quest
            let msg = `📜 *PAPAN MISI HARIAN*\n_Diset ulang setiap jam 00:00_\n\n`;

            for (let i = 0; i < quests.length; i++) {
                const q = quests[i];
                let status = "❌";
                if (q.is_claimed) {
                    status = "✅ *DIKLAIM*";
                } else if (q.is_completed || (q.quest_type === 'gather' && hasItem(db, userId, q.target_code, q.required_amount))) {
                    status = "🎯 *BISA DIKLAIM*";
                }

                let desc = q.description;
                if (!desc) {
                    const targetName = q.target_code.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                    if (q.quest_type === 'hunt') desc = `Kalahkan ${q.required_amount}x ${targetName}`;
                    else desc = `Serahkan ${q.required_amount}x ${targetName}`;
                }

                msg += `*${i + 1}. [${status}]* ${desc}\n`;
                if (!q.is_claimed) {
                    msg += `   📊 *Progres:* ${q.current_amount} / ${q.required_amount}\n`;
                    msg += `   🎁 *Hadiah:* ${q.reward_aester.toLocaleString('id-ID')} Aester | ${q.reward_xp.toLocaleString('id-ID')} EXP`;
                    
                    if (q.reward_item && q.reward_item_qty > 0) {
                        const rItem = getItemByCode(db, q.reward_item);
                        msg += ` | ${q.reward_item_qty}x ${rItem ? rItem.name : q.reward_item}`;
                    }
                    
                    if (q.reward_tokens > 0) msg += ` | ${q.reward_tokens} Token`;
                    msg += `\n`;
                }
                msg += `\n`;
            }

            msg += `_Ketik \`${bot.options.prefix}quest claim <nomor>\` untuk mengambil hadiah._`;
            return ctx.reply(msg.trim());

        } catch (e) {
            console.error(e);
            return ctx.reply(`❌ Terjadi kesalahan saat memuat Quest: ${e.message}`);
        }

    }, { aliases: ["misi", "quests"], category: "RPG", description: "Melihat dan mengklaim misi harian." });
}
