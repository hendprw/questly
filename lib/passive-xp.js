/**
 * lib/passive-xp.js
 * ------------------
 * XP pasif dari aktivitas chat biasa (bukan command) — porting fitur
 * "XP per chat" dari Orion (index.js: `handleRpgXp`, 10-66 XP acak tiap
 * kirim pesan).
 *
 * BEDA SENGAJA DARI ORION (dan kenapa):
 *
 * 1. Orion punya bug tersembunyi: `handleRpgXp` dipanggil sampai 2x untuk
 *    hampir semua pesan (index.js baris ~120 dipanggil tanpa syarat, LALU
 *    dipanggil lagi di baris ~129 kalau pesannya command, atau baris ~131
 *    kalau pesan chat biasa). Efeknya user Orion diam-diam dapat XP dobel.
 *    Di sini XP hanya diberikan SATU KALI per pesan — tidak mereplikasi
 *    bug itu.
 *
 * 2. [DIHAPUS] Sebelumnya ada cooldown 60 detik/user di sini yang tidak
 *    ada di Orion sama sekali, buat cegah farming spam pesan kosong.
 *    Atas permintaan, cooldown ini dicabut — sekarang tiap pesan SELALU
 *    dapat XP, persis seperti Orion asli (tidak ada limit rate).
 *
 * 3. Orion cuma kasih XP kalau `Player.findOne()` ketemu (artinya user
 *    harus `!register` dulu). Questly sudah auto-provision user dari
 *    manapun via `getOrCreateUser`, jadi di sini user baru pun otomatis
 *    kebagian XP dari pesan pertamanya — konsisten dengan filosofi
 *    "SETIAP pengirim command sudah punya baris user" yang dipakai
 *    middleware global di index.js.
 */
import { getOrCreateUser } from "../db/repo/users.js";
import { gainXp } from "../db/repo/progression.js";

const MIN_XP = 10;
const MAX_XP = 66;
const COOLDOWN_MS = 60000; // 60 Detik In-Memory Cooldown

// Menyimpan kapan terakhir kali user mendapat XP pasif agar tidak kena spam
const xpCooldowns = new Map();

/**
 * Daftarkan listener XP pasif. Panggil sekali dari index.js setelah
 * `bot.db` disiapkan.
 * @param {import('botify-wa').Bot} bot
 * @param {import('better-sqlite3').Database} db
 */
export function registerPassiveXp(bot, db) {
  bot.on("message", async (ctx) => {
    try {
      // Jangan proses pesan dari bot sendiri atau siaran status
      // (persis seperti pengecekan `fromMe` + `status@broadcast` di Orion).
      if (ctx.fromMe || ctx.chatType === "broadcast") return;

      // Pesan tanpa teks (mis. media tanpa caption, reaksi, dst) tidak
      // menghasilkan XP — sama seperti Orion yang cuma proses body teks.
      if (!ctx.text) return;

      const senderId = ctx.senderNumber;
      const now = Date.now();
      
      if (xpCooldowns.has(senderId)) {
          const lastTime = xpCooldowns.get(senderId);
          if (now - lastTime < COOLDOWN_MS) {
              return; // Masih cooldown, abaikan pesan ini agar Event Loop tidak macet
          }
      }
      
      xpCooldowns.set(senderId, now);

      const dbUser = getOrCreateUser(db, ctx);

      const xpGained = Math.floor(Math.random() * (MAX_XP - MIN_XP + 1)) + MIN_XP;
      const result = gainXp(db, dbUser.id, xpGained);

      if (result.leveledUp) {
        await ctx.reply(result.messages.join("\n\n"));
      }
    } catch (err) {
      // Sengaja tidak melempar error ke atas — XP pasif tidak boleh sampai
      // mengganggu/mematikan pemrosesan pesan lain kalau ada masalah kecil.
      console.error("[passive-xp] gagal memproses XP chat:", err);
    }
  });
}