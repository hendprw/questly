/**
 * db/repo/stamina.js
 */

/**
 * Mendapatkan dan me-regenerate stamina karakter berdasarkan waktu terakhir.
 * @param {import('better-sqlite3').Database} db
 * @param {number} userId
 * @returns {object} { stamina, max_stamina }
 */
export function getAndRegenerateStamina(db, userId) {
  const char = db.prepare(`SELECT stamina, max_stamina, last_stamina_regen FROM characters WHERE user_id = ?`).get(userId);
  if (!char) return null;

  const now = Math.floor(Date.now() / 1000);
  const timePassed = now - char.last_stamina_regen;
  const regenRateSeconds = 180; // 3 minutes per stamina

  if (char.stamina < char.max_stamina && timePassed >= regenRateSeconds) {
    const staminaToRegen = Math.floor(timePassed / regenRateSeconds);
    const newStamina = Math.min(char.max_stamina, char.stamina + staminaToRegen);
    const newLastRegen = char.last_stamina_regen + (staminaToRegen * regenRateSeconds);

    db.prepare(`UPDATE characters SET stamina = ?, last_stamina_regen = ? WHERE user_id = ?`).run(newStamina, newLastRegen, userId);
    return { stamina: newStamina, max_stamina: char.max_stamina };
  }

  // Update last_stamina_regen if at max stamina, so we don't accumulate time
  if (char.stamina >= char.max_stamina && timePassed > 0) {
      db.prepare(`UPDATE characters SET last_stamina_regen = ? WHERE user_id = ?`).run(now, userId);
  }

  return { stamina: char.stamina, max_stamina: char.max_stamina };
}

/**
 * Mengonsumsi stamina jika mencukupi.
 * @param {import('better-sqlite3').Database} db
 * @param {number} userId
 * @param {number} amount
 * @returns {boolean} True jika berhasil, false jika tidak cukup.
 */
export function consumeStamina(db, userId, amount) {
  const currentStamina = getAndRegenerateStamina(db, userId);
  if (!currentStamina || currentStamina.stamina < amount) return false;

  db.prepare(`UPDATE characters SET stamina = stamina - ? WHERE user_id = ?`).run(amount, userId);
  
  // If stamina was max before, we need to set last_stamina_regen to NOW
  // to start the timer for regeneration correctly.
  if (currentStamina.stamina === currentStamina.max_stamina) {
    const now = Math.floor(Date.now() / 1000);
    db.prepare(`UPDATE characters SET last_stamina_regen = ? WHERE user_id = ?`).run(now, userId);
  }

  return true;
}
