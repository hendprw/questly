import { addCash } from "../../db/repo/economy.js";
import { addXp } from "../../db/repo/leveling.js";
import { getRemainingCooldown, setCooldown, formatDuration } from "../../db/repo/cooldowns.js";
import { money } from "../../lib/format.js";

const ACTION_KEY = "work";

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function (bot) {
  bot.command(
    "jobs",
    async (ctx) => {
      const jobs = bot.db.prepare(`SELECT * FROM jobs ORDER BY min_level ASC`).all();
      const lines = jobs.map(
        (j) => `• *${j.name}* (min level ${j.min_level}) — ${money(j.base_pay_min)}-${money(j.base_pay_max)} / kerja`
      );
      await ctx.reply(`💼 *Daftar Pekerjaan*\n\n${lines.join("\n")}\n\nKetik !hire <nama_job> untuk melamar.`);
    },
    { category: "Ekonomi", description: "Lihat daftar pekerjaan yang tersedia" }
  );

  bot.command(
    "hire",
    async (ctx) => {
      const db = bot.db;
      const jobCode = (ctx.args[0] || "").toLowerCase();
      const job = db.prepare(`SELECT * FROM jobs WHERE code = ?`).get(jobCode);
      if (!job) return ctx.reply(`Job tidak ditemukan. Ketik !jobs untuk lihat daftar (pakai kode job, mis. "farmer").`);

      const leveling = db.prepare(`SELECT level FROM leveling WHERE user_id = ?`).get(ctx.dbUser.id);
      if (leveling.level < job.min_level) {
        return ctx.reply(`❌ Butuh level ${job.min_level} untuk jadi ${job.name}. Level kamu: ${leveling.level}.`);
      }

      db.prepare(
        `INSERT INTO user_jobs (user_id, job_id, hired_at) VALUES (?, ?, strftime('%s','now'))
         ON CONFLICT (user_id) DO UPDATE SET job_id = excluded.job_id, job_level = 1, job_xp = 0, hired_at = excluded.hired_at`
      ).run(ctx.dbUser.id, job.id);

      await ctx.reply(`✅ Kamu sekarang bekerja sebagai *${job.name}*. Ketik !work untuk mulai kerja.`);
    },
    { category: "Ekonomi", description: "Melamar pekerjaan (!hire <kode_job>)" }
  );

  bot.command(
    "work",
    async (ctx) => {
      const db = bot.db;
      const userId = ctx.dbUser.id;

      const userJob = db
        .prepare(
          `SELECT uj.*, j.name, j.base_pay_min, j.base_pay_max, j.base_xp, j.cooldown_seconds
             FROM user_jobs uj JOIN jobs j ON j.id = uj.job_id
            WHERE uj.user_id = ?`
        )
        .get(userId);

      if (!userJob) return ctx.reply(`Kamu belum punya pekerjaan. Ketik !jobs lalu !hire <kode_job>.`);

      const remaining = getRemainingCooldown(db, userId, ACTION_KEY);
      if (remaining > 0) {
        return ctx.reply(`⏳ Kamu masih capek. Kerja lagi dalam ${formatDuration(remaining)}.`);
      }

      const pay = randomInt(userJob.base_pay_min, userJob.base_pay_max);
      addCash(db, userId, pay, { type: "work", note: userJob.name });
      const leveled = addXp(db, userId, userJob.base_xp);

      db.prepare(
        `UPDATE user_jobs SET job_xp = job_xp + ?, last_work_at = strftime('%s','now') WHERE user_id = ?`
      ).run(userJob.base_xp, userId);

      setCooldown(db, userId, ACTION_KEY, userJob.cooldown_seconds);

      let text = `🔨 Kamu bekerja sebagai *${userJob.name}* dan mendapat ${money(pay)} + ${userJob.base_xp} XP.`;
      if (leveled.leveledUp) text += `\n\n🎉 Level up! Sekarang level ${leveled.after.level}.`;

      await ctx.reply(text);
    },
    { category: "Ekonomi", description: "Kerja sesuai job kamu untuk dapat cash & XP" }
  );
}