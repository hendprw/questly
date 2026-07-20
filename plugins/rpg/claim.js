import { CLAIM_TYPES } from "../../lib/claim-config.js";
import { getRemainingCooldown, setCooldown } from "../../db/repo/cooldowns.js";
import { addCash } from "../../db/repo/economy.js";
import { addXp } from "../../db/repo/leveling.js";
import { addItem } from "../../db/repo/items.js";

function formatCooldown(sec) {
    let ms = sec * 1000;
    if (ms < 0) ms = 0;
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours} jam, ${minutes} menit, ${seconds} detik`;
}

export default function (bot) {
    bot.command("claim", async (ctx) => {
        const claimTypeArg = ctx.args[0]?.toLowerCase();
        
        if (!claimTypeArg) {
            return ctx.reply("Harap sertakan jenis hadiah yang ingin diklaim.\nPilihan yang ada: daily, weekly, monthly.\nContoh: `!claim daily`");
        }

        let claimConfig = null;
        let claimName = '';
        let configKey = '';

        for (const [key, config] of Object.entries(CLAIM_TYPES)) {
            if (key === claimTypeArg || config.aliases.includes(claimTypeArg)) {
                claimConfig = config;
                claimName = key.charAt(0).toUpperCase() + key.slice(1);
                configKey = key;
                break;
            }
        }

        if (!claimConfig) {
            return ctx.reply(`Jenis hadiah "${claimTypeArg}" tidak ditemukan. Pilihan yang ada: daily, weekly, monthly.`);
        }

        const userId = ctx.dbUser.id;
        const cooldownKey = `claim_${configKey}`;

        try {
            const apply = bot.db.transaction(() => {
                const remaining = getRemainingCooldown(bot.db, userId, cooldownKey);
                if (remaining > 0) {
                    throw new Error(`Kamu sudah mengklaim hadiah ${claimName.toLowerCase()} ini.\n\nCoba lagi dalam: *${formatCooldown(remaining)}*`);
                }

                const rewards = claimConfig.rewards;
                let rewardMessages = [];
                let leveledUpInfo = null;

                if (rewards.cash) {
                    addCash(bot.db, userId, rewards.cash, { type: `claim_${configKey}` });
                    rewardMessages.push(`🪙 *+${rewards.cash.toLocaleString('id-ID')}* Aester`);
                }
                if (rewards.gems) {
                    // Pastikan tabel wallets ada
                    const hasWallet = bot.db.prepare('SELECT 1 FROM wallets WHERE user_id = ?').get(userId);
                    if (!hasWallet) {
                        bot.db.prepare('INSERT INTO wallets (user_id, cash, gems, bank) VALUES (?, 0, ?, 0)').run(userId, rewards.gems);
                    } else {
                        bot.db.prepare('UPDATE wallets SET gems = gems + ? WHERE user_id = ?').run(rewards.gems, userId);
                    }
                    rewardMessages.push(`💎 *+${rewards.gems.toLocaleString('id-ID')}* Diamond`);
                }
                if (rewards.exp) {
                    const leveled = addXp(bot.db, userId, rewards.exp);
                    if (leveled && leveled.leveledUp) {
                        leveledUpInfo = leveled;
                    }
                    rewardMessages.push(`✨ *+${rewards.exp.toLocaleString('id-ID')}* EXP`);
                }
                if (rewards.items) {
                    for (const [itemCode, amount] of Object.entries(rewards.items)) {
                        try {
                            addItem(bot.db, userId, itemCode, amount);
                            rewardMessages.push(`🛍️ *+${amount}* ${itemCode}`);
                        } catch (e) {
                            rewardMessages.push(`🛍️ *+${amount}* ${itemCode} (Gagal diberikan)`);
                        }
                    }
                }

                setCooldown(bot.db, userId, cooldownKey, claimConfig.cooldown);

                return { rewardMessages, leveledUpInfo };
            });

            const result = apply();

            let finalMessage = `*--- KLAIM ${claimName.toUpperCase()} BERHASIL ---*\n\n`;
            finalMessage += `${claimConfig.message}\n\n`;
            finalMessage += `*Hadiah yang Diterima:*\n${result.rewardMessages.join('\n')}`;
            
            await ctx.reply(finalMessage);

            if (result.leveledUpInfo) {
                setTimeout(() => {
                     if (bot.sock) {
                        bot.sock.sendMessage(ctx.sender, { text: `🎉 Selamat! Kamu telah naik ke *Level ${result.leveledUpInfo.after.level}*!` });
                     }
                }, 1000);
            }

        } catch (err) {
            return ctx.reply(err.message);
        }

    }, { aliases: ["c", "klaim"], category: "RPG", description: "Mengklaim hadiah harian, mingguan, atau bulanan." });
}
