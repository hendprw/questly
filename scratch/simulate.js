import { openDatabase } from '../db/connection.js';
import { getFullProfile } from '../db/repo/users.js';
import { resolveHunt } from '../db/repo/combat.js';
import { getAndRegenerateStamina, consumeStamina } from '../db/repo/stamina.js';
import { listGatherableByBiome, getItemByCode, addItem } from '../db/repo/items.js';

// Simulasi aktivitas
const db = openDatabase();
const TEST_USER_ID = 1; // ID user pertama di DB (biasanya user utama)

console.log("=== MEMULAI SIMULASI RPG (10 Menit Gameplay) ===");

let logs = [];
let actions = 0;
let errors = 0;

try {
    const startProfile = getFullProfile(db, TEST_USER_ID);
    console.log(`Pemain: ${startProfile.user.push_name} | Class: ${startProfile.character.class}`);
    console.log(`Awal: Level ${startProfile.leveling.level} | Aester: ${startProfile.wallet.cash} | HP: ${startProfile.character.hp}`);
    
    // Pastikan HP penuh untuk simulasi
    db.prepare(`UPDATE characters SET hp = max_hp, mp = max_mp WHERE user_id = ?`).run(TEST_USER_ID);
    
    // Set lokasi awal
    db.prepare(`UPDATE characters SET location = 'Kota Awal' WHERE user_id = ?`).run(TEST_USER_ID);

    const locationsToVisit = ["Eldwood", "Veridian Labyrinth", "Crystal Caves"];

    for (let i = 0; i < 30; i++) { // 30 aksi ~ 10 menit gameplay
        actions++;
        const rand = Math.random();
        
        let profile = getFullProfile(db, TEST_USER_ID);
        
        // 10% ganti lokasi
        if (rand < 0.10) {
            const nextLoc = locationsToVisit[Math.floor(Math.random() * locationsToVisit.length)];
            db.prepare(`UPDATE characters SET location = ? WHERE user_id = ?`).run(nextLoc, TEST_USER_ID);
            logs.push(`[TRAVEL] Pindah ke ${nextLoc}`);
        }
        // 40% hunt
        else if (rand < 0.50) {
            if (profile.character.hp > 20) {
                try {
                    const result = resolveHunt(db, TEST_USER_ID);
                    logs.push(`[HUNT] Bertarung vs ${result.monster.name} - ${result.win ? 'Menang' : 'Kalah'} (-${profile.character.hp - result.character.hp} HP)`);
                } catch (e) {
                    logs.push(`[HUNT ERROR] ${e.message}`);
                }
            } else {
                logs.push(`[REST] HP Terlalu rendah (${profile.character.hp}), istirahat memulihkan 50 HP.`);
                db.prepare(`UPDATE characters SET hp = MIN(max_hp, hp + 50) WHERE user_id = ?`).run(TEST_USER_ID);
            }
        }
        // 30% gather
        else if (rand < 0.80) {
            const stamina = getAndRegenerateStamina(db, TEST_USER_ID);
            if (stamina.stamina >= 10) {
                consumeStamina(db, TEST_USER_ID, 10);
                const items = listGatherableByBiome(db, profile.character.location);
                if (items && items.length > 0) {
                    const drop = items[Math.floor(Math.random() * items.length)];
                    addItem(db, TEST_USER_ID, drop.code, 1);
                    logs.push(`[GATHER] Mengumpulkan 1x ${drop.name} di ${profile.character.location}`);
                } else {
                    logs.push(`[GATHER] Tidak ada item yang bisa dikumpulkan di ${profile.character.location}`);
                }
            } else {
                logs.push(`[REST] Stamina habis (${stamina.stamina}), istirahat memulihkan 20 Stamina.`);
                db.prepare(`UPDATE characters SET stamina = MIN(max_stamina, stamina + 20) WHERE user_id = ?`).run(TEST_USER_ID);
            }
        }
        // 20% craft/alkimia (simulasi)
        else {
             logs.push(`[ALKIMIA] Mencoba meracik ramuan_penyembuh...`);
             const hasHerb = db.prepare(`SELECT quantity FROM inventory WHERE user_id = ? AND item_id = (SELECT id FROM items WHERE code = 'herb')`).get(TEST_USER_ID);
             const hasSap = db.prepare(`SELECT quantity FROM inventory WHERE user_id = ? AND item_id = (SELECT id FROM items WHERE code = 'treant_sap')`).get(TEST_USER_ID);
             if (hasHerb && hasSap && hasHerb.quantity >= 2 && hasSap.quantity >= 1) {
                 db.prepare(`UPDATE inventory SET quantity = quantity - 2 WHERE user_id = ? AND item_id = (SELECT id FROM items WHERE code = 'herb')`).run(TEST_USER_ID);
                 db.prepare(`UPDATE inventory SET quantity = quantity - 1 WHERE user_id = ? AND item_id = (SELECT id FROM items WHERE code = 'treant_sap')`).run(TEST_USER_ID);
                 addItem(db, TEST_USER_ID, 'ramuan_penyembuh', 1);
                 logs.push(`[ALKIMIA] Berhasil membuat Ramuan Penyembuh!`);
             } else {
                 logs.push(`[ALKIMIA] Bahan tidak cukup (butuh 2 herb, 1 treant sap).`);
             }
        }
    }

    console.log("\n--- LOG SIMULASI ---");
    logs.forEach((l, i) => console.log(`${i+1}. ${l}`));

    const endProfile = getFullProfile(db, TEST_USER_ID);
    console.log("\n=== HASIL AUDIT ===");
    console.log(`Total Aksi: ${actions}`);
    console.log(`Perubahan Level: ${startProfile.leveling.level} -> ${endProfile.leveling.level}`);
    console.log(`Perubahan Aester: ${startProfile.wallet.cash} -> ${endProfile.wallet.cash}`);
    console.log(`Sisa HP: ${endProfile.character.hp}/${endProfile.character.max_hp}`);
    
    const stamina = getAndRegenerateStamina(db, TEST_USER_ID);
    console.log(`Sisa Stamina: ${stamina.stamina}/${stamina.max_stamina}`);
    
    console.log("\nKESIMPULAN AUDIT:");
    if (endProfile.wallet.cash > startProfile.wallet.cash) console.log("- Ekonomi (+): Ekonomi game berjalan positif (pemain untung dari hunting).");
    else console.log("- Ekonomi (-): Uang pemain stagnan atau turun. Butuh balancing drop rate / harga shop.");
    
    if (endProfile.character.hp < 10) console.log("- Survival (-): Pemain rentan mati beruntun. Monster mungkin terlalu sulit.");
    else console.log("- Survival (+): Sistem combat cukup seimbang.");

} catch (err) {
    console.error("Terjadi error saat simulasi:", err);
}
