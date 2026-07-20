// plugins/rpg/hero_scheduler.js

export default function (bot) {
    // Jalankan setiap 1 jam (3600000 ms)
    setInterval(() => {
        const db = bot.db;
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${now.getMonth() + 1}`; // e.g. "2026-7"
        
        // Pemulihan Supply & Demand Market (Setiap 1 Jam: Berkurang 10%)
        db.prepare("UPDATE shop_supply SET sold_count = MAX(0, CAST(sold_count * 0.9 AS INTEGER)) WHERE sold_count > 0").run();

        // Cek kapan terakhir reset
        let lastReset = db.prepare("SELECT value FROM system_state WHERE key = 'last_hero_reset_month'").get();
        if (!lastReset) {
            db.prepare("INSERT INTO system_state (key, value) VALUES ('last_hero_reset_month', ?)").run(currentMonth);
            return;
        }

        if (lastReset.value !== currentMonth) {
            // Waktunya reset pahlawan bulanan!
            db.transaction(() => {
                // 1. Cabut pahlawan lama
                db.prepare("UPDATE characters SET is_hero = 0 WHERE is_hero = 1").run();
                
                // 2. Pilih 2 Pahlawan baru dengan Hero Score tertinggi (>0)
                const newHeroes = db.prepare("SELECT user_id, hero_score FROM characters WHERE hero_score > 0 ORDER BY hero_score DESC LIMIT 2").all();
                
                if (newHeroes.length > 0) {
                    const heroIds = newHeroes.map(h => h.user_id);
                    const placeholders = heroIds.map(() => '?').join(',');
                    db.prepare(`UPDATE characters SET is_hero = 1 WHERE user_id IN (${placeholders})`).run(...heroIds);
                    
                    // Log / Broadcast: (Idealnya dikirim ke grup, tapi untuk log console dulu)
                    console.log(`[HERO SYSTEM] Bulan ${currentMonth}: Pahlawan baru terpilih! ID: ${heroIds.join(', ')}`);
                } else {
                    console.log(`[HERO SYSTEM] Bulan ${currentMonth}: Tidak ada yang memenuhi syarat menjadi pahlawan.`);
                }

                // 3. Reset semua score kembali ke 0
                db.prepare("UPDATE characters SET hero_score = 0").run();

                // 4. Update bulan terakhir reset
                db.prepare("UPDATE system_state SET value = ? WHERE key = 'last_hero_reset_month'").run(currentMonth);
            })();
        }
    }, 3600000);
}
