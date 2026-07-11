/**
 * db/repo/cooldowns.js
 * --------------------
 * Cooldown yang PERSISTEN (tersimpan di DB, bertahan walau bot restart)
 * — beda dari cooldown bawaan Botify (`opts.cooldown` di bot.command())
 * yang cuma hidup di memori proses. Dipakai untuk aksi ekonomi berjangka
 * panjang seperti `!daily` (24 jam) dan `!work` (1 jam).
 */

/** @returns {number} sisa detik cooldown, 0 kalau sudah boleh dipakai lagi */
export function getRemainingCooldown(db, userId, actionKey) {
  const row = db
    .prepare(`SELECT expires_at FROM cooldowns WHERE user_id = ? AND action_key = ?`)
    .get(userId, actionKey);

  if (!row) return 0;
  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, row.expires_at - now);
}

export function setCooldown(db, userId, actionKey, durationSeconds) {
  const expiresAt = Math.floor(Date.now() / 1000) + durationSeconds;
  db.prepare(
    `INSERT INTO cooldowns (user_id, action_key, expires_at) VALUES (?, ?, ?)
     ON CONFLICT (user_id, action_key) DO UPDATE SET expires_at = excluded.expires_at`
  ).run(userId, actionKey, expiresAt);
  return expiresAt;
}

export function clearCooldown(db, userId, actionKey) {
  db.prepare(`DELETE FROM cooldowns WHERE user_id = ? AND action_key = ?`).run(userId, actionKey);
}

/** Format detik jadi "1j 20m 5d" untuk ditampilkan ke user. */
export function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  const parts = [];
  if (h) parts.push(`${h}j`);
  if (m) parts.push(`${m}m`);
  if (s || parts.length === 0) parts.push(`${s}d`);
  return parts.join(" ");
}
