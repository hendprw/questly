import { getFarmSlots, plantCrop, waterCrop, harvestCrop, clearCrop, setWithered } from "../../db/repo/farm.js";
import { addItem, removeItem, hasItem, getItemByCode } from "../../db/repo/items.js";
import { addXp } from "../../db/repo/leveling.js";
import { addCash } from "../../db/repo/economy.js";

const SEEDS = {
    'wheat': { name: 'Gandum', emoji: '🌾', price: 50, growthTime: 14400000, waterLimit: 28800000, yieldMin: 2, yieldMax: 5, xp: 20 },
    'herb': { name: 'Herba', emoji: '🌿', price: 100, growthTime: 21600000, waterLimit: 43200000, yieldMin: 2, yieldMax: 4, xp: 35 },
    'potato': { name: 'Kentang', emoji: '🥔', price: 80, growthTime: 18000000, waterLimit: 36000000, yieldMin: 3, yieldMax: 6, xp: 25 },
    'carrot': { name: 'Wortel', emoji: '🥕', price: 90, growthTime: 18000000, waterLimit: 36000000, yieldMin: 2, yieldMax: 5, xp: 25 },
    'apple': { name: 'Apel', emoji: '🍎', price: 200, growthTime: 43200000, waterLimit: 86400000, yieldMin: 5, yieldMax: 10, xp: 80 },
    'sunflower_seed': { name: 'Bunga Matahari', emoji: '🌻', price: 250, growthTime: 28800000, waterLimit: 57600000, yieldMin: 1, yieldMax: 3, xp: 100 },
    'fire_lotus_seed': { name: 'Teratai Api', emoji: '🔥', price: 500, growthTime: 86400000, waterLimit: 172800000, yieldMin: 1, yieldMax: 2, xp: 250 }
};

const createProgressBar = (current, max, length = 8) => {
    const percent = Math.min(100, Math.max(0, (current / max) * 100));
    const filled = Math.round((percent / 100) * length);
    const empty = length - filled;
    return `[${'■'.repeat(filled)}${'□'.repeat(empty)}]`;
};

const formatTime = (ms) => {
    if (ms <= 0) return 'Siap!';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    let parts = [];
    if (h > 0) parts.push(`${h}j`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0 || (h === 0 && m === 0)) parts.push(`${s}d`);
    return parts.join(' ');
};

