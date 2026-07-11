import { Bot, loadPlugins } from "botify-wa";
import { openDatabase } from "./db/connection.js";
import { runMigrations } from "./db/migrate.js";
import { seedDatabase } from "./db/seed.js";
import { seedRpgContent } from "./db/seed-rpg.js";
import { seedWorldContent } from "./db/seed-world.js";
import { getOrCreateUser } from "./db/repo/users.js";
import { registerPassiveXp } from "./lib/passive-xp.js";

const bot = new Bot();
// config.bt di folder ini dibaca otomatis.
// Kalau mau override satu opsi: new Bot({ prefix: "?" })

// ── Setup SQLite SEBELUM plugin di-load, supaya bot.db sudah siap ──────────
const db = openDatabase();       // buka/bikin data/rpg.db
runMigrations(db);               // jalankan db/migrations/*.sql yang belum tercatat
seedDatabase(db);                // isi data master (jobs, items) kalau belum ada
seedRpgContent(db);              // isi data master RPG (class, skill, monster)
seedWorldContent(db);            // isi dunia (biome, resource, gemstone, monster) — porting Orion
bot.db = db;                     // diakses semua plugin lewat parameter `bot`

// Middleware global: pastikan SETIAP pengirim command sudah punya baris user
// (+ wallet/leveling/character bawaannya) sebelum command apa pun jalan —
// jadi command per-file di plugins/ tidak perlu urus "user baru" masing-masing.
bot.use((ctx) => {
  ctx.dbUser = getOrCreateUser(db, ctx);
});

// XP pasif dari chat biasa (bukan cuma command RPG) — porting dari Orion.
// Didaftarkan lewat bot.on("message", ...) karena event ini fire untuk
// SETIAP pesan masuk (beda dari bot.use(), yang cuma jalan kalau pesannya
// memang sebuah command).
registerPassiveXp(bot, db);

process.on("SIGINT", () => {
  db.close();
  process.exit(0);
});

// Load semua command dari plugins/ — SETIAP file = satu (atau beberapa)
// command, ini sistem plugin per-command bawaan Botify. Command dikelompokkan
// jadi subfolder per kategori (core/ekonomi/rpg) biar tidak numpuk di satu
// folder rata; loadPlugins() bawaan cuma baca file top-level per folder, jadi
// dipanggil sekali per subfolder kategori.
await loadPlugins(bot, "./plugins/core");
await loadPlugins(bot, "./plugins/ekonomi");
await loadPlugins(bot, "./plugins/rpg");

// ── Framework events ─────────────────────────────────────────────────────────

bot.on("ready", () => {
  console.log("✅ Bot online!");
});

bot.on("disconnect", ({ willReconnect, reconnectDelayMs, attempt }) => {
  if (willReconnect) {
    console.log(`⚠️  Terputus. Reconnect dalam ${reconnectDelayMs}ms (percobaan #${attempt})...`);
  } else {
    console.log("⚠️  Terputus. Sesi habis — tidak reconnect.");
  }
});

bot.on("unknownCommand", (ctx) => {
  // Hapus baris ini kalau tidak mau balas command yang tidak dikenal.
  ctx.reply(`❓ Command tidak ditemukan. Ketik ${bot.options.prefix}menu untuk daftar command.`);
});

bot.onError(async (error, ctx) => {
  console.error(`[error] command "${ctx.command}" gagal:`, error);
  await ctx.reply("⚠️ Terjadi kesalahan saat menjalankan command ini.");
});

await bot.start();