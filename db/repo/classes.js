/**
 * db/repo/classes.js
 * ------------------
 * Class RPG (porting "job" dari Orion — Pejuang/Penyihir/Pemanah).
 * Beda dari `db/repo/jobs` (kalau ada) yang urusannya pekerjaan ekonomi.
 */

export function listClasses(db) {
  return db.prepare(`SELECT * FROM classes ORDER BY code`).all();
}

export function getClass(db, code) {
  const row = db.prepare(`SELECT * FROM classes WHERE code = ?`).get(code);
  if (!row) return null;
  return {
    ...row,
    base_bonus: JSON.parse(row.base_bonus),
    stat_growth: JSON.parse(row.stat_growth),
    skill_tree: JSON.parse(row.skill_tree),
  };
}

/**
 * Pilih class pertama kali. Menolak kalau user sudah punya class
 * (ganti class itu keputusan besar — sediakan command `!classreset`
 * terpisah nanti kalau mau diizinkan, jangan diam-diam di sini).
 */
export function chooseClass(db, userId, classCode) {
  const cls = getClass(db, classCode);
  if (!cls) throw new Error(`Class tidak ditemukan: ${classCode}`);

  const apply = db.transaction(() => {
    const character = db.prepare(`SELECT * FROM characters WHERE user_id = ?`).get(userId);
    if (character.class) {
      throw new Error(`Kamu sudah menjadi ${character.class}. Belum ada cara ganti class untuk saat ini.`);
    }

    const b = cls.base_bonus;
    db.prepare(
      `UPDATE characters
          SET class = ?,
              max_hp = max_hp + ?, hp = hp + ?,
              max_mp = max_mp + ?, mp = mp + ?,
              attack = attack + ?, defense = defense + ?, speed = speed + ?
        WHERE user_id = ?`
    ).run(
      cls.code,
      b.max_hp || 0, b.max_hp || 0,
      b.max_mana || 0, b.max_mana || 0,
      b.attack || 0, b.defense || 0, b.speed || 0,
      userId
    );

    return db.prepare(`SELECT * FROM characters WHERE user_id = ?`).get(userId);
  });

  return apply();
}