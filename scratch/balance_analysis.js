import { WORLD_ITEMS, WORLD_MONSTERS } from '../db/seed-world.js';

let issues = [];

// 1. Cek Infinite Money Glitch (buy_price < sell_price)
for (const item of WORLD_ITEMS) {
    if (item.buy_price && item.sell_price && item.buy_price < item.sell_price) {
        issues.push(`EXPLOIT: ${item.name} bisa dibeli seharga ${item.buy_price} dan dijual seharga ${item.sell_price}`);
    }
    if (item.sell_price > 5000 && item.rarity === 'common') {
        issues.push(`OVERPRICED COMMON: ${item.name} dijual seharga ${item.sell_price}`);
    }
    // Cek stat senjata vs rarity
    if (item.category === 'weapon' && item.metadata?.stats?.attack) {
        const atk = item.metadata.stats.attack;
        if (item.rarity === 'common' && atk > 50) issues.push(`OP COMMON WEAPON: ${item.name} Atk ${atk}`);
        if (item.rarity === 'mythic' && atk < 100) issues.push(`WEAK MYTHIC WEAPON: ${item.name} Atk ${atk}`);
    }
}

// 2. Cek Monster Stats
for (const m of WORLD_MONSTERS) {
    if (m.level < 5 && m.stats.attack > 100) {
        issues.push(`OP LOW LEVEL MONSTER: ${m.name} Lv${m.level} Atk ${m.stats.attack}`);
    }
}

console.log("=== BALANCE ISSUES FOUND ===");
if (issues.length === 0) console.log("None!");
else console.log(issues.join('\n'));

// Coba hitung rata-rata harga jual per rarity
const rarityPrices = {};
for (const item of WORLD_ITEMS) {
    if (!item.sell_price) continue;
    if (!rarityPrices[item.rarity]) rarityPrices[item.rarity] = [];
    rarityPrices[item.rarity].push(item.sell_price);
}

console.log("\n=== AVERAGE SELL PRICE PER RARITY ===");
for (const r in rarityPrices) {
    const sum = rarityPrices[r].reduce((a, b) => a + b, 0);
    console.log(`${r.toUpperCase()}: ${(sum / rarityPrices[r].length).toFixed(0)} Aester (Max: ${Math.max(...rarityPrices[r])})`);
}