export default function (bot) {
    bot.command("farm", async (ctx) => {
        let subCmd = ctx.args[0]?.toLowerCase();

        const shortcuts = {
            'w': 'water', 'siram': 'water',
            'p': 'plant', 'tanam': 'plant',
            'h': 'harvest', 'panen': 'harvest',
            'b': 'buy', 'beli': 'buy',
            's': 'shop', 'toko': 'shop',
            'c': 'clear',
            't': 'tips', 'info': 'tips'
        };
        if (shortcuts[subCmd]) subCmd = shortcuts[subCmd];

        const userId = ctx.dbUser.id;
        const slots = getFarmSlots(bot.db, userId);

        if (subCmd === 'tips' || subCmd === 'guide' || subCmd === 'help') {
            let text = `📖 *BUKU PANDUAN BERTANI*\n`;
            text += `_Panduan lengkap mekanik & shortcut._\n\n`;

            text += `⚙️ *MEKANIK DASAR:*\n`;
            text += `1. *Air & Kematian (Strict Mode)* ☠️\n`;
            text += `   Tanaman memiliki batas air. Jika timer air habis (0 detik), tanaman *LANGSUNG MATI*. \n`;
            text += `2. *Pertumbuhan* 🌳\n`;
            text += `   Setiap bibit punya waktu tumbuh. Siram air tidak mempercepat tumbuh, tapi mencegah mati.\n`;
            text += `3. *Hasil Panen (RNG)* 🎲\n`;
            text += `   Jumlah panen tidak pasti (Min-Max). Contoh: Padi bisa dapat 5 sampai 10 butir.\n\n`;
            
            text += `⚡ *SHORTCUT CEPAT:*\n`;
            text += `• \`!farm p [nama]\` : Tanam otomatis di slot kosong\n`;
            text += `• \`!farm w\` : Siram semua tanaman\n`;
            text += `• \`!farm h\` : Panen semua yang siap\n`;
            text += `• \`!farm s\` : Buka toko\n\n`;

            text += `🌱 *DATA BIBIT (Tumbuh | Batas Air):*\n`;
            for (const [k, s] of Object.entries(SEEDS)) {
                text += `• ${s.emoji} *${s.name}*: ⏳${formatTime(s.growthTime)} | 💧${formatTime(s.waterLimit)}\n`;
            }

            return ctx.reply(text);
        }

        if (subCmd === 'shop') {
            const wallet = bot.db.prepare('SELECT cash FROM wallets WHERE user_id = ?').get(userId);
            let text = `🏪 *TOKO PERTANIAN* | 💰 ${wallet.cash.toLocaleString('id-ID')} Aester\n\n`;
            text += `🌱 *BIBIT UNGGUL*\n`;
            for (const [key, seed] of Object.entries(SEEDS)) {
                text += `• ${seed.emoji} *${seed.name}* (${key}) \n   └ 🏷️ ${seed.price}🪙 | ⏳ ${formatTime(seed.growthTime)}\n`;
            }
            text += `\n🛒 _Gunakan: !farm buy [nama] [jumlah]_`;
            return ctx.reply(text);
        }

        if (subCmd === 'buy') {
            const inputName = ctx.args[1]?.toLowerCase();
            const amount = Math.max(1, parseInt(ctx.args[2]) || 1);
            
            if (!inputName || !SEEDS[inputName]) return ctx.reply('❌ Bibit tidak ditemukan. Cek !farm shop');
            
            const seedData = SEEDS[inputName];
            const total = seedData.price * amount;
            
            const wallet = bot.db.prepare('SELECT cash FROM wallets WHERE user_id = ?').get(userId);
            if (wallet.cash < total) return ctx.reply(`❌ Aester kurang (${total}🪙 diperlukan).`);
            
            addCash(bot.db, userId, -total, { type: 'shop_buy', note: `Buy seed ${inputName}` });
            addItem(bot.db, userId, inputName, amount);
            
            return ctx.reply(`✅ Membeli ${amount}x Bibit ${seedData.name} (-${total}🪙).`);
        }

        if (subCmd === 'plant') {
            let slotNum = parseInt(ctx.args[1]);
            let input = ctx.args[2]?.toLowerCase();

            if (isNaN(slotNum)) {
                input = ctx.args[1]?.toLowerCase();
                const emptyPlot = slots.find(p => !p.plant_code);
                if (!emptyPlot) return ctx.reply('❌ Semua slot penuh!');
                slotNum = emptyPlot.slot_id;
            }

            if (!input) return ctx.reply('❌ Sebutkan nama bibit. Contoh: !farm p wheat');
            if (!SEEDS[input]) return ctx.reply('❌ Bibit tidak ada. Cek !farm shop.');
            
            if (!hasItem(bot.db, userId, input, 1)) {
                return ctx.reply(`❌ Kamu tidak memiliki *${input}*. Beli dulu di toko!`);
            }
            
            const plot = slots.find(p => p.slot_id === slotNum);
            if (!plot) return ctx.reply(`❌ Slot ${slotNum} tidak ditemukan.`);
            if (plot.plant_code) return ctx.reply(`❌ Slot ${slotNum} sudah terisi.`);
            
            removeItem(bot.db, userId, input, 1);
            plantCrop(bot.db, userId, slotNum, input);
            
            return ctx.reply(`🌱 Menanam *${SEEDS[input].name}* di Slot ${slotNum}.`);
        }

        if (subCmd === 'water') {
            const now = Math.floor(Date.now() / 1000);
            const target = ctx.args[1] ? ctx.args[1] : 'all';

            if (target === 'all') {
                let count = 0;
                for (const p of slots) {
                    if (p.plant_code && !p.is_withered) {
                        waterCrop(bot.db, userId, p.slot_id);
                        count++;
                    }
                }
                return ctx.reply(`💦 Menyiram *${count} tanaman* hingga segar!`);
            }
            const slotNum = parseInt(target);
            const p = slots.find(x => x.slot_id === slotNum);
            if (!p || !p.plant_code || p.is_withered) return ctx.reply('❌ Gagal (Slot kosong/mati).');
            
            waterCrop(bot.db, userId, slotNum);
            return ctx.reply(`💧 Slot ${slotNum} disiram.`);
        }

        if (subCmd === 'harvest') {
            const nowMs = Date.now();
            let report = [];
            let totalXp = 0;
            const target = ctx.args[1] ? ctx.args[1] : 'all';

            const equippedPet = bot.db.prepare("SELECT items.metadata FROM inventory JOIN items ON inventory.item_id = items.id WHERE inventory.user_id = ? AND inventory.is_equipped = 1 AND items.equip_slot = 'pet'").get(userId);
            let hasLucky = false;
            if (equippedPet && equippedPet.metadata) {
                try {
                    const meta = JSON.parse(equippedPet.metadata);
                    if (meta.passive === 'lucky') hasLucky = true;
                } catch(e) {}
            }
            let petLog = "";

            const tryHarvest = (p) => {
                const s = SEEDS[p.plant_code];
                const growTime = s.growthTime;
                const plantedAge = nowMs - (p.planted_at * 1000);
                
                if (plantedAge >= growTime) {
                    let qty = Math.floor(Math.random() * (s.yieldMax - s.yieldMin + 1)) + s.yieldMin;
                    if (hasLucky && Math.random() < 0.15) {
                        qty *= 2;
                        petLog = "\n✨ _Navi si Peri Hutan menggandakan hasil panenmu!_";
                    }
                    addItem(bot.db, userId, p.plant_code, qty);
                    const leveled = addXp(bot.db, userId, s.xp);
                    totalXp += s.xp;
                    report.push(`• ${s.emoji} ${s.name}: +${qty} item`);
                    harvestCrop(bot.db, userId, p.slot_id);
                    return leveled;
                }
                return null;
            };

            let levelUps = [];

            if (target === 'all') {
                for (const p of slots) {
                    if (p.plant_code && !p.is_withered) {
                        const leveled = tryHarvest(p);
                        if (leveled && leveled.leveledUp) levelUps.push(leveled);
                    }
                }
                if (report.length === 0) return ctx.reply('❌ Belum ada yang siap panen.');
                
                let text = `🌾 *PANEN RAYA*\n${report.join('\n')}\n✨ Total XP: +${totalXp}`;
                if (levelUps.length > 0) {
                    text += `\n🎉 Level Up! Kamu sekarang level ${levelUps[0].after.level}.`;
                }
                text += `${petLog}`;
                return ctx.reply(text);
            }
        }

        if (subCmd === 'clear') {
            const slotNum = parseInt(ctx.args[1]);
            const p = slots.find(x => x.slot_id === slotNum);
            if (p) {
                clearCrop(bot.db, userId, slotNum);
                return ctx.reply(`🧹 Slot ${slotNum} dibersihkan.`);
            }
        }

        // Dashboard
        const nowMs = Date.now();
        let grid = [];
        let details = [];

        // In Questly, seeds are just the items themselves.
        let invSeeds = [];
        for (const code of Object.keys(SEEDS)) {
            const itemRow = bot.db.prepare(`SELECT quantity FROM inventory WHERE user_id = ? AND item_id = (SELECT id FROM items WHERE code = ?) AND location = 'bag'`).get(userId, code);
            if (itemRow && itemRow.quantity > 0) {
                invSeeds.push(`${itemRow.quantity}x ${SEEDS[code].name}`);
            }
        }
        const invText = invSeeds.length > 0 ? invSeeds.join(', ') : 'Kosong';

        for (const plot of slots) {
            if (plot.plant_code) {
                const seed = SEEDS[plot.plant_code];
                const age = nowMs - (plot.planted_at * 1000);
                const growthTime = seed.growthTime;
                const lastWaterMs = nowMs - (plot.last_water_at * 1000);
                
                let isWithered = plot.is_withered === 1;
                if (!isWithered && lastWaterMs > seed.waterLimit) {
                    setWithered(bot.db, userId, plot.slot_id);
                    isWithered = true;
                }

                let timeLeft = growthTime - age;
                if (timeLeft < 0) timeLeft = 0;
                
                if (isWithered) {
                    grid.push(`[💀 ${plot.slot_id}]`);
                    details.push(`🥀 *Slot ${plot.slot_id}:* MATI (Kekeringan)`);
                } else if (age >= growthTime) {
                    grid.push(`[🎁 ${plot.slot_id}]`);
                    details.push(`🌾 *Slot ${plot.slot_id}:* SIAP PANEN!`);
                } else {
                    const waterTimeLeft = seed.waterLimit - lastWaterMs;
                    const growthBar = createProgressBar(age, growthTime, 5);
                    const waterBar = createProgressBar(waterTimeLeft, seed.waterLimit, 5);
                    
                    let waterIcon = '💧';
                    if (waterTimeLeft <= 20000) waterIcon = '⚠️';
                    
                    const growIcon = '🌱';
                    grid.push(`[${growIcon} ${plot.slot_id}]`);
                    
                    const waterStr = waterTimeLeft < 60000 
                        ? `${Math.ceil(waterTimeLeft/1000)}dtk` 
                        : formatTime(waterTimeLeft);

                    details.push(`*${plot.slot_id}. ${seed.name}*\n   ├ Tumbuh: ${growthBar} ${formatTime(timeLeft)}\n   └ Air:    ${waterBar} ${waterStr} ${waterIcon}`);
                }
            } else {
                grid.push(`[🟫 ${plot.slot_id}]`);
            }
        }

        let gridText = "";
        grid.forEach((c, i) => {
            gridText += c + " ";
            if ((i + 1) % 3 === 0) gridText += "\n";
        });

        const playerStats = bot.db.prepare('SELECT display_name, push_name FROM users WHERE id = ?').get(userId);
        const name = playerStats.display_name || playerStats.push_name || 'Player';

        let text = `🏡 *KEBUN ${name.toUpperCase()}*\n`;
        text += `🎒 *Tas:* ${invText}\n`;
        text += `──────────────────\n`;
        text += `${gridText}\n`;
        text += `──────────────────\n`;
        text += details.length > 0 ? details.join('\n') : `_Kebun kosong._\n`;
        
        text += `\n🕹️ *MENU NAVIGASI:*\n`;
        text += `[P]lant ∙ [W]ater ∙ [H]arvest\n`;
        text += `[C]lear ∙ [S]hop  ∙ [T]ips\n`;
        text += `Ex: !farm t`;
        
        return ctx.reply(text);

    }, { aliases: ["kebun", "tani", "garden", "f"], category: "RPG", description: "Sistem Pertanian." });
}
