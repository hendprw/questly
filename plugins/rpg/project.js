import { progressBar } from "../../lib/format.js";

export default function (bot) {
    bot.command("project", async (ctx) => {
        const subCommand = ctx.args[0]?.toLowerCase();
        const projectCode = ctx.args[1]?.toLowerCase();
        const amountArg = parseInt(ctx.args[2]);

        const activeProjects = bot.db.prepare("SELECT * FROM community_projects WHERE is_completed = 0").all();

        // 1. Menu Utama / Daftar Proyek
        if (!subCommand || subCommand !== 'sumbang') {
            if (activeProjects.length === 0) {
                return ctx.reply("🌟 Saat ini tidak ada proyek gotong royong yang sedang berjalan. Semua wilayah sudah terbuka!");
            }

            let msg = `*╭─── • 「 COMMUNITY PROJECT 」*\n`;
            msg += `*│* _Mari bergotong royong membuka wilayah baru!_\n`;
            msg += `*╰──────────────*\n\n`;

            for (const proj of activeProjects) {
                const itemData = bot.db.prepare("SELECT name FROM items WHERE code = ?").get(proj.required_item);
                const itemName = itemData ? itemData.name : proj.required_item;
                const percent = Math.floor((proj.current_amount / proj.target_amount) * 100);

                msg += `🚧 *${proj.name}* (\`${proj.code}\`)\n`;
                msg += `📦 Butuh: ${proj.target_amount.toLocaleString()} ${itemName}\n`;
                msg += `📈 Progres: [${progressBar(proj.current_amount, proj.target_amount, 10)}] ${percent}%\n`;
                msg += `_${proj.current_amount.toLocaleString()} / ${proj.target_amount.toLocaleString()} terkumpul_\n\n`;
            }

            msg += `*Ketik:* \`${bot.options.prefix || '.'}project sumbang <kode_proyek> <jumlah>\``;
            return ctx.reply(msg);
        }

        // 2. Sumbang
        if (subCommand === 'sumbang') {
            if (!projectCode || !amountArg) {
                return ctx.reply(`Bantuan Project:\n- \`${bot.options.prefix || '.'}project list\` : Lihat proyek aktif\n- \`${bot.options.prefix || '.'}project sumbang <kode> <jumlah>\` : Berkontribusi material`);
            }
            if (isNaN(amountArg) || amountArg <= 0) {
                return ctx.reply("❌ Jumlah sumbangan harus berupa angka positif.");
            }

            try {
                const apply = bot.db.transaction(() => {
                    const proj = bot.db.prepare("SELECT * FROM community_projects WHERE code = ?").get(projectCode);
                    if (!proj) throw new Error(`Proyek dengan kode "${projectCode}" tidak ditemukan.`);
                    if (proj.is_completed) throw new Error(`Proyek "${proj.name}" sudah selesai dibangun! Tidak perlu disumbang lagi.`);

                    const itemData = bot.db.prepare("SELECT * FROM items WHERE code = ?").get(proj.required_item);
                    if (!itemData) throw new Error(`Item yang dibutuhkan proyek ini cacat (tidak ada di database).`);

                    const invRow = bot.db.prepare("SELECT id, quantity FROM inventory WHERE user_id = ? AND item_id = ? AND location = 'bag'").get(ctx.dbUser.id, itemData.id);

                    if (!invRow || invRow.quantity < amountArg) {
                        const owned = invRow ? invRow.quantity : 0;
                        throw new Error(`Kamu tidak memiliki cukup ${itemData.name} di Tas. (Punya: ${owned} | Ingin nyumbang: ${amountArg})`);
                    }

                    const needMore = proj.target_amount - proj.current_amount;
                    const actualSumbang = Math.min(amountArg, needMore);

                    // 1. Kurangi item dari tas
                    if (invRow.quantity === actualSumbang) {
                        bot.db.prepare("DELETE FROM inventory WHERE id = ?").run(invRow.id);
                    } else {
                        bot.db.prepare("UPDATE inventory SET quantity = quantity - ? WHERE id = ?").run(actualSumbang, invRow.id);
                    }

                    // 2. Tambah progress proyek
                    const newAmount = proj.current_amount + actualSumbang;
                    let completed = 0;
                    if (newAmount >= proj.target_amount) {
                        completed = 1;
                    }

                    bot.db.prepare("UPDATE community_projects SET current_amount = ?, is_completed = ? WHERE code = ?")
                          .run(newAmount, completed, proj.code);

                    // 3. Tambah Poin Kepahlawanan (Hero Score)
                    const heroScoreEarned = Math.max(1, Math.floor(actualSumbang / 10));
                    bot.db.prepare("UPDATE characters SET hero_score = hero_score + ? WHERE user_id = ?").run(heroScoreEarned, ctx.dbUser.id);

                    return { newAmount, completed, actualSumbang, itemName: itemData.name, projName: proj.name, target: proj.target_amount, heroScoreEarned };
                });

                const result = apply();

                if (result.completed) {
                    return ctx.reply(`🎉 **LUAR BIASA!** Sumbanganmu sebesar ${result.actualSumbang} ${result.itemName} telah melengkapi proyek ini!\n\nProyek **${result.projName}** RESMI SELESAI! Wilayah tersebut kini bisa diakses oleh seluruh pemain menggunakan \`!travel\`. (+${result.heroScoreEarned} Poin Pahlawan)`);
                } else {
                    return ctx.reply(`✅ Kamu menyumbangkan ${result.actualSumbang} ${result.itemName} untuk proyek **${result.projName}**!\nProgress saat ini: ${result.newAmount.toLocaleString()} / ${result.target.toLocaleString()}\n✨ Mendapat **+${result.heroScoreEarned} Poin Pahlawan**!`);
                }

            } catch (err) {
                return ctx.reply(`❌ Gagal menyumbang: ${err.message}`);
            }
        }

    }, { aliases: ["bangun", "donasi"], category: "RPG", description: "Melihat dan menyumbang proyek gotong royong global." });
}
