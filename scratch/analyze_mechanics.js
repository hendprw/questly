import { WORLD_ITEMS } from '../db/seed-world.js';
import fs from 'fs';

let report = "--- ANALISIS KELEMAHAN SISTEM QUESTLY ---\n\n";

// 1. Cek Sumber Bibit Pertanian (Seeds)
const seeds = WORLD_ITEMS.filter(i => i.code.endsWith('_seed'));
const seedSources = {};
seeds.forEach(s => {
    seedSources[s.code] = {
        name: s.name,
        inGather: false,
        inShop: false,
        inMonster: false
    };
});

// Cek dari mana saja bibit bisa didapat
WORLD_ITEMS.forEach(i => {
    // Anggap item wild punya loot_table jika kita periksa db, tapi di seed-world.js, 
    // kita bisa periksa if category === 'wild' -> apakah ada seed?
    if (i.category === 'wild' || i.category === 'farmable') {
        if (i.loot_table) {
            i.loot_table.forEach(loot => {
                if (seedSources[loot.item_code]) {
                    seedSources[loot.item_code].inGather = true;
                }
            });
        }
    }
});

// 2. Cek Kegunaan Item (Item Sink)
const craftMaterials = new Set();
WORLD_ITEMS.forEach(i => {
    if (i.metadata && i.metadata.crafting) {
        Object.keys(i.metadata.crafting.materials).forEach(m => craftMaterials.add(m));
    }
    if (i.metadata && i.metadata.upgrade && i.metadata.upgrade.cost) {
        i.metadata.upgrade.cost.forEach(lvl => {
            if (lvl.materials) {
                Object.keys(lvl.materials).forEach(m => craftMaterials.add(m));
            }
        });
    }
});

const uselessItems = WORLD_ITEMS.filter(i => 
    (i.category === 'material' || i.category === 'food') && 
    !craftMaterials.has(i.code) &&
    !i.metadata?.usable
);

report += "1. SISTEM PERTANIAN & GATHERING:\n";
seeds.forEach(s => {
    const stat = seedSources[s.code];
    if (!stat.inGather) {
        report += `- ${stat.name} (${s.code}): Hanya bisa dibeli di toko? Tidak ada di alam liar.\n`;
    }
});

report += "\n2. ITEM SAMPAH (Tidak Punya Kegunaan Crafting/Upgrade/Usable):\n";
uselessItems.forEach(i => {
    report += `- ${i.name} (${i.code})\n`;
});

report += "\n3. KESEIMBANGAN EKONOMI (Stamina vs Harga Jual):\n";
// Ambil rata-rata harga jual item per kategori
const avgSell = (cat) => {
    const items = WORLD_ITEMS.filter(i => i.category === cat && i.sell_price > 0);
    const sum = items.reduce((acc, i) => acc + i.sell_price, 0);
    return items.length ? (sum / items.length).toFixed(1) : 0;
};
report += `- Rata-rata Jual Material Tambang (!mine 15 Stamina): ${avgSell('mineral')} Aester\n`;
report += `- Rata-rata Jual Hasil Buruan (!hunt 12 Stamina): ${avgSell('material')} Aester\n`;
report += `- Rata-rata Jual Hasil Pancing (!fish 10 Stamina): ${avgSell('fish')} Aester\n`;

fs.writeFileSync('scratch/audit_mechanics.txt', report);
console.log("Audit complete.");
