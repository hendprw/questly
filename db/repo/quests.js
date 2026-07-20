import { addItem, hasItem, removeItem } from "./items.js";
import { addCash, addTokens } from "./economy.js";
import { addXp } from "./leveling.js";

const QUEST_TEMPLATES = [
    { type: 'hunt', targets: ['snow_wolf', 'bear', 'boar'], minQty: 3, maxQty: 8, rewardBaseXP: 50, rewardBaseAester: 200, 
      descTemplates: ["Penduduk desa diteror oleh kawanan {target}. Kalahkan {qty} ekor!", "Bantu penjaga hutan menyingkirkan {qty} {target} liar."] },
    { type: 'hunt', targets: ['goblin', 'orc', 'skeleton'], minQty: 2, maxQty: 5, rewardBaseXP: 80, rewardBaseAester: 300,
      descTemplates: ["Pasukan {target} berencana menyerang karavan. Kalahkan {qty} dari mereka!", "Sayembara kerajaan: Basmi {qty} {target} di perbatasan!"] },
    { type: 'hunt', targets: ['slime', 'golem', 'mountain_lion', 'fire_fox'], minQty: 2, maxQty: 6, rewardBaseXP: 60, rewardBaseAester: 250,
      descTemplates: ["Serikat penyihir membutuhkan sampel inti dari {target}. Kalahkan {qty} ekor dan lapor kembali."] },
    { type: 'gather', targets: ['iron_ore', 'coal', 'wood'], minQty: 10, maxQty: 30, rewardBaseXP: 30, rewardBaseAester: 150,
      descTemplates: ["Blacksmith kekurangan bahan baku. Kirimkan {qty} {target} ke bengkelnya.", "Desa sedang membangun pagar pelindung. Serahkan {qty} {target}."] },
    { type: 'gather', targets: ['herb', 'wheat', 'cow_milk', 'chicken_egg'], minQty: 10, maxQty: 25, rewardBaseXP: 20, rewardBaseAester: 100,
      descTemplates: ["Persediaan panti asuhan menipis. Tolong sumbangkan {qty} {target}.", "Bantu koki istana mengumpulkan {qty} {target} untuk pesta nanti malam."] },
    { type: 'gather', targets: ['diamond', 'ruby', 'sapphire', 'aester_shard'], minQty: 1, maxQty: 3, rewardBaseXP: 100, rewardBaseAester: 1000,
      descTemplates: ["Seorang bangsawan misterius mencari {qty} {target} asli untuk koleksinya.", "Kolektor berani membayar mahal untuk {qty} {target} murni."] },
    { type: 'gather', targets: ['rice', 'wheat', 'carrot', 'potato'], minQty: 10, maxQty: 30, rewardBaseXP: 25, rewardBaseAester: 120,
      descTemplates: ["Tavern lokal sangat membutuhkan pasokan makanan segar. Kumpulkan {qty} {target}.", "Bantu petani memanen {qty} {target} sebelum musim dingin tiba."] },
    { type: 'gather', targets: ['common_fish', 'serpent_eel'], minQty: 5, maxQty: 15, rewardBaseXP: 40, rewardBaseAester: 200,
      descTemplates: ["Pedagang pasar kehabisan stok laut. Pancing dan serahkan {qty} {target} untuknya.", "Koki istana mengidamkan masakan dari {qty} {target}. Bawa kepadanya."] },
];

function getTodayString() {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
}

export function getDailyQuests(db, userId) {
    const today = getTodayString();
    let quests = db.prepare(`SELECT * FROM daily_quests WHERE user_id = ? AND date_assigned = ?`).all(userId, today);
    
    // Jika belum ada quest hari ini, generate 3 quest baru
    if (quests.length === 0) {
        generateDailyQuests(db, userId, today);
        quests = db.prepare(`SELECT * FROM daily_quests WHERE user_id = ? AND date_assigned = ?`).all(userId, today);
    }
    return quests;
}

