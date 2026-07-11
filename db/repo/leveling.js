/**
 * db/repo/leveling.js
 * -------------------
 * Kurva XP dan logika naik level. Rumus disimpan di SATU tempat ini
 * supaya gampang di-tuning tanpa nyari-nyari di banyak plugin.
 */

/** XP yang dibutuhkan untuk naik dari `level` ke `level + 1`. */
export function xpToNextLevel(level) {
  // Kurva kuadratik ringan — naik level awal cepat, makin lama makin berat.
  return Math.floor(50 * level * level + 100 * level + 100);
}

export function getLeveling(db, userId) {
  return db.prepare(`SELECT * FROM leveling WHERE user_id = ?`).get(userId);
}

/**
 * Tambah XP ke user, otomatis naik level (bisa multi-level sekaligus
 * kalau XP-nya besar) dan menambah skill_points per level.
 *
 * @returns {{ leveledUp: boolean, levelsGained: number, before: object, after: object }}
 */
export function addXp(db, userId, amount, { skillPointsPerLevel = 3 } = {}) {
  const apply = db.transaction(() => {
    const before = getLeveling(db, userId);
    let { level, xp, total_xp: totalXp, skill_points: skillPoints } = before;

    xp += amount;
    totalXp += amount;

    let levelsGained = 0;
    let need = xpToNextLevel(level);
    while (xp >= need) {
      xp -= need;
      level += 1;
      levelsGained += 1;
      skillPoints += skillPointsPerLevel;
      need = xpToNextLevel(level);
    }

    db.prepare(
      `UPDATE leveling
          SET level = ?, xp = ?, total_xp = ?, skill_points = ?, updated_at = strftime('%s','now')
        WHERE user_id = ?`
    ).run(level, xp, totalXp, skillPoints, userId);

    const after = getLeveling(db, userId);
    return { leveledUp: levelsGained > 0, levelsGained, before, after };
  });

  return apply();
}

export function getLevelLeaderboard(db, limit = 10) {
  return db
    .prepare(
      `SELECT u.display_name, u.push_name, u.jid, l.level, l.total_xp
         FROM leveling l JOIN users u ON u.id = l.user_id
        ORDER BY l.total_xp DESC
        LIMIT ?`
    )
    .all(limit);
}

export function getWealthLeaderboard(db, limit = 10) {
  return db
    .prepare(
      `SELECT u.display_name, u.push_name, u.jid, (w.cash + w.bank) AS net_worth
         FROM wallets w JOIN users u ON u.id = w.user_id
        ORDER BY net_worth DESC
        LIMIT ?`
    )
    .all(limit);
}
