import { listClasses, chooseClass, getClass } from "../../db/repo/classes.js";

/**
 * Kirim daftar class sebagai tombol interaktif (native quick-reply WA),
 * bukan cuma teks. Tap tombol otomatis jalanin `!class <kode>` lewat
 * `ctx.buttonReply.id` (lihat parseNativeFlowCommand di botify-wa) — user
 * tidak perlu ngetik manual.
 *
 * WhatsApp cuma render maksimal 3 quick-reply button dalam satu pesan.
 * Kalau suatu saat class nambah jadi >3, otomatis fallback ke list-menu
 * (masih tap-to-pick, cuma UI-nya beda) supaya tidak ada class yang
 * "hilang" dari pilihan.
 *
 * @param {import('botify-wa').Context} ctx
 * @param {import('better-sqlite3').Database} db
 * @param {string} [note] baris pembuka custom (mis. dipanggil dari !profile)
 */
export async function sendClassPicker(ctx, db, note = "⚔️ *Pilih class kamu dulu, petualang!*") {
  const classes = listClasses(db);
  const prefix = ctx.botConfig?.prefix ?? "!";

  if (classes.length <= 3) {
    await ctx.sendButtons(
      {
        title: `${note}\n\n${classes.map((c) => `• *${c.name}* — ${c.description}`).join("\n")}`,
        footer: "Cuma bisa dipilih sekali, pilih yang mantap 💪",
      },
      classes.map((c) => ({ type: "reply", text: c.name, id: `${prefix}class ${c.code}` }))
    );
    return;
  }

  await ctx.sendListMenu(
    { title: note, footer: "Cuma bisa dipilih sekali", buttonText: "Pilih Class" },
    [
      {
        title: "Class RPG",
        rows: classes.map((c) => ({
          title: c.name,
          id: `${prefix}class ${c.code}`,
          description: c.description,
        })),
      },
    ]
  );
}

export default function (bot) {
  bot.command(
    "classes",
    async (ctx) => {
      await sendClassPicker(ctx, bot.db, "⚔️ *Pilihan Class*");
    },
    { category: "RPG", description: "Lihat daftar class RPG yang bisa dipilih" }
  );

  bot.command(
    "class",
    async (ctx) => {
      const code = (ctx.args[0] || "").toLowerCase();
      if (!code) return ctx.reply("Pakai: !class <kode>\nKetik !classes untuk lihat daftar.");

      try {
        const character = chooseClass(bot.db, ctx.dbUser.id, code);
        const cls = getClass(bot.db, code);
        await ctx.reply(
          `✅ Kamu sekarang seorang *${cls.name}*!\n\n` +
            `❤️ HP: ${character.hp}/${character.max_hp}  🔷 MP: ${character.mp}/${character.max_mp}\n` +
            `⚔️ Attack: ${character.attack}  🛡️ Defense: ${character.defense}  💨 Speed: ${character.speed}`
        );
      } catch (e) {
        await ctx.reply(`❌ ${e.message}`);
      }
    },
    { category: "RPG", description: "Pilih class RPG (!class <kode>)" }
  );
}