function generateDailyQuests(db, userId, dateString) {
    const insert = db.prepare(`
        INSERT INTO daily_quests (user_id, date_assigned, quest_type, target_code, required_amount, reward_aester, reward_xp, reward_tokens, description, reward_item, reward_item_qty)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    db.transaction(() => {
        // Hapus quest hari sebelumnya agar tidak membebani database
        db.prepare(`DELETE FROM daily_quests WHERE user_id = ? AND date_assigned != ? AND is_claimed = 0`).run(userId, dateString);

        // Generate 3 misi
        const selectedIndexes = [];
        while (selectedIndexes.length < 3) {
            const idx = Math.floor(Math.random() * QUEST_TEMPLATES.length);
            if (!selectedIndexes.includes(idx) || QUEST_TEMPLATES.length < 3) {
                selectedIndexes.push(idx);
            }
        }

        for (const idx of selectedIndexes) {
            const template = QUEST_TEMPLATES[idx];
            const target = template.targets[Math.floor(Math.random() * template.targets.length)];
            const qty = Math.floor(Math.random() * (template.maxQty - template.minQty + 1)) + template.minQty;
            
            // Kalkulasi Hadiah
            const aester = template.rewardBaseAester * qty;
            const xp = template.rewardBaseXP * qty;
            const tokens = (template.type === 'hunt' && qty >= 5) || (template.type === 'gather' && template.targets.includes('diamond')) ? 1 : 0;
            const finalTokens = Math.random() < 0.3 ? 1 : tokens;
            // Hadiah Barang Acak (50% chance untuk dapet makanan/potion)
            let rewardItem = null;
            let rewardItemQty = 0;
            if (Math.random() < 0.5) {
                const possibleRewards = ['apple', 'carrot', 'potion_minor', 'bread', 'potato'];
                rewardItem = possibleRewards[Math.floor(Math.random() * possibleRewards.length)];
                rewardItemQty = Math.floor(Math.random() * 3) + 1; // 1-3 buah
            }

            let targetName = target.toUpperCase();
            if (template.type === 'hunt') {
                const m = db.prepare(`SELECT name FROM monsters WHERE code = ?`).get(target);
                if (m) targetName = m.name;
            } else {
                const i = db.prepare(`SELECT name FROM items WHERE code = ?`).get(target);
                if (i) targetName = i.name;
            }

            const desc = template.descTemplates[Math.floor(Math.random() * template.descTemplates.length)]
                           .replace('{target}', targetName)
                           .replace('{qty}', qty);

            insert.run(userId, dateString, template.type, target, qty, aester, xp, finalTokens, desc, rewardItem, rewardItemQty);
        }
    })();
}

/** Mengupdate progress quest bertipe Hunt/Kill */
export function progressQuest(db, userId, questType, targetCode, amount) {
    const today = getTodayString();
    db.prepare(`
        UPDATE daily_quests 
        SET current_amount = MIN(current_amount + ?, required_amount) 
        WHERE user_id = ? AND date_assigned = ? AND quest_type = ? AND target_code = ? AND is_completed = 0
    `).run(amount, userId, today, questType, targetCode);

    // Tandai selesai jika sudah terpenuhi
    db.prepare(`
        UPDATE daily_quests 
        SET is_completed = 1 
        WHERE user_id = ? AND date_assigned = ? AND current_amount >= required_amount AND is_completed = 0
    `).run(userId, today);
}

/** Klaim hadiah quest */
export function claimQuest(db, userId, questId) {
    const today = getTodayString();
    const quest = db.prepare(`SELECT * FROM daily_quests WHERE id = ? AND user_id = ? AND date_assigned = ?`).get(questId, userId, today);

    if (!quest) throw new Error("Quest tidak ditemukan atau kadaluarsa.");
    if (quest.is_claimed) throw new Error("Hadiah quest ini sudah diklaim.");

    return db.transaction(() => {
        let completed = quest.is_completed;

        if (quest.quest_type === 'gather') {
            if (hasItem(db, userId, quest.target_code, quest.required_amount)) {
                removeItem(db, userId, quest.target_code, quest.required_amount);
                completed = 1;
                db.prepare(`UPDATE daily_quests SET current_amount = required_amount, is_completed = 1 WHERE id = ?`).run(quest.id);
            } else {
                throw new Error(`Kamu tidak memiliki ${quest.required_amount}x ${quest.target_code} di tasmu untuk diserahkan.`);
            }
        }

        if (!completed) {
            throw new Error("Misi ini belum selesai!");
        }

        db.prepare(`UPDATE daily_quests SET is_claimed = 1 WHERE id = ?`).run(quest.id);
        
        addCash(db, userId, quest.reward_aester, { note: `Quest ${quest.id} Reward` });
        addXp(db, userId, quest.reward_xp);
        if (quest.reward_tokens > 0) {
            addTokens(db, userId, quest.reward_tokens, { note: `Quest ${quest.id} Token` });
        }
        if (quest.reward_item && quest.reward_item_qty > 0) {
            addItem(db, userId, quest.reward_item, quest.reward_item_qty);
        }

        return { 
            aester: quest.reward_aester, 
            xp: quest.reward_xp, 
            tokens: quest.reward_tokens,
            item: quest.reward_item,
            item_qty: quest.reward_item_qty
        };
    })();
}
