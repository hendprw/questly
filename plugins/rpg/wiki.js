export default function (bot) {
    bot.command("wiki", async (ctx) => {
        const category = ctx.args[0]?.toLowerCase();
        const query = ctx.args.slice(1).join(" ")?.toLowerCase();

        if (!category || !query) {
            return ctx.reply(
                `📚 *Buku Pintar Questly (Wiki)*\n\n` +
                `Kategori yang tersedia:\n` +
                `• \`item\` (barang, senjata, dll)\n` +
                `• \`pet\` / \`peliharaan\`\n` +
                `• \`monster\` / \`mob\`\n` +
                `• \`hewan\` (hewan buruan/ternak)\n` +
                `• \`tanaman\` (flora/tanaman pertanian)\n` +
                `• \`biome\` (lokasi peta)\n` +
                `• \`skill\` (kemampuan tempur)\n\n` +
                `*Cara Penggunaan:*\n` +
                `Ketik \`${bot.options.prefix}wiki <kategori> <nama/kode>\`\n` +
                `Ketik \`${bot.options.prefix}wiki <kategori> all\` (untuk melihat semua daftar dalam kategori)\n\n` +
                `*Contoh:* \`${bot.options.prefix}wiki hewan all\` atau \`${bot.options.prefix}wiki skill tebasan\``
            );
        }

        const likeQuery = "%" + query + "%";

        // ---------------------------------------------------------
        // 1. WIKI ITEM
        // ---------------------------------------------------------
        if (category === 'item' || category === 'barang' || category === 'pet' || category === 'peliharaan') {
            const isPetOnly = (category === 'pet' || category === 'peliharaan');
            
            if (query === 'all') {
                const q = isPetOnly ? `SELECT name, code FROM items WHERE category = 'pet' ORDER BY name` : `SELECT name, code FROM items ORDER BY category, name`;
                const items = bot.db.prepare(q).all();
                const list = items.map(i => `• ${i.name} (\`${i.code}\`)`).join('\n');
                return ctx.reply(`📦 *Daftar Semua ${isPetOnly ? 'Peliharaan' : 'Item'}:*\n\n${list}`);
            }

            const q = isPetOnly ? `SELECT * FROM items WHERE category = 'pet' AND (code = ? OR LOWER(name) LIKE ? COLLATE NOCASE)` : `SELECT * FROM items WHERE code = ? OR LOWER(name) LIKE ? COLLATE NOCASE`;
            const items = bot.db.prepare(q).all(query, likeQuery);

            if (items.length === 0) return ctx.reply(`❌ ${isPetOnly ? 'Peliharaan' : 'Item'} mengandung kata "${query}" tidak ditemukan.`);
            
            if (items.length > 1) {
                let msg = `🔍 *Ditemukan beberapa ${isPetOnly ? 'peliharaan' : 'item'}:*\n\n`;
                items.forEach((it, idx) => {
                    msg += `${idx + 1}. ${it.name} (\`${it.code}\`)\n`;
                });
                msg += `\nKetik ulang menggunakan *kode* agar lebih akurat: \`${bot.options.prefix}wiki ${isPetOnly ? 'pet' : 'item'} <kode>\``;
                return ctx.reply(msg);
            }

            const it = items[0];
            const meta = it.metadata ? JSON.parse(it.metadata) : {};
            const locs = it.locations ? JSON.parse(it.locations) : (meta.locations || []);

            let msg = `*╭─── • 「 INFO ITEM 」*\n`;
            msg += `*│* 📦 *Nama:* ${it.name} (\`${it.code}\`)\n`;
            msg += `*│* 📊 *Kategori:* ${it.category} | *Rarity:* ${it.rarity}\n`;
            msg += `*│* ⚖️ *Weight:* ${it.weight}\n`;
            msg += `*│* 💰 *Jual:* ${it.sell_price ? it.sell_price.toLocaleString() + ' Aester' : 'Tidak bisa dijual'}\n`;
            if (locs.length > 0) {
                msg += `*│* 📍 *Ditemukan di:* ${locs.join(", ")}\n`;
            }
            msg += `*╰──────────────*\n`;
            msg += `*Deskripsi:* ${it.description || '-'}\n`;
            
            if (meta.stats) {
                const s = meta.stats;
                let sArr = [];
                if (s.attack) sArr.push(`ATK +${s.attack}`);
                if (s.defense) sArr.push(`DEF +${s.defense}`);
                if (s.speed) sArr.push(`SPD +${s.speed}`);
                if (s.max_hp) sArr.push(`HP +${s.max_hp}`);
                if (s.max_mp) sArr.push(`MP +${s.max_mp}`);
                msg += `\n*⚔️ Status Bonus:* ${sArr.join(' | ')}\n`;
            }
            if (meta.passive) {
                msg += `\n*🔮 Skill Pasif:* ${meta.passive.toUpperCase()}\n`;
            }

            if (meta.crafting) {
                msg += `\n*🛠️ Resep Crafting:*\n`;
                for (const [matCode, amount] of Object.entries(meta.crafting.materials)) {
                    const matData = bot.db.prepare("SELECT name FROM items WHERE code = ?").get(matCode);
                    const matName = matData ? matData.name : matCode;
                    msg += `- ${amount}x ${matName}\n`;
                }
            }
            
            return ctx.reply(msg);
        }

        // ---------------------------------------------------------
        // 2. WIKI MONSTER
        // ---------------------------------------------------------
        if (category === 'monster' || category === 'mob') {
            if (query === 'all') {
                const monsters = bot.db.prepare(`SELECT name, code, is_boss FROM monsters ORDER BY is_boss DESC, name`).all();
                const list = monsters.map(m => `• ${m.is_boss ? '☠️' : '👹'} ${m.name} (\`${m.code}\`)`).join('\n');
                return ctx.reply(`👹 *Daftar Semua Monster:*\n\n${list}`);
            }

            const monsters = bot.db.prepare(`SELECT * FROM monsters WHERE code = ? OR LOWER(name) LIKE ? COLLATE NOCASE`).all(query, likeQuery);

            if (monsters.length === 0) return ctx.reply(`❌ Monster mengandung kata "${query}" tidak ditemukan.`);
            
            if (monsters.length > 1) {
                let msg = `🔍 *Ditemukan beberapa monster:*\n\n`;
                monsters.forEach((m, idx) => {
                    msg += `${idx + 1}. ${m.name} (\`${m.code}\`)\n`;
                });
                msg += `\nKetik ulang menggunakan *kode* agar lebih akurat.`;
                return ctx.reply(msg);
            }

            const m = monsters[0];
            const locs = m.locations ? JSON.parse(m.locations) : [];
            const lootTable = m.loot_table ? JSON.parse(m.loot_table) : [];

            let msg = `*╭─── • 「 INFO MONSTER 」*\n`;
            msg += `*│* ${m.is_boss ? '☠️' : '👹'} *Nama:* ${m.name} (\`${m.code}\`)\n`;
            msg += `*│* 🎖️ *Level:* ${m.min_level} - ${m.max_level} ${m.is_boss ? '(BOSS)' : ''}\n`;
            msg += `*│* ❤️ *HP:* ${m.hp} | ⚔️ *ATK:* ${m.attack} | 🛡️ *DEF:* ${m.defense}\n`;
            if (locs.length > 0) {
                msg += `*│* 📍 *Habitat:* ${locs.join(", ")}\n`;
            }
            msg += `*╰──────────────*\n`;
            msg += `*Deskripsi:* ${m.description || '-'}\n\n`;
            
            msg += `*Loot (Drop Item):*\n`;
            if (lootTable.length === 0) {
                msg += `- Tidak ada loot spesifik.\n`;
            } else {
                for (const loot of lootTable) {
                    const itemData = bot.db.prepare("SELECT name FROM items WHERE code = ?").get(loot.item_code);
                    const itemName = itemData ? itemData.name : loot.item_code;
                    msg += `- ${itemName} (${Math.round(loot.chance * 100)}% | ${loot.qty_min}-${loot.qty_max}x)\n`;
                }
            }

            return ctx.reply(msg);
        }

        // ---------------------------------------------------------
        // 3. WIKI HEWAN (ANIMALS)
        // ---------------------------------------------------------
        if (category === 'hewan' || category === 'animal') {
            if (query === 'all') {
                const animals = bot.db.prepare(`SELECT name, code FROM animals ORDER BY name`).all();
                const list = animals.map(a => `• 🦊 ${a.name} (\`${a.code}\`)`).join('\n');
                return ctx.reply(`🦊 *Daftar Semua Hewan:*\n\n${list}`);
            }

            const animals = bot.db.prepare(`SELECT * FROM animals WHERE code = ? OR LOWER(name) LIKE ? COLLATE NOCASE`).all(query, likeQuery);

            if (animals.length === 0) return ctx.reply(`❌ Hewan mengandung kata "${query}" tidak ditemukan.`);
            
            if (animals.length > 1) {
                let msg = `🔍 *Ditemukan beberapa hewan:*\n\n`;
                animals.forEach((a, idx) => {
                    msg += `${idx + 1}. ${a.name} (\`${a.code}\`)\n`;
                });
                return ctx.reply(msg);
            }

            const a = animals[0];
            const locs = a.locations ? JSON.parse(a.locations) : [];
            const lootTable = a.loot_table ? JSON.parse(a.loot_table) : [];

            let msg = `*╭─── • 「 INFO HEWAN 」*\n`;
            msg += `*│* 🦊 *Nama:* ${a.name} (\`${a.code}\`)\n`;
            if (locs.length > 0) msg += `*│* 📍 *Habitat:* ${locs.join(", ")}\n`;
            msg += `*╰──────────────*\n`;
            msg += `*Deskripsi:* ${a.description || '-'}\n\n`;
            
            msg += `*Loot (Hasil Buruan):*\n`;
            if (lootTable.length === 0) {
                msg += `- Tidak ada hasil spesifik.\n`;
            } else {
                for (const loot of lootTable) {
                    const itemData = bot.db.prepare("SELECT name FROM items WHERE code = ?").get(loot.item_code);
                    const itemName = itemData ? itemData.name : loot.item_code;
                    msg += `- ${itemName} (${Math.round(loot.chance * 100)}% | ${loot.qty_min}-${loot.qty_max}x)\n`;
                }
            }

            return ctx.reply(msg);
        }

        // ---------------------------------------------------------
        // 4. WIKI TANAMAN (PLANTS)
        // ---------------------------------------------------------
        if (category === 'tanaman' || category === 'plant') {
            if (query === 'all') {
                const plants = bot.db.prepare(`SELECT name, code FROM plants ORDER BY name`).all();
                const list = plants.map(p => `• 🌿 ${p.name} (\`${p.code}\`)`).join('\n');
                return ctx.reply(`🌿 *Daftar Semua Tanaman:*\n\n${list}`);
            }

            const plants = bot.db.prepare(`SELECT * FROM plants WHERE code = ? OR LOWER(name) LIKE ? COLLATE NOCASE`).all(query, likeQuery);

            if (plants.length === 0) return ctx.reply(`❌ Tanaman mengandung kata "${query}" tidak ditemukan.`);
            
            if (plants.length > 1) {
                let msg = `🔍 *Ditemukan beberapa tanaman:*\n\n`;
                plants.forEach((p, idx) => {
                    msg += `${idx + 1}. ${p.name} (\`${p.code}\`)\n`;
                });
                return ctx.reply(msg);
            }

            const p = plants[0];
            const locs = p.locations ? JSON.parse(p.locations) : [];
            const lootTable = p.loot_table ? JSON.parse(p.loot_table) : [];

            let msg = `*╭─── • 「 INFO TANAMAN 」*\n`;
            msg += `*│* 🌿 *Nama:* ${p.name} (\`${p.code}\`)\n`;
            if (locs.length > 0) msg += `*│* 📍 *Habitat:* ${locs.join(", ")}\n`;
            msg += `*╰──────────────*\n`;
            msg += `*Deskripsi:* ${p.description || '-'}\n\n`;
            
            msg += `*Hasil Panen/Gathering:*\n`;
            if (lootTable.length === 0) {
                msg += `- Tidak ada hasil spesifik.\n`;
            } else {
                for (const loot of lootTable) {
                    const itemData = bot.db.prepare("SELECT name FROM items WHERE code = ?").get(loot.item_code);
                    const itemName = itemData ? itemData.name : loot.item_code;
                    msg += `- ${itemName} (${Math.round(loot.chance * 100)}% | ${loot.qty_min}-${loot.qty_max}x)\n`;
                }
            }

            return ctx.reply(msg);
        }

        // ---------------------------------------------------------
        // 5. WIKI BIOME
        // ---------------------------------------------------------
        if (category === 'biome' || category === 'lokasi' || category === 'map') {
            if (query === 'all') {
                const biomes = bot.db.prepare(`SELECT name, code FROM biomes ORDER BY min_level`).all();
                const list = biomes.map(b => `• 🧭 ${b.name} (\`${b.code}\`)`).join('\n');
                return ctx.reply(`🧭 *Daftar Semua Biome:*\n\n${list}`);
            }

            const biomes = bot.db.prepare(`SELECT * FROM biomes WHERE code = ? OR LOWER(name) LIKE ? COLLATE NOCASE`).all(query, likeQuery);

            if (biomes.length === 0) return ctx.reply(`❌ Biome mengandung kata "${query}" tidak ditemukan.`);
            
            if (biomes.length > 1) {
                let msg = `🔍 *Ditemukan beberapa biome:*\n\n`;
                biomes.forEach((b, idx) => {
                    msg += `${idx + 1}. ${b.name} (\`${b.code}\`)\n`;
                });
                return ctx.reply(msg);
            }

            const b = biomes[0];
            
            let msg = `*╭─── • 「 INFO BIOME 」*\n`;
            msg += `*│* 🧭 *Nama:* ${b.name} (\`${b.code}\`)\n`;
            msg += `*│* 🎖️ *Syarat Lvl:* ${b.min_level || 1}\n`;
            if (b.is_hidden) msg += `*│* 🔒 *Status:* Tersembunyi (Butuh: ${b.unlocked_by})\n`;
            msg += `*╰──────────────*\n`;
            msg += `*Deskripsi:* ${b.description || '-'}\n\n`;

            // Cari monster
            const monsters = bot.db.prepare("SELECT name, is_boss FROM monsters WHERE locations LIKE ?").all(`%"${b.name}"%`);
            msg += `*Monster di sini:*\n`;
            if (monsters.length > 0) {
                msg += monsters.map(m => m.is_boss ? `- ☠️ ${m.name} (Boss)` : `- ${m.name}`).join("\n") + "\n";
            } else {
                msg += "- Kosong\n";
            }

            // Cari item (secara umum)
            const items = bot.db.prepare("SELECT name FROM items WHERE locations LIKE ? LIMIT 10").all(`%"${b.name}"%`);
            msg += `\n*Contoh Item/Loot di area ini:*\n`;
            if (items.length > 0) {
                msg += items.map(i => `- ${i.name}`).join("\n");
                if (items.length >= 10) msg += `\n- ... dan banyak lagi!`;
            } else {
                msg += "- Kosong";
            }

            return ctx.reply(msg);
        }

        // ---------------------------------------------------------
        // 6. WIKI SKILL
        // ---------------------------------------------------------
        if (category === 'skill' || category === 'jurus') {
            if (query === 'all') {
                const skills = bot.db.prepare(`SELECT name, code FROM skills ORDER BY name`).all();
                const list = skills.map(s => `• ✨ ${s.name} (\`${s.code}\`)`).join('\n');
                return ctx.reply(`✨ *Daftar Semua Skill:*\n\n${list}`);
            }

            const skills = bot.db.prepare(`SELECT * FROM skills WHERE code = ? OR LOWER(name) LIKE ? COLLATE NOCASE`).all(query, likeQuery);

            if (skills.length === 0) return ctx.reply(`❌ Skill mengandung kata "${query}" tidak ditemukan.`);
            
            if (skills.length > 1) {
                let msg = `🔍 *Ditemukan beberapa skill:*\n\n`;
                skills.forEach((s, idx) => {
                    msg += `${idx + 1}. ${s.name} (\`${s.code}\`)\n`;
                });
                return ctx.reply(msg);
            }

            const s = skills[0];
            
            let msg = `*╭─── • 「 INFO SKILL 」*\n`;
            msg += `*│* ✨ *Nama:* ${s.name} (\`${s.code}\`)\n`;
            msg += `*│* 💧 *Mana Cost:* ${s.mana_cost}\n`;
            msg += `*│* ⏳ *Cooldown:* ${s.cooldown_seconds} detik\n`;
            msg += `*╰──────────────*\n`;
            msg += `*Deskripsi:* ${s.description || '-'}\n`;

            return ctx.reply(msg);
        }

        return ctx.reply("❌ Kategori tidak valid. Pilih antara: `item`, `monster`, `hewan`, `tanaman`, `biome`, atau `skill`.");
    }, { aliases: ["encyclopedia", "buku"], category: "RPG", description: "Buku pintar untuk mencari info item, hewan, tanaman, monster, biome, atau skill." });
}
