/**
 * db/repo/users.js
 * ----------------
 * Semua akses ke tabel `users` + bootstrap baris terkait (wallet,
 * leveling, character) yang WAJIB ada begitu user baru terdaftar,
 * supaya kode lain (economy.js, leveling.js, dst) tidak perlu cek
 * "row-nya ada belum" berulang-ulang.
 */

/**
 * Ambil user berdasarkan JID Botify (ctx.sender). Kalau belum ada,
 * dibuatkan sekaligus wallet + leveling + character row-nya dalam satu
 * transaction (jadi tidak mungkin ada user "yatim" tanpa wallet).
 *
 * @param {import('better-sqlite3').Database} db
 * @param {{ sender: string, senderNumber?: string, pushName?: string }} ctx
 * @returns {object} row dari tabel users
 */
export function getOrCreateUser(db, ctx) {
  const existing = db
    .prepare(`SELECT * FROM users WHERE jid = ?`)
    .get(ctx.sender);

  if (existing) {
    // Sinkronkan push_name/phone_number kalau berubah, & catat last_seen.
    db.prepare(
      `UPDATE users
         SET push_name = ?, phone_number = COALESCE(?, phone_number), last_seen_at = strftime('%s','now')
       WHERE id = ?`
    ).run(ctx.pushName ?? existing.push_name, ctx.senderNumber ?? null, existing.id);
    return db.prepare(`SELECT * FROM users WHERE id = ?`).get(existing.id);
  }

  const createUser = db.transaction(() => {
    const info = db
      .prepare(
        `INSERT INTO users (jid, phone_number, push_name, display_name, last_seen_at)
         VALUES (?, ?, ?, ?, strftime('%s','now'))`
      )
      .run(ctx.sender, ctx.senderNumber ?? null, ctx.pushName ?? null, ctx.pushName ?? null);

    const userId = info.lastInsertRowid;

    db.prepare(`INSERT INTO wallets (user_id) VALUES (?)`).run(userId);
    db.prepare(`INSERT INTO leveling (user_id) VALUES (?)`).run(userId);
    db.prepare(`INSERT INTO characters (user_id) VALUES (?)`).run(userId);

    // Stat dasar dimulai dari sini — nambah stat baru cukup INSERT baris
    // baru di user_stats, tidak perlu balik lagi ke fungsi ini.
    const seedStats = db.prepare(
      `INSERT INTO user_stats (user_id, stat_key, value) VALUES (?, ?, ?)`
    );
    for (const [key, value] of Object.entries({
      strength: 5,
      intelligence: 5,
      luck: 5,
      stamina: 5,
      charisma: 5,
    })) {
      seedStats.run(userId, key, value);
    }

    return userId;
  });

  const userId = createUser();
  return db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId);
}

/** Cari user lain by nomor telepon (mis. untuk target `!give`). */
export function findUserByNumber(db, phoneNumber) {
  return db.prepare(`SELECT * FROM users WHERE phone_number = ?`).get(phoneNumber);
}

export function findUserByJid(db, jid) {
  return db.prepare(`SELECT * FROM users WHERE jid = ?`).get(jid);
}

export function setBanStatus(db, userId, { status, reason = null, until = null }) {
  db.prepare(
    `UPDATE users SET status = ?, ban_reason = ?, banned_until = ? WHERE id = ?`
  ).run(status, reason, until, userId);
}

/** Ambil "profil lengkap" dalam satu panggilan — gabungan beberapa tabel. */
export function getFullProfile(db, userId) {
  const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId);
  if (!user) return null;

  const wallet = db.prepare(`SELECT * FROM wallets WHERE user_id = ?`).get(userId);
  const leveling = db.prepare(`SELECT * FROM leveling WHERE user_id = ?`).get(userId);
  const character = db.prepare(`SELECT * FROM characters WHERE user_id = ?`).get(userId);
  const stats = db
    .prepare(`SELECT stat_key, value FROM user_stats WHERE user_id = ?`)
    .all(userId);
  const job = db
    .prepare(
      `SELECT uj.job_level, uj.job_xp, j.name AS job_name
         FROM user_jobs uj JOIN jobs j ON j.id = uj.job_id
        WHERE uj.user_id = ?`
    )
    .get(userId);

  return {
    user,
    wallet,
    leveling,
    character,
    job: job ?? null,
    stats: Object.fromEntries(stats.map((s) => [s.stat_key, s.value])),
  };
}
