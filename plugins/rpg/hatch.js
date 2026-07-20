import { getInventory, removeItem, addItem } from "../../db/repo/items.js";

// Waktu tetas = 2 Jam = 2 * 60 * 60 * 1000 ms = 7200000 ms
const HATCH_DURATION = 7200000; 

const PET_CODES = [
    'pet_baby_dragon', 'pet_white_wolf', 'pet_chocobo', 'pet_slime', 'pet_eagle'
];

const MYTHIC_PET_CODES = [
    'pet_phoenix', 'pet_golden_slime', 'pet_fairy'
];

function formatTimeLeft(ms) {
    if (ms <= 0) return "Siap Ditetaskan!";
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h} jam ${m} menit`;
}

export default function (bot) {
  bot.command("hatch", async (ctx) => {
      const subCmd = ctx.args[0]?.toLowerCase();
      const userId = ctx.dbUser.id;
      const db = bot.db;

      if (!subCmd) {
          return ctx.reply(`*🥚 Sistem Inkubator Telur*\n\n` + 
             `Gunakan perintah berikut:\n` +
             `- \`!hatch start\` : Masukkan Telur Misterius ke inkubator.\n` +
             `- \`!hatch check\` : Cek sisa waktu penetasan.\n` +
             `- \`!hatch open\` : Buka inkubator jika waktu sudah habis.\n\n` + 
             `_(Butuh item *Telur Misterius* dari perburuan)_`
          );
      }

      if (subCmd === 'start') {
          const incubatorRow = db.prepare("SELECT * FROM incubators WHERE user_id = ?").get(userId);
          if (incubatorRow) {
             return ctx.reply("❌ Inkubator milikmu sedang menampung telur. Ketik `!hatch check` untuk melihatnya.");
          }

          // Cek Tas
          const inv = getInventory(db, userId);
          const egg = inv.find(i => i.code === 'mysterious_egg');
          if (!egg || egg.quantity < 1) {
             return ctx.reply("❌ Kamu tidak memiliki *Telur Misterius* di Tas-mu.");
          }

          const now = Date.now();
          const endTime = now + HATCH_DURATION;
          
          db.prepare("INSERT INTO incubators (user_id, start_time, end_time) VALUES (?, ?, ?)").run(userId, now, endTime);
          removeItem(db, userId, egg.inventory_id, 1);

          return ctx.reply("🔥 Telur Misterius telah dimasukkan ke dalam inkubator ajaib.\nTelur ini butuh **2 Jam** untuk menetas. Bersabarlah!");
      }

      if (subCmd === 'check') {
          const incubatorRow = db.prepare("SELECT * FROM incubators WHERE user_id = ?").get(userId);
          if (!incubatorRow) {
             return ctx.reply("❌ Inkubatormu kosong! Cari telur di hutan dengan `!hunt`.");
          }

          const now = Date.now();
          const timeLeft = incubatorRow.end_time - now;

          if (timeLeft <= 0) {
             return ctx.reply("✨ *Telurmu sudah siap!* Ketik `!hatch open` sekarang untuk melihat peliharaan barumu!");
          }

          return ctx.reply(`⏳ Telurmu masih dipanaskan...\n\nSisa waktu: *${formatTimeLeft(timeLeft)}*`);
      }

      if (subCmd === 'open') {
          const incubatorRow = db.prepare("SELECT * FROM incubators WHERE user_id = ?").get(userId);
          if (!incubatorRow) {
             return ctx.reply("❌ Tidak ada telur di inkubator milikmu.");
          }

          const now = Date.now();
          if (now < incubatorRow.end_time) {
             const timeLeft = incubatorRow.end_time - now;
             return ctx.reply(`❌ Telur ini belum matang! Sabar dulu.\nSisa waktu: *${formatTimeLeft(timeLeft)}*`);
          }

          // Waktu habis, saatnya menetas!
          let petCode;
          const isMythic = Math.random() < 0.05; // 5% chance
          if (isMythic) {
              petCode = MYTHIC_PET_CODES[Math.floor(Math.random() * MYTHIC_PET_CODES.length)];
          } else {
              petCode = PET_CODES[Math.floor(Math.random() * PET_CODES.length)];
          }

          const petItem = db.prepare("SELECT name FROM items WHERE code = ?").get(petCode);
          const petName = petItem ? petItem.name : petCode;

          addItem(db, userId, petCode, 1);
          db.prepare("DELETE FROM incubators WHERE user_id = ?").run(userId);

          return ctx.reply(`🎉 *KREK! KREEEEEK!!*\n\nCangkang Telur Misterius itu pecah, dan seekor **${petName}** melompat keluar ke dalam pelukanmu!\n\n_(Peliharaan ini telah masuk ke dalam Tas-mu sebagai teman)_`);
      }
  }, { aliases: ["telur", "incubator"], category: "RPG", description: "Menetaskan telur misterius menjadi peliharaan pelindung." });
}
