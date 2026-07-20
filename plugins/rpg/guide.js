export default function (bot) {
    bot.command("guide", async (ctx) => {
        let msg = `📜 *PANDUAN BERMAIN QUESTLY* 📜\n\n`;
        
        msg += `*1. Siklus Kehidupan (Stamina)* ⚡\n`;
        msg += `Aktivitas di dunia ini memakan stamina (maks 100). Stamina beregenerasi otomatis seiring waktu.\n`;
        msg += `• \`!hunt\` - Berburu hewan liar (Daging, Kulit, Taring)\n`;
        msg += `• \`!mine\` - Menambang mineral (Batu, Bijih Besi, Permata)\n`;
        msg += `• \`!gather\` - Mencari tanaman liar (Herba, Bunga, Kayu)\n`;
        msg += `• \`!fish\` - Memancing ikan di perairan\n\n`;

        msg += `*2. Bertahan Hidup & Bertarung* ⚔️\n`;
        msg += `• \`!fight\` - Melawan monster acak sesuai biome-mu untuk mendapat EXP dan Material Monster.\n`;
        msg += `• \`!dungeon\` - Tantang ruang bawah tanah! Hadapi bos di lantai terakhir untuk *Loot* langka. Kematian di Dungeon berarti seluruh item di tasmu HANGUS.\n`;
        msg += `_Tips Tempur:_ Gunakan tombol saat bertarung, dan pilih *Skills* untuk menggunakan jurus mematikan!\n\n`;

        msg += `*3. Ekonomi & Crafting* 💰🛠️\n`;
        msg += `• \`!shop\` - Beli/jual barang menggunakan Aester.\n`;
        msg += `• \`!craft\` - Gabungkan material alam menjadi barang berharga (Makanan, Senjata).\n`;
        msg += `• \`!upgrade\` - Perkuat Senjata dan Armor-mu ke level berikutnya!\n\n`;

        msg += `*4. Eksplorasi Dunia* 🧭\n`;
        msg += `Dunia Questly sangat luas. Monster dan hasil alam berbeda-beda di setiap tempat.\n`;
        msg += `• \`!travel\` - Pindah ke wilayah (Biome) lain.\n`;
        msg += `• \`!wiki biome all\` - Lihat daftar tempat yang bisa dikunjungi.\n\n`;

        msg += `💡 *Trik & Tips Rahasia:*\n`;
        msg += `- Mentok lawan Boss? Lakukan \`!hunt\` atau \`!mine\`, lalu jual materialnya di \`!shop\` untuk membeli ramuan penyembuh (HP Potion).\n`;
        msg += `- Tas (\`!inv\`) punya batas berat! Buat *Tas Ekstra* via \`!craft\` agar bisa menampung lebih banyak.\n`;
        msg += `- Kamu tidak tahu resep atau asal-usul barang? Gunakan \`!wiki item <nama>\`.\n`;

        msg += `\n_Ketik perintah-perintah di atas untuk memulai petualangan besarmu!_`;

        await ctx.reply(msg);
    }, { aliases: ["tips", "cara", "panduan", "tutorial"], category: "Umum", description: "Menampilkan panduan bermain, cara kerja sistem, dan tips rahasia Questly." });
}
